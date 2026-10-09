# Filters and Sorting

Consolidated from `/docs/filter-system.md` and `/docs/reminder-logic.md`.

## Filter System

The reminder filter row is rendered inside the white content panel, using the same filter row whether lists are enabled or disabled. The Done/Deleted filters render in the same row in the done/deleted view.

## Filter Buttons

Four filter pill buttons in a single row with `justify-between` spacing:

| Button | Category | Visible |
|--------|----------|---------|
| Today | `"today"` | Always |
| This week | `"this-week"` | Always |
| Later | `"later"` | Always |
| Sometime | `"sometime"` | Hidden below 390px viewport width |

### Behaviour

- Click inactive filter: activates it
- Click active filter: resets to `"all"`
- Default state (no filter active): 1px inset category-coloured border, category-coloured text
- Active button: white background, 2px inset category-coloured border, category-coloured text
- Inactive button (another filter active): 1px inset `#D9D9D9` border, `#D9D9D9` text
- All buttons: 45px height, 100px border-radius, 16px horizontal padding, Lato bold 14px

### Label Display

`getCategoryLabel()` function maps category values to display labels:

| Category value | Display label |
|----------------|---------------|
| `"today"` | "Today" |
| `"this-week"` | "This week" |
| `"later"` | "Later" |
| `"sometime"` | "Sometime" |
| `"other"` | "Later" |

Note: both `"later"` and `"other"` display as "Later".

## Overdue in Filters

Overdue reminders appear in every filter view regardless of their category:

```typescript
if (isOverdue(r, now)) return true;
```

Overdue reminders bypass category filtering.

## Category System

### Reminder Categories

```typescript
export type ReminderCategory = "today" | "this-week" | "later" | "sometime" | "other";
```

Categories derived at render time from `schedule` field:

**today** - blue `#00AFEE`
- `schedule.kind === "scheduled"` and date equals today

**this-week** - pink `#DF4DFC`
- `schedule.kind === "scheduled"` and date within current Monday-Sunday week but not today

**later** - orange `#FAA429`
- `schedule.kind === "scheduled"` and date after the current week's Sunday

**sometime** - grey `#939393`
- `schedule.kind === "sometime"`

**other** - virtual category
- Not used by any current filter button
- Maps to "later" OR "sometime"

### Categorisation Logic

`categoriseReminder(reminder, now)` function in `reminder-utils.ts` derives category at render time.

### Week Boundary Calculation

Week uses Monday-Sunday boundary (UK convention):

```typescript
const dow = today.getDay(); // 0=Sun
const mondayOffset = dow === 0 ? -6 : 1 - dow;
const monday = new Date(today);
monday.setDate(today.getDate() + mondayOffset);
const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
```

### Edge Cases

On Sundays, `today.getDay()` returns 0. `mondayOffset` becomes -6, setting `monday` to the previous Monday. `sunday` is `monday + 6`, which equals the current Sunday. A reminder scheduled for the following Monday has `reminderDate > sunday`, so it categorises as "later" (orange).

## Sorting

`sortReminders(reminders, now)` function provides multi-level sort:

### Sort Priority

1. **Overdue status** (overdue items pinned to top)
2. **Category order** (today > this-week > later > sometime)
3. **Date/time** (ascending)
4. **createdAt** (ascending)

Within overdue group, category and datetime ordering is preserved.

### Sort Implementation

```typescript
function sortReminders(reminders: Reminder[], now: Date): Reminder[] {
  return [...reminders].sort((a, b) => {
    const aOverdue = isOverdue(a, now);
    const bOverdue = isOverdue(b, now);
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    const aCat = categoriseReminder(a, now);
    const bCat = categoriseReminder(b, now);
    const categoryOrder = { today: 0, 'this-week': 1, later: 2, sometime: 3, other: 4 };
    
    if (categoryOrder[aCat] !== categoryOrder[bCat]) {
      return categoryOrder[aCat] - categoryOrder[bCat];
    }
    
    // Date/time comparison for scheduled reminders
    // createdAt comparison for same date/time or sometime
  });
}
```

### Overdue Reminders

Overdue reminders float to top of every view. Within overdue group, normal category and date ordering applies.

## Done/Deleted View Filters

Done/deleted view has separate sub-filter system:

**Done** button - shows `completedAt != null` and `deletedAt == null`
**Deleted** button - shows `deletedAt != null`
**Default "all"** - shows both

See [Done/Deleted Archive](../01-core-surfaces/done-deleted-archive.md) for details.

## Responsive Behaviour

### Viewport < 390px

- "Sometime" button hidden (standard filters mode only)
- All other layout unchanged

### Filter Button Layout

- `justify-between` spacing (auto-width)
- 40px fixed height
- Responsive to available width

## Self-Checks

Filter and sorting behaviour verified by:
- 5 checks for `categoriseReminder` (today, this-week, this-week Monday, later, sometime)
- 4 checks for `sortReminders` (date ascending, time ascending, unscheduled after scheduled, time before no-time)
- 2 checks for overdue sort pinning (within-category and absolute-top across categories)

See [Self-Check System](../06-quality-and-dev/self-check-system.md) for details.

## Related Documentation

- [Active List](../01-core-surfaces/active-list.md) - Filter UI and interaction
- [Overdue and Status](./overdue-and-status.md) - Overdue detection logic
