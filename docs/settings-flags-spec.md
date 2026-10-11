# Settings and feature flags - Phase 0 specification

Branch: `feature/settings-flags-model` (created from `main` at `15c44d4`)
Status: Phase 0 approved, including D1 to D10 and the corrections from the final review (sections 7.3, 7.4, 7.5, 8.1 and 12). Phase 1 authorised.
Companion: `docs/settings-audit.md` (model, item-by-item audit, decisions, defaults and migration matrix)

## 1. Scope

Phase 0 covers documentation, code inspection and baseline verification only. This document:

- Records the baseline verification results.
- Records what the current code actually does, checked against implementation paths.
- Specifies the resolver, parent flag behaviour, storage migration, repeat reminders, notifications, natural language capture (NLC) and Siri behaviour.
- Defines acceptance criteria for each later phase.
- Lists the decisions that need approval before Phase 1.

Approved principles (from review) that this spec follows:

- Dev tools flags control availability. User settings control state.
- One flag per feature. Settings inside a feature share its flag.
- Turning a flag off never deletes or resets user preferences or data.
- Development defaults: user settings off for new installs, options inside a feature on. Launch defaults reviewed formally before release.
- Existing installs keep their established behaviour. Smart reminders and list templates default on where no value was saved. Explicitly saved off values are preserved.
- Notification preference is independent of iOS permission.
- Proportionate: reuse existing patterns, no new frameworks.

## 2. Baseline verification (unchanged code, `15c44d4`)

| Check | How it was run | Result |
|---|---|---|
| Automated tests | `npx vitest run` | 53 passed, 0 failed (4 files) |
| Self Check | All 9 suites run in the browser via the dev server, using the same aggregation as Dev tools > Testing | 334 passed, 0 failed |
| Repo guard | `npm run guard:repo` | Passed (standard warning that `src/app/components/ui` is platform-managed) |
| Web build | `npx vite build` | Succeeded. Existing warning: main chunk over 500 kB |
| iOS simulator build | `xcodebuild` Debug, iPhone 17 Pro simulator | BUILD SUCCEEDED |
| Type check | Not run | No `tsconfig.json` or TypeScript compiler in the project, so a type check cannot be run as configured |
| Physical iPhone | Not run | Not needed for a documentation-only phase |

Self Check by suite: schedule 37, persistence and hydration 84, NLC parsing 61, NLC interaction 48, done/deleted/completion 23, lists and smart reminders 26, dev tools and feature flags 33, notification and badge 22.

Notes:
- The iOS build used the web assets already in the iOS project. `npx cap copy ios` was not run, to avoid changing tracked files in a documentation-only phase.
- Self Check was run in a desktop browser, not on device.
- Documentation drift, not code failures: `src/app/dev/BASELINE.md` says Vitest 36 (actual 53). `docs/06-quality-and-dev/tests-and-baselines.md` says 425 checks across 8 suites (actual 334 across 9 sections). To correct in the final phase.

No baseline failures. Nothing needs a separate resolution.

## 3. Code-validated findings

These findings come from the code paths and add to or correct the earlier audit.

