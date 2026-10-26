# Overlay scrolling - plan

Status: for Kai's plan review. Type C under Working Agreement v1.3 (shared layout code used by every settings page and the tutorial mirrors). Branch `fix/overlay-scrolling` from main 702bf03. No code changed yet.

## Problem

Settings sub-pages are meant to take the height of their overlay home page (Reminders settings or Lists settings). The glimpse rule added in October (`docs/plans/settings-scroll-peek.md`) breaks that whenever content overflows: `ScrollArea` grows or shrinks the card by up to 30px so the scroll edge cuts through the middle of a row 24px above the card edge. Example: with the Feedback flag on, Lists > Support opens at 435px against a 414px home page.

Today there are three sizing behaviours:

- Row sub-pages: home page height, then resized by up to 30px for the mid-row cut (`onGrow`).
- Text pages (FAQs, Privacy policy, Terms of use, Feedback): home page height, plain 24px cut, never resized.
- Interactions and the Feedback confirmation: sized to their own content (`subFits`).

Home pages that overflow (short screens) also move their cut to a row middle and shrink the card (`cap`), so the height the sub-pages copy depends on where a row falls.

## Standard (John, 2026-10-26)

1. Every sub-page takes the overlay home page height. No exceptions: `subFits` and the growth logic are removed.
2. Content that fits: standard 40px bottom margin, no indicator.
3. Content that overflows: the scroll area ends 30px above the card's bottom edge, as a hard edge (no fade), and a down-arrow indicator shows in that footer.
4. Indicator: John's SVG, 12 x 7, #D9D9D9, centred horizontally in the footer and vertically in the 30px space. It is visual only (not tappable; swiping is the iOS convention and the icon is far below the 44pt tap minimum). It shows while there is more content below and hides once scrolled to the end, switching instantly (no fade). John accepted these recommendations.
5. The same rule applies to a home page that overflows (short screens, 360 x 667 minimum): it keeps its height, uses the 30px footer and shows the indicator.

Measured from John's visual (card 265px wide, scaled to 340): the arrow's bottom sits about 8px above the card edge. Centring it in the 30px footer puts it 11.5px above. Plan uses centred; flagged for John's check on device.

## Implementation

`src/app/components/SettingsPanelContent.tsx`

- `ScrollArea`: replace the cut, pad, grow, cap and base logic with one measure: does the content overflow the area? While it does, the area's bottom margin is 30px less 40px card padding (the area ends 30px above the edge) and the indicator renders absolutely in the footer. A scroll listener hides the indicator within 1px of the end. ResizeObserver kept so content changes (rows appearing, text growing) re-measure.
- `PanelShell`: sub-pages always get the home page height (`mainHeight`); remove `grow`, `onGrow`, `subFits`, `baseHeight`, `mainHeaderHeight`. Text pages (`subText`) use the same `ScrollArea`, so the separate text branch and `SUB_PAGE_GLIMPSE_GAP` go.
- Constants: `SCROLL_PEEK` (40) stays; new `OVERFLOW_FOOTER` (30). `SUB_PAGE_GLIMPSE_GAP` and `data-glimpse-rows` removed.
- New `ScrollIndicator` component with John's SVG.
- Home page height on short screens: the card keeps its existing `h-[450px] min-[393px]:h-auto` and `max-height: 100%`; when the home page overflows inside that, the same `ScrollArea` rule applies.

Tutorial mirrors: the Re-run pages render the live settings content (`OnboardingPage6Content.tsx`), so they inherit the change. They will be measured, not edited, unless a mismatch shows.

Other centred overlays: audit during implementation for cards that can overflow on a 360 x 667 screen (Repeats overlay, reminder info, notification ask, tutorial centred cards). Any that can overflow get the same 30px footer and indicator through a shared component; the audit list and results go in the completion report. Bottom sheets (new reminder, list editor, templates) and Dev tools are out of scope: they are full-height panels, not overlay windows with a home page.

Docs: `docs/design.md` "Scrolling settings pages" rewritten to this standard; `settings-scroll-peek.md` marked superseded; `docs/development-history.md` entry.

## Risks

- Removing the growth logic changes every scrolling settings page at once. Mitigation: measure every page listed below before and after.
- Short screens: the 450px fixed card below 393px wide must still hold the header plus 30px footer; checked at 360 x 667 and 375 x 667.
- No change to storage, settings values, notifications or any protected area.

## Verification

- Web preview at 402 x 874, 375 x 667 and 360 x 667, both panels, flag combinations that change row counts (Feedback, Siri, sounds and haptics, info icons):
  - every sub-page card height equals its home page height;
  - footer 40px when content fits, 30px when it overflows;
  - indicator present only while content remains below, hidden at the end, back when scrolled up;
  - text pages (FAQs, Privacy policy, Terms of use, Feedback) and the Feedback confirmation;
  - tutorial Re-run pages match the live pages.
- Vitest and Self Check (Node run); web build.
- Simulator and iPhone deployment; John's on-device check.
- Type check is not available in this repo (no tsconfig or React types) and will be reported as not run.
