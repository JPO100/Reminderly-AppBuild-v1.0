# Tutorial live page config ("Push to live")

Status: plan for Kai's review (2026-10-25). Not implemented.
Requested by John, 2026-10-25. Type C under Working Agreement v1.3: it changes the rule that picks the tutorial pages users see.

## 1. Purpose

Onboarding testing mode (feature/dev-force-notification-ask-page, 27eeafb) lets John choose any set of tutorial pages for testing. John wants to push a tested set to the live journey on his device, so he sees the normal tutorial (testing mode off) exactly as a user would with that set.

The live page set is config. It joins the other settings and config that will be finalised for the golden master build, which ships without dev tools.

## 2. Behaviour

- Each tutorial page has a live config value, on or off. Default on for every page, so nothing changes until John pushes a set.
- Normal journey (testing mode off): the existing rules pick the pages, then pages switched off in the live config are removed (decision D1).
- Testing mode on: unchanged. Exactly the pages switched on in testing mode; the live config is ignored.
- If the live config leaves no pages, the first page the rules allow is shown, so the tutorial never opens empty.

## 3. Dev tools

On Testing tools > Onboarding testing > Reminders tutorial and Lists tutorial:

- "Push to live" button below the Pages card. It copies the current page toggles into the live config for that tutorial, after a confirmation overlay ("Push this page set to the live Reminders tutorial?"). It works whether testing mode is on or off.
- "Live journey" line under the button, for example "Live: 8 of 10 pages". Its info icon lists the live pages.
- "Reset live to all pages" button, which sets every live value back to on.

## 4. Storage

- Keys `reminderly-config-tutorial-<reminders or lists>-page-<page id>`, `'true'` or `'false'`, one per page (16). `reminderly-config-*` is the existing prefix for app behaviour we set (docs/settings-flags-spec.md).
- All 16 are added to `SETTINGS_DEFAULTS` with `'true'`, so the golden master review sees and sets them alongside the other config. Missing keys read as on.
- No migration: existing installs have no keys, which means all pages on, the same as today.

## 5. Code

- `utils/tutorial-pages.ts`: `getTutorialPageIds` gains `livePageIds` (the pages switched on in live config) and filters the normal result by it; a `getTutorialLivePageIds(variant, storage)` reader beside `getTutorialTestPageIds`.
- `App.tsx`: reads the live set in `openTutorial`, as it does the testing set, and passes it through `TutorialOverlay`.
- `DevToolsOverlay.tsx`: the two buttons, the live line and the confirmation on `OnboardingTestingPage`.

## 6. Risks and protected areas

- Notification ask (protected: notification behaviour). If the live config switches off Never miss a reminder, the tutorial no longer asks. The ask state stays unasked, so the existing dialog on the first timed reminder still asks. No change to ask state rules.
- Re-run this tutorial page off: users lose the pointer to Settings > Support. Product choice only; the menu entry is unchanged.
- Attachment, Siri and Natural Language Capture pages: still hidden by their rules when the feature is unavailable (with D1 as recommended), so a pushed set cannot show a page for a feature the user does not have.
- Page dots: the 10px gap row (27eeafb follow-up) handles any count from 1 to 10.

## 7. Native and dependency review

No native code, plugins or permission calls. The notification page's Allow keeps using the existing handler. Persistence: 16 new `reminderly-config-*` keys, read only when a tutorial opens. Lifecycle: none.

## 8. Testing

- Vitest: the combined rule (rules then live filter, empty fallback, testing mode ignores live) and the live reader.
- Self Check: the new defaults are read by the existing settings default checks.
- Browser: push a set, turn testing mode off, open both tutorials from settings and on app start; reset to all pages.
- Device: deploy to the simulator and John's iPhone; John checks his chosen live set.

## 9. Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | In the live journey, do the normal rules still apply to pushed pages? | Yes. The pushed set chooses pages; the rules still hide pages whose feature is off or whose ask has been answered. John's "Proceed with next step" taken as agreement, to be confirmed |
| D2 | One key per page or one list key per tutorial | One key per page: matches existing boolean config and the golden master review |
| D3 | Branch | feature/tutorial-live-page-config from main, after feature/dev-force-notification-ask-page is merged |
