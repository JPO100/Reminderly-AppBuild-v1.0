# Header standards

DRAFT v0.1, 2026-11-04. Part of the [design standards](./README.md). Owned and updated in Reminderly, shared with Noterly and future NeatlyMade apps by reference: an app links to this document and does not keep a copy. Panel anatomy, positioning and spacing are in [panel-standards.md](./panel-standards.md); this document owns the header treatment inside a panel. Type scale and colours: [typography-standards.md](./typography-standards.md) and [colour-standards.md](./colour-standards.md).

**Status tags.** **Approved** means the value is already in an approved standard or was approved by John. **Provisional** means it records the common pattern found in a cross-app audit (2026-11-04) and is not yet approved by John; do not treat it as a decision until it is. Historical differences are listed, not adopted.

The parity principle applies: the two apps keep consistent headers wherever possible; an exception must be deliberate, justified and agreed (see section 7).

## 1. Structure

A panel header is a **45px-high row** at the top of the panel, 24px below the panel top (see panel-standards.md for the exceptions to that spacing). It holds, left to right: optional leading control, title, optional trailing controls. **Approved**

- **Header block.** The row plus, when present, a one-line **subtitle** (section 3) under the title. With a subtitle the block is taller than 45px; the subtitle sits in the title column and the controls stay in the 45px row. The 24px header-to-content gap is measured from the bottom of the block (the subtitle's line box when there is one, otherwise the row). **Approved** (gap); **Provisional** (what counts as the bottom of the block).
- The row is 20px in from each side, the same as the panel padding. **Approved**
- A page's top row on a fixed panel (Reminderly's filter row, Noterly's search row) is the header row of that panel: 45px high, holding pills or a search field and icon controls. **Approved**

## 2. Title

| Property | Value |
|----------|-------|
| Typeface | Lato Bold, 20px, one line |
| Colour | Reminderly dark blue `#1C2C42` |
| Vertical position | Centred in the 45px row |
| Editable titles (a list name, a note title) | Same style, in a field with no box or border (**Provisional**: as found in Reminderly's Lists editor and Noterly's note panels) |

**Approved** (typography-standards.md, panel title), except where marked.

**Alignment. Provisional.** The audit found two patterns in both apps:

- Title **left**, controls on the right only: Reminderly New reminder and Lists editor; Noterly note panels.
- Title **centred**, controls on both sides (cancel or close or back on the left, confirm or close on the right): Reminderly Repeats and Dev tools pages; Noterly Link panel.

Recommended default: left when there is no leading control, centred when there is one. Not yet approved.

## 3. Subtitle

One line under the title in the title column: Lato Bold 15px, medium grey `#BABABA` (a list's "3 of 7", a note's date). **Provisional.** (typography-standards.md calls this style Sub-header.)

## 4. Header controls

**Icon controls are 45 x 45px circles.** **Approved**

| Property | Value |
|----------|-------|
| Size | 45 x 45px, fully round |
| Active | Fill `#4784F8` (Reminderly blue), white glyph |
| Inactive | Fill `#D9D9D9` (inactive grey), white glyph, not tappable |
| Spacing between controls | 10px |
| Glyphs (**Provisional**: as found) | Close: cross. Back: left chevron. Confirm or save: tick. Options: three dots. Page-level buttons use the same circle with their own glyph (calendar, settings, filters, add folder, select) |

These controls are circles: close, back, cancel, confirm, save, options ("..."), and a page's top-row icon buttons.

**Elements that are not circle controls** but sit in the 45px row with their own style: the title; filter pills (45px high, fully rounded, 1px category outline, label in the category colour); Noterly's search field (45px high, fully rounded, `#EAEAEA` fill).

The tutorial's Back and Close controls are footer navigation (35 x 45 grey glyphs), not header controls, and keep their own treatment. **Approved** (CTO, 2026-11-04)

## 5. Variants

| Variant | Where | Layout |
|---------|-------|--------|
| Title and trailing controls | Reminderly New reminder (confirm); Lists editor (options, save); Noterly note panels (options, confirm) | Title left, 1 to 2 circles right. Subtitle under the title where there is one |
| Leading and trailing controls | Reminderly Repeats (cancel, confirm); Noterly Link panel (close, confirm) | Circle left, title centred, circle right |
| Utility page | Reminderly Dev tools pages (back, close); Noterly Dev tools pages (back, close) | Circle left (back), title, circle right (close). Alignment differs between the apps (section 8) |
| Page top row | Reminderly main pages: pills and two circle buttons; Noterly folder and note lists: search field and two circle buttons | Pills or the field fill the row, circles right |
| Optional sub-header | A 40px row below the header (panel-standards.md) | Holds a second line of filters or context; same left edge, 24px below the header |

## 6. Inactive and states

An inactive confirm or save control is the `#D9D9D9` circle with a white glyph and does not respond to taps. It becomes `#4784F8` when the action is available. **Approved**

## 7. Agreed exceptions

| Header | Exception | Agreed |
|--------|-----------|--------|
| Noterly note panels | The 58px expand/collapse arrow band sits above the header row, so the row starts below the band instead of 24px below the panel top (panel-standards.md) | John, 2026-11-04 (decision A) |
| Tutorial footer navigation | Back and Close are 35 x 45 grey glyphs, not circles; they are not header controls | CTO, 2026-11-04 |

## 8. Open items (provisional until John decides)

Audit of both apps, rendered at 402 x 874 (2026-11-04), with the recommended default and what differs:

1. **Title alignment** (section 2): recommended default as above. Differs: Noterly Dev tools pages left-align the title beside the back control (Reminderly centres it); Noterly Dev tools home left-aligns the title with only a close control (Reminderly centres it, with a decorative robot icon on the left).
2. **Control spacing.** Header circles are 10px apart everywhere except Reminderly's main-page top row, where the calendar and settings buttons and the pills are 8px apart. Recommended default 10px; the main-page row is a historical difference, not adopted.
3. **Title colour.** Panel headers are `#1C2C42` in both apps. Noterly's list headings ("Your folders", "My notes") are Lato Bold 20px `#1A1A1A`. Recommended: `#1C2C42`; not changed.
4. **Subtitle colour** for an unsaved Noterly note date is `#D9D9D9` (placeholder state) against `#BABABA` elsewhere; treated as a state, not a conflict.
5. **Heading rows below a page's top row** (Noterly's "Your folders" and "< My notes" row) have no Reminderly equivalent; they are a page title, not a panel header, and are outside this document until John decides.

## Version history

- v0.1 draft, 2026-11-04: first version, from a cross-app header audit and the approved panel standard. Approved values are tagged Approved; the rest is Provisional.
