import { describe, it, expect } from 'vitest';
import { parseTokens, findUnsupportedClockTime } from '../utils/nlc-parser';
import { computeTokenClickResult, parseDateTokenValue, parseTimeTokenValue, roundToQuarterHour } from '../utils/nlc-interaction';

// Siri Stage 4 (docs/plans/siri-stage4-datetime.md): relative times, spoken clock times and explicit-time validation

const tokens = (text: string) => parseTokens(text).map((t) => `${t.category}:${t.text}`);
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function relative(text: string, now: Date) {
  const token = parseTokens(text).find((t) => t.category === 'time')!;
  const result = computeTokenClickResult(token, now)!;
  return `${ymd(result.dateValue!)} ${String(result.timeValue!.hour).padStart(2, '0')}:${String(result.timeValue!.minute).padStart(2, '0')}`;
}

describe('relative time tokens', () => {
  it('recognises minutes, mins, hours, words and "an"', () => {
    expect(tokens('Call mum in 10 minutes')).toEqual(['time:in 10 minutes']);
    expect(tokens('Call mum in 30 mins')).toEqual(['time:in 30 mins']);
    expect(tokens('Call mum in an hour')).toEqual(['time:in an hour']);
    expect(tokens('Call mum in 2 hours')).toEqual(['time:in 2 hours']);
    expect(tokens('Call mum in two hours')).toEqual(['time:in two hours']);
  });

  it('accepts 1 to 99 only', () => {
    expect(tokens('Call mum in 0 minutes')).toEqual([]);
    expect(tokens('Call mum in 99 minutes')).toEqual(['time:in 99 minutes']);
    expect(tokens('Call mum in 100 minutes')).toEqual([]);
  });

  it('"in N days" is a date token that sets the date only', () => {
    expect(tokens('Call mum in 2 days')).toEqual(['date:in 2 days']);
    expect(ymd(parseDateTokenValue('in two days', new Date(2026, 9, 22, 10, 0))!)).toBe('2026-10-24');
    const result = computeTokenClickResult(parseTokens('Call mum in 2 days')[0], new Date(2026, 9, 22, 10, 0))!;
    expect(result.togglesOn).toEqual(['date']);
    expect(result.timeValue).toBeNull();
  });
});

describe('quarter-hour rounding (agreed table at 10:07)', () => {
  const at = new Date(2026, 9, 22, 10, 7);
  it.each([
    ['in 10 minutes', '10:15'],
    ['in 20 minutes', '10:30'],
    ['in 30 minutes', '10:30'],
    ['in an hour', '11:00'],
    ['in 2 hours', '12:00'],
  ])('%s gives %s', (text, expected) => {
    expect(relative(`Call mum ${text}`, at)).toBe(`2026-10-22 ${expected}`);
  });

  it('rounds an exact midpoint up', () => {
    const now = new Date(2026, 9, 22, 10, 0, 30);
    expect(hhmm(roundToQuarterHour(new Date(2026, 9, 22, 10, 7, 30), now))).toBe('10:15');
  });

  it('moves a result at or before now to the next quarter', () => {
    expect(relative('Call mum in 5 minutes', new Date(2026, 9, 22, 10, 2))).toBe('2026-10-22 10:15');
    expect(relative('Call mum in 1 minute', new Date(2026, 9, 22, 10, 0))).toBe('2026-10-22 10:15');
  });

  it('crosses the hour, midnight and the year', () => {
    expect(relative('Call mum in 10 minutes', new Date(2026, 9, 22, 10, 52))).toBe('2026-10-22 11:00');
    expect(relative('Call mum in 10 minutes', new Date(2026, 9, 22, 23, 52))).toBe('2026-10-23 00:00');
    expect(relative('Call mum in 2 hours', new Date(2026, 11, 31, 23, 0))).toBe('2027-01-01 01:00');
  });
});

describe('spoken clock times', () => {
  const morning = new Date(2026, 9, 22, 10, 0);
  const evening = new Date(2026, 9, 22, 17, 0);

  it('recognises o\'clock, half past, quarter past and to, and number words with am/pm', () => {
    expect(tokens('Call mum at 4 o\'clock')).toEqual(['time:4 o\'clock']);
    expect(tokens('Call mum at 4 o’clock')).toEqual(['time:4 o’clock']);
    expect(tokens('Call mum at half past four')).toEqual(['time:half past four']);
    expect(tokens('Call mum at quarter to five')).toEqual(['time:quarter to five']);
    expect(tokens('Call mum at four pm')).toEqual(['time:four pm']);
  });

  it('without am/pm uses the next occurrence after now', () => {
    expect(parseTimeTokenValue('4 o\'clock', morning)).toEqual({ hour: 16, minute: 0 });
    expect(parseTimeTokenValue('half past four', morning)).toEqual({ hour: 16, minute: 30 });
    expect(parseTimeTokenValue('4 o\'clock', evening)).toEqual({ hour: 4, minute: 0 });
    expect(parseTimeTokenValue('quarter to five', morning)).toEqual({ hour: 16, minute: 45 });
    expect(parseTimeTokenValue('quarter past nine', new Date(2026, 9, 22, 8, 0))).toEqual({ hour: 9, minute: 15 });
  });

  it('with am/pm is exact', () => {
    expect(parseTimeTokenValue('four pm', morning)).toEqual({ hour: 16, minute: 0 });
    expect(parseTimeTokenValue('half past four am', morning)).toEqual({ hour: 4, minute: 30 });
    expect(parseTimeTokenValue('12 o\'clock pm', morning)).toEqual({ hour: 12, minute: 0 });
  });
});

describe('the day after tomorrow', () => {
  it('wins over "tomorrow" and is two days ahead', () => {
    expect(tokens('Call mum the day after tomorrow')).toEqual(['date:the day after tomorrow']);
    expect(ymd(parseDateTokenValue('the day after tomorrow', new Date(2026, 9, 22, 10, 0))!)).toBe('2026-10-24');
  });
});

describe('explicit times with unsupported minutes', () => {
  it('finds 12-hour and 24-hour times off the quarter hour', () => {
    expect(findUnsupportedClockTime('Call mum at 4:10pm')).toEqual({ text: '4:10pm', hour: 16, minute: 10, is24Hour: false });
    expect(findUnsupportedClockTime('Call mum at 4:10 pm')).toMatchObject({ hour: 16, minute: 10, is24Hour: false });
    expect(findUnsupportedClockTime('Call mum at 16:10')).toEqual({ text: '16:10', hour: 16, minute: 10, is24Hour: true });
  });

  it('ignores supported minutes and text without times', () => {
    expect(findUnsupportedClockTime('Call mum at 4:15pm')).toBeNull();
    expect(findUnsupportedClockTime('Call mum at 16:45')).toBeNull();
    expect(findUnsupportedClockTime('Call mum at 4pm')).toBeNull();
    expect(findUnsupportedClockTime('Call mum')).toBeNull();
  });

  it('unsupported times are still not tokens (in-app behaviour unchanged)', () => {
    expect(tokens('Call mum at 4:10pm')).toEqual([]);
    expect(tokens('Call mum at 16:10')).toEqual([]);
  });
});

describe('existing tokens unchanged', () => {
  it.each([
    ['Call mum tomorrow at 4pm', ['date:tomorrow', 'time:4pm']],
    ['Call mum next Friday at 2pm', ['date:next Friday', 'time:2pm']],
    ['Call mum this evening', ['time:this evening']],
    ['Take pills every day', ['repeats:every day']],
    ['Book flights in two weeks', []],
  ])('%s', (text, expected) => {
    expect(tokens(text)).toEqual(expected);
  });
});
