# Reminders

The Reminders tab: the active list, filters, the done/deleted archive, the reminder lifecycle and the New reminder and Reminder info overlays. Completion, deletion and repeats are protected areas (see `Claude.md`).

Scheduling, NLC, repeats and the calendar view are in [scheduling-and-nlc.md](./scheduling-and-nlc.md). Notifications are in [notifications.md](./notifications.md). Smart reminders are in [lists.md](./lists.md). Visual standards are in [../design.md](../design.md).

Visual values in this document were checked against `App.tsx` on 2026-10-12. Where a detail is not listed, the code is the source of truth.

## States

| State | Condition | Shown in |
|-------|-----------|----------|
| Active | `completedAt == null` and `deletedAt == null` | Active list |
| Done | `completedAt != null` and `deletedAt == null` | Archive (Done) |
| Deleted | `deletedAt != null`, whatever `completedAt` is | Archive (Deleted) |

Membership is derived from these timestamps alone; there are no secondary collections.

## Categories, overdue and sorting

### Categories

`categoriseReminder(reminder, now)` (`reminder-utils.ts`), derived at render time:

| Category | Rule | Colour |
|----------|------|--------|
| `today` | Scheduled for today | `#00AFEE` |
| `this-week` | Scheduled later in the current Monday-Sunday week | `#E466FD` |
| `later` | Scheduled outside the current week (after this Sunday, or before this Monday) | `#FDB146` |
| `sometime` | No date | `#939393` |
| `other` | Combined Later filter (Later + Sometime) when the settings menu is on | `#FDB146` |

Weeks run Monday to Sunday (UK). On a Sunday, the following Monday is `later`.

With the settings menu on (`reminderly-ff-settings-menu-v2`, default on), Sometime reminders are presented as Later (`getDisplayCategory`), using the Later colour. This is presentation only; the stored schedule is unchanged.

### Overdue

`isOverdue(reminder, now)`:

- Only scheduled reminders can be overdue; Sometime never is.
- Date only: overdue when the date is before today. Today is not overdue.
- Date and time: overdue when that moment is before `now`.
- Applies equally to repeating reminders.

Overdue reminders are red (`#FF0000`: circle, title), appear in every filter, and sort to the top of every view.

### Sorting

`sortReminders(list, now)`:

1. Overdue first.
2. Category: today, this week, later, sometime.
3. Scheduled reminders by date, then time (timed before untimed on the same date).
4. Others by `createdAt` ascending.

## Active list

Default view on launch. Shows active reminders, filtered and sorted as above.

### Header and navigation

- Logo: the tick (left 22%) toggles the done/deleted archive; the text (from 25%) is the dev tools triple-tap area.
- With the Lists module on, a Reminders/Lists tab bar shows. The selected tab is persisted (`reminderly-active-main-tab`).
- With the settings menu on, a header settings button opens the Reminders settings panel (see [settings.md](./settings.md)).

### Filters

| Settings menu | Pills |
|---------------|-------|
| On (default) | Today, This week, Later (combined Later and Sometime) |
| Off | Today, This week, Later, Sometime (Sometime hidden below 390px width) |

- Tap an inactive pill to activate it; tap the active pill to return to All. Changing filter clears a calendar day selection.
- Styles (`getReminderFilterPillStyle`): default (All) 1px inset category-coloured border and text; active white background, 2px inset category border; inactive when another is active 1px `#D9D9D9` border and text.
- Pills are 45px high, fully rounded, Lato Bold 14px, spaced `justify-between`.
- Overdue reminders bypass the filter.

### Reminder rows

```
Row
├── Circle (completion target), category colour or overdue red
├── Text column
│   ├── Title: getDisplayTitle(), Lato Bold 17px, single line with ellipsis
│   └── Subtitle: Lato Bold 14px #BABABA, plus smart reminder and repeat indicators
└── Three-dot menu button (opens Reminder info)
```

- Title colour: `#1C2C42`, red when overdue, the category colour while highlighted after insert.
- Subtitle, in priority order:
  1. Smart reminder: `<done> of <total> items. Due by ...`
  2. Overdue by one day or more: `N day(s) overdue`, plus the repeat text for repeating reminders
  3. Repeating: next occurrence label and repeat text, or `formatRepeatLabel`
  4. Scheduled: date label, plus `at <time>`
  5. `No date / time set`
- Small indicators after the subtitle show smart reminders and repeating reminders.
- With the settings menu on, the three-dot button is inset so it aligns with the header settings button.
- The title text itself is not interactive.

### Empty states

