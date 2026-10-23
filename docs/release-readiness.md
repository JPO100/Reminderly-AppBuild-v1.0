# App Store release readiness plan

The living checklist for releasing Reminderly on the App Store. It records what Apple requires, what is done, what is outstanding, and what depends on product decisions. It is used as the authoritative checklist when formal release preparation begins.

- Created: 2026-10-12, from main @ db9a99d
- Basis: the dated assessment [archive/app-store-readiness-2026-10-12.md](./archive/app-store-readiness-2026-10-12.md), Apple's App Review Guidelines and App Store Connect documentation (checked 2026-10-12)
- Formal release preparation has not started and is not yet authorised. Outstanding release-specific changes in this plan have not been implemented.

## How to maintain this plan

- Update it in the same change as any feature or decision that affects a release requirement (new permissions, data handling, native features, paid features, defaults).
- Statuses: Complete, Outstanding, Pending decision, Verify before submission.
- Record decisions with their date and owner. Record completed items with the commit or branch.
- Keep it to one document. Detail belongs in the feature documents; this plan links to them.
- Re-check Apple's requirements when release preparation starts; they change every year.

## Confirmed product decisions

| Decision | Date / owner | Release implication |
|----------|--------------|--------------------|
| iPhone only | 2026-10-12, John | Set `TARGETED_DEVICE_FAMILY` to iPhone for the app and widget. iPhone-only apps still run on iPad in compatibility mode, so check the app on an iPad |
| Siri enabled for release | 2026-10-12, John | Siri for reminders on by default; the shortcut must work end to end |
| Developer tools excluded from release builds | 2026-10-12, John | Release feature flags become fixed at their defaults, so the release defaults below must be decided |
| Tutorial shows once on first launch, then only manually | 2026-10-12, John | Implemented, merged 2026-10-14 ([features/onboarding.md](./features/onboarding.md)) |
| Monetisation: 5 for Free with Reminderly Premium, £9 a year (D1) | 2026-10-14, John and CTO | Annual auto-renewing subscription through StoreKit 2; no trial, offer or Family Sharing. See [plans/5-for-free-paywall.md](./plans/5-for-free-paywall.md) |
| No default templates for new users | 2026-10-14, John and CTO | `config-templates-in-clean-state` stays off; all templates count towards the free limit |

## Pending product decisions

| # | Decision | Notes |
|---|----------|-------|
| D2 | Release feature defaults | Recommendations below for John's review |
| D3 | Release scope for unfinished features (notification preferences, Siri for lists, NLC phone and contacts, attachments) | Unfinished features must be hidden or complete (2.1, 2.3.1) |
| D4 | Privacy policy, terms of use and support site: content, owner and hosting | Needed whether or not the app is paid. Privacy policy Version 1.0 text in the app (feature/reminder-list-settings, not merged); terms of use and FAQs still placeholders; neatlymade.co does not resolve (2026-10-23), so no hosted policy URL yet |
| D5 | Countries and storefronts, and seller details (individual or company) | Affects EU trader status and pricing |

## Recommended release defaults (for John's review)

With developer tools excluded, these values are what users get. Development defaults are in `src/app/settings/keys.ts`. The recommendations are Claude's proposals for review, not approved product requirements; release defaults remain open (D2).

