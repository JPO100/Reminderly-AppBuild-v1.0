# Design

Visual conventions as implemented. Colours and sizes are mostly applied inline in component code; there is no single theme map. Overlay values were checked against the code on 2026-11-02 and other values on 2026-10-12; where they differ, the code is the source of truth and this document should be corrected.

UI changes follow these conventions and any visual specification John supplies for the task. `Claude.md` is only a loader for `project-rules.md` and holds no visual specification.

## Colours

### Core

| Name | Value | Use |
|------|-------|-----|
| Reminderly blue | `#4784F8` | Primary buttons, active toggles, NLC tokens, tutorial dots, app background behind the panels |
| App text dark blue (reminderly dark blue) | `#1C2C42` | Headings, overlay and sheet titles, reminder titles, settings rows, pinned list circle and icon |
| Picker blue | `#0088FE` | Calendar arrows, selected date in the date picker |

### Reminder categories

| Category | Colour |
|----------|--------|
| Today | `#00AFEE` |
| This week | `#E466FD` |
| Later (and combined Later) | `#FDB146` |
| Sometime | `#939393` |
| Overdue | `#FF0000` |

### List categories

Done `#8168D5`, Started `#60C1E7`, Todo `#939393` (pinned lists show a navy `#1C2C42` circle). The tutorial mockups still use an older palette.

### States and greys

| Use | Value |
|-----|-------|
| Description text, everywhere including Dev tools: info overlays, page and section descriptions, Support pages, confirmation and error messages, reminder info metadata lines | `#939393` (standard, John, 2026-10-28) |
| Row and toggle subtitles, sub-headers, toggle off track (medium grey) | `#BABABA` |
| Deleted reminder | `#939393` |
| Deleted list | `#898989` |
| Done archive pill | `#404040` |
| Empty state and disabled Clear all | `#CCCCCC` |
| Inactive pill, disabled border, inactive toggle and its text (inactive grey), past days | `#D9D9D9` |
| Separator lines, calendar divider | `#EDEDED`, `#E4E4E4` |
| Light fills | `#F5F5F5`, `#E4E4E4` (active option in Repeats) |

Reminder and list surfaces use different accent systems. With the Lists module on, some pending and archive text uses `#3F3F3F`.

## Typography

Lato throughout (`src/styles/fonts.css`), bold (700) unless stated.

| Style | Size | Colour |
|-------|------|--------|
| Panel title, overlay Header | 20px | `#1C2C42` |
| Overlay Title (text directly under a Header) | 17px | `#939393` |
| Row title, setting label, button label | 17px | `#1C2C42` (buttons white) |
| Description text | 17px Lato Medium (14px for section subtitles) | `#939393` |
| Row subtitle | 14px | `#BABABA` |
| Filter pill | 14px | Category colour |
| Sub-header | 15px | `#BABABA` |
| Empty state | 17px | `#CCCCCC` (`#BABABA` for the calendar empty day) |

## Spacing and sizing

Common values: 4px (title to subtitle), 10px (list gaps), 16px (pill padding, row gaps), 20px (main panel padding), 24px (panel padding), 30px and 40px (centred overlays), 45px (header, pill and button height).

### Panel standard

Applies to the main Reminders and Lists panels and every slide-up panel (Templates, Lists editor, New and edit reminder, Repeats, Dev tools). Centred overlays and the tutorial are excluded.

| Space | Value |
|-------|-------|
| Top padding | 24px |
| Header | 45px high, title left, 45 x 45 button(s) right, 10px apart. Main panels use the filter row as the header |
| Close button | 45 x 45 `#4784F8` circle with a white cross; inactive buttons `#D9D9D9` |
| Header to content | 24px, no separator (Lists editor: 26px below the subtitle, which sits about 40px below the title row) |
| Content to bottom button | 24px |
| Bottom space | 24px to the screen bottom (done/deleted pages: 0px) |
| Top corners | 15px |
| Horizontal padding | 20px main panels and Dev tools; 24px other slide-up panels |
| Content max width | 768px |
| Main panel min height | 350px |
| Panel stop | Sliding panels stop 28px below the bottom of the Reminderly logo |

Where a container gap also spaces other content, header spacing is adjusted with a margin on the header rather than changing the shared gap.

### Rows and controls

