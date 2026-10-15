// Date presets for the new and edit reminder panel. See docs/plans/date-presets.md.
// Uses local calendar arithmetic (new Date(y, m, d)) so results stay correct across
// daylight saving changes, month ends and year ends.

export type DatePreset = 'tomorrowMorning' | 'tonight' | 'nextWeek';

// shortLabel is shown on screens narrower than the iPhone 15 Pro (393pt)
export const DATE_PRESETS: { id: DatePreset; label: string; shortLabel?: string }[] = [
  { id: 'tomorrowMorning', label: 'Tomorrow morning', shortLabel: 'Tomorrow' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'nextWeek', label: 'Next week' },
];

/** Date (local midnight) and time for a preset, in the shape the reminder panel uses. */
export function getDatePresetValue(preset: DatePreset, now: Date = new Date()): { date: Date; time: { hour: number; minute: number } } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  if (preset === 'tonight') {
    return { date: new Date(y, m, d), time: { hour: 18, minute: 0 } };
  }
  if (preset === 'tomorrowMorning') {
    return { date: new Date(y, m, d + 1), time: { hour: 8, minute: 0 } };
  }
  // Next Monday strictly after today: Sunday gives the next day, Monday gives 7 days later
  const daysToMonday = ((1 - now.getDay() + 7) % 7) || 7;
  return { date: new Date(y, m, d + daysToMonday), time: { hour: 8, minute: 0 } };
}
