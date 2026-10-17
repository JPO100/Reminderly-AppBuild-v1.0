import { describe, it, expect } from 'vitest';
import { getNlcTutorialDemo } from '../utils/tutorial-nlc-demo';

const ALL = { date: true, time: true, repeats: true };

describe('getNlcTutorialDemo', () => {
  it('uses "tonight" when time recognition is on: date today and 9pm', () => {
    const demo = getNlcTutorialDemo(ALL)!;
    expect(demo.text).toBe('Take the bins out tonight');
    expect(demo.token.text).toBe('tonight');
    const today = new Date();
    expect(demo.date?.toDateString()).toBe(today.toDateString());
    expect(demo.time).toEqual({ hour: 21, minute: 0 });
  });

  it('still uses "tonight" with date recognition off, as the live editor does', () => {
    const demo = getNlcTutorialDemo({ ...ALL, date: false })!;
    expect(demo.token.text).toBe('tonight');
    expect(demo.time).toEqual({ hour: 21, minute: 0 });
  });

  it('falls back to "tomorrow" with no time when time recognition is off', () => {
    const demo = getNlcTutorialDemo({ ...ALL, time: false })!;
    expect(demo.text).toBe('Take the bins out tomorrow');
    expect(demo.token.text).toBe('tomorrow');
    expect(demo.time).toBeNull();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(demo.date?.toDateString()).toBe(tomorrow.toDateString());
  });

  it('returns null when date and time recognition are both off', () => {
    expect(getNlcTutorialDemo({ date: false, time: false, repeats: true })).toBeNull();
  });
});
