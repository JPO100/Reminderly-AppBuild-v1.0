# Typography standards

**Version:** 1.0, 2026-11-03. Part of the [design standards](./README.md). Owner: Reminderly; other NeatlyMade apps take a copy and record their own font assets.
**Reviewed:** 2026-11-03 against the code (`src/styles/fonts.css`, `src/styles/theme.css`, the components named below). Where the code and this document differ, the code is the source of truth and this document is corrected.

## 1. The font

**Lato**, bundled with the app so it makes no font requests: package `@fontsource/lato` 5.3.0 (`^5.3.0` in `package.json`), SIL Open Font License, Latin and Latin Extended subsets. **Only three weights are bundled: 400, 700 and 900** (`src/styles/fonts.css`). There is no 500 or 600 file.

## 2. Weight names and what is actually rendered

The code and our documents use design-tool names. Each name is mapped to a CSS weight by `src/styles/theme.css`, and the browser then uses the nearest bundled file.

| Name used in code and documents | CSS weight set | Face actually rendered | Where used (class count, 2026-11-03) |
|---------------------------------|----------------|------------------------|--------------------------------------|
| Lato (plain, no weight name) | 400 unless `font-bold` | Regular 400 (Bold 700 with `font-bold`) | 81 |
| **Lato Medium** | 500 | **Regular 400**, because there is no 500 file | 26 |
| **Lato SemiBold** | 600 | **Bold 700**, because there is no 600 file | 17 |
| Lato Bold | 700 | Bold 700 | 342 |
| Lato ExtraBold | 900 | Black 900 | 2 |

So wherever this standard says "Lato Medium" the rendered text is **Lato Regular (400)**, and "SemiBold" renders as **Bold (700)**. An app that bundles a true Lato Medium (500) would render these styles differently from Reminderly, so another app matches Reminderly by using Regular 400 for every "Medium" style, not by adding a Medium file.

## 3. Type scale and where each style is used

Each style is one row: the font, size and weight actually rendered, the colour role, and a plain-English description of where it appears. **Status** says whether the usage was confirmed in the code on 2026-11-03 (file named) or is **unverified** (taken from the previous document or another standard and not confirmed). Colours are the roles in [colour-standards.md](./colour-standards.md). Detailed overlay geometry and spacing stay in [overlay-standards.md](./overlay-standards.md); the overlay rows here only name the styles.

### App screens (panels, lists, settings)

| Style | Font, size, rendered weight | Colour | Where it is used | Status |
|-------|-----------------------------|--------|------------------|--------|
| Panel title | Lato, 20px, Bold | Reminderly dark blue `#1C2C42` | The main heading at the top of a slide-up panel or screen, for example "List templates", and the month title in the calendar view | Verified (`App.tsx`: "List templates", calendar month title) |
| Row title | Lato, 17px, Bold | Reminderly dark blue `#1C2C42` | The first line of a reminder or list row, for example "Water the plants" | Verified (measured at 17px in the running app) |
| Setting label | Lato, 17px, Bold | Reminderly dark blue `#1C2C42` | The name of a setting row in the Reminders and Lists settings and in Dev tools | Verified (`SettingsPanelContent.tsx`, `DevToolsOverlay.tsx` rows) |
| Button label | Lato, 17px, Bold | White | The text on a rounded button, for example "Back", "Close", "Mark as done" | Verified (`SettingsPanelContent.tsx`, overlays) |
| Description text | Lato "Medium", 17px, rendered Regular 400, 23px line height, left-aligned | Description grey `#939393` | Explanatory paragraphs on settings pages | Verified (`SettingsPanelContent.tsx`, description class) |
| Section subtitle | Lato "SemiBold", 14px, rendered Bold 700 | Description grey `#939393` | A short explanatory line under a Dev tools section heading | Verified in Dev tools only (`DevToolsOverlay.tsx`); use elsewhere is unverified, and the previous document gave it as Medium |
| Row subtitle | Lato, 14px, Bold | Medium grey `#BABABA` | The second line of a reminder or list row giving detail, for example "Today at 6pm. Every week (Mon)" | Verified for size and use (measured at 14px); weight is the previous document's default and not re-checked |
| Filter pill | Lato, 14px, Bold | Category colour | The label inside a pill-shaped button. Confirmed for the Done, Deleted and Clear all pills; the Today, This week and Later pills are unverified | Partly verified (`App.tsx`) |
| Sub-header | Lato, 15px, Bold | Medium grey `#BABABA` | The second line of the tutorial refresh row ("Take a refresh of the onboarding tutorial"). The only place found | Verified (`Frame681.tsx`) |
| Empty state | Lato, 17px, Regular 400 | Empty-state grey `#CCCCCC` | The message shown in the middle of a list that has nothing in it | Verified for the component (`App.tsx` `DelayedEmptyState`); the individual messages and the calendar empty day (`#BABABA`) are unverified |

