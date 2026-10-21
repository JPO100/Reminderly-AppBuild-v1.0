import type { SettingsStorage } from '../settings/keys';

export const CALENDAR_SWIPE_HINT_SHOWN_KEY = 'reminderly-calendar-swipe-hint-shown';
export const CALENDAR_SWIPE_HINT_EVERY_VISIT_KEY = 'reminderly-test-calendar-swipe-hint-every-visit';

// The calendar has no month arrows, so its dates nudge left and right once to show they can be swiped.
// Shown the first time the calendar opens. Testing tools can show it on every visit.
export function shouldShowCalendarSwipeHint(storage: SettingsStorage = localStorage): boolean {
  try {
    if (storage.getItem(CALENDAR_SWIPE_HINT_EVERY_VISIT_KEY) === 'true') return true;
    return storage.getItem(CALENDAR_SWIPE_HINT_SHOWN_KEY) !== 'true';
  } catch {
    return false;
  }
}

export function markCalendarSwipeHintShown(storage: SettingsStorage = localStorage) {
  try {
    storage.setItem(CALENDAR_SWIPE_HINT_SHOWN_KEY, 'true');
  } catch {
    // Fail silently - the hint shows again next time
  }
}