- Filter pills: 45px high, fully rounded, 16px side padding (13px below 375px width with the settings menu on), `justify-between`.
- Reminder row circle: 25 x 25.
- Attachment indicator: a reminder with an attachment (attachments feature on) shows a 13 x 15 paperclip, `currentColor`, 8px before its title, in the active, Done and Deleted lists alike. Rows without an attachment show no icon.
- Row three-dot button: with the settings menu on, inset 11.5px from the right (`RowMenuButton` `alignWithSettingsButton`) so the dots centre under the header settings button. Applies to Reminders and Lists rows, done/deleted pages and Templates.
- New reminder / New list button: full width (max 768px), fully rounded, `#4784F8`, 17px white label, 30px side padding, height `clamp(40px, calc(20vh - 73.6px), 60px)`.
- Header logo: 209.653 x 35.653 SVG wordmark with tick.
- Toggle: 56 x 30 track, 3.75px inset, 22.5px white knob; instant, no transition.
- Toggle standard (2026-10-19, docs/plans/toggle-standard.md), for every toggle including the reminder panel, Dev tools and the tutorial:
  - On: text and row icon `#1C2C42`, track `#4784F8`.
  - Off: text and row icon `#1C2C42`, track `#BABABA`.
  - Inactive (unavailable): text, row icon and track `#D9D9D9`, not tappable.
  - Subtitles `#BABABA` on and off. Info icons follow the text: normal on and off, `#D9D9D9` only when inactive.

### Tutorial phone

`TutorialPhoneShell.tsx` owns size (max 308px wide, 361px high), 14px bezel padding and colours; `TutorialPhoneHeader.tsx` the header; `TutorialReminderFilters.tsx` the pill row. Page files never own phone sizing.

## Layout and responsiveness

- Mobile-first, designed at 402 x 874 (iPhone 16 Pro). The iOS app is portrait only.
- Content is centred with a 768px maximum width.
- Width: below 390px the Sometime pill hides (settings menu off); below 375px pill padding reduces.
- Height: below about 667px some tutorial spacing reduces; below 570px the tutorial switches to auto height and hides its dots. The calendar view needs at least 852pt.
- Centred overlays keep at least 100px clear above and below (never less than the safe-area inset plus 20px) and 20px at the sides; see Centred overlays.

## Overlay patterns

### Bottom sheets

Used by New reminder, Repeats, Lists editor, Templates, Dev tools and the tutorial, all wrapped in `App.tsx`:

```tsx
<motion.div />                 // transparent backdrop, tap to close
<motion.div                    // sheet, slides up
  initial={{ y: "100%", top: getBottomSheetTopPosition() }}
  animate={{ y: 0, top: getBottomSheetTopPosition() }} />
```

- Viewport-aware top position, 768px max width, 15px top corners; drag to close where supported.
- `top` must be set in `initial` as well as `animate`. Without it the sheet's first frame takes its height from its content, so a long list (more than about 23 items) slides from the wrong distance and visibly bounces when `top` applies mid-animation.

### Centred overlays

This section is the NeatlyMade overlay specification. It is written to be reused by other NeatlyMade apps (Noterly): Part A is the approved standard, Part B records what Reminderly implements today, Part C lists outstanding work that is **not implemented**, and Part D is a checklist for a new app. Where Part B differs from Part A, the difference is flagged.

#### Part A. Approved design standard

Vocabulary (Overlay Design Standards v2): **Header** is the overlay's heading, Lato Bold 20px. **Title** is the optional line or lines directly under the Header, Lato Bold 17px. **Header area** is the Header plus any Title. **Button block** is the group of rows or buttons, 30px apart. **Scrollable area** is the part where only content scrolls. **Viewport** is the visible screen area. **Card** is the white rounded panel. **Backdrop** is the dimming layer behind it. **Wrapper** is the invisible full-screen layer that centres the card. **Footer controls** are buttons pinned below the body.

**A1. Position and geometry**

| Item | Rule | Measured from |
|------|------|---------------|
| Centring | Card centred horizontally and vertically in the wrapper | Viewport |
| Width | Preferred 340px; shrinks to fit so the card is never closer than 20px to either side edge (320px at a 360px viewport, 335px at 375px, 340px from 380px up) | Viewport left and right edges |
| Top and bottom clearance | At least 100px between card and viewport edge, and never less than the safe-area inset plus 20px: `max(100px, inset + 20px)` | Viewport top and bottom edges (the inset is the notch or home indicator area) |
| Maximum height | Viewport height minus the two clearances; the card never grows past it | Same |
| Corner radius | 32px on all four corners, always visible, including while content scrolls | Card |
| Backdrop | Full viewport, black at 50% opacity, flat colour (no gradient or blur) | Viewport |
| Layering | Backdrop and wrapper at layer 60. An overlay that must sit over another overlay (the notification permission prompt) uses layer 70 | Page |
| Orientation | Portrait only; landscape is not supported | N/A |

