# Date presets - scope

Status: implemented on `feature/date-presets` (2026-10-15), pushed for CTO review. D2 confirmed by John. Not merged.

## 1. Summary

Add a row of preset pills to the new and edit reminder panel, between the text field and the Set date row. Tapping a pill sets the date and time in one tap.

| Pill | Date | Time |
|---|---|---|
| Tomorrow | Next day | 8:00am |
| Tonight | Today | 6:00pm |
| Next week | The next Monday after today | 8:00am |

Classification: Type B (feature work). Touches date and time handling, a protected area.

## 2. Behaviour

### Selecting a pill

- Turns Set date and Set time on and fills both values.
- The date and time pickers stay closed. Only the blue value labels update.
- The tapped pill becomes active. Only one pill can be active.
- Tapping a different pill switches to that preset.

### Deselecting a pill

- Tapping the active pill again deselects it and turns Set date and Set time off.
- This uses the same path as turning Set date off by hand, which also turns time off and clears both values.

### Resetting the active pill

- Any manual change to the date or time resets the active pill to its default state. That includes picking a new date or time, or turning Set date or Set time off.
- The pill stays inactive even if the values are later changed back to match the preset.
- The date and time updates made by selecting a pill must not reset that pill. Only later manual or natural language changes reset it.

### Date rules

- Calculations use local calendar arithmetic (`new Date(year, month, day, hour, minute)` on the device's local time), never adding fixed millisecond offsets. This keeps the result correct across daylight saving changes, month ends and year ends.
- Tomorrow: today's local date plus one calendar day, at 8:00am.
- Tonight: today's local date at 6:00pm.
- Next week: the next Monday strictly after today, at 8:00am. From a Sunday that is the next day (the same date as Tomorrow). From a Monday it is 7 days later.
- 8:00am and 6:00pm are valid in both the 5-minute and 1-minute time increment settings.

### Tonight after 6pm

- Kept and saved as normal. The reminder is overdue as soon as it is saved, following existing behaviour for a reminder saved with a past time.
- No immediate notification. `buildScheduledNotifications` in `src/app/notifications.ts` already skips any reminder whose date and time are not in the future. The feature does not change notification code. This is confirmed by testing on the iPhone, not assumed from the code.
- Badge count includes the overdue reminder, as for any other overdue reminder.

### Repeats

- Applying a preset does not change the repeats toggle or the repeat setting.
- Clearing a preset does not change them either. Turning date and time off by hand already leaves repeats untouched (`handleDateToggle` in `NewReminderOverlay.tsx`). The pill uses that same path, so behaviour matches a manual toggle-off exactly.

### Other entry points

- Editing an existing reminder: pills show, with none active when the panel opens, even if the reminder's date and time match a preset. The app does not store which preset was used.
- New reminder from the calendar: pills show, with none active. Tapping a pill replaces the calendar date with the preset.
- Natural language capture: a date or time read from typed text never activates a pill. If a pill is active and the typed text then changes the date or time, the pill resets.
- Creating a smart reminder from a list: pills are hidden. Date and time are always on in that mode, so a pill could not be deselected as specified.

## 3. UI specification

- Pill style matches the filter pills on the main reminders list: Lato bold 14, 45px tall, fully rounded, 16px side padding.
- Default: 1px #BABABA outline, #BABABA text.
- Active: 2px #4784F8 outline, #4784F8 text.
- Pills are their natural width with the standard 10px gap, aligned left. If they no longer fit, the row scrolls sideways. (John, 2026-10-15: label shortened from "Tomorrow morning" to "Tomorrow" so all three fit on iPhone screens without spreading the pills.)
- Vertical spacing: 24px between the text field and the pills row, and 24px between the pills row and the Set date row.
- Built from the existing filter pill styling. No new visual pattern.

## 4. Feature gating

Follows the existing flag and preference pattern (`docs/settings-flags-spec.md`).

- Dev tools flag: `reminderly-ff-date-presets`, default off. Shown in Dev tools > Reminders > Features. Requires Enable reminders to be on.
- User setting: "Date presets" in Settings > Reminders, key `reminderly-pref-date-presets`, default on. Shown only when the flag is on.
- Active when the Reminders flag, the date presets flag and the preference are all on. The Dev tools flag overrides the user setting: when the flag is off, the feature is off whatever the setting says, and the setting's saved value is kept.
- When the feature is off, the pills row is removed from the layout and the panel looks and behaves exactly as it does today.

## 5. Out of scope

- Storing which preset was used.
- User-defined or editable presets.
- Changing preset times through settings.
- Changes to notification scheduling, the date and time pickers, natural language parsing or the repeats logic.

## 6. Expected changes

- `src/imports/NewReminderOverlay.tsx`: pills row, active preset state, reset on manual date or time change, hidden in smart reminder mode.
- A small pure helper for the preset date calculation, so it can be tested on its own. Location to follow existing utils in `src/app/utils/`. Uses plain `Date` local arithmetic, as the editor does today. No new date library or date-handling mechanism.
- `src/app/settings/keys.ts`: flag and preference keys with defaults.
- `src/app/App.tsx`: read the flag and preference and pass the result to the panel.
- `src/app/components/DevToolsOverlay.tsx`: flag toggle row in Reminders > Features.
- Reminders settings panel: "Date presets" toggle row.
- `src/app/dev/dev-tools-checks.ts`: flag and preference read-back checks, following the attachments check.
- Docs: `docs/features/reminders.md`, `docs/settings-flags-spec.md`, `docs/development-history.md`.

## 7. Verification

Automated or Self Check:

- Preset date calculation: each pill at a normal time; Tonight before and after 6pm; Next week from every day of the week, including Sunday and Monday; month end; 31 December to 1 January; the UK daylight saving start and end weeks.
- Flag and preference saved and read back; feature active only when all three gates are on.

Manual on the simulator and iPhone:

- Each pill sets date and time on, fills the correct values, keeps the pickers closed and shows the correct active style.
- Tapping the active pill turns date and time off; repeats unchanged.
- Changing the date or time, or turning either off, resets the pill.
- Applying a preset with repeats on keeps repeats and its setting.
- Tonight after 6pm saves as overdue with no immediate notification.
- Edit, calendar-prefilled, natural language and smart reminder cases as described in section 2.
- Gates: flag off hides the pills whatever the setting; flag on with setting off hides the pills; with both on the pills show.
- Feature off: the panel looks and behaves exactly as it does today.
- Regression: create, edit and save reminders with and without dates; notifications are scheduled for a future preset reminder; repeating reminders unchanged.
- Existing Self Check suite run and any failures resolved.

A build at completion. Development deployment to the simulator and iPhone after each change.

## 8. Delivery

1. Confirm the repository is clean and main is up to date with origin, then create `feature/date-presets` from main.
2. Commit in logical steps: feature gate and settings; preset helper and tests; pills UI and behaviour; Self Check and docs.
3. Deploy to the simulator and iPhone after each change, as standard.
4. Push the completed branch for CTO review.
5. No merge to main without CTO approval. John decides on TestFlight and App Store submission.

## 9. Decisions

| # | Decision | Status |
|---|---|---|
| D1 | Hide pills when creating a smart reminder from a list | Confirmed by John. Closed |
| D2 | User setting "Date presets" under Settings > Reminders, default on; Dev tools flag default off and overrides it | Confirmed by John. Closed |
| D3 | Branch `feature/date-presets` from a clean, up-to-date main | Approved |
