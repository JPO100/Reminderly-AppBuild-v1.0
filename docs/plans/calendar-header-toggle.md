# Calendar header toggle and filter row spacing - implementation plan

Status: product decisions confirmed by John (2026-10-20). Awaiting CTO plan review. No code changed.

Branch: `feature/calendar-header-toggle` from main 2205a01.

## 1. Summary

The calendar view on the Reminders tab is switched on and off from a 45px header button, following the List templates page pattern on the Lists tab. The "Show calendar" setting is removed. Filter rows across the app get tighter spacing to make room for the new button.

Classification: Type C (shared filter row styling across the Reminders, Lists and Done / Deleted views, the tutorial filter mirror, and a change to how the stored calendar preference is set). Protected area touched: local storage persistence (existing key reused, no migration).

## 2. Product decisions (John)

- D1. List view header: filter pills left; calendar button (supplied SVG) then the "..." button right.
- D2. Calendar view header: month title left in place of the pills (Lato Bold 20, #1C2C42, as "List templates"); list button (supplied SVG) then "..." right. Filter pills hidden in calendar view.
- D3. Month arrow buttons removed. Horizontal swipe changes month (already implemented in RemindersCalendar).
- D4. The last view is remembered across launches. Existing users with "Show calendar" on open in calendar view.
- D5. Filter rows (Reminders, Lists, Done / Deleted): 8px gaps between pills and between the header buttons (was 10px). Pills left, buttons right.
- D6. Pill padding 14px either side of the text at all widths (was 16px, 13px or 11px by width). Where a row overspills on a small viewport, 13px is used for that width only.
- D7. Clear all button keeps its fixed width so it does not resize between "Clear all", "Clear all?" and "Cleared!". The width is set so the widest state ("Clear all?") has 14px either side.
- D8. Existing narrow-screen pill hiding stays ("Sometime" under 390px, "Started" at 360px and below).

## 3. Implementation

App.tsx:
1. `reminderly-pref-calendar` stays the source of truth and now means "calendar view shown". The calendar button sets it to true and the list button sets it to false. No new key, no migration.
2. The calendar button shows only when the calendar is available: Reminders on, calendar flag on, screen tall enough (`CALENDAR_MIN_VIEWPORT_HEIGHT`), and not in Done / Deleted view. These are the same conditions the settings toggle uses today.
3. In calendar view, the Reminders header renders the month title (`formatCalendarMonthTitle`) in place of the filter pills. The calendar's own title and arrow row is removed. The weekday row follows the header with the standard 24px column gap.
4. The selected filter is kept while in calendar view and comes back when returning to list view. The existing effect that resets to the current month, today and no filter when the calendar turns on is kept, so it now runs on each switch to calendar view.
5. Filter row gaps and pill padding are updated per D5-D7 in all three rows. The responsive padding classes are replaced by 14px, with 13px only where the fit check at 360px and 375px shows overspill.

RemindersCalendar.tsx: remove the title and arrow row, ChevronLeft/ChevronRight and the arrow props. Swipe stays.

SettingsPanelContent.tsx: remove the "Show calendar" row and its props. Settings test and Self Check lists are updated to match.

Tutorial: TutorialReminderFilters mirrors the Reminders filter row at a reduced scale. Its gap and pill padding are scaled to the new values in this branch (no calendar button added there, since the tutorial does not cover the calendar).

## 4. Native and dependency review

Web UI only. No Capacitor plugins, patches or Swift touched. Persistence uses the existing `useStoredSetting` localStorage key. No permission, lifecycle or notification effects.

## 5. Risks

- R1. Existing users with "Show calendar" off have no visible change until they tap the new button. Users with it on land in calendar view, which matches D4.
- R2. Small screens: the Reminders row gains a 45px button. Covered by D6 and the fit check. The calendar itself already hides below 852pt height, and the button hides with it.
- R3. Self Check `settings-calendar-flag-and-pref` still applies (same key and defaults). Its name and wording are updated from "Show calendar".

## 6. Verification

- Vitest and Self Check (Node run) full pass. Build.
- Simulator screenshots: Reminders list view, calendar view, switching both ways, month swipe, Lists row, Done / Deleted row, Settings without the toggle, tutorial filter page.
- Fit check at 360px and 375px widths for all three rows.
- Relaunch keeps the last view.
- Deploy to the simulator and iPhone.
