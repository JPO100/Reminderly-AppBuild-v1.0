# TestFlight and Dev/Release split

**Status:** Decided 2026-11-04 (John, Jay). Implementation **deferred**; not authorised. Type D. Applies to Reminderly and Noterly.
**Estimate (provisional):** 10 to 12 hours in total (Reminderly about 8h, Noterly about 2.5h). The migration is the main uncertainty.

## 1. Decisions

- TestFlight is an additional channel. Local Xcode development, automated testing and direct device deployment are unchanged.
- Internal testing only (no Beta App Review, no public submission yet). John authorises every TestFlight upload.
- Both apps are signed by the NeatlyMade Ltd Apple Developer team. No second enrolment.
- No CI/CD. A short manual runbook is enough.
- Four installable variants, one codebase per app:

| Variant | Features | Dev tools | Distribution | Data |
|---|---|---|---|---|
| Reminderly Dev | All, including in development | On, with feature flags and test configuration | Xcode and TestFlight | Own App Group, test data |
| Reminderly Release | Approved release features only | Off | TestFlight, later App Store | Own App Group; John's real data |
| Noterly Dev | As Reminderly Dev | On | Xcode and TestFlight | Own App Group |
| Noterly Release | As Reminderly Release | Off | TestFlight, later App Store | Own App Group; starts fresh |

- Release features: the Release feature-flag (`ff-*`) defaults must match John's approved release feature list (to be confirmed). Excluding Dev tools only stops the flags being changed in the app; it does not make the defaults right. The list is checked against the flag defaults before the first Release archive ([release-readiness.md](../release-readiness.md), D7 for linked lists).
- Linked lists must keep working in Dev (Reminderly Dev with Noterly Dev, through the shared Dev App Group and URL scheme). It stays off in Release (D7).
- Development must not touch Release data. The Dev and Release App Groups differ, and each install has its own sandbox.

## 2. Technical approach

- Xcode build configurations: Debug (local Dev), **Release-Dev** (archives Dev for TestFlight, optimised, Dev ids, Dev tools on) and Release. Two small xcconfig files carry the per-variant values: bundle id, display name, App Group, URL scheme. A second scheme archives Release-Dev.
- The App Group name, now hard-coded in several Swift files (Reminderly, Noterly's `LinkedListsPlugin`), becomes one constant read from Info.plist, with the entitlements using the build setting.
- Dev tools gate: a build-time web flag. Plain `npx vite build` for Dev (tools on), `npx vite build --mode release` then `npx cap copy ios` for Release. Self Check shows the mode and bundle id.
- Bundle ids: new NeatlyMade ids for both Release apps (for example `com.neatlymade.reminderly`, `com.neatlymade.noterly`) and `.dev` ids for Dev. The current ids (`com.reminderly.app`, `com.jpo.noterly`, `group.com.reminderly.app`) sit under the Personal Team and probably cannot be released, so they are not reused unless the portal test shows otherwise. The old Reminderly app stays untouched until restore is proven.
- Local Debug and TestFlight Dev share one id, so each replaces the other and keeps Dev data.
- Noterly and Reminderly share one App Group per environment (Dev, Release). If the old group name is unavailable, a new one is chosen.

## 3. Reminderly data (Noterly starts fresh)

Reminderly holds real, daily-use data. It must be snapshotted and restored into Reminderly Release.

- Safety net first: Xcode Download Container from the current install (it is Debug-signed), plus an optional Finder backup. Refresh the install in place before the Personal Team profile expires (2026-11-09 at the time of writing).
- One-off export and import on a **migration branch, never merged to main**:
  - Export: all localStorage keys and `Directory.Data` files (attachments) as one JSON file, via the share sheet.
  - Import: the file picker writes the same data back and reloads.
  - Build 1 of Reminderly Release carries the importer; later builds do not.
- App Group state is derived or off (widget, Siri, linked lists), so it is rebuilt on launch, not copied.
- Proof: restore the real snapshot into Reminderly Dev first (it coexists with John's current app), check counts, Self Check, reminders, attachments, pending notifications, badge and widget. Only then restore into Release.
- The original Reminderly installation (and its data) stays untouched, with nothing deleted, replaced or reinstalled over it, until John has verified the restored Release version and has authorised its removal. John removes it himself.
- Not restorable: permissions (notifications, camera), Siri shortcuts, widget placement, delivered notifications.
- Notification rescheduling and local storage are protected areas: explicit verification steps and regression checks apply.

## 4. Implementation sequence

1. John's portal work and approvals (section 5); back up the current container.
2. Reminderly split (configs, xcconfigs, group constant, web flag); simulator check that Dev and Release coexist with separate data.
3. Noterly split (fresh start); check Dev and Dev linked lists.
4. Migration branch: export from the current install in place, restore into Reminderly Dev, verify.
5. On John's authorisation: create the Release App Store Connect record, archive and upload Release build 1 (with importer), install, restore, verify against the old app.
6. Noterly Release; Dev TestFlight builds for both apps when wanted.
7. Short runbook (archive, upload, install; the two web builds); update the commands in `project-rules.md` that use the old bundle id.

## 5. Outstanding blockers (John)

- NeatlyMade Team ID and admin access.
- Portal registration: app ids (four apps), the Reminderly widget id for Dev and Release, and the Dev and Release App Groups. A first test of whether the old ids and group can be registered.
- Four App Store Connect records (Dev and Release for each app) with unique names. "Reminderly" and "Noterly" may be taken; the store name can differ from the display name.
- A project-rules.md exception for signing work: bundle ids, `-allowProvisioningUpdates`, the importer writing app data. Each TestFlight upload needs John's explicit authorisation.
- iPhone availability (simulator only until John confirms).
- Authorisation to start.

## 6. References

- [5-for-free-paywall.md](./5-for-free-paywall.md) sections 7 and 8 (Reminderly Dev, now superseded where they conflict with this plan).
- [release-readiness.md](../release-readiness.md) (Dev tools excluded from release; D7).
- [linked-lists.md](../features/linked-lists.md).
- Noterly `docs/development-history.md` (CEO direction on separate development and release apps).
