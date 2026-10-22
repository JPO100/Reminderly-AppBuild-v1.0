/**
 * NLC Interaction Logic — Pure Functions
 *
 * Extracted from NewReminderOverlay.tsx for deterministic testing.
 * All functions are data-in, data-out. No React state, no refs, no DOM.
 *
 * Three concerns:
 *   1. Eligibility filtering (one-active-token-per-category)
 *   2. Token click result computation (what toggles/values change)
 *   3. Invalidation (applied token validation after text edits)
 *   4. Save behaviour (schedule kind derivation)
 *   5. Auto-apply (mode: 'auto')
 */

import type { ParsedToken, TokenCategory, NlcRecognitionConfig } from './nlc-parser';
import { MONTH_NAME_TO_NUMBER, spokenNumber } from './nlc-parser';
import type { RepeatConfig } from '../reminder-utils';

// ============================================================================
// Types
// ============================================================================

export type NlcMode = 'click' | 'auto';

export type NlcConfig = {
  autoParsingEnabled: boolean;
  clickParsingEnabled: boolean;
  recognition: NlcRecognitionConfig;
};

export type AppliedTokens = Record<TokenCategory, ParsedToken | null>;

export interface TokenClickResult {
  /** Which toggles to turn ON (only additions, never turns anything off) */
  togglesOn: ('date' | 'time' | 'repeats')[];
  /** Date value to set, or null if no date change */
  dateValue: Date | null;
  /** Time value to set, or null if no time change */
  timeValue: { hour: number; minute: number } | null;
  /** RepeatConfig to set, or null if no repeat change */
  repeatConfig: RepeatConfig;
}

export interface InvalidationResult {
  /** Updated applied tokens map (nulled where invalidated, range-updated where relocated) */
  newApplied: AppliedTokens;
  /** Categories that were invalidated (toggle off + clear value) */
  invalidated: TokenCategory[];
}

export interface AutoApplyAction {
  category: TokenCategory;
  token: ParsedToken;
}

// ============================================================================
// Constants (shared with NewReminderOverlay value extraction)
// ============================================================================

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const FULL_DAY_TO_JS_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

const SHORT_DAY_TO_FULL: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', thur: 'Thursday', fri: 'Friday',
  sat: 'Saturday', sun: 'Sunday',
};

// Time-of-day fixed mappings (standalone + compound tokens)
const TIME_OF_DAY_MAP: Record<string, { hour: number; minute: number }> = {
  'morning': { hour: 7, minute: 0 },
  'lunchtime': { hour: 12, minute: 0 },
  'noon': { hour: 12, minute: 0 },
  'afternoon': { hour: 15, minute: 0 },
  'evening': { hour: 18, minute: 0 },
  'night': { hour: 21, minute: 0 },
  'this morning': { hour: 7, minute: 0 },
  'this afternoon': { hour: 15, minute: 0 },
  'this evening': { hour: 18, minute: 0 },
  'tonight': { hour: 21, minute: 0 },
};

// Compound time-of-day tokens that imply date = today
const COMPOUND_TIME_TOKENS = new Set(['this morning', 'this afternoon', 'this evening', 'tonight']);

/** Check if a time token text represents a compound token (implies date = today) */
export function isCompoundTimeToken(tokenText: string): boolean {
  const normalised = tokenText.toLowerCase().trim().replace(/\s+/g, ' ');
  return COMPOUND_TIME_TOKENS.has(normalised);
}

// Time-of-day fixed mappings for "every <time-of-day>" repeat tokens
const EVERY_TIME_OF_DAY_MAP: Record<string, { hour: number; minute: number }> = {
  'morning': { hour: 7, minute: 0 },
  'afternoon': { hour: 15, minute: 0 },
  'evening': { hour: 18, minute: 0 },
  'night': { hour: 21, minute: 0 },
};

// ============================================================================
// Value extraction helpers (pure, moved from NewReminderOverlay.tsx)
// ============================================================================

/** Get next date (including today) that falls on one of the given JS day indices (0=Sun...6=Sat) */
export function getNextDayOccurrence(from: Date, dayIndices: number[]): Date {
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    if (dayIndices.includes(candidate.getDay())) {
      return candidate;
    }
  }
  return new Date(from); // fallback
}

