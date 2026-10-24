import { describe, it, expect } from 'vitest';
import { parseTokens } from '../utils/nlc-parser';
import { parseDateTokenValue, parseRepeatsTokenValue } from '../utils/nlc-interaction';

// NLC numeric dates and date format gaps, Stage 1 (docs/plans/nlc-titles-and-dates.md, section 2.4 and condition 3)

const NOW = new Date(2026, 9, 24, 10, 0); // Saturday 24 October 2026
const dates = (text: string) => parseTokens(text).filter((t) => t.category === 'date').map((t) => t.text);
const ymd = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null;
const value = (text: string) => {
  const token = parseTokens(text).find((t) => t.category === 'date');
  return token ? ymd(parseDateTokenValue(token.text, NOW)) : null;
};

describe('numeric dates, day first', () => {
  it('D/M/YYYY, DD/MM/YYYY, D/M/YY and DD/MM/YY', () => {
    expect(dates('Dentist 3/3/2027')).toEqual(['3/3/2027']);
    expect(value('Dentist 3/3/2027')).toBe('2027-03-03');
    expect(value('Dentist 03/03/2027')).toBe('2027-03-03');
    expect(value('Dentist 3/3/27')).toBe('2027-03-03');
    expect(value('Dentist 03/03/27')).toBe('2027-03-03');
    expect(value('Dentist 25/12/26')).toBe('2026-12-25');
  });

  it('dashes and dots, with a year', () => {
    expect(value('Dentist 3-3-27')).toBe('2027-03-03');
    expect(value('Dentist 03-03-2027')).toBe('2027-03-03');
    expect(value('Dentist 3.3.27')).toBe('2027-03-03');
    expect(value('Dentist 03.03.2027')).toBe('2027-03-03');
  });

  it('ISO YYYY-MM-DD', () => {
    expect(dates('Dentist 2027-03-03')).toEqual(['2027-03-03']);
    expect(value('Dentist 2027-03-03')).toBe('2027-03-03');
  });

  it('no year: slash only, after on/by/before/until/from/due/for, next occurrence', () => {
    expect(value('Pay rent on 3/3')).toBe('2027-03-03');
    expect(value('Pay rent by 30/11')).toBe('2026-11-30');
    expect(dates('Pay rent 3/3')).toEqual([]);
    expect(dates('Pay rent on 3-3')).toEqual([]);
    expect(dates('Pay rent on 3.3')).toEqual([]);
  });

  it('works next to times and punctuation', () => {
    expect(parseTokens('Dentist 3/3/27 at 3pm').map((t) => `${t.category}:${t.text}`)).toEqual(['date:3/3/27', 'time:3pm']);
    expect(dates('Dentist (3/3/27)')).toEqual(['3/3/27']);
    expect(dates('Dentist on 3/3/27.')).toEqual(['3/3/27']);
    expect(dates('Dentist 3/3/27, bring forms')).toEqual(['3/3/27']);
  });
});

describe('numeric dates fail safely (condition 3)', () => {
  it('invalid calendar dates are not tokens', () => {
    for (const text of ['Dentist 31/4/27', 'Dentist 29/2/2027', 'Dentist 0/3/27', 'Dentist 3/13/27', 'Pay rent on 31/4', 'Dentist 2027-02-30']) {
      expect(dates(text)).toEqual([]);
    }
    expect(value('Dentist 29/2/2028')).toBe('2028-02-29');
  });

  it('phone numbers', () => {
    for (const text of ['Call 07700 900123', 'Call 0161 496 0000', 'Call +44 20 7946 0000', 'Call 0161-496-0000']) {
      expect(parseTokens(text)).toEqual([]);
    }
  });

  it('fractions, scores, "24/7" and versions', () => {
    for (const text of ['Buy 1/2 price shoes', 'Add 3/4 cup flour', 'We won 3-2', 'Shop open 24/7', 'Update to v2.1.3', 'Update to v2.1.30', 'Rate 1/2/3/4']) {
      expect(dates(text)).toEqual([]);
    }
  });

  it('dotted and colon times stay times', () => {
    expect(parseTokens('Call at 3.30').map((t) => t.category)).not.toContain('date');
    expect(parseTokens('Call at 3.30pm').map((t) => t.category)).not.toContain('date');
    expect(parseTokens('Call at 3:30pm').map((t) => `${t.category}:${t.text}`)).toEqual(['time:3:30pm']);
  });

  it('dates inside longer runs are not tokens', () => {
    expect(dates('Code 12/12/12/12')).toEqual([]);
    expect(dates('Ref 123/4/27')).toEqual([]);
    expect(dates('Ref 3/3/2027/1')).toEqual([]);
  });
});