| # | Finding | Code path | Impact |
|---|---|---|---|
| F1 | The "Reminder system notifications" toggle has no effect. It is saved but never passed to notification scheduling. Alerts are always scheduled when iOS permission is granted | `App.tsx` sync effect calls `syncReminderNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge)` | Users who turned alerts off still get alerts. Affects the migration (section 8) |
| F2 | Alerts and badge are linked. Badge numbers are delivered through the alert notifications' `badge` field, plus a silent midnight badge notification. In the foreground the badge is also set directly with `Badge.set` | `notifications.ts` `buildScheduledNotifications`, `buildMidnightBadgeNotification`; `App.tsx` badge effect | Alerts off with badge on needs badge-only notifications (section 7) |
| F3 | iOS permission is requested on every notification sync, so new installs see the iOS prompt as soon as the first sync runs | `notifications.ts` `syncReminderNotifications` calls `requestPermissions()` | Replaced by the in-app ask in Phase 4 |
| F4 | Notifications resync when reminders, badge or "include today" change. On app resume, only the badge is recomputed. Notifications are not resynced | `App.tsx` sync effect; `appStateChange` listener triggers a refresh tick | Phase 4 adds a permission re-check and resync on resume |
| F5 | NLC is off for every user on every launch. `nlcEnabled`, the parse mode (`auto`) and recognition (date, time, repeats all on) are in-memory only and never saved | `App.tsx` `useState(false)`, `useState('auto')` | No saved NLC values exist, so there is nothing to migrate. The current behaviour is "off" |
| F6 | Siri: iOS always offers the "Add to Reminderly" shortcut (static `AppShortcutsProvider`). The single flag only gates whether the app acts on it. With the flag off, the Siri text is discarded silently | `ios/App/App/AppShortcuts.swift`; `App.tsx` `handleSiriAdd` | Siri only creates reminders. Nothing in the app acts on a Lists Siri setting today |
| F7 | The Siri toggles in both user settings panels are display only. They copy the flag at launch, are not saved and have no effect | `App.tsx` `remindersSettingsSiriOn`, `listsSettingsSiriOn` | Replaced by saved preferences in Phase 3 |
| F8 | Turning Lists off sets the smart reminders flag to off and saves it. Turning Lists back on does not restore it | `App.tsx` effect on `isListsEnabled` | Breaks "flags never reset values". Fixed by the resolver (smart reminders resolves as lists AND smart reminders, without overwriting) |
| F9 | The "tutorial shown" keys are saved but never read. "Show tutorial on first launch" (default on) never resets, so the tutorial opens on every launch, the same as "every start" | `App.tsx` `markTutorialSeen`, auto-launch effect | Existing behaviour. Decision D9 |
| F10 | Enable reminders, Enable notifications and Repeat reminders are local state inside dev tools only. They reset when dev tools opens and affect nothing outside it | `DevToolsOverlay.tsx` `DevToolsContent`, `RemindersPage` | Become real saved flags in Phase 1 |
| F11 | The 1 minute increments toggle in Reminders settings is local state only. The dev tools value is the one that is saved and used | `SettingsPanelContent.tsx`; key `reminderly-dev-one-minute-time-increments` | Value migrates to the user preference |
| F12 | Repeat rules can be created in three ways: the repeats overlay, NLC repeat recognition, and Siri phrases. Editing a reminder loads its existing rule (`repeatRuleToConfig`) and saves it back | `NewReminderOverlay.tsx`, `App.tsx` edit flow, `handleSiriAdd` | All three must respect the repeat flag (section 6) |
| F13 | Lists off today: Lists tab hidden, main view stays on reminders, colours switch to the reminders-only palette, tutorial uses the reminders variant. Lists data is kept | `App.tsx` `isListsEnabled` usages | Matches the model. Reused for Reminders off |
| F14 | Paywall has no state or reader in the app. Only Self Check references the key. A "paywall" comment sits above the Lists flag code | `dev-tools-checks.ts`; `App.tsx` comment | Kept as a reserved flag. The comment is fixed when that code is next touched |
| F15 | Reminder attachments exists on the `reminder-attachments` branch only, not on `main` | `git log --all` | Flag added on that branch or after merge |

## 4. Resolver

One module, `src/app/settings/` (name to confirm in Phase 1), following the existing small-utility pattern (as in `utils/haptics.ts`). No new libraries.

It answers one question per feature: is this feature active right now?

Three feature types:

| Type | Rule | Examples |
|---|---|---|
| Flag only | active = parent flags AND flag | Lists, pinned lists, list templates, smart reminders, repeat reminders, paywall |
| Flag + preference | active = parent flags AND flag AND preference | 1 minute increments, haptics, Siri (reminders), Siri (lists), NLC, show calendar, sounds |
| Flag + preference + permission | active = parent flags AND flag AND preference AND iOS permission | Notification alerts, app badge |

Rules:
- Settings inside a feature use the feature's flag plus their own preference (for example "include today in badge" is active = notifications flag AND badge preference AND include today preference AND permission).
- The resolver only reads. It never writes flags or preferences as a side effect (this fixes F8).
- Screens use the resolver for behaviour and visibility. The raw flag and preference values are only read by dev tools and user settings rows.

## 5. Parent flags

| Parent | Children |
|---|---|
| Reminders | Repeat reminders, 1 minute increments, NLC, Siri (reminders), show calendar, notifications (alerts and badge are reminder-based) |
| Lists | Smart reminders, list templates, pinned lists, template set in clean state, Siri (lists) |
| Onboarding | Tutorial on first launch, tutorial rows in settings |
| Notifications | Alerts, badge, include today in badge |
| Haptics | Individual haptic actions |
| NLC | Parse mode, date, time and repeats recognition, phone and contact recognition (once built) |