/** Parse a date token's text into a Date value */
export function parseDateTokenValue(tokenText: string, now: Date = new Date()): Date | null {
  const lower = tokenText.toLowerCase().trim();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (lower === 'today') return today;

  // "(the) day after tomorrow"
  if (/^(?:the\s+)?day\s+after\s+tomorrow$/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }

  // "in 2 days": date only
  const inDays = /^in\s+(\S+)\s+days?$/.exec(lower);
  if (inDays) {
    const days = spokenNumber(inDays[1]);
    if (days === null) return null;
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  }

  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Month-name dates: "February 28", "Feb 28th", "Feb 28 2027", etc.
  const monthDateMatch = /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/i.exec(lower);
  if (monthDateMatch) {
    const monthNum = MONTH_NAME_TO_NUMBER[monthDateMatch[1]];
    if (monthNum !== undefined) {
      const day = parseInt(monthDateMatch[2], 10);
      let year: number;
      if (monthDateMatch[3]) {
        // Explicit year — use as-is, no rollover
        year = parseInt(monthDateMatch[3], 10);
      } else {
        year = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        if (monthNum < todayMonth || (monthNum === todayMonth && day < todayDay)) {
          year += 1;
        }
      }
      const candidate = new Date(year, monthNum - 1, day);
      if (candidate.getFullYear() === year && candidate.getMonth() === monthNum - 1 && candidate.getDate() === day) {
        candidate.setHours(0, 0, 0, 0);
        return candidate;
      }
      return null;
    }
  }

  // Day-first month-name dates: "28 Feb", "28th February", "28 Feb 2027", etc.
  const dayMonthMatch = /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?$/i.exec(lower);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthNum = MONTH_NAME_TO_NUMBER[dayMonthMatch[2]];
    if (monthNum !== undefined) {
      let year: number;
      if (dayMonthMatch[3]) {
        year = parseInt(dayMonthMatch[3], 10);
      } else {
        year = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        if (monthNum < todayMonth || (monthNum === todayMonth && day < todayDay)) {
          year += 1;
        }
      }
      const candidate = new Date(year, monthNum - 1, day);
      if (candidate.getFullYear() === year && candidate.getMonth() === monthNum - 1 && candidate.getDate() === day) {
        candidate.setHours(0, 0, 0, 0);
        return candidate;
      }
      return null;
    }
  }

  const hasNext = lower.startsWith('next ');
  const dayName = hasNext ? lower.slice(5).trim() : lower;
  const dayIndex = FULL_DAY_TO_JS_INDEX[dayName];
  if (dayIndex === undefined) return null;

  const todayDow = today.getDay();
  let daysAhead = dayIndex - todayDow;
  if (daysAhead <= 0) daysAhead += 7;

  // "next X" always means at least 7 days out (skip this week's occurrence)
  if (hasNext && daysAhead < 7) daysAhead += 7;
  // Bare weekday: allow today as valid (offset 0) — recalculate
  if (!hasNext) {
    daysAhead = dayIndex - todayDow;
    if (daysAhead < 0) daysAhead += 7;
    // daysAhead === 0 means today, which is valid for bare weekday
  }

  const result = new Date(today);
  result.setDate(today.getDate() + daysAhead);
  return result;
}

const QUARTER_MS = 15 * 60 * 1000;

/**
 * Round a relative time to the nearest quarter hour (midpoint up). A result at or before now
 * moves to the next quarter, so the reminder is always in the future.
 */
export function roundToQuarterHour(target: Date, now: Date): Date {
  const rounded = new Date(target);
  const minutes = rounded.getMinutes() + rounded.getSeconds() / 60 + rounded.getMilliseconds() / 60000;
  const quarter = Math.floor(minutes / 15);
  rounded.setMinutes(quarter * 15 + (minutes - quarter * 15 >= 7.5 ? 15 : 0), 0, 0);
  while (rounded.getTime() <= now.getTime()) rounded.setTime(rounded.getTime() + QUARTER_MS);
  return rounded;
}

/** "in 10 minutes", "in an hour": the rounded date and time from now, or null for any other token */
export function parseRelativeTimeValue(tokenText: string, now: Date): { date: Date; time: { hour: number; minute: number } } | null {
  const match = /^in\s+(\S+)\s+(minutes?|mins?|hours?|hrs?)$/i.exec(tokenText.trim().replace(/\s+/g, ' '));
  if (!match) return null;
  const amount = spokenNumber(match[1]);
  if (amount === null) return null;
  const unitMs = match[2].toLowerCase().startsWith('h') ? 60 * 60 * 1000 : 60 * 1000;
  const at = roundToQuarterHour(new Date(now.getTime() + amount * unitMs), now);
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return { date, time: { hour: at.getHours(), minute: at.getMinutes() } };
}

