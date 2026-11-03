# Overlay pilot reference sheet

**Version:** 1.1, 2026-11-03. Version 1.0 approved by John, 2026-11-03 (standing in for the CTO); version 1.1 additions proposed for his approval. Part of the [design standards](./README.md). Applies to any app comparing its overlays with Reminderly's; written for the Noterly pilot (one confirmation dialog and one scrolling overlay).
**Purpose:** a pass or fail basis for the side-by-side comparison. It records, for one real Reminderly confirmation dialog and one real scrolling overlay, where everything sits at the four supported screen sizes. It does not restate the standard; the rules are in [overlay-standards.md](./overlay-standards.md).

## 1. How the values were taken, and the limits

- **Measured** values are the rectangles the running app reports for each element (left, top, width, height in points, to two decimals), read on 2026-11-03.
- **Computed** values are derived from measured rectangles plus Lato's font metrics (stated where used). They are marked "computed".
- **Environment:** Reminderly's Vite preview in a desktop browser (Chromium engine) at emulated viewport sizes, with Lato 400, 700 and 900 bundled (`@fontsource/lato` 5.3.0). **They were not taken on a device or in the iOS web view.** The engine rounds line heights to whole pixels, and a different engine may differ; that is exactly what [font-rendering-validation.md](./font-rendering-validation.md) checks in the target app's own environment.
- Positions are from the top-left corner of the viewport. Sizes: 360 x 667, 375 x 667, 390 x 844, 402 x 874 (portrait).
- **Tolerance** (approved by John with this document, 2026-11-03): positions and sizes within 1px of the reference; the 30px glyph spacing within 0.5px. Text content, and therefore text heights and scroll lengths, are content-dependent; compare structure, not text length.

## 2. Reference A: confirmation dialog

Reminderly's Dev tools "Turn off reminders?" confirmation, the standard's Header, Title (message) and two equal-width buttons. Copy: Header "Turn off reminders?"; Title "The app will show Lists only. Reminder notifications stop and the badge clears. Reminders and settings are kept." The message wraps to four lines at all four sizes, so the card height is the same at every size.

### 2.1 Measured at each size

| Element | 360 x 667 | 375 x 667 | 390 x 844 | 402 x 874 |
|---------|-----------|-----------|-----------|-----------|
| Card (left, top, width, height) | 20, 188.88, 320, 289.25 | 20, 188.88, 335, 289.25 | 25, 277.38, 340, 289.25 | 31, 292.38, 340, 289.25 |
| Header (left, top, width, height) | 92.88, 228.88, 174.23, 24 | 100.38, 228.88, 174.23, 24 | 107.88, 317.38, 174.23, 24 | 113.88, 332.38, 174.23, 24 |
| Title, message (left, top, width, height) | 50, 274.13, 260, 84 | 50, 274.13, 275, 84 | 55, 362.63, 280, 84 | 61, 377.63, 280, 84 |
| Cancel button (left, top, width, height) | 50, 388.13, 115, 50 | 50, 388.13, 122.5, 50 | 55, 476.63, 125, 50 | 61, 491.63, 125, 50 |
| Turn off button (left, top, width, height) | 195, 388.13, 115, 50 | 202.5, 388.13, 122.5, 50 | 210, 476.63, 125, 50 | 216, 491.63, 125, 50 |

Also measured, at 360 x 667 only (rectangles above are measured at all four sizes; these style values were not re-read at the other three): card padding 40 top, 30 right, 40 bottom, 30 left; card corner radius 32; card shadow none; backdrop black at 50%; Header Lato Bold 20px, line height 24px, colour `#1C2C42`; Title Lato Bold 17px, colour `#939393`; button label Lato Bold 17px white; button horizontal padding 18; button radius 100; Cancel background `#BABABA`; Turn off background `#4784F8`.

### 2.2 Derived relationships (checks that hold at every size)

| Relationship | Value | Basis |
|--------------|-------|-------|
| Card centred vertically (space above equals space below) | 188.88 / 188.87 at 667; 277.38 / 277.37 at 844; 292.38 / 292.37 at 874 | Computed from measured card top and height |
| Card centred horizontally; side gap | 20, 20, 25, 31 | Measured |
| Card top to Header top | 40 | Measured |
| Header box bottom to Title box top | 21.25 | Measured (252.88 to 274.13) |
| Header baseline to Title cap top | 29.96 | **Computed**: Header baseline is 20 below the top of its box and the Title cap top is 4.71 below the top of its line box (Lato metrics, see the validation procedure) |
| Title box bottom to buttons top | 30 | Measured |
| Gap between the two buttons | 30 | Measured (e.g. 165 to 195 at 360) |
| Buttons bottom to card bottom | 40 | Measured |
| Buttons equal width; combined width plus gap equals content width | 115+115+30 = 260; 122.5+122.5+30 = 275; 125+125+30 = 280 | Measured |

