/**
 * Siri locked-device creation, stage 1 (docs/plans/siri-locked-device.md): the specification of what the Siri intent
 * does to the scheduled notifications when it adds one reminder without the app. The native intent ports this line by
 * line; the tests prove it gives exactly what buildScheduledNotifications gives with the reminder included.
 *
 * Badge rule (computeBadgeCount): a scheduled, not completed or deleted reminder counts from one moment onwards:
 * - include today on: the start of its due day (it is "today", then overdue)
 * - timed: one millisecond after its due time (isOverdue is strict)
 * - date-only: the start of the next day
 * So the count at any time is the number of reminders whose start moment has passed. The app publishes those moments
 * (the badge timeline); the intent never needs the reminders themselves.
 */

import type { Reminder } from '../reminder-utils';
import { buildScheduledNotifications, MIDNIGHT_BADGE_FIRST_ID, notificationIdForReminder, type ScheduledNotificationPayload } from '../notifications';

export type SiriNotificationPrefs = { alerts: boolean; sound: boolean; badge: boolean; includeToday: boolean };

const MAX_SCHEDULED_NOTIFICATIONS = 64;

function startOfDay(date: string, plusDays = 0): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d + plusDays).getTime();
}

/** The moment (ms) from which the reminder counts towards the badge, or null when it never counts. */
export function badgeCountsFrom(reminder: Reminder, includeToday: boolean): number | null {
  if (reminder.completedAt || reminder.deletedAt || reminder.schedule.kind !== 'scheduled') return null;
  const { date, time } = reminder.schedule;
  if (includeToday) return startOfDay(date);
  if (time) {
    const [hh, mm] = time.split(':').map(Number);
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime() + 1;
  }
  return startOfDay(date, 1);
}

/** Every reminder's start moment, sorted. Published by the app; read by the intent. */
export function buildBadgeTimeline(reminders: Reminder[], includeToday: boolean): number[] {
  return reminders
    .map((reminder) => badgeCountsFrom(reminder, includeToday))
    .filter((from): from is number => from != null)
    .sort((a, b) => a - b);
}

/** The badge count at a moment: the number of start moments that have passed. */
export function badgeCountAt(timeline: number[], at: number): number {
  let count = 0;
  for (const from of timeline) {
    if (from > at) break;
    count++;
  }
  return count;
}

const isMidnight = (notification: ScheduledNotificationPayload) => notification.id >= MIDNIGHT_BADGE_FIRST_ID;

/**
 * Adds one new reminder to the scheduled notifications and the badge timeline, as the intent will:
 * 1. every notification firing once the reminder counts gains one on its badge (badge on)
 * 2. the reminder's own notification, if it has a future time, built as the app builds it, with the badge at its time
 * 3. the 64 notification limit applied as the app applies it: reminder notifications first (earliest), midnight badge
 *    notifications in the slots left, the latest dropped first
 * Also returns the app icon badge for now.
 */
export function addReminderToScheduled(
  scheduled: ScheduledNotificationPayload[],
  timeline: number[],
  reminder: Reminder,
  prefs: SiriNotificationPrefs,
  now: number,
): { scheduled: ScheduledNotificationPayload[]; timeline: number[]; badgeNow: number } {
  const from = badgeCountsFrom(reminder, prefs.includeToday);
  const nextTimeline = from == null ? timeline : [...timeline, from].sort((a, b) => a - b);
  const badgeNow = prefs.badge ? badgeCountAt(nextTimeline, now) : 0;
  if (!prefs.alerts && !prefs.badge) return { scheduled, timeline: nextTimeline, badgeNow };

  // 1. Badges on notifications that fire once the reminder counts (each badge is the count just after it fires)
  const adjusted = scheduled.map((notification) => {
    if (!prefs.badge || from == null || notification.schedule.at.getTime() + 1 < from) return notification;
    const badge = notification.badge + 1;
    const extra = notification.extra.reminderId
      ? { ...notification.extra, badgeDeltaOnAction: badge > 0 ? 1 : 0 }
      : notification.extra;
    return { ...notification, badge, extra };
  });

  // 2. The reminder's own notification, shaped exactly as the app shapes it
  const ownId = notificationIdForReminder(reminder.id);
  const own = buildScheduledNotifications([reminder], prefs.badge, prefs.includeToday, prefs.alerts, prefs.sound)
    .find((notification) => notification.id === ownId);
  if (own) {
    const badge = prefs.badge ? badgeCountAt(nextTimeline, own.schedule.at.getTime() + 1) : 0;
    own.badge = badge;
    if (own.extra.reminderId) own.extra = { ...own.extra, badgeDeltaOnAction: badge > 0 ? 1 : 0 };
  }

  // 3. The 64 limit. The new reminder is last in the app's list, so at equal times it sorts after existing ones.
  const reminderNotifications = adjusted.filter((notification) => !isMidnight(notification));
  if (own) reminderNotifications.push(own);
  reminderNotifications.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
  const kept = reminderNotifications.slice(0, MAX_SCHEDULED_NOTIFICATIONS);
  const midnights = adjusted.filter(isMidnight).slice(0, Math.max(0, MAX_SCHEDULED_NOTIFICATIONS - kept.length));

  return { scheduled: [...kept, ...midnights], timeline: nextTimeline, badgeNow };
}