Responsive rules: the standard is expressed as clearances and a preferred width, not as device sizes. Narrower screens shrink the card width (minimum supported viewport 360 x 667), shorter screens shrink the card height and the body scrolls. Nothing may overflow horizontally. The 20px side clearance and the 100px vertical clearance apply on every screen size.

**A2. Internal layout**

- Card padding: 40px top and bottom, 30px left and right. Content is centred horizontally.
- Header: Lato Bold 20px, `#1C2C42`, centred, one line (line box 24px), truncated with an ellipsis if too long. Never wraps.
- Title (only where text sits under the Header): Lato Bold 17px, `#939393`, centred. Short Title lines are one line and truncate; a Title that is a description (a dialog message) may wrap. Exception: the Reminder info due line stays red `#FF0000` when overdue.
- **Header-to-Title distance is 30px measured from the Header's baseline to the Title's cap top, not between text boxes.** Lato Bold metrics (as bundled): ascent 0.987em, descent 0.213em, cap height 0.723em, line box 1.2em. With the Header line box fixed at 24px its baseline is 0.213 x 20 = 4.26px above its box bottom; the Title's cap top is (0.987 - 0.723) x 17 = 4.488px below its line box top. The CSS gap between the two boxes is therefore 30 - 4.26 - 4.488 = **21.25px** (`HEADER_TITLE_GAP` in `OverlayHeader.tsx`). No other spacing is measured to glyphs: the 40px, 30px and 20px values elsewhere are between boxes, as before.
- Header area to first content or first button: 40px (box to box).
- **Text directly under a Header is spaced like a Title: 30px from the Header's baseline to the text's cap top** (information pages, Dev tools info, the NLC Examples page). `ScrollArea` detects a first line of text and pulls it up by (4.26 + 40 + (line height - 1.2em) / 2 + 0.264em - 30)px: 20.55px for 24px line height body text, 20.05px for 23px. Where the header area has lines of its own under the Header (Support pages' version and date) this does not apply and the 30px box gap stays. Rows, buttons and images keep the 40px box gap (44.3px from the Header baseline to the top of a settings row).
- Between sections (for example header to buttons): 40px.
- Between elements within a section (rows, stacked buttons, lines of related text, around separators): 30px.
- Intro or description text: Lato Medium 17px, `#939393`, 24px line height, centred or left-aligned as the content requires. Confirmation messages use Lato SemiBold 17px, `#939393`.
- Several Title lines in one header area (Reminder info) are 30px apart, box to box.

Buttons:

| Item | Rule |
|------|------|
| Size | 50px high, fully rounded (`rounded-[100px]`), padding 18px horizontal and 15px vertical |
| Label | Lato Bold 17px, white, single line |
| Colours | Primary `#4784F8`; secondary or destructive `#939393`; disabled `#D9D9D9`; dismissive "Cancel" or "Not now" `#BABABA` |
| Stacked (three or more actions, or one action) | Full width of the content area, 30px apart |
| Two-button dialogs (Cancel and Confirm) | Side by side, **equal width** (each takes half of the row), 30px apart, both 50px high. Applies to every two-button dialog |
| Single action (OK, Close, Back) | Full width |

Destructive actions use grey `#939393`, not red.

**A3. Scrolling**

- Overlays that fit never scroll and show no scroll indicator.
- When content is taller than the available height, **the header area stays fixed** and only the scrollable area scrolls. The Header and Title never scroll away.
- The scrollable area's top edge, where content is clipped (hard edge), is **20px below the header area**; the content inside starts another 20px lower, so the first row is still 40px below the header area. The clip edge is a flat cut: scrolled content is visible in the 20px band and disappears at the edge. Where a page uses a 30px gap under its header area (Support sub-pages), the clip edge is 20px below and the content starts 30px below.
- A **single** footer control (Back, Close, OK) is pinned at the card's bottom padding and stays visible. A **group** of several buttons is part of the scrolling body.
- The body area ends 30px above the card's bottom padding edge (above the pinned button if there is one) as a hard edge. No fades or gradients.
- Scroll indicator: a grey `#D9D9D9` down chevron, 12px wide and 7px high, centred horizontally in the 30px footer gap, directly above the pinned button or card bottom. It is visual only (not tappable), shown while there is more content below, and hidden when the body reaches its end. It switches instantly.
- When content fits, the footer gap is the normal 40px bottom padding and there is no indicator. When it overflows, the gap is 30px and holds the indicator.
- Rounded corners stay intact while scrolling: scrolled content is clipped by the card's 32px radius at the top and bottom; it is never cut off with a square edge.
- Headers and short Titles truncate rather than wrap; on very short screens the fixed header area takes priority and the scrollable area shrinks first.

**A4. Overlay families**

| Family | Structure |
|--------|-----------|
| Info (Reminder info, List info, Deleted info) | Header, 40, rows or buttons (30 apart). Reminder info: Header, Title lines (30 apart), 40, buttons |
| Menu (Saved list, Template editor) | Header, 40, stacked buttons |
| Settings (Reminders, Lists) | One shared card height for all settings overlays: the taller of the two home pages, capped by the available height. Sub-pages and information pages inherit that height (a page never resizes the card). Title fixed, rows scroll; information pages have fixed title, scrolling image and text, and Back pinned |
| Attachment overlays | Add attachment: title and stacked primary buttons. Attachment error: title, message, OK. Delete attachment: title and one grey destructive button, no Cancel |
| Confirmation and notice dialogs | Header, 30 (glyph measured), Title (the message), 40, buttons (equal-width Cancel and Confirm, or a single OK) |
| Permission prompt (Notification ask) | Same as a confirmation dialog: "Not now" and "Allow", equal width |
| Tutorial replicas | See A6 |

**A5. Interaction and accessibility (standard)**

- Overlays open and close instantly (no animation on the card or backdrop).
- Tapping the backdrop dismisses an overlay, with the meaning stated per overlay (Part B3). A dismissal is always equivalent to the safe choice (Cancel, Not now, Close).
- Escape closes an overlay where a hardware keyboard exists.
- Every overlay card has `role="dialog"` and `aria-modal="true"`, an accessible name from its title, and moves focus into the card when it opens and back to the trigger when it closes.
- While an overlay is open the page behind it does not scroll.
- Toggle rows inside overlays follow the toggle standard (Spacing and sizing section); the whole row is tappable.

**A6. Tutorial replicas**

- Tutorials reproduce an overlay inside the tutorial phone with the same structure, text, colours, radius and spacing as the real overlay, scaled uniformly (the 340px card is scaled by phone interior width divided by 393). Spacing and radius are scaled, not re-specified.
- Replicas show only the buttons relevant to the scenario being taught and are not interactive.
- The backdrop is the same 50% black, limited to the phone screen.
- Intentional differences: the settings replica (Page 6) uses the live settings content, is anchored 16px above the phone bottom, scaled from bottom centre, capped to the phone height, and takes the shared settings height (documented exception, 2026-10-23).
- Any change to an overlay that a tutorial reproduces updates the tutorial in the same branch.

#### Part B. Current Reminderly implementation (verified against code, 2026-11-02)

**B1. Structure.** There is no shared wrapper component; each overlay is built inline from the same three elements:

```
div.fixed.inset-0.bg-black/50.z-[60]                         backdrop, tap to close
div.fixed.inset-0.z-[60].flex.items-center.justify-center
    .pointer-events-none.px-[20px].centred-overlay-wrapper   centring wrapper
  div.pointer-events-auto.centred-overlay-card               card
```

- The 20px side clearance is the wrapper's `px-[20px]`; the card has an inline 340px width (or `w-full max-w-[340px]`), so it shrinks automatically (D1: 320px at 360, 335 at 375).
- `.centred-overlay-wrapper` (`src/styles/index.css`) sets top and bottom padding `max(100px, env(safe-area-inset-top) + 20px)` and `max(100px, env(safe-area-inset-bottom) + 20px)`. On current iPhones the insets are below 80px, so the clearance is effectively 100px (D5).
- `.centred-overlay-card` sets `max-height: 100%` and `overflow-y: auto`.
- Cards with pinned headers override to `overflow-y: hidden` and scroll an inner area instead.
- Layering: standard overlays at z-60; Notification ask at z-70. Slide-up panels are z-50, below all centred overlays (D3).
- Scrolling is done by the shared `ScrollArea` and `ScrollIndicator` in `src/app/components/OverlayScrollArea.tsx` (constants `SCROLL_PEEK` 40, `OVERFLOW_FOOTER` 30, `PINNED_BUTTON_HEIGHT` 50). The parent must be a flex column with a definite or maximum height and `min-h-0`. The `pinned` option renders one 50px button below the area.
- List settings and List info (D6): the card is an outer 340px rounded scroll container (`overflow: hidden`, 32px radius) holding an inner card with the header fixed and `ScrollArea` for the body. The card does not stop click propagation.
- Reminders and Lists settings share one height via `SettingsHeightProbe` (an invisible render of both home pages) and `settingsCardMinHeight`: the minimum of the taller home page plus padding and 100% of the available height. `PanelShell` passes the height to sub-pages and information pages.

**B2. Overlay inventory** (20 live centred overlays; 6 slide-up panels and 6 tutorial replicas are listed for completeness; the "Storage unavailable" strip is an inline banner, not an overlay).

| Overlay | Layout | Buttons |
|---------|--------|---------|
| Reminder info | Header (the reminder text, truncated), 30 (glyph measured), Title lines: due line (Bold, `#939393`, `#FF0000` when overdue), smart reminder line and repeats line (Bold `#939393`, 30 apart, truncated), 40, buttons | Stacked, scrolling `ScrollArea` |
| Deleted info | Header, 40, buttons | Stacked, scrolling |
| List settings | Header, 40, one button block: toggle rows and buttons all 30 apart | Stacked, scrolling |
| List info | Header, 40, one button block: smart reminder row (when shown) and buttons all 30 apart | Stacked, scrolling |
| Saved list menu | Header, 40, buttons | Stacked, scrolling |
| Template editor menu | Header, 40, buttons | Stacked, scrolling |
| Reminders settings | Shared height, centred title, rows 30 apart (toggles, then click-through rows with a 7 x 13 `#939393` chevron, then the tutorial row), no close button | Fixed title, scrolling rows |
| Lists settings | As Reminders settings | As above |
| Settings sub-pages and information pages | Same height; sub-pages have a back arrow in the header; information pages have fixed title, scrolling image and text | Back pinned |
| Notification ask | Header "Turn on notifications?", Title (message), buttons | Equal-width "Not now" `#BABABA` and "Allow" `#4784F8`; z-70 |
| Add attachment | Header, buttons | Stacked: Choose a photo, Take a photo, Choose a file (`#4784F8`) |
| Attachment error | Header, Title (message), OK | Single `#4784F8` |
| Delete attachment | Header, one button | Single grey `#939393`; no Cancel |
| Dev tools info | Header, body (Lato Medium 17px, 24px line height), Close | Title fixed, body scrolls, Close pinned `#4784F8` |
| NLC, Onboarding, Reminders, Lists, push-to-live confirmations (Dev tools) | Header, Title (message), Cancel and Confirm | Equal width, Cancel `#BABABA`, Confirm `#4784F8`, 30 gap (six dialogs) |
| Home toggle confirm | Same as the Dev tools confirmations | Same |
| Last module notice (Dev tools) | Header, Title (message), OK | Single `#4784F8` (D2) |

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

**B4. Text and buttons as implemented.** Header Lato Bold 20px `#1C2C42`, one line, ellipsis (`OverlayHeader`, or the same classes inline in Reminder info, the settings headers and the tutorial replica `TutorialOverlayTitle`). Title Lato Bold 17px `#939393` (`OverlayHeader` `title`; Reminder info lines inline), 21.25px under the Header's box. Info body Lato Medium 17px `#939393`, 24px line height. Reminder info due line `#939393`, `#FF0000` when overdue. The scrollable area's `marginTop: -20` / `paddingTop: 20` (`OverlayScrollArea.tsx`) give the 20px clip clearance. Settings and Dev tools information page Headers (icon plus text) are one line, so on the narrowest screens a long one such as "Include smart reminder lists" is truncated. Buttons are 50px high, `rounded-[100px]`, `px-[18px] py-[15px]`, Lato Bold 17px white. Two-button dialogs use `flex-1` on both buttons with a 30px gap (P2, merged 72110f4). Overlay headers are pinned with only the main content scrolling (P2a, merged 8ace85d). Rounded scroll edges for List settings and List info (P1, merged 8e73a93).

**B5. Settings scrolling details.** Every sub-page and information page takes the settings card's height and never resizes it. On an information page the title is fixed and only the image and text scroll; Back is always pinned at the bottom padding. Content that fits leaves unused space between content and Back, with no arrow. Overflowing content scrolls above Back with the 30px gap and arrow directly above it. Home pages that overflow on short screens follow the same rule. The tutorial Re-run pages use the live settings content and inherit it.

**B6. Toggle rows in centred overlays.**

- Row: full width, `flex gap-[16px] items-start`, whole row tappable; the toggle stops propagation to avoid double firing.
- Rows wrapper: `flex-col gap-[30px]`.
- Label block fills the remaining width: title 17px / 17px line height, single line with ellipsis; subtitle 14px / 14px, wraps; 9px between them.
- On: title and icon `#1C2C42`, subtitle `#BABABA`, track `#4784F8`. Off: title and icon `#1C2C42`, subtitle `#BABABA`, track `#BABABA`. No hover, focus or disabled states in overlays.
- Left icons: smart reminder bell 19.5 x 21.5 (1px top offset), insertion order 20.83 x 20.82, alphabetical 22.39 x 20.81. Info-line icons: bell 19 x 21, repeats 21 x 21, both `#939393`, 8px from text. Copy feedback icon 20 x 20 white, 12px from text.
- `ToggleButton` and `SmartRemindersLabel` are duplicated identically in `src/imports/InfoOverlay.tsx` and `src/imports/list-info-overlay.tsx`; list info shows only the smart reminder row.

**B7. Animation and accessibility as implemented.** Centred overlays appear and disappear instantly. Only button content animates (template "use" text fade 150/250ms, template button background 150ms, smart reminder due date highlight colour 300ms).

#### Part C. Outstanding work (not implemented)

Approved by John but **not built**: work package P3 was deliberately deferred (2026-11-02, John and Jason) after the overlay review found no confirmed user-facing defects. Only Reminder info has any of the behaviours below, and VoiceOver behaviour is untested on every overlay. Today's behaviour differs from A5 as follows:

| Standard (A5) | Current implementation |
|---------------|------------------------|
| `role="dialog"` and `aria-modal="true"` on every overlay | Only Reminder info has them |
| Initial focus inside the card; focus returns to the trigger | Only Reminder info moves focus on open; no overlay restores focus |
| Escape closes every overlay | Only Reminder info closes on Escape |
| Background scroll locked on every overlay | Only Reminder info locks it (`document.body.style.overflow = "hidden"`) |

No screen-reader testing has been done on any overlay. These items must not be described as implemented, and the VoiceOver accessibility label must not be claimed until they are tested. Revisit at final pre-release readiness.

#### Part D. Checklist for a new app (Noterly)

1. Build backdrop, wrapper and card as in B1; card 340px preferred, wrapper 20px side padding, 100px (or inset + 20px) top and bottom, 32px radius, z-60 (z-70 for overlays above overlays).
2. Padding 40/30; Header Lato Bold 20px (one line, truncates); Title Lato Bold 17px `#939393` with the Header-to-Title 30px measured baseline to cap top (A2); spacing 40 between sections and 30 within.
3. Buttons 50px, fully rounded, 17px white bold labels; two-button dialogs equal width with a 30px gap.
4. Put the header area outside the scrolling area, with the scroll clip edge 20px below it and 20px of padding inside; only the body scrolls; one footer control may be pinned; use a single shared scroll component with a 30px footer gap and a 12 x 7 `#D9D9D9` chevron.
5. Clip scrolled content with the card's rounded corners; no gradients, fades or square edges.
6. Overlays that fit never scroll and show no arrow.
7. Add `role="dialog"`, `aria-modal`, an accessible name, initial focus, focus return, Escape and background scroll lock on every overlay from the start (Part C is a gap in Reminderly, not a standard to copy).
8. Define the backdrop-tap meaning per overlay and document it.
9. Reproduce overlays in any tutorial by scaling the real structure, and update the tutorial with the overlay.
10. Test at 360 x 667, 375 x 667, 390 x 844 and 402 x 874.

## Motion

- Bottom sheets slide up (`y: "100%"` to 0, about 250ms).
- List rows: `layout` with `exit={{ opacity: 0 }}`; `AnimatePresence` keyed by view and filter.
- Behavioural timings (350ms, 500ms, 1000ms) are listed in [architecture.md](./architecture.md).