Proposed behaviour when a master flag is off:

| State | Navigation and interface | Data | Notifications and badge |
|---|---|---|---|
| Reminders on, Lists on | As today | Kept | As today |
| Reminders on, Lists off | As today with Lists off (F13): Lists tab hidden, reminders palette | Lists data kept, not shown | Unchanged |
| Reminders off, Lists on | Mirror of Lists off: Reminders tab hidden, app opens on Lists, Reminders settings unavailable | Reminders data kept, not shown | Scheduled notifications cancelled and badge cleared. Resynced when Reminders is turned back on |
| Both off | Not allowed. Dev tools stops the last master flag being turned off | - | - |

Smart reminders with Reminders off: smart reminders are reminders linked to lists, so they are hidden with Reminders. Decision D2.

## 6. Repeat reminders flag

When the flag is off:
- Existing repeating reminders keep their rule and keep repeating on completion (completion and rescheduling are unchanged).
- The repeats option is hidden in new and edit reminder.
- NLC repeat recognition is treated as off (parse mode and date/time still work).
- Siri phrases containing a repeat create a reminder without a repeat rule.
- Editing a repeating reminder (text, date, time, list link) saves its existing repeat rule unchanged. The rule is shown as read-only on the reminder info overlay, as today.
- Turning the flag back on restores full repeat editing. No data changes either way.

Enforcement points (all three must use the resolver, none may create or change a repeat rule while the flag is off):

| Path | Code today | With the flag off |
|---|---|---|
| Repeats overlay | `NewReminderOverlay.tsx` (`onRepeatsOverlayOpen`), `App.tsx` repeats overlay | Repeats control hidden in new and edit reminder. The existing rule is passed through unchanged on save |
| NLC | `parseTokens(reminderText, nlcRecognition)` in `NewReminderOverlay.tsx` | Repeats recognition forced off. No repeat token is offered or applied |
| Siri | `handleSiriAdd` in `App.tsx` (`repeatConfigToRule`) | Repeat rule dropped. The reminder is created with its date and time only |

## 7. Notifications

### 7.1 Model

Stored separately:
- Preferences (user): alerts, badge, include today in badge.
- Permission (iOS): read from the system, never stored as a preference.
- Ask state (internal): whether the in-app ask has been shown and its outcome (not asked, accepted, not now).

Revoking permission in iOS Settings suppresses notifications but never changes the saved preferences. When permission returns, notifications resume with the saved preferences.

### 7.2 Alerts and badge independently

| Alerts | Badge | Scheduled |
|---|---|---|
| On | On | Alert notifications carrying badge numbers, plus the midnight badge notification (as today) |
| On | Off | Alert notifications with no badge number. Badge cleared |
| Off | On | Silent badge-only notifications at the times the badge changes, plus the midnight one. Uses the existing silent midnight pattern |
| Off | Off | Nothing scheduled. Badge cleared |

The existing 64 pending-notification limit applies to all combinations.

### 7.3 Asking for permission

- New installs: alerts and badge preferences start off. No automatic iOS prompt (removes F3).
- In-app ask shown at the end of the tutorial, and if skipped, when the first reminder with a time is saved.
- "Allow": alerts and badge preferences set on, then the iOS prompt is shown.
- "Not now" (first time): ask state saved. Asked once more the next time a reminder with a time is saved.
- "Not now" (second time): not asked again automatically. The user can always turn notifications on from Reminders settings.
- iOS prompt denied, or previously denied: preferences stay as the user set them. The settings rows show "Turn on in Settings", which opens Reminderly's iOS settings page.
- The iOS prompt is never requested when iOS reports permission as denied (iOS would not show it).

Ask state key (D10): `reminderly-notif-ask-state`, a plain string.

| Stored value | Meaning | Next automatic ask |
|---|---|---|
| (missing) | Never asked | End of tutorial, or the first reminder with a time |
| `not-now-1` | Declined the in-app ask once | Next reminder saved with a time |
| `not-now-2` | Declined the in-app ask twice | None |
| `accepted` | Accepted the in-app ask (the iOS prompt was then shown), or an existing install with permission already granted | None |

