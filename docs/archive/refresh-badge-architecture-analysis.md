# Reminderly v3.0.0 - architecture and behaviour analysis: reminder refresh, badge counts, and state synchronisation

---

## 1. Badge count architecture

### 1.1 Where badge calculations live

Badge management uses a single third-party Capacitor plugin:

- Plugin: `@capawesome/capacitor-badge` (v8.0.2)
- Import: `src/app/App.tsx:3` - `import { Badge } from "@capawesome/capacitor-badge"`
- Badge calculation: `src/app/App.tsx:1533-1549` - a single `useEffect` hook

There is no native-side badge logic. All badge management is JS-side.

### 1.2 Badge calculation logic

The badge count effect at `App.tsx:1533-1549`:

```
useEffect(() => {
  if (!notifAppBadge) {
    void Badge.clear();
    return;
  }
  const now = new Date();
  let count = 0;
  for (const r of reminders) {
    if (r.completedAt || r.deletedAt || r.schedule.kind !== 'scheduled') continue;
    if (isOverdue(r, now)) {
      count++;
    } else if (notifIncludeTodayInBadge && categoriseReminder(r, now) === 'today') {
      count++;
    }
  }
  void Badge.set({ count });
}, [reminders, notifAppBadge, notifIncludeTodayInBadge, timeRefreshTick]);
```

### 1.3 What reminder states contribute to badge counts

Reminders are included in the badge count only if all of these conditions are met:
- `completedAt` is falsy (not completed)
- `deletedAt` is falsy (not deleted)
- `schedule.kind === 'scheduled'` (not "sometime" reminders)

Then the reminder contributes +1 if either:
- `isOverdue(r, now)` returns true (always counted), OR
- `notifIncludeTodayInBadge` is true AND `categoriseReminder(r, now)` returns `'today'`

Reminders that never contribute to badge count:
- Completed reminders (any `completedAt` value)
- Deleted reminders (any `deletedAt` value)
- "Sometime" reminders (`schedule.kind === 'sometime'`)
- "This week" reminders (future, not today)
- "Later" reminders
- "Today" reminders when `notifIncludeTodayInBadge` is false

### 1.4 Overdue determination

`isOverdue()` at `reminder-utils.ts:127-147`:
- Date-only reminders: overdue when `schedule.date` is strictly before today (today is NOT overdue)
- Date+time reminders: overdue when the combined datetime is strictly before `now`
- "Sometime" reminders: never overdue

### 1.5 Category determination

