# Active reminder list

## Overview

The active list is the primary view of Reminderly, displaying all reminders where `completedAt == null` and `deletedAt == null`. The list supports filtering by category, responsive layout, overdue highlighting, and interactive reminder rows.

## Access

The active list is the default view on app load. It can be accessed from the done/deleted view by clicking the logo tick icon in the header.

## Header

### Logo
- Reminderly wordmark with tick icon on the left
- Left 0-22%: Tick circle click area (toggles to done/deleted view)
- Left 25%-100%: Text click area (dev tools triple-tap counter)
- Logo dimensions: 209.653px × 35.653px
- Logo padding: 50px top, 20px bottom

### Filter Buttons

Rendered inside the white content panel (not the header), using the same filter row whether lists are enabled or disabled. The Done/Deleted filters render in the same row in the done/deleted view.

- 4 pill buttons: Today, This week, Later, Sometime
- "Sometime" button hidden below 390px viewport width
- Spacing: `justify-between`
- Default state (no filter active): 1px inset category-coloured border, category-coloured text
- Active state: white background, 2px inset category-coloured border, category-coloured text
- Inactive state (another filter active): 1px inset `#D9D9D9` border, `#D9D9D9` text
- Toggle behaviour: click inactive to activate, click active to reset to "all"

All buttons: 45px height, 100px border-radius, 16px horizontal padding, Lato bold 14px.

## Reminder Rows

### Layout
- Width: 100%
- Height: 51px
- Padding: 13px 1px
- Gap: 16px between elements
- Border-radius: 100px
- Alignment: `items-start`

### Structure
```
Row
├── Circle checkbox (25px × 25px)
├── Text column
│   ├── Title (17px, Lato Bold, dark blue or overdue red)
│   └── Subtitle (13.5px, Lato SemiBold, #BABABA) [conditional]
└── Status icon (schedule/repeats/no-time)
```

### Circle Checkbox
- 25px × 25px
- Category-coloured outline (or overdue red)
- No fill when active
- Filled dark blue `#4784F8` with white tick when pending done
- Filled grey `#939393` with white tick when pending delete
- `marginTop: 3px` (for alignment with title)

### Text Column
- Flex: 1 (fills available space)
- Title: 17px Lato Bold, dark blue `#4784F8` (or overdue red `#FF0000`)
- Subtitle: 13.5px Lato SemiBold, grey `#BABABA`
- `line-through` decoration when pending done or pending delete
- Truncation: `overflow-hidden`, `text-ellipsis`, `whitespace-nowrap`

### Subtitle Content
Displays in priority order:
1. Repeat label (if `repeatRule` exists)
2. Formatted date and time (if scheduled)
3. "No date / time set" (fallback)

### Status Icon
- Schedule-set icon (clock): scheduled reminders without repeat
- Repeats icon (circular arrows): reminders with repeatRule
- Schedule-unset icon (no-time): sometime reminders
- Colour: `#BABABA` (normal), `#4784F8` (pending done), `#939393` (pending delete), `#FF0000` (overdue)
- Clickable: opens ReminderInfoOverlay
- Size: varies by icon

### Visual States

**Normal (active)**
- Circle: category-coloured outline, no fill
- Text: dark blue `#4784F8`, no decoration
- Status icon: grey `#BABABA`

**Pending done (350ms window)**
- Circle: filled dark blue `#4784F8` with white tick
- Text container: `#BABABA`, text itself: dark blue `#4784F8` with `line-through`
- Status icon: dark blue `#4784F8`

**Pending delete (350ms window)**
- Circle: filled grey `#939393` with white tick
- Text: grey `#939393` with `line-through`
- Status icon: grey `#939393`

**Overdue**
- Circle: red `#FF0000` outline
- Text: red `#FF0000`
- Status icon: red `#FF0000`
- Pinned to top of list regardless of filter

## Filtering

### Category Filter Logic

When `activeFilter !== "all"`:
- Overdue reminders appear in every filter (bypass category check)
- Exact category match

### Overdue Reminders

Overdue reminders bypass category filtering and appear in all filter views. They are sorted to the top of the list.

### Empty State

When no reminders match the current filter:
- Message: "You don't have any reminders in this filter"
- Colour: `#CCCCCC`
- Font: Lato 17px
- Centered vertically and horizontally
- Delay: `EMPTY_STATE_DELAY + 350ms` after last item exits

## Sorting

Primary sort: overdue status (overdue items pinned to top)
Secondary sort: category order (today > this-week > later > sometime)
Tertiary sort: date/time ascending
Quaternary sort: createdAt ascending

Within overdue group, category and datetime ordering is preserved.

## Animation

Each reminder row wrapped in:
```tsx
<motion.div key={reminder.id} layout exit={{ opacity: 0 }}>
```

- Entry: fade-in for newly created or restored reminders
- Exit: fade-out when marked done, deleted, or filtered out
- Layout: smooth gap closure via `layout` prop (250ms duration)
- AnimatePresence key: `${viewMode}-${activeFilter}` (prevents cross-view animation bleed)

## Interactions

### Click Circle Checkbox
1. Immediate visual commit: add to `pendingDoneIds`
2. 350ms delayed data commit: set `completedAt = Date.now()`
3. For repeating reminders: additional 1000ms delay, then insert next occurrence
4. Exit animation via AnimatePresence

### Click Status Icon
Opens ReminderInfoOverlay for the clicked reminder

### Click Reminder Text
No action (text is not clickable)

## Responsive Behaviour

### Viewport < 390px
- "Sometime" filter button hidden (standard mode only)
- All other layout unchanged

### Viewport 667px (iPhone SE)
- Specific responsive behaviours defined in content-overlay-responsive pattern
- Settings overlay icons hidden, row alignment changes

### All Viewports
- Content max-width: 768px, centered
- Horizontal padding: 20px
- Filter buttons: `justify-between` spacing (auto-width)

## Persistence

Active list derived at render time from `reminders.filter(r => r.completedAt == null && r.deletedAt == null)`. Changes persist to localStorage immediately.

## New Reminder Button

- Position: Below scrollable list, fixed to bottom of white card
- Height: `clamp(40px, calc(20vh - 73.6px), 60px)` (viewport-responsive)
- Width: 100%, max-width 768px
- Text: "Create a new reminder" (Lato Bold 17px, white)
- Background: Reminderly blue `#4784F8`
- Border-radius: 100px
- Padding: 0 30px
- Opens: NewReminderOverlay