# Screen size testing

Usability testing of Reminderly across supported screen sizes, before upgrades and payments. Started 2026-10-25 (John, Claude; reports to Kai, CTO).

## Status

| Stage | Status |
|-------|--------|
| 1. Current state review and support proposal | Complete (2026-10-25) |
| 2. Test set, method and documentation | Complete (2026-10-25, this document) |
| 3. Milestone 1: smallest supported screen (minimum width and minimum height) | First pass complete (2026-10-25); recommendation below, decision pending. SE simulator keyboard check outstanding |
| 4. Screen-by-screen visual review and fixes | Not started |

## Current state (2026-10-25)

- Benchmark device throughout the build: iPhone 15 Pro, 393 x 852pt. Portrait only.
- Small-screen handling exists only in parts of the app:
  - Onboarding and tutorial pages adapt at 570px height or less (tighter gaps, the phone mock-up scaled to 70%, decorative elements hidden).
  - Reminders and Lists settings panels use a fixed 450px scrolling card below 393pt width; at 393pt and wider they size to their rows.
  - The calendar header button and calendar view hide below 852pt height (`CALENDAR_MIN_VIEWPORT_HEIGHT` in `src/app/App.tsx`). This hides the calendar on 844pt iPhones (12, 13, 14, 16e), the minis, the SE and most Android phones.
- The main screens (Reminders and Lists tabs, bottom sheets, reminder editor, calendar, filter pills) have no small-screen rules and use fixed pixel sizes from the Figma layout. Expected risk at 375pt: clipping, crowded filter rows, bottom sheet positions.
- Minimum iOS for the app is 15.0, which allows 320pt-wide devices (1st-gen SE, iPhone 6s). Display Zoom can also produce a 320pt layout on small modern phones.
- The iPhone only decision (2026-10-12) is not yet applied: the app and widget still target iPhone and iPad (`TARGETED_DEVICE_FAMILY = "1,2"`). Tracked in [release-readiness.md](../release-readiness.md).

## Support proposal

Proposed 2026-10-25. The cut-off is confirmed by milestone 1.

| Category | Devices / sizes | Proposed status |
|----------|-----------------|-----------------|
| Benchmark | iPhone 15 / 16 / 17 Pro (393-402 x 852-874) | Supported, verified throughout the build |
| Large | Plus, Pro Max, Air (420-440 x 912-956) | Supported, check only |
| Small | iPhone SE 2nd / 3rd gen, iPhone 8 (375 x 667) | Supported, proposed smallest supported size |
| Small tall | iPhone 12 / 13 mini (375 x 812) | Supported |
| iPhone Fold outer screen | Not yet published | Supported in principle; 375pt devices stand in until specs or a simulator are available. The inner screen is out of scope for now (needs its own design; iOS scales the current layout) |
| Android | 360 x 640dp to 412 x 915dp | Shared layouts designed to 360dp wide from now on; tested once Android work starts |
| Very small | 320pt wide (1st-gen SE, iPhone 6s / 7) | Not supported; proposal to raise minimum iOS to 16 or later (CTO decision, Type C) |
| Display Zoom on small phones | 320pt effective | Best effort: must be usable, need not be polished |
| iPad | iPhone compatibility mode only | Must be usable for App Review; not designed for |

## Accepted header layouts (John, 2026-10-25)

- Reminders header for the v1 App Store release: reduced filters, calendar icon and settings icon. The Dev tools setting stays for now; release defaults must match this layout.
- Lists header accepted for release.

## Small-screen priority (John, 2026-10-25)

Non-critical header elements may be hidden on smaller viewports:

| Element | Priority |
|---------|----------|
| Settings button | Required, never hidden. It is the only route to settings |
| Calendar button | Optional; may and likely should be hidden on smaller viewports |
| Filter pills | Optional; may be reduced or hidden |

Conditions for any hiding change (to be planned as Type C, CTO review):

- While the filter pills are hidden the list shows All, so a saved filter cannot leave the list filtered with no visible way to clear it.
- Hide by whether the row fits the available width, not by device, so Android and the Fold outer screen are covered.
- Reminders tutorial page 0 clicks through the filters, so it needs a matching variant in the same branch (the calendar button is already mirrored this way).

## Test set (agreed 2026-10-25)

One representative per size group. Coverage only runs from smaller to larger: a pass covers larger screens in the group, not smaller ones, so each group is tested at its narrowest and shortest member. Where an Apple and an Android size closely match, one test covers both. Samsung's common 360pt width has no Apple equivalent and is tested on its own. Sizes straddle the thresholds in the code: 570pt height (tutorials), 393pt width (settings panels), 852pt height (calendar).

