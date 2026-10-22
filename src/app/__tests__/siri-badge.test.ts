import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Reminder } from '../reminder-utils';
import { computeBadgeCount } from '../reminder-utils';
import { buildScheduledNotifications, getNotificationSignature, type ScheduledNotificationPayload } from '../notifications';
import { addReminderToScheduled, badgeCountAt, buildBadgeTimeline, type SiriNotificationPrefs } from '../utils/siri-badge';

// Thursday 22 October 2026, 3:00pm local. The range below crosses the 25 October clock change.
const NOW = new Date(2026, 9, 22, 15, 0).getTime();

// Small seeded generator so every failure can be reproduced
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function randomReminder(random: () => number, index: number, futureTimedOnly = false): Reminder {
  const day = new Date(NOW);
  day.setDate(day.getDate() + Math.floor(random() * 30) - (futureTimedOnly ? 0 : 10));
  // Five-minute steps make equal times common, which tests the ordering at the 64 limit
  const minutes = Math.floor(random() * 288) * 5;
  const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const kind = futureTimedOnly ? 'timed' : (['timed', 'timed', 'dateOnly', 'sometime'] as const)[Math.floor(random() * 4)];
  const reminder: Reminder = {
    id: `r${index}-${Math.floor(random() * 1e9).toString(36)}`,
    originalText: `Reminder ${index}`,
    displayText: `Reminder ${index}`,
    createdAt: NOW - 1000,
    schedule: kind === 'sometime' ? { kind: 'sometime' } : { kind: 'scheduled', date: dateKey(day), ...(kind === 'timed' ? { time } : {}) },
  };
  if (!futureTimedOnly && random() < 0.1) reminder.completedAt = NOW - 500;
  if (!futureTimedOnly && random() < 0.05) reminder.deletedAt = NOW - 500;
  return reminder;
}

const signatures = (notifications: ScheduledNotificationPayload[]) => notifications.map(getNotificationSignature).sort();

function checkCase(reminders: Reminder[], added: Reminder, prefs: SiriNotificationPrefs) {
  const before = buildScheduledNotifications(reminders, prefs.badge, prefs.includeToday, prefs.alerts, prefs.sound);
  const expected = buildScheduledNotifications([...reminders, added], prefs.badge, prefs.includeToday, prefs.alerts, prefs.sound);
  const result = addReminderToScheduled(before, buildBadgeTimeline(reminders, prefs.includeToday), added, prefs, NOW);
  expect(signatures(result.scheduled)).toEqual(signatures(expected));
  expect(result.badgeNow).toBe(prefs.badge ? computeBadgeCount([...reminders, added], prefs.includeToday, new Date(NOW)) : 0);
  expect(result.timeline).toEqual(buildBadgeTimeline([...reminders, added], prefs.includeToday));
}

const allPrefs: SiriNotificationPrefs[] = [];
for (const alerts of [true, false]) for (const sound of [true, false]) for (const badge of [true, false]) for (const includeToday of [true, false]) {
  allPrefs.push({ alerts, sound, badge, includeToday });
}

describe('Siri badge timeline', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('gives the same count as computeBadgeCount at any moment', () => {
    const random = seeded(1);
    for (let run = 0; run < 100; run++) {
      const reminders = Array.from({ length: Math.floor(random() * 40) }, (_, i) => randomReminder(random, i));
      for (const includeToday of [true, false]) {
        const timeline = buildBadgeTimeline(reminders, includeToday);
        for (let probe = 0; probe < 10; probe++) {
          const at = NOW + Math.floor((random() - 0.4) * 30 * 86400000);
          expect(badgeCountAt(timeline, at)).toBe(computeBadgeCount(reminders, includeToday, new Date(at)));
        }
      }
    }
  });
});

describe('Siri adds one reminder: same notifications as the app builds', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('matches across random reminders and every notification setting', () => {
    const random = seeded(2);
    for (let run = 0; run < 120; run++) {
      const reminders = Array.from({ length: Math.floor(random() * 40) }, (_, i) => randomReminder(random, i));
      const added = randomReminder(random, 999);
      for (const prefs of allPrefs) checkCase(reminders, added, prefs);
    }
  }, 30000);

  it('matches at the 64 notification limit, with and without midnight badge notifications', () => {
    const random = seeded(3);
    for (let run = 0; run < 40; run++) {
      // 58 to 70 future timed reminders: the limit is reached, midnights are squeezed out or dropped
      const reminders = Array.from({ length: 58 + Math.floor(random() * 13) }, (_, i) => randomReminder(random, i, true));
      const added = randomReminder(random, 999, random() < 0.8);
      for (const prefs of allPrefs) checkCase(reminders, added, prefs);
    }
  }, 30000);

  it('matches for a date-only reminder across midnight, a reminder due now, and an empty list', () => {
    const today = dateKey(new Date(NOW));
    const tomorrow = dateKey(new Date(NOW + 86400000));
    const cases: Reminder[] = [
      { id: 'date-today', originalText: 'a', displayText: 'a', createdAt: NOW, schedule: { kind: 'scheduled', date: today } },
      { id: 'date-tomorrow', originalText: 'b', displayText: 'b', createdAt: NOW, schedule: { kind: 'scheduled', date: tomorrow } },
      { id: 'due-now', originalText: 'c', displayText: 'c', createdAt: NOW, schedule: { kind: 'scheduled', date: today, time: '15:00' } },
      { id: 'next-minute', originalText: 'd', displayText: 'd', createdAt: NOW, schedule: { kind: 'scheduled', date: today, time: '15:05' } },
      { id: 'sometime', originalText: 'e', displayText: 'e', createdAt: NOW, schedule: { kind: 'sometime' } },
    ];
    const random = seeded(4);
    const others = Array.from({ length: 12 }, (_, i) => randomReminder(random, i));
    for (const added of cases) for (const prefs of allPrefs) {
      checkCase([], added, prefs);
      checkCase(others, added, prefs);
    }
  });

  it('two Siri reminders added in a row match the app building both', () => {
    const random = seeded(5);
    for (let run = 0; run < 40; run++) {
      const reminders = Array.from({ length: Math.floor(random() * 30) }, (_, i) => randomReminder(random, i));
      const first = randomReminder(random, 900);
      const second = randomReminder(random, 901);
      for (const prefs of allPrefs) {
        const before = buildScheduledNotifications(reminders, prefs.badge, prefs.includeToday, prefs.alerts, prefs.sound);
        const step1 = addReminderToScheduled(before, buildBadgeTimeline(reminders, prefs.includeToday), first, prefs, NOW);
        const step2 = addReminderToScheduled(step1.scheduled, step1.timeline, second, prefs, NOW);
        const expected = buildScheduledNotifications([...reminders, first, second], prefs.badge, prefs.includeToday, prefs.alerts, prefs.sound);
        expect(signatures(step2.scheduled)).toEqual(signatures(expected));
      }
    }
  }, 30000);
});
