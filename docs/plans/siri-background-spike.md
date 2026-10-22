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

## Findings

To be completed after testing.
