# Colour standards

**Version:** 1.0, 2026-11-03. Part of the [design standards](./README.md). Owner: Reminderly; other NeatlyMade apps take a copy and keep their own values.
**Reviewed:** 2026-11-03 against the code. The register below is every colour used by the app's own screens; entries marked "Code" were checked in the source (file given), entries marked "Not re-checked" come from the previous version of this document. Where the code and this document differ, the code is the source of truth and this document is corrected.

## 1. How colours are recorded

Every colour is recorded as **Name = Hex**, for example **Reminderly blue = `#4784F8`**, with its role and where it is used.

- **Agreed** names were set by John (CEO) and are used in conversation, code comments and the other standards: Reminderly blue, Reminderly dark blue, description grey, medium grey, inactive grey.
- **Descriptive** names are working labels so a colour can be referred to. They are not agreed names and John may rename them.
- A colour with no name and no clear role is listed in section 6, not in the register.

## 2. Core colours

| Name | Hex | Name status | Role | Evidence |
|------|-----|-------------|------|----------|
| Reminderly blue | `#4784F8` | Agreed | Primary actions, primary buttons, active toggle track, NLC tokens, tutorial dots, the app background behind the panels | Code: used throughout (about 576 uses) |
| Reminderly dark blue | `#1C2C42` | Agreed | Heading text: panel and overlay Headers, row and setting titles, reminder titles, toggle titles and icons, back arrow; the pinned list circle and icon | Code: `PINNED_LIST_COLOUR` in `list-utils.ts`; throughout |
| White | `#FFFFFF` | Descriptive | Card and panel background, button labels | Code |
| Picker blue | `#0088FE` | Descriptive | Calendar arrows, selected date in the date picker | Not re-checked |

## 3. Greys

| Name | Hex | Name status | Role | Evidence |
|------|-----|-------------|------|----------|
| Description grey | `#939393` | Agreed | Description text everywhere (info overlays, page and section descriptions, Support pages, confirmation and error messages, reminder info metadata lines); Title lines; secondary and destructive buttons; Sometime category; Todo list category; deleted reminder; click-through chevrons. Standard set by John, 2026-10-28 | Code: `CATEGORY_COLOURS` (`App.tsx`), `LIST_CATEGORY_COLOURS` |
| Medium grey | `#BABABA` | Agreed | Row and toggle subtitles, Header subtitles, Cancel and Not now buttons, toggle off track, empty-calendar-day text | Code: throughout (about 311 uses) |
| Inactive grey | `#D9D9D9` | Agreed | Inactive pill, disabled border and button, inactive toggle and its text, past days, the scroll indicator chevron | Code: throughout (about 138 uses) |
| Empty-state grey | `#CCCCCC` | Descriptive | Empty state text, disabled Clear all | Code: `App.tsx` |
| Deleted grey | `#898989` | Descriptive | Deleted list, Deleted pill | Code: `DELETED_LIST_COLOUR`, `App.tsx` |
| Done charcoal | `#404040` | Descriptive | Done archive pill and Done list colour | Code: `DONE_LIST_COLOUR`, `App.tsx` |
| List text charcoal | `#3F3F3F` | Descriptive | Some pending and archive text when the Lists module is on | Code: `App.tsx`, `TutorialStaticReminderList.tsx` |
| Separator grey | `#EDEDED`, `#E4E4E4` | Descriptive | Separator lines and the calendar divider; `#E4E4E4` also the active option in Repeats | Code: `RepeatsOverlay.tsx`, `TimePicker.tsx`, `RemindersCalendar.tsx` and others |
| Light fill | `#F5F5F5` | Descriptive | Light fills (Repeats, time picker) | Code: `RepeatsOverlay.tsx`, `TimePicker.tsx` |
| Input fill | `#F7F7F7` | Descriptive | Text input fills (feedback field, New reminder text area) | Code: `SettingsPanelContent.tsx`, `NewReminderOverlay.tsx` |
| Pale grey | `#B7B7B7` | Descriptive | Greyed text in list items and the header when greyed; inactive date preset pill border and label | Code: `Header.tsx`, `EditableListItem.tsx`, `NewReminderOverlay.tsx` |

## 4. Category colours

