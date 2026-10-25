# Screen size testing

Usability testing of Reminderly across supported screen sizes, before upgrades and payments. Started 2026-10-25 (John, Claude; reports to Kai, CTO).

## Status

| Stage | Status |
|-------|--------|
| 1. Current state review and support proposal | Complete (2026-10-25) |
| 2. Test set, method and documentation | Complete (2026-10-25, this document) |
| 3. Milestone 1: smallest supported screen (minimum width and minimum height) | Not started |
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

None yet.
