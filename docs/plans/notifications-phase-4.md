# Notifications Phase 4 - scope

Status: implemented on `feature/notifications-settings` (2026-10-15). Stages 1 to 4 complete and verified; awaiting final CTO sign-off. Not merged.

Builds on `docs/settings-flags-spec.md` section 7 (approved in Phase 0) and adds notification sound, agreed with John on 2026-10-15.

## 0. Decision record

Decisions made by John (product owner) on 2026-10-15:

- Scope expanded: Phase 4 includes notification sound management in user settings.
- Notifications are for reminders only. Lists have no notification settings. Smart list reminders are reminder notifications.
- User settings: when Reminders is on in dev tools, Settings > Reminders has a Notifications row that opens its own page. The user chooses whether notifications are on for reminders, and while they are on, a second toggle controls notification sound.
- No dev tools flag for sound.
- Sound option 1 accepted: one sound with an on/off toggle, no sound picker. Option 2 (an in-app picker of bundled sound files, with licensing, Xcode bundle changes and a preview player) was considered and not chosen. It can be added later without changing the saved setting's meaning.
- Sound used: the iOS default notification sound, so no sound file is needed. Reasons: familiar and native, no asset sourcing or licensing, no native project change, lowest risk.
- Understood and accepted: iOS gives third-party apps no per-app tone choice and no access to system tones. The user picks the tone for all apps in iOS Settings > Sounds & Haptics > Default Alerts (iOS 17.2 and later), and can turn Reminderly's sounds on or off in iOS Settings > Notifications > Reminderly > Sounds.

CTO review, 2026-10-15 (approved in principle):

- D1 approved: keep both existing dev tools flags (Reminders and Notifications).
- D2 approved: badge and include today controls on the Notifications page.
- D3: CTO recommends sound on for new installs and off for existing installs, assuming existing alerts are silent, to preserve existing behaviour. John to confirm.
- D4 approved: proposed labels and permission ask copy.
- D5 approved: `feature/notifications-settings`, created from a verified clean and current `main`.
- Clarifications 1 to 4 resolved in sections 2, 5, 6, 7, 10, 11 and 12 (summary in section 8).
- No additional architecture or testing framework.

CTO sign-off, 2026-10-15:

- D3 confirmed by John: sound off by default for all users, new and existing.
- All five decisions resolved. The four clarifications accepted.
- Sound default simplified: no new-versus-existing install branching and no migration change (section 7).
- Scope contained: no additional dependencies, sound assets or architectural changes without prior approval.
- Progress updates and validation evidence at the agreed checkpoints (section 10).

Decision status is in section 8.

## 1. Summary

Give users control of reminder notifications in Settings > Reminders > Notifications, and finish the Phase 4 notification work the settings spec defined:

- A Notifications page in Reminders settings with alerts, sound, app badge and include today in badge.
- The alerts preference actually controls alerts (fixes F1).
- Alerts and badge work independently, including a badge-only mode.
- An in-app permission ask replaces the automatic iOS prompt (fixes F3).
- Permission re-check and resync when the app returns to the foreground (fixes F4).
- Notification sound on or off, using the iOS default sound.

Classification: Type B (feature work). Touches notification scheduling, badge counts, app lifecycle and local storage persistence, all protected areas.

Notifications are for reminders only. Lists have no notification settings. A timed smart reminder is a reminder and is notified like any other.

## 2. User settings

Settings > Reminders gets a Notifications row (MenuRow, same pattern as Natural Language Capture and Haptic feedback) that opens a Notifications page.

| Row | Key | Shown when | Behaviour |
|---|---|---|---|
| Notifications | `reminderly-pref-notif-alerts` | Always on this page | Alerts for reminders with a time |
| Sound | `reminderly-pref-notif-sound` (new) | Notifications is on | Alerts play the iOS default sound, or arrive silently |
| App badge | `reminderly-pref-notif-badge` | Always on this page | Badge count on the app icon |
| Include today in badge | `reminderly-pref-notif-include-today` | App badge is on | Existing badge rule |

- Row labels and info text are proposed and can be changed at review.
- Hiding a child row never changes its saved value. Turning the parent back on restores the previous choice.
- When iOS permission is denied, a "Turn on in Settings" row appears at the top of the page and opens Reminderly's page in iOS Settings. The toggles stay visible and editable. Permission never changes a saved preference.
- Turning a toggle on follows the permission rules in section 6.2. The in-app explanation is never bypassed: the iOS prompt is only ever shown straight after the user taps Allow in the in-app ask.

## 3. Sound

Agreed with John, 2026-10-15: option 1, a single sound with an on/off toggle, no sound picker.