Shown after `EMPTY_STATE_DELAY` (350ms) through `DelayedEmptyState`, so exit animations finish first. Messages: "No reminders... take it easy!", with "today" or "this week" variants for those filters. An empty calendar day shows the same style of message.

### New reminder button

Fixed at the bottom of the card, full width (max 768px), Reminderly blue `#4784F8`, label "New reminder". Opens the New reminder overlay.

## Lifecycle

### Create

1. New reminder overlay: text, optional date, time and repeat (see below).
2. On submit the reminder is built:
   ```ts
   {
     id: crypto.randomUUID(),
     originalText: text,
     displayText: normaliseReminderText(text, schedule, repeatRule, now, ...),
     createdAt: Date.now(),
     schedule,                       // scheduled when a date is set, otherwise sometime
     repeatRule: repeatConfigToRule(repeatConfig),  // kept unchanged if repeat reminders are off
   }
   ```
3. `addReminder` inserts it after `NEW_REMINDER_INSERT_DELAY` (500ms) with a fade-in and a 1000ms highlight (`INSERT_HIGHLIGHT_MS`). A newer insert cancels a pending one (last wins); only the latest insert is highlighted.
4. The persistence, notification, badge and widget effects follow.

### Edit

1. Reminder info > Edit reminder closes the info overlay, waits 200ms, then opens the overlay in edit mode.
2. Text, date, time and repeat are prefilled. Title "Edit reminder" (or "Edit smart reminder").
3. NLC: auto-apply is suppressed on the first pass, and only tokens not in the original text can auto-apply.
4. Submit updates the reminder in place: `id`, `createdAt` and `completedAt` are kept; text, display text, schedule and repeat rule are replaced.

### Mark as done (active to done)

Triggers: the row circle, Reminder info > Mark as done (after a 200ms close), or the notification action.

1. Guard: no-op if a completion timer already exists for the id.
2. The id joins `pendingDoneIds`; the row shows done styling immediately (filled circle with tick, line-through).
3. After `COMPLETION_DELAY` (350ms): `completedAt = Date.now()` and the id leaves the pending set. The row fades out.
4. Repeating reminders with a date: after a further `RESCHEDULE_DELAY` (1000ms) the next occurrence is inserted as a new reminder (same text and rule) with fade-in and highlight. The completed instance stays in the archive. If the original was deleted in the meantime, or the completion was undone, nothing is inserted. See [scheduling-and-nlc.md](./scheduling-and-nlc.md) for `getNextOccurrence`.

### Delete (active to deleted)

Trigger: Reminder info > Delete reminder.

1. Guard against an existing delete timer.
2. Cancels any pending completion, uncomplete, reschedule or undelete for the id and clears other pending sets.
3. The id joins `pendingDeleteIds`; grey (`#939393`) styling with line-through.
4. After 350ms: `deletedAt = Date.now()`; the row fades out.

### Move to tomorrow

Shown in Reminder info for overdue reminders, and available as a notification action. Moves the date to tomorrow and keeps the time. For a smart reminder, the linked list's due date moves too.

### Uncomplete (done to active)

Trigger: the filled circle on a done reminder in the archive.

1. For repeating reminders, cancels any pending reschedule timer and computes the expected next occurrence.
2. Clears `completedAt` immediately; the reminder reappears in the active list with fade-in and highlight.
3. For repeating reminders, removes the spawned next occurrence if exactly one confident match exists (same original text, display text, repeat rule and expected schedule).
4. The id stays in `pendingUncompleteIds` for 350ms so it remains visible in the archive while it fades out. Its original `completedAt` is held for stable sorting during the transition.

### Undelete (deleted to active or done)

Trigger: the filled circle on a deleted reminder.

1. Cancels any pending delete timer and captures the original `deletedAt` for stable sorting.
2. Clears `deletedAt` immediately. With no `completedAt` the reminder returns to the active list (fade-in, highlight); otherwise it stays in the archive as done.
3. Stays in `pendingUndeleteIds` for 350ms, then fades from the deleted view.

### Rules

- Pending sets are presentation only; they never affect stored data, filtering or sorting.
- Every action checks for an existing timer first, so double taps do nothing.
- All timers are held in refs and cleared on unmount.
- Overdue styling is kept during restore transitions.
- Each change rewrites the whole reminders array to `localStorage` (skipped when unchanged).

## Done/deleted archive

Opened from the logo tick; tapping it again returns to the list.

### Filters

- Done (`#404040`) and Deleted (`#898989`) pills, same style rules as the category pills. Tap to filter, tap again for All.
- All: done and deleted reminders, plus items in a pending restore.
- Done: `completedAt` set and not deleted, plus `pendingUncompleteIds`.
- Deleted: `deletedAt` set, plus `pendingUndeleteIds`.
- A back arrow button exists in the code but is hidden.

