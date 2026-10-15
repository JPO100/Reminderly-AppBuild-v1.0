# Lists

Checklists alongside reminders, with templates, pinning and smart reminders. Lists are a separate top-level surface and data set. The only link with reminders is through smart reminders.

## Availability

| Feature | Flag (default) | Notes |
|---------|----------------|-------|
| Lists module | `reminderly-ff-lists` (on) | Reminders and Lists cannot both be off |
| Smart reminders | `reminderly-ff-smart-reminders` (on) | Needs Reminders and Lists on |
| List templates | `reminderly-ff-saved-lists` (on) | Also changes the filter set (below) |
| Pinned lists | `reminderly-ff-pinned-lists` (on) | Off: `pinnedAt` is kept but ignored |
| Default templates in a clean state | `reminderly-config-templates-in-clean-state` (off) | When all lists are cleared from Dev tools, reseeds the default templates |
| Siri for lists | `reminderly-ff-siri-lists` (off) | Not built |

With the Lists module on, a Reminders/Lists tab bar shows; the logo tick switches between active lists and the lists done/deleted archive (`viewMode` `lists-done`).

## Data

```ts
type ListItem = { id: string; text: string; completed: boolean; completedAt?: number | null };

type CreatedList = {
  id: string; title: string; items: ListItem[];
  sortMode?: 'alphabetical' | 'insertion'; // legacy, not read (see Lists settings > Sort items A to Z)
  pinnedAt?: number | null;
  smartReminders?: boolean; smartReminderDueDate?: string | null; smartReminderTime?: string | null;
  status?: 'active' | 'done' | 'deleted'; statusChangedAt?: number | null;
};

type SavedListTemplate = { id: string; title: string; items: ListItem[];
  status?: 'active' | 'deleted'; statusChangedAt?: number | null };
```

- Lists persist to `reminderly-created-lists`, templates to `reminderly-saved-lists`.
- On load, legacy string items become `ListItem` objects with new ids; a missing `status` is derived from a legacy `completedAt`; missing pin and smart reminder fields get defaults. Templates always load with items unchecked.
- `DEFAULT_TEMPLATE_SEED` in `App.tsx` holds seven default templates (Weekly food shop, Morning routine, Weekend tasks, Packing list, Spaghetti bolognese, Pancakes, Films to watch).

## Categories and filters

`getCurrentListCategory(items)` (`list-utils.ts`) is the only categorisation, used by cards, filters, ordering and the editor accent. Buckets are count-based (CTO, 2026-10-15):

| Bucket | Rule | Colour (`LIST_CATEGORY_COLOURS`) |
|--------|------|-------------|
| Todo (`todo`) | Nothing checked, including empty lists | `#939393` |
| Started (`started`) | At least one checked, not all | `#60C1E7` |
| Done (`complete`) | All items checked, at least one item | `#8168D5` |

Pinned lists show a navy `#1C2C42` circle (`getListCircleColour`, John and CTO, 2026-10-15) and the pin icon beside the title. Their bucket, filters and ordering are unchanged.

Filter pills: Todo, Started, Done. The Templates button shows when the templates flag is on; a lists settings button opens the Lists settings panel when the settings menu is on. Same toggle and style rules as reminder pills.

Ordering: pinned lists first in the All view only, newest `pinnedAt` first; then `orderListsByCategory` (Todo, Started, Done, creation order within each bucket). Pinned lists are not shown under a filter.

Empty states: "No lists here yet.. get busy!", plus one message per filter ("No fully checked off lists yet", "Nothing started here yet", "Nothing 'todo' here!").

## List rows

- Left completion button, title, progress subtitle `X of Y`, optional smart reminder due text and indicator, right-hand menu button (opens list info).
- Pinned rows (All view only) show a pin icon before the title and dark blue list-circle styling, without changing the row height.

## Lifecycle

States are stored on the list (`status`, `statusChangedAt`). Templates have their own active and deleted states and never use smart reminders or pinning.

| Action | Effect | Smart reminder |
|--------|--------|----------------|
| Create (New list, or Use template) | New active list: `pinnedAt null`, smart reminders off, `status 'active'` | - |
| Edit | Title, items, checked state, sort mode, smart reminder settings | Text and schedule resync |
| Mark as done | Pending window, all items checked, `status 'done'`, moves to archive | Linked reminder completed |
| Undo done | Items unchecked, `status 'active'`, reinserted with highlight | Linked reminder uncompleted |
| Delete | Pending window, `status 'deleted'`, moves to archive | Linked reminder deleted |
| Undelete | `status 'active'`, reinserted with highlight | Linked reminder restored |
| Pin / Unpin | Sets or clears `pinnedAt` (after a 200ms overlay close) | - |

## Smart reminders

A list can own one smart reminder: a normal `Reminder` with `isSmartReminder: true` and `linkedListId`.

