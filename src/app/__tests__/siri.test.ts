import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildSiriReminder, isSiriCancelAnswer, isSiriNeedsTime, isSiriUnsupportedTime } from '../utils/siri';

// Thursday 22 October 2026, 3:00pm local
const now = new Date(2026, 9, 22, 15, 0);

function build(text: string, at: Date = now, repeats = true) {
  vi.setSystemTime(at);
  const result = buildSiriReminder(text, at, repeats);
  if (isSiriNeedsTime(result)) throw new Error(`needs a time: ${text}`);
  return result;
}

// A date or repeat with no time: no reminder, Siri asks for the time (docs/plans/no-auto-time.md, 4)
function needsTime(text: string, at: Date = now, repeats = true) {
  vi.setSystemTime(at);
  return isSiriNeedsTime(buildSiriReminder(text, at, repeats));
}

describe('Siri reminder parsing', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('time with no date', () => {
    it('a time still to come today stays today', () => {
      expect(build('Call Sam at 5pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '17:00' });
    });

    // A time with no date means today even once passed, as in the app (docs/plans/nlc-titles-and-dates.md)
    it('a time already passed today stays today', () => {
      expect(build('Call Sam at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '09:00' });
    });

    it('the current minute stays today', () => {
      expect(build('Call Sam at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '15:00' });
    });

    it('a passed time late on 31 December stays on 31 December', () => {
      expect(build('Call Sam at 9am', new Date(2026, 11, 31, 22, 0)).schedule)
        .toEqual({ kind: 'scheduled', date: '2026-12-31', time: '09:00' });
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

  // Month-name dates, with a time; with no time Siri asks for one (docs/plans/no-auto-time.md)
  describe('month-name dates', () => {
    it('a date later this year stays this year', () => {
      expect(build('Dentist December 5 at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2026-12-05', time: '15:00' });
    });

    it('a date already passed this year moves to next year', () => {
      expect(build('Dentist March 5 at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05', time: '15:00' });
    });

    it('the day-first form moves to next year too', () => {
      expect(build('Dentist 5th of March at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05', time: '15:00' });
    });

    it('today stays today', () => {
      expect(build('Dentist October 22 at 5pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '17:00' });
    });

    it('an explicit year is kept even when past', () => {
      expect(build('Dentist March 5 2026 at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2026-03-05', time: '15:00' });
    });

    it('2 January said on 31 December is next year', () => {
      expect(build('Dentist January 2 at 3pm', new Date(2026, 11, 31, 10, 0)).schedule).toEqual({ kind: 'scheduled', date: '2027-01-02', time: '15:00' });
    });
  });

  describe('a date or repeat with no time', () => {
    it.each([
      'Dentist December 5',
      'Dentist 5th of March',
      'Call mum today',
      'Call mum tomorrow',
      'Call mum on Friday',
      'Call mum in 2 days',
      'Call mum the day after tomorrow',
      'Take pills every day',
    ])('"%s" needs a time and creates no reminder', (text) => {
      expect(needsTime(text)).toBe(true);
    });

    it('the answer joined to the request gives the time', () => {
      expect(build('Call mum today at 5pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '17:00' });
      expect(build('Call mum today at 5pm').displayText).toBe('Call mum');
    });

    it('an answer with no usable time still needs a time', () => {
      expect(needsTime('Call mum today at banana')).toBe(true);
    });

    it('an answer off the quarter hour is refused as now', () => {
      expect(isSiriUnsupportedTime(build('Call mum today at 4:10pm'))).toBe(true);
    });

    it('no date and no time is still Sometime, not a question', () => {
      expect(needsTime('Buy milk')).toBe(false);
    });

    it.each(['cancel', 'Cancel.', 'stop', 'Never mind', 'nevermind', 'forget it!', '  Cancel  '])(
      'answering "%s" cancels', (answer) => {
        expect(isSiriCancelAnswer(answer)).toBe(true);
      });

    it.each(['3pm', 'banana', 'cancel at 3pm', 'stop at 5', ''])('answering "%s" does not cancel', (answer) => {
      expect(isSiriCancelAnswer(answer)).toBe(false);
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
      expect(build('Take pills every day at 9am', now, true).repeatRule).not.toBeNull();
      expect(build('Take pills every day at 9am', now, false).repeatRule).toBeNull();
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
    ['Call mum at 4 o\'clock', { kind: 'scheduled', date: '2026-10-22', time: '16:00' }],
    ['Call mum at four pm', { kind: 'scheduled', date: '2026-10-22', time: '16:00' }],
    ['Call mum at half past four', { kind: 'scheduled', date: '2026-10-22', time: '16:30' }],
    ['Call mum the day after tomorrow at 9am', { kind: 'scheduled', date: '2026-10-24', time: '09:00' }],
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

  it('a spoken hour already passed today is its next clock occurrence, on today', () => {
    expect(fields('Call mum at 4 o\'clock', new Date(2026, 9, 22, 17, 0)).schedule)
      .toEqual({ kind: 'scheduled', date: '2026-10-22', time: '04:00' });
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
    ['Call mum on Friday at 9am', 'Call mum', '09:00'],
    ['Call mum tomorrow at 4pm', 'Call mum', '16:00'],
    ['Call mum next Friday at 2pm', 'Call mum', '14:00'],
    ['Call mum tomorrow morning', 'Call mum', '07:00'],
  ])('title for "%s" is "%s"', (text, title, time) => {
    const result = fields(text);
    expect(result.displayText).toBe(title);
    expect(result.schedule.kind === 'scheduled' ? result.schedule.time : null).toBe(time);
  });

  it('repeat words are removed from the title (D1)', () => {
    const result = fields('Call mum every Monday at 9am');
    expect(result.displayText).toBe('Call mum');
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
