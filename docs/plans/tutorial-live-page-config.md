# Tutorial live page config ("Push to live")

Status: plan approved by Kai (2026-10-25, D1-D3 and R1-R5). Implemented on feature/tutorial-live-page-config; awaiting Kai's final Type C review. Not merged.
Requested by John, 2026-10-25. Type C under Working Agreement v1.3: it changes the rule that picks the tutorial pages users see.
Repository: github.com/JPO100/Reminderly-AppBuild-v1.0. Plan on feature/dev-force-notification-ask-page; implementation on feature/tutorial-live-page-config (D3).

## 1. Purpose

Onboarding testing mode (feature/dev-force-notification-ask-page) lets John choose any set of tutorial pages for testing. John wants to push a tested set to the live journey on his device, so he sees the normal tutorial (testing mode off) exactly as a user would with that set.

The live page set is config. It joins the other settings and config finalised for the golden master build, which ships without dev tools (release-readiness.md, "Developer tools excluded from release builds").

## 2. Behaviour

- Each tutorial page has a live config value, on or off. A missing value means on (R1), so nothing changes until John pushes a set.
- Normal journey (testing mode off): the existing eligibility rules pick the pages first and stay authoritative (R2). Pages switched off in the live config are then removed. Live config can only remove pages; it never adds a page the rules exclude (for example Siri when unavailable, or Never miss a reminder once the ask is answered).
- Testing mode on: unchanged. Exactly the pages switched on in testing mode; the live config is ignored.
- If the live config removes every page the rules allow, the first page the rules allow is shown, so the tutorial never opens empty.

## 3. Dev tools

On Testing tools > Onboarding testing > Reminders tutorial and Lists tutorial:

- "Push to live" button below the Pages card. It copies the current page toggles into the live config for that tutorial, after a confirmation overlay ("Push this page set to the live Reminders tutorial?"). It works whether testing mode is on or off.
- "Live journey" line under the button, for example "Live: 8 of 10 pages". Its info icon lists the live pages.
- "Reset live to all pages" button, which sets every live value back to on.

## 4. Storage and golden master workflow

- Keys `reminderly-config-tutorial-<reminders or lists>-page-<page id>`, `'true'` or `'false'`, one per page (16). `reminderly-config-*` is the existing prefix for app behaviour we set (docs/settings-flags-spec.md).
- Golden master (R4), using the existing workflow:
  - All 16 keys are added to `SETTINGS_DEFAULTS` in `src/app/settings/keys.ts` with `'true'` (development defaults).
  - A row "Tutorial live pages" is added to "Recommended release defaults" in docs/release-readiness.md (dev default all on, release value: Decision). It is decided in the existing launch defaults review (settings-flags-spec.md), where John's pushed set is copied into the release defaults.
- Reading uses the existing `readStoredBool`, which falls back to the default (on) for missing or malformed values (R1).
- No migration: existing installs have no keys, which means all pages on, the same as today.

## 5. Code

- `utils/tutorial-pages.ts`: `getTutorialPageIds` gains `livePageIds` (the pages switched on in live config) and filters the normal result by it, after the existing rules; a `getTutorialLivePageIds(variant, storage)` reader beside `getTutorialTestPageIds`.
- `App.tsx`: reads the live set in `openTutorial`, as it does the testing set, and passes it through `TutorialOverlay`. `notificationAskEligible` and the ask state logic are unchanged.
- `DevToolsOverlay.tsx`: the two buttons, the live line and the confirmation on `OnboardingTestingPage`.
- `settings/keys.ts` and `docs/release-readiness.md`: section 4.

## 6. Risks and protected areas

- Notification ask (protected: notification behaviour, R3). If the live config switches off Never miss a reminder, the user never reaches that page, so `askStateOnTutorialClose` leaves the ask state unchanged (closed before the page). `shouldAskAutomatically(null, 'timed-reminder', 'prompt')` is then true, so the existing dialog on the first timed reminder still asks. No change to the ask state rules, `maybeAskForNotifications` or the Allow handler.
- Re-run this tutorial page off: users lose the pointer to Settings > Support. Product choice only; the menu entry is unchanged.
- Attachment, Siri and Natural Language Capture pages: still hidden by their rules when the feature is unavailable (R2), so a pushed set cannot show a page for a feature the user does not have.
- Page dots: the 10px gap row (69e0c20, passed by John) handles any count from 1 to 10.

## 7. Native and dependency review

No native code, plugins or permission calls. The notification page's Allow keeps using the existing handler (`@capacitor/local-notifications` `requestPermissions`, no new call sites). Persistence: 16 new `reminderly-config-*` keys, read only when a tutorial opens. Lifecycle: none.

## 8. Testing (R5, proportionate)

- Vitest (tutorial-pages):
  - Missing and malformed live keys read as on (R1).
  - Live config removes pages but never adds pages the rules exclude, for both tutorials (R2).
  - Empty live set falls back to the first page the rules allow.
  - Testing mode ignores the live config.
- Self Check (notification checks), R3: with Never miss a reminder removed by the live config, closing the tutorial leaves the ask state unasked and the first timed reminder still asks.
- Self Check (settings checks): the 16 new defaults are read by the existing defaults check.
- Regression: full Vitest suite and Self Check; existing tutorial-pages cases unchanged.
- Browser: push a set, turn testing mode off, open both tutorials from settings and on app start; switch off Never miss a reminder in live config, close the tutorial, save a timed reminder and confirm the in-app ask dialog appears (permission undecided); reset to all pages.
- Device: deploy to the simulator and John's iPhone; John checks his chosen live set.

## 9. Decisions

| # | Decision | Outcome |
|---|----------|---------|
| D1 | In the live journey, do the normal rules still apply to pushed pages? | Yes. Approved in principle by Kai (2026-10-25) |
| D2 | One key per page or one list key per tutorial | One key per page. Approved in principle by Kai (2026-10-25) |
| D3 | Branch | feature/tutorial-live-page-config from main, after feature/dev-force-notification-ask-page is merged. Approved in principle by Kai (2026-10-25) |

## 10. CTO requirements (Kai, 2026-10-25)

| # | Requirement | Where met |
|---|-------------|-----------|
| R1 | Missing live configuration keys default to enabled | Sections 2 and 4 (`readStoredBool` fallback, `SETTINGS_DEFAULTS` on); Vitest case |
| R2 | Existing onboarding eligibility rules remain authoritative | Sections 2 and 5 (filter after the rules; never adds); Vitest case |
| R3 | Disabling the notification tutorial page must not affect the first timed reminder permission request | Section 6; Self Check and browser check |
| R4 | Use the existing golden master configuration workflow | Section 4 (`SETTINGS_DEFAULTS`, release-readiness release defaults, launch defaults review) |
| R5 | Proportionate regression coverage | Section 8 |
