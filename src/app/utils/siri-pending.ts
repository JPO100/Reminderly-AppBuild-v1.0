/**
 * Siri locked-device creation, stage 2 (docs/plans/siri-locked-device.md).
 * - The Siri context: what the intent needs to create a reminder and its notification without the app, published to
 *   the App Group on every change. Alerts and badge are the effective values (off when Reminders or Notifications is
 *   off, as the app then schedules nothing).
 * - The import plan for reminders the intent saved to the App Group pending list: added by id only, never twice, and
 *   removed from the list only once saved.
 */

import type { Reminder } from '../reminder-utils';
import { buildBadgeTimeline, type SiriNotificationPrefs } from './siri-badge';

export type SiriContext = SiriNotificationPrefs & { repeatsActive: boolean; badgeTimeline: number[] };

export function buildSiriContext(
  reminders: Reminder[],
  notificationsActive: boolean,
  prefs: SiriNotificationPrefs,
  repeatsActive: boolean,
): SiriContext {
  const alerts = notificationsActive && prefs.alerts;
  const badge = notificationsActive && prefs.badge;
  return {
    alerts,
    sound: prefs.sound,
    badge,
    includeToday: prefs.includeToday,
    repeatsActive,
    badgeTimeline: badge ? buildBadgeTimeline(reminders, prefs.includeToday) : [],
  };
}

function isSchedule(value: unknown): value is Reminder['schedule'] {
  if (!value || typeof value !== 'object') return false;
  const schedule = value as Record<string, unknown>;
  if (schedule.kind === 'sometime') return true;
  return schedule.kind === 'scheduled'
    && typeof schedule.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(schedule.date)
    && (schedule.time === undefined || (typeof schedule.time === 'string' && /^\d{2}:\d{2}$/.test(schedule.time)));
}

/** A complete reminder as buildSiriReminder plus an id and createdAt produce it. */
export function isSiriReminder(value: unknown): value is Reminder {
  if (!value || typeof value !== 'object') return false;
  const reminder = value as Record<string, unknown>;
  return typeof reminder.id === 'string' && reminder.id.length > 0
    && typeof reminder.originalText === 'string'
    && typeof reminder.displayText === 'string'
    && typeof reminder.createdAt === 'number'
    && isSchedule(reminder.schedule)
    && (reminder.repeatRule === undefined || reminder.repeatRule === null || typeof reminder.repeatRule === 'object');
}

/**
 * Pending entries (JSON strings) against the ids already saved: add each valid reminder not yet saved, once; remove
 * entries already saved (imported earlier, even if the app stopped before removing them) and malformed ones that
 * carry an id. Unreadable entries without an id are left for the intent, which never writes them.
 */
export function planSiriImport(pending: string[], savedIds: ReadonlySet<string>): { add: Reminder[]; remove: string[] } {
  const add: Reminder[] = [];
  const remove: string[] = [];
  const seen = new Set<string>();
  for (const entry of pending) {
    let parsed: unknown;
    try { parsed = JSON.parse(entry); } catch { continue; }
    const id = (parsed as { id?: unknown } | null)?.id;
    if (typeof id !== 'string' || id.length === 0) continue;
    if (savedIds.has(id)) { if (!remove.includes(id)) remove.push(id); continue; }
    if (!isSiriReminder(parsed)) { if (!remove.includes(id)) remove.push(id); continue; }
    if (seen.has(id)) continue;
    seen.add(id);
    add.push(parsed);
  }
  return { add, remove };
}
