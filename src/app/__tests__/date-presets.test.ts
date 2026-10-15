import { afterEach, describe, expect, it, vi } from 'vitest';
import { getScheduleChecks } from '../dev/schedule-checks';
import { getDatePresetValue } from '../utils/date-presets';
import { buildScheduledNotifications } from '../notifications';
import type { Reminder } from '../reminder-utils';

// The date preset checks are pure, so they run the same in Vitest and Self Check.
describe('date presets', () => {
  for (const check of getScheduleChecks().filter((c) => c.id.startsWith('date-preset-'))) {
    it(check.name, () => check.run());
  }
});

// A Tonight reminder saved after 6pm is overdue at once and must not schedule a notification.
describe('date presets: Tonight notification', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function tonightReminder(): Reminder {
    const { date, time } = getDatePresetValue('tonight');
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      id: 'tonight-1',
      originalText: 'Tonight',
      displayText: 'Tonight',
      createdAt: Date.now(),
      schedule: { kind: 'scheduled', date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(time.hour)}:${pad(time.minute)}` },
    };
  }

  it('saved after 6pm: no notification is scheduled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 21, 0));
    const result = buildScheduledNotifications([tonightReminder()], true, false);
    expect(result.find((n) => n.extra.reminderId === 'tonight-1')).toBeUndefined();
  });

  it('saved before 6pm: a notification is scheduled for 6pm today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 14, 0));
    const result = buildScheduledNotifications([tonightReminder()], true, false);
    const notif = result.find((n) => n.extra.reminderId === 'tonight-1');
    expect(notif).toBeDefined();
    expect(new Date(notif!.schedule.at).getTime()).toBe(new Date(2026, 9, 15, 18, 0).getTime());
  });
});
