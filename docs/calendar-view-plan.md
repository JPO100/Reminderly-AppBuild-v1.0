# Calendar view - scope and implementation plan

Status: implemented on `feature/calendar-view` (2026-10-12), pushed, awaiting final CTO review and John's device testing. Not merged.

## Summary

A month calendar on the Reminders tab, between the filter row and the reminder list.

- Each day shows up to 4 coloured dots, one per active reminder due that day.
- Tapping a day lists that day's reminders below the calendar.
- Filter pills highlight their date range on the calendar and list their reminders as they do today.
- Controlled by a master feature flag (Dev tools) and a user setting (Reminders settings > Show calendar). Both default off.

Design references (product owner, 2026-10-12):

- `reminders-cal-today.svg` - default state, today selected
- `reminders-cal-jan-15.svg` - future day selected
- `reminders-cal-thisweek.svg` - This week filter active

Source: `/Users/john/Desktop/svgs/`.

## Feature flag and setting

The calendar feature is already defined in the settings resolver, but nothing uses it yet.

- Master flag: `reminderly-ff-calendar` (exists, default off). Resolver parent is Reminders.
- User setting: `reminderly-pref-calendar` (exists, default off).
- The "Show calendar" row already exists in Reminders settings and is shown when the flag is on. It currently holds local state only and is not saved. It will be wired to `reminderly-pref-calendar`.
- Calendar shown when Reminders, the calendar flag and the user setting are all on (resolver `calendar` feature).
- Off: the Reminders tab is exactly as today.

Proposed Dev tools location (CTO decision): Dev tools > Reminders, a "Calendar" toggle after "1 minute time increments". The calendar depends on Reminders, as the other toggles on that page do.

## Behaviour

### Layout

- Order: filter row, month header, weekday row, date grid, 1px divider, list heading, list, New reminder button.
- The calendar and list heading stay fixed. Only the list scrolls.
- The grid height fits the month: 4, 5 or 6 week rows. It does not reserve 6 rows.
- The calendar is hidden in the Done/Deleted view.

### Calendar grid

- Weeks start on Monday. Cells before the 1st and after the last day are blank.
- 7 equal columns across the content width, 41px row pitch.
- Month title: Lato bold 17. Weekday names: Lato bold 13. Date numbers: Lato bold 16.
- Date numbers: #1C2C42. Past days: #D9D9D9.
- Today: filled 30px #00AFEE circle with a white number. This always applies, whatever is selected.
- Month arrows: #0088FE.
- Divider: 1px #E4E4E4, full content width.

### Dots

- One dot per active reminder (not done, not deleted) with a scheduled date. Maximum 4 per day. With more than 4 the extras are not shown and there is no overflow marker.
- 4px dots, 3px apart, centred, 4px below the date circle.
- Dot colour is the reminder's category, using the existing `CATEGORY_COLOURS`:
  - overdue #FF0000
  - today #00AFEE
  - this week #E466FD
  - later #FDB146
- Overdue reminders keep their dot on the original due date only. Today does not get a dot for them.
- Repeating reminders show the current occurrence only. The next occurrence appears when the current one is completed, as in the list. No future occurrences are projected.
- Sometime reminders have no date and get no dot.
- List (smart) reminders are included. The product owner may change this after testing.
- Completing or deleting a reminder removes its dot immediately.

### Day selection

