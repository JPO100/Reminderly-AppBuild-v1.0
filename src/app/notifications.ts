import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "./reminder-utils";
import { computeBadgeCount } from "./reminder-utils";

export const PENDING_NOTIFICATION_REMINDER_ID_KEY = "reminderly.pendingNotificationReminderId";
export const PENDING_NOTIFICATION_ACTION_KEY = "reminderly.pendingNotificationAction";
export const NOTIFICATION_TAP_EVENT = "reminderly:notification-tap";

type ScheduledNotificationPayload = {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
    extra: { reminderId: string; badgeDeltaOnAction: number };
    actionTypeId: string;
    badge: number;
    silent?: boolean;
};

export async function registerNotificationActionTypes() {
    try {
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: "reminder-actions",
                    actions: [
                        { id: "mark-done", title: "Mark as done" },
                        { id: "move-tomorrow", title: "Move to tomorrow" },
                    ],
                },
            ],
        });
    } catch {
        // Not available on web
    }
}

function toNotificationAtIso(value: unknown): string | null {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
}

function getNotificationSignature(notification: {
    id?: number;
    title?: string;
    body?: string;
    schedule?: { at?: unknown };
    extra?: { reminderId?: unknown; badgeDeltaOnAction?: unknown };
    actionTypeId?: string;
    badge?: number;
}): string {
    return JSON.stringify({
        id: notification.id ?? null,
        title: notification.title ?? "",
        body: notification.body ?? "",
        at: toNotificationAtIso(notification.schedule?.at) ?? null,
        reminderId: typeof notification.extra?.reminderId === "string" ? notification.extra.reminderId : null,
        badgeDeltaOnAction: typeof notification.extra?.badgeDeltaOnAction === "number" ? notification.extra.badgeDeltaOnAction : 0,
        actionTypeId: notification.actionTypeId ?? "",
        badge: notification.badge ?? 0,
    });
}

const MAX_SCHEDULED_NOTIFICATIONS = 64;
const MIDNIGHT_BADGE_NOTIFICATION_ID = 2147483647;

function hasActiveDateOnlyReminder(reminders: Reminder[]): boolean {
    return reminders.some((r) =>
        r.completedAt == null &&
        r.deletedAt == null &&
        r.schedule.kind === "scheduled" &&
        !r.schedule.time
    );
}

function buildMidnightBadgeNotification(
    reminders: Reminder[],
    notifAppBadge: boolean,
    notifIncludeTodayInBadge: boolean,
): ScheduledNotificationPayload | null {
    if (!notifAppBadge) return null;
    if (!hasActiveDateOnlyReminder(reminders)) return null;

    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    const badge = computeBadgeCount(reminders, notifIncludeTodayInBadge, new Date(midnight.getTime() + 1));

    return {
        id: MIDNIGHT_BADGE_NOTIFICATION_ID,
        title: "",
        body: "",
        schedule: { at: midnight },
        extra: { reminderId: "", badgeDeltaOnAction: 0 },
        actionTypeId: "",
        silent: true,
        badge,
    };
}

export function buildScheduledNotifications(
    reminders: Reminder[],
    notifAppBadge: boolean,
    notifIncludeTodayInBadge: boolean,
): ScheduledNotificationPayload[] {
    const midnightNotification = buildMidnightBadgeNotification(reminders, notifAppBadge, notifIncludeTodayInBadge);
    const reservedSlots = midnightNotification ? 1 : 0;

    const notifications = reminders
        .filter((reminder) => {
            if (reminder.completedAt != null) return false;
            if (reminder.deletedAt != null) return false;
            if (reminder.schedule.kind !== "scheduled") return false;
            if (!reminder.schedule.time) return false;

            const [year, month, day] = reminder.schedule.date.split("-").map(Number);
            const [hour, minute] = reminder.schedule.time.split(":").map(Number);
            const at = new Date(year, month - 1, day, hour, minute, 0, 0);

            return at.getTime() > Date.now();
        })
        .map((reminder) => {
            const [year, month, day] = reminder.schedule.date.split("-").map(Number);
            const [hour, minute] = reminder.schedule.time!.split(":").map(Number);
            const at = new Date(year, month - 1, day, hour, minute, 0, 0);

            const notificationId = Array.from(reminder.id).reduce(
                (acc, char) => ((acc * 31) + char.charCodeAt(0)) % 2147483647,
                1
            );

            const badge = notifAppBadge
                ? computeBadgeCount(reminders, notifIncludeTodayInBadge, new Date(at.getTime() + 1))
                : 0;

            const badgeDeltaOnAction = badge > 0 ? 1 : 0;

            return {
                id: notificationId,
                title: "Reminderly",
                body: reminder.displayText,
                schedule: { at },
                extra: { reminderId: reminder.id, badgeDeltaOnAction },
                actionTypeId: "reminder-actions",
                badge,
            };
        });

    notifications.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
    const result = notifications.slice(0, MAX_SCHEDULED_NOTIFICATIONS - reservedSlots);

    if (midnightNotification) {
        result.push(midnightNotification);
    }

    return result;
}

export async function syncReminderNotifications(
    reminders: Reminder[],
    notifAppBadge: boolean,
    notifIncludeTodayInBadge: boolean,
) {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") return;

    const notifications = buildScheduledNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge);
    const pending = await LocalNotifications.getPending();

    const pendingSignatures = pending.notifications
        .map((notification) => getNotificationSignature(notification))
        .sort();
    const desiredSignatures = notifications
        .map((notification) => getNotificationSignature(notification))
        .sort();

    if (
        pendingSignatures.length === desiredSignatures.length &&
        pendingSignatures.every((signature, index) => signature === desiredSignatures[index])
    ) {
        return;
    }

    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
            notifications: pending.notifications.map((notification) => ({
                id: notification.id,
            })),
        });
    }

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
}

/**
 * Reminders off: cancels every pending Reminderly notification, then removes every delivered one
 * from Notification Centre, by identifier. Pending and delivered lists are read from iOS each time,
 * which only returns this app's notifications. Needs no notification permission. Returns the counts.
 */
export async function clearReminderNotifications(): Promise<{ pending: number; delivered: number }> {
    try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({
                notifications: pending.notifications.map((notification) => ({ id: notification.id })),
            });
        }
        const delivered = await LocalNotifications.getDeliveredNotifications();
        if (delivered.notifications.length > 0) {
            await LocalNotifications.removeDeliveredNotifications({ notifications: delivered.notifications });
        }
        console.info(`Reminders off: cancelled ${pending.notifications.length} pending, removed ${delivered.notifications.length} delivered notifications`);
        return { pending: pending.notifications.length, delivered: delivered.notifications.length };
    } catch (error) {
        console.error('Failed to clear reminder notifications:', error);
        return { pending: 0, delivered: 0 };
    }
}
