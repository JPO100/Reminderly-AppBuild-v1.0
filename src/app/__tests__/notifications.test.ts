import { describe, it, expect } from 'vitest';
import type { Reminder } from '../reminder-utils';
import { computeBadgeCount, getNextTimeRefreshBoundary } from '../reminder-utils';
import { buildScheduledNotifications } from '../notifications';
import { getNotificationChecks } from '../dev/notification-checks';

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'test-1',
    originalText: 'Test reminder',
    displayText: 'Test reminder',
    createdAt: Date.now(),
    schedule: { kind: 'scheduled', date: '2026-06-01', time: '10:00' },
    ...overrides,
  };
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('computeBadgeCount', () => {
  it('counts overdue reminders', () => {
    const now = new Date();
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' } }),
    ];
    expect(computeBadgeCount(reminders, false, now)).toBe(1);
  });

  it('includes today reminders when includeTodayInBadge is true', () => {
    const now = new Date();
    now.setHours(6, 0, 0, 0);
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '14:00' } }),
    ];
    expect(computeBadgeCount(reminders, true, now)).toBe(1);
  });

  it('excludes today reminders when includeTodayInBadge is false', () => {
    const now = new Date();
    now.setHours(6, 0, 0, 0);
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '14:00' } }),
    ];
    expect(computeBadgeCount(reminders, false, now)).toBe(0);
  });

  it('excludes completed reminders', () => {
    const now = new Date();
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' }, completedAt: Date.now() }),
    ];
    expect(computeBadgeCount(reminders, false, now)).toBe(0);
  });

  it('excludes deleted reminders', () => {
    const now = new Date();
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' }, deletedAt: Date.now() }),
    ];
    expect(computeBadgeCount(reminders, false, now)).toBe(0);
  });

  it('excludes sometime reminders', () => {
    const now = new Date();
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'sometime' } }),
    ];
    expect(computeBadgeCount(reminders, true, now)).toBe(0);
  });

  it('returns 0 when no reminders match', () => {
    const now = new Date();
    expect(computeBadgeCount([], false, now)).toBe(0);
  });
});

describe('buildScheduledNotifications badge payload', () => {
  it('sets badge to computed count at fire time', () => {
    const overdue = makeReminder({
      id: 'overdue-1',
      schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' },
    });
    const future = makeReminder({
      id: 'future-1',
      schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
    });
    const result = buildScheduledNotifications([overdue, future], true, false);
    const futureNotif = result.find((n) => n.extra.reminderId === 'future-1');
    expect(futureNotif).toBeDefined();
    expect(futureNotif!.badge).toBeGreaterThanOrEqual(1);
  });

  it('sets badge to 0 when notifAppBadge is false', () => {
    const future = makeReminder({
      id: 'future-1',
      schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
    });
    const result = buildScheduledNotifications([future], false, false);
    const notif = result.find((n) => n.extra.reminderId === 'future-1');
    expect(notif).toBeDefined();
    expect(notif!.badge).toBe(0);
  });
});

describe('buildScheduledNotifications badgeDeltaOnAction', () => {
  it('sets badgeDeltaOnAction to 1 when badge > 0', () => {
    const overdue = makeReminder({
      id: 'overdue-1',
      schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' },
    });
    const future = makeReminder({
      id: 'future-1',
      schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
    });
    const result = buildScheduledNotifications([overdue, future], true, false);
    const futureNotif = result.find((n) => n.extra.reminderId === 'future-1');
    expect(futureNotif!.badge).toBeGreaterThan(0);
    expect(futureNotif!.extra.badgeDeltaOnAction).toBe(1);
  });

  it('sets badgeDeltaOnAction to 0 when badge is 0', () => {
    const future = makeReminder({
      id: 'future-1',
      schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
    });
    const result = buildScheduledNotifications([future], false, false);
    const notif = result.find((n) => n.extra.reminderId === 'future-1');
    expect(notif!.badge).toBe(0);
    expect(notif!.extra.badgeDeltaOnAction).toBe(0);
  });
});

