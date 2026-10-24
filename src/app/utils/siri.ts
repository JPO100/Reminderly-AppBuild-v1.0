/**
 * Siri reminder parsing — pure function
 *
 * Extracted from App.tsx for deterministic testing (docs/plans/siri-phase-1.md).
 * Turns the text Siri passes in into the scheduling fields of a new reminder.
 */

import type { Reminder, ReminderSchedule, RepeatConfig } from '../reminder-utils';
import { parseTokens, findUnsupportedClockTime, MONTH_NAME_TO_NUMBER } from './nlc-parser';
import { computeAutoApplyResult, computeTokenClickResult } from './nlc-interaction';
import { titleFromAppliedTokens } from './normalise-text';
import { repeatConfigToRule } from './repeat-conversion';
import { keepRepeatRuleWhenOff } from '../settings/resolver';

export type SiriReminderFields = Pick<Reminder, 'originalText' | 'displayText' | 'schedule' | 'repeatRule'>;

/** An explicit time off the quarter hour: no reminder is created and Siri suggests the quarters either side. */
export type SiriUnsupportedTime = { unsupportedTime: { earlier: string; later: string } };

export function isSiriUnsupportedTime(result: SiriReminderFields | SiriUnsupportedTime): result is SiriUnsupportedTime {
  return 'unsupportedTime' in result;
}

// The quarters either side of an unsupported time, in the clock it was said in: "4:00"/"4:15" or "16:00"/"16:15"
function quarterSuggestions(hour: number, minute: number, is24Hour: boolean): { earlier: string; later: string } {
  const format = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = String(totalMinutes % 60).padStart(2, '0');
    if (is24Hour) return `${h === 0 ? '00' : h}:${m}`;
    return `${h % 12 === 0 ? 12 : h % 12}:${m}`;
  };
  const earlier = hour * 60 + Math.floor(minute / 15) * 15;
  return { earlier: format(earlier), later: format(earlier + 15) };
}

export function buildSiriReminder(text: string, now: Date, isRepeatRemindersActive: boolean): SiriReminderFields | SiriUnsupportedTime {
  // Explicit times must be on the quarter hour; Siri never rounds them or saves them as Sometime
  const unsupported = findUnsupportedClockTime(text);
  if (unsupported) return { unsupportedTime: quarterSuggestions(unsupported.hour, unsupported.minute, unsupported.is24Hour) };

  const tokens = parseTokens(text);
  const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

  let selectedDate: Date | null = null;
  let selectedTime: { hour: number; minute: number } | null = null;
  let repeatConfig: RepeatConfig = null;

  // A stated date (or repeat) takes precedence over the next occurrence for a spoken hour without am/pm
  const dateGiven = actions.some(a => a.category !== 'time');
  for (const action of actions) {
    const result = computeTokenClickResult(action.token, now, dateGiven);
    if (!result) continue;
    if (result.dateValue) selectedDate = result.dateValue;
    if (result.timeValue) selectedTime = result.timeValue;
    if (result.repeatConfig) repeatConfig = result.repeatConfig;
  }

  const toYyyyMmDd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const toHhMm = (h: number, min: number) =>
    `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fallback: extract absolute month-name dates the NLC parser doesn't handle
  if (!selectedDate) {
    const mdMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\s*(?:am|pm)\b)(?:\s+(\d{4}))?\b/i);
    const dmMatch = !mdMatch ? text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?\b/i) : null;
    const absMatch = mdMatch || dmMatch;
    if (absMatch) {
      const monthStr = mdMatch ? absMatch[1] : absMatch[2];
      const dayStr = mdMatch ? absMatch[2] : absMatch[1];
      const yearStr = absMatch[3];
      const month = MONTH_NAME_TO_NUMBER[monthStr.toLowerCase()];
      const day = parseInt(dayStr, 10);
      if (month && day >= 1 && day <= 31) {
        if (yearStr) {
          selectedDate = new Date(parseInt(yearStr, 10), month - 1, day);
        } else {
          // No year given: a date already past this year means next year
          selectedDate = new Date(now.getFullYear(), month - 1, day);
          if (selectedDate < startOfToday) selectedDate = new Date(now.getFullYear() + 1, month - 1, day);
        }
      }
    }
  }

  // A time with no date means today, even once that time has passed (it then shows as overdue), as in the app
  if (!selectedDate && selectedTime) selectedDate = new Date(startOfToday);

  // Every reminder has a time: a date with no time is at 12pm, as in the app (even when 12pm has passed today)
  if (selectedDate && !selectedTime) selectedTime = { hour: 12, minute: 0 };

  let schedule: ReminderSchedule;
  if (selectedDate && selectedTime) {
    schedule = {
      kind: 'scheduled',
      date: toYyyyMmDd(selectedDate),
      time: toHhMm(selectedTime.hour, selectedTime.minute),
    };
  } else {
    schedule = { kind: 'sometime' };
  }

  // Repeat reminders off: Siri never creates a repeat rule
  const repeatRule = keepRepeatRuleWhenOff(isRepeatRemindersActive, null, repeatConfigToRule(repeatConfig));
  // Title: the task only, from the shared helper (docs/plans/nlc-titles-and-dates.md, 2.1). Repeat words are
  // removed only when a repeat is saved.
  const applied = actions.filter(a => a.category !== 'repeats' || repeatRule).map(a => a.token);
  const displayText = titleFromAppliedTokens(text, applied);

  return { originalText: text, displayText, schedule, repeatRule };
}
