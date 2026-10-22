# Siri Stage 4: date and time interpretation - plan

Status: approved by Kai (2026-10-22) with decisions D1-D5 below. Implementation on `feature/siri-stage4-datetime` in three stages: 1 parser and explicit-time validation, 2 Siri integration and response handling, 3 regression, builds and device verification. Tests are added within each stage.

Type D under Working Agreement v1.3. It is cross-component (the shared NLC parser used by in-app entry, the Siri intent in Swift and the bundled siri-core.js) and touches protected areas (date handling, time handling, notification scheduling input). Kai approves this plan before implementation and signs off before merge.

Branch: `feature/siri-stage4-datetime`, from main (9067897).

## 0. Decision record

- 2026-10-22, read-only audit: Siri uses the in-app NLC parser through siri-core.js in JavaScriptCore. It has no relative-duration support. "in an hour" is saved as Sometime with the full text as the title.
- 2026-10-22, John and Kai: Stage 4 scope agreed (relative commands, spoken clock times, refusal for non-quarter minutes, title fixes), 15-minute rounding for relative commands only, no "next week" or "this weekend".
- 2026-10-22, Kai: plan approved. D1 next occurrence for hours without am/pm. D2 nearest quarter, next quarter if at or before now. D3 Siri-only title cleaning from the existing parsed token spans, no separate parsing. D4 "in N days" sets the date only. D5 values 1 to 99. Preserve in-app behaviour unless a shared parser change requires otherwise; keep the Siri-off error mechanism; keep siri-core.js aligned with the source.

## 1. Current flow

`AddReminderIntent.perform()` -> `SiriCore.buildReminder` (JavaScriptCore, `siri-core.js`) -> `buildSiriReminder` (src/app/utils/siri.ts) -> `parseTokens` (nlc-parser.ts) -> `computeAutoApplyResult` / `computeTokenClickResult` (nlc-interaction.ts) -> `normaliseReminderText` (title). The result is saved to the App Group pending list, then the notification is scheduled.

## 2. Changes

| # | File / function | Change | Shared with in-app? |
|---|---|---|---|
| 1 | nlc-parser.ts `parseTokens` | New tokens: `in N minutes/mins/hours/days`, `in an hour`, `in a day` (time or date category). `N o'clock`, `half past N`, `quarter past/to N` (time). Number words one to twelve and `a`/`an` in these forms. `four pm` (word plus am/pm). `(the) day after tomorrow` (date, wins over `tomorrow` through the existing longest-match overlap rule) | Yes |
| 2 | nlc-interaction.ts `parseTimeTokenValue`, `parseDateTokenValue`, `computeTokenClickResult` | Resolve the new tokens. Relative minute and hour tokens give date plus time, as `tonight` does now. `in N days` gives date only. Add an optional `now` argument (default `new Date()`) so Siri computes from the time it processes the command. Rounding helper: nearest quarter, midpoint up, never at or before now (section 4, D2) | Yes |
| 3 | nlc-parser.ts, new `findUnsupportedClockTime(text)` | Same 12h and 24h patterns as the existing validators. Returns the first explicit time whose minute is not 00/15/30/45, plus the two neighbouring quarters | Siri only |
| 4 | siri.ts `buildSiriReminder` | Check #3 first. If it matches, return `{ unsupportedTime: { suggestion } }` and no reminder. Otherwise pass `now` into the token resolution. Title: remove the applied token spans and a directly preceding `at`/`on`/`in`, then the existing normalisation (section 4, D3) | Siri only |
| 5 | AddReminderIntent.swift `SiriCore.buildReminder` / `createNow` | If the JSON has `unsupportedTime`, throw a new `SiriUnsupportedTimeError` before anything is saved or scheduled. Siri speaks it and ends. This is the same mechanism as `SiriOffError` | Siri only |
| 6 | App.tsx legacy `reminderly:siri-add` handler | Skip `unsupportedTime` results so no reminder is created on that path either | Siri only |
| 7 | ios/App/App/siri-core.js | Rebuild with `npm run build:siri-core`. The existing siri-core.test.ts parity test enforces this | Siri only |