describe('buildScheduledNotifications scheduling limits', () => {
  it('limits to 64 notifications when no midnight notification needed', () => {
    const reminders: Reminder[] = [];
    for (let i = 0; i < 70; i++) {
      const date = futureDate(Math.floor(i / 24) + 1);
      const hour = String(i % 24).padStart(2, '0');
      reminders.push(makeReminder({
        id: `r-${i}`,
        displayText: `Reminder ${i}`,
        schedule: { kind: 'scheduled', date, time: `${hour}:00` },
      }));
    }
    const result = buildScheduledNotifications(reminders, true, false);
    expect(result.length).toBe(64);
    expect(result.every((n) => n.title === 'Reminderly')).toBe(true);
  });

  it('limits to 63 reminder notifications plus midnight when date-only reminder exists', () => {
    const reminders: Reminder[] = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
    ];
    for (let i = 0; i < 70; i++) {
      const date = futureDate(Math.floor(i / 24) + 1);
      const hour = String(i % 24).padStart(2, '0');
      reminders.push(makeReminder({
        id: `r-${i}`,
        displayText: `Reminder ${i}`,
        schedule: { kind: 'scheduled', date, time: `${hour}:00` },
      }));
    }
    const result = buildScheduledNotifications(reminders, true, false);
    const midnightNotif = result.find((n) => n.id === 2147483647);
    const reminderNotifs = result.filter((n) => n.id !== 2147483647);
    expect(midnightNotif).toBeDefined();
    expect(reminderNotifs.length).toBe(63);
    expect(result.length).toBe(64);
  });
});

describe('buildScheduledNotifications midnight badge notification', () => {
  it('includes midnight notification when active date-only reminder exists', () => {
    const reminders = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
    ];
    const result = buildScheduledNotifications(reminders, true, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight).toBeDefined();
  });

  it('excludes midnight notification when all reminders have times', () => {
    const reminders = [
      makeReminder({ id: 'timed', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' } }),
    ];
    const result = buildScheduledNotifications(reminders, true, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight).toBeUndefined();
  });

  it('excludes midnight notification when badge is disabled', () => {
    const reminders = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
    ];
    const result = buildScheduledNotifications(reminders, false, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight).toBeUndefined();
  });

  it('midnight notification has empty title and body', () => {
    const reminders = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
    ];
    const result = buildScheduledNotifications(reminders, true, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight!.title).toBe('');
    expect(midnight!.body).toBe('');
  });

  it('excludes completed date-only reminders from midnight guard', () => {
    const reminders = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() }, completedAt: Date.now() }),
    ];
    const result = buildScheduledNotifications(reminders, true, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight).toBeUndefined();
  });

  it('excludes deleted date-only reminders from midnight guard', () => {
    const reminders = [
      makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() }, deletedAt: Date.now() }),
    ];
    const result = buildScheduledNotifications(reminders, true, false);
    const midnight = result.find((n) => n.id === 2147483647);
    expect(midnight).toBeUndefined();
  });

  it('gives all 64 slots to reminder notifications when no midnight notification needed', () => {
    const reminders: Reminder[] = [];
    for (let i = 0; i < 70; i++) {
      const date = futureDate(Math.floor(i / 24) + 1);
      const hour = String(i % 24).padStart(2, '0');
      reminders.push(makeReminder({
        id: `r-${i}`,
        displayText: `Reminder ${i}`,
        schedule: { kind: 'scheduled', date, time: `${hour}:00` },
      }));
    }
    const result = buildScheduledNotifications(reminders, true, false);
    expect(result.length).toBe(64);
    expect(result.find((n) => n.id === 2147483647)).toBeUndefined();
  });
});

describe('getNextTimeRefreshBoundary', () => {
  it('returns ms to midnight when no timed reminders exist today', () => {
    const now = new Date();
    now.setHours(22, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const expectedMs = tomorrow.getTime() - now.getTime();

    const result = getNextTimeRefreshBoundary([], now);
    expect(result).toBe(expectedMs);
  });

  it('returns ms to next timed reminder when sooner than midnight', () => {
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    const reminders = [
      makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '10:00' } }),
    ];
    const expected = new Date(now);
    expected.setHours(10, 0, 0, 0);
    const expectedMs = expected.getTime() - now.getTime();

    const result = getNextTimeRefreshBoundary(reminders, now);
    expect(result).toBe(expectedMs);
  });
});

// Phase 3: with Reminders off the app syncs an empty list, which must schedule nothing
// (the sync then cancels every pending Reminderly notification, including the midnight badge one).
describe('reminders off safeguard', () => {
  it('an empty reminder list builds no notifications', () => {
    expect(buildScheduledNotifications([], true, true)).toEqual([]);
  });
});

