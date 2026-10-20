# Notifications and badge

Protected area (see `Claude.md`). Local notifications for timed reminders, the app icon badge and the notification actions. Native details are in [../ios.md](../ios.md).

## Status

Implemented:

- Local notifications for future, timed reminders, with badge payloads, and silent badge notifications at the next 7 midnights.
- In-app badge, refreshed on change, on resume and at time boundaries.
- Notification actions Mark as done and Move to tomorrow, with native badge correction.
- Tap to open the reminder.
- Reminders module off, or Notifications flag off: all Reminderly notifications cleared, badge cleared.
- Phase 4 ([../plans/notifications-phase-4.md](../plans/notifications-phase-4.md)):
  - User settings in Reminders settings > Notifications: Notifications (alerts), Sound, App badge, Include today in badge ([settings.md](./settings.md)).
  - Alerts and badge independent, including silent badge-only notifications.
  - Sound on or off, using the iOS default sound (sound name `default`). Off by default for all users.
  - In-app permission ask instead of an automatic iOS prompt (see Permission below).
  - Permission re-checked and notifications resynced when the app returns to the foreground.

## Files

- `src/app/notifications.ts` - payloads, badge values, sync, clear, action types
- `src/app/notification-ask.ts` - in-app ask rules and stored ask state
- `src/app/components/NotificationAskDialog.tsx` - the in-app ask
- `src/main.tsx` - native listener and hand-off
- `src/app/useNotificationTapHandler.ts` - taps and actions in the app
- `src/app/reminder-utils.ts` - `computeBadgeCount`, `getNextTimeRefreshBoundary`
- `patches/@capacitor+local-notifications+8.0.2.patch` - native badge support

## Which reminders become notifications

`buildScheduledNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge, notifAlerts, notifSound)` includes reminders that are not completed, not deleted, `scheduled`, have a time, and fire in the future. Sometime reminders, date-only reminders and past reminders get no notification. Smart reminders are reminders, so a timed smart reminder is notified like any other.

There is no separate notification store; everything is derived from the reminders array.

## Payload

| Field | Value |
|-------|-------|
| `id` | Deterministic number hashed from the reminder id, always below `MIDNIGHT_BADGE_FIRST_ID` (2147483641) |
| `title` | `Reminderly` |
| `body` | `reminder.displayText` |
| `schedule.at` | Local date and time as a `Date` |
| `extra.reminderId` | Reminder id |
| `extra.badgeDeltaOnAction` | `1` when `badge > 0`, otherwise `0` |
| `actionTypeId` | `reminder-actions` |
| `badge` | `computeBadgeCount` evaluated 1ms after fire time, or `0` when the badge preference is off |
| `sound` | `default` (the iOS default sound) when the sound preference is on; omitted otherwise, so the alert is silent |

| Alerts | Badge | Scheduled |
|---|---|---|
| On | On | Alerts carrying badge numbers, plus the midnight badge notifications |
| On | Off | Alerts with no badge number |
| Off | On | Silent badge-only notifications at the same times (empty title and body, `silent: true`, no actions, no sound), plus the midnight ones |
| Off | Off | Nothing |

Badge-only notifications use the same selection and the same 64 limit as alerts.

## Badge count

`computeBadgeCount(reminders, includeToday, now)` counts active scheduled reminders that are overdue, plus those categorised as today when "include today" is on. Sometime, done and deleted reminders never count.

In the app, an effect sets the badge with `Badge.set` whenever reminders, badge preferences or the refresh tick change, and clears it when the badge preference, Notifications flag or Reminders module is off. The effect runs only once iOS permission is granted, because the badge plugin requests permission on every set and clear; without permission iOS shows no badge anyway.

The refresh tick advances:

- at the next boundary from `getNextTimeRefreshBoundary` (midnight, or the next timed reminder today becoming overdue), polled at most every 30s;
- on resume (`visibilitychange` and `appStateChange`), deduplicated within 500ms.

## Silent midnight badge notifications

Day changes while the app is closed (a date-only reminder becoming overdue, a reminder becoming due today with "include today" on). The same principle as the lock screen widget: future values are prepared in advance, so the app does not need to open.

- When the badge preference is on, one notification at each of the next 7 local midnights, with the badge computed for just after that midnight.
- All 7 are always scheduled, including those with a count of 0, so the behaviour is deterministic.
- Empty title and body, `silent: true`, no actions, no sound. Ids `2147483641` (next midnight) to `2147483647` (seventh); reminder ids are hashed below this range.
- Rebuilt on every sync, so the 7 days always run from the last time the app was opened.

## Scheduling limit

iOS allows 64 pending notifications per app. Reminder notifications (alerts or badge-only) take the slots first: sorted by fire time, the first 64 are scheduled. Midnight badge notifications only use the slots left, earliest midnight first, so they never displace a reminder notification. With 58 or more upcoming timed reminders some or all midnights are dropped; each reminder notification still carries the full count when it fires. Later reminders get no notification until a later sync.

