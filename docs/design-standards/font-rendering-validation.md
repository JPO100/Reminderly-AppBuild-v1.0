# Font and rendering validation procedure

**Version:** 1.0, 2026-11-03. Approved by John, 2026-11-03 (standing in for the CTO). Part of the [design standards](./README.md). Applies to any NeatlyMade app that adopts the overlay or typography standards; written first for Noterly.
**Purpose:** the overlay spacing rules are derived from how Lato renders in Reminderly's environment. Before an app claims overlay or typography parity, it proves, in its own rendering environment, that the same fonts render the same way, and recalculates any figure that does not match. Parity is claimed only after this procedure passes.

**Decision (John, 2026-11-03):** Noterly mirrors Reminderly's typography throughout the whole app, not only in centred overlays: the same Lato assets (weights 400, 700 and 900), the same rendered weights, sizes and semantic styles ([typography-standards.md](./typography-standards.md)). This procedure is how that is validated against Noterly's actual rendering environment.

## 1. What to record first

Write these into the app's own design document before starting:

- The app's stack and how it renders text (for example a web view in a native iOS app, or a different engine).
- The operating system and device or simulator used for each measurement.
- The Lato package or files used and their version.

Where measurements can be taken on a real device, take them there as well. Reminderly's reference measurements were taken in a desktop browser preview, not on a device (see [overlay-pilot-reference.md](./overlay-pilot-reference.md)).

## 2. Step 1: confirm the font files

Reminderly bundles Lato from `@fontsource/lato` 5.3.0, weights **400, 700 and 900**, Latin and Latin Extended, as WOFF2 (and WOFF). Confirm the app loads the same files:

1. List the files the app bundles for Lato.
2. Compute the SHA-256 of each and compare with the table below (first 16 hex characters shown). A match means the same font file. A mismatch means a different version or build: record it, and treat every later step as needing recalculation.
3. Confirm no other Lato weight is bundled (there must be no 500 or 600 file).

| File (`@fontsource/lato` 5.3.0) | SHA-256 (first 16 characters) |
|-------------------------------|-------------------------------|
| lato-latin-400-normal.woff2 | 918b7dc3e2e2d015 |
| lato-latin-700-normal.woff2 | c447dd7677b419db |
| lato-latin-900-normal.woff2 | 08664859baab5ed9 |
| lato-latin-ext-400-normal.woff2 | 8b9fc9737043f88c |
| lato-latin-ext-700-normal.woff2 | 3a5797f440bc67b5 |
| lato-latin-ext-900-normal.woff2 | e266d64fae095874 |
| lato-latin-400-normal.woff | f55abc76e10cc86d |
| lato-latin-700-normal.woff | 98149dd994189af5 |
| lato-latin-900-normal.woff | 8498bfffde51ce9d |
| lato-latin-ext-400-normal.woff | e1723d6f84b3ba7f |
| lato-latin-ext-700-normal.woff | c2a0d4ce71a1504f |
| lato-latin-ext-900-normal.woff | 97b4cb0469f1c560 |

## 3. Step 2: confirm the weight mapping

Reminderly maps the design-tool names to CSS weights in `src/styles/theme.css` and has no 500 or 600 file, so:

- "Lato Medium" (500) must render as Regular 400.
- "Lato SemiBold" (600) must render as Bold 700.
- Bold renders 700 and ExtraBold renders 900.

Check: render a line in each of the five names, and confirm which face the engine used (in a browser, `document.fonts` lists the loaded faces; use the platform's equivalent elsewhere). The rendered "Medium" must look identical to Regular. If the app bundles a true 500 or 600 file, the app does not match Reminderly; remove it or record the difference.

## 4. Step 3: measure the rendered line box, baseline and cap top

For each of Lato Bold 17px with normal line height, and Lato Bold 20px with a fixed 24px line height, render one line of capital text (for example "Hxg") in the app's environment and measure:

1. The height of the line box.
2. The distance from the top of the line box to the baseline.
3. The distance from the top of the line box to the top of a flat capital letter (the cap top).

Reminderly's reference values, in its browser preview (rounded to whole pixels by the engine):

| Style | Line box | Baseline below top of box | Cap top below top of box |
|-------|----------|---------------------------|--------------------------|
| Lato Bold 17px, normal line height | 21px | 17px | 4.71px (computed: baseline minus 0.723 x 17) |
| Lato Bold 20px, line height fixed at 24px | 24px | 20px | 5.54px (computed: baseline minus 0.723 x 20) |

Metrics used (per em, from the font file): ascent 0.987, descent 0.213, cap height 0.723.

A browser can measure the line box and baseline directly (a zero-height inline-block aligned to the baseline gives the baseline position). On other engines, measure with the platform's text-layout API or compare screenshots at a fixed scale.

If the app's measured values equal these: the overlay spacing figures stand. If they differ in any value: go to step 4.

## 5. Step 4: recalculate the dependent figures

Every spacing rule that is measured on the glyphs depends on these numbers. Recompute them from the app's own measurements:

- **Header to Title, and Title to Title:** the box gap between two lines is `30 - (box bottom - baseline of the upper line) - (cap top below top of the lower line's box)`. With the iOS web view's values (Header baseline 19 below the top of its 24px box, so 5 above the bottom; Title cap top 4.72 below the top of its line box): `30 - 5 - 4.72 = 20.28` (`HEADER_TITLE_GAP`). Chromium (the desktop preview) gives a Header baseline of 20, so `30 - 4 - 4.71 = 21.29`, and the standard's earlier 21.25 came from there; that figure read 30.7 pt in the iOS web view. **The environment the app runs in governs.** Use the measured, engine-rounded values of the app's own environment, and record which environment and method you used. Then check by pixel reading on a simulator at 2x and 3x (see [overlay-pilot-reference.md](./overlay-pilot-reference.md), section 2.3).
- **30px below the header area:** measured from the bottom of the last line's box, so it needs no font-dependent term; it still must be 30px in the app.
- **Title-line icon rows, Header subtitle and the 21px line box:** recheck any row whose height depends on a line box.

Record the recomputed figures in the app's own design document. Do not change the standard to match one app.

## 6. Step 5: verify on a real overlay

Build one overlay (the pilot) and measure, in the app's environment, the Header-to-Title distance from the baseline to the cap top. Expected: 30px within the tolerance in [overlay-pilot-reference.md](./overlay-pilot-reference.md). Then compare it with the reference sheet at all four sizes.

## 7. Result

The app records, in its own design document: the environment (section 1), the file comparison (step 1), the weight check (step 2), the measured values and any recalculated figures (steps 3 and 4), and the pilot check (step 5), each marked passed, recalculated or failed, with the date. Parity is claimed only when every step is passed or recalculated and the pilot comparison passes.

## 8. Version history

**1.0 — 2026-11-03.** First version: file comparison with hashes, weight mapping, line box, baseline and cap top measurement, recalculation and pilot check. Reference values measured in Reminderly's browser preview, not on a device.
