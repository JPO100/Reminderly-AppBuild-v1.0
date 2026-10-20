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
    sound?: string;
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
    sound?: string;
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
        sound: notification.sound ?? "",
    });
}

const MAX_SCHEDULED_NOTIFICATIONS = 64;
const MIDNIGHT_BADGE_DAYS = 7;
// Ids 2147483641-2147483647 are the midnight badge notifications. Reminder ids are hashed below this.
export const MIDNIGHT_BADGE_FIRST_ID = 2147483641;

// Silent badge-only notifications at the next 7 local midnights, so the badge follows day changes
// while the app is suspended. Badge counts never fall as time passes, so a midnight whose count is 0
// changes nothing and is skipped.
function buildMidnightBadgeNotifications(
    reminders: Reminder[],
    notifIncludeTodayInBadge: boolean,
): ScheduledNotificationPayload[] {
    const notifications: ScheduledNotificationPayload[] = [];
    for (let day = 1; day <= MIDNIGHT_BADGE_DAYS; day++) {
        const midnight = new Date();
        midnight.setDate(midnight.getDate() + day);
        midnight.setHours(0, 0, 0, 0);

        const badge = computeBadgeCount(reminders, notifIncludeTodayInBadge, new Date(midnight.getTime() + 1));
        if (badge === 0) continue;

        notifications.push({
            id: MIDNIGHT_BADGE_FIRST_ID + day - 1,
            title: "",
            body: "",
            schedule: { at: midnight },
            extra: { reminderId: "", badgeDeltaOnAction: 0 },
            actionTypeId: "",
            silent: true,
            badge,
        });
    }
    return notifications;
}

// Alerts and badge are independent (docs/settings-flags-spec.md 7.4). Alerts off with badge on
// schedules silent badge-only notifications (no title, body, sound or actions), using the same
// selection and limit as alerts. Sound applies to alerts only; "default" plays the iOS default sound.
export function buildScheduledNotifications(
    reminders: Reminder[],
    notifAppBadge: boolean,
    notifIncludeTodayInBadge: boolean,
    notifAlerts = true,
    notifSound = false,
): ScheduledNotificationPayload[] {
    if (!notifAlerts && !notifAppBadge) return [];

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
                (acc, char) => ((acc * 31) + char.charCodeAt(0)) % MIDNIGHT_BADGE_FIRST_ID,
                1
            );

            const badge = notifAppBadge
                ? computeBadgeCount(reminders, notifIncludeTodayInBadge, new Date(at.getTime() + 1))
                : 0;

            const badgeDeltaOnAction = badge > 0 ? 1 : 0;

            if (!notifAlerts) {
                return {
                    id: notificationId,
                    title: "",
                    body: "",
                    schedule: { at },
                    extra: { reminderId: "", badgeDeltaOnAction: 0 },
                    actionTypeId: "",
                    silent: true,
                    badge,
                };
            }

            return {
                id: notificationId,
                title: "Reminderly",
                body: reminder.displayText,
                schedule: { at },
                extra: { reminderId: reminder.id, badgeDeltaOnAction },
                actionTypeId: "reminder-actions",
                badge,
                ...(notifSound ? { sound: "default" } : {}),
            };
        });

    // Reminder notifications take the 64 iOS slots first; midnight badge notifications only use what is left
    notifications.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
    const result = notifications.slice(0, MAX_SCHEDULED_NOTIFICATIONS);

    if (notifAppBadge) {
        const freeSlots = MAX_SCHEDULED_NOTIFICATIONS - result.length;
        result.push(...buildMidnightBadgeNotifications(reminders, notifIncludeTodayInBadge).slice(0, freeSlots));
    }

    return result;
}

export async function syncReminderNotifications(
    reminders: Reminder[],
    notifAppBadge: boolean,
    notifIncludeTodayInBadge: boolean,
    notifAlerts: boolean,
    notifSound: boolean,
) {
    // Never prompts. Permission is asked for by the in-app ask (spec 7.3). Without permission nothing
    // new is scheduled and pending notifications are left as they are.
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") return;

    const notifications = buildScheduledNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge, notifAlerts, notifSound);
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