/** Parse a time token's text into { hour, minute } */
export function parseTimeTokenValue(tokenText: string, now: Date = new Date()): { hour: number; minute: number } | null {
  const lower = tokenText.toLowerCase().trim().replace(/\u2019/g, "'");

  const relative = parseRelativeTimeValue(lower, now);
  if (relative) return relative.time;

  // Number word with am/pm: "four pm"
  const wordAmPm = /^([a-z]+)\s*(am|pm)$/.exec(lower);
  if (wordAmPm) {
    const word = spokenNumber(wordAmPm[1]);
    if (word === null) return null;
    return parseTimeTokenValue(`${word}${wordAmPm[2]}`, now);
  }

  // Spoken clock: "4 o'clock", "half past four", "quarter past 4", "quarter to five" (optionally am/pm)
  const spoken = /^(?:(half|quarter)\s+(past|to)\s+(\S+)|(\S+)\s+o'?\s?clock)(?:\s*(am|pm))?$/.exec(lower);
  if (spoken) {
    const named = spokenNumber(spoken[3] ?? spoken[4]);
    if (named === null) return null;
    let hour = named % 12;
    let minute = 0;
    if (spoken[1] === 'half') minute = 30;
    else if (spoken[1] === 'quarter' && spoken[2] === 'past') minute = 15;
    else if (spoken[1] === 'quarter') { minute = 45; hour = (hour + 11) % 12; }
    if (spoken[5]) return { hour: spoken[5] === 'pm' ? hour + 12 : hour, minute };
    // No am/pm: the next occurrence of that clock time after now
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const am = hour * 60 + minute;
    const pm = am + 12 * 60;
    const next = [am, pm].find(m => m > nowMinutes) ?? am;
    return { hour: Math.floor(next / 60), minute: next % 60 };
  }

  // 12-hour: "7pm", "7:30pm", "7 pm"
  const match12 = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/.exec(lower);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];

    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;

    return { hour, minute };
  }

  // 24-hour: "19:00", "07:30"
  const match24 = /^(\d{1,2}):(\d{2})$/.exec(lower);
  if (match24) {
    return { hour: parseInt(match24[1], 10), minute: parseInt(match24[2], 10) };
  }

  // Time-of-day fixed mappings (standalone + compound tokens)
  const normalised = lower.replace(/\s+/g, ' ');
  const timeOfDay = TIME_OF_DAY_MAP[normalised];
  if (timeOfDay) {
    return timeOfDay;
  }

  return null;
}

/** Parse a repeats token's text into RepeatConfig + anchor date + optional implied time */
export function parseRepeatsTokenValue(tokenText: string): { config: RepeatConfig; anchorDate: Date; impliedTime: { hour: number; minute: number } | null } | null {
  const lower = tokenText.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // "weekdays"
  if (lower === 'weekdays') {
    return {
      config: { frequency: 'custom-days', interval: 5, selectedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
      anchorDate: getNextDayOccurrence(today, [1, 2, 3, 4, 5]),
      impliedTime: null,
    };
  }

  // Comma-separated short weekday list: "Mon, Wed, Fri"
  const commaParts = lower.split(/\s*,\s*/);
  if (commaParts.length >= 2 && commaParts.every(p => SHORT_DAY_TO_FULL[p] !== undefined)) {
    const selectedDays = commaParts.map(p => SHORT_DAY_TO_FULL[p]);
    const dayIndices = selectedDays.map(d => FULL_DAY_TO_JS_INDEX[d.toLowerCase()]).filter((d): d is number => d !== undefined);
    return {
      config: { frequency: 'custom-days', interval: selectedDays.length, selectedDays },
      anchorDate: getNextDayOccurrence(today, dayIndices),
      impliedTime: null,
    };
  }

  // "every N days/weeks/months/hours"
  const everyNMatch = /^every\s+(\d+)\s+(days?|weeks?|months?|hours?)$/.exec(lower);
  if (everyNMatch) {
    const n = parseInt(everyNMatch[1], 10);
    const unit = everyNMatch[2].replace(/s$/, '');
    const freqMap: Record<string, 'hourly' | 'daily' | 'weekly' | 'monthly'> = {
      day: 'daily', week: 'weekly', month: 'monthly', hour: 'hourly',
    };
    const freq = freqMap[unit];
    if (freq) {
      return { config: { frequency: freq, interval: n }, anchorDate: new Date(today), impliedTime: null };
    }
  }

  // "every <word>" — weekday, period, or time-of-day
  const everyWordMatch = /^every\s+(\w+)$/.exec(lower);
  if (everyWordMatch) {
    const word = everyWordMatch[1];

    // Check if it's a weekday name
    if (WEEKDAY_NAMES.includes(word)) {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      const dayIndex = FULL_DAY_TO_JS_INDEX[word];
      return {
        config: { frequency: 'custom-days', interval: 1, selectedDays: [capitalized] },
        anchorDate: getNextDayOccurrence(today, [dayIndex]),
        impliedTime: null,
      };
    }

    // "every day/week/month/year/hour"
    const freqMap: Record<string, 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'> = {
      day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly', hour: 'hourly',
    };
    const freq = freqMap[word];
    if (freq) {
      return { config: { frequency: freq, interval: 1 }, anchorDate: new Date(today), impliedTime: null };
    }

    // "every <time-of-day>" (morning, afternoon, evening, night)
    const impliedTime = EVERY_TIME_OF_DAY_MAP[word];
    if (impliedTime) {
      return {
        config: { frequency: 'daily', interval: 1 },
        anchorDate: new Date(today),
        impliedTime,
      };
    }
  }

  return null;
}

