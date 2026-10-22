# Siri Phase 1: technical reliability - plan

Status: approved, implementation in progress.

Type C under Working Agreement v1.3 (protected areas: date handling, time handling, reminder creation). Branch `fix/siri-reliability` from `main` at 4f274c6.

Phases 2 (Siri phrases) and 3 (onboarding tutorial) are separate. Background Siri execution is out of scope.

## 0. Decision record

Decisions made by John on 2026-10-22, following the Siri review:

- D1 Siri acts only when the Siri feature flag, the user's Siri preference and the Reminders module are all on. If any is off, the request is ignored: no dialog, no automatic enabling and no reminder. Existing defaults and gating are unchanged.
- D2 Branch `fix/siri-reliability` and this plan approved.
- D3 Cold-start `reminderly://` links from outside Siri (for example Safari) are outside Phase 1. Any confirmed issue is reported separately. Siri cold-launch reliability stays in scope and must be tested.
- D4 Extracting the Siri parsing into a utility for targeted tests is approved.

## 1. Changes

| # | Issue | Change |
|---|---|---|
| 1 | Text containing "&" is cut short | `AddReminderIntent.swift` percent-encodes the text with `.urlQueryAllowed` minus `&+=?#` |
| 2 | Siri off | No behaviour change (D1). The request is ignored as today |
| 3 | A time with no date can be created in the past | A time at or before the current minute moves to tomorrow. A time token that names the day ("tonight", "this morning") and an explicit date keep their date. Siri only: in-app natural language capture is unchanged |
| 4 | A month-name date with no year can be created in a past year | A date before today moves to next year. Today stays today. An explicit year is kept |
| 5 | Settings info text says the toggle removes Reminderly from Siri and Shortcuts | New text: "Lets you add reminders by voice with Siri and the Shortcuts app. When off, Reminderly does not add reminders from Siri." Tutorial page 6 reuses the component |
| 6 | Siri cold launch | Tested on a cold-launched app. A code change only if a failure is confirmed |

The Siri parsing in `App.tsx` moves unchanged into `src/app/utils/siri.ts` (`buildSiriReminder(text, now, isRepeatRemindersActive)`), with the rules in 3 and 4 added. `App.tsx` keeps the event handling, the gate and the `addReminder` call.

## 2. Native and dependency review

- `AddReminderIntent.swift` (App Intents, iOS 16+): only the encoding changes. No new permissions, persistence or lifecycle hooks.
- `AppDelegate.swift`: unchanged. `URLComponents.queryItems` already decodes the percent-encoded text.
- No Capacitor plugin changes.

## 3. Verification

- New `src/app/__tests__/siri.test.ts` with an injected "now": time-only past, future and current minute; day-naming time tokens; explicit dates; month-name past, future, today, explicit year, "5th of March", year boundary; Sometime; repeat flag; "&" text preserved.
- Regression: full Vitest suite, Self Check against `BASELINE.md`, build, deployment to the simulator and the iPhone.
- Siri cold launch: app terminated, shortcut run from the Shortcuts app on the simulator, reminder checked. Siri voice test on the iPhone by John (protocol in the completion report).
