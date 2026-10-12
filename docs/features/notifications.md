# Notifications and badge

Protected area (see `Claude.md`). Local notifications for timed reminders, the app icon badge and the notification actions. Native details are in [../ios.md](../ios.md).

## Status

Implemented:

- Local notifications for future, timed reminders, with badge payloads and a silent midnight badge notification.
- In-app badge, refreshed on change, on resume and at time boundaries.
- Notification actions Mark as done and Move to tomorrow, with native badge correction.
- Tap to open the reminder.
- Reminders module off: all Reminderly notifications cleared, badge cleared.
- Badge preferences `reminderly-pref-notif-badge` and `reminderly-pref-notif-include-today` are read.

Not yet implemented (Phase 4 in [../settings-flags-spec.md](../settings-flags-spec.md)):

- The notifications flag `reminderly-ff-notifications` and alerts preference `reminderly-pref-notif-alerts` are stored but do not gate scheduling.
- There is no in-app permission ask. `syncReminderNotifications` calls `requestPermissions()` on every sync, so a new install sees the iOS prompt on the first sync.
- Notifications are not resynced on resume (only the badge is recomputed).

## Files

- `src/app/notifications.ts` - payloads, badge values, sync, clear, action types
- `src/main.tsx` - native listener and hand-off
- `src/app/useNotificationTapHandler.ts` - taps and actions in the app
- `src/app/reminder-utils.ts` - `computeBadgeCount`, `getNextTimeRefreshBoundary`
- `patches/@capacitor+local-notifications+8.0.2.patch` - native badge support

## Which reminders become notifications

`buildScheduledNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge)` includes reminders that are not completed, not deleted, `scheduled`, have a time, and fire in the future. Sometime reminders, date-only reminders and past reminders get no notification. Smart reminders are reminders, so a timed smart reminder is notified like any other.

There is no separate notification store; everything is derived from the reminders array.

## Payload

| Field | Value |
|-------|-------|
| `id` | Deterministic number hashed from the reminder id |
| `title` | `Reminderly` |
| `body` | `reminder.displayText` |
| `schedule.at` | Local date and time as a `Date` |
| `extra.reminderId` | Reminder id |
| `extra.badgeDeltaOnAction` | `1` when `badge > 0`, otherwise `0` |
| `actionTypeId` | `reminder-actions` |
| `badge` | `computeBadgeCount` evaluated 1ms after fire time, or `0` when the badge preference is off |

## Badge count

`computeBadgeCount(reminders, includeToday, now)` counts active scheduled reminders that are overdue, plus those categorised as today when "include today" is on. Sometime, done and deleted reminders never count.

In the app, an effect sets the badge with `Badge.set` whenever reminders, badge preferences or the refresh tick change, and clears it when the badge preference or Reminders module is off.

The refresh tick advances:

- at the next boundary from `getNextTimeRefreshBoundary` (midnight, or the next timed reminder today becoming overdue), polled at most every 30s;
- on resume (`visibilitychange` and `appStateChange`), deduplicated within 500ms.

## Silent midnight badge notification

Handles the day boundary while the app is closed (for example a date-only reminder becoming overdue).

- Scheduled only when the badge preference is on and at least one active date-only scheduled reminder exists.
- Empty title and body, `silent: true`, fixed id `2147483647`, badge computed for just after midnight.

## Scheduling limit

iOS allows 64 pending notifications per app. Timed reminders are sorted by fire time and the first 64 are scheduled, or 63 when the midnight notification is needed. Later reminders get no notification until a later sync.

## Sync

An effect in `App.tsx` runs on changes to `reminders`, the badge preferences or the Reminders module flag:

- Reminders on: `syncReminderNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge)`.
- Reminders off: `clearReminderNotifications()`, and again every time the app returns to the foreground while off.

`syncReminderNotifications` requests permission (returns if not granted), builds the desired set, and compares sorted signatures (id, title, body, ISO time, reminder id, badge delta, action type, badge) with the pending set. If they match nothing happens; otherwise all pending notifications are cancelled and the desired set is scheduled.

`clearReminderNotifications` cancels all pending and removes all delivered Reminderly notifications. It needs no permission.

## Actions

Registered as category `reminder-actions`:

- `mark-done` ("Mark as done") - runs the normal completion flow, including the next occurrence for repeating reminders.
- `move-tomorrow` ("Move to tomorrow") - moves a scheduled reminder to tomorrow, keeping its time. For a smart reminder, the linked list's due date moves too.

Actions taken from the lock screen without opening the app:

- The patched native handler reduces the icon badge by `badgeDeltaOnAction` and reschedules every pending notification with its badge reduced by the same amount.
- The reminder itself changes when the app next opens, through the pending action hand-off below.

## Tap and action hand-off

1. `main.tsx` receives `localNotificationActionPerformed`, stores `reminderly.pendingNotificationReminderId` and, for a button action, `reminderly.pendingNotificationAction`, then dispatches `reminderly:notification-tap`.
2. `useNotificationTapHandler` runs on mount and on that event. It removes both keys, then:
   - does nothing if the Reminders module is off or the reminder no longer exists;
   - for `mark-done` or `move-tomorrow`, runs the action;
   - for a plain tap, closes the tutorial and overlays, switches to the Reminders tab, list view and All filter, and after 300ms opens the reminder's info overlay.

## Closed-app behaviour and limits

- The icon badge updates when a notification fires, when a notification action is taken, and at midnight (when date-only reminders exist). Full reconciliation happens when the app next opens.
- The badge is not updated continuously; only at those moments.
- The midnight notification covers one day boundary. A longer gap is corrected when the app is opened.
- Beyond 64 pending notifications, later reminders are not notified until a later sync.

## Keys and events

- `localStorage`: `reminderly.pendingNotificationReminderId`, `reminderly.pendingNotificationAction`
- `UserDefaults`: `reminderly.nativeBadgeCount`
- `window` event: `reminderly:notification-tap`
- Preferences: `reminderly-pref-notif-badge`, `reminderly-pref-notif-include-today`, `reminderly-pref-notif-alerts` (not yet used), flag `reminderly-ff-notifications` (not yet used)