- Default: no filter, today selected. Heading shows the full date, for example "Tuesday 6th January" (Lato bold 17, #1C2C42).
- Today's list shows reminders due today plus overdue reminders, matching the current list behaviour.
- Tapping today or a future day selects it and clears any active filter. The heading shows that day's date, and the list shows reminders due that day.
- Selected day (not today): a filled 30px circle in the colour of the range it falls in, with a white number: this week #E466FD, later #FDB146. Today's blue circle stays as it is. The day's dots stay below the circle.
- Past days cannot be selected. Their dots still show.
- Changing month clears the selected day. The calendar shows the new month with no day selected.
- Returning to the current month selects today automatically.
- Active filters stay active when changing month.

### Filters

- Pills keep their current appearance and behaviour.
- When a filter is active:
  - day selection is cleared, but today stays blue
  - days inside the filter's range stay dark with coloured dots
  - days outside the range and their dots turn #D9D9D9
  - the heading shows the filter label in the filter colour
  - the list shows the filter's existing results, including overdue reminders as today
- Ranges use the existing definitions: Today is today; This week is the rest of the current Monday to Sunday week after today; Later is every day after this Sunday, in all later months.
- Tapping the active pill returns to the default view with today selected.
- Tapping a greyed day while a filter is active clears the filter and selects that day, unless the day is in the past.
- Settings menu on: Later is the combined Later and Sometime filter. The calendar highlights the Later range. Sometime reminders appear in the list but have no dots.
- Sometime pill (Settings menu off, viewport 390px or wider): no days are in range, so all days are greyed. The list shows Sometime reminders.

### Month navigation

- Back and forward arrows, plus a horizontal swipe on the calendar area. The list area does not respond to the swipe.
- No limit on navigating backwards or forwards.
- Simple horizontal slide between months.

### List

- Reminder rows reuse the existing reminder list row component. Row elements and spacing are identical to the current list.
- Row actions such as complete, three-dot menu and info behave exactly as today.

### New reminder

- If a day other than today is selected, New reminder opens with that date filled in. The time uses the existing default for a new date: on, at 12pm, because a new reminder with a date needs a time. Both can be changed before saving.
- If today is selected, a filter is active or the calendar is off, behaviour is unchanged.

## Final changes from the original plan

Agreed during implementation (2026-10-12):

- Minimum screen height: the calendar needs a screen at least 880pt tall. Below that the calendar and the Show calendar row are hidden, Reminders looks as it does today, and the saved setting is kept. 880pt fits a 6-row month with two full reminder rows (103pt) below it at the SVG spacing. Supported: Plus and Max models (926pt and taller). Not supported: other current iPhones, including the iPhone 15 Pro (852pt) and 17 Pro (874pt), and Display Zoom below 880pt.
- Spacing: a tighter layout (0fe87e4) that allowed an 840pt minimum was tried and reverted (c946791) after device testing; the SVG spacing is kept.
- Empty day: "No reminders... take it easy!" in Lato Bold 17, #BABABA, as in `reminders-cal-empty.svg` (replaces the blank empty state).
- Turning the calendar back on (Show calendar or the Dev tools flag) resets to the current month, today selected and no filter.
- New reminder from a selected day uses the existing 12pm default time, because a new reminder with a date needs a time.

## In scope

- Calendar component, dot and range logic, day selection, filter integration, month navigation, New reminder date prefill.
- Wiring the Show calendar setting to storage and adding the Dev tools flag toggle.
- Tests, Self Check additions and documentation.

## Out of scope

- A calendar on the Lists tab.
- Viewing past days or completed reminders.
- Showing future occurrences of repeating reminders.
- Week view, drag to reschedule, long press actions.
- Changes to reminder scheduling, recurrence, notifications, badge counts, the lock screen widget, tutorial or onboarding.
- Changes to `ListSmartReminderCalendar.tsx`.

## Decisions

Agreed 2026-10-12 (CTO review, John's product decisions):

1. Empty day: the heading followed by an empty list area, with no message.
2. Lists off: the calendar is available in both states, with the grid styled as in the mockups.
3. Dev tools "Hide overdue": the calendar hides overdue dots, as the list hides overdue rows.
4. Midnight rollover: today, past-day greying and the default selection move to the new day on the existing time refresh tick.
5. Month navigation: option A (see Month navigation and Day selection).

6. Another month shown with no day selected: the heading and list stay on today's reminders. Selecting a day in that month updates the heading and list (CTO, 2026-10-12).

## Approach

Existing patterns are kept. No new architecture.

1. `reminder-utils.ts`: pure, testable functions built on the existing `categoriseReminder`, `isOverdue` and `sortReminders`:
   - `getCalendarWeeks(year, month)`: Monday-first grid with blank cells
   - `getCalendarDots(reminders, now)`: date to up to 4 dot colours, in existing sort order
   - `isDateInFilterRange(date, filter, now)`
   - `getRemindersForDay(reminders, date, now)`
2. New component `src/app/components/RemindersCalendar.tsx`: header, arrows, swipe, weekday row and grid. It is presentational and receives dots, selection and filter state as props.
3. `App.tsx`: read the resolver `calendar` feature and add `selectedCalendarDate` state. Render the calendar and heading between the filter row and the list when active. Clear the selection in the pill handler. Pass the selected date to the New reminder overlay.
4. `SettingsPanelContent.tsx`: Show calendar uses `useStoredSetting('reminderly-pref-calendar')`.
5. `DevToolsOverlay.tsx`: Calendar toggle on the Reminders page.

Protected areas touched: date handling (read only, for dots and ranges) and New reminder date prefill. Scheduling, notification, badge and recurrence code is not changed.

## Implementation steps

Each step is verified before the next.

1. Flag and setting wiring, Dev tools toggle. Check: flag off means no change; the setting persists across relaunch.
2. Pure functions and unit tests.
3. Calendar component: grid, dots and today styling, matched to the SVGs.
4. Day selection and list heading.
5. Filter integration and range greying.
6. Month navigation by arrows and swipe.
7. New reminder date prefill.
8. Self Check additions, full Vitest, TypeScript, build, deploy to simulator and iPhone.
9. Documentation and development history.

## Testing

Vitest (new `calendar.test.ts`, plus an addition to `settings.test.ts`):

- Grid: Monday start; months needing 4, 5 and 6 rows (February 2027, January 2026, March 2026); leap February 2028.
- Dots: maximum 4; category colours; overdue only on the original date; done and deleted excluded; repeating reminder shows the current occurrence only; Sometime excluded; list reminders included.
- Ranges: Today, This week (including when today is Sunday), Later across month and year boundaries.
- Day list: today includes overdue; a future day returns only reminders due that day.
- Settings: Show calendar persists; the resolver activates the calendar only when Reminders, the flag and the setting are all on.

Self Check: calendar dot and range checks in `src/app/dev/`.

Manual (simulator and physical iPhone):

- Flag off, or setting off: the Reminders tab is identical to main.
- Default view, select a future day, select a past day (no change), each filter, tap the active pill to reset, tap a greyed day while filtered.
- Arrows and swipe across a year boundary; 5-row and 6-row months; the list scrolls while the calendar and heading stay fixed.
- Complete and delete reminders: dots disappear. Complete a repeating reminder: its next occurrence dot appears.
- New reminder from a selected future day has that date filled in. From today it is unchanged.

Regression: filters, sorting, completion, deletion, repeating reminders, notifications and badge counts behave as before. The lock screen widget count is unchanged.

Release checks before merge: Vitest, Self Check, TypeScript, repo guard, production build, deployment to simulator and iPhone.

## Branch management

Current state:

- Branch: `main`, head 1b4b92d.
- Uncommitted on main: `Claude.md` (modified) and `ios/App/App/public/index.html` (modified). Untracked: `.claude/` and `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/`.

Proposed:

1. Create `feature/calendar-view` from `main` at 1b4b92d. Requires CTO approval and John's instruction.
2. Existing uncommitted and untracked files carry over to the branch working tree unchanged. They are not committed as part of this work unless instructed.
3. `ios/App/App/public/index.html` is a generated web asset and is overwritten by the build (confirmed safe: it only differed in hashed asset names).
4. Commits are made at agreed milestones, only on instruction. A suggested split: wiring and logic, then UI, then tests and docs.
5. Push to origin only on instruction.
6. Merge into `main` after John's iPhone testing and CTO sign-off. Branch retained after merge, as with previous features.
7. Development history: a branch entry when the branch is created, and a merge entry when it is merged.

## Approvals

- Scope, approach, flag reuse, Dev tools location and branch approved by the CTO, 2026-10-12.
- Generated asset `ios/App/App/public/index.html` may be overwritten by the build. Other local changes are preserved and excluded from calendar commits.
- Git operations (commits, push, merge) go ahead only on John's instruction, as in CLAUDE.md.

## Documentation

- `docs/settings-flags-spec.md`: calendar flag and setting rows updated.
- `docs/02-reminder-behaviour/filters-and-sorting.md`: calendar interaction with filters.
- A short calendar section in `docs/01-core-surfaces/active-list.md`.
- Development history entries for the branch and the merge.
