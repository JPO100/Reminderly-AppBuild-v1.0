# Siri off: spoken refusal - plan

Status: for CTO review. Not implemented.

Type C under Working Agreement v1.3 (native intent behaviour, app lifecycle). Part of Siri Phase 2 on `feature/siri-phrases`. Supersedes Phase 1 decision D1 (requests ignored silently when Siri is off) once approved.

## 0. Decision record

- 2026-10-22, John: with Siri off, the current behaviour (Siri accepts the phrase, Reminderly opens, nothing happens) is not acceptable. Siri should refuse.
- 2026-10-22, John: reply wording option A: "Siri is turned off in Reminderly. You can turn it on in Reminderly settings."

## 1. Constraint

App Shortcuts phrases are fixed at build time and cannot be unregistered at runtime, so Siri always recognises them. "No app supports this" is not achievable. The closest behaviour is an immediate spoken refusal with no app launch and no text prompt.

## 2. Changes

| # | Area | Change |
|---|---|---|
| 1 | Web, App.tsx | Write the combined Siri state (`isSiriRemindersActive`: flag, preference, Reminders module) to native on launch and on every change. Gating logic unchanged |
| 2 | WidgetBridgePlugin.swift | New method `setSiriActive({ active })`: stores a bool in the App Group (`group.com.reminderly.app`), key `siriRemindersActive` |
| 3 | AddReminderIntent.swift | `openAppWhenRun` false; `text` optional. `perform()` reads the state first. Off: return the option A dialog, no app launch, no text prompt. On: request the text if missing, continue in the foreground, then the existing `reminderly://add` handoff |
| 4 | Missing value (fresh install, app never opened) | Fall back to the release default for Siri |

## 3. Native and dependency review

- Intent lifecycle: no automatic app launch. Foreground continuation uses `ForegroundContinuableIntent` (minimum iOS version to be confirmed at implementation, expected 16.4). Below that, keep today's behaviour (open the app; the web app ignores the request).
- State drift between the app and the stored value: mitigated by writing on launch and on every change.
- No new permissions. Same App Group and plugin as the lock screen widget. `AppDelegate` URL handling unchanged.
- Release defaults for Siri unchanged (known issue 2 still decides them).

## 4. Verification

- iPhone: Siri on (each phrase adds a reminder), Siri off (spoken refusal, app stays closed, no text prompt), switching on and off with the app in the background, cold launch, lock screen, fresh install.
- Vitest and Self Check against the baseline. Build and deployment to both devices.