| Feature | Flag / preference | Dev default | Recommended for release | Reason |
|---------|-------------------|-------------|-------------------------|--------|
| Reminders, Lists | `ff-reminders`, `ff-lists` | on, on | on, on | Core features |
| Repeat reminders | `ff-repeat-reminders` | on | on | Core |
| 1 minute time increments | `ff-` / `pref-one-minute-increments` | on / off | on / off | User choice |
| Calendar | `ff-` / `pref-calendar` | off / off | Decision | Needs an 852pt screen; recently built |
| Reminder attachments | `ff-reminder-attachments` | off | Decision (D3) | Merged 2026-10-14; passed John's iPhone testing |
| Smart reminders, templates, pinned lists | `ff-smart-reminders`, `ff-saved-lists`, `ff-pinned-lists` | on | on | Complete features |
| Default templates for new users | `config-templates-in-clean-state` | off | off (decided 2026-10-14) | No seeded templates for new users |
| Notifications | `ff-notifications`, `pref-notif-alerts` | on, off | on, on after the in-app ask | Core to a reminders app. Phase 4 on feature/notifications-settings, not yet merged |
| Notification sound | `pref-notif-sound` | off | off (D3, approved 2026-10-15) | iOS default sound when on |
| Badge, include today | `pref-notif-badge`, `pref-notif-include-today` | off, on | on after the in-app ask, on | Allow in the in-app ask turns alerts and badge on |
| Haptics | `ff-haptics`, `pref-haptics` | on, off | on, on | iOS convention |
| Sounds | `ff-sounds`, `pref-sounds` | off, off | Decision | |
| Siri for reminders | `ff-` / `pref-siri-reminders` | off / off | on / on | Confirmed decision |
| Siri for lists | `ff-siri-lists` | off | off | Not built |
| Natural language capture | `ff-nlc`, `pref-nlc` | off, off | Decision (possible paid feature) | Major feature |
| NLC phone, contacts | `ff-nlc-phone`, `ff-nlc-contacts` | off | off | Not built |
| Onboarding tutorial | `ff-onboarding-tutorial`, `config-tutorial-first-launch` | on, on | on, on (after the first-launch fix) | |
| Settings menu | `ff-settings-menu-v2` | on | on | Only settings entry point |
| Info icons | `ff-info-icons` | off | Decision | Explanatory text in settings |
| Lock screen widget | `ff-lock-screen-widget` | on | on | |
| Paywall | `ff-paywall` | off | Enforced by the Release build configuration, not by the flag | Specified, not built. See [plans/5-for-free-paywall.md](./plans/5-for-free-paywall.md) |

## Requirements tracker

### Privacy and legal