/** Extract implied time from a repeats token text, or null if none */
export function getRepeatsImpliedTime(tokenText: string): { hour: number; minute: number } | null {
  const lower = tokenText.toLowerCase().trim();
  const everyWordMatch = /^every\s+(\w+)$/.exec(lower);
  if (!everyWordMatch) return null;
  return EVERY_TIME_OF_DAY_MAP[everyWordMatch[1]] ?? null;
}

// ============================================================================
// 1. Eligibility filtering
// ============================================================================

/**
 * Compute which parsed tokens are eligible for display/click.
 *
 * Rule: If no token has been applied in a category, all tokens in that
 * category are eligible. Once a token is applied, only that exact token
 * (same start, end, text) remains eligible — all others are hidden.
 */
export function computeEligibleTokens(
  parsedTokens: ParsedToken[],
  appliedTokens: AppliedTokens,
): ParsedToken[] {
  return parsedTokens.filter((token) => {
    const applied = appliedTokens[token.category];
    if (!applied) return true;
    return token.start === applied.start && token.end === applied.end && token.text === applied.text;
  });
}

// ============================================================================
// 2. Token click result
// ============================================================================

/**
 * Compute the state changes that should occur when a user clicks a token.
 *
 * Pure function — returns a description of changes, does not mutate state.
 * Returns null if the token's value cannot be parsed (defensive).
 *
 * For standalone time tokens, the pure function returns togglesOn: ['time'] only.
 * The time-implies-date invariant (setting date=today when date toggle is off)
 * is enforced in the applyToken path, not here.
 *
 * Compound time tokens (this morning, tonight, etc.) return togglesOn: ['time', 'date']
 * with dateValue=today, mirroring repeats-implies-date.
 */
export function computeTokenClickResult(token: ParsedToken, now: Date = new Date()): TokenClickResult | null {
  switch (token.category) {
    case 'date': {
      const date = parseDateTokenValue(token.text, now);
      if (!date) return null;
      return {
        togglesOn: ['date'],
        dateValue: date,
        timeValue: null,
        repeatConfig: null,
      };
    }
    case 'time': {
      // Relative times ("in an hour") set the date as well, which can be tomorrow
      const relative = parseRelativeTimeValue(token.text, now);
      if (relative) {
        return {
          togglesOn: ['time', 'date'],
          dateValue: relative.date,
          timeValue: relative.time,
          repeatConfig: null,
        };
      }

      const time = parseTimeTokenValue(token.text, now);
      if (!time) return null;

      // Compound tokens (this morning, tonight, etc.) imply date = today
      if (isCompoundTimeToken(token.text)) {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return {
          togglesOn: ['time', 'date'],
          dateValue: today,
          timeValue: time,
          repeatConfig: null,
        };
      }

      return {
        togglesOn: ['time'],
        dateValue: null,
        timeValue: time,
        repeatConfig: null,
      };
    }
    case 'repeats': {
      const result = parseRepeatsTokenValue(token.text);
      if (!result) return null;
      const togglesOn: ('date' | 'time' | 'repeats')[] = ['repeats', 'date'];
      if (result.impliedTime) {
        togglesOn.push('time');
      }
      return {
        togglesOn,
        dateValue: result.anchorDate,
        timeValue: result.impliedTime,
        repeatConfig: result.config,
      };
    }
  }
}

