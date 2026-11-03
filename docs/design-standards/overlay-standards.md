# NeatlyMade Centred Overlay Standard

**Single source of truth** for centred overlays in every NeatlyMade app. Owned and updated in the Reminderly repository (`docs/design-standards/overlay-standards.md`); other apps (Noterly) take a copy of this file unchanged and do not edit it. Change requests go to John, are made here, and the new version is re-shared.
**Status:** Approved by John (CEO). **Version:** 1.0, 2026-11-03.
**Scope:** everything about centred overlays lives in this one document. Sections 1 to 10 are the standard and apply to every app. The appendix at the end is Reminderly's own implementation record (inventory, dismissal table, known gaps) and applies to Reminderly only; other apps ignore it and keep their own record in their own repository, without restating these rules. If an appendix disagrees with the standard, the standard wins.

Where this file gives Reminderly constants and CSS, they are the reference implementation, not an extra requirement.

## 1. The principle

**Every centred overlay has two zones, and all content sits in one of them. Nothing sits outside them.**

- **Header area:** the Header, plus any Title lines under it. Every overlay has a Header; Titles are optional. In Noterly, a folder icon and name may take the Title's place; it follows the same spacing rules.
- **Button block:** everything below the header area that the user acts on or reads as the body: buttons, click-through rows and toggles (on information pages, also the scrolling image and text). Items are 30px apart.

Design every overlay by deciding what goes in the header area and what goes in the button block. If content fits neither zone, the design is wrong, not the principle. A single pinned footer control (Back, OK, Close) is the last item of the button block, pinned rather than scrolled.

Vocabulary: **Header** (Lato Bold 20px), **Title** (Lato Bold 17px), **Card** (white rounded panel), **Backdrop** (dimming layer), **Wrapper** (invisible full-screen layer that centres the card), **Scrollable area** (the part where only content scrolls), **Viewport** (visible screen area).

## 2. Position and geometry

| Item | Rule |
|------|------|
| Centring | Card centred horizontally and vertically in the viewport |
| Width | Preferred 340px; shrinks so the card is never closer than 20px to either side (320 at 360, 335 at 375, 340 from 380 up) |
| Top and bottom clearance | At least 100px, and never less than the safe-area inset plus 20px: `max(100px, inset + 20px)` |
| Maximum height | Viewport height minus the two clearances; the card never grows past it |
| Corner radius | 32px on all four corners, always visible, including while content scrolls |
| Backdrop | Full viewport, black at 50% opacity, flat colour (no gradient, no blur) |
| Layering | Backdrop and wrapper at layer 60; an overlay that sits over another overlay at layer 70 |
| Orientation | Portrait only |

Reference CSS (Reminderly):

```css
.centred-overlay-wrapper {
  padding-top: max(100px, calc(env(safe-area-inset-top, 0px) + 20px));
  padding-bottom: max(100px, calc(env(safe-area-inset-bottom, 0px) + 20px));
}
.centred-overlay-card { max-height: 100%; overflow-y: auto; }
```

Wrapper: full-screen, flex-centred, 20px side padding. Card: 340px wide at most (`w-full max-w-[340px]`). Use **one shared overlay component** for backdrop, wrapper and card, not inline per overlay.

### Behaviour by screen size

| Viewport (points) | Card width | Side gap | Max card height | Typical device |
|-------------------|-----------|----------|-----------------|----------------|
| 360 x 667 (minimum supported) | 320 | 20 | 467 | smallest supported |
| 375 x 667 | 335 | 20 | 467 | iPhone SE |
| 390 x 844 | 340 | 25 | 644 | iPhone 14 and similar |
| 402 x 874 | 340 | 31 | 674 | iPhone 17 Pro and similar |

The 100px clearance wins whenever the safe-area inset is under 80px (every current iPhone in portrait). Taller screens only add room: the card stays 340px wide. An overlay that fits never scrolls. One that does not fit keeps its header area fixed and scrolls the button block. Nothing may overflow horizontally at any size.

## 3. Internal layout