### Centred overlays (full rules in overlay-standards.md)

| Style | Font, size, rendered weight | Colour | Where it is used | Status |
|-------|-----------------------------|--------|------------------|--------|
| Header | Lato, 20px, Bold, one line, truncates | Reminderly dark blue `#1C2C42` | The main heading at the top of a centred overlay, for example "Turn on notifications?" | Verified (`OverlayHeader.tsx`) |
| Title | Lato, 17px, Bold | Description grey `#939393` | A line of text directly under the Header: the due, smart reminder and repeats lines in Reminder info, and the message in a confirmation or notice dialog | Verified (`OverlayHeader.tsx`, `ReminderInfoOverlay.tsx`) |
| Header subtitle | Lato "Medium", 15px, rendered Regular 400, 20px line height | Medium grey `#BABABA` | The version and last-updated lines under the Header on the Privacy policy and Terms of use pages | Verified (`SettingsPanelContent.tsx` `PanelHeader`) |
| Information page body | Lato "Medium", 17px, rendered Regular 400, 24px line height, centred | Description grey `#939393` | The explanation text on a settings information page and on a Dev tools information overlay | Verified (`SettingsPanelContent.tsx`, `DevToolsOverlay.tsx`) |
| Overlay button label | Lato, 17px, Bold | White | The text on a button inside a centred overlay | Verified |
| Toggle row title | Lato, 17px, Bold, 17px line height | Reminderly dark blue `#1C2C42` | The name of a toggle row in an overlay, for example "Set smart reminder" | Verified (`InfoOverlay.tsx`, `list-info-overlay.tsx`, toggle review 2026-11-03) |
| Toggle row subtitle | Lato, 14px, Bold, 14px line height | Medium grey `#BABABA` | The explanatory line under a toggle row title, for example the due-by date under "Set smart reminder" | Verified (`InfoOverlay.tsx`, toggle review 2026-11-03) |

Weights in the "Row subtitle" row, and any weight marked unverified, are the previous document's default (Bold) and were not re-checked row by row.

**Differences found, not changed here.** The full-width "New reminder" and "New template" buttons use a **20px** white Bold label (`App.tsx`, "New reminder" button and "New template" button), while `controls-standards.md` gives the New reminder / New list button label as 17px. That is a conflict between a standard and the code; it is not a new style and is left for John to decide, in the controls standards review.

Sizes also found in the code and not classified here: 12px (calendar caption), 16px (Dev tools login fields in SemiBold, calendar day numbers), 22px (tutorial and Dev tools login text), and a 20px reminder text field in the New reminder header (`Header.tsx`). Sizes with decimals (for example 11.834px, 9.751px) are tutorial replicas scaled by the phone's width and are not separate standards.

## 4. Font metrics and rendering

Lato (as bundled), per em: ascent 0.987, descent 0.213, cap height 0.723; the line box with `line-height: normal` is 1.2em in the font's own terms.

**As rendered in Reminderly's web view (measured 2026-11-03):** the browser rounds ascent and descent to whole pixels, so a 17px line with `line-height: normal` is **21px** high (not 20.4px), with its baseline 17px below the top and 4px above the bottom; the overlay Header is set to a fixed 24px line. The overlay spacing rules (30px baseline to cap top, a 21.25px gap between boxes) are derived from these values in [overlay-standards.md](./overlay-standards.md).

An app that uses different font files, a different rendering environment or different rounding must measure its own rendered baseline and cap top and recompute those figures. It must not assume it matches Reminderly.

## 5. Sub-header and Header subtitle

These are different things and both keep their definitions:

- **Header subtitle** (overlay standard): Lato Medium (rendered Regular 400) 15px, `#BABABA`, 20px line height, under an overlay's Header.
- **Sub-header** (this document): Lato Bold 15px, `#BABABA`, the second line of a settings row. The only place it was found in the code is the tutorial refresh row ("Take a refresh of the onboarding tutorial", `Frame681.tsx`).

They share size and colour and differ in weight, element and place. The overlap is closed by keeping them as two named styles. Whether the Sub-header and the 14px Row subtitle should become one style is a design decision for John.

## 6. Open items

- Decide whether Sub-header and Row subtitle (15px and 14px) should be one style.
- 12px, 16px, 22px and the 20px reminder text field are in the code but not classified.
- The 20px New reminder and New template button label differs from the 17px in controls-standards.md.
- Usage marked unverified in section 3 is to be confirmed.
- **Noterly (decision by John, 2026-11-03):** Noterly mirrors Reminderly's typography throughout the whole app, not only in centred overlays: the same Lato assets (weights 400, 700 and 900), the same rendered weights, sizes and semantic styles. It validates this in its own rendering environment before claiming parity, using [font-rendering-validation.md](./font-rendering-validation.md). Any other app records its font files and weights in its own design document before adopting.