// ============================================================================
// 3. Invalidation
// ============================================================================

/**
 * Compute invalidation after text changes cause a new parse.
 *
 * For each applied token, applies the 4-step rule:
 *   1. Same text at same range → still valid, no change.
 *   2. Same text exists exactly once at a different range → update range.
 *   3. Same text exists zero times → invalidate.
 *   4. Same text exists more than once at different ranges → invalidate (ambiguity).
 *
 * Returns the updated applied tokens and which categories were invalidated.
 * Does NOT handle cascaded invalidation (e.g. repeats invalidation clearing date) —
 * that is the caller's responsibility, matching the existing UI logic.
 */
export function computeInvalidation(
  prevApplied: AppliedTokens,
  parsedTokens: ParsedToken[],
): InvalidationResult {
  const newApplied: AppliedTokens = { ...prevApplied };
  const invalidated: TokenCategory[] = [];

  for (const category of ['date', 'time', 'repeats'] as TokenCategory[]) {
    const applied = prevApplied[category];
    if (!applied) continue;

    // 1. Exact match at original range
    const exactMatch = parsedTokens.some(
      t => t.category === category &&
           t.start === applied.start &&
           t.end === applied.end &&
           t.text === applied.text,
    );
    if (exactMatch) continue;

    // Count same-text occurrences in same category
    const sameTextTokens = parsedTokens.filter(
      t => t.category === category && t.text === applied.text,
    );

    if (sameTextTokens.length === 1) {
      // 2. Exactly one occurrence elsewhere → update range
      newApplied[category] = sameTextTokens[0];
    } else {
      // 3 & 4. Zero or multiple → invalidate
      newApplied[category] = null;
      invalidated.push(category);
    }
  }

  return { newApplied, invalidated };
}

// ============================================================================
// 4. Save behaviour (schedule kind derivation)
// ============================================================================

/**
 * Determine the schedule kind based on toggle state.
 *
 * If date is on and a date value exists → "scheduled".
 * Otherwise → "sometime" (no structured date/time applied).
 *
 * This is the pure decision the UI component uses at save time.
 */
export function computeScheduleKind(
  isDateOn: boolean,
  selectedDate: Date | null,
): 'scheduled' | 'sometime' {
  if (isDateOn && selectedDate) return 'scheduled';
  return 'sometime';
}

// ============================================================================
// 5. Auto-apply (mode: 'auto')
// ============================================================================

/**
 * Compute which categories should be auto-applied given the current parsed tokens
 * and toggle state.
 *
 * Rules (conservative, deterministic):
 * - Per category: only auto-apply when exactly one token exists AND the toggle is OFF.
 * - If 0 tokens in a category: do nothing.
 * - If 2+ tokens in a category: do not auto-apply (ambiguous).
 * - Repeats implies date: if repeats auto-applies, date is handled by repeats
 *   (anchor date derivation). A separate date token is NOT also auto-applied.
 * - For repeats to auto-apply, both repeats AND date toggles must be OFF
 *   (to avoid overwriting a user-set date).
 *
 * Returns an ordered list of actions. The caller applies them like synthetic clicks.
 */
export function computeAutoApplyResult(
  parsedTokens: ParsedToken[],
  currentToggles: { date: boolean; time: boolean; repeats: boolean },
): AutoApplyAction[] {
  const actions: AutoApplyAction[] = [];

  // Group tokens by category
  const byCategory: Record<TokenCategory, ParsedToken[]> = { date: [], time: [], repeats: [] };
  for (const token of parsedTokens) {
    byCategory[token.category].push(token);
  }

  // Repeats: exactly 1 token, repeats OFF, date OFF (repeats implies date)
  let repeatsApplying = false;
  if (byCategory.repeats.length === 1 && !currentToggles.repeats && !currentToggles.date) {
    actions.push({ category: 'repeats', token: byCategory.repeats[0] });
    repeatsApplying = true;
  }

  // Date: exactly 1 token, date OFF, and repeats is not already handling date
  if (byCategory.date.length === 1 && !currentToggles.date && !repeatsApplying) {
    actions.push({ category: 'date', token: byCategory.date[0] });
  }

  // Time: exactly 1 token, time OFF
  if (byCategory.time.length === 1 && !currentToggles.time) {
    actions.push({ category: 'time', token: byCategory.time[0] });
  }

  return actions;
}