- **Card padding:** 40px top and bottom, 30px left and right. Content is centred horizontally. (When content overflows and scrolls, the bottom gap becomes 30px; see section 5.)
- **Header:** Lato Bold 20px, `#1C2C42`, centred, one line (line box fixed at 24px), truncated with an ellipsis. Never wraps.
- **Title:** Lato Bold 17px, `#939393`, centred. Short Title lines are one line and truncate; a Title that is a message (dialog text) may wrap.
- **Every gap between text lines inside the header area is 30px measured on the glyphs, never between text boxes:** from one line's baseline to the next line's cap top. This covers Header to Title and Title to Title. For Lato Bold (ascent 0.987em, descent 0.213em, cap height 0.723em, line box 1.2em) with a 24px Header line box and 17px Titles, the CSS gap between boxes is **21.25px** (`30 - 4.26 - 4.488`). Reminderly's constant is `HEADER_TITLE_GAP = 21.25`. If you use a different font or size, recompute from that font's metrics.
- **One rule below the header area:** the gap from the bottom of the header area to whatever comes next is always **30px**. The header area's bottom is the bottom of its last line's box (the Header's is 24px). What comes next is measured at its top: the top edge of a toggle row, click-through row, button or image, or the cap top of a line of text. No exceptions.
- Cards lay out their children with a 40px gap, so the header area is pulled 10px into it (`HEADER_PULL = 10`, applied as a negative bottom margin on the header area) to give 30px.
- Items in the button block are **30px apart**.

### Buttons

| Item | Rule |
|------|------|
| Size | 50px high, fully rounded (`rounded-[100px]`), padding 18px horizontal and 15px vertical |
| Label | Lato Bold 17px, white, single line |
| Colours | Primary `#4784F8`; secondary or destructive `#939393`; disabled `#D9D9D9`; dismissive "Cancel" or "Not now" `#BABABA` |
| Stacked (three or more actions, or one) | Full width of the content area, 30px apart |
| Two-button dialogs | Side by side, **equal width** (each takes half), 30px apart, both 50px high |
| Single action (OK, Close, Back) | Full width |

Destructive actions use grey `#939393`, not red. (The only red is a Title line that signals an overdue reminder, `#FF0000`; other apps need no equivalent unless John decides.)

Colours are named: Reminderly blue `#4784F8`, Reminderly dark blue `#1C2C42`, medium grey `#BABABA`, inactive grey `#D9D9D9`, description grey `#939393`. Confirm with John that each app shares these tokens; if an app's palette differs, only the colours change, never the geometry.

## 4. Overlay families

| Family | Structure |
|--------|-----------|
| Info | Header, 30, rows or buttons (30 apart) |
| Menu | Header, 30, stacked buttons |
| Attachment overlays | Add attachment: Header and stacked primary buttons. Attachment error: Header, message Title, OK. Delete attachment: Header and one grey destructive button, no Cancel |
| Settings | One shared card height for all settings overlays (the taller home page, capped by the available height). Sub-pages and information pages inherit it; a page never resizes the card. Header fixed, rows scroll; information pages have a fixed Header, scrolling image and text, and Back pinned |
| Confirmation and notice dialogs | Header, 30, Title (the message), 30, buttons (equal-width Cancel and Confirm, or a single OK) |
| Permission prompt | As a confirmation dialog: "Not now" and "Allow", equal width |

Header then Title (message) then buttons is the pattern for every dialog: the message is a Title, not body text in the button block.

## 5. Scrolling

- Overlays that fit never scroll and show no scroll indicator.
- When content is taller than the available height, **the header area stays fixed** and only the scrollable area scrolls.
- The scrollable area's top edge (hard clip edge) is **20px below the header area**; the content inside starts 10px lower, so the first row is still 30px below the header area. In Reminderly: `marginTop: -10`, `paddingTop: 10` on the scroll container.
- A **single** footer control (Back, Close, OK) is pinned at the card's bottom padding and stays visible. A **group** of several buttons is part of the scrolling body.
- The body ends 30px above the card's bottom padding edge (above the pinned button if there is one), as a hard edge. No fades or gradients.
- **Scroll indicator:** a grey `#D9D9D9` down chevron, 12px wide and 7px high, centred horizontally in the 30px footer gap, directly above the pinned button or card bottom. Visual only (not tappable), shown while there is more content below, hidden when the body reaches its end, switches instantly.
- When content fits, the footer gap is the normal 40px bottom padding and there is no indicator. When it overflows, the gap is 30px and holds the indicator.
- Rounded corners stay intact while scrolling: scrolled content is clipped by the card's 32px radius; never cut off with a square edge.
- Headers and short Titles truncate rather than wrap; on very short screens the fixed header area takes priority and the scrollable area shrinks first.

Reminderly constants (one shared scroll component, `OverlayScrollArea.tsx`): `SCROLL_PEEK = 40`, `OVERFLOW_FOOTER = 30`, `SCROLL_TOP_CLEARANCE = 20`, `PINNED_BUTTON_HEIGHT = 50`. The parent must be a flex column with a definite or maximum height and `min-h-0`. Use one shared scroll component for every overlay.

## 6. Toggle rows in overlays

- Row: full width, flex with a 16px gap, items aligned to the start, whole row tappable; the toggle stops click propagation so it does not fire twice. Rows are 30px apart.
- Label block fills the remaining width: title 17px, single line with ellipsis; subtitle 14px, wraps; 9px between them.
- On: title and icon `#1C2C42`, subtitle `#BABABA`, track `#4784F8`. Off: title and icon `#1C2C42`, subtitle `#BABABA`, track `#BABABA`. Inactive (feature unavailable): title, subtitle and track `#D9D9D9`, not tappable. No hover or focus states in overlays.
- Click-through rows carry a 7 x 13 `#939393` chevron.

## 7. Interaction and accessibility (required from day one in every app)

- Overlays open and close instantly (no animation on the card or backdrop).
- Tapping the backdrop dismisses an overlay, with the meaning defined per overlay and documented. A dismissal is always the safe choice (Cancel, Not now, Close).
- Escape closes an overlay where a hardware keyboard exists.
- Every overlay card has `role="dialog"` and `aria-modal="true"`, an accessible name from its title, and moves focus into the card when it opens and back to the trigger when it closes.
- While an overlay is open the page behind does not scroll.

**Build these into the shared overlay component from the start.** (Reminderly implements them only on one overlay; the rest is deliberately deferred and recorded in the Reminderly appendix. That is a gap, not a pattern to copy.) Do not claim VoiceOver support until it has been tested.

## 8. Tutorials

If an app has an onboarding tutorial that reproduces an overlay, reproduce it inside the tutorial phone with the same structure, text, colours, radius and spacing as the real overlay, scaled uniformly (the 340px card is scaled by the phone's interior width divided by 393). Spacing and radius are scaled, not re-specified. Replicas are not interactive and show only the buttons relevant to the scenario. Any change to an overlay that a tutorial reproduces updates the tutorial in the same branch.

## 9. Checklist for each new overlay

1. Built from the shared overlay component (backdrop, wrapper, card).
2. Every piece of content is in the header area or the button block.
3. Padding 40 top and bottom, 30 left and right.
4. Header 20px one line, truncates. Titles 17px `#939393`.
5. Header to Title and Title to Title: 30px baseline to cap top. 30px from the header area to the button block. Items in the button block 30px apart.
6. Buttons 50px, fully rounded, 17px white bold, correct colour for their role. Two-button dialogs equal width.
7. Fits without scrolling when it can; otherwise header fixed, body scrolls with a 20px clip clearance, 30px footer and chevron, one pinned footer control at most.
8. No gradients, fades or square edges; radius 32px.
9. Dialog semantics, focus, Escape and scroll lock in place.
10. Backdrop-tap meaning defined and documented.
11. Checked at 360 x 667, 375 x 667, 390 x 844 and 402 x 874, portrait, with no horizontal overflow.
12. Any tutorial replica updated.

## 10. Deviations

If an overlay needs to depart from this standard, it is a decision for John, recorded in that app's design document with the reason. Do not introduce exceptions silently. An overlay that does not follow the standard is a tidy-up item, not a precedent.

## 11. Version history

**1.0 — 2026-11-03.** First consolidated release (moved from `docs/design.md` into the design-standards folder): two-zone principle; Header and Title styles; 30px glyph-measured spacing inside the header area and 30px below it; 20px scroll clip clearance; behaviour by screen size; shared-component and accessibility requirements.

---

## Appendix. Reminderly only

Not part of the standard. This is how Reminderly implements it today. Other apps ignore this appendix.

### Reminderly implementation record (verified against code, 2026-11-02; wrapper CSS, scroll constants and header spacing constants re-checked 2026-11-03)

**B1. Structure.** There is no shared wrapper component; each overlay is built inline from the same three elements:

```
div.fixed.inset-0.bg-black/50.z-[60]                         backdrop, tap to close
div.fixed.inset-0.z-[60].flex.items-center.justify-center
    .pointer-events-none.px-[20px].centred-overlay-wrapper   centring wrapper
  div.pointer-events-auto.centred-overlay-card               card
```

- The 20px side clearance is the wrapper's `px-[20px]`; the card has an inline 340px width (or `w-full max-w-[340px]`), so it shrinks automatically (320px at 360, 335 at 375).
- `.centred-overlay-wrapper` (`src/styles/index.css`) sets top and bottom padding `max(100px, env(safe-area-inset-top) + 20px)` and `max(100px, env(safe-area-inset-bottom) + 20px)`. On current iPhones the insets are below 80px, so the clearance is effectively 100px.
- `.centred-overlay-card` sets `max-height: 100%` and `overflow-y: auto`.
- Cards with pinned headers override to `overflow-y: hidden` and scroll an inner area instead.
- Layering: standard overlays at z-60; Notification ask at z-70. Slide-up panels are z-50, below all centred overlays.
- Scrolling is done by the shared `ScrollArea` and `ScrollIndicator` in `src/app/components/OverlayScrollArea.tsx` (constants `SCROLL_PEEK` 40, `OVERFLOW_FOOTER` 30, `PINNED_BUTTON_HEIGHT` 50). The parent must be a flex column with a definite or maximum height and `min-h-0`. The `pinned` option renders one 50px button below the area.
- List settings and List info: the card is an outer 340px rounded scroll container (`overflow: hidden`, 32px radius) holding an inner card with the header fixed and `ScrollArea` for the body. The card does not stop click propagation.
- Reminders and Lists settings share one height via `SettingsHeightProbe` (an invisible render of both home pages) and `settingsCardMinHeight`: the minimum of the taller home page plus padding and 100% of the available height. `PanelShell` passes the height to sub-pages and information pages.

**B2. Overlay inventory** (20 live centred overlays; 6 slide-up panels and 6 tutorial replicas are listed for completeness; the "Storage unavailable" strip is an inline banner, not an overlay).

| Overlay | Layout | Buttons |
|---------|--------|---------|
| Reminder info | Header (the reminder text, truncated), 30 (baseline to cap top), Title lines: due line (Bold, `#939393`, `#FF0000` when overdue), then the smart reminder progress line or the repeats line, never both (Bold `#939393`, 30 apart baseline to cap top, truncated), 30, buttons | Stacked, scrolling `ScrollArea` |
| Deleted info | Header, 30, buttons | Stacked, scrolling |
| List settings | Header, 30, one button block: toggle rows and buttons all 30 apart | Stacked, scrolling |
| List info | Header, 30, one button block: smart reminder row (when shown) and buttons all 30 apart | Stacked, scrolling |
| Saved list menu | Header, 30, buttons | Stacked, scrolling |
| Template editor menu | Header, 30, buttons | Stacked, scrolling |
| Reminders settings | Shared height, centred title, rows 30 apart (toggles, then click-through rows with a 7 x 13 `#939393` chevron, then the tutorial row), no close button | Fixed title, scrolling rows |
| Lists settings | As Reminders settings | As above |
| Settings sub-pages and information pages | Same height; sub-pages have a back arrow in the header; information pages have fixed title, scrolling image and text | Back pinned |
| Notification ask | Header "Turn on notifications?", Title (message), buttons | Equal-width "Not now" `#BABABA` and "Allow" `#4784F8`; z-70 |
| Add attachment | Header, buttons | Stacked: Choose a photo, Take a photo, Choose a file (`#4784F8`) |
| Attachment error | Header, Title (message), OK | Single `#4784F8` |
| Delete attachment | Header, one button | Single grey `#939393`; no Cancel |
| Dev tools info | Header, body (Lato Medium 17px, 24px line height), Close | Header fixed, body scrolls, Close pinned `#4784F8` |
| NLC, Onboarding, Reminders, Lists, push-to-live confirmations (Dev tools) | Header, Title (message), Cancel and Confirm | Equal width, Cancel `#BABABA`, Confirm `#4784F8`, 30 gap (six dialogs) |
| Home toggle confirm | Same as the Dev tools confirmations | Same |
| Last module notice (Dev tools) | Header, Title (message), OK | Single `#4784F8` |

Slide-up panels (z-50, separate standard in Bottom sheets): New and edit reminder, Repeats, Lists editor, Templates, Dev tools, tutorial.
Tutorial replicas: Reminder info, List settings (two), Template menu, Add attachment, Page 6 settings (two variants).

**B3. Dismissal (per overlay)**

| Overlay | Backdrop tap | Escape |
|---------|--------------|--------|
| Reminder info | Close | Close |
| Deleted info, List info | Close | Not implemented |
| List settings | Close | Not implemented |
| Saved list menu, Template editor menu | Close | Not implemented |
| Reminders settings, Lists settings | Close the panel | Not implemented |
| Add attachment, Attachment error | Close | Not implemented |
| Delete attachment | Close (acts as no action; there is no Cancel) | Not implemented |
| Notification ask | "Not now" | Not implemented |
| Dev tools info | Close | Not implemented |
| Dev tools confirmations, push-to-live, Home toggle confirm | Cancel | Not implemented |
| Last module notice | Close | Not implemented |

**B4. Text and buttons as implemented.** The Header and Title follow section 3 through `OverlayHeader` (`HEADER_TITLE_GAP` 21.25, `HEADER_PULL` 10) or the same classes inline in Reminder info, the settings headers and the tutorial replica `TutorialOverlayTitle`. The scrollable area's `marginTop: -10` / `paddingTop: 10` (`OverlayScrollArea.tsx`) give the 20px clip clearance. Info body text is Lato Medium 17px `#939393`, 24px line height. Settings and Dev tools information page Headers (icon plus text) are one line, so on the narrowest screens a long one such as "Include smart reminder lists" is truncated. Two-button dialogs use `flex-1` on both buttons (P2, merged 72110f4). Overlay headers are pinned with only the main content scrolling (P2a, merged 8ace85d). Rounded scroll edges for List settings and List info (P1, merged 8e73a93).

**B5. Settings scrolling details.** Every sub-page and information page takes the settings card's height and never resizes it. On an information page the Header is fixed and only the image and text scroll; Back is always pinned at the bottom padding. Content that fits leaves unused space between content and Back, with no arrow. Overflowing content scrolls above Back with the 30px gap and arrow directly above it. Home pages that overflow on short screens follow the same rule. The tutorial Re-run pages use the live settings content and inherit it.

**B6. Toggle rows as implemented.** Rows follow section 6. Whole-row tapping stops propagation from the toggle. Left icons: smart reminder bell 19.5 x 21.5 (1px top offset), insertion order 20.83 x 20.82, alphabetical 22.39 x 20.81. Info-line icons: bell 19 x 21, repeats 21 x 21, both `#939393`, 8px from text. Copy feedback icon 20 x 20 white, 12px from text. `ToggleButton` and `SmartRemindersLabel` are duplicated identically in `src/imports/InfoOverlay.tsx` and `src/imports/list-info-overlay.tsx`; list info shows only the smart reminder row.

**B7. Animation as implemented.** Overlays open and close instantly, as the standard requires. Only button content animates (template "use" text fade 150/250ms, template button background 150ms, smart reminder due date highlight colour 300ms).

**B8. Reminderly-specific differences.** Reminder info's due line is red `#FF0000` when overdue (the only red Title). Tutorial replicas: the settings replica (Page 6) uses the live settings content, is anchored 16px above the phone bottom, scaled from bottom centre, capped to the phone height, and takes the shared settings height (documented exception, 2026-10-23). Otherwise replicas follow the standard's tutorial section.

### Not yet built in Reminderly

Approved by John but **not built**: work package P3 was deliberately deferred (2026-11-02, John and Jason) after the overlay review found no confirmed user-facing defects. Only Reminder info has any of the behaviours below, and VoiceOver behaviour is untested on every overlay. Today's behaviour differs from section 7 as follows:

| Standard (section 7) | Current implementation |
|---------------|------------------------|
| `role="dialog"` and `aria-modal="true"` on every overlay | Only Reminder info has them |
| Initial focus inside the card; focus returns to the trigger | Only Reminder info moves focus on open; no overlay restores focus |
| Escape closes every overlay | Only Reminder info closes on Escape |
| Background scroll locked on every overlay | Only Reminder info locks it (`document.body.style.overflow = "hidden"`) |

No screen-reader testing has been done on any overlay. These items must not be described as implemented, and the VoiceOver accessibility label must not be claimed until they are tested. Revisit at final pre-release readiness.