| Name | Hex | Name status | Role | Evidence |
|------|-----|-------------|------|----------|
| Today blue | `#00AFEE` | Descriptive | Today reminders: pill, tick circle | Code: `CATEGORY_COLOURS`, `App.tsx:88` |
| This week purple | `#E466FD` | Descriptive | This week reminders | Code: `CATEGORY_COLOURS`, `App.tsx:89` |
| Later orange | `#FDB146` | Descriptive | Later reminders, and the combined Later group (the `other` category) | Code: `CATEGORY_COLOURS`, `App.tsx:90-92` |
| Sometime grey | `#939393` | Description grey | Sometime reminders | Code: `CATEGORY_COLOURS`, `App.tsx:91` |
| Overdue red | `#FF0000` | Descriptive | Overdue dot, and the overdue due line in Reminder info | Code: `OVERDUE_COLOUR` (`App.tsx`), `ReminderInfoOverlay.tsx` |
| List Todo | `#939393` | Description grey | Lists with no items checked | Code: `LIST_CATEGORY_COLOURS`, `list-utils.ts` |
| List Started | `#60C1E7` | Descriptive | Lists with some items checked | Code: `LIST_CATEGORY_COLOURS` |
| List Done | `#8168D5` | Descriptive | Lists with every item checked | Code: `LIST_CATEGORY_COLOURS` |
| Pinned list | `#1C2C42` | Reminderly dark blue | Pinned list circle | Code: `PINNED_LIST_COLOUR` |

Reminder and list surfaces use different accent systems.

## 5. Other colours the app screens use

| Name | Hex | Role | Evidence |
|------|-----|------|----------|
| Delete red | `#FF1E0A` | List item text while its delete action is revealed (swipe) | Code: `EditableListItem.tsx` |
| Error red | `#C62828` | Dev tools error text | Code: `DevToolsOverlay.tsx` |
| Pale blue tick fill | `#F0FAFE` | Tick icon fill when active (New reminder) | Code: `NewReminderOverlay.tsx` |
| Pale grey frame | `#ECECEC` | Outline of the New reminder illustration shapes | Code: `NewReminderOverlay.tsx` |
| Light grey text | `#C9C9C9` | 12px calendar caption text; the password show and hide icon when hidden | Code: `ListSmartReminderCalendar.tsx`, `DevToolsOverlay.tsx` |

## 6. Colours in tutorial mockups and illustrations (not app standards)

These are in the onboarding tutorial and its illustrations, not the live screens. They are listed so they are not mistaken for the palette. The tutorial mockups were drawn with an older palette.

| Hex | Where | Note |
|-----|-------|------|
| `#DF4DFC`, `#FAA429` | Tutorial and dummy reminder circles | Close to This week purple and Later orange but not the same values |
| `#141B34` | Tutorial and Dev tools icon artwork | A dark navy, not Reminderly dark blue |
| `#9468D5`, `#005BE3` | Tutorial filter pills ("Almost", "Complete") | Tutorial only |
| `#E5E5E5` | Tutorial toggle mock | Off track in the old mockups |
| `#000000`, `#6B6B6B` | Tutorial phone shell, notification mock | Illustration |
| `#34C759`, `#8E8E93`, `#FF3B30`, `#FFD60A`, `#FF9500`, `#FFCC00` and related | Siri tutorial iPhone app tiles | Imitates the iPhone home screen |
| `#8D9FFF`, `#BC82F3`, `#FF6778`, `#FFBA71`, `#6FD3F8` | Siri tutorial edge glow | The one approved exception to the no-gradient rule |
| `#FF8A80`, `#2E4A6B` | Attachment tutorial illustration | Illustration |
| `#7EC91C`, `#6AB016`, `#EAEAEA` | Dummy reminder and list generators | Development helpers |
| `#030213` and other values in `theme.css` | Template defaults | Not used as the palette; only `--border` is referenced, once |

## 7. Colour roles (shared across apps)

Shared standards (such as the overlay standard) refer to a **role**, not a hex value. An app keeps the same roles and sets its own value for each. The Reminderly value for each role is the colour in section 2 to 4 shown here.

| Role | Used for | Reminderly value |
|------|----------|------------------|
| Primary action | Primary buttons, active toggle track | Reminderly blue `#4784F8` |
| Heading text | Headers, row and toggle titles and icons, back arrow | Reminderly dark blue `#1C2C42` |
| Description text | Title lines, information text, secondary and destructive buttons, click-through chevrons | Description grey `#939393` |
| Subtitle and dismissive | Row and toggle subtitles, Header subtitles, Cancel and Not now buttons, off toggle track | Medium grey `#BABABA` |
| Inactive | Disabled buttons, inactive toggle and its text, scroll indicator | Inactive grey `#D9D9D9` |
| Warning text | The overdue Title line | Overdue red `#FF0000` |
| Card | Card and panel background | White `#FFFFFF` |
| Backdrop | Dimming layer behind an overlay | Black at 50% (shared; not an app colour) |

Another app (Noterly) records its own value for each role in its own design document. Its values are decided by John and are not yet set. Geometry and spacing do not change with colour values.

## 8. Open items

- Descriptive names (section 2 to 5) are working labels awaiting John's agreement.
- `#B7B7B7` appears in several places with the same look; confirm it is one colour and agree a name.
- The tutorial mockups' older palette (section 6) is not scheduled to be updated.
- Picker blue was not re-checked in this review.
