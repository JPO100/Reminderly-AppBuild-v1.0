# Overdue and Status

Consolidated from `/docs/reminder-logic.md`.

## Overdue Detection

### Definition

A scheduled reminder is overdue when its date/time is in the past. The `isOverdue(reminder, now)` function in `reminder-utils.ts` performs this check.

### Rules

- Only `kind === "scheduled"` reminders can be overdue. Sometime reminders are never overdue.
- **Date-only** (no time set): overdue when the date is strictly before today. Today itself is not overdue.
- **Date + time**: overdue when the combined datetime is before `now`.
- Applies uniformly to all scheduled reminders, including those with `repeatRule`.

### Visual Treatment

Overdue reminders use `#FF0000` (red) for:
- Circle stroke
- Text colour
- Status icon fill

### Sorting Behaviour

`sortReminders` uses overdue as the absolute primary sort key:

1. Overdue reminders float to the top of every view, above all non-overdue items.
2. Within overdue items, category and date/time ordering is preserved.
3. Within non-overdue items: category ordering (today > this-week > later > sometime), then date/time ascending, then createdAt ascending.

### Filtering Behaviour

Overdue reminders appear in every filter view (All, Today, This Week, Later, Sometime). They are not restricted to their original category filter.

```typescript
if (isOverdue(r, now)) return true; // bypass category filter
```

This ensures users always see overdue items regardless of which filter is active.

## Status Icons

Each reminder displays a status icon on the right side of the row.

### Icon Types

| Condition | Icon | Description |
|-----------|------|-------------|
| `repeatRule` exists | Repeats icon | Circular arrows (recurring reminder) |
| `schedule.kind === "scheduled"` (no repeat) | Schedule-set icon | Clock (date/time set) |
| `schedule.kind === "sometime"` | Schedule-unset icon | No-time symbol (no date set) |

### Icon Colours

**Active List**
- Normal (not overdue): `#BABABA` (grey)
- Overdue: `#FF0000` (red)
- Pending done: `#4784F8` (dark blue)
- Pending delete: `#939393` (grey)

**Done/Deleted Archive**
- Done reminder: `#4784F8` (dark blue)
- Deleted reminder: `#939393` (grey)
- Pending restore (uncomplete/undelete): `#BABABA` (grey), or `#FF0000` if overdue

### Interaction

- **Active list**: Icons are clickable, open ReminderInfoOverlay
- **Done/deleted view**: Icons are not clickable (visual only)

## Circle Checkbox Colours

Circle colour indicates reminder category (or overdue status):

### Category Colours

```typescript
const CATEGORY_COLOURS: Record<string, string> = {
  today: "#00AFEE",      // Blue
  "this-week": "#DF4DFC", // Pink
  later: "#FAA429",       // Orange
  sometime: "#939393",    // Grey
};
```

### Colour Priority

```typescript
circleColour = overdue ? OVERDUE_COLOUR : CATEGORY_COLOURS[category]
```

Overdue colour (`#FF0000`) takes precedence over category colour.

### Visual States

**Active (normal)**
- Outline only, no fill
- Stroke colour: category colour (or overdue red)

**Pending done**
- Filled `#4784F8` (dark blue)
- White tick icon overlaid

**Pending delete**
- Filled `#939393` (grey)
- White tick icon overlaid

**Done**
- Filled `#4784F8` (dark blue)
- White tick icon overlaid
- Clickable: triggers uncomplete

**Deleted**
- Filled `#939393` (grey)
- White tick icon overlaid
- Clickable: triggers undelete

## Text Colours

### Active List

**Normal**
- Title: `#4784F8` (dark blue)
- Subtitle: `#BABABA` (grey)

**Overdue**
- Title: `#FF0000` (red)
- Subtitle: `#BABABA` (grey)

**Pending done**
- Container: `#BABABA`
- Title: `#4784F8` with `line-through`
- Subtitle: `#BABABA`

**Pending delete**
- Title: `#939393` with `line-through`
- Subtitle: `#939393`

### Done/Deleted Archive

**Done**
- Title: `#4784F8` (dark blue)
- Subtitle: `#4784F8` or `#BABABA` (depending on state)

**Deleted**
- Title: `#939393` (grey)
- Subtitle: `#939393` (grey)

**Pending restore**
- Transitions to active list styling (category-coloured circle, dark blue text)
- Or transitions to done styling if `completedAt` remains set after undelete

## Overdue Persistence

Overdue styling is preserved during pending transitions:
- Pending uncomplete: if reminder is overdue, circle/text/icon remain red until transition completes
- Pending undelete: same behaviour

This ensures users can see which restored reminders are still overdue.

## Self-Checks

6 checks for `isOverdue` detection:
- Yesterday date-only: overdue
- Today + earlier time: overdue
- Today + later time: not overdue
- Tomorrow: not overdue
- Sometime: never overdue
- Today date-only: not overdue

2 checks for overdue sort pinning:
- Within-category: overdue items first
- Absolute-top across categories: overdue float above all

See [Self-Check System](../06-quality-and-dev/self-check-system.md) for details.

## Related Documentation

- [Filters and Sorting](./filters-and-sorting.md) - Filter and sort behaviour
- [Reminder Lifecycle](./reminder-lifecycle.md) - State transitions and timing
- [Active List](../01-core-surfaces/active-list.md) - Visual presentation
