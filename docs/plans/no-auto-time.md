# No automatic 12pm - plan

Status: approved by Kai (Type D); D1-D7 confirmed by John. Implementation authorised (Kai, 2026-10-24). Merge to main subject to separate CTO approval.

Type D under Working Agreement v1.3 (cross-component: reminder editor, calendar, NLC, list smart reminders and the native Siri intent; protected areas: time handling, scheduling, notification scheduling). Branch `feature/no-auto-time` from main ca75bae.

## 0. Decision record

- 2026-10-24, John: Reminderly stops filling in a time the user did not choose. A dated reminder needs a time the user adds before it can be saved, across the app.
- 2026-10-24, John: Siri works the same way. A date with no time makes Siri ask "What time?". If the answer can't be used, Siri refuses with a spoken explanation and saves nothing.
- 2026-10-24, Kai: conditional approval, Type D confirmed. Conditions: (1) all insertion paths covered, no remaining route that silently assigns a time to a new reminder; (2) the list-data 12pm read fallback cannot populate a new reminder's time; (3) editing, explicit time selection, preset times and NLC time handling preserved; (4) Stage 3 Siri test on John's iPhone, locked and unlocked, is a hard gate; (5) Siri cannot save a date-only reminder, quarter-hour validation intact; (6) `siri-core.js` rebuilt and validated. Kai supports the recommended D5 and D6, subject to John. Full plan requested for final review.
- 2026-10-24, audit for conditions 1 and 2 (section 3): two routes added (the in-app Siri handoff and list smart reminder creation through the fallback). The fallback is not read-only today, so D5 is revised (section 7).
- 2026-10-24, Kai: plan approved, Type D confirmed. Proceed with the staged implementation once John confirms D1-D7. D5: supports option (a), reusing the existing smart reminder editor, without unnecessarily interrupting list editing. The Stage 3 locked and unlocked iPhone `requestValue` test stays a mandatory hard gate. Keep the planned regression coverage and verify the rebuilt `siri-core.js`. Completion evidence and test results required for final Type D sign-off.
- 2026-10-24, John: D5 revised (section 7). Keep the existing behaviour (switch to the Reminders tab and open the smart reminder panel); the only change is that Date and Time both start off. No new pickers or UI; navigation, panel behaviour and save validation preserved.
- 2026-10-24, Kai: revised D5 and the Save button adjustment approved; no further technical changes. Proceed once John confirms D1-D4, D6 and D7. Stage 3 device gate and regression evidence required for final sign-off. No merge to main authorised.
- 2026-10-24, John: D1-D4, D6 and D7 approved as recommended (D5 approved earlier). Kai: implementation authorised on `feature/no-auto-time`; Stage 3 device gate retained; results and evidence for final CTO review.
- Supersedes: D7 in [nlc-titles-and-dates.md](./nlc-titles-and-dates.md) (Siri date-only at 12pm), the 12pm calendar prefill in [archive/calendar-view-plan.md](../archive/calendar-view-plan.md), and "Date ON auto-enables Time at 12:00" in the development history.

## 1. Problem

Wherever a date is set without a time, the app sets 12pm itself to meet the save rule (`canSubmitReminder`: Date on needs a date and a time). The user gets alerts at a time they never chose. Through Siri, "Call mum today" said after midday is saved at 12pm today, so it is overdue as soon as it is created.

## 2. Principle

- A time is set only by the user: a time typed or spoken, a time word ("morning", "tonight"), a relative time ("in 2 hours"), a preset with a stated time, or turning the Time switch on.
- No date and no time stays Sometime, as now.
- The save rule (`canSubmitReminder`) is unchanged. Only the places that fill in 12pm change.
- Saved reminders and saved lists are not changed. Existing times stay as stored.

## 3. Audit of every route that sets a time on a new reminder

Method: every `setSelectedTime`, `setIsTimeOn(true)`, `applyToggleStateSilently('time', true)`, every place a `scheduled` schedule with a time is built, and every use of `getSmartReminderTime`, across `src` (excluding tests, dev tools and onboarding fixtures) and `ios/App/App`.

### 3.1 Routes that assign 12pm without the user choosing it (change)