- Default: off for all users, new and existing (D3). The user turns it on in the Notifications page.
- Sound used: the iOS default notification sound. No sound file, no Xcode bundle change, no licensing.
- The user chooses that tone in iOS Settings > Sounds & Haptics > Default Alerts (iOS 17.2 and later). It applies to every app using the default sound. iOS offers no per-app tone choice.
- Sound on: alerts are scheduled with sound name `default`. The Capacitor plugin falls back to the iOS default sound when no file with that name exists (documented plugin behaviour, verified on device as part of this phase).
- Sound off: alerts are scheduled with no sound and still appear.
- Verified on device before the settings work is built (section 10, step 1). If the `default` name does not play the iOS default sound, work stops and returns for approval. No bundled sound file is added without agreement.
- Badge-only and midnight badge notifications are always silent.
- Changing Sound triggers a resync, because iOS stores the sound with each pending notification.
- iOS still overrides: the silent switch, silent mode, Focus, volume and Settings > Notifications > Reminderly > Sounds.
- Separate from the in-app Sounds feature (`reminderly-ff-sounds`), which is unchanged.
- A branded sound later means adding one file and changing the name. The setting stays the same. Not part of this phase.

## 4. Feature gating

- No new dev tools flag. Sound sits inside the existing Notifications feature.
- The Notifications row in Reminders settings shows when the Reminders flag and the Notifications flag (`reminderly-ff-notifications`, default on) are on. See D1.
- Alerts active = Reminders flag AND Notifications flag AND alerts preference AND iOS permission.
- Sound active = alerts active AND sound preference.
- Badge active = Reminders flag AND Notifications flag AND badge preference AND iOS permission.
- Include today active = badge active AND include today preference.
- Flag off: all pending Reminderly notifications cancelled and badge cleared (existing safeguard). Preferences kept.

## 5. Scheduling

Following spec section 7.4:

| Alerts | Badge | Scheduled |
|---|---|---|
| On | On | Alerts carrying badge numbers, plus the midnight badge notification (as today) |
| On | Off | Alerts with no badge number. Badge cleared |
| Off | On | Silent badge-only notifications at the times the badge changes, plus the midnight one (existing silent pattern) |
| Off | Off | Nothing scheduled. Badge cleared |

- Sound applies to the alerts in the first two rows only.
- iOS permission not granted: nothing new is scheduled, preferences unchanged. When permission returns, a resync schedules from the saved preferences.

### 5.1 Badge-only operation (clarification 2)

- Badge-only notifications are built independently of alerts. Each has no title, no body, no sound and no actions, and carries only the badge number. This is the same pattern as the existing midnight badge notification.
- One badge-only notification per future timed reminder, at the reminder's time, which is when the badge count changes. Date-only reminders are covered by the midnight notification, as today.
- The badge number uses the existing `computeBadgeCount` rules, including include today. Badge counting rules are unchanged.
- Turning alerts off never stops badge updates, and turning the badge off never stops alerts.
- Badge-only mode uses the same selection and the same cap as alerts: at most one notification per timed reminder, earliest first, limited to 64 including the reserved midnight slot (`MAX_SCHEDULED_NOTIFICATIONS` in `notifications.ts`). It never schedules more than alert mode would.
- In-app badge updates while the app is open (`Badge.set`) are unchanged.
- Covered by Vitest (alerts off with badge on, more than 64 timed reminders, midnight slot reserved) and on device (badge changes at the reminder time with no visible alert or sound).

### 5.2 Limit and resync

- The 64 pending-notification limit applies in every combination, using the existing cap.
- Resync runs when reminders change, any notification preference changes (including sound), the Notifications or Reminders flag changes, and when the app returns to the foreground (new: permission re-check first).
- Notification actions, tap handling and badge counting rules are unchanged.

## 6. Permission ask

Following spec section 7.3, with the settings entry point clarified (clarification 1). Ask state key `reminderly-notif-ask-state`.

### 6.1 Meaning of the ask state

- `accepted` means the user tapped Allow in the in-app ask, or an existing install already had iOS permission granted (set at runtime). It is set nowhere else.
- `accepted` does not mean iOS permission is granted. Permission is always read from iOS.
- `not-now-1` and `not-now-2` count declines of automatic asks only.

### 6.2 Automatic asks