## 3. Reference B: scrolling overlay

Reminderly's Privacy policy page (Settings, then Support, then Privacy policy). It scrolls at all four sizes, has a fixed header area with a Header and two Header subtitle lines, a scrolling body and the scroll indicator. It is a settings sub-page, so its card takes the shared settings card height (464) and has a back arrow in the header. **It has no pinned footer control** (the pinned Back variant used on information pages is not in this reference).

### 3.1 Measured at each size

| Element | 360 x 667 | 375 x 667 | 390 x 844 | 402 x 874 |
|---------|-----------|-----------|-----------|-----------|
| Card (left, top, width, height) | 20, 101.5, 320, 464 | 20, 101.5, 335, 464 | 25, 190, 340, 464 | 31, 205, 340, 464 |
| Header (left, top, width, height) | 93.48, 141.5, 173.03, 24 | 100.98, 141.5, 173.03, 24 | 108.48, 230, 173.03, 24 | 114.48, 245, 173.03, 24 |
| Header subtitle 1, "Version 1.0" (left, top, width, height) | 143.13, 173.5, 73.75, 20 | 150.63, 173.5, 73.75, 20 | 158.13, 262, 73.75, 20 | 164.13, 277, 73.75, 20 |
| Header subtitle 2, "Last updated" (left, top, width, height) | 77.67, 193.5, 204.64, 20 | 85.17, 193.5, 204.64, 20 | 92.67, 282, 204.64, 20 | 98.67, 297, 204.64, 20 |
| Back arrow tap area (left, top, width, height) | 32, 131, 45, 45 | 32, 131, 45, 45 | 37, 219.5, 45, 45 | 43, 234.5, 45, 45 |
| Scrolling area (left, top, width, height) | 50, 233.5, 260, 302 | 50, 233.5, 275, 302 | 55, 322, 280, 302 | 61, 337, 280, 302 |
| First text block (left, top, width, height) | 50, 237.22, 260, 96 | 50, 237.22, 275, 96 | 55, 325.72, 280, 96 | 61, 340.72, 280, 96 |
| Scroll indicator chevron (left, top, width, height) | 174, 547, 12, 7 | 181.5, 547, 12, 7 | 189, 635.5, 12, 7 | 195, 650.5, 12, 7 |
| Scroll height of the text (content dependent) | 2212 | 2164 | 2140 | 2140 |

### 3.2 Derived relationships (hold at every size)