| # | Route | Today | Proposed |
|---|---|---|---|
| 1 | Date switch turned on (`handleDateToggle`, NewReminderOverlay.tsx:1164) | Time on at 12:00 | Date on with today; Time stays off; Save inactive until a time is added |
| 2 | Calendar day prefill (`getCalendarPrefill`, :104, used at :647) | Date and 12:00 | Date only; Time off |
| 3 | NLC auto mode, date token with no time (:967) | Time on at 12:00 | Time stays off |
| 4 | NLC auto mode, repeat token with no time (:1027) | Time on at 12:00 | Time stays off. Implied times ("every morning") unchanged |
| 5 | Smart reminder panel opened from a list (`openSmartReminderAddFlow`; initial state NewReminderOverlay.tsx:611-618, 632-649, 626-628) | Date on today, Time on at 12:00, date drawer open | Date and Time both off, no drawer open (D5) |
| 6 | List settings and list info overlay (App.tsx:4952, 4955, 5157, 5161, 5183, 5201): smart reminders switched back on for a list with a saved due date, and the due date picker | `?? '12:00'` written when the list has no time | The list's own time is kept. A list with a due date but no time (older data only) opens the existing smart reminder panel instead of writing 12:00 (D5) |
| 7 | List smart reminder creation and sync through `getSmartReminderTime` (list-utils.ts:149 `createSmartReminderForList`; App.tsx:1573, 1980, 1988, 2034, 2042, 3197, 3198) | A list with a due date and no time gets a 12:00 reminder | Per D5 and section 3.3 |
| 8 | Siri, background intent (siri.ts:96 via `siri-core.js`) | 12:00, even when passed | Siri asks "What time?" (section 4) |
| 9 | Siri, in-app handoff (`reminderly://add` in AppDelegate.swift:34, `handleSiriAdd` App.tsx:1918) | Same parser, 12:00 | Nothing saved when the text has a date and no time (no spoken reply is possible on this path) |

### 3.2 Routes that set a time the user chose (unchanged, condition 3)

- Time switch turned on by hand (:1189-1191): picker starts at 12:00 as its starting position (D2).
- Time picker selection (`handleTimeSelect`, :1204).
- Date presets (`handleDatePresetTap`, :1218-1220): Tonight 6pm, Tomorrow 8am, Next week 8am.
- NLC clock time (:1000), relative time (:981), repeat implied time (:1023) and its reactivation (:856).
- Edit mode: the saved time loads as now (:648 onward).
- Repeat next occurrence (App.tsx:2818, 2999): keeps the existing reminder's time; never adds one.
- Time with no date is today: a date default, not a time default. Out of scope.

### 3.3 The list-data 12pm fallback (condition 2)

`getSmartReminderTime` (list-utils.ts:90) returns 12:00 when a list has no time. Finding: it is not read-only today. Besides display (list-utils.ts:95, 100), it supplies the time when a smart reminder is created (`createSmartReminderForList`) and when list and reminder are kept in step (App.tsx:1573 and the write-backs listed in route 7).

Change:
- Display keeps the fallback only for saved lists that already have a due date (existing data).
- `createSmartReminderForList` creates a reminder only when the list has both a due date and a time; otherwise it returns null, as it does today with no due date.
- The sync loop and write-backs use the list's own time and never write a fallback 12:00 into a list or reminder.
- Saved lists: every current write path stores 12:00 with a due date, so saved lists with a due date already have a time and keep it.

After this, no new reminder can get its time from the fallback.

## 4. Siri design

Flow in `AddReminderIntent.perform()`:
1. Text is asked for as now if empty.
2. Parse first with `SiriCore.buildReminder` (no save). `buildSiriReminder` (siri.ts) no longer sets 12pm. When a date or repeat has no time, it returns `needsTime: true` and no schedule.
3. If `needsTime`, ask with a new optional parameter: `$timeText.requestValue("What time?")`.
4. Parse again with the answer joined to the original text (`"<text> at <answer>"`), so "3pm", "half three" and "15:30" go through the same parser and quarter-hour rule as now.
5. Still no usable time (unclear, cancelled or empty): throw a new `SiriNeedsTimeError` and save nothing. Proposed wording (D7): "Reminderly needs a time for that. Try again with a time, like today at 3pm."
6. A time off the quarter hour in the answer: the existing `SiriUnsupportedTimeError` refusal (condition 5).
7. Otherwise save, schedule and say "Okay, that's added", as now.

Safeguards (condition 5):
- The question is asked in `perform()` before `SiriReminderCreator.create`, so the in-flight retry guard and the save path are unchanged.
- `createNow` also refuses if the parsed reminder has a date without a time, so nothing can be saved with no time even if the question step is skipped.
- `handleSiriAdd` (route 9) saves nothing for a `needsTime` result, as it already does for an unsupported time.

## 5. Native and dependency review

- AddReminderIntent (App Intents): `requestValue` is already used for the text in background mode on every iOS version, including locked (siri-locked-device.md). A second request uses the same mechanism. Risk: Siri drops a second follow-up on some iOS versions. Hard gate: test on John's iPhone, locked and unlocked, before any other Stage 3 work; stop and report if either fails (condition 4).
- iOS 16 to 25: not device-testable (no device). Same API, so expected to behave the same; recorded as not verified.
- JavaScriptCore `siri-core.js`: rebuilt with `npm run build:siri-core`; the existing test fails if the bundled copy is stale; the rebuilt bundle is checked on the iPhone in Stage 3 (condition 6).
- AppDelegate URL handling: unchanged; route 9 is handled in the web layer.
- Notifications: Siri and the app schedule only reminders with a time, as now. No new permissions, no change to badges, App Group, widget or persistence format.
- `@capawesome/capacitor-badge` and the notifications plugin are not touched.
- App Shortcuts phrases unchanged. New spoken text avoids "remind" and "reminder" in the question.

