# Data Model and Persistence

## Reminder Schema

Current reminder shape from `src/app/reminder-utils.ts`:

```ts
type Reminder = {
  id: string;
  originalText: string;
  displayText: string;
  createdAt: number;
  schedule: ReminderSchedule;
  repeatRule?: RepeatRule | null;
  completedAt?: number | null;
  deletedAt?: number | null;
  linkedListId?: string | null;
  isSmartReminder?: boolean;
};
```

### Reminder Fields

- `id`: UUID string
- `originalText`: raw reminder text
- `displayText`: normalised/presentation text stored with the reminder
- `createdAt`: epoch ms
- `schedule`: either scheduled with `date` and optional `time`, or `sometime`
- `repeatRule`: optional repeat configuration
- `completedAt`: completion timestamp for archive membership
- `deletedAt`: deletion timestamp for archive membership
- `linkedListId`: optional list id for smart reminders generated from lists
- `isSmartReminder`: optional boolean marker for list-linked smart reminders

## Reminder Schedule

```ts
type ReminderSchedule =
  | { kind: "scheduled"; date: string; time?: string }
  | { kind: "sometime" };
```

- `date` format: `YYYY-MM-DD`
- `time` format: `HH:mm`
- time can only exist on `scheduled` reminders

## Repeat Types

### Persisted repeat rule

```ts
interface RepeatRule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay: Array<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'> | null;
}
```

### UI repeat config

```ts
type RepeatConfig = {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom-days';
  interval: number;
  selectedDays?: string[];
} | null;
```

`RepeatConfig` is UI-facing state. `RepeatRule` is the persisted reminder field.

## Lists Schema

Current list types from `src/app/utils/list-utils.ts` and `src/app/App.tsx`:

### List items

```ts
type ListItem = {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number | null;
};
```

### Created lists

```ts
type CreatedList = {
  id: string;
  title: string;
  items: ListItem[];
  sortMode?: 'alphabetical' | 'insertion';
  pinnedAt?: number | null;
  smartReminders?: boolean;
  smartReminderDueDate?: string | null;
  smartReminderTime?: string | null;
  status?: 'active' | 'done' | 'deleted';
  statusChangedAt?: number | null;
};
```

### Saved list templates

```ts
type SavedListTemplate = {
  id: string;
  title: string;
  items: ListItem[];
  status?: 'active' | 'deleted';
  statusChangedAt?: number | null;
};
```

## Derived Types

### Reminder categories

```ts
type ReminderCategory = "today" | "this-week" | "later" | "sometime" | "other";
```

These are derived from schedule state and current filter mode, not persisted directly.

### View mode

```ts
type ViewMode = "list" | "done-deleted";
```

This is reminder-surface state only. Lists use the same `viewMode` state value with list-specific render branches in `App.tsx`.

### List categories

```ts
type ListCategory = 'complete' | 'almost' | 'started' | 'todo';
```

List categories are derived from the completion state of list items.

## Primary Storage Keys

### Reminders

- `reminderly.reminders.v1`

### Lists

- `reminderly-created-lists`
- `reminderly-saved-lists`

### Notification tap state

- `reminderly.pendingNotificationReminderId`

### App/UI state

- `reminderly-active-main-tab`

### Dev settings and feature flags

- `reminderly-dev-tools-password-required`
- `reminderly-dev-one-minute-time-increments`
- `reminderly-ff-onboarding-tutorial`
- `dev.listsEnabled`
- `reminderly-ff-tutorial-first-launch`
- `reminderly-ff-tutorial-every-start`
- `reminderly-tutorial-first-launch-shown`
- `reminderly-ff-smart-reminders`
- `reminderly-ff-saved-lists`
- `reminderly-ff-pinned-lists`
- `reminderly-dev-default-templates-in-clean-state`

## Reminder Loading and Migration

`loadReminders()` in `src/app/reminder-utils.ts` currently:

1. reads `reminderly.reminders.v1`
2. parses JSON
3. drops non-array payloads
4. validates required fields
5. validates schedule shape
6. migrates legacy fields where supported
7. sanitises output to the current `Reminder` shape

### Current migrations / sanitisation

- legacy `text` migrates to `originalText` and `displayText`
- legacy `schedule.kind === "inbox"` migrates to `schedule.kind === "sometime"`
- empty time string becomes `undefined`
- invalid repeat data becomes `null`
- valid `linkedListId` is preserved
- `isSmartReminder` is only preserved when explicitly `true`

Invalid reminders are dropped rather than partially hydrated.

## Reminder Persistence

`App.tsx` persists the entire reminders array whenever reminder state changes:

```ts
persistStringIfChanged(STORAGE_KEY, JSON.stringify(reminders));
```

Reminder notifications are then synchronised from the current reminder array when scheduling is relevant.

## List Persistence

`App.tsx` persists:

- `createdLists` to `reminderly-created-lists`
- `savedLists` to `reminderly-saved-lists`

Persisted list data includes:

- item completion state
- list smart reminder fields
- `pinnedAt`
- list `status`
- `statusChangedAt`

## Notification Tracking

### Scheduled notifications

`src/app/notifications.ts` derives scheduled local notifications from reminders that are:

- not completed
- not deleted
- `schedule.kind === "scheduled"`
- have a `time`
- still in the future

Each notification stores:

- deterministic numeric notification id derived from reminder id
- title `Reminderly`
- body from `reminder.displayText`
- `extra.reminderId`

### Notification tap handoff

When a local notification is tapped:

- the pending reminder id is stored under `reminderly.pendingNotificationReminderId`
- a `reminderly:notification-tap` event is used for in-app handling
- `useNotificationTapHandler` clears other overlays, switches to the reminders tab, resets filter/view state, and opens the tapped reminder after a short delay

## Default Template Seed

`App.tsx` contains a built-in `DEFAULT_TEMPLATE_SEED` used for saved list templates.  
Whether these templates are reintroduced into a clean state is controlled by:

- `reminderly-dev-default-templates-in-clean-state`

## Current Data Invariants

- reminder ids are unique
- reminder schedules are always present and valid after hydration
- time never exists without a scheduled date
- reminder archive membership is derived from `completedAt` / `deletedAt`
- smart reminders are still reminders and live in the same reminders collection
- created lists and saved list templates are persisted separately
- pinned list state is represented by `pinnedAt`, not by a separate collection
- list archive membership is represented by `status` / `statusChangedAt`

## File Locations

- `src/app/reminder-utils.ts`
- `src/app/types/reminder.ts`
- `src/app/utils/list-utils.ts`
- `src/app/App.tsx`
- `src/app/notifications.ts`
- `src/app/useNotificationTapHandler.ts`
