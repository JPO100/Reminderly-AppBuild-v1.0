# Design

Visual conventions as implemented. Colours and sizes are mostly applied inline in component code; there is no single theme map. Values here were checked against the code on 2026-10-12; where they differ, the code is the source of truth and this document should be corrected.

UI changes follow these conventions and any supplied visual specification (`Claude.md`).

## Colours

### Core

| Name | Value | Use |
|------|-------|-----|
| Reminderly blue | `#4784F8` | Primary buttons, active toggles, NLC tokens, tutorial dots, app background behind the panels |
| App text dark blue | `#1C2C42` | Headings, overlay and sheet titles, reminder titles, settings rows, pinned list circle and icon |
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
| Subtitles, secondary text | `#BABABA` |
| Deleted reminder | `#939393` |
| Deleted list | `#898989` |
| Done archive pill | `#404040` |
| Empty state and disabled Clear all | `#CCCCCC` |
| Inactive pill, disabled border, toggle off, past days | `#D9D9D9` |
| Separator lines, calendar divider | `#EDEDED`, `#E4E4E4` |
| Light fills | `#F5F5F5`, `#E4E4E4` (active option in Repeats) |

Reminder and list surfaces use different accent systems. With the Lists module on, some pending and archive text uses `#3F3F3F`.

## Typography

Lato throughout (`src/styles/fonts.css`), bold (700) unless stated.

| Style | Size | Colour |
|-------|------|--------|
| Panel and overlay title | 20px | `#1C2C42` |
| Row title, setting label, button label | 17px | `#1C2C42` (buttons white) |
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
- Row three-dot button: with the settings menu on, inset 11.5px from the right (`RowMenuButton` `alignWithSettingsButton`) so the dots centre under the header settings button. Applies to Reminders and Lists rows, done/deleted pages and Templates.
- New reminder / New list button: full width (max 768px), fully rounded, `#4784F8`, 17px white label, 30px side padding, height `clamp(40px, calc(20vh - 73.6px), 60px)`.
- Header logo: 209.653 x 35.653 SVG wordmark with tick.
- Toggle: 56 x 30 track, 3.75px inset, 22.5px white knob; `#4784F8` on, `#D9D9D9` off; instant, no transition.

### Tutorial phone

`TutorialPhoneShell.tsx` owns size (max 308px wide, 361px high), 14px bezel padding and colours; `TutorialPhoneHeader.tsx` the header; `TutorialReminderFilters.tsx` the pill row. Page files never own phone sizing.

## Layout and responsiveness

- Mobile-first, designed at 402 x 874 (iPhone 16 Pro). The iOS app is portrait only.
- Content is centred with a 768px maximum width.
- Width: below 390px the Sometime pill hides (settings menu off); below 375px pill padding reduces.
- Height: below about 667px some tutorial spacing reduces; below 570px the tutorial switches to auto height and hides its dots. The calendar view needs at least 852pt.
- Centred overlays keep 100px clear above and below (and 20px from the notch and home indicator); content scrolls inside the card.

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

Used by Reminder info, deleted info, list settings (`InfoOverlay`), list info, saved list and template menus, Reminders and Lists settings, Dev tools info and Dev tools confirmation dialogs. There is no shared wrapper; each is built inline to the same standard:

```
div.fixed.inset-0.bg-black/50.z-[60]                         backdrop, tap to close
div.fixed.inset-0.z-[60].flex.items-center.justify-center
    .pointer-events-none.px-[20px].centred-overlay-wrapper   centring wrapper
  div.pointer-events-auto.centred-overlay-card               card, stopPropagation on click
```

| Space | Value |
|-------|-------|
| Card | 340px wide, white, 32px radius, `flex-col items-center` |
| Padding | 40px top and bottom, 30px sides |
| Screen edge to card | at least 20px |
| Title to content or first button | 40px |
| Between sections | 40px |
| Between elements in a section, rows, buttons, around separators | 30px |
| Maximum height | 100px clear top and bottom (`centred-overlay-wrapper`, `centred-overlay-card` in `src/styles/index.css`); overflow scrolls inside |

Typical card gap is 40px. Reminder info uses a 30px gap with `mb-[10px]` on the title and `mt-[10px]` on the buttons to make 40px.

Text:

| Element | Style |
|---------|-------|
| Title | 20px, `#1C2C42`, centred, wraps (`whitespace-pre-wrap`) |
| Reminder info due line | 17px, `#1C2C42` or `#FF0000` when overdue, single line |
| Metadata lines (progress, repeats) | 17px, `#BABABA`, wraps |
| Confirmation body | Lato SemiBold 17px, `#939393` |
| Dev tools info body | 17px, `#BABABA`, 24px line height |
| Button label | 17px white, single line |

Buttons:

- Stacked: full width, 50px high, fully rounded, `px-[18px] py-[15px]`, 30px apart. Primary `#4784F8`; destructive or secondary `#939393`; disabled `#D9D9D9`.
- Side by side (Dev tools confirmations): Cancel `#BABABA` and Confirm `#4784F8`, 50px high, 30px apart, `justify-between`.

Layouts:

| Overlay | Layout |
|---------|--------|
| Reminder info | Title, 40, due line, 30, smart reminder line, 30, repeats line, 40, buttons |
| Deleted info, saved list and template menus | Title, 40, buttons |
| List settings (`InfoOverlay`) | Title, 40, toggle rows (30 apart), 40, buttons |
| List info | Title, 40, smart reminder row (when shown), 40, buttons |
| Reminders and Lists settings | Fixed 450px card. Centred title (back arrow on sub-pages), 40, rows 30 apart: toggles, then click-through rows (chevron 7 x 13 `#939393`, 15px right inset), then the tutorial row (chevron rotated up). No close button, separator or subtitle; title fixed, rows scroll |
| Dev tools info | Title, 40, body, 40, Close |
| Dev tools confirmations | Title, 40, body, 40, Cancel and Confirm |

Toggle rows in centred overlays:

- Row: full width, `flex gap-[16px] items-start`, whole row tappable; the toggle stops propagation to avoid double firing.
- Rows wrapper: `flex-col gap-[30px]`.
- Label block fills the remaining width: title 17px / 17px line height, single line with ellipsis; subtitle 14px / 14px, wraps; 9px between them.
- On: title and icon `#1C2C42`, subtitle `#BABABA`, track `#4784F8`. Off: all `#D9D9D9`, track `#D9D9D9`. No hover, focus or disabled states.
- Left icons: smart reminder bell 19.5 x 21.5 (1px top offset), insertion order 20.83 x 20.82, alphabetical 22.39 x 20.81. Info-line icons: bell 19 x 21, repeats 21 x 21, both `#BABABA`, 8px from text. Copy feedback icon 20 x 20 white, 12px from text.
- `ToggleButton` and `SmartRemindersLabel` are duplicated identically in `src/imports/InfoOverlay.tsx` and `src/imports/list-info-overlay.tsx`; list info shows only the smart reminder row.

Animation: centred overlays appear and disappear instantly. Only button content animates (template "use" text fade 150/250ms, template button background 150ms, smart reminder due date highlight colour 300ms). Reminder info locks background scroll while open.

## Motion

- Bottom sheets slide up (`y: "100%"` to 0, about 250ms).
- List rows: `layout` with `exit={{ opacity: 0 }}`; `AnimatePresence` keyed by view and filter.
- Behavioural timings (350ms, 500ms, 1000ms) are listed in [architecture.md](./architecture.md).