The in-app editor gains the new tokens (highlight, tap and auto-apply) through #1 and #2 with no UI change. The time picker is unchanged. In-app titles and in-app handling of non-quarter minutes are unchanged (they stay unrecognised, as today).

## 3. Unsupported explicit times

- Detection: #3 runs on the raw Siri text before parsing. It covers `4:10pm`, `4:10 pm` and `16:10`. Any non-quarter minute refuses, also inside repeats ("every Monday at 9:10am").
- Response: `SiriUnsupportedTimeError` with an interpolated `LocalizedStringResource`, for example "Reminderly currently supports reminders in 15-minute increments. Try 4:00 or 4:15." The suggestions are the quarters either side, in the format spoken (12h gives "4:00 or 4:15", 24h gives "16:00 or 16:15"; 11:50pm gives "11:45 or 12:00").
- Guarantee: thrown before `appendPending`, notification scheduling and the widget update, so nothing is created, rounded or saved as Sometime.
- Native review: the intent already throws `SiriOffError` and `SiriNotConfirmedError` from background `perform()` on every supported iOS version, and Siri speaks them. No new permission, persistence, lifecycle or plugin side effect. The coalesced retry path (`inFlight`) rethrows the same error, which is correct.

## 4. Risks and decisions needed

Decisions (approved by Kai):

- D1: hours without am/pm ("4 o'clock", "half past four") resolve to the next occurrence of that clock time after now (4pm said at 10am; 4am tomorrow said at 5pm).
- D2: relative durations round to the nearest quarter, midpoint up; a result at or before now moves to the next quarter.
- D3: Siri-only title cleaning, removing the applied date and time token spans (and a directly preceding at/on/in), then the existing normalisation. In-app titles unchanged.
- D4: "in N days" sets the date only.
- D5: values 1 to 99.

Risks:

- R1, transcription (inferred, not verified): iOS may pass "4:10 PM", "4.10pm", "4:30" for "half past four", or digits for words. Mitigation: before coding, John speaks the scope phrases with the current build. Unrecognised phrases are saved as Sometime with the raw text as the title, which shows exactly what iOS sends, with no code change.
- R2, in-app edit: a saved reminder whose original text contains "in an hour" is re-parsed in the editor. The existing edit-mode suppression (unchanged token texts do not re-apply) prevents a recalculation. This will be covered by a test.
- R3, shared parser: the new patterns could match ordinary words ("in 2 days" inside a longer phrase, "a quarter past"). Mitigation: anchored regexes and the regression set in section 5.

## 5. Testing and verification

- Unit (vitest):
  - nlc-parser: tokens for every new form.
  - nlc-interaction: value resolution and the rounding table at 10:07 (10 min to 10:15, 20 to 10:30, 30 to 10:30, 1 h to 11:00, 2 h to 12:00), the midpoint, hour, midnight, month and year boundaries, and D2.
  - siri.test: each scope phrase, the refusal for 4:10pm, 16:10 and a repeat, titles for every audit row, and all phrases the audit found supported, unchanged.
  - siri-core parity test.
- Regression: the full vitest suite (includes tutorial-nlc-demo, date-presets, notifications, siri-pending, siri-badge) and Self Check (Node, localStorage shim).
- Build: `npx vite build`, `npm run build:siri-core`, `npx cap copy ios`, Xcode simulator and device builds.
- Simulator: Shortcuts run of "in an hour", "half past four" and "4:10pm". Check the saved reminder, the notification time and that nothing is created on refusal.
- Device (John): spoken run of the scope list, unlocked and locked, including one refusal. Confirm the reminder date, time and title, the notification firing, the badge, and that the refusal leaves no reminder or notification.

## 6. Out of scope

"next week", "this weekend", bare "at 4", rounding of explicit clock times, time picker or UI changes, in-app refusal messaging.
