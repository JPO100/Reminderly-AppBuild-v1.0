# Panel standards

Version 2.6, 2026-11-04. Part of the [design standards](./README.md). Owned and updated in Reminderly, shared with Noterly and future NeatlyMade apps by reference: an app links to this document and does not keep a copy. This document covers panel anatomy, positioning, dimensions, padding, scrolling, safe areas, tabs and CTA areas. The header treatment (title, controls, variants) is in [header-standards.md](./header-standards.md). Centred overlays are a separate standard: [overlay-standards.md](./overlay-standards.md).

The reference is John's panel design visual (approved 2026-11-04). Where the code or an earlier version of this document differs, the reference wins.

**Part A is the standard** and binds both apps. **Part B is implementation notes** for each app: how it currently meets Part A. Part B is not a requirement; another implementation that meets Part A is equally valid.

## Cross-app parity principle

Reminderly and Noterly keep consistent header and panel designs wherever possible: one familiar, predictable experience in positioning, spacing, dimensions, appearance and behaviour. Where equivalent panels differ, align them to these standards rather than keeping a historical difference. An app-specific exception is allowed only when the app's functionality needs it, and only when it is deliberate, justified and agreed individually. Record every agreed exception in the table in A8 (panels) or in header-standards.md (headers); an exception that is not listed is a defect.

# Part A: Design standard

## A1. Structure and the 146px panel stack

From the top of the screen:

1. App header with the logo.
2. Optional tab bar, outside and above the white panel.
3. White panel, containing in order: optional header, optional sub-header, flexible content area (scrolls when it must), optional CTA area.

This applies to fixed panels (the main pages) and to sliding panels (sheets), with presentation-specific behaviour where needed.

**The 146px is the top of the panel stack**: the first thing below the app header. It is not always the top of the white panel.

| Layout | Stack top | White panel top |
|--------|-----------|-----------------|
| No tabs (Noterly; Reminderly with Lists off) | 146px | 146px |
| With the 52px tab bar (Reminderly with Lists on) | 146px (the top of the tabs) | 146 + 52 = 198px |

A sliding panel at rest has its top at 146px in both layouts. With tabs it therefore covers the tab bar, and it has its own top corners (15px) at 146px.

## A2. Measurements

