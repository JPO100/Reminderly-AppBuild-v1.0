# App Store readiness review

- Date: 2026-10-12
- Branch: main
- Commit: db9a99d (Docs: CTO review corrections)
- Scope: assessment only. No code, configuration or branch changes.
- Reference: Apple App Review Guidelines (current online version) and Apple Developer upcoming requirements, checked 2026-10-12.

## Limitations

- Verified by reading the code and project configuration only. No build was archived or uploaded, and no physical device, App Store Connect or developer portal access was used.
- Upload validation results, signing and provisioning (including the App Group), App Store Connect state and reviewer behaviour cannot be confirmed without an actual archive, upload and review.
- Some Apple enforcement details (privacy manifest strictness, iPad orientation rules under the iOS 26 SDK) are reported inconsistently in Apple's forums. Where that applies it is stated below.

## 1. Overall assessment

Reminderly is a credible App Store candidate. It is a complete, stable, offline reminders and lists app with real native value (local notifications with actions, badge, lock screen widget, Siri shortcut, haptics). It collects no personal data, has no accounts, payments, tracking or user-generated content, and requests only notification permission. That places it in a low-risk category for App Review, and minimum functionality (4.2) should not be a concern.

It is not ready to submit as it stands. There are five likely blockers. Each is small and well understood: two are configuration, two are release-build gating of existing features, and one is a privacy policy. None needs a redesign. With these fixed and the submission materials prepared, approval prospects are good. Apple's decision cannot be guaranteed.

## 2. Likely blockers

| # | Finding | Evidence (confirmed in code) | Guideline / requirement |
|---|---------|------------------------------|-------------------------|
| B1 | No privacy policy, in the app or ready for App Store Connect | No privacy policy link anywhere in the app | 5.1.1(i): all apps must link a privacy policy in App Store Connect metadata and within the app |
| B2 | No app privacy manifest (`PrivacyInfo.xcprivacy`) | Required-reason API `UserDefaults` used by `WidgetBridgePlugin.swift`, `ReminderlyWidget.swift` (App Group suite), the patched `LocalNotificationsHandler.swift` and `@capawesome/capacitor-badge`. Only Capacitor core ships a manifest | Required-reason API declarations are required for uploads since 1 May 2024 (ITMS-91053). Some developers report a warning email rather than a blocked upload; treat as required |
| B3 | iPad is enabled but the app is portrait only | `TARGETED_DEVICE_FAMILY = "1,2"` for app and widget; Info.plist allows portrait only, with no iPad orientations | 2.4.1 (iPhone apps should run well on iPad). Historically an upload validation error for iPad multitasking. Under the iOS 26 SDK, Apple says iPad apps should support all orientations and resizing. iPad support also requires iPad screenshots and an iPad review |
| B4 | Hidden developer tools ship in the release build | Triple-tap on the logo opens Dev tools (password `123`, hard-coded): feature flags, dummy data, clear data, testing tools | 2.3.1(a): no hidden, dormant or undocumented features |
| B5 | Siri shortcut is visible but does nothing by default | `AppShortcuts.swift` always registers "Add to Reminderly app"; `reminderly-ff-siri-reminders` and the Siri preference default to off, so `App.tsx` discards the text after opening the app | 2.1(a) app completeness; 2.3.1(a). A reviewer trying the shortcut sees it fail silently |

Fix direction (for decision, not implemented):

- B1: publish a short privacy policy (no data collected, data stored on device, how to delete it) and link it from the app and App Store Connect.
- B2: add an app-level `PrivacyInfo.xcprivacy` declaring UserDefaults (reasons CA92.1 and 1C8F.1 for the App Group), and no data collection or tracking; add one to the widget target too. Confirm with Xcode's privacy report.
- B3: iPhone only (`TARGETED_DEVICE_FAMILY = 1`) is the smallest change. Supporting iPad properly is a larger piece of work.
- B4: exclude or disable Dev tools in release builds, and confirm release feature defaults are the intended launch set.
- B5: either turn Siri for reminders on for release (with the user preference on by default), or remove the App Shortcut from the release build.

## 3. Potential risks

