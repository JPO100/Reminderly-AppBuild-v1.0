# Siri background creation - Option A spike

Status: spike in progress on `spike/siri-background-webview`. Not for merge.

Type C technical investigation (CTO, 2026-10-22). Branch from `main` at c990dcd, with `feature/siri-done-confirmation` merged in: the spike tests that flow and uses its saved-reminder confirmation as evidence.

## Question

Can Reminderly's existing web view reminder creation run from Siri without bringing the app to the foreground, including with the iPhone locked and in CarPlay? Success means the reminder is created, saved and its notification scheduled with no unlock and no app opening.

## Spike change (iOS 26+ only)

- `supportedModes` is `[.background]`; `authenticationPolicy` is `.alwaysAllowed`. No `continueInForeground`.
- The intent finds the running `CAPBridgeViewController` web view, waits for it to finish loading (up to 5s), and runs the same JavaScript the `reminderly://add` URL handler runs. No new persistence, no native reminder logic, no workarounds such as creating a web view.
- It then waits up to 8s for the existing saved-reminder confirmation (`siriAddedConfirmation`).
- Diagnostics: each run appends a line to the App Group key `siriSpikeLog`: app state, protected data availability and scene count at start, after delivery and at the end; the delivery result (`delivered`, `no-scene`, `no-webview`, `webview-not-loaded`, `js-error`); confirmed or not; pending notification count before and after.
- Siri says "That's done" when confirmed, otherwise "Spike result: not confirmed, <reason>".

## Test matrix (John, physical iPhone)

Use a reminder with a time a few minutes ahead (for example "Call Mum at 3:15pm") so the alert can be checked.

| # | App state | iPhone | Where |
|---|---|---|---|
| 1 | In the background (recently used) | Unlocked | iPhone |
| 2 | In the background | Locked | iPhone |
| 3 | Not running (swiped away) | Unlocked | iPhone |
| 4 | Not running | Locked | iPhone |
| 5 | In the background | Locked | CarPlay |
| 6 | Not running | Locked | CarPlay |

For each: what Siri said; whether the reminder is in Reminderly afterwards; whether the alert fires at the time with the iPhone still locked. The diagnostics log is read from the device afterwards.

## Findings (2026-10-22, iPhone 15 Pro, iOS 27.0.1)

John ran tests 1 to 4 (CarPlay not run). Every time Siri stayed in its working state with no spoken result; John dismissed Siri, opened Reminderly and saw the reminder.

Evidence: `siriSpikeLog` (App Group) and the saved reminders (WebKit localStorage), both copied from the device.

| Run (UTC end) | State at start / after delivery / end | Delivery | Confirmed | Pending alerts | Reminder saved (UTC) |
|---|---|---|---|---|---|
| 14:33:11 | background / background / background | delivered | yes | 22 to 23 | 14:33:09 "Call Mum at 3 pm" |
| 14:34:59 | background / inactive / active | delivered | yes | 22 to 23 | 14:34:56 "Call Mum at 4 pm" |
| 14:35:05 | background / inactive / background | delivered | no | 22 to 22 | none (duplicate run) |
| 14:35:05 | background / inactive / background | delivered | no | 22 to 22 | none (duplicate run) |
| 14:35:29 | background / inactive / active | delivered | yes | 22 to 23 | 14:35:26 "Call Mum at 4 pm" |
| 14:35:53 | background / inactive / active | delivered | yes | 22 to 23 | 14:35:50 "Call Mum at 4 pm" |
| 14:36:16 | background / active / active | delivered | yes | 22 to 22 | 14:36:13 "Call Mum at 4 pm" |

1. Scene and web view: found on every run (one connected scene, web view present and loaded).
2. JavaScript delivery: stalled. On every run but the first, the app was already inactive or active when `evaluateJavaScript` returned: the call did not complete until John brought Reminderly forward. The web view's JavaScript is suspended while the app is in the background, so the intent waited inside the hand-over.
3. Persistence before foregrounding: only the first run (14:33:11), which stayed in the background throughout. Most likely it ran in the short window after the app had last been used, before iOS suspended the web view. Every other reminder was saved only once the app was active.
4. Notifications: scheduled whenever the reminder was saved (pending count up by one), so scheduling works once the JavaScript runs.
5. No spoken result: the intent was blocked inside `evaluateJavaScript` (no timeout) until the app came forward, so Siri had nothing to say. Siri also ran the intent three times for one request (14:34:59 to 14:35:05); the two extra runs timed out after John opened the app.
6. Locked: protected data was available on every run, so no run happened with the phone data-locked (more than about 10 seconds after locking). The real pocket case, which also brings file protection for WebKit storage into play, was not reached.

## Assessment

- Feasibility: not demonstrated. Background creation only worked inside the short period after the app was last used.
- Reliability: no. Normal use (app suspended or not running) never completes in the background.
- Production suitability: no. It depends on WebKit running JavaScript for a backgrounded app, which iOS suspends by design. Keeping it awake would need background-execution workarounds, which the spike rules out and which App Review restricts.
- No clearly identifiable low-risk fix exists. A timeout on the hand-over would only turn the silent hang into a "not confirmed" message; creation would still need the app to come forward.

## Recommendation

Abandon Option A. Siri also re-runs a slow intent, so any further design must handle duplicate requests.