## 6. Failure modes checked

- Fresh install and existing install: no data change; only new and edited reminders and lists are affected.
- Existing date-only reminders with no time (if any): edit already requires a time to save; unchanged.
- Existing lists with a due date: keep their stored time; smart reminders unchanged.
- Small screens: the Time row prompt (D6) must fit 375pt wide.
- NLC: typing a time later after a date-only token turns Time on, as now; deleting the time token turns Time off rather than back to 12pm.
- Calendar: a new reminder from today with no selected day is unchanged (no prefill).

## 7. Decisions (John owns D1-D7)

Status: all confirmed by John, 2026-10-24.

- D1. Date switch on: Time stays off and Save stays inactive until a time is added. Recommended.
- D2. Time switch on by hand: picker starts at 12:00. Recommended (alternative: next quarter hour).
- D3. Date presets keep their stated times. Recommended.
- D4. NLC auto mode: no time after a date or repeat token. Recommended.
- D5 (confirmed by John, 2026-10-24). List smart reminders keep the existing flow: switching smart reminders on for a list with no due date switches to the Reminders tab and opens the smart reminder panel, as now. The only change: Date and Time both start off (no date drawer open), and the user turns both on and chooses their values before saving. No new pickers or UI; navigation and panel behaviour unchanged. In smart reminder mode Date and Time still cannot be turned off once on, as now.
  - Save validation: the existing smart reminder save (`handleSubmit`) already refuses without a date and a time. Today the Save button in smart reminder mode does not check this (`requiresScheduledReminder` is false there), because Date and Time always started on. With both starting off, the button would look active and do nothing, so its active state follows the existing save rule in smart reminder create mode. No new rule; the button matches what the save already does.
  - List editing is not interrupted: lists that already have a due date and time keep them, and switching smart reminders back on reuses them, as now. Only a list with a due date and no time (older data only) opens the panel.
- D6. What the user sees while Save is inactive for a missing time: the Time row label reads "Add a time" in reminderly blue (#4784F8), no fades. Recommended; John to confirm the visual.
- D7. Siri wording: question "What time?"; refusal "Reminderly needs a time for that. Try again with a time, like today at 3pm."

## 8. Stages

1. Editor: routes 1 to 4 and the D6 prompt. Tutorials checked for screens they mirror (tutorial-nlc-demo, onboarding pages).
2. Lists: route 5 panel defaults, routes 6 and 7 per D5 and section 3.3.
3. Siri: first the hard-gate test of the second `requestValue` on John's iPhone, locked and unlocked; stop and report if either fails. Then `needsTime` in siri.ts, the intent flow, `SiriNeedsTimeError`, the `createNow` and `handleSiriAdd` safeguards, and the `siri-core.js` rebuild.
4. Docs: scheduling-and-nlc.md, reminders.md, ios.md, development history.

## 9. Verification

Automated:
- add-reminder-validation.test.ts: unchanged rule still passes; Date on with Time off is inactive.
- calendar.test.ts: prefill has a date and no time.
- NLC tests (nlc-dates, nlc-word-order, nlc-titles, nlc-spoken-times): date-only and repeat-only tokens leave Time off in auto mode; clock, relative and implied times unchanged.
- List tests: `createSmartReminderForList` returns null without a time; the sync loop never writes 12:00; saved lists with a time unchanged.
- siri-core.test.ts and siri.test.ts: date-only returns `needsTime`; "<text> at 3pm" schedules 15:00; an answer off the quarter hour gives the unsupported-time result; unusable answers give no schedule; no date stays Sometime; the bundled `siri-core.js` matches the source.
- date-presets.test.ts unchanged.
- Full Vitest suite and Self Check (expectations of a 12:00 default updated where they test this behaviour).

Simulator:
- Each route in 3.1 and each unchanged route in 3.2, edit mode, presets, calendar from a selected day, Time switch by hand.
- Lists (D5): smart reminders on from list settings and from list info open the panel with Date and Time off; Save inactive until both are set; cancel restores the list as now; saving creates the reminder at the chosen time; an existing smart reminder edits as now; a list with a saved date and time switched back on keeps its time.

John's iPhone (Siri, locked and unlocked; Stage 3 gate first):
- "Call mum today", answer "3pm": saved at 15:00 today, notification scheduled.
- Answer "4:10pm": quarter-hour refusal, nothing saved.
- Cancel or unclear answer: needs-time refusal, nothing saved, app not opened.
- "Call mum today at 3pm": no question, saved as now.
- "Call mum": Sometime, as now.
- Siri off: refusal unchanged.