describe('month-name gaps', () => {
  it('two-digit years after the day', () => {
    expect(dates('Renew 3 Mar 27')).toEqual(['3 Mar 27']);
    expect(value('Renew 3 Mar 27')).toBe('2027-03-03');
    expect(value("Renew 3rd March '27")).toBe('2027-03-03');
  });

  it('two-digit years after the month need an ordinal or apostrophe', () => {
    expect(value('Renew Mar 3rd 27')).toBe('2027-03-03');
    expect(value("Renew Mar 3 '27")).toBe('2027-03-03');
    expect(dates('Renew Mar 3 27')).toEqual(['Mar 3']);
  });

  it('a two-digit number that is not a year stays out of the token', () => {
    expect(dates('Party 3 Mar 20 people')).toEqual(['3 Mar']);
    expect(parseTokens('Renew 3 Mar 10am').map((t) => `${t.category}:${t.text}`)).toEqual(['date:3 Mar', 'time:10am']);
    expect(dates('Renew 3 Mar 10:30')).toEqual(['3 Mar']);
  });

  it('"of" and "the"', () => {
    expect(dates('Renew on the 3rd of March')).toEqual(['the 3rd of March']);
    expect(value('Renew on the 3rd of March')).toBe('2027-03-03');
    expect(value('Renew 3rd of March 2028')).toBe('2028-03-03');
  });

  it('"Sept"', () => {
    expect(value('Renew Sept 3')).toBe('2027-09-03');
    expect(value('Renew 3 Sept')).toBe('2027-09-03');
    expect(value('Renew 3rd Sept 2027')).toBe('2027-09-03');
  });

  it('existing forms unchanged', () => {
    expect(value('Renew March 3rd 2027')).toBe('2027-03-03');
    expect(value('Renew 3 Mar 2027')).toBe('2027-03-03');
    expect(value('Renew Feb 28')).toBe('2027-02-28');
    expect(value('Renew 30 Oct')).toBe('2026-10-30');
    expect(dates('Renew 30 Feb')).toEqual([]);
  });
});

describe('weekday with a date (D8: the date wins)', () => {
  it('is one token', () => {
    expect(dates('Call mum Wednesday 4 November')).toEqual(['Wednesday 4 November']);
    expect(dates('Call mum Wed 4 Nov')).toEqual(['Wed 4 Nov']);
    expect(dates('Call mum Wednesday, 4 November')).toEqual(['Wednesday, 4 November']);
    expect(dates('Call mum Wednesday the 4th of November')).toEqual(['Wednesday the 4th of November']);
    expect(dates('Call mum Wed 4/11/26')).toEqual(['Wed 4/11/26']);
  });

  it('takes its day from the date', () => {
    expect(value('Call mum Wednesday 4 November')).toBe('2026-11-04');
    expect(value('Call mum Wednesday 5 November')).toBe('2026-11-05');
    expect(value('Call mum Wed 4/11/26')).toBe('2026-11-04');
  });

  it('a weekday on its own is unchanged', () => {
    expect(dates('Call mum Wednesday')).toEqual(['Wednesday']);
    expect(dates('Call mum Wed')).toEqual([]);
  });
});

describe('one-word repeats (D9)', () => {
  it('daily, weekly, monthly, yearly and hourly', () => {
    const repeat = (text: string) => {
      const token = parseTokens(text).find((t) => t.category === 'repeats')!;
      return parseRepeatsTokenValue(token.text)!.config;
    };
    expect(repeat('Take tablets daily')).toEqual({ frequency: 'daily', interval: 1 });
    expect(repeat('Clean the car weekly')).toEqual({ frequency: 'weekly', interval: 1 });
    expect(repeat('Pay rent monthly')).toEqual({ frequency: 'monthly', interval: 1 });
    expect(repeat('Renew insurance yearly')).toEqual({ frequency: 'yearly', interval: 1 });
    expect(repeat('Drink water hourly')).toEqual({ frequency: 'hourly', interval: 1 });
  });

  it('a repeat still hides date tokens', () => {
    expect(parseTokens('Pay rent monthly from 3/3/27').map((t) => t.category)).toEqual(['repeats']);
  });
});
