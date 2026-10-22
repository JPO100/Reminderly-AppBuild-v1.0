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
2. iOS 26 and later: the intent starts in the background (`supportedModes` background plus `.foreground(.dynamic)`) and reads `siriRemindersActive` from the App Group. Only a stored `true` is accepted (fails closed); otherwise Siri says "Siri is turned off in Reminderly, so I can't add a reminder right now." and the app does not open. When on, Siri asks "What would you like to be reminded about?", then `continueInForeground(alwaysConfirm: false)` brings the app forward with no confirmation step.
   iOS 16.0 to 25 (limitation): `openAppWhenRun` opens the app first and there is no native refusal. When Siri is off, the app ignores the request (step 5).
   The app writes `siriRemindersActive` (`WidgetBridge.setSiriActive`, `utils/widget.ts`) on launch, on every change to the Siri flag, preference or Reminders module, and each time it returns to the foreground. Until the app has run once after install, Siri refuses.
3. The intent opens `reminderly://add?text=<percent-encoded text>`. Query separators (`&+=?#`) are encoded too, so they stay part of the text.
4. `AppDelegate.scene(_:openURLContexts:)` checks the scheme and host, escapes the text, and runs JavaScript in the WebView that sets `localStorage['reminderly.pendingSiriText']` and dispatches `reminderly:siri-add`.
5. `App.tsx` reads and removes the pending text on the event and on mount. If Siri for reminders is not active (Reminders module on, `reminderly-ff-siri-reminders` and the user's Siri preference on), the text is discarded. This in-app gate stays as a second layer behind the native check.
6. `utils/siri.ts` parses the text with the NLC parser in auto-apply mode, with a fallback for month-name dates ("March 5", "5th of March"). A month-name date with no year that has already passed means next year. A time with no date means today, or tomorrow once that time has passed. No date means Sometime. A repeat rule is created only when repeat reminders are active.
7. The reminder is added through the normal `addReminder` path, so it is persisted, notified and highlighted like any other.
8. Spoken "Done" ([plans/siri-done-confirmation.md](./plans/siri-done-confirmation.md)): the intent adds a one-off `id` to the URL. Once the saved reminders include the new reminder, the app writes the id to `siriAddedConfirmation` in the App Group (`WidgetBridge.confirmSiriAdd`). The intent waits up to 5 seconds for it: then Siri says "That's done", otherwise "I couldn't confirm your reminder was added. Please check Reminderly."

Any app or link that opens `reminderly://add?text=...` creates a reminder the same way.

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