- Accepting the in-app ask but denying the iOS prompt: the state stays `accepted`, so there are no further automatic asks. The user recovers through notification settings, which link to Reminderly's iOS Settings page.
- Any unrecognised value suppresses automatic asks (it is not treated as missing). It is replaced only when the user interacts with notification settings.
- The key records the in-app ask only. The iOS permission result is always read from iOS, never from this key.
- Turning notifications on from settings while the state is `not-now-1` or `not-now-2` shows the iOS prompt (if iOS still allows it) and sets `accepted`.

### 7.4 Scheduled notifications and resync

Alerts and badge are resolved independently. Each has its own active value from the resolver:
- Alerts active = Reminders flag AND notifications flag AND alerts preference AND iOS permission.
- Badge active = Reminders flag AND notifications flag AND badge preference AND iOS permission.

What is scheduled:

| Situation | Result |
|---|---|
| Alerts on, badge on | Schedule alerts carrying badge updates, plus the midnight badge notification |
| Alerts on, badge off | Schedule alerts with no badge updates. Clear the badge |
| Alerts off, badge on | Schedule silent badge-only updates, plus the midnight badge notification. No visible alerts |
| Alerts off, badge off | Cancel all pending Reminderly notifications. Clear the badge |
| Notifications flag off, or Reminders flag off | Cancel all pending Reminderly notifications. Clear the badge |
| iOS permission not granted | Preferences unchanged. Nothing new is scheduled (iOS would not deliver it). Pending notifications are left as they are, as today. When permission returns, a resync schedules according to the saved preferences |

- Turning one preference off never stops the other from working.
- No permission state ever writes to the preferences.
- The 64 pending-notification limit applies in every case.

Resync (the existing cancel-and-reschedule-if-different logic) runs when:
- Reminders change (as today).
- Any notification preference, the notifications flag or the Reminders flag changes.
- The app returns to the foreground (new: re-check permission, then resync).

### 7.5 Existing installs

- Alerts preference = saved `reminderly-notif-reminder-alerts` value, or on if never saved.
- Badge and include today = their saved values, or on if never saved.
- Ask state: if the key is missing and iOS reports permission as granted, Phase 4 sets `accepted` at runtime, so existing users are never asked. This is done at runtime rather than in the migration, because permission must be read from iOS and the Phase 1 migration does not touch notification permission. If permission was never decided, the state stays missing and the normal ask applies.
- Users who previously turned alerts off in dev tools: because of F1 they still received alerts. Their saved off value is honoured (D4, approved), so alerts stop for them. Covered by migration regression tests (section 12).

## 8. Storage and migration

### 8.1 Approach

- One migration function, run once at startup before state is read, recorded with `reminderly-settings-schema` = `1`.
- Runs only when the schema key is missing or lower. Safe to run more than once: it only writes a new key when that key is absent, and never overwrites.
- Reads each old key. If present, copies the value as-is (an explicit `false` stays `false`). If absent, the new key is left unset and the default from the defaults table applies.
- Old keys are left in place, not deleted, for one release to allow rollback. Deletion is a separate later change (D6, approved on condition that rollback is verified).
- Rollback behaviour: a build from `main` installed over the new build reads only the old keys, which the migration never changes. That build sees settings as they were before migration. Changes made in the new build are not visible to it. Reminders and lists data are unaffected, because their storage is not migrated. Reinstalling the new build again finds `reminderly-settings-schema` = `1`, does not migrate again, and keeps the new keys.
- New install versus existing install: an install is existing if `reminderly.reminders.v1`, `reminderly-created-lists` or `reminderly-active-main-tab` is present. The migration uses this only where the matrix gives new and existing installs different values (notifications and haptics).
- Detection check: the current app saves these keys on its first launch even with no reminders or lists (for example `reminderly.reminders.v1` = `[]`). So any install that has opened the app once is detected as existing. Phase 1 verifies this with a fresh install of the `main` build that is opened and closed with no data. If it does not hold, the fallback is to treat the presence of any `reminderly` key as existing, and never to apply new-install defaults when unsure.
- For existing installs, the migration writes explicit values wherever the existing-install value differs from the default. The defaults table can then hold one default per key, and the result does not depend on detecting the install type again later.
- The migration only writes new keys. The app keeps reading its current keys until the integration phase for each setting (section 12, Phase 1 boundary).
- Test keys (`reminderly-test-*`) are never read by the resolver for flags or preferences, so test overrides cannot change production behaviour.
- Defaults live in one table in the settings module (needed for the later launch defaults review).

