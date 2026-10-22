/**
 * Siri reminder parsing — pure function
 *
 * Extracted from App.tsx for deterministic testing (docs/plans/siri-phase-1.md).
 * Turns the text Siri passes in into the scheduling fields of a new reminder.
 */

import type { Reminder, ReminderSchedule, RepeatConfig } from '../reminder-utils';
import { parseTokens, MONTH_NAME_TO_NUMBER } from './nlc-parser';
import { computeAutoApplyResult, computeTokenClickResult } from './nlc-interaction';
import { normaliseReminderText } from './normalise-text';
import { repeatConfigToRule } from './repeat-conversion';
import { keepRepeatRuleWhenOff } from '../settings/resolver';

export type SiriReminderFields = Pick<Reminder, 'originalText' | 'displayText' | 'schedule' | 'repeatRule'>;

export function buildSiriReminder(text: string, now: Date, isRepeatRemindersActive: boolean): SiriReminderFields {
  const tokens = parseTokens(text);
  const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

  let selectedDate: Date | null = null;
  let selectedTime: { hour: number; minute: number } | null = null;
  let repeatConfig: RepeatConfig = null;

  for (const action of actions) {
    const result = computeTokenClickResult(action.token);
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

  // A time with no date means today, or tomorrow once that time has passed
  if (!selectedDate && selectedTime) {
    const timeMinutes = selectedTime.hour * 60 + selectedTime.minute;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    selectedDate = new Date(startOfToday);
    if (timeMinutes <= nowMinutes) selectedDate.setDate(selectedDate.getDate() + 1);
  }

  let schedule: ReminderSchedule;
  if (selectedDate) {
    schedule = {
      kind: 'scheduled',
      date: toYyyyMmDd(selectedDate),
      ...(selectedTime ? { time: toHhMm(selectedTime.hour, selectedTime.minute) } : {}),
    };
  } else {
    schedule = { kind: 'sometime' };
  }

  // Repeat reminders off: Siri never creates a repeat rule
  const repeatRule = keepRepeatRuleWhenOff(isRepeatRemindersActive, null, repeatConfigToRule(repeatConfig));
  const displayText = schedule.kind === 'scheduled'
    ? normaliseReminderText(text, schedule, repeatRule, now, { skipDateInjection: true, skipTimeInjection: true })
    : text;

  return { originalText: text, displayText, schedule, repeatRule };
}