| Requirement | Status | Reference | Notes |
|-------------|--------|-----------|-------|
| Privacy policy linked in the app and in App Store Connect | In progress (D4) | 5.1.1(i) | In the app under Settings > Support > Privacy policy (feature/reminder-list-settings, not merged). App Store Connect needs a hosted URL; neatlymade.co does not resolve yet |
| Purchase and configure neatlymade.co; host the Reminderly privacy policy at `https://neatlymade.co/privacy`; verify the URL is publicly accessible and suitable for App Store submission | Outstanding (must be resolved before release; does not block development) | 5.1.1(i), App Store Connect privacy policy URL | Domain availability checked, not yet purchased (John, 2026-10-23). The in-app policy's website link fails until then |
| Privacy manifest (`PrivacyInfo.xcprivacy`) for the app and widget | Outstanding | Required reason APIs; ITMS-91053 | UserDefaults used by app Swift code, widget, patched notifications plugin and the badge plugin (CA92.1, 1C8F.1) |
| App Privacy answers ("nutrition label") | Outstanding | App Store Connect | Expected "Data Not Collected" unless monetisation tooling or fonts change this |
| Bundle the Lato font instead of loading Google Fonts | Outstanding (recommended) | 5.1.1, privacy accuracy | Runtime request to `fonts.googleapis.com` sends the device IP address to Google on launch; the only third-party request found in the 2026-10-23 privacy audit and relevant to the policy's no-sharing statement. Also affects offline appearance |
| Camera and photo library permission strings (attachments) | Done | 5.1.1, 2.5.1 | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` in Info.plist. Recommendation, not approved: include the Filesystem, Camera and File Picker plugins when preparing the privacy manifest |
| Terms of use (Apple standard EULA or custom) | Pending D4 | 3.1.2, subscription metadata | Required in app and metadata if selling subscriptions |
| Export compliance (`ITSAppUsesNonExemptEncryption = NO`) | Outstanding | App Store Connect | No non-exempt encryption used |
| Age rating (updated questionnaire) | Outstanding | Required since September 2026 | Expected lowest rating |
| EU Digital Services Act trader status | Pending D5 | App Store Connect | Required for EU distribution |

### Platform and configuration

| Requirement | Status | Reference | Notes |
|-------------|--------|-----------|-------|
| iPhone only (`TARGETED_DEVICE_FAMILY = 1`, app and widget) | Outstanding | 2.4.1 | Currently "1,2" with portrait-only orientation |
| Check the app in iPhone compatibility mode on iPad | Verify before submission | 2.4.1 | Reviewers may use an iPad |
| `UIRequiredDeviceCapabilities`: `arm64` instead of `armv7` | Outstanding | Upload validation | Legacy template value |
| Build with Xcode 26 / iOS 26 SDK or later | Verify before submission | Apple upcoming requirements | Xcode 27 installed. From April 2027 the iOS 27 SDK is required |
| Signing, distribution profiles and App Group for app and widget | Verify before submission | | `group.com.reminderly.app` on both bundle ids |
| Version and build numbers | Outstanding | | Currently 1.0 (1); increment the build for each upload |
| App icon (1024 single size) and launch screen | Complete | | `AppIcon.appiconset`, `LaunchScreen.storyboard` |
| UIScene lifecycle | Complete | Required in the release after iOS 26 | Already adopted |
| No debug configuration in release builds | Verify before submission | | `debug.xcconfig` applies to Debug only |

### Features and behaviour

| Requirement | Status | Reference | Notes |
|-------------|--------|-----------|-------|
| Developer tools excluded from release builds | Outstanding (decided) | 2.3.1(a) | Triple-tap entry and hard-coded password today |
| Release feature defaults set | Pending D2 | 2.1, 2.3 | Table above |
| Unfinished features hidden or completed | Pending D3 | 2.1(a), 2.3.1(a) | |
| Tutorial shows once on first launch | Done (merged 2026-10-14) | 4.0 | Shown keys are now read on start and tab switch |
| Correct "1 minute time increments" info text | Outstanding | 2.3 | Says 5-minute steps; the picker uses 15 |
| No placeholder or test content visible | Verify before submission | 2.1(a) | |
| Local data durability (`localStorage` in WKWebView) | Verify before submission | 2.1 | Rare iOS clearing would lose data; consider before release |
| Minimum functionality beyond a web wrapper | Complete | 4.2 | Native notifications, widget, Siri, haptics |

### Notifications, widget and Siri

| Requirement | Status | Reference | Notes |
|-------------|--------|-----------|-------|
| App works without notification permission | Complete | 4.5.4 | |
| In-app permission request with context; alerts preference and flag wired | Complete on feature/notifications-settings, awaiting merge | 5.1.1(iv), HIG | Phase 4 ([plans/notifications-phase-4.md](./plans/notifications-phase-4.md)): in-app ask before the iOS prompt, no automatic prompt, verified on a fresh simulator install 2026-10-15 |
| Notification actions, badge and midnight badge on device | Verify before submission | 2.1 | Protected area |
| Lock screen widget shows correct data | Verify before submission | 2.1 | |
| Siri shortcut works end to end with release defaults | Outstanding (decided) | 2.1(a) | Currently registered but off by default, so it silently does nothing |
| Siri for lists hidden until built | Complete | 2.3.1 | No row shown while its flag is off |

### Monetisation (major outstanding dependency)

Model decided (D1, 2026-10-14): 5 for Free with an annual auto-renewing subscription, specified in [plans/5-for-free-paywall.md](./plans/5-for-free-paywall.md). Not implemented. The `reminderly-ff-paywall` flag exists with no implementation.

Mandatory if any digital feature or content is sold in the app:

| Requirement | Status | Reference |
|-------------|--------|-----------|
| Unlock paid features only through Apple In-App Purchase; no licence keys, codes or other unlock mechanisms | Outstanding | 3.1.1 |
| Restore mechanism for restorable purchases (non-consumables and subscriptions), typically a Restore Purchases button | Outstanding | 3.1.1 |
| Paywall clearly describes what the user gets for the price before purchase | Outstanding | 3.1.2(c), 2.3 |
| No false or misleading pricing, inside or outside the App Store | Outstanding | 2.3.1(a) |
| Do not direct users to other purchase methods, except where Apple allows (for example the US storefront or entitlement programmes) | Outstanding | 3.1.1(a), 3.1.3 |
| Do not require ratings, reviews or other store actions to unlock features | Outstanding | 3.2.2(x) |
| Paid Applications Agreement accepted; tax and banking completed in App Store Connect | Outstanding (when monetising) | App Store Connect |
| Products configured in App Store Connect with localised names, descriptions and prices | Outstanding (when monetising) | App Store Connect |
| First in-app purchase of each type submitted with a new app version, with review notes and a review screenshot | Outstanding (when monetising) | App Store Connect, Submit an In-App Purchase |
| Purchases tested with StoreKit testing in Xcode, sandbox accounts and TestFlight | Outstanding (when monetising) | StoreKit testing |
| Entitlement checks that work offline and survive reinstall (via restore) | Outstanding (when monetising) | 3.1.1, 2.1 |
| Privacy answers updated if a purchase SDK or server collects data | Outstanding | 5.1.1, App Privacy |

Additional requirements if auto-renewable subscriptions are used:

| Requirement | Status | Reference |
|-------------|--------|-----------|
| Ongoing value; period at least 7 days; available across the user's devices | Outstanding | 3.1.2(a) |
| Purchase screen shows subscription name, duration, what is included, and the full renewal price; the billed amount is the most prominent price | Outstanding | 3.1.2(c), Apple subscriptions guidance |
| Terms of use and privacy policy links in the app and in metadata | Pending D4 | Apple subscriptions guidance |
| Subscription group with levels; no accidental duplicate subscriptions; clean upgrade and downgrade | Outstanding | 3.1.2(b) |
| Free trials and introductory offers configured in App Store Connect, with terms shown before purchase | Not applicable (none in V1) | 3.1.2(a) |
| Easy access to manage or cancel the subscription (for example StoreKit's manage subscriptions sheet) | Outstanding | Apple subscriptions guidance |
| Allowed durations: 1 week, 1, 2, 3 or 6 months, 1 year; fixed once submitted | Outstanding | App Store Connect |

If a one-time purchase uses a free trial instead (non-consumable at price zero, named "XX-day Trial"): the app must show the trial length, what is lost when it ends and the charges needed to keep full functionality, before the trial starts (3.1.1).

Decided within D1 (2026-10-14): annual subscription at £9, all features free within 5 for Free limits, no trial or introductory offer, Family Sharing off, small local StoreKit 2 plugin with no third-party service. Still open: territories (D5) and Small Business Program enrolment. History: a removed premium screen once advertised "Get premium features for £9 a year" (unlimited reminders, NLC, repeats); this is not a decision.

### App Store Connect and submission

| Requirement | Status | Reference | Notes |
|-------------|--------|-----------|-------|
| Developer Program membership and App Store Connect app record | Verify before submission | | Bundle ids `com.reminderly.app`, `com.reminderly.app.widget` |
| App name available | Verify before submission | | "Reminderly" |
| Metadata: subtitle, description, keywords, category (Productivity), copyright, support URL | Outstanding | 2.3 | Must match the submitted feature set |
| Screenshots: required iPhone sizes only (iPhone only) | Outstanding | | No iPad screenshots needed |
| App Review notes: no login, how to see notifications, widget, Siri and purchases | Outstanding | 2.1 | |
| TestFlight build tested on a physical iPhone | Verify before submission | 2.1 | |

## Known issues affecting release

1. Tutorial opens on every launch (decided fix outstanding).
2. Siri shortcut does nothing with current defaults.
3. "1 minute time increments" info text is wrong.
4. Notification preferences and permission flow: complete on feature/notifications-settings, awaiting merge (Phase 4).
5. Developer tools reachable in all builds.
6. Marking a list done removes its linked smart reminder instead of completing it (pre-existing race). Must be fixed before any TestFlight release that includes Clear done lists nightly (CTO, 2026-10-15). Fixed and merged to main (4daa7f5).
7. Deleting a list removes its linked smart reminder instead of moving it to Deleted (same sync race as issue 6, recorded for future consideration by the CTO, 2026-10-15). Not scheduled.
8. A list item edit still open (keyboard showing) when the app is closed or killed is lost; edits are saved on blur or Return only. Long-standing behaviour, recorded 2026-10-20. Fixed and merged to main (a368cad): an open edit is saved when the app stops being active. The related list editor lock after editing (which forced a restart) is fixed and merged to main (ac17400).

Details: [architecture.md](./architecture.md) (Known constraints) and the feature documents.

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | Outstanding action added: purchase and configure neatlymade.co and host the privacy policy at https://neatlymade.co/privacy before release |
| 2026-10-23 | Privacy policy Version 1.0 in the app (Settings > Support, feature/reminder-list-settings, not merged). Privacy audit: no analytics, crash reporting, advertising or identifier SDKs and no app network calls; Google Fonts is the only third-party request. neatlymade.co does not resolve |
| 2026-10-22 | Siri tutorial page merged to main (9067897): "Add reminders with Siri" in the Reminders tutorial while Siri is available |
| 2026-10-22 | Siri creates reminders with the iPhone locked and in CarPlay, without opening Reminderly (2c0444d). Known issue 2 (Siri release defaults) unchanged |
| 2026-10-22 | Siri Phase 2 complete: reduced to the single phrase "Add to Reminderly app" (617b75a), as the other phrases made Siri ask "Reminderly or Notes?" |
| 2026-10-22 | Siri Phase 2 merged to main (b980d34): four phrases, Siri shortcuts settings page, spoken refusal when Siri is off (iOS 26+). Settings panels close when the app leaves and returns (3cdf0e7, 1afe653). Known issue 2 (Siri release defaults) unchanged |
| 2026-10-22 | Siri Phase 1 merged to main (ae3e94d). Known issue 2 (Siri release defaults) unchanged |
| 2026-10-22 | Siri Phase 1 (technical reliability) complete on fix/siri-reliability (not merged): "&" no longer truncates text, past times and past month-name dates no longer created overdue, settings info text corrected. John's iPhone Siri tests passed. Release defaults for Siri (known issue 2) unchanged |
| 2026-10-22 | Badge overnight repair validated: John's overnight testing on the iPhone 15 Pro (final main) shows the badge working as expected. Two-midnight validation closed |
| 2026-10-20 | Consolidation: known issue 8 fix merged (a368cad) and badge overnight repair merged (edcdc18). Badge two-midnight iPhone validation outstanding |
| 2026-10-20 | Known issue 8 fixed on fix/list-item-edit-background-save (not merged): open list item edit saved when the app stops being active |
| 2026-10-20 | List editor lock after editing fixed and merged to main (ac17400). Known issue 8 remains open |
| 2026-10-20 | Known issue 8 recorded: open list item edit lost when the app is closed. List editor lock after editing fixed on fix/list-keyboard-scroll-lock (not merged) |
| 2026-10-15 | Known issue 6 fixed (smart reminders move to Done with their list, merged 4daa7f5). Known issue 7 recorded: list deletion removes the linked smart reminder |
| 2026-10-15 | Clear done lists nightly merged to main (9dc03ea). Known issue 6 added: smart reminder sync fix required before a TestFlight release containing it |
| 2026-10-15 | Notifications Phase 4 complete on feature/notifications-settings (not merged): user notification settings, sound off by default, in-app permission ask, no automatic iOS prompt |
| 2026-10-12 | Plan created from the Phase 3 assessment. Decisions recorded: iPhone only, Siri enabled, developer tools excluded from release builds, tutorial once on first launch. Monetisation added as an outstanding dependency |

## Sources

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Auto-renewable subscription information (App Store Connect Help)](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/auto-renewable-subscription-information)
- [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [Submit an In-App Purchase](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)
- [Overview for configuring In-App Purchases](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/)
- [Explore testing in-app purchases (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10142/)
- [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