### 8.2 Old to new mapping

| Old key | New key(s) | Missing value | Existing value |
|---|---|---|---|
| - | `reminderly-ff-reminders` | On | - |
| `dev.listsEnabled` | `reminderly-ff-lists` | On | Copied |
| - | `reminderly-ff-repeat-reminders` | On | - |
| - | `reminderly-ff-one-minute-increments` | On | - |
| `reminderly-dev-one-minute-time-increments` | `reminderly-pref-one-minute-increments` | Off | Copied |
| - | `reminderly-ff-notifications` | On | - |
| `reminderly-notif-reminder-alerts` | `reminderly-pref-notif-alerts` | New install: off. Existing: on | Copied (D4) |
| `reminderly-notif-app-badge` | `reminderly-pref-notif-badge` | New install: off. Existing: on | Copied |
| `reminderly-notif-include-today-in-badge` | `reminderly-pref-notif-include-today` | On | Copied |
| - | `reminderly-notif-ask-state` (internal) | Missing (not asked). Not written by the migration. Set at runtime in Phase 4 (section 7.5) | - |
| - | `reminderly-ff-haptics` | On | - |
| `reminderly-haptics-config` | `reminderly-pref-haptics` | New install: all haptics off, actions on. Existing: all on (current default) | Copied |
| `reminderly-ff-pinned-lists` | Unchanged | On | Kept |
| `reminderly-ff-onboarding-tutorial` | Unchanged | On | Kept |
| `reminderly-ff-tutorial-first-launch` | `reminderly-config-tutorial-first-launch` | On | Copied |
| `reminderly-ff-tutorial-every-start` | `reminderly-test-tutorial-every-start` | Off | Copied |
| `reminderly-ff-smart-reminders` | Unchanged | On (was off) | Kept. Explicit off preserved |
| `reminderly-ff-saved-lists` | Unchanged | On (was off) | Kept. Explicit off preserved |
| `reminderly-dev-default-templates-in-clean-state` | `reminderly-config-templates-in-clean-state` | Off | Copied |
| `reminderly-ff-siri-shortcuts` | `reminderly-ff-siri-reminders` | Off | Copied |
| - | `reminderly-ff-siri-lists` | Off | Not copied. Stays off until a Lists Siri action exists (D7) |
| `reminderly-ff-siri-shortcuts` | `reminderly-pref-siri-reminders`, `reminderly-pref-siri-lists` | Off | Copied to both. The Lists value is kept for when its flag is turned on (section 10) |
| - | `reminderly-ff-nlc` | Off | - |
| - | `reminderly-pref-nlc` | Off | - (F5: nothing saved today) |
| - | `reminderly-pref-nlc-mode` | `auto` | - |
| - | `reminderly-pref-nlc-recognition` | Date, time, repeats on | - |
| `reminderly-ff-settings-menu-v2` | Unchanged | Off | Kept |
| `reminderly-ff-info-icons` | Unchanged | Off | Kept |
| - | `reminderly-ff-calendar`, `reminderly-ff-sounds` | Off | - |
| - | `reminderly-ff-nlc-phone`, `reminderly-ff-nlc-contacts` (temporary) | Off | - |
| `reminderly-ff-paywall` | Unchanged | Off | Kept |
| - | `reminderly-ff-attachments` (on `reminder-attachments`) | Off | - |
| Hide overdue (not saved) | Stays unsaved | Off | - |
| `reminderly-dev-tools-password-required` | Unchanged (access, not a setting) | As today | Kept |

Not migrated (data and internal state, unchanged): `reminderly.reminders.v1`, `reminderly-created-lists`, `reminderly-saved-lists`, `reminderly-active-main-tab`, `reminderly-tutorial-reminders-shown`, `reminderly-tutorial-lists-shown`, `reminderly.pendingNotificationReminderId`, `reminderly.pendingNotificationAction`, `reminderly.pendingSiriText`.

## 9. NLC

- Current behaviour (F5): off for everyone, not saved. Migration preserves this: the NLC flag is off and the preference is off.
- Default parse mode: automatic (`auto`), matching the current code default. Click-to-parse stays available as a user choice.
- Recognition defaults: date, time and repeats on. Repeats recognition is also controlled by the repeat reminders flag (section 6).
- The Siri path parses text independently of the NLC setting today and keeps doing so. NLC settings do not affect Siri.
- When the NLC flag is turned on, the Natural Language Capture row in Reminders settings shows, with the master toggle (default off) and its options.