| # | Size (pt / dp) | Tested on | Represents |
|---|----------------|-----------|------------|
| 1 | 320 x 568 | Browser pane | Below the floor: 1st-gen SE and Display Zoom. One-off cut-off check, not part of every run |
| 2 | 360 x 780 | Browser pane | Samsung Galaxy S base models and most small to mid Android phones |
| 3 | 375 x 667 | iPhone SE 3rd gen simulator | Shortest iPhone: SE 2 / 3, iPhone 8. Below the tutorial height threshold |
| 4 | 375 x 812 | iPhone 13 mini simulator | Narrow and tall: minis and the 390 x 844 group (12, 13, 14, 16e), below the calendar threshold. Fold outer screen stand-in |
| 5 | 393 x 852 | iPhone 15 Pro simulator and John's iPhone 15 Pro | Reference benchmark: 15 / 16 Pro, 15 / 16 |
| 6 | 440 x 956 | iPhone 17 Pro Max simulator | Largest: Plus, Pro Max, Air, large Android (Pixel, Galaxy Ultra) |

Limits of the method:

- Browser pane runs (sizes 1 and 2) use the web build: no safe areas and no native features. Layout only; status bar and home indicator spacing is judged on the simulators.
- Android phones differ beyond size (navigation bar, status bar height, font scaling). One real Android device check is needed when Android work starts.

## Page and state checklist

Every size is checked against the same list.

Pages:

- Reminders tab (list view, filter row, header)
- Calendar view (where shown)
- Lists tab and an open list
- New reminder and reminder editor, including date and time pickers and repeats
- Bottom sheets and centred overlays
- Reminders and Lists settings, including sub-pages
- Onboarding and tutorials (reminders and lists)
- Paywall, once built

States:

- Keyboard open (highest risk on short screens)
- Empty lists
- Long titles
- Full lists

## Pass criteria

| Level | Meaning | Applies to |
|-------|---------|------------|
| Usable | No clipped or overlapping controls; every critical control reachable; text readable | Every size, including below-floor and Display Zoom |
| Polished | Spacing and proportions match the reference at 393 x 852 | Supported sizes |

## Text size

Whether Reminderly follows iOS text size (Dynamic Type) and Android font scaling is open. Proposal: one check at the largest setting on the reference device, or record it as out of scope for v1. Decision needed from John.

## Running the tests

- Capture by size: boot each simulator once and work through the full checklist, which keeps runs fast.
- Review by screen: compare each Reminderly screen across all sizes side by side, so issues show as a pattern and one fix is checked everywhere it applies.
- Milestone 1 first: review the smallest sizes (1 to 4) to set the minimum width and minimum height before polishing.
- Screenshots: `docs/usability/screens/<size>/<page>.png`, for example `docs/usability/screens/375x667/reminders-tab.png`.

## Findings

### Milestone 1 run (2026-10-25)

Build: main c239465 (docs/screen-size-testing has no code changes). Configuration: development defaults plus the calendar flag (accepted header) and natural language capture (confirmed for release); the simulators used development defaults only. Test data: Dev tools dummy generators (21 reminders, 8 lists, templates) plus one long title.

How each size was run:

- 320 x 568 and 360 x 780: browser pane (web build).
- 375 x 667: browser pane. The SE 3rd gen simulator launch screen matched the browser capture exactly, so the browser is a valid stand-in at this size (the SE has no notch or home indicator). Simulator taps on the SE were not available (panel access not granted), so the SE keyboard check is outstanding.
- 375 x 812: iPhone 13 mini simulator (iOS 26.4) for safe areas, the tutorial and the keyboard; browser pane for height-sensitive pages.

Screenshots: `docs/usability/screens/<size>/`. Files ending `-simulator` come from the simulators; the rest come from the browser pane.

### Results by screen

| Screen | 320 x 568 | 360 x 780 | 375 x 667 | 375 x 812 |
|--------|-----------|-----------|-----------|-----------|
| Reminders tab and header | Usable, 3 rows | Pass | Pass, 4.5 rows | Pass |
| Lists tab and header | Pass (Started pill drops out) | Pass, tight | Pass | Pass (width as 375 x 667) |
| Open list | Not checked | Pass | Not checked | Not checked |
| List options card | Not checked | Fail (F3) | Polish (F3) | Polish (F3, same width) |
| Reminder options card | Usable, scroll (F5) | Pass | Usable, scroll (F5) | Pass |
| Reminder editor, no keyboard | Pass | Pass | Pass | Pass |
| Keyboard open | Not possible in browser | Not possible in browser | Outstanding (SE access) | Usable (F9) |
| Date picker | Fail (F6) | Pass | Usable, scroll (F6) | Not checked |
| Time picker, repeats | Not checked | Pass | Pass | Not checked |
| Custom days | Not checked | Fail (F4) | Pass, tight (F4) | Pass, tight (same width) |
| Reminders and Lists settings | Polish (F8) | Pass | Pass | Not checked |
| Natural Language Capture settings | Fail (F7) | Polish (F7) | Polish (F7) | Not checked |
| Done view | Not checked | Pass | Not checked | Not checked |
| Reminders and Lists tutorials | Fail (F1) | Pass | Fail (F2) | Pass |
| Calendar | Hidden (852pt rule) | Hidden | Hidden | Hidden |

