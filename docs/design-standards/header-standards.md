# Header standards

Version 1.0, 2026-11-04. Part of the [design standards](./README.md). Owned and updated in Reminderly, shared with Noterly and future NeatlyMade apps by reference: an app links to this document and does not keep a copy. This document owns the header treatment inside a panel: layout, typography, controls, alignment, spacing and variants. Panel anatomy, positioning and spacing are in [panel-standards.md](./panel-standards.md), which keeps the 45px header allocation. Type scale and colours: [typography-standards.md](./typography-standards.md) and [colour-standards.md](./colour-standards.md).

The decisions in this document were approved by John on 2026-11-04. Items under "Not yet decided" in section 8 are open questions, not rules.

The parity principle applies: the two apps keep consistent headers wherever possible; an exception must be deliberate, justified and agreed (section 7).

## 1. Structure

A panel header is a **45px-high row** at the top of the panel, 24px below the panel top (panel-standards.md gives the exceptions to that spacing). It holds, left to right: an optional leading control, the title, and optional trailing controls. The row is 20px in from each side, the same as the panel padding.

- **Header block.** The row plus, when present, a one-line subtitle (section 3) under the title. With a subtitle the block is taller than 45px: the subtitle sits in the title column and the controls stay in the 45px row.
- **Gap to what follows.** 24px from the bottom of the block (panel-standards.md, A2), whether the next section is a sub-header or the content.
- **Page top row.** On a fixed page, the top row is the header row of that panel: 45px high, holding pills or a search field and icon controls (Reminderly's filter row, Noterly's search row).

## 2. Title

| Property | Value |
|----------|-------|
| Typeface | Lato Bold, 20px, one line |
| Colour | Reminderly dark blue `#1C2C42` |
| Vertical position | Centred in the 45px row |

**Colour.** Panel header titles use `#1C2C42` in every app. Ordinary content headings (for example a list heading below a page's top row) keep their existing colours; they are not panel header titles.

**Alignment.**

- Titles are **left-aligned when controls appear only on the right**.
- Titles are **centred when there is a leading navigation control** (back, close or cancel on the left).

A decorative icon is not a control. The same rule applies to equivalent headers in every app.

## 3. Subtitle

One line under the title, in the title column. Lato Bold 15px, medium grey `#BABABA` (a list's "3 of 7", a note's date). Matches the Sub-header style in typography-standards.md.

## 4. Header controls

**Icon controls are 45 x 45px circles.**

| Property | Value |
|----------|-------|
| Size | 45 x 45px, fully round |
| Active | Fill `#4784F8` (Reminderly blue), white glyph |
| Inactive | Fill `#D9D9D9` (inactive grey), white glyph, not tappable |
| **Spacing between controls** | **10px** (also between the pills and the buttons of a page's top row) |
| Glyphs | Close: cross. Back: left chevron. Confirm or save: tick. Options: three dots. Page-level buttons use the same circle with their own glyph (calendar, settings, filters, add folder, select) |

These controls are circles: close, back, cancel, confirm, save, options ("..."), and a page's top-row icon buttons.

**Elements that are not circle controls** but sit in the 45px row with their own style: the title; filter pills (45px high, fully rounded, 1px category outline, label in the category colour); Noterly's search field (45px high, fully rounded, `#EAEAEA` fill).

The tutorial's Back and Close controls are **footer navigation** (35 x 45 grey glyphs), not header controls, and keep their own treatment.

## 5. Variants

| Variant | Where | Layout |
|---------|-------|--------|
| Title and trailing controls | Reminderly New reminder (confirm), Lists editor (options, save); Noterly note panels (options, confirm) | Title left, 1 to 2 circles right. Subtitle under the title where there is one |
| Leading and trailing controls | Reminderly Repeats (cancel, confirm); Noterly Link panel (close, confirm); Dev tools pages (back, close) | Circle left, title centred, circle right |
| Page top row | Reminderly main pages: pills and two circle buttons; Noterly folder and note lists: search field and two circle buttons | Pills or the field fill the row, circles right, 10px apart |
| Optional sub-header | A 40px row below the header (panel-standards.md) | A second line of filters or context, same left edge, 24px below the header |

## 6. Inactive state

An inactive confirm or save control is the `#D9D9D9` circle with a white glyph and does not respond to taps. It becomes `#4784F8` when the action is available.

## 7. Agreed exceptions

| Header | Exception | Agreed |
|--------|-----------|--------|
| Noterly note panels | The 58px expand/collapse arrow band sits at the top of the panel, so the header row starts below the band instead of 24px below the panel top (panel-standards.md) | John, 2026-11-04 (decision A) |
| Tutorial footer navigation | Back and Close are 35 x 45 grey glyphs, not circles; they are footer navigation, not header controls | CTO, 2026-11-04 |

## 8. Not yet decided

These are questions the audit raised that no decision covers. They are not rules.

1. **Subtitle and editable titles.** The subtitle style in section 3 matches the existing Sub-header style, and editable titles (a list name, a note title) use the title style in a field with no box; neither was decided separately.
2. **Glyph set.** The glyphs in section 4 are what both apps use today; no decision fixes them.
3. **Dev tools headers.** Applying the alignment rule to the Dev tools pages would left-align Reminderly's Dev tools home title (today centred, beside a decorative robot icon) and centre Noterly's Dev tools page titles (today left-aligned beside the back control). Whether to change them is a decision for the CTO and John.
4. **Heading rows below a page's top row** (Noterly's "Your folders" and "< My notes" row) have no Reminderly equivalent. They are a page title, not a panel header, and are outside this document.

## Version history

- v1.0, 2026-11-04: approved by John: title alignment (left with trailing controls only, centred with a leading navigation control), 10px control spacing, `#1C2C42` panel header titles, ordinary content headings keep their colours. Built on the draft v0.1 audit of both apps.
- v0.1 draft, 2026-11-04: first version, from a cross-app header audit and the approved panel standard.