- Set per list (Set smart reminder, with a due date; time defaults to 12:00) from the list info or list settings overlays, or created through the New reminder overlay in smart reminder mode ("Add smart reminder").
- Text from `buildSmartReminderText`: "Complete '<title>' list" (nothing checked), "Finish '<title>' list" (under 75%), "Nearly done - '<title>'" (75% or more).
- An effect in `App.tsx` reconciles reminders with lists whenever either changes: each active list with smart reminders on and a due date has exactly one active linked reminder, kept in step with the list's text, date and time; active linked reminders for lists that no longer qualify are removed; done and deleted ones are kept. Smart reminders feature off removes the active ones.
- Rows show "<done> of <total> items. Due by ..." with a smart reminder indicator. Reminder info shows progress and a Go to list action.
- Moving a smart reminder to tomorrow also moves the list's due date.
- Timed smart reminders get notifications like any other reminder.

## Overlays

### List editor

Bottom sheet for creating and editing lists and templates, with a 45px header and a tick submit button.

- Title editing; add, edit and delete items (`AddListItemInput`, `EditableListItem`, swipe to reveal delete); item order follows the sort mode.
- Sort modes: insertion (unchecked first, then checked items, most recently checked first) or alphabetical (`getDisplayListItems`). One setting for every list: Lists settings > Sort items A to Z (`reminderly-pref-list-sort-az`, default off), resolved by `resolveListSortMode`. A newly added item stays where it was typed briefly before moving into A to Z order. The per-list `sortMode` field is legacy: kept in saved data, never read or written.
- Creates or saves on backdrop close or the header tick.
- A settings button opens the list settings overlay (`src/imports/InfoOverlay.tsx`): Uncheck all items, Create template, Set smart reminder, Delete list.
- Template editing reuses the editor with alphabetical sort and no smart reminders, saving to the templates set.

### Clear done lists nightly

Lists settings toggle, `reminderly-pref-list-auto-clear`, default off (CTO, 2026-10-15).

- `fullyTickedAt` on each active list records when it last became fully ticked (`syncFullyTickedAt`, run on every list change): stamped when the list becomes fully ticked (including by deleting its last unticked item), cleared when it stops being fully ticked, reset when reticked, saved with the list. Lists already fully ticked before this feature are stamped on first run, so they clear no earlier than the following midnight.
- Eligible (`getListsToAutoClear`): active, unpinned, at least one item, all ticked, `fullyTickedAt` before the start of the current local day.
- Runs on the existing time refresh (launch, return to foreground, midnight boundary) and when the setting is turned on; catches up after days away. No background execution. Skips the list open in the editor and lists mid-animation; a ref guard completes each list once.
- Completion uses the shared `commitListDone` path with manual completion. Manual: status done and linked smart reminder completed through list-sync (dated now). Auto-clear: no animation, keeps item tick times, dates the list from `fullyTickedAt` (`markListDone`) and skips list-sync; the smart reminder sync completes the linked reminder at that same date.
- Hint: while the setting is on, eligible-tonight lists (fully ticked, active, unpinned) show ". Clears tonight" after the progress text. It disappears as soon as the list is no longer fully ticked.
- Smart reminders: when a list is marked done, manually or by auto-clear, the smart reminder sync (`syncSmartReminderForInactiveList`) completes its still-active smart reminder at the list's done time, so it moves to Done with the list. Deleted or missing lists still remove it. Restoring the list un-completes the same reminder (fix/smart-reminder-list-done).

### List info

`src/imports/list-info-overlay.tsx`, opened from a row's menu button: Set smart reminder and date, Mark as done, Edit list, Pin to top / Unpin from top (pinned lists flag), Create template, Delete list. Mark as done, pin and delete close the overlay first, then apply.

### Templates panel

A Settings-style slide-up panel (standard 45px header and close button), opened from the Templates button in the filter row.

- Lists active templates with title and item count; a create button; empty state "No list templates yet.. get busy!".
- Row menu: Use template, Edit template, Delete template.
- Use template creates a new active list with new ids, all items unchecked, and feedback animation stages before opening it.
- Deleted templates appear in the lists archive and can be restored.

### Lists archive

Done and deleted lists and deleted templates, derived from `status`, with Done and Deleted filters, restore by tapping the circle, and empty states "No done or deleted lists yet…", "No done lists yet…", "No deleted lists yet…".

## Files

- `src/app/App.tsx` - list state, handlers, rendering, smart reminder reconciliation
- `src/app/utils/list-utils.ts` - categories, display order, smart reminder text and dates
- `src/app/components/lists/` - `AddListItemInput`, `EditableListItem`
- `src/imports/Header.tsx`, `InfoOverlay.tsx`, `list-info-overlay.tsx`, `deleted-info-overlay.tsx`
- `src/app/components/ListSmartReminderCalendar.tsx` - date picker in the list overlays