## Badge and widget counts

With "include today" on, the badge counts the same reminders as the lock screen widget's outstanding count (not done, not deleted, scheduled, due today or overdue). With it off, the badge counts overdue reminders only. A Vitest and Self Check case asserts the match.

## Sync

An effect in `App.tsx` runs on changes to `reminders`, any notification preference, the Notifications or Reminders flag, iOS permission, and each return to the foreground:

- Reminders and Notifications on: `syncReminderNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge, notifAlerts, notifSound)`.
- Either off: `clearReminderNotifications()`, and again every time the app returns to the foreground while off.

`syncReminderNotifications` checks permission without prompting (returns if not granted, leaving pending notifications as they are), builds the desired set, and compares sorted signatures (id, title, body, ISO time, reminder id, badge delta, action type, badge, sound) with the pending set. If they match nothing happens; otherwise all pending notifications are cancelled and the desired set is scheduled. iOS does not return badge, action type or sound for pending notifications, so in practice each sync reschedules.

## Permission

The app never triggers the iOS prompt by itself. Permission is read from iOS on launch and on each return to the foreground.

- In-app ask ("Get reminder alerts?", Not now or Allow) at the end of the Reminders tutorial and when a reminder with a time is saved, only while iOS has not decided.
- Allow: alerts and badge preferences on (sound unchanged), then the iOS prompt. Not now: asked once more on the next timed reminder, then not again.
- Turning Notifications or App badge on in settings while iOS has not decided shows the in-app ask first; Allow turns on only that preference. Not now from settings changes nothing.
- Existing installs with permission already granted are marked accepted on launch and never asked.
- Denied: preferences are kept, and Reminders settings > Notifications shows "Turn on in Settings", which opens Reminderly's iOS Settings page.
- Ask state key `reminderly-notif-ask-state`: missing, `not-now-1`, `not-now-2` or `accepted`. Any other value suppresses automatic asks.

`clearReminderNotifications` cancels all pending and removes all delivered Reminderly notifications. It needs no permission.

## Actions

Registered as category `reminder-actions`:

- `mark-done` ("Mark as done") - runs the normal completion flow, including the next occurrence for repeating reminders.
- `move-tomorrow` ("Move to tomorrow") - moves a scheduled reminder to tomorrow, keeping its time. For a smart reminder, the linked list's due date moves too.

Actions taken from the lock screen without opening the app:

- The patched native handler reduces the icon badge by `badgeDeltaOnAction` and reschedules every pending notification (including the midnight ones) with its badge reduced by the same amount.
- The reminder itself changes when the app next opens, through the pending action hand-off below.

Known limitation: the native handler cannot see reminder data, so later badges stay 1 lower when the reminder counts again. Move to tomorrow: the moved reminder comes due again (from midnight with "include today" on, or when it becomes overdue) but is not counted. Mark as done on a repeating reminder: the next occurrence is not counted. Each further action from a notification adds the same gap. Opening the app recalculates the badge and resyncs every notification. Accepted by the CTO (2026-10-20); an exact cut-off passed from the app is deferred.

## Tap and action hand-off

1. `main.tsx` receives `localNotificationActionPerformed`, stores `reminderly.pendingNotificationReminderId` and, for a button action, `reminderly.pendingNotificationAction`, then dispatches `reminderly:notification-tap`.
2. `useNotificationTapHandler` runs on mount and on that event. It removes both keys, then:
   - does nothing if the Reminders module is off or the reminder no longer exists;
   - for `mark-done` or `move-tomorrow`, runs the action;
   - for a plain tap, closes the tutorial and overlays, switches to the Reminders tab, list view and All filter, and after 300ms opens the reminder's info overlay.

## Closed-app behaviour and limits

- The icon badge updates when a notification fires, when a notification action is taken, and at each of the next 7 midnights. Full reconciliation happens when the app next opens.
- The badge is not updated continuously; only at those moments.
- The midnight notifications cover 7 day boundaries from the last time the app was opened. A longer gap is corrected when the app is opened.
- Badge counts in pending notifications reflect the reminders at the last sync (see the known limitation under Actions).
- Beyond 64 pending notifications, later reminders are not notified until a later sync.

## Keys and events

- `localStorage`: `reminderly.pendingNotificationReminderId`, `reminderly.pendingNotificationAction`
- `window` event: `reminderly:notification-tap`
- Preferences: `reminderly-pref-notif-alerts`, `reminderly-pref-notif-sound`, `reminderly-pref-notif-badge`, `reminderly-pref-notif-include-today`; flag `reminderly-ff-notifications` (Dev tools > Reminders > Features)
- Ask state: `reminderly-notif-ask-state`