- No automatic iOS prompt. The sync no longer calls `requestPermissions()`.
- The in-app ask is shown at the end of the tutorial, or, if the tutorial was skipped, when the first reminder with a time is saved.
- Allow: alerts and badge preferences set on, then the iOS prompt. State `accepted`. Sound is not changed and stays off unless the user turns it on (D3).
- Not now (first): `not-now-1`, asked once more on the next timed reminder. Not now (second): `not-now-2`, no further automatic asks.
- Accepted then denied in the iOS prompt: stays `accepted`, no further asks. Recovery through the Notifications page.
- The iOS prompt is never requested when iOS reports permission as denied.
- Unrecognised stored values suppress automatic asks.
### 6.3 Turning a toggle on in settings

Applies to Notifications and App badge. Sound and Include today only appear under a parent that is already on.

| iOS permission | What happens |
|---|---|
| Granted | The preference is saved on. No dialog |
| Not yet decided | The in-app ask is shown first. Allow: the tapped preference is saved on, the ask state is set to `accepted`, then the iOS prompt is shown. Not now: the toggle stays off and the ask state is unchanged |
| Denied | The preference is saved on. No prompt (iOS would not show one). The "Turn on in Settings" row stays at the top of the page |

- This replaces the spec 7.3 rule that settings showed the iOS prompt directly and set `accepted`. The settings spec is updated to match on completion.
- Declining the ask from settings does not count towards the automatic ask limit. The user started it.
- Allow from settings turns on only the tapped preference. Allow from an automatic ask turns on alerts and badge, as in 6.2.
- An unrecognised stored value is replaced with `accepted` only when the user taps Allow.

### 6.4 Dialog

- Uses the existing centred confirmation dialog. Proposed copy: title "Get reminder alerts?", body "Reminderly can alert you when a reminder is due and show a count on the app icon.", buttons "Allow" and "Not now".

## 7. Defaults and existing installs

| Preference | New install | Existing install |
|---|---|---|
| Alerts | Off until the ask is accepted | Saved value (migration already wrote it), on if never saved |
| Badge | Off until the ask is accepted | Saved value, on if never saved |
| Include today | On | Saved value, on if never saved |
| Sound | Off | Off (D3). A value the user has saved is kept |
| Ask state | Missing (not asked) | Set to `accepted` at runtime if iOS permission is already granted, so existing users are never asked |

- The notification entries are removed from `TRANSITIONAL_FALLBACKS`, so new installs use `SETTINGS_DEFAULTS`. Saved values are never overwritten.
- Sound default: `reminderly-pref-notif-sound` is added to `SETTINGS_DEFAULTS` as `'false'`. A missing key resolves to off for every install. No migration change, no schema version change and no new-versus-existing install branching. A saved value is always kept, because defaults apply only when nothing is saved.
- If step 1 finds that existing alerts currently play a sound, sound off changes what existing users hear. This is reported before proceeding.

### 7.1 Migration tests (clarification 4)

Vitest, extending `settings.test.ts`:
- An existing install with alerts, badge or include today saved as `false` (old or new keys) keeps `false` after the migration and after the fallbacks are removed.
- Each of those preferences resolves as off, and `buildScheduledNotifications` schedules accordingly (no alerts for alerts off, no badge numbers for badge off).
- Saved `true` values are kept.
- An existing install with no saved alerts or badge value gets on, as today.
- The sound key: missing resolves to off for new and existing installs, a saved `true` or `false` is kept, and the migration does not write it.
- The migration is safe to run repeatedly.
- Users who saved alerts off in dev tools stop receiving alerts (F1 fix, D4 approved in Phase 0).
- Upgrading from the current `main` build keeps notifications working with no new prompt.

## 8. Decisions and clarifications

| Item | Status |
|---|---|
| D1 Gating | Approved (CTO): keep both dev tools flags. The Notifications page needs the Reminders flag and the Notifications flag on |
| D2 Badge and include today | Approved (CTO): on the Notifications page |
| D3 Sound default | Approved (John, CTO sign-off): sound off by default for all users, new and existing. No migration change |
| D4 Labels, info text and ask copy | Approved (CTO) as proposed |
| D5 Branch | Approved (CTO): `feature/notifications-settings` from a verified clean and current `main` |
| C1 Settings toggles and the ask | Resolved: section 6.3. The in-app ask is always shown before the iOS prompt, and `accepted` has one meaning (6.1) |
| C2 Badge-only and the 64 limit | Resolved: section 5.1 |
| C3 Device verification of sound and Settings link | Resolved: step 1 gate in section 10, stop and return for approval on failure (section 12) |
| C4 Migration tests for saved off values | Resolved: section 7.1 |

## 9. Out of scope

- Sound picker, custom or branded sound files.
- Notifications for lists.
- Changes to notification actions, tap handling or badge counting rules.
- The in-app Sounds feature.
- Android.

## 10. Implementation steps