### Rows

- Done: filled circle with tick, tap to uncomplete.
- Deleted: grey filled circle with tick and grey text, tap to undelete.
- During a restore the row switches to its destination styling (red if overdue) before fading.
- The three-dot menu is not shown; archive rows are not editable.

Sorted by most recent status time, descending: captured undelete key, `deletedAt`, `completedAt`, captured uncomplete key, then 0.

### Clear all

Three steps: "Clear all" > "Clear all?" > "Cleared!" (resets after 500ms). Tapping anywhere else at step 1 or 2 cancels (pointer-down capture outside `clearAllButtonRef`). Disabled (grey `#CCCCCC`) when there is nothing to clear.

On confirm it permanently removes all done and deleted reminders, including pending restores, clears their timers and pending sets, and resets the archive filter to All.

### Empty states

"No done or deleted reminders yet...", "No done reminders yet..." with "get busy!", and "No deleted reminders yet...".

## Animation

- Rows are `motion.div` with `layout` and `exit={{ opacity: 0 }}`; gaps close with a layout animation.
- `AnimatePresence` is keyed by view and filter (`${viewMode}-${activeFilter}`, plus `doneDeletedFilter` in the archive) so animations never carry across views.
- New and restored reminders fade in and are highlighted for 1000ms (`reinsertedId`, `insertHighlightId`).

## New reminder overlay

`src/imports/NewReminderOverlay.tsx`. Slides up from the bottom (250ms) over a transparent backdrop; tapping the backdrop closes it and discards the draft.

### Structure

```
Header: title + tick submit button (45px)
  "New reminder", "Edit reminder", "Add smart reminder" or "Edit smart reminder"
Text input ("Don't forget...") with NLC highlighting
Date row + inline month calendar
Time row + inline TimePicker
Repeats row (opens the Repeats overlay)
```

- Submit is active only when the text is not empty after trimming.
- Date and time: time needs a date. Turning date off turns time off; turning time on sets the date to today if none is set.
- The calendar view can prefill the date (see [scheduling-and-nlc.md](./scheduling-and-nlc.md)).
- Time picker: 15-minute steps, or 1-minute steps when 1 minute increments are available and chosen.
- Repeats: tapping opens the Repeats overlay; the chosen rule shows as a label. With repeat reminders off, no rule can be created and an edited reminder keeps its existing rule (`keepRepeatRuleWhenOff`).
- The text input uses three layers: a transparent textarea, a mirror behind it that colours tokens, and a hit layer above it that makes tokens tappable. One render function draws both overlays so they never drift; scroll is synchronised. Details in [scheduling-and-nlc.md](./scheduling-and-nlc.md).
- `schedule.kind` is `scheduled` when a date is set, otherwise `sometime`.
- Smart reminder mode: opened for a list (`smartReminderCreateListId`), it creates a reminder with `linkedListId` and `isSmartReminder: true`, text from `buildSmartReminderText()`. See [lists.md](./lists.md).
- No keyboard shortcuts; Enter adds a new line.

## Reminder info overlay

`src/app/components/ReminderInfoOverlay.tsx`. Opened from the row's three-dot button (active list only). Centred modal, 340px wide, `bg-black/50` backdrop; closes on backdrop tap or Escape; locks background scroll.

Content:

- Title: `displayText` without a trailing "at <time>", wrapping.
- Due line (`formatDueLine`): "No schedule set", "Due <date>", "Due <date> at <time>", "Due at <time>", or "Was due ..." in red when overdue.
- Smart reminders: "<done> of <total> items".
- Repeating reminders: "Repeats ..." from `formatRepeatRuleText`.

Actions, in order:

| Action | Shown | Behaviour |
|--------|-------|-----------|
| Mark as done | Always | Close, 200ms, completion flow |
| Move to tomorrow | Overdue only | Close, 200ms, move |
| Edit reminder | When editable | Close, 200ms, open edit mode |
| Go to list | Smart reminders | Close, open the linked list |
| Delete reminder | Always | Delete flow |

## Files

- `src/app/App.tsx` - state, handlers, list and archive rendering
- `src/app/reminder-utils.ts` - categorise, overdue, sort, labels
- `src/imports/NewReminderOverlay.tsx`, `src/imports/TimePicker.tsx`
- `src/app/components/ReminderInfoOverlay.tsx`, `src/app/components/RepeatsOverlay.tsx`
- `src/app/utils/render-text.ts` (`getDisplayTitle`, `renderReminderText`)
