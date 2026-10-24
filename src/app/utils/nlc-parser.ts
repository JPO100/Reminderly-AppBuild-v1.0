/**
 * NLC Parser — Natural Language Capture token extraction
 *
 * Deterministic, regex-based parser. No AI/NLP.
 * Returns token ranges + categories for recognised substrings.
 * Tokens map to exact substring ranges in the raw text.
 * Case-insensitive matching; displayed text stays as-typed.
 */

export type TokenCategory = 'date' | 'time' | 'repeats';

export type NlcRecognitionConfig = {
  date: boolean;
  time: boolean;
  repeats: boolean;
};

const ALL_RECOGNITION_ENABLED: NlcRecognitionConfig = { date: true, time: true, repeats: true };

export interface ParsedToken {
  category: TokenCategory;
  start: number;
  end: number;
  text: string;
}

// Weekday names as a regex fragment (case-insensitive via /i flag)
const WEEKDAY = '(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)';
const WEEKDAY_SHORT = '(?:mon|tue|wed|thu|thur|fri|sat|sun)';

// Month name → 1-based month number (short and full, lowercase)
export const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// All month name variants as regex fragment (case-insensitive via /i flag)
const MONTH_NAMES = '(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)';

// Weekday names that can lead a date ("Wednesday 4 November", "Wed, 4 Nov"); short forms only in this position
export const LEADING_WEEKDAY = '(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat|sun)';

// Words that must come before a numeric date with no year ("on 3/3"), so fractions and "24/7" never schedule
const YEARLESS_NUMERIC_LEAD = /\b(?:on|by|before|until|from|due|for)\s+$/i;

