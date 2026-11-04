# Panel standards

Version 2.0, 2026-11-04. Part of the [design standards](./README.md). Owned and updated in Reminderly, shared with Noterly by reference: Noterly links to this document and does not keep a copy. Centred overlays are a separate standard: [overlay-standards.md](./overlay-standards.md).

The reference is John's panel design visual (approved 2026-11-04). Where the code or an earlier version of this document differs, the reference wins.

## Cross-app parity principle

Reminderly and Noterly keep consistent header and panel designs wherever possible: one familiar, predictable experience in positioning, spacing, dimensions, appearance and behaviour. Where equivalent panels differ, align them to this standard rather than keeping a historical difference. An app-specific exception is allowed only when the app's functionality needs it, and only when it is deliberate, justified and agreed individually. Record every agreed exception in the table at the end of this document; an exception that is not listed is a defect.

## Structure

From the top of the screen:

1. App header with the logo.
2. Optional tab bar, outside and above the panel.
3. White panel, containing in order: optional header, optional sub-header, flexible content area (scrolls when it must), optional CTA area.

This applies to fixed panels (the main pages) and to sliding panels (bottom sheets), with presentation-specific behaviour where needed.

## Measurements

| Item | Value |
|------|-------|
| Resting top of the panel (fixed panels, and sliding panels at rest) | 146px from the top of the screen. Implemented as the bottom of the app header (logo area 20 + 50 + logo + 20 padding), which is 145.64 in Reminderly |
| Panel background | White. No grey panel, including Dev tools |
| Top corners / bottom corners | 15px / 0 |
| Top spacing / bottom spacing | 24px / 24px. Bottom spacing is 0 when the content scrolls to the screen edge and there is no CTA |
| Left and right padding | 20px |
| Header | 45px high. Title left, 45 x 45 controls right, 10px apart. A close, back or confirm control is a 45px `#4784F8` circle with a white glyph (inactive `#D9D9D9`) |
| Sub-header | 40px high |
| Header (or filter row) to content | 24px, no separator |
| CTA area | 60px high, 24px above the screen bottom, full width inside the 20px padding |
| Tab height / gap / width | 52px / 10px / fill. Tabs are 20px in from the sides |
| Content max width | 768px, centred |
| Main panel min height | 350px |

The CTA height is fixed at 60. It does not shrink on short screens: at the minimum supported screen (360 x 667) the list still has room for its rows, checked 2026-11-04.

## Full-height panels

A panel may extend to the top of the screen. When it does:

- The white panel itself reaches the top of the screen (the part under the status bar is white).
- The header sits below the device safe-area inset plus 24px: top spacing = `env(safe-area-inset-top)` + 24px. Both apps set `viewport-fit=cover` so the inset is available.

What makes a panel full-height stays app-specific (see the exceptions): Reminderly's tutorial goes full-height below 740px viewport height; Noterly's note panel goes full-height when the user expands it.

## Bottom sheets

Used by New reminder, Repeats, Lists editor, Dev tools and the tutorial, all wrapped in `App.tsx`:

```tsx
<motion.div />                 // transparent backdrop, tap to close
<motion.div                    // sheet, slides up
  initial={{ y: "100%", top: getBottomSheetTopPosition() }}
  animate={{ y: 0, top: getBottomSheetTopPosition() }} />
```

- `getBottomSheetTopPosition()` returns the bottom of the app header, so sheets rest where the fixed panels start. Dev tools uses the same position.
- Viewport-aware top position, 768px max width, 15px top corners; drag to close where supported. The sheet has a 24px drag zone at its top.
- `top` must be set in `initial` as well as `animate`. Without it the sheet's first frame takes its height from its content, so a long list (more than about 23 items) slides from the wrong distance and visibly bounces when `top` applies mid-animation.

## Dev tools

A white panel at the standard resting top, with `#F7F7F7` cards (6px corners) 24px apart, a 45px header and 20px side padding (approved 2026-11-04). Cards are separated by white 1px lines.

## Agreed exceptions

| Panel | Exception | Reason | Agreed |
|-------|-----------|--------|--------|
| Noterly note panels (New/Edit note, linked note, search-result edit) | A 58px band above the header holds the expand/collapse arrow, so the header sits below that band instead of 24px below the panel top. Expanded, the band starts at the safe-area inset + 24px | The arrow is Noterly's way to expand a note to full height | John, 2026-11-04 (decision A) |
| Noterly note panel full-height activation | The user expands it | Reading and editing room for long notes | John, 2026-11-04 |
| Reminderly tutorial full-height activation | Below 740px viewport height, the tutorial starts at the safe-area inset (covering the logo header) | The tutorial mock-up needs the room | Existing behaviour retained, 2026-11-04 |
| Reminderly tutorial side padding | `clamp(16px, 5vw, 40px)` instead of 20 | The tutorial phone mock-up scales with width; 20.1px at 402 wide | Open: confirm with John |

## Version history

- v2.0, 2026-11-04: rewritten to the approved reference (146px resting top, 20px side padding, 45/40/60 bars, full-height rule, white Dev tools, fixed 60 CTA), cross-app parity principle and exception table added. Shared with Noterly.
- v1.0, 2026-10-12: Reminderly main and slide-up panel values as implemented, bottom sheets.
