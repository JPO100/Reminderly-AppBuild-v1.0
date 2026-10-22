# Siri off: spoken refusal - plan

Status: implemented on `feature/siri-phrases` (spike 2 design). Spike 2 passed on John's iPhone (iOS 27.0.1) on 2026-10-22. Merged into main (b980d34, 2026-10-22).

Type C under Working Agreement v1.3 (native intent behaviour, app lifecycle). Part of Siri Phase 2. Supersedes Phase 1 decision D1 (requests ignored silently when Siri is off).

## 0. Decision record

- 2026-10-22, John: with Siri off, the old behaviour (Siri accepts the phrase, Reminderly opens, nothing happens) is not acceptable. Siri should refuse.
- 2026-10-22, John: reply wording: "Siri is turned off in Reminderly, so I can't add a reminder right now."
- 2026-10-22, CTO: approach approved in principle, subject to iOS compatibility, fail-closed state and branch isolation (section 3).
- 2026-10-22, spike 1 (`ForegroundContinuableIntent` with `requestToContinueInForeground`, iOS 16.4+): John's iPhone test showed an added "you'll need to continue in the app" step with Siri on. Stopped as instructed and dropped.
- 2026-10-22, CTO: spike 2 approved (iOS 26 `supportedModes` with `continueInForeground(alwaysConfirm: false)`; earlier versions keep the existing behaviour).
- 2026-10-22, spike 2 on John's iPhone: Siri on, no extra step, reminder added; Siri off, immediate refusal, no text prompt, app not opened; no regression. Passed.

## 1. Constraint

App Shortcuts phrases are fixed at build time and cannot be unregistered at runtime, so Siri always recognises them. "No app supports this" is not achievable. The closest behaviour is an immediate spoken refusal with no app launch and no text prompt.

## 2. Final implementation

| # | Area | Change |
|---|---|---|
| 1 | AddReminderIntent.swift, iOS 26+ | `supportedModes` `[.background, .foreground(.dynamic)]`. `perform()` reads `siriRemindersActive` from the App Group first; anything other than a stored `true` throws `SiriOffError`, which Siri speaks. When on: the optional `text` is requested with "What would you like to be reminded about?", then `continueInForeground(alwaysConfirm: false)`, then the existing `reminderly://add` handoff with `&+=?#` encoded |
| 2 | AddReminderIntent.swift, iOS 16.0 to 25 | `openAppWhenRun` true as before. No native refusal (limitation); the in-app gate ignores the request when Siri is off |
| 3 | WidgetBridgePlugin.swift | `setSiriActive({ active })` stores a bool in the existing App Group (`group.com.reminderly.app`) |
| 4 | utils/widget.ts, App.tsx | `syncSiriActive(isSiriRemindersActive)` on launch, on every change to the flag, preference or Reminders module, and each time the app returns to the foreground. Every call writes (no skip) |
| 5 | App.tsx | The existing in-app gate is unchanged and stays as a second layer |

## 3. CTO review points

### 3.1 iOS compatibility

- Confirmed in the iOS 27 SDK: `supportedModes`, `IntentModes` and `continueInForeground(_:alwaysConfirm:)` are iOS 26+. `ForegroundContinuableIntent` (iOS 16.4+) is deprecated from iOS 26 and was dropped after spike 1.
- iOS 16.0 to 25 keep the Phase 1 behaviour. The text is now an optional parameter asked for inside the intent, so on those versions Siri may ask after the app has opened. Not device-tested (no device below iOS 26 available).

### 3.2 State reliability (fails closed)

- Only a stored `true` accepts a request. Missing, `false` or an unreadable App Group: refuse.
- Fresh install: no value until the app first runs, so Siri refuses until Reminderly has been opened once.
- App update: App Group values survive updates; the app rewrites the value on launch.
- Changes to any of the three controls write the value; it is rewritten on every return to the foreground in case a write failed.
- If the stored value were ever wrongly `true`, the in-app gate still ignores the request, so no reminder is created while Siri is off.

### 3.3 Branch isolation

`ui/notifications-keyline` merged first (327baf6). `feature/siri-phrases` holds only Siri commits relative to main.

## 4. Native and dependency review

- Intent lifecycle on iOS 26+: background start, foreground on demand. No new permissions. Same App Group and plugin as the lock screen widget. `AppDelegate` URL handling unchanged.
- Release defaults for Siri unchanged (known issue 2 still decides them).

## 5. Verification

- `widget.test.ts`: on and off writes, a repeated value is written again (foreground re-write), a failed write does not throw, no call outside iOS. `siri.test.ts`: phrase list in step with AppShortcuts.swift.
- John's iPhone: Siri on, Siri off, no regression (spike 2). Final device checks recorded in the development history merge record.
