/**
 * normaliseReminderText — post-processing step for reminder display text.
 *
 * Replaces relative date/time phrases with absolute equivalents once a
 * concrete schedule date exists. Pure function, no side effects, no
 * dependencies on React or NLC parser.
 */

import type { ReminderSchedule } from '../reminder-utils';
import type { RepeatRule } from '../types/reminder';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

// A connector directly before a removed token ("at 3pm", "on Monday", "in an hour")
const CONNECTOR_BEFORE = /\b(?:at|on|in)\s+$/i;
// What may sit between two tokens for them to count as next to each other: spaces, a comma, a connector
const TOKEN_GAP = /^\s*,?\s*(?:(?:at|on|in)\s+)?$/i;

/**
 * The task-only title for text whose date, time and repeat tokens NLC applied (docs/plans/nlc-titles-and-dates.md,
 * 2.1). Only the applied tokens passed in are removed, each with a directly preceding at/on/in, and only when the
 * token ends the text, follows at/on/in, or sits next to another removed token, so "Monday meeting notes" and
 * "Sunday lunch" keep the day. The first letter is capitalised after a removal. If nothing would be left, the typed
 * text is kept. Never strips by word lists.
 */
export function titleFromAppliedTokens(text: string, applied: { start: number; end: number }[]): string {
  const tokens = applied
    .filter(t => t.start >= 0 && t.end <= text.length && t.end > t.start)
    .sort((a, b) => a.start - b.start);

  const removable = tokens.map(t => CONNECTOR_BEFORE.test(text.slice(0, t.start)) || /^[\s,.;!?]*$/.test(text.slice(t.end)));
  let changed = true;
  while (changed) {
    changed = false;
    tokens.forEach((t, i) => {
      if (removable[i]) return;
      const joinsPrevious = i > 0 && removable[i - 1] && TOKEN_GAP.test(text.slice(tokens[i - 1].end, t.start));
      const joinsNext = i < tokens.length - 1 && removable[i + 1] && TOKEN_GAP.test(text.slice(t.end, tokens[i + 1].start));
      if (joinsPrevious || joinsNext) {
        removable[i] = true;
        changed = true;
      }
    });
  }
  if (!removable.some(Boolean)) return text;

  let result = text;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!removable[i]) continue;
    const before = result.slice(0, tokens[i].start).replace(CONNECTOR_BEFORE, '');
    result = `${before} ${result.slice(tokens[i].end)}`;
  }
  result = result
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;]+|[\s,;]+$/g, '')
    .trim();

  if (!result) return text;
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Format a 24h "HH:MM" string into 12-hour display.
 * Rules: no leading zero, lowercase am/pm, minutes only if non-zero.
 * Examples: "19:30" → "7:30pm", "09:00" → "9am", "18:00" → "6pm"
 */
export function formatTime12h(time: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const suffix = hh >= 12 ? 'pm' : 'am';
  const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return mm === 0 ? `${hour12}${suffix}` : `${hour12}:${String(mm).padStart(2, '0')}${suffix}`;
}

/**
 * Format a scheduled date relative to `now`.
 * Within 6 days (same year): "on Friday". 7+ days (same year): "on 27 Feb".
 * Different year: "on 27 Feb, 2027".
 */
export function formatDateLabel(dateStr: string, now: Date): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const nowYear = now.getFullYear();

  // Different year — always show absolute date with year
  if (y !== nowYear) {
    return `on ${target.getDate()} ${SHORT_MONTHS[target.getMonth()]}, ${y}`;
  }

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= 6) {
    return `on ${WEEKDAY_NAMES[target.getDay()]}`;
  }

  return `on ${target.getDate()} ${SHORT_MONTHS[target.getMonth()]}`;
}

/**
 * Relative date tokens to strip (whole-word, case-insensitive).
 * These are unambiguous relative phrases that can be safely removed.
 */
const RELATIVE_DATE_PATTERNS: RegExp[] = [
  /\btomorrow\b/gi,
  /\btoday\b/gi,
  /\btonight\b/gi,
  /\bnext\s+week\b/gi,
  /\bnext\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\bthis\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
];

/**
 * Time-of-day phrases to strip as whole units when a concrete time exists.
 * These are tried BEFORE the single-word TIME_OF_DAY_PATTERNS so that
 * "in the morning" is removed atomically (preventing orphan "in the").
 */
const TIME_OF_DAY_PHRASE_PATTERNS: RegExp[] = [
  /\bin\s+the\s+morning\b/gi,
  /\bin\s+morning\b/gi,
  /\bin\s+the\s+afternoon\b/gi,
  /\bin\s+afternoon\b/gi,
  /\bin\s+the\s+evening\b/gi,
  /\bin\s+evening\b/gi,
  /\bin\s+the\s+night\b/gi,
  /\bin\s+night\b/gi,
  /\bat\s+morning\b/gi,
  /\bat\s+night\b/gi,
];

/**
 * Time-of-day words to strip when a concrete time exists.
 */
const TIME_OF_DAY_PATTERNS: RegExp[] = [
  /\bmorning\b/gi,
  /\bafternoon\b/gi,
  /\bevening\b/gi,
  /\bnight\b/gi,
];

