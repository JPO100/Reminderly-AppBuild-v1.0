import { describe, it, expect } from 'vitest';
import {
  addCalendarMonths,
  formatCalendarDayHeading,
  formatCalendarMonthTitle,
  getCalendarDayCategory,
  getCalendarDayReminders,
  getCalendarDots,
  getCalendarWeeks,
  isDateInFilterRange,
  stepCalendarMonth,
  toDateKey,
} from '../reminder-utils';
import { canSubmitReminder, formatSelectedDate, getCalendarPrefill } from '../../imports/NewReminderOverlay';
import type { Reminder } from '../reminder-utils';

// Tuesday 6 January 2026, 1pm local time (the mockup's today)
const NOW = new Date(2026, 0, 6, 13, 0, 0);

let nextId = 0;
function reminder(date: string | null, extra: Partial<Reminder> = {}, time?: string): Reminder {
  nextId += 1;
  return {
    id: `r${nextId}`,
    originalText: `Reminder ${nextId}`,
    displayText: `Reminder ${nextId}`,
    createdAt: nextId,
    schedule: date ? { kind: 'scheduled', date, ...(time ? { time } : {}) } : { kind: 'sometime' },
    ...extra,
  };
}

describe('calendar grid', () => {
  it('starts weeks on Monday with blank cells around the month', () => {
    const weeks = getCalendarWeeks(2026, 0); // January 2026 starts on a Thursday
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([null, null, null, '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
    expect(weeks[4]).toEqual(['2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31', null]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it('uses only the rows the month needs', () => {
    expect(getCalendarWeeks(2027, 1)).toHaveLength(4); // February 2027 starts on a Monday, 28 days
    expect(getCalendarWeeks(2026, 2)).toHaveLength(6); // March 2026 starts on a Sunday
    expect(getCalendarWeeks(2026, 1)).toHaveLength(5); // February 2026 starts on a Sunday
  });

  it('handles leap years', () => {
    const cells = getCalendarWeeks(2028, 1).flat().filter(Boolean);
    expect(cells).toHaveLength(29);
    expect(cells[28]).toBe('2028-02-29');
    expect(getCalendarWeeks(2026, 1).flat().filter(Boolean)).toHaveLength(28);
  });

  it('steps months across year boundaries', () => {
    expect(addCalendarMonths(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(addCalendarMonths(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(addCalendarMonths(2026, 0, 14)).toEqual({ year: 2027, month: 2 });
  });

  it('builds local date keys', () => {
    expect(toDateKey(new Date(2026, 0, 6, 23, 59))).toBe('2026-01-06');
    expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('formats headings', () => {
    expect(formatCalendarDayHeading('2026-01-06')).toBe('Tuesday 6th January');
    expect(formatCalendarDayHeading('2026-01-22')).toBe('Thursday 22nd January');
    expect(formatCalendarMonthTitle(2026, 0)).toBe('January 2026');
  });
});

describe('calendar day categories and filter ranges', () => {
  it('categorises days around today', () => {
    expect(getCalendarDayCategory('2026-01-05', NOW)).toBe('past');
    expect(getCalendarDayCategory('2026-01-06', NOW)).toBe('today');
    expect(getCalendarDayCategory('2026-01-11', NOW)).toBe('this-week');
    expect(getCalendarDayCategory('2026-01-12', NOW)).toBe('later');
    expect(getCalendarDayCategory('2027-03-01', NOW)).toBe('later');
  });

  it('matches the existing filter definitions', () => {
    expect(isDateInFilterRange('2026-01-06', 'today', NOW)).toBe(true);
    expect(isDateInFilterRange('2026-01-07', 'today', NOW)).toBe(false);
    expect(isDateInFilterRange('2026-01-06', 'this-week', NOW)).toBe(false);
    expect(isDateInFilterRange('2026-01-07', 'this-week', NOW)).toBe(true);
    expect(isDateInFilterRange('2026-01-11', 'this-week', NOW)).toBe(true);
    expect(isDateInFilterRange('2026-01-12', 'this-week', NOW)).toBe(false);
    expect(isDateInFilterRange('2026-01-12', 'later', NOW)).toBe(true);
    expect(isDateInFilterRange('2027-06-01', 'later', NOW)).toBe(true);
    expect(isDateInFilterRange('2027-06-01', 'other', NOW)).toBe(true);
    expect(isDateInFilterRange('2026-01-07', 'sometime', NOW)).toBe(false);
    expect(isDateInFilterRange('2026-01-07', 'all', NOW)).toBe(true);
  });

  it('never puts past days in range', () => {
    expect(isDateInFilterRange('2026-01-05', 'all', NOW)).toBe(false);
    expect(isDateInFilterRange('2026-01-05', 'this-week', NOW)).toBe(false);
  });

  it('has no rest of week when today is Sunday', () => {
    const sunday = new Date(2026, 0, 11, 9, 0);
    expect(isDateInFilterRange('2026-01-11', 'this-week', sunday)).toBe(false);
    expect(isDateInFilterRange('2026-01-12', 'later', sunday)).toBe(true);
  });

  it('crosses month and year boundaries', () => {
    const wed = new Date(2025, 11, 31, 10, 0); // Wednesday 31 December 2025
    expect(isDateInFilterRange('2026-01-04', 'this-week', wed)).toBe(true);
    expect(isDateInFilterRange('2026-01-05', 'later', wed)).toBe(true);
    expect(getCalendarDayCategory('2025-12-30', wed)).toBe('past');
  });
});

describe('calendar dots', () => {
  it('shows one dot per reminder in its category, capped at 4', () => {
    const list = [
      reminder('2026-01-10'), reminder('2026-01-10'), reminder('2026-01-10'),
      reminder('2026-01-10'), reminder('2026-01-10'),
      reminder('2026-01-07'), reminder('2026-01-15'),
    ];
    const dots = getCalendarDots(list, NOW);
    expect(dots.get('2026-01-10')).toEqual(['this-week', 'this-week', 'this-week', 'this-week']);
    expect(dots.get('2026-01-07')).toEqual(['this-week']);
    expect(dots.get('2026-01-15')).toEqual(['later']);
  });

  it('keeps overdue on the original date only, first in list order', () => {
    const list = [reminder('2026-01-06', {}, '17:00'), reminder('2026-01-06', {}, '08:00'), reminder('2026-01-05')];
    const dots = getCalendarDots(list, NOW);
    expect(dots.get('2026-01-05')).toEqual(['overdue']);
    expect(dots.get('2026-01-06')).toEqual(['overdue', 'today']); // 8am has passed at 1pm
  });

  it('excludes done, deleted and sometime reminders', () => {
    const list = [
      reminder('2026-01-08', { completedAt: 1 }),
      reminder('2026-01-08', { deletedAt: 1 }),
      reminder(null),
    ];
    expect(getCalendarDots(list, NOW).size).toBe(0);
  });

  it('shows only the current occurrence of a repeating reminder', () => {
    const repeat = reminder('2026-01-06', { repeatRule: { frequency: 'daily', interval: 2, byDay: null } }, '17:00');
    const dots = getCalendarDots([repeat], NOW);
    expect([...dots.keys()]).toEqual(['2026-01-06']);
  });

  it('includes list (smart) reminders', () => {
    const smart = reminder('2026-01-15', { isSmartReminder: true, linkedListId: 'list-1' });
    expect(getCalendarDots([smart], NOW).get('2026-01-15')).toEqual(['later']);
  });
});

describe('calendar day reminders', () => {
  const overdue = reminder('2026-01-04');
  const today = reminder('2026-01-06', {}, '17:00');
  const future = reminder('2026-01-15');
  const done = reminder('2026-01-15', { completedAt: 1 });
  const sometime = reminder(null);
  const all = [future, today, overdue, done, sometime];

  it('lists today plus overdue for today, in list order', () => {
    expect(getCalendarDayReminders(all, '2026-01-06', NOW).map((r) => r.id)).toEqual([overdue.id, today.id]);
  });

  it('lists only that date for another day', () => {
    expect(getCalendarDayReminders(all, '2026-01-15', NOW).map((r) => r.id)).toEqual([future.id]);
  });

  it('returns an empty list for a day with nothing due', () => {
    expect(getCalendarDayReminders(all, '2026-01-20', NOW)).toEqual([]);
  });
});

describe('calendar month navigation (option A)', () => {
  it('returns null (follow the current month) when stepping back to the current month', () => {
    expect(stepCalendarMonth({ year: 2026, month: 1 }, -1, NOW)).toBeNull();
    expect(stepCalendarMonth({ year: 2025, month: 11 }, 1, NOW)).toBeNull();
  });

  it('returns the shown month when moving away, across year boundaries', () => {
    expect(stepCalendarMonth({ year: 2026, month: 0 }, 1, NOW)).toEqual({ year: 2026, month: 1 });
    expect(stepCalendarMonth({ year: 2026, month: 0 }, -1, NOW)).toEqual({ year: 2025, month: 11 });
    expect(stepCalendarMonth({ year: 2026, month: 11 }, 1, NOW)).toEqual({ year: 2027, month: 0 });
  });

  it('has no limit in either direction', () => {
    expect(stepCalendarMonth({ year: 2026, month: 0 }, 120, NOW)).toEqual({ year: 2036, month: 0 });
    expect(stepCalendarMonth({ year: 2026, month: 0 }, -120, NOW)).toEqual({ year: 2016, month: 0 });
  });
});

describe('New reminder date from the calendar', () => {
  it('prefills the selected day with the usual 12pm time', () => {
    const prefill = getCalendarPrefill('2026-01-22');
    expect(prefill?.time).toEqual({ hour: 12, minute: 0 });
    expect(toDateKey(prefill!.date)).toBe('2026-01-22');
    expect(formatSelectedDate(prefill!.date, NOW)).toBe('Jan 22nd');
  });

  it('prefills nothing without a selected day', () => {
    expect(getCalendarPrefill(null)).toBeNull();
  });

  it('can be saved once text is entered, as a new scheduled reminder', () => {
    const prefill = getCalendarPrefill('2026-01-22')!;
    const base = { requiresScheduledReminder: true, isDateOn: true, selectedDate: prefill.date, isTimeOn: true, selectedTime: prefill.time };
    expect(canSubmitReminder({ ...base, text: '' })).toBe(false);
    expect(canSubmitReminder({ ...base, text: 'Pick up parcel' })).toBe(true);
  });
});
