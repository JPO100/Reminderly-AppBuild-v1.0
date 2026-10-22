# Siri off: spoken refusal - plan

Status: for CTO review. Not implemented.

Type C under Working Agreement v1.3 (native intent behaviour, app lifecycle). Part of Siri Phase 2 on `feature/siri-phrases`. Supersedes Phase 1 decision D1 (requests ignored silently when Siri is off) once approved.

## 0. Decision record

- 2026-10-22, John: with Siri off, the current behaviour (Siri accepts the phrase, Reminderly opens, nothing happens) is not acceptable. Siri should refuse.
- 2026-10-22, John: reply wording: "Siri is turned off in Reminderly, so I can't add a reminder right now." (replaces option A, chosen earlier the same day)

## 1. Constraint

App Shortcuts phrases are fixed at build time and cannot be unregistered at runtime, so Siri always recognises them. "No app supports this" is not achievable. The closest behaviour is an immediate spoken refusal with no app launch and no text prompt.

## 2. Changes

| # | Area | Change |
|---|---|---|
| 1 | Web, App.tsx | Write the combined Siri state (`isSiriRemindersActive`: flag, preference, Reminders module) to native on launch, on return to the foreground and on every change. Gating logic unchanged |
| 2 | WidgetBridgePlugin.swift | New method `setSiriActive({ active })`: stores a bool in the App Group (`group.com.reminderly.app`), key `siriRemindersActive` |
| 3 | AddReminderIntent.swift | `openAppWhenRun` false; `text` optional; conforms to `ForegroundContinuableIntent`. `perform()` reads the state first. Off or unknown: return the agreed dialog (section 0), no app launch, no text prompt. On: request the text if missing, `requestToContinueInForeground`, then the existing `reminderly://add` handoff |
| 4 | AppShortcuts.swift, AddReminderIntent.swift | Availability raised from iOS 16.0 to 16.4. The app still supports iOS 15 |

## 3. CTO review points (2026-10-22)

### 3.1 iOS compatibility

- Confirmed in the iOS 27 SDK (AppIntents swiftinterface): `ForegroundContinuableIntent` and `requestToContinueInForeground` are available from iOS 16.4. They are deprecated, not removed, from iOS 26 in favour of `supportedModes` with `.foreground(.dynamic)`, which is iOS 26 only. `OpenURLIntent` needs iOS 18, so it is not used.
- Plan: `ForegroundContinuableIntent` for every supported version (one code path, a deprecation warning when built against iOS 26+). Migrating to `supportedModes` is a later clean-up, not needed now.
- iOS 16.0 to 16.3: no foreground continuation. The Siri shortcut becomes iOS 16.4+; the app keeps its iOS 15 minimum. Every device that ran 16.0 can update to 16.4 or later.
- Siri-on reliability is not provable from the SDK. Unknown: whether iOS asks "Continue in Reminderly?" before opening the app, which would add a step today's flow does not have. Adjustment: step 1 of implementation is a short device check on John's iPhone (intent change only, Siri on and off) before the web and bridge work. If iOS adds a confirmation step, stop and return the choice to John and Kai.

### 3.2 State reliability (fails closed)

- Only an explicit stored `true` accepts a request. Missing, `false`, unreadable App Group or any other value: refuse.
- Fresh install: no value until the app first runs, so Siri refuses until Reminderly has been opened once. This replaces the earlier "fall back to the release default".
- App update: App Group values survive updates, and the app rewrites the value on its first launch after the update.
- Changes to the flag, the preference or the Reminders module: all three feed `isSiriRemindersActive`, and every change writes the value. The value is also rewritten on launch and on return to the foreground, in case a write fails.
- Second layer: the existing web gate stays. If the stored value were ever wrongly `true`, the app still ignores the request, so a reminder is never created while Siri is off. The worst case is today's silent behaviour.
- Uninstall removes the App Group data with the app and its widget.

### 3.3 Branch isolation

- History: `main` (eaded41), then `ui/notifications-keyline` (821bea3), then the Siri commits on `feature/siri-phrases`.
- Review: `git diff ui/notifications-keyline...feature/siri-phrases` shows the Siri changes only, and is available now.
- Merge: `ui/notifications-keyline` merges first (Type A, one key line, already in the device build John tested), on its own approval. `feature/siri-phrases` then holds only Siri commits relative to main and merges on its own approval. No rebase of pushed history.
- The key line's development history entry is in the Siri branch (5c2a440). After the keyline merge, the post-merge record confirms it.

## 4. Native and dependency review

- Intent lifecycle: no automatic app launch; foreground continuation as in 3.1.
- No new permissions. Same App Group and plugin as the lock screen widget. `AppDelegate` URL handling unchanged.
- Release defaults for Siri unchanged (known issue 2 still decides them).

## 5. Verification

- Step 1, device check: Siri on (opens Reminderly and adds the reminder with no extra step), Siri off (spoken refusal, app stays closed, no text prompt).
- iPhone: each phrase, toggling each of the three controls with the app in the background, cold launch, lock screen, fresh install (refuses until first opened), app update.
- Vitest and Self Check against the baseline. Build and deployment to both devices.
