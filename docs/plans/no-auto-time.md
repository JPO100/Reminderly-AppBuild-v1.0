# No automatic 12pm - plan

Status: plan for Kai's review. Not implemented.

Type D under Working Agreement v1.3 (cross-component: reminder editor, calendar, NLC, list smart reminders and the native Siri intent; protected areas: time handling, scheduling, notification scheduling). Branch `feature/no-auto-time` from main ca75bae.

## 0. Decision record

- 2026-10-24, John: Reminderly stops filling in a time the user did not choose. A dated reminder needs a time the user adds before it can be saved, across the app.
- 2026-10-24, John: Siri works the same way. A date with no time makes Siri ask "What time?". If the answer can't be used, Siri refuses with a spoken explanation and saves nothing.
- Supersedes: D7 in [nlc-titles-and-dates.md](./nlc-titles-and-dates.md) (Siri date-only at 12pm), the 12pm calendar prefill in [archive/calendar-view-plan.md](../archive/calendar-view-plan.md), and "Date ON auto-enables Time at 12:00" in the development history.

## 1. Problem

Wherever a date is set without a time, the app sets 12pm itself to meet the save rule (`canSubmitReminder`: Date on needs a date and a time). The user gets alerts at a time they never chose. Through Siri, "Call mum today" said after midday is saved at 12pm today, so it is overdue as soon as it is created.

## 2. Principle

- A time is set only by the user: a time typed or spoken, a time word ("morning", "tonight"), a preset with a stated time, or turning the Time switch on.
- No date and no time stays Sometime, as now.
- The save rule (`canSubmitReminder`) is unchanged. Only the places that fill in 12pm change.
- Saved reminders are not changed. Existing times stay as stored.

## 3. Sources of the automatic 12pm and proposed change

| # | Source | Today | Proposed |
|---|---|---|---|
| 1 | Date switch turned on (`handleDateToggle`, NewReminderOverlay.tsx:1164) | Time on at 12:00 | Date on with today; Time stays off; Save inactive until a time is added |
| 2 | Calendar day prefill (`getCalendarPrefill`, :104) | Date and 12:00 | Date only; Time off |
| 3 | NLC auto mode, date token with no time (:967) | Time on at 12:00 | Time stays off |
| 4 | NLC auto mode, repeat token with no time (:1027) | Time on at 12:00 | Time stays off. Implied times ("every morning") unchanged |
| 5 | Smart reminder created from a list in the editor (:647) | Time 12:00 | Time off, as source 1 |
| 6 | List settings and list info overlay due date (App.tsx:4952, 4955, 5157, 5161, 5183, 5201) | Time 12:00; these screens have a date picker only | See D5 |
| 7 | Siri, date or repeat with no time (siri.ts:96) | 12:00, even when passed | Siri asks "What time?" (section 4) |

Unchanged:
- Time switch turned on by hand: the picker starts at 12:00 as its starting position (D2). The user chose to add a time.
- Date presets: their stated times (Tonight 6pm, Tomorrow 8am, Next week 8am) stay. The preset is the user's choice.
- Time with no date is today (a date default, not a time default). Out of scope.
- `getSmartReminderTime` 12:00 fallback when reading saved list data (list-utils.ts:91). Protects existing data.
- Edit mode: a saved time loads as now.

## 4. Siri design

Flow in `AddReminderIntent.perform()`:
1. Text is asked for as now if empty.
2. Parse first with `SiriCore.buildReminder` (no save). `buildSiriReminder` (siri.ts) no longer sets 12pm. When a date or repeat has no time, it returns `needsTime: true` and no schedule.
3. If `needsTime`, ask with a new optional parameter: `$timeText.requestValue("What time?")`.
4. Parse again with the answer joined to the original text (`"<text> at <answer>"`), so "3pm", "half three" and "15:30" go through the same parser and quarter-hour rule as now.
5. Still no usable time (unclear, cancelled or empty): throw a new `SiriNeedsTimeError` and save nothing. Proposed wording (D7): "Reminderly needs a time for that. Try again with a time, like today at 3pm."
6. A time off the quarter hour in the answer: the existing `SiriUnsupportedTimeError` refusal.
7. Otherwise save, schedule and say "Okay, that's added", as now.