0. Create `feature/notifications-settings` from `main` after confirming `main` is clean and current with `origin/main`.
1. Device checks first (gate): confirm whether current alerts play a sound, that sound name `default` plays the iOS default sound, and that `app-settings:` opens Reminderly's iOS Settings page. Each is checked on the iPhone with the smallest temporary change. If any check fails, stop and return for approval before continuing.
2. Scheduling: alerts preference honoured (F1), alerts and badge independent, badge-only mode, sound, sync without `requestPermissions()`. Vitest for every row in section 5, sound on and off, and the 64 limit.
3. Settings: keys, defaults, removal of the notification fallbacks, migration tests (7.1), Notifications page in Reminders settings, gating, denied-permission row with iOS Settings link.
4. Permission flow: ask state, settings entry point (6.3), ask at tutorial end and first timed reminder, existing-install runtime `accepted`, foreground re-check and resync.
5. Verification, documentation and deployment.

Step 1 results (2026-10-15, John's iPhone 15 Pro, temporary uncommitted dev tools test card, since removed):
- Current alerts (no sound set): silent. Sound off by default (D3) preserves existing behaviour.
- Sound name `default`: plays the user's iOS Default Alerts tone. Passed.
- `app-settings:` from the web view: opens Reminderly's page in iOS Settings. Passed.
All three passed. No bundled sound file, native helper or new dependency is needed.

Results (2026-10-15):
- Stage 2 and 3 device checks: 7 of 7 passed (6 on John's iPhone 15 Pro, permission denied and recovery on the simulator).
- Stage 4 on a fresh install (unused iPhone 17 simulator; John's iPhone and the existing simulator untouched): no iOS prompt at launch; ask at tutorial end; Not now gives not-now-1, ask again on the next timed reminder; second Not now gives not-now-2, no further ask; settings toggle shows the ask, Not now leaves it off; Allow turns on only that preference, then the iOS prompt; Don't Allow keeps the preference and shows Turn on in Settings; allowing in iOS Settings clears the row on return. A reinstall on the same test simulator confirmed Allow from the automatic ask turns on alerts and badge, sound stays off. Existing install with permission: no ask.
- Defect found and fixed during stage 4 verification: the badge plugin requested iOS permission on every badge set or clear, so a new install saw the iOS prompt at launch. The badge is now only set once permission is granted.

Checkpoints: a progress update with validation evidence after step 1 (device checks) and after each of steps 2 to 5. Tests are written alongside each change, with commits at each stage on the branch. Final CTO technical sign-off before merging to `main`.

## 11. Verification

Automated:
- Vitest: `buildScheduledNotifications` for every section 5 row, notifications flag off, Reminders flag off, sound on and off, badge-only silent, 64 limit. Ask state transitions including unrecognised values, and the settings entry point in 6.3 for each permission state. Defaults, fallbacks and migration tests in section 7.1.
- Self Check: notification and badge suite and settings suite extended for the above.
- Full Vitest and Self Check runs, web build.

On device (iPhone and simulator):
- Each permission state: not asked, accepted, not now once and twice, denied, revoked and restored in iOS Settings. Preferences unchanged throughout.
- Each alerts and badge combination delivers as specified. Badge-only: the badge changes at the reminder time with no visible alert and no sound.
- Turning a toggle on in settings with permission undecided shows the in-app ask before the iOS prompt.
- Sound on plays the user's Default Alerts tone. Sound off arrives silently. Changing sound updates already scheduled notifications.
- "Turn on in Settings" opens Reminderly's iOS Settings page.
- Returning to the foreground after changing permission resyncs.
- Upgrade from the current `main` build with real data: notifications keep working, no new prompt.
- Regression: notification actions, tap to open, badge counts, repeating reminders, completion and deletion flows, Reminders off and on.

## 12. Risks

- The `default` sound fallback is documented by the plugin but not yet verified on device. Checked in step 1. If it fails, work stops and returns for approval. No bundled sound file is added without agreement.
- Opening iOS Settings from the web layer: expected to work with the `app-settings:` URL. Checked in step 1. If it fails, work stops and returns for approval. No native helper or new dependency is added without agreement.
- If current alerts are found to play a sound, sound off by default changes behaviour for existing users. Reported at step 1 before proceeding.
- Removing the notification fallbacks touches local storage persistence (a protected area). Covered by the tests in section 7.1.
- The ask touches the tutorial end and the reminder save flow, so both are covered by regression checks.

## 13. Documentation

On completion: `docs/features/notifications.md`, `docs/features/settings.md`, `docs/settings-flags-spec.md` (Phase 4 delivered, including the 7.3 settings entry point change in section 6.3), `docs/development-history.md` and `docs/release-readiness.md` (permission prompt behaviour).