### Findings

| # | Finding | Sizes | Level |
|---|---------|-------|-------|
| F1 | Tutorials: at 570px height or less the phone mock-up and page dots are hidden completely; only the title, text and buttons remain | 320 x 568 | Fail (below floor) |
| F2 | Tutorials: the mock-up window is about 175px tall, so each page's demo is mostly out of view (the list, the New reminder text field, the done tick and the Done view cannot be seen) | 375 x 667 | Fail at a supported size |
| F3 | List options card sizes to its content (280px plus 30px padding each side, 340px) inside a slot of screen width minus 40px: clipped 20px on the right at 360, 5px off-centre at 375 | 360, 375 | Fail at 360; polish at 375 |
| F4 | Custom days: seven 45px day buttons need about 327px; they overlap and the last is clipped at 360, and almost touch at 375 | 360, 375 | Fail at 360; pass at 375 |
| F5 | Reminder options card is capped at screen height minus 200px: Delete reminder is cut at 667 and Edit and Delete are hidden at 568 until you scroll; there is no scroll cue | 568, 667 | Usable, not polished |
| F6 | Date picker: the month grid runs below the screen at 667 (scroll needed); at 320 the MON and SUN columns and the next-month arrow are clipped | 320, 667 | Fail at 320; usable at 667 |
| F7 | Natural Language Capture settings: at 320 the title wraps to two lines and the main toggle is pushed half off the card; at 360 and 375 the row label runs right up to its toggle | 320, 360, 375 | Fail at 320; polish at 360 and 375 |
| F8 | Reminders settings: the "Natural Language Capture" row label runs into its chevron | 320 | Polish (below floor) |
| F9 | Keyboard open: on the 13 mini the keyboard and its accessory bar cover the Time and Repeats rows; the text field and Date stay visible | 375 x 812 | Usable |
| F10 | Calendar is hidden at all four sizes by the 852pt height rule, as designed; whether it should show at 812 to 844 is for the polish pass | All | Decision later |

### Combined worst case: 360 x 667 (2026-10-25)

Checked after the first pass to confirm the width and height findings combine without anything new (browser pane, `docs/usability/screens/360x667/`). Reminders tab and header: pass (4.5 rows, all header controls fit). Reminder options card: usable with a scroll (F5). Date picker: usable with a scroll (F6). Custom days: overlap (F4). List options card: clipped on the right (F3). Tutorial: mock-up mostly out of view (F2). No new issues: F2, F3 and F4 are the only items that cripple a screen, and all three are contained fixes.

Header observation: the accepted Reminders header (three filters plus settings, calendar hidden by height) and the Lists header (three filters plus two buttons) both fit at 360 without hiding anything. At 320 the Lists header already drops the Started pill. Filter hiding is not needed at any supported width found so far.

### Device support alignment (2026-10-25)

- iOS 26 runs on iPhone 11 and later plus iPhone SE 2nd and 3rd gen. The iPhone 11 is 414 x 896pt (828 x 1792 pixels at 2x), but the SE 2 / 3 (375 x 667) and the 12 / 13 mini (375 x 812) are also current. So even when aligned with Apple's current support, the smallest iPhone screen is 375 x 667.
- No iPhone that runs iOS 16 or later has a 4-inch (320 x 568) screen; the last ones (1st-gen SE, iPod touch) stop at iOS 15. Every iPhone from iOS 16 to iOS 26 has the same smallest screen, 375 x 667 (iPhone 8, SE 2, SE 3).
- So going further back than Apple's current support costs nothing in screen size. Moving the minimum from iOS 15 to iOS 16 removes the 320pt devices; going further (17, 18, 26) removes no further screen sizes, only older phones.
- What older iOS versions do cost: WebKit compatibility testing (no iOS 16-18 simulator runtimes are installed today), and native feature gates. Siri (App Intents) already needs iOS 16 (`@available(iOS 16.0)` in the native code); one iOS 17 code path is already conditional. The widget extension targets iOS 16.
- Recommendation for D6 (CTO decision; John agreed 2026-10-25): minimum iOS 16. It matches the 375 x 667 screen floor, keeps Siri available on every supported phone, and includes the iPhone 8, X, XS and XR, part of the roughly 100 million phones Apple no longer updates. Condition: one WebKit smoke test on an iOS 16 simulator runtime before release. Choosing iOS 18 instead would reduce the test surface but drop the iPhone 8 and X, with no screen size benefit.