The question is asked in `perform()` before `SiriReminderCreator.create`, so the in-flight retry guard and the save path are unchanged. `createNow` also refuses if the reminder still has a date without a time, so nothing can be saved with no time.

## 5. Native and dependency review

- AddReminderIntent (App Intents): `requestValue` is already used for the text in background mode on every iOS version, including locked (siri-locked-device.md). A second request uses the same mechanism. Risk: Siri drops a second follow-up on some iOS versions. Spike first on John's iPhone, locked and unlocked (Stage 3 gate).
- iOS 16 to 25: not device-testable (no device). Same API, so expected to behave the same; recorded as not verified.
- JavaScriptCore `siri-core.js`: rebuilt with `npm run build:siri-core`; the existing test fails if the bundled copy is stale.
- Notifications: Siri schedules only reminders with a time, as now. No new permissions, no change to badges, App Group, widget or persistence.
- `@capawesome/capacitor-badge` and the notifications plugin are not touched.
- App Shortcuts phrases unchanged. New spoken text avoids "remind" and "reminder" in the question.

## 6. Failure modes checked

- Fresh install and existing install: no data change; only new and edited reminders are affected.
- Existing date-only reminders with no time (if any): edit already requires a time to save; unchanged.
- Small screens: the Time row prompt (D6) must fit 375pt wide.
- NLC: typing a time later after a date-only token turns Time on, as now; deleting the time token turns Time off rather than back to 12pm.
- Calendar: a new reminder from today with no selected day is unchanged (no prefill).

## 7. Decisions needed (John)

- D1. Date switch on: Time stays off and Save stays inactive until a time is added. Recommended.
- D2. Time switch on by hand: picker starts at 12:00. Recommended (alternative: next quarter hour).
- D3. Date presets keep their stated times. Recommended.
- D4. NLC auto mode: no time after a date or repeat token. Recommended.
- D5. List settings and list info overlay have a date picker only. Options: (a) keep 12pm there as a documented exception and follow up with a time picker separately; (b) add a time picker to both screens in this branch (more UI and tutorial scope). Recommended: (a).
- D6. What the user sees while Save is inactive for a missing time: the Time row label reads "Add a time" in reminderly blue (#4784F8), no fades. Recommended; John to confirm the visual.
- D7. Siri wording: question "What time?"; refusal as in section 4.

## 8. Stages

1. Editor: sources 1 to 5 and the D6 prompt. Tutorials checked for screens they mirror (tutorial-nlc-demo, onboarding pages).
2. Lists: per D5.
3. Siri: spike the second `requestValue` on John's iPhone (locked and unlocked) first; stop and report if it fails. Then `needsTime` in siri.ts, the intent flow and `SiriNeedsTimeError`, rebuild `siri-core.js`.
4. Docs: scheduling-and-nlc.md, reminders.md, ios.md, development history.

## 9. Verification

Automated:
- add-reminder-validation.test.ts: unchanged rule still passes; Date on with Time off is inactive.
- calendar.test.ts: prefill has a date and no time.
- NLC tests (nlc-dates, nlc-word-order, nlc-titles, nlc-spoken-times): date-only and repeat-only tokens leave Time off in auto mode; implied times unchanged.
- siri-core.test.ts and siri.test.ts: date-only returns `needsTime`; "<text> at 3pm" schedules 15:00; unusable answers give no schedule; no date stays Sometime.
- date-presets.test.ts unchanged.
- Full Vitest suite and Self Check (expectations of a 12:00 default updated where they test this behaviour).

Simulator:
- Each row of section 3, edit mode, presets, calendar from a selected day, Time switch by hand.

John's iPhone (Siri, locked and unlocked):
- "Call mum today", answer "3pm": saved at 15:00 today, notification scheduled.
- Answer "4:10pm": quarter-hour refusal, nothing saved.
- Cancel or unclear answer: needs-time refusal, nothing saved, app not opened.
- "Call mum today at 3pm": no question, saved as now.
- "Call mum": Sometime, as now.
- Siri off: refusal unchanged.