`categoriseReminder()` at `reminder-utils.ts:150-173`:
- `'sometime'` - schedule.kind is "sometime"
- `'today'` - schedule date equals today (midnight comparison)
- `'this-week'` - within current Monday-Sunday boundary (UK week)
- `'later'` - everything else (past dates that aren't today also fall here, but those would be overdue)

### 1.6 When badge calculations are triggered

The badge effect depends on four values: `[reminders, notifAppBadge, notifIncludeTodayInBadge, timeRefreshTick]`

Badge recalculation fires when:
1. `reminders` array changes (any create, complete, delete, edit, uncomplete, undelete operation)
2. `notifAppBadge` setting toggles (user enables/disables badge in settings)
3. `notifIncludeTodayInBadge` setting toggles
4. `timeRefreshTick` increments (which happens on visibility change - see section 3)

### 1.7 What does NOT trigger badge recalculation

- Passage of time while the app is open (no polling, no interval, no midnight timer)
- Device timezone changes (no timezone change listener)
- Day boundary crossing while app is in foreground (no midnight detection)
- Day boundary crossing while app is in background (no background task)
- App cold start does not explicitly trigger badge calculation beyond the initial render (the initial render does compute `now = new Date()` at line 3322, which feeds into the badge effect via the initial `reminders` state)

---

## 2. Reminder refresh architecture

### 2.1 How "Today" and "Overdue" sections refresh

There are no dedicated "Today" or "Overdue" sections with independent state. Category assignment and overdue detection are computed inline during every render.

The render pipeline at `App.tsx:3322-4533`:

1. `const now = new Date()` is computed at line 3322 in the render body (not memoized, not in state)
2. `displayReminders` is computed at line 4387: optionally filters out overdue reminders if `hideOverdue` is true
3. For the active list view (line 4521-4533):
   - `activeReminders` filters to non-completed, non-deleted reminders (plus pending-delete items)
   - `filtered` applies the active category filter, calling `isOverdue(r, now)` and `categoriseReminder(r, now)` per item
   - `sortedFiltered` calls `sortReminders(filtered, now)` which re-categorises and sorts

Every render re-evaluates `now`, so categories are fresh whenever React re-renders the component.

### 2.2 All mechanisms that cause reminder list refreshes

The reminder list re-renders whenever any React state that the render body depends on changes. The key triggers are:

1. `reminders` state changes - any mutation to the reminders array (the primary trigger for most updates)
2. `timeRefreshTick` state changes - incremented when app returns from background (via visibilitychange)
3. `activeFilter` state changes - user switches between all/today/this-week/later/sometime filters
4. `viewMode` state changes - switching between active list and done/deleted view
5. `pendingDoneIds`, `pendingDeleteIds`, `pendingUncompleteIds`, `pendingUndeleteIds` - transient visual state during 350ms animation windows
6. `hideOverdue` state changes - dev tools toggle
7. `insertHighlightId`, `reinsertedId` - visual state for newly inserted reminders

### 2.3 Refresh mechanism types

- Event-driven: reminder state mutations (create, complete, delete, edit) → React state updates → re-render
- Lifecycle-based: `visibilitychange` listener increments `timeRefreshTick` → re-render
- Manual: none (no pull-to-refresh or explicit refresh button)
- Polling: none (no intervals or timers for periodic refresh)
- State-based: category computation is derived inline from `now` and `reminders` during each render

### 2.4 Files and components involved in refresh

| File | Role |
|------|------|
| `src/app/App.tsx` | All state management, render pipeline, all handlers |
| `src/app/reminder-utils.ts` | `isOverdue()`, `categoriseReminder()`, `sortReminders()`, `loadReminders()` |
| `src/app/notifications.ts` | `syncReminderNotifications()` - syncs local notifications when reminders change |
| `src/app/useNotificationTapHandler.ts` | Handles notification tap → opens reminder info or triggers mark-done/move-tomorrow |
| `src/main.tsx` | Registers notification action listener, dispatches `NOTIFICATION_TAP_EVENT` |

---

## 3. App lifecycle handling

### 3.1 App launches from cold start

1. `src/main.tsx` executes:
   - `registerNotificationActionTypes()` registers "mark-done" and "move-tomorrow" notification actions (line 12)
   - `LocalNotifications.addListener('localNotificationActionPerformed', ...)` registers the notification tap listener (lines 14-25)
   - React app mounts `<App />`

2. `App()` component initialises:
   - `reminders` state loaded from `localStorage` via `loadReminders()` (line 575)
   - `timeRefreshTick` initialised to 0 (line 576)
   - All feature flags loaded from `localStorage` during `useState` initialisers
   - `now = new Date()` computed at line 3322 during first render
   - Initial render triggers all `useEffect` hooks including:
     - Badge calculation effect (line 1533)
     - Notification sync effect (line 1344)
     - Persistence effects
     - Visibility change listener registration (line 1481)

3. `useNotificationTapHandler` (line 3107-3110):
   - On mount, immediately checks for `PENDING_NOTIFICATION_REMINDER_ID_KEY` in localStorage
   - If a notification was tapped to launch the app, processes it

There is no explicit "cold start refresh" beyond the initial state load from localStorage and the effects that run from the initial render.

### 3.2 App returns from background

Single mechanism: `visibilitychange` event listener at `App.tsx:1481-1491`:

```
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setTimeRefreshTick((tick) => tick + 1);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

When the app becomes visible:
- `timeRefreshTick` increments
- This triggers the badge effect (dependency: `timeRefreshTick`)
- The component re-renders, computing a fresh `now = new Date()`
- All category assignments and overdue checks use the new `now`

There is no `@capacitor/app` listener. The recent commit `01c874d` explicitly replaced a missing `@capacitor/app` listener with this `visibilitychange` approach. No import of `@capacitor/app` exists anywhere in the source.

### 3.3 App becomes active

Same as "returns from background" - the `visibilitychange` event fires when `document.visibilityState` transitions to `'visible'`. There is no separate "active" vs "foreground" distinction in the web layer.

### 3.4 Day changes while app is open

There is no mechanism to detect or respond to day changes while the app remains in the foreground.

- No midnight timer or interval
- No `setInterval` polling for date changes
- No `Date` comparison against a stored "last checked date"
- The `now` value used in the render body (`App.tsx:3322`) is recomputed on each render, but renders only occur when state changes
- If no user interaction occurs and no state changes, the `now` value becomes stale

Consequence: if the app is open across midnight with no user interaction, reminders do not reclassify. A "Tomorrow" reminder does not become "Today". An overdue-by-time reminder that crosses midnight does not become overdue-by-date. Badge count does not update.

### 3.5 Day changes while app is closed/backgrounded

There is no background task, background fetch, or background processing.

When the user reopens the app:
- `visibilitychange` fires
- `timeRefreshTick` increments
- Component re-renders with fresh `now`
- Categories and badge recompute correctly

However, the badge displayed on the home screen icon while the app is closed is whatever was last set via `Badge.set()`. It does not update while the app is backgrounded. If a reminder becomes overdue overnight, the badge count on the home screen will be stale until the user opens the app.

### 3.6 Device time changes

No listener for device time changes. No `timechange` event handling. If the user changes their device time, the app will use the new time on the next render, but nothing forces a render to occur.

### 3.7 Timezone changes

No timezone change detection. All date operations use `new Date()` which uses the device's current local timezone. The schedule utility at `src/app/utils/schedule.ts:18-19` explicitly states: "All operations assume user's local timezone at runtime. No UTC-midnight semantics. No timezone identifiers."

If the timezone changes (e.g., travel), the next render will use the new timezone, but nothing forces a render.

### 3.8 Complete inventory of lifecycle listeners, hooks, and subscriptions

| Type | Location | Description |
|------|----------|-------------|
| `visibilitychange` listener | `App.tsx:1481-1491` | Increments `timeRefreshTick` when app becomes visible |
| `localNotificationActionPerformed` listener | `main.tsx:14-25` | Stores tapped reminder ID in localStorage, dispatches custom event |
| `NOTIFICATION_TAP_EVENT` listener | `useNotificationTapHandler.ts:76` | Processes notification tap to open reminder info or trigger action |
| `reminderly:siri-add` listener | `App.tsx:1889` | Processes Siri shortcut reminder additions |
| `resize` listener | `App.tsx:2032-2040` | Tracks viewport height changes |
| Native URL scheme handler | `AppDelegate.swift:21-40` | Processes `reminderly://add?text=` URLs from Siri shortcuts |

Timers (all one-shot, not recurring):
- Completion timers: `completionTimersRef` - 350ms delay for done commit
- Uncomplete timers: `uncompleteTimersRef` - 350ms delay for undone visual feedback
- Delete timers: `pendingDeleteTimersRef` - 350ms delay for delete commit
- Undelete timers: `undeleteTimersRef` - 350ms delay for undelete visual feedback
- Reschedule timers: `rescheduleTimersRef` - 1000ms delay for spawning next repeat occurrence
- Insert highlight timer: `insertHighlightTimerRef` - 1000ms highlight duration
- New reminder insert timer: `newReminderInsertTimerRef` - 500ms delay before inserting new reminder
- Open list editor timer: `openListEditorTimerRef`
- Clear list timer: `clearListTimerRef` - 500ms
- Empty placeholder delay timer: setTimeout at lines 2669 and 3010

No `setInterval` is used for any refresh purpose. The only `setInterval` calls in the codebase are in tutorial/onboarding animation components (`src/imports/tutorial-onboarding-content.tsx:2263` and `src/app/components/OnboardingPage7Content.tsx:49`).

No background tasks, no background fetch, no background notification content extensions, no `BGTaskScheduler` usage.

---

## 4. State ownership and data flow

### 4.1 State ownership

All reminder state is owned by a single `useState` hook in the `App` component:

```
const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders());
```
(`App.tsx:575`)

There is no external state management library (no Redux, no Zustand, no MobX, no Context provider for reminders). The `App` component is the single source of truth.

### 4.2 Storage mechanism

- Storage: browser `localStorage`
- Key: `"reminderly.reminders.v1"` (defined in `reminder-utils.ts:37`)
- Format: `JSON.stringify()` of the entire `Reminder[]` array
- Persistence effect: `App.tsx:1336-1342` watches `reminders` and calls `persistStringIfChanged(STORAGE_KEY, JSON.stringify(reminders))`
- `persistStringIfChanged` (line 443-446): only writes if the stringified value differs from current localStorage value

### 4.3 Reminder creation flow

```
User types text in NewReminderOverlay
  → NLC parsing (if enabled): nlc-parser.ts:parseTokens() + nlc-interaction.ts
  → User submits
  → NewReminderOverlay builds Reminder object
  → Calls addReminder(reminder) callback
  → App.tsx:1783-1800: addReminder()
    → 500ms delay (NEW_REMINDER_INSERT_DELAY)
    → setReminders([...prev, reminder])
    → setReinsertedId / setInsertHighlightId (animation state)
    → React re-renders
      → Persistence effect fires → localStorage.setItem()
      → Notification sync effect fires → syncReminderNotifications()
      → Badge effect fires → Badge.set()
      → Render body computes fresh now, categories, sort
```

### 4.4 Reminder completion flow

```
User clicks circle on reminder row (or notification action "mark-done")
  → handleCompleteClick(reminderId) at App.tsx:2647
  → Immediate: setPendingDoneIds adds reminderId (visual strikethrough)
  → 350ms timer (COMPLETION_DELAY):
    → setReminders: sets completedAt = Date.now()
    → setPendingDoneIds: removes reminderId
    → React re-renders
      → Persistence effect fires
      → Notification sync effect fires
      → Badge effect fires
    → If repeatRule exists:
      → 1000ms timer (RESCHEDULE_DELAY):
        → Computes getNextOccurrence() from completed occurrence's date/time
        → Creates new Reminder with new UUID, same text, next date
        → setReminders: appends new reminder
        → setReinsertedId / setInsertHighlightId
        → React re-renders (triggers all effects again)
```

### 4.5 Reminder deletion flow

```
User triggers delete (from info overlay or long-press)
  → handleDeleteClick(reminderId) at App.tsx:2999
  → cancelAllTimersForId(reminderId) - cancels any pending completion/reschedule
  → clearPendingStateForId(reminderId) - clears visual pending sets
  → Immediate: setPendingDeleteIds adds reminderId (visual fade)
  → setInfoReminder(null) - closes info overlay
  → 350ms timer (COMPLETION_DELAY):
    → setReminders: sets deletedAt = Date.now()
    → setPendingDeleteIds: removes reminderId
    → If smart reminder: sets linked list smartReminders = false
    → React re-renders
      → Persistence effect fires
      → Notification sync effect fires
      → Badge effect fires
```

### 4.6 Reminder editing flow

```
User opens reminder info overlay → taps edit
  → Opens NewReminderOverlay in edit mode
  → User modifies fields, submits
  → Calls updateReminder(updated) at App.tsx:1920
  → If smart reminder:
    → Updates linked list state (smartReminderDueDate, smartReminderTime)
    → Returns (does NOT update reminders array directly for smart reminders)
  → Else:
    → setReminders: replaces matching reminder by ID
    → React re-renders
      → Persistence effect fires
      → Notification sync effect fires
      → Badge effect fires
```

### 4.7 Natural language reminder creation flow

```
User types text with NLC-parseable content
  → parseTokens(text) at nlc-parser.ts:81+
    → Extracts date, time, repeat tokens via regex
  → computeAutoApplyResult() or user clicks tokens
  → computeTokenClickResult() resolves token to date/time/repeat values
  → Overlay populates schedule fields from NLC results
  → User submits → same creation flow as 4.3 above
```

### 4.8 Siri shortcut creation flow

```
User invokes Siri shortcut "Add to Reminderly app"
  → iOS AddReminderIntent executes
  → Opens reminderly://add?text=<text> URL
  → AppDelegate.swift:21-40 handles URL
    → Evaluates JavaScript in WebView:
      → Sets localStorage 'reminderly.pendingSiriText'
      → Dispatches 'reminderly:siri-add' window event
  → App.tsx:1807 handleSiriAdd():
    → Reads text from localStorage
    → Runs NLC parsing (with all recognition disabled: date=false, time=false, repeats=false)
    → Attempts fallback absolute date parsing (month-name dates)
    → Builds reminder object
    → Calls addReminder(reminder) → same flow as 4.3
```

### 4.9 Move to tomorrow flow

```
handleMoveReminderToTomorrow(reminderId) at App.tsx:3057
  → Computes tomorrow's date
  → setReminders: updates schedule.date to tomorrow
  → If smart reminder: updates linked list smartReminderDueDate
  → React re-renders → all effects fire
```

### 4.10 Notification tap action flow

```
User taps notification or long-presses for action
  → iOS delivers event to Capacitor LocalNotifications plugin
  → main.tsx:14-25 listener fires:
    → Stores reminderId in localStorage
    → Stores actionId in localStorage (if not 'tap')
    → Dispatches NOTIFICATION_TAP_EVENT
  → useNotificationTapHandler.ts:37-73:
    → Reads reminderId and actionId from localStorage
    → Removes from localStorage
    → Finds reminder in current reminders array
    → If actionId === "mark-done": calls onMarkAsDone (→ handleCompleteClick)
    → If actionId === "move-tomorrow": calls onMoveToTomorrow (→ handleMoveReminderToTomorrow)
    → If tap (no action): closes all overlays, 300ms delay → opens ReminderInfoOverlay
```

---

## 5. Native integration analysis

### 5.1 Notification scheduling interaction with reminder state

Notification scheduling is triggered reactively by a `useEffect` at `App.tsx:1344-1346`:

```
useEffect(() => {
  void syncReminderNotifications(reminders);
}, [reminders]);
```

`syncReminderNotifications()` at `notifications.ts:97-129`:
1. Requests notification permissions
2. Builds desired notifications from current reminders (`buildScheduledNotifications`)
3. Fetches currently pending notifications from iOS
4. Compares sorted signatures (JSON stringified objects including id, title, body, at, reminderId, actionTypeId)
5. If identical: no-op (early return)
6. If different: cancels ALL pending notifications, then schedules ALL desired notifications

`buildScheduledNotifications()` at `notifications.ts:62-95` filters reminders to:
- Not completed
- Not deleted
- Kind === 'scheduled'
- Has time component
- Scheduled time is in the future (`at.getTime() > Date.now()`)

Notifications are not scheduled for date-only reminders (no time) or "sometime" reminders.

The notification ID is a hash of the reminder ID string (line 81-84), not the reminder ID itself.

### 5.2 Badge update handling - JS vs native

Badge updates are handled entirely JS-side:
- The `@capawesome/capacitor-badge` plugin is called from JS
- `Badge.set({ count })` and `Badge.clear()` are the only Badge API calls
- No native-side badge logic exists in `AppDelegate.swift`
- No notification content extension sets badges
- The badge is not set as part of notification payloads

### 5.3 Native code inventory

`ios/App/App/AppDelegate.swift` (42 lines):
- `application(_:didFinishLaunchingWithOptions:)` - returns true, no custom logic
- `application(_:open:options:)` - delegates to Capacitor's `ApplicationDelegateProxy`
- `application(_:continue:restorationHandler:)` - delegates to Capacitor's `ApplicationDelegateProxy`
- `scene(_:openURLContexts:)` - handles `reminderly://add` URL scheme for Siri shortcuts

`ios/App/App/AddReminderIntent.swift` - Siri intent definition
`ios/App/App/AppShortcuts.swift` - App Shortcuts definition for Siri

There are no:
- Native background fetch implementations
- `BGTaskScheduler` registrations
- Native notification handlers beyond Capacitor's built-in bridge
- Native badge management
- Native app state observers
- `applicationDidBecomeActive`, `applicationWillResignActive`, or `applicationDidEnterBackground` overrides
- `UNUserNotificationCenterDelegate` implementations

### 5.4 Capacitor plugins in use

| Plugin | Version | Purpose |
|--------|---------|---------|
| `@capacitor/core` | ^8.3.0 | Capacitor runtime |
| `@capacitor/ios` | ^8.3.0 | iOS platform |
| `@capacitor/local-notifications` | ^8.0.2 | Schedule/cancel local notifications, listen for notification actions |
| `@capawesome/capacitor-badge` | ^8.0.2 | Set/clear app icon badge number |

`@capacitor/app` is NOT installed as a dependency. The import was removed and replaced with `visibilitychange` per commit `01c874d`.

---

## 6. Known refresh entry points

| Trigger source | What refreshes | What does NOT refresh | Relevant files/functions |
|---|---|---|---|
| Reminder creation (addReminder) | Reminders state, localStorage, notifications, badge, UI render | Nothing missing within scope | App.tsx:1783-1800 |
| Reminder completion (handleCompleteClick) | Reminders state, localStorage, notifications, badge, UI render; spawns repeat if applicable | Nothing missing within scope | App.tsx:2647-2787 |
| Reminder deletion (handleDeleteClick) | Reminders state, localStorage, notifications, badge, UI render | Nothing missing within scope | App.tsx:2999-3055 |
| Reminder editing (updateReminder) | Reminders state (or list state for smart reminders), localStorage, notifications, badge, UI render | Smart reminder path updates list state but does NOT update reminder in reminders array | App.tsx:1920-1945 |
| Reminder uncomplete (handleUncompleteClick) | Reminders state, localStorage, notifications, badge, UI render | Nothing missing within scope | App.tsx:2791-2997 |
| Move to tomorrow | Reminders state, localStorage, notifications, badge, UI render | Nothing missing within scope | App.tsx:3057-3098 |
| App returns from background (visibilitychange) | `timeRefreshTick` increments → badge recalculates, component re-renders with fresh `now` | Does NOT reload reminders from localStorage; uses existing in-memory state | App.tsx:1481-1491 |
| Notification tap (tap action) | Opens ReminderInfoOverlay for tapped reminder | Does not refresh reminder state or badge | useNotificationTapHandler.ts:37-73 |
| Notification action: mark-done | Triggers handleCompleteClick → full refresh chain | Nothing missing within scope | useNotificationTapHandler.ts:48-51 |
| Notification action: move-tomorrow | Triggers handleMoveReminderToTomorrow → full refresh chain | Nothing missing within scope | useNotificationTapHandler.ts:53-56 |
| Siri shortcut add | Creates reminder via addReminder → full refresh chain | Nothing missing within scope | App.tsx:1803-1891 |
| Filter change (activeFilter) | UI re-render with new filter applied | Does not recalculate badge or sync notifications | State setter in UI |
| View mode change (viewMode) | UI re-render | Does not recalculate badge or sync notifications | State setter in UI |
| Settings toggle (notifAppBadge) | Badge recalculates | Does not trigger notification sync or reminder refresh | App.tsx:1533 dependency |
| Settings toggle (notifIncludeTodayInBadge) | Badge recalculates | Does not trigger notification sync or reminder refresh | App.tsx:1533 dependency |
| Day changes while app is open | NOTHING refreshes | Categories, overdue status, badge count all remain stale | No mechanism exists |
| Day changes while app is backgrounded | NOTHING refreshes until app is foregrounded | Home screen badge count is stale | No background mechanism exists |
| Device time change | NOTHING refreshes until next state-triggered render | No time change listener | No mechanism exists |
| Timezone change | NOTHING refreshes until next state-triggered render | No timezone change listener | No mechanism exists |
| Smart list sync (list-sync source) | Can trigger handleCompleteClick or handleDeleteClick on linked smart reminders | N/A | App.tsx:2458, createdLists effects at 1577+ |

---

## Current architecture summary

The app is a single-component React application (`App.tsx`) running in a Capacitor WebView. All reminder state lives in a single `useState` hook, persisted to `localStorage` via a reactive `useEffect`. There is no external state management, no server sync, no database - localStorage is the sole persistence layer.

Category assignment ("today", "overdue", "this-week", "later", "sometime") is not persisted. It is computed inline during each render by comparing each reminder's schedule against `new Date()`, which is called once per render at the top of the render body.

Badge counts are computed by a `useEffect` that depends on `[reminders, notifAppBadge, notifIncludeTodayInBadge, timeRefreshTick]`. The badge counts overdue reminders, plus optionally today's reminders. Badge updates are entirely JS-side via the `@capawesome/capacitor-badge` plugin.

The only lifecycle-triggered refresh mechanism is a `visibilitychange` event listener that increments `timeRefreshTick` when the document becomes visible. This causes the badge effect to re-run and the component to re-render with a fresh `now`. There is no `@capacitor/app` plugin installed.

There is no polling, no interval-based refresh, no midnight timer, no day-change detection, no timezone-change detection, and no background processing. The badge on the home screen icon can only be updated when the app is in the foreground and either a user action triggers a state change or the `visibilitychange` event fires.

Notification scheduling is reactive: a `useEffect` watching `reminders` calls `syncReminderNotifications()` on every change, which diffs pending vs desired notifications and re-schedules if they differ. Notifications are only scheduled for future reminders with both a date and time. The notification payloads do not set badge numbers.

All state mutation handlers follow a consistent two-phase pattern: immediate visual feedback via transient pending-ID sets, followed by a 350ms delayed data commit to the reminders array. Repeat reminders add a third phase: a 1000ms delayed spawn of the next occurrence.