### Decisions and follow-up checks (John, 2026-10-25)

- Vertical scrolling is accepted: content that runs below the screen (F5 reminder options card, F6 date picker) is fine as long as it fits the width. F5 and F6 need no change.
- Horizontal overflow is not acceptable: nothing may run off the side of the screen. This covers F3 (list options card), F4 (custom days) and, below the floor only, F7.
  - F3 cause: `src/imports/InfoOverlay.tsx` and `src/imports/list-info-overlay.tsx` fix the card at `width: 340` inside a full-width wrapper, so the card cannot shrink. Other overlays also set `width: 340` but sit directly in a flex wrapper and shrink, which is why the reminder options card fits at 360. Fix: `width: 100%` with a 340px maximum on those two cards.
- Tutorials: on smaller screens the tutorial panel may fill the screen vertically (covering the blue logo header), only where needed. Prototype (browser, CSS injected, no code change) at 375 x 667: the panel starts below the status bar, the mock-up window grows from about 175px to 295px, and every page checked shows its demo (filter row and 2.5 reminder rows, the New reminder text field with Date and Time, the done tick). This is comparable to the 13 mini at 812, which passes. Screenshots: `375x667/prototype-full-height-tutorial-*.png`. The trigger height must include the iPhone Duo outer screen (678).

### iPhone Duo outer screen (2026-10-25)

- Apple's spec sheet: 5.4-inch outer display, 1398 x 2034 pixels at 460 ppi. At 3x this is about 466 x 678pt (Apple does not publish points; to confirm on a simulator when one is available, none is installed). Wider than a Pro Max, about as short as the SE.
- Browser check at 466 x 678: Reminders tab and header pass (calendar hidden by the 852pt rule), Reminders settings pass. The tutorial will behave as at 667, so the full-height tutorial panel must apply here too. Screenshots: `docs/usability/screens/466x678/`.
- Inner screen (7.6-inch, 1878 x 2670) remains out of scope.

### Fixes implemented (fix/screen-size-fixes, 2026-10-25)

Plan: [plans/screen-size-fixes.md](../plans/screen-size-fixes.md), approved by Kai with D1-D4. Evidence: `docs/usability/screens/fixes/before/` and `fixes/after/`.

| Fix | Result |
|-----|--------|
| F3 list options and list info cards | `width: 100%`, `maxWidth: 340`. 360: card 20 to 340 (320 wide), page scroll width 360, no element outside the card, no clipped label ("Added to your templates!" fits; the due line wraps to two lines, no truncation). 375: centred, 20px each side (was 5px off). 393 and 440: 340 wide at the same position as before |
| F4 custom days | Buttons `min(45px, (100% - 12px) / 7)`, square, 2px minimum gap. 360: 42.8px, gaps 2.0-2.1px, last button ends at the content edge, no overflow; selection colours correct. 375 and 393: 45px, positions unchanged |
| F2 tutorial sheet | Under 740pt tall the tutorial sheet starts at the safe area top. 375 x 667 browser: every page of both tutorials shows its demo, including the attachment sequence (typed text and paperclip, Add an attachment overlay now fully visible, Photos grid); Back navigation and drag-close work. SE 3rd gen simulator: panel below the status bar, demo visible on every page checked, notification ask page fits. 466 x 678 (iPhone Duo outer): applies. 393 x 852 and 440 x 956: sheet top 140.6px, as before |

- F9 keyboard on the SE 3rd gen simulator (outstanding check, now done): the title, tick and text field stay visible; the keyboard bar covers the Date row and Time and Repeats sit behind the keyboard. Usable (the keyboard closes with its tick). Not changed.
- Test artefact only: resizing the browser with the custom days panel open from 360 to 393 hid the divider under the day row (the panel keeps the height it measured at 360). Opened fresh at 393 it matches the before screenshot. Phones do not resize, so no change.

### Milestone 1 recommendation (for John and Kai)

- Minimum width: 360pt. 320pt fails across tutorials, date picker and settings (F1, F6, F7, F8) and is confirmed unsupported. 360 needs two contained fixes: F3 (list options card) and F4 (custom days).
- Minimum height: 667pt. It needs F2 (tutorial mock-up) fixed to pass; F5 and F6 are usable with a scroll. 568 is below the floor.
- This keeps the proposed iPhone floor (375 x 667, SE 2 / 3) and the Android design floor (360dp). 360 x 640 (older Android) is 27pt shorter than anything tested; check it when Android work starts.
- Before sign-off: run the keyboard check on the SE 3rd gen simulator (panel access needed).