## 10. Siri

- Old: one flag, `reminderly-ff-siri-shortcuts`, default off. The two user toggles are display only (F7).
- New: `reminderly-ff-siri-reminders` and `reminderly-ff-siri-lists`, with matching preferences.
- Migration: the Siri (reminders) flag and both preferences copy the old flag value. The Siri (lists) flag starts off (D7). Existing users with Siri on keep it on for reminders. Everyone else stays off.
- Siri (reminders) active = Reminders flag AND Siri reminders flag AND preference. This gates `handleSiriAdd`, as the single flag does today.
- Siri (lists): no Siri list actions exist yet (F6). The flag stays off, so the Siri row in Lists settings is hidden until a Lists Siri action is built (D7, approved). The preference is kept so the user's value returns when the flag is turned on.
- iOS always offers the Siri shortcut (F6). When Siri is inactive, the request is discarded silently, as today (D8). A spoken reply (for example "Siri is turned off in Reminderly") needs native work in `AddReminderIntent.swift` and is recorded as a future improvement, not part of this work.

## 11. Dev tools and user settings

- Dev tools regrouped into Feature flags (by area), Config, Testing tools, and Access and diagnostics.
- Old dev tools controls stay until the replacement user setting is working and verified (Phase 3). They are then removed in the same phase.
- Rows for unbuilt features are hidden by their flags: show calendar, sounds, the Haptic feedback page until wired, the Natural Language Capture page until wired.
- "Use Smart Reminders" is removed from Lists settings (built-in feature).

### 11.1 UI and UX

- All settings UI reuses the existing components and standards: `ToggleRow`, `MenuRow`, `PanelShell`, the centred overlay standard (`docs/05-design-and-layout/centred-overlay-ui.md`) and panel spacing (`docs/05-design-and-layout/sizing-spacing.md`). No new visual patterns.
- Hidden rows are removed from the layout, not greyed out, so the overlays keep their spacing.
- Three new pieces of UI have no existing pattern. Each will be built from existing components and shown for approval before it is finalised: the in-app notification ask, the "Turn on in Settings" row state, and the main screen when Reminders is off (D3).

## 12. Phases and acceptance criteria

Each phase: small changes, Self Check extended, Vitest and Self Check pass, build, deploy to iPhone and simulator, manual checks below, report before the next phase.

Phase 1 - Foundation (resolver, storage, migration)

Scope: storage key definitions, defaults, the read-only resolver, the storage migration, persistence of the new flags, migration and resolver tests, Self Check coverage, and upgrade and rollback verification.

Boundary: no user-facing change to navigation, recurrence, Siri, notification scheduling or permission, notification settings, NLC, settings layouts or dev tools organisation.
- The app keeps reading and writing its current storage keys. Each setting moves to its new key in its integration phase: phase 3 for settings, phase 4 for notifications.
- The new Enable reminders, Enable notifications and Repeat reminders flags are saved by the existing dev tools toggles, but nothing outside dev tools reads them in Phase 1. So turning them off cannot disable existing functionality.
- The smart reminders and list templates default change (on where never saved) takes effect in Phase 3, when the app reads the resolver.
- Dependency: values changed in dev tools after the migration has run are saved to the current keys only. Before the Phase 3 switch, either the new keys are refreshed from the current keys once, or development devices are reset. This only affects development devices, since these settings can only be changed in dev tools today. To be decided before Phase 3.

Acceptance criteria:
- Migration produces the mapping in 8.2 for: a new install, an existing install with all old keys, an existing install with some keys explicitly false, and a second run (no changes).
- Migration regression tests (Vitest and Self Check) cover: alerts explicitly off stays off (D4), badge and include today explicitly off stay off, smart reminders and list templates explicitly off stay off, missing values take the matrix default, Siri on copies to the reminders flag and both preferences but not the lists flag.
- Old keys are unchanged after migration (D6).
- Existing-install detection verified: a `main` install opened once with no reminders or lists is detected as existing.
- Upgrade and rollback test, with representative data and preferences:
  1. Install the current `main` build with existing data and preferences.
  2. Upgrade to the Phase 1 build.
  3. Migration preserves reminders, lists and existing settings.
  4. Install the `main` build over the Phase 1 build.
  5. The `main` build still reads its existing data and preferences.
  6. Reinstall the Phase 1 build.
  7. Migration does not run again and new-format values are not overwritten.
  Settings changed only in the Phase 1 build are not expected to appear in the `main` build. There is no two-way sync.