/**
 * Normalise reminder text by replacing relative date/time phrases
 * with absolute equivalents.
 *
 * Only operates when schedule.kind === "scheduled".
 * Returns originalText unchanged if no date exists.
 *
 * @param originalText - Exact text the user typed
 * @param schedule - The resolved ReminderSchedule
 * @param repeatRule - The repeat rule, if any (recurring reminders skip date injection)
 * @param now - Current date at the time of schedule commitment
 * @param options - Optional flags to control normalisation behaviour
 * @param options.skipDateInjection - When true, do not inject a date label into the text
 */
export function normaliseReminderText(
  originalText: string,
  schedule: ReminderSchedule,
  repeatRule: RepeatRule | null | undefined,
  now: Date,
  options?: { skipDateInjection?: boolean; skipTimeInjection?: boolean },
): string {
  if (schedule.kind !== 'scheduled') return originalText;

  let result = originalText;

  // Strip relative date tokens
  for (const pattern of RELATIVE_DATE_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    result = result.replace(pattern, '');
  }

  // Strip explicit absolute date tokens (month-name dates) and track whether
  // any matched — when true, date-label reinjection is skipped to avoid
  // redundant "on Sunday" after the user already wrote "March 1".
  let strippedExplicitAbsoluteDate = false;
  const absoluteDatePatterns: RegExp[] = [
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?(?!\s*(?:am|pm)\b)(?:\s+\d{4})?\b/gi,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{4})?\b/gi,
  ];
  for (const pattern of absoluteDatePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(result)) strippedExplicitAbsoluteDate = true;
    pattern.lastIndex = 0;
    result = result.replace(pattern, '');
  }

  // Strip time-of-day words if a concrete time exists
  if (schedule.time) {
    // Detect if the original text contains "every morning/afternoon/evening/night".
    // If so, that time-of-day word is part of the repeat phrase and must NOT be stripped.
    const everyTodMatch = repeatRule
      ? /every\s+(morning|afternoon|evening|night)/i.exec(originalText)
      : null;
    const protectedWord = everyTodMatch ? everyTodMatch[1].toLowerCase() : null;

    // (fix B) Strip multi-word phrases first so "in the morning" is removed
    // atomically and cannot leave orphan "in the".
    for (const pattern of TIME_OF_DAY_PHRASE_PATTERNS) {
      pattern.lastIndex = 0;
      if (protectedWord && pattern.source.includes(protectedWord)) continue;
      result = result.replace(pattern, '');
    }

    for (const pattern of TIME_OF_DAY_PATTERNS) {
      pattern.lastIndex = 0;
      // Skip stripping if this pattern's word is protected by "every <word>"
      if (protectedWord && pattern.source.includes(protectedWord)) continue;
      result = result.replace(pattern, '');
    }
  }

  // Clean up orphaned "on" preposition left after stripping
  // e.g. "Meet on tomorrow" → "Meet on " → "Meet "
  // Only remove "on" that is now followed by nothing meaningful before the next word
  // We'll handle this by checking if "on" + date injection would duplicate below.

  // Collapse multiple spaces and trim
  result = result.replace(/\s{2,}/g, ' ').trim();

  // Remove trailing "on" left orphaned after token stripping
  result = result.replace(/\bon\s*$/i, '').trim();

  // Remove orphaned "on" before "at" (e.g. "Meet on at 3pm" → "Meet at 3pm")
  result = result.replace(/\bon\s+(?=at\b)/gi, '').trim();

  // (fix C) Remove a single trailing orphan connector left by stripping
  result = result.replace(/\s+(in|on|at|the)\s*$/i, '').trim();

  // Build date label
  const dateLabel = formatDateLabel(schedule.date, now);
  const needsDate = !result.toLowerCase().includes(dateLabel.toLowerCase());

  // Check for existing explicit "at <time>" in the (stripped) text
  const atTimeMatch = result.match(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i);

  if (!repeatRule && !strippedExplicitAbsoluteDate) {
    if (needsDate && atTimeMatch && !options?.skipDateInjection) {
      // Insert date label immediately before the existing "at <time>"
      const idx = atTimeMatch.index!;
      result = `${result.slice(0, idx).trimEnd()} ${dateLabel} ${result.slice(idx)}`;
    } else if (needsDate && !options?.skipDateInjection) {
      // Guard: if stripped text already contains the weekday for the schedule
      // date and dateLabel also contains that weekday, replace the bare weekday
      // in-place instead of appending (prevents "thursday on Thursday" duplication).
      const [gy, gm, gd] = schedule.date.split('-').map(Number);
      const guardDate = new Date(gy, gm - 1, gd);
      const guardWeekday = WEEKDAY_NAMES[guardDate.getDay()];
      const guardRe = new RegExp('\\b' + guardWeekday + '\\b', 'i');

      if (guardRe.test(result) && dateLabel.toLowerCase().includes(guardWeekday.toLowerCase())) {
        const canonical = guardWeekday + ' ' + guardDate.getDate() + ' ' + SHORT_MONTHS[guardDate.getMonth()];
        result = result.replace(guardRe, canonical);
      } else {
        // No existing weekday - append date label at end
        result = `${result} ${dateLabel}`;
      }
    }
  }

  // Inject time label if schedule has time and text doesn't already contain a time expression
  if (schedule.time) {
    if (options?.skipTimeInjection) {
      result = result.replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '');
    } else {
      const hasExplicitTime = /\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(result);
      if (!hasExplicitTime) {
        result = `${result} at ${formatTime12h(schedule.time)}`;
      }
    }
  }

  // Final whitespace cleanup
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}