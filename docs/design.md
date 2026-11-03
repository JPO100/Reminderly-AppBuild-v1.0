# Design

Visual conventions as implemented. Colours and sizes are mostly applied inline in component code; there is no single theme map. Values were checked against the code on 2026-10-12 (centred overlay values are in [design-standards/overlay-standards.md](./design-standards/overlay-standards.md)); where they differ, the code is the source of truth and this document should be corrected.

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
| Panel title | 20px | `#1C2C42` |
| Row title, setting label, button label | 17px | `#1C2C42` (buttons white) |
| Description text | 17px Lato Medium (14px for section subtitles) | `#939393` |
| Row subtitle | 14px | `#BABABA` |
| Filter pill | 14px | Category colour |
| Sub-header | 15px | `#BABABA` |
| Empty state | 17px | `#CCCCCC` (`#BABABA` for the calendar empty day) |

## Spacing and sizing

Common values: 4px (title to subtitle), 10px (list gaps), 16px (pill padding, row gaps), 20px (main panel padding), 24px (panel padding), 30px and 40px (see the overlay standard), 45px (header, pill and button height).

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
- Centred overlay clearances and screen-size behaviour: see [design-standards/overlay-standards.md](./design-standards/overlay-standards.md).

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

The centred overlay standard, and Reminderly's overlay implementation record, are in [design-standards/overlay-standards.md](./design-standards/overlay-standards.md). That document is the only place overlay rules live; do not restate them here.

## Motion

- Bottom sheets slide up (`y: "100%"` to 0, about 250ms).
- List rows: `layout` with `exit={{ opacity: 0 }}`; `AnimatePresence` keyed by view and filter.
- Behavioural timings (350ms, 500ms, 1000ms) are listed in [architecture.md](./architecture.md).