// Phase 4: alerts and badge independent (spec 7.4, plan section 5), sound on alerts only (plan section 3).
describe('Phase 4 alerts, badge and sound', () => {
  const MIDNIGHT_ID = 2147483647;
  const timed = (id: string, days: number, time = '10:00') =>
    makeReminder({ id, displayText: id, schedule: { kind: 'scheduled', date: futureDate(days), time } });
  const mixed = () => [
    timed('a', 1),
    timed('b', 2),
    makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
  ];
  const manyTimed = (withDateOnly: boolean) => {
    const reminders: Reminder[] = withDateOnly
      ? [makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } })]
      : [];
    for (let i = 0; i < 70; i++) {
      reminders.push(timed(`r-${i}`, Math.floor(i / 24) + 1, `${String(i % 24).padStart(2, '0')}:00`));
    }
    return reminders;
  };

  it('defaults keep alerts on and sound off for existing callers', () => {
    const result = buildScheduledNotifications([timed('a', 1)], true, false);
    expect(result[0].title).toBe('Reminderly');
    expect(result[0].sound).toBeUndefined();
  });

  it('alerts on, badge on: alerts carry badge numbers, plus midnight', () => {
    const result = buildScheduledNotifications(mixed(), true, false, true, false);
    const alerts = result.filter((n) => n.id !== MIDNIGHT_ID);
    expect(alerts).toHaveLength(2);
    expect(alerts.every((n) => n.title === 'Reminderly' && n.actionTypeId === 'reminder-actions')).toBe(true);
    expect(alerts.every((n) => n.badge > 0)).toBe(true);
    expect(result.some((n) => n.id === MIDNIGHT_ID)).toBe(true);
  });

  it('alerts on, badge off: alerts with no badge number and no midnight', () => {
    const result = buildScheduledNotifications(mixed(), false, false, true, false);
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.title === 'Reminderly' && n.badge === 0)).toBe(true);
    expect(result.some((n) => n.id === MIDNIGHT_ID)).toBe(false);
  });

  it('alerts off, badge on: silent badge-only notifications at reminder times, plus midnight', () => {
    const reminders = mixed();
    const result = buildScheduledNotifications(reminders, true, false, false, true);
    const badgeOnly = result.filter((n) => n.id !== MIDNIGHT_ID);
    expect(badgeOnly).toHaveLength(2);
    for (const n of badgeOnly) {
      expect(n.title).toBe('');
      expect(n.body).toBe('');
      expect(n.silent).toBe(true);
      expect(n.actionTypeId).toBe('');
      expect(n.sound).toBeUndefined();
      expect(n.extra).toEqual({ reminderId: '', badgeDeltaOnAction: 0 });
      expect(n.badge).toBe(computeBadgeCount(reminders, false, new Date(n.schedule.at.getTime() + 1)));
    }
    expect(result.some((n) => n.id === MIDNIGHT_ID)).toBe(true);
  });

  it('badge-only notifications match alert ids and times', () => {
    const alerts = buildScheduledNotifications(mixed(), true, true, true, false);
    const badgeOnly = buildScheduledNotifications(mixed(), true, true, false, false);
    expect(badgeOnly.map((n) => [n.id, n.schedule.at.getTime(), n.badge]))
      .toEqual(alerts.map((n) => [n.id, n.schedule.at.getTime(), n.badge]));
  });

  it('alerts off, badge off: nothing scheduled', () => {
    expect(buildScheduledNotifications(mixed(), false, true, false, true)).toEqual([]);
  });

  it('sound on adds the default sound to alerts only', () => {
    const result = buildScheduledNotifications(mixed(), true, false, true, true);
    const alerts = result.filter((n) => n.id !== MIDNIGHT_ID);
    expect(alerts.every((n) => n.sound === 'default')).toBe(true);
    expect(result.find((n) => n.id === MIDNIGHT_ID)?.sound).toBeUndefined();
  });

  it('sound off leaves alerts without a sound', () => {
    const result = buildScheduledNotifications(mixed(), true, false, true, false);
    expect(result.every((n) => n.sound === undefined)).toBe(true);
  });

  it('badge-only stays within 64 with no date-only reminder', () => {
    const result = buildScheduledNotifications(manyTimed(false), true, false, false, false);
    expect(result).toHaveLength(64);
    expect(result.every((n) => n.silent === true && n.title === '')).toBe(true);
  });

  it('badge-only stays within 64 with the midnight slot reserved', () => {
    const result = buildScheduledNotifications(manyTimed(true), true, false, false, false);
    expect(result).toHaveLength(64);
    expect(result.filter((n) => n.id !== MIDNIGHT_ID)).toHaveLength(63);
    expect(result.some((n) => n.id === MIDNIGHT_ID)).toBe(true);
  });

  it('badge-only never schedules more than alerts', () => {
    for (const withDateOnly of [false, true]) {
      const reminders = manyTimed(withDateOnly);
      expect(buildScheduledNotifications(reminders, true, true, false, false).length)
        .toBe(buildScheduledNotifications(reminders, true, true, true, false).length);
    }
  });
});

// Phase 4 ask state rules (plan section 6), shared with Self Check.
describe('Phase 4 notification ask', () => {
  for (const check of getNotificationChecks().filter((c) => c.id.startsWith('notif-ask-'))) {
    it(check.name, () => check.run());
  }
});
