# iOS Implementation

## Overview

Reminderly’s iOS app is a Capacitor-hosted shell around the web application. The native layer is intentionally thin and primarily provides app packaging, launch configuration, and local notification integration.

## Current File Structure

Key iOS wrapper files:

- `App/App/AppDelegate.swift`
- `App/App/Info.plist`
- `App/App/capacitor.config.json`
- `App/App/config.xml`
- `App/App/public/index.html`

## AppDelegate

`App/App/AppDelegate.swift` is currently a minimal Capacitor app delegate.

Current behaviour:

- imports `UIKit` and `Capacitor`
- uses `@UIApplicationMain`
- conforms to `UIApplicationDelegate` and `UIWindowSceneDelegate`
- returns `true` from `didFinishLaunchingWithOptions`
- forwards URL open handling to `ApplicationDelegateProxy.shared`
- forwards `NSUserActivity` continuation to `ApplicationDelegateProxy.shared`

There is no project-specific startup logic in the current app delegate.

## Info.plist

`App/App/Info.plist` currently defines the native shell configuration.

Current implementation includes:

- app display name `Reminderly`
- single-scene app configuration
- launch storyboard: `LaunchScreen`
- storyboard-backed main scene: `Main`
- `UIViewControllerBasedStatusBarAppearance = true`

### Orientation

The current iOS wrapper supports portrait only:

- `UISupportedInterfaceOrientations`
  - `UIInterfaceOrientationPortrait`

### Scene model

The current scene manifest explicitly disables multiple scenes:

- `UIApplicationSupportsMultipleScenes = false`

## Capacitor Config

`App/App/capacitor.config.json` currently contains:

- `appId: "com.reminderly.app"`
- `appName: "Reminderly"`
- `webDir: "dist"`
- `loggingBehavior: "none"`
- `packageClassList: ["LocalNotificationsPlugin"]`

This means the iOS wrapper loads the built web output from `dist` and includes Capacitor local notifications support.

## Cordova Config

`App/App/config.xml` currently contains:

- `<access origin="*" />`

No additional Cordova-specific rules are currently defined in this file.

## Web Shell

`App/App/public/index.html` is the web container entrypoint used by the iOS app bundle.

Current structure:

- standard root HTML scaffold
- `<div id="root"></div>` mount node
- current built JS asset reference
- current built CSS asset reference

The iOS app therefore serves the built web client inside the native wrapper rather than maintaining a separate native UI implementation.

## Local Notifications Integration

The current iOS shell participates in local notification support through Capacitor.

### Native/plugin side

- `LocalNotificationsPlugin` is registered in `capacitor.config.json`

### Web/app side

- `src/main.tsx` registers the `localNotificationActionPerformed` listener
- tapped notification ids are written to `reminderly.pendingNotificationReminderId`
- the app dispatches `reminderly:notification-tap`
- `src/app/useNotificationTapHandler.ts` resolves that id back into the app UI

### Scheduling side

`src/app/notifications.ts` derives local notifications from the current reminder set and syncs them through the Capacitor local notifications API.

## patch-package: Local Notifications Badge Support

The `@capacitor/local-notifications` plugin does not natively pass the `badge` field from the JS notification payload to `UNMutableNotificationContent.badge`. A patch applied via `patch-package` adds this support.

Patch file: `patches/@capacitor+local-notifications+8.0.2.patch`

The patch modifies two files in `node_modules/@capacitor/local-notifications/ios/Sources/LocalNotificationsPlugin/`:

### LocalNotificationsPlugin.swift

In `makeNotificationContent`: reads `badge` from the notification JSObject and sets `content.badge = NSNumber(value: badgeValue)`. This enables iOS to update the app icon badge when a local notification fires, including when the app is backgrounded or force-closed.

### LocalNotificationsHandler.swift

Adds badge correction and tracking:

- `willPresent`: stores the notification's badge value to `UserDefaults` under `reminderly.nativeBadgeCount` when a notification is delivered in the foreground
- `didReceive`: when a `mark-done` or `move-tomorrow` action is taken, reads `badgeDeltaOnAction` from the notification's `cap_extra` userInfo. If delta > 0, reads the current badge from `UIApplication.shared.applicationIconBadgeNumber`, decrements by delta (clamped to 0), writes to `UserDefaults`, sets the app icon badge, and reschedules all pending notifications with corrected badge values
- `reschedulePendingBadges`: uses `beginBackgroundTask` as a safety net, iterates pending notification requests, decrements each badge by delta, and re-adds with the same identifier and trigger

### Maintenance

The `postinstall` script in `package.json` runs `patch-package` so the patch is applied automatically on `npm install`. If upgrading `@capacitor/local-notifications`, the patch must be regenerated or verified against the new version.

## Lock screen widget

A WidgetKit extension (`ios/App/ReminderlyWidget`, bundle id `com.reminderly.app.widget`, iOS 16+) provides one circular lock screen widget.

- The web app computes `getTodayProgress` (`reminder-utils.ts`) whenever reminders change, on resume and at time boundaries, and sends it through the local `WidgetBridge` plugin (`App/WidgetBridgePlugin.swift`, registered in `App/MainViewController.swift`).
- The plugin writes `todayProgress` (`date`, `outstanding`, `done`, `dueTomorrow`) to the App Group `group.com.reminderly.app` and reloads widget timelines.
- The widget shows `outstanding` in the centre and `done / (outstanding + done)` as an open arc (full when nothing is outstanding), with the Reminderly tick (template image). Its timeline includes a midnight entry: a snapshot from an earlier day shows `outstanding + dueTomorrow` with done reset.
- Tapping the widget opens the app. iOS controls when the widget redraws.
- Dev tools > System > Lock screen widget (`reminderly-ff-lock-screen-widget`, default on) is the master flag. Off: the app calls `clearSnapshot`, which removes `todayProgress` from the App Group, and the widget shows a neutral empty state (track arc and tick, no number). The same empty state shows before the app has first run.

## Relationship Between Native and Web Layers

The current relationship is:

- native iOS provides the app container, scene lifecycle, launch screen, orientation rules, and plugin bridge
- the web app provides the full product UI and business logic
- notification scheduling and tap handling are implemented in the web app, but delivered through the native Capacitor plugin bridge
- native badge correction on notification actions is handled in the patched `LocalNotificationsHandler.swift`

There is no duplicated native Swift feature implementation for reminders, lists, filters, overlays, or settings. The native badge correction operates on badge counts only — reminder state changes (mark-done, move-tomorrow, repeat spawning) are handled by the JS layer when the app opens.