| Relationship | Value | Basis |
|--------------|-------|-------|
| Card height | 464 at every size (the shared settings card height) | Measured |
| Card centred vertically | 101.5 above and below at 667; 190 at 844; 205 at 874 | Computed from measured card top and height |
| Card top to Header top | 40 | Measured |
| Header box bottom to first subtitle top | 8 | Measured (165.5 to 173.5 at 667) |
| Subtitle 1 to subtitle 2 | 0 (directly stacked) | Measured |
| Header area bottom (end of subtitle 2) to scrolling area top | 20 (the clip edge) | Measured (213.5 to 233.5 at 667) |
| Header area bottom to the cap top of the first text line | 30 | **Computed**: text top plus 1.5 half-leading plus 4.71 cap offset; the first line sits 30 below the header area |
| Scrolling area height | 302 at every size | Measured |
| Scrolling area bottom to card bottom | 30 (the overflow footer holding the indicator) | Measured (535.5 to 565.5 at 667) |
| Indicator chevron centred horizontally | Card left plus (card width minus 12) divided by 2 | Computed from measured values, e.g. 20 + 154 = 174 at 360 |
| Indicator centred vertically in the 30px footer | Scrolling area bottom plus 11.5 | Computed from measured values, e.g. 535.5 + 11.5 = 547 |
| Header and subtitles stay fixed while the text scrolls | Required by the standard | Not measured in this reference (header rectangles were read only at scroll position 0) |
| Indicator present at the top of the scroll | Yes, at all four sizes | Measured |
| Indicator absent when the end is reached | Confirmed at 402 x 874 only | Measured at 402 x 874; the other three sizes were not confirmed (the page's visibility, which the app uses to close its settings, prevented re-measurement) |

### 3.3 Reference B at the end of the scroll: the "Back to top" button

The Privacy policy page (and Terms of use and the FAQs) ends with a **Back to top** button inside the scrolling text, not pinned. This was missing from version 1.0 of this sheet, which read the page only at the top of the scroll. Measured at each size with the text scrolled to its end:

| Element | 360 x 667 | 375 x 667 | 390 x 844 | 402 x 874 |
|---------|-----------|-----------|-----------|-----------|
| Scrolling area (left, top, width, height) | 50, 233.5, 260, 302 | 50, 233.5, 275, 302 | 55, 322, 280, 302 | 61, 337, 280, 302 |
| Last text block (left, top, width, height) | 50, 373.36, 260, 72 | 50, 373.36, 275, 72 | 55, 461.86, 280, 72 | 61, 476.86, 280, 72 |
| Back to top button (left, top, width, height) | 50, 485.36, 260, 50 | 50, 485.36, 275, 50 | 55, 573.86, 280, 50 | 61, 588.86, 280, 50 |
| Scroll height of the text (content dependent) | 2212 | 2164 | 2140 | 2140 |

Also measured (402 x 874): button background `#4784F8`, label Lato Bold 17px; a tap scrolls the body back to the top (scroll position 1838 to 0) and the chevron reappears.

| Relationship | Value | Basis |
|--------------|-------|-------|
| Last text block bottom to button top | 40.00 (373.36 + 72 = 445.36; 485.36 - 445.36) | Measured |
| Button bottom to scrolling area bottom | 0.14 above the bottom edge (535.36 against 535.5 at 360 and 375) | Measured; a fractional content height |
| Button is the last item inside the scrolling content, not pinned | Yes | Reminderly source (`DocTopButton`) |

The indicator chevron at the end of the scroll could not be reliably re-measured in the desktop preview: a scroll set by script does not always fire the page's scroll event, so the chevron's end state in this environment is unreliable. Use a simulator or device with a finger scroll.

## 4. Reference C: Header, Title and three standard buttons

Reminderly's Reminder info overlay for a reminder with no schedule: Header "Pick up the dry cleaning" (the reminder text), Title "No schedule set", then three stacked buttons "Mark as done" (`#4784F8`), "Edit reminder" (`#4784F8`) and "Delete reminder" (`#939393`). Measured in the desktop preview (Chromium), 2026-11-03.

| Element | 360 x 667 | 375 x 667 | 390 x 844 | 402 x 874 |
|---------|-----------|-----------|-----------|-----------|
| Card (left, top, width, height) | 20, 140.38, 320, 386.25 | 20, 140.38, 335, 386.25 | 25, 228.88, 340, 386.25 | 31, 243.88, 340, 386.25 |
| Header (left, top, width, height) | 74.36, 180.38, 211.28, 24 | 81.86, 180.38, 211.28, 24 | 89.36, 268.88, 211.28, 24 | 95.36, 283.88, 211.28, 24 |
| Title (left, top, width, height) | 120.23, 225.63, 119.52, 21 | 127.73, 225.63, 119.52, 21 | 135.23, 314.13, 119.52, 21 | 141.23, 329.13, 119.52, 21 |
| Button 1 (left, top, width, height) | 50, 276.63, 260, 50 | 50, 276.63, 275, 50 | 55, 365.13, 280, 50 | 61, 380.13, 280, 50 |
| Button 2 (left, top, width, height) | 50, 356.63, 260, 50 | 50, 356.63, 275, 50 | 55, 445.13, 280, 50 | 61, 460.13, 280, 50 |
| Button 3 (left, top, width, height) | 50, 436.63, 260, 50 | 50, 436.63, 275, 50 | 55, 525.13, 280, 50 | 61, 540.13, 280, 50 |

Derived, true at every size: card top to Header top 40; Header box bottom to Title top 21.25; Title box bottom to Button 1 top 30; buttons 30 apart; Button 3 bottom to card bottom 40; card centred vertically. **The Title box shrink-wraps its text** (119.52 wide, centred), like the Header box; a full-width Title box does not match this sheet's rectangles even though the text looks the same.

## 5. Reference D: settings overlay home page

Reminderly's Reminders settings home page: a centred Header, toggle rows first, then click-through rows. It has **2 toggles and 4 click-throughs (6 rows)**; an app pilot with 3 toggles and 3 click-throughs also has 6 rows, so the card height compares (464). Compare rows by position in the sequence and by structure, not by label. Measured in the desktop preview (Chromium), 2026-11-03.

| Element | 360 x 667 | 375 x 667 | 390 x 844 | 402 x 874 |
|---------|-----------|-----------|-----------|-----------|
| Card (left, top, width, height) | 20, 101.5, 320, 464 | 20, 101.5, 335, 464 | 25, 190, 340, 464 | 31, 205, 340, 464 |
| Header "Reminders settings" (left, top, width, height) | 70.45, 141.5, 219.08, 24 | 77.95, 141.5, 219.08, 24 | 85.45, 230, 219.08, 24 | 91.45, 245, 219.08, 24 |
| Toggle row 1 label (left, top, width, height) | 50, 199, 145.44, 23 | 50, 199, 145.44, 23 | 55, 287.5, 145.44, 23 | 61, 302.5, 145.44, 23 |
| Toggle 1 (left, top, width, height) | 254, 195.5, 56, 30 | 269, 195.5, 56, 30 | 279, 284, 56, 30 | 285, 299, 56, 30 |
| Toggle row 2 label (left, top, width, height) | 50, 259, 148.34, 23 | 50, 259, 148.34, 23 | 55, 347.5, 148.34, 23 | 61, 362.5, 148.34, 23 |
| Toggle 2 (left, top, width, height) | 254, 255.5, 56, 30 | 269, 255.5, 56, 30 | 279, 344, 56, 30 | 285, 359, 56, 30 |
| Click-through chevron 1 (left, top, width, height) | 288, 324, 7, 13 | 303, 324, 7, 13 | 313, 412.5, 7, 13 | 319, 427.5, 7, 13 |
| Click-through chevron 2 | 288, 384, 7, 13 | 303, 384, 7, 13 | 313, 472.5, 7, 13 | 319, 487.5, 7, 13 |
| Click-through chevron 3 | 288, 444, 7, 13 | 303, 444, 7, 13 | 313, 532.5, 7, 13 | 319, 547.5, 7, 13 |
| Click-through chevron 4 | 288, 504, 7, 13 | 303, 504, 7, 13 | 313, 592.5, 7, 13 | 319, 607.5, 7, 13 |

Derived, true at every size (computed from the measured values):
- Header box bottom to the first toggle row top: 30 (245 + 24 = 269; row top 299).
- **Every row is 30px high and rows are 60px apart** (30 high plus a 30 gap), for toggle rows and click-through rows alike. The toggle is 30 high, so a toggle row is the toggle's height.
- **A row's label is vertically centred in the 30px row** (a 23px label starts 3.5 below the row top: 302.5 against a row top of 299). It is not top aligned.
- Toggle right edge is 30 inside the card's right edge (341 against a card right of 371 at 402). The label left edge is 30 inside the card's left edge.
- **A click-through chevron is vertically centred in its 30px row** (13 high, 8.5 below the row top) and its right edge is **15px left of the toggle's right edge** (326 against 341 at 402).
- The last toggle row bottom to the first click-through row top is 30 (389 to 419 at 402; first chevron top 427.5).
- Card height 464 is the natural height: 40 + 24 (Header) + 30 + 6 rows x 30 + 5 gaps x 30 + 40 (this is the same for 3 toggles and 3 click-throughs).

## 6. How to use this sheet in the pilot

1. Build the pilot dialog with the same structure and the same copy (or the same number of message lines) and compare each row of section 2 at all four sizes.
2. Build the pilot scrolling overlay with a Header, two subtitle lines and a long body, and compare the structural rows of section 3. Do not compare scroll length or text height.
3. Record each row as pass or fail against the tolerance, with the app's own measured value, in the app's own design document.
4. Before any of this, complete [font-rendering-validation.md](./font-rendering-validation.md). A difference in font files or rendering must be resolved or recalculated first.

## 7. Not covered

The pinned footer control variant (used on information pages and the Dev tools information overlay); sub-pages of the settings overlay; the Reminder info overlay variants with a Move to tomorrow button or a repeat line; the end of the scroll chevron in the desktop preview; measurements on an iPhone or in the iOS web view; maximum card heights at 844 and 874 high (computed, not measured, because no overlay is tall enough to reach them).

## 8. Version history

**1.0 — 2026-11-03.** First version. Reference A (Dev tools confirmation dialog) and Reference B (Privacy policy page) measured in Reminderly's browser preview at the four supported sizes. Indicator end state confirmed at 402 x 874 only.

**1.1 — 2026-11-03.** Added the Back to top button at the end of Reference B (missed in 1.0), Reference C (Header, Title and three buttons) and Reference D (settings overlay home page), measured in the desktop preview. Measured values only; computed values marked. Proposed for John's approval.
