# NeatlyMade Centred Overlay Standard (for Noterly)

**Status:** Approved by John (CEO), derived from `docs/design.md` "Centred overlays" in Reminderly (main `0aa17bf` plus the final review branch). Version date: 2026-11-03.
**Purpose:** Noterly's centred overlays must look and behave the same predictable way as Reminderly's. This file is self-contained; you do not need the Reminderly repository.
**Source of truth:** Reminderly's `docs/design.md`. If this file and `design.md` ever disagree, `design.md` wins and this file is regenerated. Raise any ambiguity with John; do not guess.

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

Destructive actions use grey `#939393`, not red. (The only red is a Title line that signals an overdue reminder, `#FF0000`; Noterly needs no equivalent unless John decides.)

Colours are named: Reminderly blue `#4784F8`, Reminderly dark blue `#1C2C42`, medium grey `#BABABA`, inactive grey `#D9D9D9`, description grey `#939393`. Confirm with John that Noterly shares these tokens; if Noterly's palette differs, only the colours change, never the geometry.

## 4. Overlay families

| Family | Structure |
|--------|-----------|
| Info | Header, 30, rows or buttons (30 apart) |
| Menu | Header, 30, stacked buttons |
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

## 7. Interaction and accessibility (standard for Noterly from day one)

- Overlays open and close instantly (no animation on the card or backdrop).
- Tapping the backdrop dismisses an overlay, with the meaning defined per overlay and documented. A dismissal is always the safe choice (Cancel, Not now, Close).
- Escape closes an overlay where a hardware keyboard exists.
- Every overlay card has `role="dialog"` and `aria-modal="true"`, an accessible name from its title, and moves focus into the card when it opens and back to the trigger when it closes.
- While an overlay is open the page behind does not scroll.

**Do not copy Reminderly's gap here.** Reminderly implements these only on one overlay (Reminder info); the rest is deliberately deferred and VoiceOver is untested. Noterly should build them in from the start, in the shared overlay component. Do not claim VoiceOver support until it has been tested.

## 8. Tutorials

If Noterly has an onboarding tutorial that reproduces an overlay, reproduce it inside the tutorial phone with the same structure, text, colours, radius and spacing as the real overlay, scaled uniformly (the 340px card is scaled by the phone's interior width divided by 393). Spacing and radius are scaled, not re-specified. Replicas are not interactive and show only the buttons relevant to the scenario. Any change to an overlay that a tutorial reproduces updates the tutorial in the same branch.

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

If an overlay needs to depart from this standard, it is a decision for John, recorded in the Noterly design document with the reason. Do not introduce exceptions silently. An overlay that does not follow the standard is a tidy-up item, not a precedent.