- Vitest, Self Check (including new migration and resolver checks) and repo guard pass. Web build and iOS simulator build with refreshed web assets succeed. Deployed and checked on the physical iPhone.
- Resolver returns the expected value for every flag, parent and preference combination in the matrix.
- Turning any flag off and on leaves its preferences unchanged (including smart reminders after Lists off and on, F8).
- Enable reminders, Enable notifications and Repeat reminders are saved flags.
- No visible change in behaviour for an existing install or a new install.

Phase 2 - Dev tools restructure
- Dev tools shows the four groups. Every item in the audit is present in exactly one group.
- The last master flag cannot be turned off.
- Existing dev tools controls still work.

Phase 3 - User settings connected
- Every user setting saves and restores across app restarts.
- Rows appear only when their flag is on, and preserve spacing.
- Repeat flag off behaves as in section 6 on device, with existing repeating reminders: they repeat on completion, keep their rule when other properties are edited, and no rule can be created or changed through the repeats overlay, NLC or Siri.
- Self Check covers the repeat flag at each enforcement point (overlay pass-through, NLC repeats recognition off, Siri repeat dropped).
- Reminders off and Lists off behave as in section 5 on device.
- Replaced dev tools controls removed.

Phase 4 - Notifications permission flow
- Device checks for each permission state: not asked, accepted, not now, denied, and revoked then restored in iOS Settings.
- The preference is unchanged by permission changes.
- Every row of the table in 7.4 is tested in Vitest (`buildScheduledNotifications`) and on device: alerts on/badge on, alerts on/badge off, alerts off/badge on, alerts off/badge off, notifications flag off, Reminders flag off, and permission not granted then restored. Turning one preference off leaves the other working. Permission changes never change preferences. Badge count matches the existing badge rules. The 64 limit holds.
- Ask state follows 7.3: missing, `not-now-1`, `not-now-2` and `accepted`, no further automatic asks after accepting and then denying the iOS prompt, and unrecognised values suppressing automatic asks.
- Upgrade from the current `main` build keeps notifications working with no new prompt.

Phase 5 - Integration and regression
- Full Vitest, Self Check, build, and deploy to iPhone and simulator.
- Manual regression: notifications, badge counts, repeating reminders, completion and deletion flows, app lifecycle (background, resume, relaunch), and upgrade from `main` with real data.
- Baseline docs corrected (section 2 notes). Development history updated.

## 13. Decisions

| # | Decision | Outcome |
|---|---|---|
| D1 | Resolver location: `src/app/settings/`, one file each for keys and defaults, the resolver, and the migration | Approved |
| D2 | Smart reminders hidden when Reminders is off. Links between lists and reminders kept | Approved. Existing data and preferences preserved |
| D3 | Main screen when Reminders is off and Lists is on: mirror of the Lists-off layout | Approved in principle. Visual sign-off in Phase 3 |
| D4 | Honour saved alerts-off values (which had no effect before, F1) | Approved. Migration regression tests required (section 12) |
| D5 | After "Not now": ask once more at the next timed reminder, then not automatically | Approved |
| D6 | Keep old storage keys for one release | Approved on condition that rollback is verified (sections 8.1 and 12) |
| D7 | Siri (lists) flag off until a Lists Siri action exists | Approved |
| D8 | Siri request while Siri is inactive: keep silent discard | Approved. A spoken reply needs native work and is a future improvement |
| D9 | Tutorial on first launch shows on every launch (F9) | Approved as a separate tracked fix, outside this work |
| D10 | Ask state key `reminderly-notif-ask-state` with values missing, `not-now-1`, `not-now-2`, `accepted` (section 7.3) | Approved, with refinements: no further automatic asks after an iOS denial, and unrecognised values suppress automatic asks |

## 14. Future improvements (out of scope)

- Spoken Siri reply when Siri is turned off (D8).
- Tutorial on first launch fix (D9).
- Deleting old storage keys after one release (D6).
- Launch defaults review before release.
