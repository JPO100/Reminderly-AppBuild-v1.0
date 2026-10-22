import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildSiriReminder, isSiriUnsupportedTime } from '../utils/siri';

// Thursday 22 October 2026, 3:00pm local
const now = new Date(2026, 9, 22, 15, 0);

function build(text: string, at: Date = now, repeats = true) {
  vi.setSystemTime(at);
  return buildSiriReminder(text, at, repeats);
}

describe('Siri reminder parsing', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('time with no date', () => {
    it('a time still to come today stays today', () => {
      expect(build('Call Sam at 5pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '17:00' });
    });

    it('a time already passed today moves to tomorrow', () => {
      expect(build('Call Sam at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '09:00' });
    });

    it('the current minute moves to tomorrow', () => {
      expect(build('Call Sam at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '15:00' });
    });

    it('a passed time late on 31 December moves into the new year', () => {
      expect(build('Call Sam at 9am', new Date(2026, 11, 31, 22, 0)).schedule)
        .toEqual({ kind: 'scheduled', date: '2027-01-01', time: '09:00' });
    });

    it('a time naming today keeps today even when passed', () => {
      const result = build('Gym this morning', new Date(2026, 9, 22, 13, 0));
      expect(result.schedule.kind).toBe('scheduled');
      expect(result.schedule.kind === 'scheduled' && result.schedule.date).toBe('2026-10-22');
    });
  });

  describe('explicit dates', () => {
    it('tomorrow with a time is unchanged', () => {
      expect(build('Call Sam tomorrow at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '09:00' });
    });

    it('today with a passed time stays today', () => {
      expect(build('Call Sam today at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '09:00' });
    });
  });

  describe('month-name dates', () => {
    it('a date later this year stays this year', () => {
      expect(build('Dentist December 5').schedule).toEqual({ kind: 'scheduled', date: '2026-12-05' });
    });

    it('a date already passed this year moves to next year', () => {
      expect(build('Dentist March 5').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05' });
    });

    it('the day-first form moves to next year too', () => {
      expect(build('Dentist 5th of March').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05' });
    });

    it('today stays today', () => {
      expect(build('Dentist October 22').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22' });
    });

    it('an explicit year is kept even when past', () => {
      expect(build('Dentist March 5 2026').schedule).toEqual({ kind: 'scheduled', date: '2026-03-05' });
    });

    it('2 January said on 31 December is next year', () => {
      expect(build('Dentist January 2', new Date(2026, 11, 31, 10, 0)).schedule).toEqual({ kind: 'scheduled', date: '2027-01-02' });
    });
  });

  describe('other behaviour', () => {
    it('no date or time is Sometime', () => {
      expect(build('Buy milk').schedule).toEqual({ kind: 'sometime' });
    });

    it('text with "&" is kept in full', () => {
      const result = build('Buy milk & eggs');
      expect(result.originalText).toBe('Buy milk & eggs');
      expect(result.displayText).toBe('Buy milk & eggs');
    });

    it('repeat reminders on creates a rule, off creates none', () => {
      expect(build('Take pills every day', now, true).repeatRule).not.toBeNull();
      expect(build('Take pills every day', now, false).repeatRule).toBeNull();
    });
  });
});

// Siri Stage 4 (docs/plans/siri-stage4-datetime.md)
describe('Siri spoken dates and times', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // Thursday 22 October 2026, 10:07am
  const at = new Date(2026, 9, 22, 10, 7);
  const fields = (text: string, when: Date = at) => {
    const result = build(text, when);
    if (isSiriUnsupportedTime(result)) throw new Error(`refused: ${text}`);
    return result;
  };

  it.each([
    ['Call mum in 10 minutes', { kind: 'scheduled', date: '2026-10-22', time: '10:15' }],
    ['Call mum in 30 mins', { kind: 'scheduled', date: '2026-10-22', time: '10:30' }],
    ['Call mum in an hour', { kind: 'scheduled', date: '2026-10-22', time: '11:00' }],
    ['Call mum in 2 hours', { kind: 'scheduled', date: '2026-10-22', time: '12:00' }],
    ['Call mum in two hours', { kind: 'scheduled', date: '2026-10-22', time: '12:00' }],
    ['Call mum in 2 days', { kind: 'scheduled', date: '2026-10-24' }],
    ['Call mum at 4 o\'clock', { kind: 'scheduled', date: '2026-10-22', time: '16:00' }],
    ['Call mum at four pm', { kind: 'scheduled', date: '2026-10-22', time: '16:00' }],
    ['Call mum at half past four', { kind: 'scheduled', date: '2026-10-22', time: '16:30' }],
    ['Call mum the day after tomorrow', { kind: 'scheduled', date: '2026-10-24' }],
  ])('%s', (text, schedule) => {
    const result = fields(text);
    expect(result.schedule).toEqual(schedule);
    expect(result.displayText).toBe('Call mum');
    expect(result.originalText).toBe(text);
  });

  it('a relative time late at night lands tomorrow', () => {
    expect(fields('Call mum in an hour', new Date(2026, 9, 22, 23, 30)).schedule)
      .toEqual({ kind: 'scheduled', date: '2026-10-23', time: '00:30' });
  });

  it('a spoken hour already passed today is its next occurrence', () => {
    expect(fields('Call mum at 4 o\'clock', new Date(2026, 9, 22, 17, 0)).schedule)
      .toEqual({ kind: 'scheduled', date: '2026-10-23', time: '04:00' });
  });

  // A stated date takes precedence over the next occurrence (D1 correction)
  it.each([
    ['Call mum tomorrow at 4 o\'clock', 10, '2026-10-23', '16:00'],
    ['Call mum tomorrow at 4 o\'clock', 17, '2026-10-23', '16:00'],
    ['Call mum tomorrow at 9 o\'clock', 10, '2026-10-23', '09:00'],
    ['Call mum tomorrow at 9 o\'clock', 22, '2026-10-23', '09:00'],
    ['Call mum next Friday at half past four', 18, '2026-10-30', '16:30'],
    ['Call mum tomorrow at 12 o\'clock', 13, '2026-10-23', '12:00'],
  ])('%s said at %i:00 is %s %s', (text, hour, date, time) => {
    expect(fields(text, new Date(2026, 9, 22, hour, 0)).schedule).toEqual({ kind: 'scheduled', date, time });
  });

  it('without a date the spoken hour keeps the next occurrence', () => {
    expect(fields('Call mum at 4 o\'clock', new Date(2026, 9, 22, 10, 0)).schedule)
      .toEqual({ kind: 'scheduled', date: '2026-10-22', time: '16:00' });
  });

  it.each([
    ['Call mum Friday evening', 'Call mum', '18:00'],
    ['Call mum this evening', 'Call mum', '18:00'],
    ['Call mum at noon', 'Call mum', '12:00'],
    ['Call mum at lunchtime', 'Call mum', '12:00'],
    ['Call mum at 16:00', 'Call mum', '16:00'],
    ['Call mum on Friday', 'Call mum', undefined],
    ['Call mum tomorrow at 4pm', 'Call mum', '16:00'],
    ['Call mum next Friday at 2pm', 'Call mum', '14:00'],
    ['Call mum tomorrow morning', 'Call mum', '07:00'],
  ])('title for "%s" is "%s"', (text, title, time) => {
    const result = fields(text);
    expect(result.displayText).toBe(title);
    expect(result.schedule.kind === 'scheduled' ? result.schedule.time : null).toBe(time);
  });

  it('repeat words stay in the title, as before', () => {
    const result = fields('Call mum every Monday at 9am');
    expect(result.displayText).toBe('Call mum every Monday');
    expect(result.schedule).toEqual({ kind: 'scheduled', date: '2026-10-26', time: '09:00' });
  });

  it.each([
    ['Call mum at 4:10pm', '4:00', '4:15'],
    ['Call mum at 4:50 pm', '4:45', '5:00'],
    ['Call mum at 11:50pm', '11:45', '12:00'],
    ['Call mum at 16:10', '16:00', '16:15'],
    ['Call mum every Monday at 9:10am', '9:00', '9:15'],
  ])('%s is refused with %s or %s and no reminder', (text, earlier, later) => {
    expect(build(text, at)).toEqual({ unsupportedTime: { earlier, later } });
  });

  it('unsupported phrases are still Sometime without a time', () => {
    expect(fields('Call mum next week').schedule).toEqual({ kind: 'sometime' });
    expect(fields('Call mum at 4').schedule).toEqual({ kind: 'sometime' });
  });
});

// Settings lists the phrases registered with iOS, so the two lists must match
describe('Siri phrases', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(__dirname, file), 'utf8');

  it('settings lists exactly the phrases registered in AppShortcuts.swift', () => {
    const swift = [...read('../../../ios/App/App/AppShortcuts.swift').matchAll(/"([^"]*)\\\(\.applicationName\)([^"]*)"/g)]
      .map((m) => `${m[1]}Reminderly${m[2]}`);
    const listBlock = read('../components/SettingsPanelContent.tsx').match(/SIRI_PHRASES = \[([\s\S]*?)\];/)![1];
    const listed = [...listBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(swift).toHaveLength(1);
    expect(listed).toEqual(swift);
  });
});
