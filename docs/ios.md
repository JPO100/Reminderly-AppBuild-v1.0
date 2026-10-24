# iOS

The native layer that hosts Reminderly. The native side is deliberately thin: it provides packaging, launch, plugins and a few iOS-only extensions. All product UI and business logic live in the web app. Build and deploy steps are in [development.md](./development.md).

## Project

| Item | Value |
|------|-------|
| Project | `ios/App/App.xcodeproj` (open this, not a workspace) |
| Dependency manager | Swift Package Manager via `ios/App/CapApp-SPM/Package.swift` (Capacitor-managed, do not edit) |
| App target | `App`, bundle id `com.reminderly.app`, iOS 15.0+, version 1.0 (1) |
| Widget target | `ReminderlyWidget`, bundle id `com.reminderly.app.widget`, iOS 16.0+ |
| Signing | Automatic, existing development team. Do not change without approval |
| App Group | `group.com.reminderly.app` (both targets' entitlements) |
| Orientation | Portrait only; multiple scenes disabled |
| URL scheme | `reminderly` |
| Capacitor config | `capacitor.config.json`: `appId com.reminderly.app`, `webDir dist`, logging off |
| Generated files (ignored) | `ios/App/App/capacitor.config.json`, `config.xml`, `public/assets/`. `public/index.html` is tracked (see [architecture.md](./architecture.md), Known constraints) |

Capacitor plugins registered: App, Haptics, LocalNotifications (patched), Badge (`@capawesome/capacitor-badge`), plus the local `WidgetBridge` plugin.

## Native files

| File | Role |
|------|------|
| `App/AppDelegate.swift` | App and scene delegate. Forwards URL and user activity events to Capacitor; handles `reminderly://add` |
| `App/MainViewController.swift` | `CAPBridgeViewController` subclass (set in `Main.storyboard`); registers `WidgetBridgePlugin` |
| `App/WidgetBridgePlugin.swift` | Writes widget data to the App Group and reloads widget timelines |
| `App/AddReminderIntent.swift` | Siri / Shortcuts App Intent |
| `App/AppShortcuts.swift` | App Shortcuts provider |
| `App/Info.plist`, `App/App.entitlements` | Configuration, URL scheme, App Group |
| `ReminderlyWidget/ReminderlyWidget.swift` | Lock screen widget |

## Siri and the URL scheme

Implemented for reminders. Siri for lists is not built.

1. `AppShortcuts.swift` exposes one phrase, "Add to Reminderly app" (`AddReminderIntent`, iOS 16+). Reminders settings > Siri shortcuts shows it. Phrases containing "remind" or "reminder" make Siri ask whether to use Reminderly or Notes, so they are not used.
2. The intent runs in the background on every iOS version, also with the iPhone locked, and never opens Reminderly ([plans/siri-locked-device.md](./plans/siri-locked-device.md)). `openAppWhenRun` false, `authenticationPolicy` `.alwaysAllowed`, `supportedModes` `[.background]` on iOS 26+.
3. Siri off: only a stored `siriRemindersActive` `true` is accepted (fails closed); otherwise Siri says "Siri is turned off in Reminderly, so I can't add a reminder right now." The app writes it on launch, on every change and on return to the foreground (`WidgetBridge.setSiriActive`).
4. Siri asks "What would you like to be reminded about?". The answer is parsed by `buildSiriReminder` (`utils/siri.ts`: NLC auto-apply with all categories recognised, including the spoken and relative forms in [features/scheduling-and-nlc.md](./features/scheduling-and-nlc.md); numeric dates as in the app; month-name fallback; a time with no date is today, even once passed, as in the app; past month-name dates move to next year; a date or repeat with no time is at 12pm, as in the app, even when 12pm has passed today; no date or time means Sometime; repeats only when active). An explicit time off the quarter hour ("4:10pm", "16:10") is refused: nothing is saved and Siri says "Reminderly currently supports reminders in 15-minute increments. Try 4:00 or 4:15." (`findUnsupportedClockTime`, `SiriUnsupportedTimeError`). The title is the task only, from the shared `titleFromAppliedTokens` (see [features/scheduling-and-nlc.md](./features/scheduling-and-nlc.md), Titles and rendering); repeat words are removed only when a repeat is saved. Because date-only reminders now have 12pm, the intent schedules their notification at 12pm when that is in the future. It runs in JavaScriptCore from `ios/App/App/siri-core.js` (built by `npm run build:siri-core`; a test fails if the bundled copy is out of date).
5. The intent adds an id and `createdAt`, appends the reminder to the App Group pending list (`siriPendingReminders`) and reads it back.
6. If notification permission is granted and alerts or badge are on (from `siriContext`, published by the app), it schedules the reminder's notification exactly as the Capacitor plugin would and adjusts the badges per `src/app/utils/siri-badge.ts`, ported to Swift: +1 on pending notifications firing once the reminder counts, the 64 limit, and the icon badge now. It also updates the lock screen widget snapshot for today.
7. Siri says "Okay, that's added". Any failure: "I couldn't confirm your reminder was added. Please check Reminderly." A run that starts while another is in progress (Siri retrying) shares that run's result.
8. When Reminderly next launches or returns to the foreground, it imports pending reminders by id, saves them, and removes them from the list (`utils/siri-pending.ts`). Its normal notification sync then finds the Siri notification identical.

`reminderly://add?text=...` from any app or link still creates a reminder through `AppDelegate.scene(_:openURLContexts:)` and the `reminderly:siri-add` handler in `App.tsx` (gated on Siri for reminders being active).

## Local notifications

Scheduling, badge logic and the tap flow are described in [features/notifications.md](./features/notifications.md). Native specifics:

- `src/main.tsx` registers the `localNotificationActionPerformed` listener at startup.
- Action types `mark-done` ("Mark as done") and `move-tomorrow` ("Move to tomorrow") are registered as category `reminder-actions`.

### patch-package: badge support

`@capacitor/local-notifications` 8.0.2 does not pass a notification's `badge` to iOS. `patches/@capacitor+local-notifications+8.0.2.patch` changes two files in the plugin:

- `LocalNotificationsPlugin.swift`, `makeNotificationContent`: sets `content.badge` from the JS payload, so the icon badge updates when a notification fires, even with the app closed.
- `LocalNotificationsHandler.swift`:
  - `didReceive`: for `mark-done` or `move-tomorrow`, reads `badgeDeltaOnAction` from the notification's `cap_extra`. If above 0, `correctBadgeAfterAction` decrements the icon badge (not below 0), and `reschedulePendingBadges` re-adds every pending notification with its badge reduced by the same delta (under `beginBackgroundTask`).

Badge plugin (`@capawesome/capacitor-badge`): `persist` is off in `capacitor.config.json`, so the plugin no longer restores the last value the app set when it loads (including background launches), which could overwrite a badge delivered by a notification.

The badge correction affects counts only. The reminder change itself (done, moved, next repeat) happens in the web app when it next opens.

`postinstall` runs `patch-package`, so the patch applies on every `npm install`. When upgrading the plugin, regenerate or verify the patch against the new version.

## Lock screen widget

A WidgetKit extension with one circular lock screen widget ("Today", `accessoryCircular`).

- The web app computes `getTodayProgress` (`reminder-utils.ts`) when reminders change, on resume and at time boundaries, and sends it through `WidgetBridge.setSnapshot` (`src/app/utils/widget.ts`, iOS only, deduplicated).
- The plugin stores `todayProgress` (`date`, `outstanding`, `done`, `dueTomorrow`) in the App Group and reloads timelines.
- Counts: outstanding = scheduled, not done, due today or overdue. Done = completed today for reminders due today or earlier. Sometime, future and deleted reminders are excluded.
- Display: `outstanding` in the centre, `done / (outstanding + done)` as an open arc (full when nothing is outstanding), with the Reminderly tick. The timeline adds a midnight entry: a snapshot from an earlier day shows `outstanding + dueTomorrow` with done reset.
- Tapping the widget opens the app. iOS decides when the widget redraws.
- Flag: Dev tools > System > Lock screen widget (`reminderly-ff-lock-screen-widget`, default on). Off: the app calls `clearSnapshot`, which removes the shared data, and the widget shows a neutral empty state (track arc and tick, no number). The same state shows before the app first runs. With the Reminders module off, the app sends a snapshot with zero counts.

## Native and web responsibilities

- Native: app container, scene lifecycle, launch screen, orientation, plugin bridge, Siri entry point, widget, badge correction on notification actions.
- Web: the full UI and all reminder, list, scheduling and settings logic, including notification scheduling and tap handling.

There is no native reimplementation of reminders, lists or settings.
