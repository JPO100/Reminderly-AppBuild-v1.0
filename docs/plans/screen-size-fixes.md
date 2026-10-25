# Screen size fixes - plan

Status: for CTO review (Kai). Author: Claude, 2026-10-25. Requested by John.

Classification: Type C under Working Agreement v1.3. Three contained layout fixes, but together they touch several screens and the tutorial sheet in `App.tsx`. Web layer only.

Source: [usability/screen-size-testing.md](../usability/screen-size-testing.md) (findings F3, F4, F2; John's decisions of 2026-10-25).

## Goal

Make every screen fit the width at 360pt and show the tutorial demo at 375 x 667 and on the iPhone Duo outer screen (about 466 x 678), without changing anything at the 393 x 852 reference or larger.

John's rules (2026-10-25):

- Nothing may run off the side of the screen (horizontal overflow not acceptable).
- Vertical scrolling is acceptable when the width fits (F5, F6 need no change).
- The tutorial panel may fill the screen vertically, but only on smaller screens where it is needed.

## Scope

### 1. F3: list options and list info cards too wide

Cause: `src/imports/InfoOverlay.tsx` (list options, opened from an open list) and `src/imports/list-info-overlay.tsx` (list info, opened from a list row) set `style={{ width: 340 }}` on the card, inside a `w-full max-w-[400px]` wrapper that does not shrink its child. With the wrapper's 20px side padding, the card overflows at screen widths below 380: 20px clipped at 360, 5px off-centre at 375.

Change: on those two cards only, replace `width: 340` with `width: '100%', maxWidth: 340`. At 380pt and wider the card stays exactly 340 (no change on the reference or larger phones). Below that it fills the slot with the standard 20px margins; buttons are already `w-full`, so they shrink with it.

Not changed: the other overlays that set `width: 340` sit directly in the flex wrapper and already shrink (the reminder options card fits at 360).

Content check at 360 (card 320, content 260): the smart reminder row ("Set smart reminder", due line and toggle) and the longest button label ("Create template from list", "Added to your templates!") must fit 260px. If a label does not fit, it will be reported for a copy or wrap decision, not shortened silently.

### 2. F4: custom days buttons overlap at 360

Cause: `src/app/components/RepeatsOverlay.tsx` renders seven `shrink-0 size-[45px]` day buttons with `justify-between` across the content width. They need 315px plus gaps; at 360 the content is 312px.

Change: let the buttons shrink only when needed, keeping them round: width `min(45px, (100% - 12px) / 7)` with a square aspect ratio, and a minimum 2px gap. At 375 and wider they stay 45px (unchanged); at 360 they become about 42.8px. Text stays Lato Bold 17.

Not mirrored in any tutorial (the repeats panel has no tutorial copy).

### 3. F2: full-height tutorial panel on short screens

Cause: the tutorial sheet's top is `getBottomSheetTopPosition()` (logo bottom + 28px, about 141px), the same as the other sheets. On a 667 or 678pt screen this leaves the mock-up window about 175px tall, so the demo is mostly out of view.

Change: for the tutorial sheet only (`App.tsx`, the tutorial `motion.div` with `animate={{ top: getBottomSheetTopPosition() }}`), when the viewport is shorter than a threshold, set the sheet's top to just below the status bar (safe area top) instead, so the white panel covers the blue logo header. Above the threshold nothing changes. The reminder, lists, repeats and Dev tools sheets are not touched.

- Proposed threshold (D1): viewport height under 740pt. Covers 667 (SE 2 / 3, iPhone 8), 678 (iPhone Duo outer) and shorter Android screens (360 x 640 / 720). Leaves 780 (360 x 780 Android), 812 (minis) and every larger iPhone unchanged; all of those passed with the current layout.
- Proposed top (D2): the safe area top inset (20pt on the SE, status bar height elsewhere), so the status bar stays on the blue background and the panel's rounded top corners remain visible. The prototype used 20px.
- Uses the existing `viewportHeight` state; reacts to resize as the existing calendar height rule does.
- Applies to both tutorials (reminders and lists) and to the first-launch tour, since they share the sheet.
- The existing 570px small-height rules inside the tutorial content are left as they are (they only affect screens below the supported floor).

Prototype evidence (browser, CSS injected, no code change), 375 x 667: mock-up window grows from about 175px to 295px; every page checked shows its demo (filter row and 2.5 reminder rows; New reminder text field with Date and Time; done tick). Comparable to the 13 mini at 812, which passes. Screenshots: `docs/usability/screens/375x667/prototype-full-height-tutorial-*.png`.

To check during implementation: the Add an attachment page has a short-phone adjustment (it stops its sheet higher at 375 x 667) that may be unnecessary once the window is taller. If it now looks wrong, it will be reported and adjusted within this branch.

## Out of scope

- F5 and F6 (vertical scrolling, accepted by John).
- F7 and F8 (only fail at 320, below the floor).
- The calendar height rule (F10), the iPhone Duo inner screen, the minimum iOS change (D6, separate config decision), Android builds.

## Native and dependency review

No native code, Capacitor plugins, permissions, storage, notifications, scheduling or lifecycle behaviour is touched. All three changes are CSS sizing and one positioning value in the web layer. No new dependencies.

## Risks and failure modes

| Risk | Mitigation |
|------|------------|
| Change leaks to the reference or larger phones | Every change is bounded: cards keep 340 at 380 and wider, day buttons keep 45 at 375 and wider, the tutorial top only changes under 740. Verify at 393 x 852 and 440 x 956 that screenshots match before and after |
| Tutorial ring highlights misaligned after the sheet moves | Rings are positioned inside the mock-up, which moves with the panel; verify every page of both tutorials at 375 x 667 |
| Drag-to-close handle on the tutorial sheet | The 24px handle stays at the sheet top; verify drag-close still works at 375 x 667 |
| iPad compatibility mode | Runs in an iPhone-sized window; the same rules apply. Check once on an iPad simulator before release (already a release-readiness item) |
| A list title or button label too long for the narrower card at 360 | Check the longest labels; report rather than silently truncate |

## Tests and verification

- Vitest and Self Check: full runs, expected unchanged counts (no behaviour change). No new automated tests: these are layout values, so screenshot verification is the meaningful check.
- Browser pane screenshots, before and after, at 360 x 667, 360 x 780, 375 x 667, 466 x 678 (Duo outer), 393 x 852 (reference, unchanged) and 440 x 956 (unchanged): list options card, list info card, custom days, both tutorials (every page at 375 x 667 and 466 x 678).
- Simulators: iPhone SE 3rd gen (tutorial pages, custom days, list options, plus the outstanding keyboard check) and iPhone 13 mini (tutorial unchanged).
- Device: John's iPhone 15 Pro, confirming no visible change.
- Findings and results recorded in `docs/usability/screen-size-testing.md`.

## Branch

`fix/screen-size-fixes` from main, after docs/screen-size-testing is merged (so the findings and this plan are on main). Implementation starts only after this plan is approved.

## Decisions for review

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Tutorial full-height threshold | Viewport height under 740pt |
| D2 | Tutorial sheet top on short screens | Safe area top (status bar stays blue, rounded corners visible) |
| D3 | F4 approach | Shrink day buttons only below 375 (about 42.8px at 360), keep them round, 2px minimum gap |
| D4 | F3 scope | Only the two cards that overflow; leave the other `width: 340` overlays as they are |
