import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Reminder } from '../reminder-utils';
import { parseTokens } from '../utils/nlc-parser';
import { computeAutoApplyResult } from '../utils/nlc-interaction';
import { titleFromAppliedTokens } from '../utils/normalise-text';
import { buildSiriReminder, isSiriNeedsTime, isSiriUnsupportedTime } from '../utils/siri';
import { buildScheduledNotifications } from '../notifications';

// NLC task-only titles, Stage 3 (docs/plans/nlc-titles-and-dates.md, 2.1, 2.3 and conditions 1, 4 and 5)

/** The title when every recognised token is applied, as typing in one go or Siri does */
const title = (text: string) =>
  titleFromAppliedTokens(text, computeAutoApplyResult(parseTokens(text), { date: false, time: false, repeats: false }).map((a) => a.token));

describe('titleFromAppliedTokens', () => {
  it.each([
    ['Call mum on Monday at 9pm', 'Call mum'],
    ['Call mum at 9pm', 'Call mum'],
    ['Dentist appointment tomorrow at 10:30am', 'Dentist appointment'],
    ['Pick up dry cleaning tomorrow', 'Pick up dry cleaning'],
    ['Take the bins out tonight', 'Take the bins out'],
    ['Pay rent every month', 'Pay rent'],
    ['Team stand-up weekdays at 9:15am', 'Team stand-up'],
    ['Gym every Monday at 7am', 'Gym'],
    ['Water the plants every morning', 'Water the plants'],
    ['Book flights to Spain next Friday', 'Book flights to Spain'],
    ['Mum and dad anniversary 14 Feb', 'Mum and dad anniversary'],
    ['Renew car insurance on March 3rd 2027', 'Renew car insurance'],
    ['Call the bank in an hour', 'Call the bank'],
    ['Take the cake out of the oven in 20 minutes', 'Take the cake out of the oven'],
    ['Send invoice in 3 days', 'Send invoice'],
    ['Parents evening at half past six', 'Parents evening'],
    ['Call Sam at 3pm, then email him tomorrow', 'Call Sam, then email him'],
    ['Dentist 3/3/27 at 3pm', 'Dentist'],
    ['Call mum Wednesday 4 November at 6pm', 'Call mum'],
    ['Meet Sam 19:00', 'Meet Sam'],
  ])('"%s" -> "%s"', (text, expected) => {
    expect(title(text)).toBe(expected);
  });

  it('keeps a day that is part of the task (refinement 2)', () => {
    expect(title('Monday meeting notes')).toBe('Monday meeting notes');
    expect(title('Buy flowers for Sunday lunch')).toBe('Buy flowers for Sunday lunch');
  });

  it('keeps the typed text when nothing would be left', () => {
    expect(title('Tomorrow at 9pm')).toBe('Tomorrow at 9pm');
    expect(title('Every Monday')).toBe('Every Monday');
  });

  it('capitalises the first letter only after a removal', () => {
    expect(title('meet sam tomorrow')).toBe('Meet sam');
    expect(title('buy milk')).toBe('buy milk');
  });

  it('removes only the tokens passed in (condition 1)', () => {
    const text = 'Call mum tomorrow at 3pm';
    const time = parseTokens(text).filter((t) => t.category === 'time');
    expect(titleFromAppliedTokens(text, time)).toBe('Call mum tomorrow');
    expect(titleFromAppliedTokens(text, [])).toBe(text);
    expect(titleFromAppliedTokens('Do it every so often', [])).toBe('Do it every so often');
  });

  it('keeps an unrecognised repeat whole when Recognise repeats is off (settings testing, Kai)', () => {
    const noRepeats = (text: string) => {
      const tokens = parseTokens(text, { date: true, time: true, repeats: false });
      return titleFromAppliedTokens(text, computeAutoApplyResult(tokens, { date: false, time: false, repeats: false }).map((a) => a.token));
    };
    expect(noRepeats('Gym every Monday at 7am')).toBe('Gym every Monday');
    expect(noRepeats('Gym every Monday')).toBe('Gym every Monday');
    expect(noRepeats('Call mum on Monday at 9pm')).toBe('Call mum');
    expect(title('Gym every Monday at 7am')).toBe('Gym');
  });
});

describe('Siri titles and times (condition 4)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const at = new Date(2026, 9, 22, 15, 0); // Thursday 22 October 2026, 3pm
  const siri = (text: string, repeats = true) => {
    vi.setSystemTime(at);
    const result = buildSiriReminder(text, at, repeats);
    if (isSiriUnsupportedTime(result)) throw new Error(`refused: ${text}`);
    if (isSiriNeedsTime(result)) throw new Error(`needs a time: ${text}`);
    return result;
  };

  it('keeps words that were not applied (changed: was "Parents" and "meeting notes")', () => {
    expect(siri('Parents evening at 6pm').displayText).toBe('Parents evening');
    expect(siri('Monday meeting notes at 9am').displayText).toBe('Monday meeting notes');
  });

  it('keeps repeat words when repeat reminders are off, as no repeat is saved', () => {
    const result = siri('Call mum every Monday at 9am', false);
    expect(result.repeatRule).toBeNull();
    expect(result.displayText).toBe('Call mum every Monday');
  });

  // Superseded D7: a date with no time gets no time; Siri asks for one (docs/plans/no-auto-time.md)
  it('a date with no time needs a time, with no 12pm default', () => {
    expect(isSiriNeedsTime(buildSiriReminder('Call mum today', at, true))).toBe(true);
  });

  it('numeric dates from Stage 1 work through Siri', () => {
    const result = siri('Dentist 3/3/27 at 3pm');
    expect(result.schedule).toEqual({ kind: 'scheduled', date: '2027-03-03', time: '15:00' });
    expect(result.displayText).toBe('Dentist');
  });

  it('unchanged: the 15-minute refusal and Sometime', () => {
    vi.setSystemTime(at);
    expect(isSiriUnsupportedTime(buildSiriReminder('Call mum at 4:10pm', at, true))).toBe(true);
    expect(siri('buy milk')).toEqual({ originalText: 'buy milk', displayText: 'buy milk', schedule: { kind: 'sometime' }, repeatRule: null });
  });
});

describe('notification text (condition 5)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 22, 15, 0)); });
  afterEach(() => { vi.useRealTimers(); });

  it('the notification body is the saved task-only title', () => {
    const fields = buildSiriReminder('Call mum tomorrow at 9am', new Date(2026, 9, 22, 15, 0), true);
    if (isSiriUnsupportedTime(fields)) throw new Error('refused');
    const reminder: Reminder = { id: 'r1', createdAt: Date.now(), ...fields };
    const [notification] = buildScheduledNotifications([reminder], false, false);
    expect(notification.body).toBe('Call mum');
    expect(notification.body).toBe(reminder.displayText);
  });
});