| Item | Value |
|------|-------|
| Stack top (see A1) | 146px from the top of the screen |
| Panel background | White. The one exception is Reminderly's Dev tools (A7) |
| Panel corners | Top 15px, bottom 0 |
| Top spacing | 24px between the panel top and its header (see A3 for sliding panels and Noterly's arrow band) |
| Bottom spacing | 24px between the CTA (or last content) and the screen bottom. 0 when the content scrolls to the screen edge and there is no CTA |
| Left and right padding | 20px |
| Header row | 45px high (treatment: [header-standards.md](./header-standards.md)) |
| Sub-header row | 40px high |
| Gap between adjacent sections | 24px, no separator (see A2a): header to sub-header, sub-header to content, header to content when there is no sub-header, content to CTA |
| CTA area | 60px high, full width inside the 20px padding (see A4) |
| Tabs | 52px high, fill the width, 10px apart, 20px in from the sides, outside and above the panel |
| Content max width | 768px, centred |
| Main panel min height | 350px |

### A2a. Spacing between sections

The gap between adjacent panel sections is **24px** (John, 2026-11-04). The sections are, in order: header, sub-header, content, CTA. Where an optional section is absent, the gap is between the sections that remain.

- Measured on the rendered layout, between the container edges of adjacent sections, in every state of the panel: populated, empty, scrolling, and at the test baseline (A6).
- The header block ends at its lowest element (the row, or the subtitle when there is one; header-standards.md, section 1).
- A scrolling content area keeps its box and so keeps its 24px gap above and below it; the content scrolls inside.
- Spacing inside a section's items (rows, cards, fields, lists) is not panel-section spacing and is not covered.
- **Integrated content sections.** Components that form one content section are not separated by 24px. Reminderly's calendar view is one: the month grid and the selected day's reminder list sit directly together (0px) as a single content section (John, 2026-11-04). It is not a defect; the 24px still applies above and below the section.
- Exceptions: Noterly's arrow band (A3), Dev tools (A7) and the Reminderly tutorial's carousel spacing (A8). Nothing else is exempt; an unlisted exception is a defect.

## A3. Top spacing, drag zone and the arrow band

- **Drag zone.** Every sliding panel has an invisible 24px drag zone across its top edge (drag down to close). It sits inside the 24px top spacing and takes no layout space: the header still starts 24px below the panel top.
- **Arrow band (Noterly note panels, an agreed exception).** Noterly's note panels carry a visible expand/collapse arrow in a 58px band at the top. The band takes the place of the 24px top spacing: the header row follows it (measured: the controls start 51px below the panel top). The band keeps its own interaction (a 44px tap target for the arrow; the drag zone above still closes the panel). Expanded or collapsed, the band sits at the top of the white panel in the same position (see A5).

## A4. CTA

The CTA area is 60px high and is a full-width pill by default. It does not shrink on short screens: at the minimum test baseline (A6) the list still has room for its rows (checked 2026-11-04). Agreed exception: the Reminderly tutorial's Next button is a 180px-wide, 60px-high pill; its Turn on and Skip buttons are 60px-high pills sized to their label.

## A5. Full-height panels

A panel may extend to the full height of the screen below the status bar. When it does (John, 2026-11-04):

- The **white panel begins immediately below the status bar**, at the top safe-area boundary (`env(safe-area-inset-top)`), not behind it.
- The **status bar stays visible above the panel** and keeps the application's background colour.
- The **header and content begin 24px below the white panel's top edge**, the same top spacing as any panel, subject to the agreed structural exceptions (the arrow band, A8).
- Normal panels keep the 146px panel-stack position (A1).

Both apps set `viewport-fit=cover` so the inset is available. What makes a panel full-height is app-specific (A8).

## A6. Responsive, scrolling and keyboard

- **Baseline.** 360 x 667 is the current minimum design test baseline for panels. Each app's supported-device requirements decide the actual minimum; a panel is checked at the baseline and at a large phone (for example 402 x 874 and 440 x 956).
- **No horizontal overflow** at any supported width. Vertical scrolling is acceptable.
- **Scrolling.** The header and the CTA stay fixed; the content area scrolls. A panel that is taller than the space available scrolls its content, never the panel as a whole.
- **Safe areas.** Content must not sit under the status bar or the Dynamic Island: a panel that reaches the top of the screen follows A5. The 24px bottom spacing is measured from the screen bottom; neither app adds the bottom inset today.
- **Keyboard.** A panel keeps its position and size when the keyboard opens; the keyboard overlays it. The focused field stays visible above the keyboard; other rows below it may be covered until the keyboard is dismissed or the content is scrolled.
- **Height.** Fixed measurements (header 45, CTA 60, spacing 24) do not shrink to fit. Where a fixed measurement genuinely cannot hold, escalate it as a design conflict rather than adding a responsive formula.

## A7. Dev tools

Dev tools sits at the standard resting top with a 45px header and 20px side padding, cards (6px corners) 24px apart. Its colours are a narrow, explicit exception to the white-panel rule (CTO and John, 2026-11-04):

| App | Panel | Cards | Card dividers | Login field |
|-----|-------|-------|---------------|-------------|
| Reminderly | `#F7F7F7` | White | `#F7F7F7` 1px lines | White |
| Noterly | White (its existing treatment, unchanged) | Not part of this exception | Not part of this exception | Not part of this exception |

All other shared panel standards apply to Dev tools. Dev tools is outside the section-spacing rule (A2a) because its design is different.

## A8. Agreed exceptions

| Panel | Exception | Reason | Agreed |
|-------|-----------|--------|--------|
| Noterly note panels (New/Edit note, linked note, search-result edit) | The 58px arrow band replaces the 24px top spacing (A3), so the header row starts below the band. The band is part of the header block and sits at the top of the white panel, collapsed or expanded | The arrow is Noterly's way to expand a note to full height | John, 2026-11-04 (decision A); interpretation approved by the CTO |
| Noterly note panel full-height activation | The user expands it, at any screen size | Reading and editing room for long notes | John, 2026-11-04 |
| Reminderly tutorial full-height activation | Below 740px viewport height the tutorial goes full-height | The tutorial mock-up needs the room | Existing behaviour retained, 2026-11-04 |
| Reminderly Dev tools colours | `#F7F7F7` panel with white cards, `#F7F7F7` card dividers and a white login field (A7). Noterly's Dev tools keeps its white panel | Restores the Dev tools palette used before the panel standardisation | CTO and John, 2026-11-04 |
| Reminderly tutorial Next button | 180 x 60 pill instead of a full-width CTA (A4) | Tutorial design | John, 2026-11-04 (decision D) |
| Reminderly tutorial internal spacing | The carousel is exempt from the 24px gap between its internal elements and keeps: title to subtitle 27px, subtitle to phone mock 35px, phone mock to page dots 45px, page dots to Next 36px. Its panel top, side padding, full-height rule and CTA height still apply | The tutorial is a distinct visual composition | John, 2026-11-04 |

# Part B: Implementation notes

## B1. Reminderly

- **Stack top.** `getBottomSheetTopPosition()` in `App.tsx` returns the bottom of the app header (145.64px), which is the top of the tabs when Lists is on. Dev tools and the tutorial use it too.
- **Sheets** are wrapped in `App.tsx` with Framer Motion:

  ```tsx
  <motion.div />                 // transparent backdrop, tap to close
  <motion.div                    // sheet, slides up
    initial={{ y: "100%", top: getBottomSheetTopPosition() }}
    animate={{ y: 0, top: getBottomSheetTopPosition() }} />
  ```

  `top` must be set in `initial` as well as `animate`. Without it the sheet's first frame takes its height from its content, so a long list (more than about 23 items) slides from the wrong distance and visibly bounces when `top` applies mid-animation. The 24px drag zone is an absolutely positioned `h-[24px]` div at the top of each sheet, using `useDragControls`.
- **Tutorial full-height.** Below 740px viewport height the sheet's top is `getSafeAreaTopInset()` (a probe of `env(safe-area-inset-top)`), and its content starts with 24px padding. So the white panel begins at the inset, the area above it shows the app's blue background, and the title sits 24px below the panel top. This already follows A5. Verified from the code and in the browser at 360 x 667 (inset 0: panel top 0, title 24px); not measured with a non-zero inset, because opening the tutorial on a simulator would change the app's stored settings.
- **Tabs** are two 52px buttons (`rounded-tl/tr` 12px) between the header and the panel, 20px in from the sides.
- **Keyboard.** No Keyboard plugin; the sheet keeps its position when the keyboard opens (checked on iPhone SE and Pro Max simulators).
- The 350px minimum height is on the main panel and the 768px maximum width on the content wrappers, both in `App.tsx`.

## B2. Noterly

- **Stack top.** The homepage panel starts at 146px (header: 20px padding, 50px top, 40px logo, 16px bottom). `BottomSheet.tsx` measures the home panel's top (`measurePanelTop()`) and sheets rest there.
- **Sheets** use the CSS-class `BottomSheet` component (`--entering`, `--open`, `--leaving` phases). Its 24px `.bottom-sheet-drag-handle` is the drag zone. The expand/collapse arrow band is `.new-note-drag-handle-row` in `NewNotePanel.css`.
- **Full-height.** Expanded, the sheet's top is `env(safe-area-inset-top, 0px)` (`BottomSheet.tsx`, `isExpanded`), so the white panel begins below the status bar and the app's background shows above it. The arrow band and header sit exactly as when collapsed.
- **Keyboard.** The Keyboard plugin is set to `resize: none`; the note editor adds scroll padding for the keyboard height so the caret stays visible.

## Version history

- v2.6, 2026-11-04: Reminderly's Dev tools restored to its original palette as a narrow colour exception (A7, A8); Noterly's Dev tools keeps its white panel. No geometry or other standard changed.
- v2.5, 2026-11-04: recorded two approved interpretations so they are not flagged as defects: the calendar view's month grid and day list are one content section (0px), and the tutorial's carousel spacing is an approved exception (27 / 35 / 45 / 36px). All other panels measure 24px between adjacent sections (Dev tools excepted).
- v2.4, 2026-11-04: John's rule added: the gap between adjacent panel sections is 24px (A2a), Dev tools excepted. Noterly's expanded note aligned with the full-height rule (B2). Header treatment finalised in header-standards.md v1.0.
- v2.3, 2026-11-04: header treatment moved to the new header-standards.md (the 45px header allocation and the 24px header-to-content gap stay here). Full-height rule changed to John's decision: the white panel begins below the status bar, the status bar keeps the app background, and the header begins 24px below the panel top. Noterly's expanded note recorded as not yet aligned.
- v2.2, 2026-11-04: restructured into the design standard (Part A) and implementation notes (Part B). Clarified the 146px panel stack top against the 198px white-panel top with tabs; the drag zone and the arrow band against the 24px top spacing; the Next button exception; added responsive, scrolling, safe-area and keyboard rules with 360 x 667 as the minimum test baseline.
- v2.1, 2026-11-04: tutorial side padding standardised to 20px; Noterly arrow band recorded as part of the expanded header block.
- v2.0, 2026-11-04: rewritten to the approved reference (146px resting top, 20px side padding, 45/40/60 bars, full-height rule, white Dev tools, fixed 60 CTA), cross-app parity principle and exception table added. Shared with Noterly.
- v1.0, 2026-10-12: Reminderly main and slide-up panel values as implemented, bottom sheets.
