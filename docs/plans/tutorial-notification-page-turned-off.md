# Tutorial notifications page for users with notifications turned off

Status: proposal for Kai's review (2026-10-25). Not implemented.
Requested by John, 2026-10-25. Changes the eligibility rule for the Never miss a reminder page, which Kai's R2 (docs/plans/tutorial-live-page-config.md) keeps authoritative, so it comes to Kai before implementation.
Branch: feature/tutorial-notification-page (stacked on feature/tutorial-live-page-config).

## 1. Background

- iOS shows its notification permission prompt once. After Allow or Don't Allow, or after the user turns notifications off in iOS Settings, an app cannot ask again; it can only open its own page in iOS Settings.
- Today the page is included only when `shouldAskAutomatically(state, 'tutorial', permission)` passes: iOS undecided and the in-app ask never answered. Users with notifications turned off never see it.
- Already implemented on this branch (Type B, no rule change): when the page shows and notifications are turned off, the footer has Turn on and Skip. Turn on opens Reminderly's page in iOS Settings (`app-settings:`, already used by Settings > Notifications > Allow in iOS Settings), switches the Reminder alerts and app badge preferences on and records the ask as accepted. The page stays open; the foreground listener re-reads permission when the user returns, and the page then shows "Notifications are on" with Next. Today this is only reachable through Onboarding testing.

## 2. Proposed rule

Include Never miss a reminder when the Reminders and Notifications flags are on and either:

- `shouldAskAutomatically(state, 'tutorial', permission)` passes (unchanged), or
- iOS permission is `denied` (notifications turned off), whatever the ask state.

The live page config still removes the page if switched off there, and testing mode still overrides everything.

## 3. Behaviour with notifications turned off

| Action | Result |
|--------|--------|
| Turn on | Opens Reminderly's page in iOS Settings; alerts and badge preferences on; ask state `accepted`. Tutorial stays on the page |
| Return with notifications allowed | "Notifications are on" and Next |
| Return still turned off | Turn on and Skip again |
| Skip | Moves to the next page. Proposed: no ask state change when turned off (Not now only means something while iOS is undecided) |

## 4. Risks

- Users who turned notifications off on purpose see the page each time the Reminders tutorial opens (first launch, or a manual re-run). Skip is one tap.
- Turn on switches the Reminderly preferences on before iOS allows notifications. If the user does not allow them, nothing is delivered and the preferences are ready for when they do; Settings > Notifications already shows "Allow in iOS Settings" while turned off.
- Protected area: notification behaviour. No change to the timed reminder ask (it only runs while iOS is undecided), the Allow handler or scheduling.

## 5. Native and dependency review

No new native code or plugin calls. `app-settings:` is the existing link. Lifecycle: the existing `appStateChange` listener refreshes permission on return; the tutorial is not closed by leaving the app (it closes only through `closeTutorial`).

## 6. Testing

- Vitest: page included when permission is denied, whatever the ask state; still excluded when granted, or when undecided and the ask was answered; live config and testing mode unchanged.
- Self Check: Skip while turned off leaves the ask state unchanged.
- Device (John's iPhone, notifications turned off in iOS Settings): normal tutorial shows the page with Turn on and Skip; Turn on opens iOS Settings; return after allowing shows "Notifications are on"; Skip moves on.

## 7. Decision

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Show the page to users with notifications turned off | Yes (John, 2026-10-25), for Kai's approval |
| D2 | Skip while turned off changes the ask state | No |