| # | Risk | Status | Why it matters |
|---|------|--------|----------------|
| R1 | Tutorial opens on every launch | Confirmed in code (shown keys never read); fix already a confirmed requirement | Poor first impression for reviewers (4.0 design); not normally a rejection reason |
| R2 | Notification permission requested at first launch with no context | Confirmed: `syncReminderNotifications` calls `requestPermissions()` on the first sync, alongside the tutorial | 4.5.4 is satisfied (the app works without permission), but an unexplained prompt at launch invites a weaker review; Phase 4 already plans an in-app ask |
| R3 | Lato font loaded from Google Fonts at runtime | Confirmed: `src/styles/fonts.css` imports `fonts.googleapis.com` | A network request to Google on launch must be reflected accurately in the App Privacy answers and privacy policy; offline, the app falls back to a system font. Bundling the font locally removes both issues |
| R4 | `UIRequiredDeviceCapabilities` lists `armv7` | Confirmed in Info.plist | Legacy Capacitor template value for an arm64-only app; may trigger upload validation or device-compatibility issues. `arm64` is the expected value. Needs an upload to confirm |
| R5 | Data held in WKWebView `localStorage` | Confirmed architecture | iOS can clear WebView storage in rare low-storage cases, which would lose all reminders. Not a review issue, but a stability and reputational risk (2.1). Test, and consider in future planning |
| R6 | Release feature set not yet defined | `SETTINGS_DEFAULTS` are development defaults ("reviewed as the launch defaults before release") | Notifications flag and alerts preference are not yet wired (Phase 4); NLC, calendar and sounds default off. The submitted feature set must match the description and screenshots (2.3) |
| R7 | Widget and App Group signing | Not verifiable here | Both bundle ids need the App Group capability in the developer portal and distribution profiles; confirm with an archive and TestFlight install |
| R8 | Build SDK | Xcode 27 installed; requirement is Xcode 26 / iOS 26 SDK or later since 28 April 2026 | Expected to pass; confirm the archive uses a released (not beta) Xcode |
| R9 | Small UI inaccuracies | Confirmed: "1 minute time increments" info text says 5-minute steps (picker uses 15) | Minor; reviewers may notice inaccurate copy |
| R10 | App name availability | Not verifiable here | "Reminderly" must be available in App Store Connect |

## 4. Submission requirements

Administrative and configuration work, none of which exists in the repository:

- Apple Developer Program membership and App Store Connect app record (bundle id `com.reminderly.app`, plus the widget id and App Group).
- Privacy policy URL (B1) and support URL.
- App Privacy questionnaire: expected "Data Not Collected", subject to R3.
- Age rating: complete the updated questionnaire (required for new submissions from September 2026). Expected lowest rating.
- Export compliance: the app uses no non-exempt encryption; adding `ITSAppUsesNonExemptEncryption = NO` to Info.plist avoids the question on every upload.
- EU distribution: Digital Services Act trader status declaration.
- Metadata: name, subtitle, description, keywords, category (Productivity), copyright.
- Screenshots: required iPhone sizes (6.9-inch), plus iPad (13-inch) only if iPad stays supported.
- App Review notes: no login needed; how to see notifications, the widget and the Siri shortcut.
- Version and build: currently 1.0 (1); the build number must increase with each upload.
- Release archive signed with the existing team, uploaded with Xcode 26 or later, tested through TestFlight.

## 5. Minimum next steps

1. Product decisions (John): iPhone only or iPad; release feature set and defaults; Siri in or out for 1.0; Dev tools handling in release builds.
2. Fix B1 to B5 on a release-preparation branch, plus R1 (tutorial) and preferably R3 (bundle Lato) and R4 (`arm64`).
3. Archive a release build, check Xcode's privacy report, upload to App Store Connect and install through TestFlight on a physical iPhone. Verify notifications, actions, badge, widget and Siri on device.
4. Complete the App Store Connect items in section 4.
5. Submit for review.

## Sources

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
- [Upcoming SDK minimum requirements](https://developer.apple.com/news/?id=ueeok6yw)
- [Age rating updates](https://developer.apple.com/news/upcoming-requirements/?id=07242025a)
- [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)
- [Missing API declaration (ITMS-91053) forum thread](https://developer.apple.com/forums/thread/750057)
- [UIRequiresFullScreen deprecation forum thread](https://developer.apple.com/forums/thread/793406)
- [Make your UIKit app more flexible (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/282/)
