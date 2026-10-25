# Tutorial notifications page in every permission state

Status: implemented on John's instruction (2026-10-25, CEO authority) ahead of Kai's review; D1 as proposed, D2 no ask state change, D3 existing Not now rule. Awaiting Kai's review; not merged.
Requested by John, 2026-10-25. Changes the eligibility rule for the Never miss a reminder page, which Kai's R2 (docs/plans/tutorial-live-page-config.md) keeps authoritative, so it comes to Kai before implementation.
Branch: feature/tutorial-notification-page (stacked on feature/tutorial-live-page-config).

Revision: the first version covered only users with notifications turned off. John's decisions (2026-10-25) also keep the page, with "Notifications are on" and Next, for users who already have notifications on. Claude applied that decision only to how the page looks, not to when it shows, and John caught it on his iPhone. This revision covers every permission state.

## 1. Background

- iOS shows its notification permission prompt once. After Allow or Don't Allow, or after the user turns notifications off in iOS Settings, an app cannot ask again; it can only open its own page in iOS Settings.
- Today the page is included only when `shouldAskAutomatically(state, 'tutorial', permission)` passes: iOS undecided and the in-app ask never answered. Users who already have notifications on, or have them turned off, never see it.
- Already implemented on this branch (Type B, no rule change), so each state renders correctly when the page shows (today only reachable through Onboarding testing):

| iOS permission | Page |
|----------------|------|
| Undecided | Turn on (existing Allow, iOS prompt, then next page) and Skip (Not now once per opening, then next page) |
| Turned off | Turn on opens Reminderly's page in iOS Settings (`app-settings:`, already used by Settings > Notifications), switches alerts and badge on, records accepted, stays on the page; Skip moves on with no ask state change |
| On | "Notifications are on" and Next |

## 2. Proposed rule

Include Never miss a reminder whenever the Reminders and Notifications flags are on, whatever the iOS permission and ask state.

- The page explains a core behaviour (alerts and the app icon count), so it stays useful when notifications are already on.
- The live page config still removes the page if switched off there, and testing mode still overrides everything.
- The ask state rules, the Skip rule and the first timed reminder ask are unchanged. The timed reminder ask only runs while iOS is undecided and the ask is unanswered.

## 3. Behaviour by state

| State | Action | Result |
|-------|--------|--------|
| Undecided, ask unanswered | Turn on / Skip | Unchanged from today |
| Undecided, ask already answered (Not now) | Turn on | Existing Allow: iOS prompt, accepted, alerts and badge on |
| Undecided, ask already answered (Not now) | Skip | Not now rule as today (not-now-1 becomes not-now-2, which ends the timed reminder backup ask) |
| Turned off | Turn on | Opens iOS Settings; on return with notifications allowed, "Notifications are on" and Next |
| Turned off | Skip | Moves on, ask state unchanged |
| On | Next | Moves on, nothing changes |

## 4. Risks

- Users who chose Not now or turned notifications off see the page each time the Reminders tutorial opens (first launch, or a manual re-run). Skip is one tap.
- Skip from Not now (not-now-1) ends the timed reminder backup ask. This follows the existing Not now rule; an alternative is to make Skip change nothing once the ask has been answered (decision D3).
- Turn on while turned off switches the Reminderly preferences on before iOS allows notifications. Nothing is delivered until iOS allows them; Settings > Notifications already shows "Allow in iOS Settings" while turned off.
- The Reminders tutorial has one more page for most existing users (up to 10 pages). The page dots keep their 10px gap.
- Protected area: notification behaviour. No change to the timed reminder ask, the Allow handler or scheduling.

## 5. Native and dependency review

No new native code or plugin calls. `app-settings:` is the existing link. Lifecycle: the existing `appStateChange` listener refreshes permission on return; the tutorial is not closed by leaving the app (it closes only through `closeTutorial`).

## 6. Code

- `App.tsx`: `tutorialNotifAskEligible` is set from the Reminders and Notifications flags only, instead of `shouldAskAutomatically(...)`. The permission is still read when the tutorial opens, so the page renders the right state.
- `notification-ask.ts`: no change (D3 recommended as no change).
- No change to `tutorial-pages.ts` rules beyond the eligibility input.

## 7. Testing

- Vitest: page included for undecided, turned off and on; excluded when the Notifications flag is off; live config and testing mode unchanged.
- Self Check: existing ask state checks unchanged; Skip while turned off leaves the ask state unchanged.
- Device (John's iPhone): notifications on shows the note and Next in the normal tutorial; turned off shows Turn on (opens iOS Settings) and Skip; return after allowing shows the note.

## 8. Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Show the page in every permission state (undecided, turned off, on) | Yes (John, 2026-10-25), for Kai's approval |
| D2 | Skip while turned off changes the ask state | No |
| D3 | Skip when the ask was already answered (undecided, Not now) | Keep the existing Not now rule (not-now-2). Alternative: no change |