/** Two-digit years are 2000 + YY; four-digit years as given */
export function fullYear(value: string): number {
  const year = parseInt(value.replace(/^'/, ''), 10);
  return value.replace(/^'/, '').length === 2 ? 2000 + year : year;
}

// Spoken numbers one to twelve (Siri may pass words rather than digits)
export const NUMBER_WORD_TO_NUMBER: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const NUMBER_WORDS = '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';

/** A spoken amount: digits, a number word, or "a"/"an" (one). Null when not a number. */
export function spokenNumber(value: string): number | null {
  const lower = value.toLowerCase();
  if (lower === 'a' || lower === 'an') return 1;
  if (/^\d+$/.test(lower)) return parseInt(lower, 10);
  return NUMBER_WORD_TO_NUMBER[lower] ?? null;
}

// "in 10 minutes", "in an hour", "in two hours" (time) and "in 2 days" (date): amounts 1 to 99
const RELATIVE_AMOUNT = `(\\d{1,2}|${NUMBER_WORDS}|an?)`;
const RELATIVE_TIME_REGEX = new RegExp(`\\bin\\s+${RELATIVE_AMOUNT}\\s+(minutes?|mins?|hours?|hrs?)\\b`, 'gi');
const RELATIVE_DAYS_REGEX = new RegExp(`\\bin\\s+${RELATIVE_AMOUNT}\\s+days?\\b`, 'gi');

// Spoken clock times: "4 o'clock", "half past four", "quarter past 4", "quarter to five", optionally with am/pm
const CLOCK_HOUR = `(\\d{1,2}|${NUMBER_WORDS})`;
const SPOKEN_CLOCK_REGEX = new RegExp(
  `\\b(?:(half|quarter)\\s+(past|to)\\s+${CLOCK_HOUR}|${CLOCK_HOUR}\\s+o['’]?\\s?clock)(?:\\s*(am|pm)\\b)?`,
  'gi'
);
// A number word with am/pm: "four pm"
const WORD_AM_PM_REGEX = new RegExp(`\\b${NUMBER_WORDS}\\s*(?:am|pm)\\b`, 'gi');

function isRelativeAmount(value: string): boolean {
  const amount = spokenNumber(value);
  return amount !== null && amount >= 1 && amount <= 99;
}

/**
 * The first explicit clock time whose minutes are not 00, 15, 30 or 45 ("4:10pm", "16:10"), or null.
 * Matches the same 12-hour and 24-hour forms the time tokens use. Siri refuses these rather than rounding them.
 */
export function findUnsupportedClockTime(text: string): { text: string; hour: number; minute: number; is24Hour: boolean } | null {
  const patterns: { regex: RegExp; is24Hour: boolean }[] = [
    { regex: /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, is24Hour: false },
    { regex: /\b([01]?\d|2[0-3]):([0-5]\d)\b/g, is24Hour: true },
  ];
  for (const { regex, is24Hour } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      if (!is24Hour && (hour < 1 || hour > 12)) continue;
      if (minute > 59 || [0, 15, 30, 45].includes(minute)) continue;
      if (!is24Hour) {
        const period = match[3].toLowerCase();
        if (period === 'pm' && hour !== 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
      }
      return { text: match[0], hour, minute, is24Hour };
    }
  }
  return null;
}

/** Check if a month/day combination is valid (handles leap years) */
function isValidMonthDay(month: number, day: number, year: number): boolean {
  if (day < 1) return false;
  // Construct the date and verify it round-trips
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Parse reminder text and extract recognised tokens.
 *
 * Recognition scope (per spec):
 *
 * Date tokens:
 * - today, tomorrow
 * - weekday names (Monday…Sunday)
 * - next <weekday>
 * - "on <weekday>" — the token is just the weekday, "on" is context
 * - (the) day after tomorrow
 * - in N days (N 1-99, digits, one…twelve or "a")
 * - month-name dates either way round, optional ordinal, "of", "the", 4-digit or 2-digit year ("3rd of March '27")
 * - numeric dates, day first: D/M/YY(YY), D-M-YY(YY), D.M.YY(YY), YYYY-MM-DD, and D/M after on/by/before/until/from/due/for
 * - a weekday leading an absolute date joins it ("Wednesday 4 November"); the date decides the day
 *
 * Time tokens:
 * - Xam/pm, X:MMam/pm, X am/pm, X:MM am/pm, and number words ("four pm")
 * - HH:MM (24h) — only if hour 0-23 and minute 00/15/30/45
 * - Only recognised if minutes are 00, 15, 30, or 45
 * - X o'clock, half past X, quarter past X, quarter to X (optionally am/pm)
 * - in N minutes/mins/hours (N 1-99, digits, one…twelve or "a"/"an")
 *
 * Repeats tokens:
 * - every day, every week, every month, every hour
 * - every N days, every N weeks, every N months, every N hours
 * - every <weekday>
 * - weekdays
 * - daily, weekly, monthly, yearly, hourly
 * - Comma-separated short weekday lists: "Mon, Wed, Fri"
 */
export function parseTokens(text: string, recognition: NlcRecognitionConfig = ALL_RECOGNITION_ENABLED): ParsedToken[] {
  const candidates: ParsedToken[] = [];
  const timeOfDayCandidates: ParsedToken[] = [];

  // Helper to push all matches for a pattern
  const collect = (regex: RegExp, category: TokenCategory, validate?: (match: RegExpExecArray) => boolean) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (validate && !validate(match)) continue;
      candidates.push({
        category,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  };

  // Helper to push time-of-day matches (collected separately for suppression)
  const collectTimeOfDay = (regex: RegExp, validate?: (match: RegExpExecArray) => boolean) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (validate && !validate(match)) continue;
      timeOfDayCandidates.push({
        category: 'time',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  };

  // ── Repeats tokens (checked first so they win over bare weekday date tokens) ──

  if (!recognition.repeats) {
    // Skip all repeats collection
  } else {

  // "every <time-of-day>" (repeat daily with implied time)
  collect(/\bevery\s+(?:morning|afternoon|evening|night)\b/gi, 'repeats');

  // "every <weekday>"
  collect(new RegExp(`\\bevery\\s+${WEEKDAY}\\b`, 'gi'), 'repeats');

  // "every day/week/month/year/hour"
  collect(/\bevery\s+(?:day|week|month|year|hour)\b/gi, 'repeats');

  // "every N days/weeks/months/hours" (N >= 2)
  collect(/\bevery\s+\d+\s+(?:days?|weeks?|months?|hours?)\b/gi, 'repeats');

  // "weekdays" (standalone word)
  collect(/\bweekdays\b/gi, 'repeats');

  // "daily", "weekly", "monthly", "yearly", "hourly" (interval 1)
  collect(/\b(?:daily|weekly|monthly|yearly|hourly)\b/gi, 'repeats');

  // Comma-separated short weekday lists: "Mon, Wed, Fri" (2+ items)
  // Build regex dynamically: shortDay(, shortDay)+
  const commaListRegex = new RegExp(
    `\\b${WEEKDAY_SHORT}(?:\\s*,\\s*${WEEKDAY_SHORT})+\\b`,
    'gi'
  );
  collect(commaListRegex, 'repeats');

  } // end recognition.repeats

  // ── Date tokens ──

  if (!recognition.date) {
    // Skip all date collection
  } else {

  // "today", "tomorrow"
  collect(/\b(?:today|tomorrow)\b/gi, 'date');

  // "next <weekday>"
  collect(new RegExp(`\\bnext\\s+${WEEKDAY}\\b`, 'gi'), 'date');

  // "the day after tomorrow" (longer than "tomorrow", so it wins the overlap)
  collect(/\b(?:the\s+)?day\s+after\s+tomorrow\b/gi, 'date');

  // "in 2 days", "in two days", "in a day" (1 to 99)
  collect(RELATIVE_DAYS_REGEX, 'date', (match) => isRelativeAmount(match[1]));

  // Bare weekday names (will be deduplicated against repeats via overlap removal)
  collect(new RegExp(`\\b${WEEKDAY}\\b`, 'gi'), 'date');

  // Absolute dates (month-name and numeric), kept apart so a leading weekday can join them below
  const absoluteDates: ParsedToken[] = [];
  const pushAbsolute = (start: number, end: number) => {
    const token: ParsedToken = { category: 'date', start, end, text: text.slice(start, end) };
    candidates.push(token);
    absoluteDates.push(token);
  };

  // A day and month, with an optional year, that exists on the calendar (no year: this year or next, for rollover)
  const isRealDate = (day: number, month: number, year: number | null) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    if (year !== null) return isValidMonthDay(month, day, year);
    const thisYear = new Date().getFullYear();
    return isValidMonthDay(month, day, thisYear) || isValidMonthDay(month, day, thisYear + 1);
  };

  // A two-digit year after a month-name date, not a time or count ("3 Mar 10am", "3 Mar 10:30" keep 10 out)
  const TWO_DIGIT_YEAR = `'?(\\d{2})(?![\\d:]|\\s*(?:am|pm)\\b)`;

  // Month-name dates, both orders, with an optional year. The year joins the token only when the date is real in
  // that year; a two-digit year must not be in the past (so "3 Mar 20 people" is "3 Mar"). Rejects Feb 30, April 31.
  const collectMonthNameDates = (pattern: string, datePart: RegExp, fields: (m: RegExpExecArray) => { day: number; month: number; fourDigit?: string; twoDigit?: string }) => {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const { day, month, fourDigit, twoDigit } = fields(match);
      const year = fourDigit ? parseInt(fourDigit, 10) : twoDigit ? 2000 + parseInt(twoDigit, 10) : null;
      const yearOk = year !== null && isRealDate(day, month, year) && (!!fourDigit || year >= new Date().getFullYear());
      if (yearOk) pushAbsolute(match.index, match.index + match[0].length);
      else if (isRealDate(day, month, null)) pushAbsolute(match.index, match.index + datePart.exec(match[0])![0].length);
    }
  };

  // Month first: "February 28th", "Feb 28", "Feb 28 2027", "Mar 3rd 27", "Mar 3 '27", "Sept 3".
  // A two-digit year needs an ordinal or an apostrophe ("Mar 3 27" stays "Mar 3").
  collectMonthNameDates(
    `\\b(${MONTH_NAMES})\\s+(\\d{1,2})(st|nd|rd|th)?(?:\\s+(?:(\\d{4})|${TWO_DIGIT_YEAR}))?\\b`,
    new RegExp(`^${MONTH_NAMES}\\s+\\d{1,2}(?:st|nd|rd|th)?`, 'i'),
    (m) => ({
      day: parseInt(m[2], 10),
      month: MONTH_NAME_TO_NUMBER[m[1].toLowerCase()],
      fourDigit: m[4],
      twoDigit: m[5] && (m[3] || m[0].includes("'")) ? m[5] : undefined,
    }),
  );

  // Day first: "28 Feb", "28th February 2027", "3 Mar 27", "3rd March '27", "the 3rd of March"
  collectMonthNameDates(
    `\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_NAMES})(?:\\s+(?:(\\d{4})|${TWO_DIGIT_YEAR}))?\\b`,
    new RegExp(`^(?:the\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NAMES}`, 'i'),
    (m) => ({ day: parseInt(m[1], 10), month: MONTH_NAME_TO_NUMBER[m[2].toLowerCase()], fourDigit: m[3], twoDigit: m[4] }),
  );

  // Numeric dates, day first: "3/3/27", "03/03/2027", "3-3-27", "3.3.27", "2027-03-03", and "on 3/3" with no year.
  // Must start the text or follow a space or "(", and end before a space, punctuation or the end, so phone numbers,
  // versions, times ("3.30pm", "19:00") and runs like "12/12/12/12" never match. Dots need a year; no year needs "/".
  {
    const regex = /(^|[\s(])(\d{1,2})([/.-])(\d{1,2})(?:\3(\d{4}|\d{2}))?(?=$|[\s,;!?)]|\.(?:\s|$))/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index + match[1].length;
      const day = parseInt(match[2], 10);
      const month = parseInt(match[4], 10);
      const year = match[5] ? fullYear(match[5]) : null;
      if (year === null && (match[3] !== '/' || !YEARLESS_NUMERIC_LEAD.test(text.slice(0, start)))) continue;
      if (!isRealDate(day, month, year)) continue;
      pushAbsolute(start, match.index + match[0].length);
    }
    const iso = /(^|[\s(])(\d{4})-(\d{2})-(\d{2})(?=$|[\s,;!?)]|\.(?:\s|$))/g;
    while ((match = iso.exec(text)) !== null) {
      if (!isRealDate(parseInt(match[4], 10), parseInt(match[3], 10), parseInt(match[2], 10))) continue;
      pushAbsolute(match.index + match[1].length, match.index + match[0].length);
    }
  }

  // A weekday directly before an absolute date joins it as one token ("Wednesday 4 November", "Wed, 4/11/26").
  // The date decides the day; the weekday is not checked against it.
  for (const date of absoluteDates) {
    const lead = new RegExp(`\\b${LEADING_WEEKDAY}\\s*,?\\s+$`, 'i').exec(text.slice(0, date.start));
    if (lead) {
      candidates.push({ category: 'date', start: lead.index, end: date.end, text: text.slice(lead.index, date.end) });
    }
  }

  } // end recognition.date

  // ── Time tokens ──

  if (!recognition.time) {
    // Skip all time collection
  } else {

  // 12-hour: "7pm", "7:30pm", "7 pm", "7:30 pm", "12am"
  // Validate: hour 1-12, minutes (if present) must be 00/15/30/45
  collect(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi,
    'time',
    (match) => {
      const hour = parseInt(match[1], 10);
      if (hour < 1 || hour > 12) return false;
      if (match[2]) {
        const min = parseInt(match[2], 10);
        if (![0, 15, 30, 45].includes(min)) return false;
      }
      return true;
    }
  );

  // 24-hour: "19:00", "07:30", "00:00"
  // Validate: hour 0-23, minutes must be 00/15/30/45
  collect(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/g,
    'time',
    (match) => {
      const hour = parseInt(match[1], 10);
      const min = parseInt(match[2], 10);
      if (hour < 0 || hour > 23) return false;
      if (![0, 15, 30, 45].includes(min)) return false;
      return true;
    }
  );

  // Relative times: "in 10 minutes", "in 30 mins", "in an hour", "in two hours" (1 to 99)
  collect(RELATIVE_TIME_REGEX, 'time', (match) => isRelativeAmount(match[1]));

  // Spoken clock times: "4 o'clock", "half past four", "quarter to five" (hour 1-12)
  collect(SPOKEN_CLOCK_REGEX, 'time', (match) => {
    const hour = spokenNumber(match[3] ?? match[4]);
    return hour !== null && hour >= 1 && hour <= 12;
  });

  // Number words with am/pm: "four pm"
  collect(WORD_AM_PM_REGEX, 'time');

  // ── Time-of-day tokens (collected separately for suppression) ──

  // Compound tokens: "this morning", "this afternoon", "this evening" (checked first — longer match)
  collectTimeOfDay(/\bthis\s+(?:morning|afternoon|evening)\b/gi);

  // "tonight" (standalone compound — implies today + 21:00)
  collectTimeOfDay(/\btonight\b/gi);

  // Standalone time-of-day tokens: morning, lunchtime, noon, afternoon, evening, night
  collectTimeOfDay(/\b(?:morning|lunchtime|noon|afternoon|evening|night)\b/gi);

  // ── Explicit time suppression ──
  //
  // If any explicit clock time token exists (12h or 24h format),
  // time-of-day tokens are suppressed — they must not highlight,
  // be eligible, or be clickable.
  const hasExplicitTime = candidates.some(c => c.category === 'time');
  if (!hasExplicitTime) {
    candidates.push(...timeOfDayCandidates);
  }

  } // end recognition.time

  // ── Repeat-suppresses-date suppression ──
  //
  // If any "every …" repeat token exists, date-category tokens are suppressed.
  // Repeat tokens dominate one-off date tokens. Date tokens must not highlight,
  // be eligible, or be clickable when a repeat token is present.
  // Explicit time tokens are NOT suppressed by repeat tokens.
  const hasRepeatToken = candidates.some(c => c.category === 'repeats');
  const finalCandidates = hasRepeatToken
    ? candidates.filter(c => c.category !== 'date')
    : candidates;

  // ── Overlap resolution ──
  //
  // Rule: if a substring is part of a longer match (e.g. "Wednesday" inside
  // "every Wednesday"), only the longer match is emitted — no duplicate blue
  // spans on the same characters. Separate tokens elsewhere in the string
  // (e.g. "next Friday") are unaffected and still emitted independently.
  // No further precedence rules beyond avoiding overlapping spans.

  // Sort by start position; for same start, prefer longer match
  finalCandidates.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Remove overlaps: greedy left-to-right, keep first non-overlapping
  const result: ParsedToken[] = [];
  let lastEnd = 0;
  for (const token of finalCandidates) {
    if (token.start >= lastEnd) {
      result.push(token);
      lastEnd = token.end;
    }
  }

  return result;
}