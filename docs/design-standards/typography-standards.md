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

## 3. Type scale used on the app screens

Default weight is Bold (700) unless stated. Colours are the roles in [colour-standards.md](./colour-standards.md).

| Style | Size | Weight rendered | Colour | Note |
|-------|------|-----------------|--------|------|
| Panel title | 20px | Bold | Reminderly dark blue `#1C2C42` | |
| Row title, setting label, button label | 17px | Bold | Reminderly dark blue `#1C2C42` (buttons white) | |
| Description text | 17px | Regular ("Medium") | Description grey `#939393` | 14px for section subtitles |
| Row subtitle | 14px | Bold | Medium grey `#BABABA` | |
| Filter pill | 14px | Bold | Category colour | |
| Sub-header | 15px | Bold | Medium grey `#BABABA` | Found in the tutorial refresh row (`Frame681.tsx`); see section 5 |
| Empty state | 17px | Regular (plain Lato, no bold; `App.tsx:583`) | `#CCCCCC` (`#BABABA` for the calendar empty day) | The calendar empty day was not checked |

Weights in this table other than Description text, Sub-header and Empty state are the previous version's default (Bold) and were not re-checked row by row.

Centred overlay text (Header 20px, Title 17px, Header subtitle 15px, information page body 17px, and the line heights and spacing) is defined once, in [overlay-standards.md](./overlay-standards.md), and is not repeated here.

Sizes also found in the code and not classified here: 12px (calendar caption), 16px (Dev tools login fields in SemiBold, calendar day numbers), 22px (tutorial and Dev tools login text). Sizes with decimals (for example 11.834px, 9.751px) are tutorial replicas scaled by the phone's width and are not separate standards.

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
- 12px, 16px and 22px text styles are in the code but not classified.
- Another app records its font files and weights in its own design document before adopting the overlay standard; Noterly's font assets are not yet confirmed.
