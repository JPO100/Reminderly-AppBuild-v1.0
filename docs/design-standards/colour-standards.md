# Colour standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

## Core

| Name | Value | Use |
|------|-------|-----|
| Reminderly blue | `#4784F8` | Primary buttons, active toggles, NLC tokens, tutorial dots, app background behind the panels |
| App text dark blue (reminderly dark blue) | `#1C2C42` | Headings, overlay and sheet titles, reminder titles, settings rows, pinned list circle and icon |
| Picker blue | `#0088FE` | Calendar arrows, selected date in the date picker |

## Reminder categories

| Category | Colour |
|----------|--------|
| Today | `#00AFEE` |
| This week | `#E466FD` |
| Later (and combined Later) | `#FDB146` |
| Sometime | `#939393` |
| Overdue | `#FF0000` |

## List categories

Done `#8168D5`, Started `#60C1E7`, Todo `#939393` (pinned lists show a navy `#1C2C42` circle). The tutorial mockups still use an older palette.

## States and greys

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
