# Settings audit - dev tools vs user settings

Audit only. No code changed.

## Purpose

Reminderly has two places that control features: dev tools (password-protected admin area) and the new user settings panels (Reminders settings and Lists settings). They were built separately, without a shared model.

This document:

- Defines the agreed model for how the two work together.
- Lists every current dev tools item and user setting, how it works today, and where it should sit in the new model.
- Records the decisions made and the agreed notifications permission flow.

It is a companion to the settings and feature flags implementation plan and the Phase 0 specification (`docs/settings-flags-spec.md`), but can be read on its own.

Terms used:

- NLC: natural language capture. Detects dates, times and repeats as the user types a reminder.
- Flag: a dev tools switch that controls whether a feature is available.
- Today: how the item works in the current code on `main`.

## Model

- Flag (dev tools): is the feature available. Off = user setting hidden, feature off, user preference kept.
- User setting: is the feature on for this user. Only shown when the flag is on.
- Effective value = flag AND user setting.
- Every user setting is backed by a flag. A parent flag can cover its dependent sub-settings.
- New user settings default to off. Once the user changes one, their value is kept, including if the flag is turned off and back on.
- Reminders and lists are always treated separately (flags, settings and storage), so they can be split into separate apps later.
- Config (dev tools): app behaviour set by us, not shown to users.
- Testing tool: actions and overrides for testing. Never affects real users.
- Access / diagnostics: dev tools login, self checks, profiling.

## Categories

| Proposed category | Meaning |
|---|---|
| Flag | Availability only, no user setting |
| Flag + user setting | Dev tools controls availability, user controls state |
| Config | Dev tools only, app behaviour |
| Testing tool | Dev tools only, test actions/overrides |
| Access / diagnostics | Dev tools only |
| Flag + user action | Flag controls availability, user triggers an action (for example opening a tutorial) |
| Internal state | Saved by the app, not a setting. Not shown anywhere |

## Reminders

| Item | Today: dev tools | Today: user settings | Storage today | Proposed category | Notes |
|---|---|---|---|---|---|
| Enable reminders | Master toggle | - | Not saved, resets on each open | Flag | Mirrors Enable lists, so the app can run with only reminders or only lists. Needs saving and wiring into the app |
| Repeat reminders | Toggle | - | Not saved, not wired to app | Flag | Currently does nothing |
| 1 minute time increments | Toggle (Settings section) | Toggle | `reminderly-dev-one-minute-time-increments`. User toggle copies it but does not save | Flag + user setting | Two controls for one value today. Protected area (time handling) |
| Show calendar | - | Toggle | Not saved, not implemented | Flag + user setting | Needs a flag so it stays hidden until built |
| Natural language capture (master) | Toggle | Row, empty page | App state, not saved | Flag + user setting | |
| NLC date / time / repeats recognition | Toggles | (under NLC page, empty) | App state, not saved | Flag + user setting | Covered by the NLC flag. Protected area (date/time, repeats) |
| NLC phone / contact recognition | Locked toggles | - | None | Flag (placeholder) | Temporary flag to hide until built, then covered by the NLC flag |
| NLC auto-parsing / click-parsing | Toggles (mode) | - | App state, not saved | Flag + user setting | Covered by the NLC flag. A preference, not availability |
| Dummy reminders | Page | - | - | Testing tool | |
| Hide overdue | Toggle on dummy reminders page | - | App state, not saved | Testing tool | |
| Reminders tutorial | - | Row | - | Flag + user action | Covered by the onboarding flag |

## Lists

| Item | Today: dev tools | Today: user settings | Storage today | Proposed category | Notes |
|---|---|---|---|---|---|
| Enable lists | Master toggle | - | `dev.listsEnabled` | Flag | Rename to `reminderly-ff-lists` |
| Smart reminders | Toggle | Toggle | `reminderly-ff-smart-reminders`. User toggle not saved, defaults off | Flag | Built-in feature (decided). User toggle removed from Lists settings |
| List templates | Toggle | - | `reminderly-ff-saved-lists` | Flag | Flag only (decided). Flag default changes to on |
| Pinned lists | Toggle | - | `reminderly-ff-pinned-lists` | Flag | Flag only (decided) |
| Use template set in clean state | Toggle | - | Storage key constant in App | Config | |
| Dummy lists | Page | - | - | Testing tool | |
| Lists tutorial | - | Row | - | Flag + user action | Covered by the onboarding flag |

## Notifications (protected area)

| Item | Today: dev tools | Today: user settings | Storage today | Proposed category | Notes |
|---|---|---|---|---|---|
| Enable notifications | Master toggle | - | Not saved, resets on each open | Flag | |
| Reminder system notifications | Toggle | - | `reminderly-notif-reminder-alerts` | Flag + user setting | A user preference only set in dev tools today |
| App badge | Toggle | - | `reminderly-notif-app-badge` | Flag + user setting | As above. Protected area (badge counts) |
| Include today in badge count | Toggle | - | `reminderly-notif-include-today-in-badge` | Flag + user setting | Covered by the app badge flag |

## System

| Item | Today: dev tools | Today: user settings | Storage today | Proposed category | Notes |
|---|---|---|---|---|---|
| Siri shortcuts | Toggle | Toggle in both panels | `reminderly-ff-siri-shortcuts`. User toggles copy the flag on launch, not saved | Flag + user setting | Separate for reminders and lists (decided): two flags and two saved user values. Flag must stop acting as the default state |
| Settings menu | Toggle | - | `reminderly-ff-settings-menu-v2` | Flag | Retire once settings ships permanently |
| Show info icons | Toggle | - | `reminderly-ff-info-icons` | Flag | |
| Haptics (all + per action) | Toggles | Row, empty page | `reminderly-haptics-config` | Flag + user setting | State lives in dev tools today, should move to user |
| Sounds | - | Row, empty page | - | Flag + user setting | Needs a flag until built |
| Paywall | No UI found | - | `reminderly-ff-paywall` | Flag | Keep for future feature (decided). Add a dev tools toggle when built |
| Reminder attachments | - | - | - | Flag | Built on the `reminder-attachments` branch, not yet on `main`. Flag to be added there or after merge |

## Onboarding

| Item | Today: dev tools | Today: user settings | Storage today | Proposed category | Notes |
|---|---|---|---|---|---|
| Enable onboarding | Master toggle | - | `reminderly-ff-onboarding-tutorial` | Flag | Also gates the tutorial rows in user settings |
| Show tutorial on first launch | Toggle | - | `reminderly-ff-tutorial-first-launch` | Config | Not a flag despite `ff` prefix |
| Show tutorial on every start | Toggle | - | `reminderly-ff-tutorial-every-start` | Testing tool | Not a flag despite `ff` prefix |
| Tutorial shown (reminders / lists) | - | - | `reminderly-tutorial-*-shown` | Internal state | Add a testing tool to reset these |

## Access and diagnostics

| Item | Today: dev tools | Proposed category | Notes |
|---|---|---|---|
| Dev tools password / password required | Page under System | Access / diagnostics | `reminderly-dev-tools-password-required` |
| Testing - run self checks | Page | Access / diagnostics | |
| Startup profiler | `src/imports/startup-profiler.tsx` | Access / diagnostics | Not reviewed in detail |

## Defaults and migration matrix

- Admin flag: the dev tools flag and its default. "Covered by" means it shares a parent feature's flag.
- User flag: whether the user gets a toggle in user settings.
- New user default: what a new install gets.
- Existing installs: what happens on upgrade.

| Feature | Admin flag? | User flag? | New user default | Existing installs |
|---|---|---|---|---|
| Reminders | Yes - on | No | On | Unchanged |
| Lists | Yes - on | No | On | Unchanged |
| Repeat reminders | Yes - on | No | On | Unchanged |
| 1 minute increments | Yes - on | Yes | Off | Keep current value |
| Notifications - alerts | Yes - on | Yes | Off, turned on by the permission flow | Keep current (on today) |
| Notifications - badge | Covered by the notifications flag | Yes | Off | Keep current (on today) |
| Include today in badge | Covered by the notifications flag | Yes | On, takes effect once the badge is on | Keep current |
| Haptics | Yes - on | Yes | Off | Keep current (on today) |
| Haptics - individual actions | Covered by the haptics flag | Yes | On, takes effect once haptics is on | Keep current |
| Pinned lists | Yes - on | No | On | Unchanged |
| Onboarding tutorial | Yes - on | No (can be reopened from settings) | On | Unchanged |
| Tutorial on first launch | Config - on | No | On | Unchanged |
| Smart reminders | Yes - on | No (built-in feature) | On | Turns on if never set. Explicit off preserved |
| List templates | Yes - on | No | On | Turns on if never set. Explicit off preserved |
| Use template set in clean state | Config - off | No | Off | Unchanged |
| Siri - reminders | Yes - off | Yes | Off | Copies the current single value |
| Siri - lists | Yes - off until a Lists Siri action exists (D7) | Yes | Off | Flag stays off. Preference copies the current single value for later |
| Natural language capture | Yes - off until ready | Yes | Off | Unchanged |
| Natural language capture - parse mode, recognising dates, times and repeats | Covered by the natural language capture flag | Yes | On, once natural language capture is on | Unchanged |
| Settings menu | Yes - off until phase 3, then on | No | Off, then on | Unchanged |
| Info icons | Yes - off | No | Off | Unchanged |
| Show calendar | Yes - off, not built | Yes (when built) | Off | - |
| Sounds | Yes - off, not built | Yes (when built) | Off | - |
| Recognising phone numbers and contacts | Yes - off, temporary flag to hide until built. Then covered by the natural language capture flag | Yes (when built) | Off | - |
| Paywall | Yes - off | No | Off | - |
| Reminder attachments | Yes - off, added on the `reminder-attachments` branch or after merge | No | Off | Unchanged once merged |
| Tutorial on every start | Testing tool - off | No | Off | - |
| Hide overdue | Testing tool - off | No | Off | - |

## Key findings

1. The user settings panels are UI only so far and save nothing. Every flag + user setting row needs a saved user value.
2. Five values are user preferences that currently live only in dev tools: notification alerts, app badge, include today in badge, haptics, NLC mode.
3. Two places control 1 minute increments and Siri, with no defined link between them.
4. Two master toggles (Enable reminders, Enable notifications) are not saved and reset each time dev tools opens.
5. Repeat reminders toggle is not wired to anything.
6. Naming is inconsistent: `dev.listsEnabled`, `reminderly-dev-*` and `ff` prefixes on items that are not flags.
7. User setting rows for unbuilt features (Show calendar, Sounds, haptics page, NLC page) have no flag to hide them.
8. Notifications today: the iOS permission prompt fires automatically the first time notifications sync (`src/app/notifications.ts`), and alerts, badge and include today all default to on.

## Proposed dev tools structure

- Feature flags: grouped by Reminders, Lists, Notifications, System, Onboarding. Availability toggles only.
- Config: tutorial on first launch, template set in clean state.
- Testing tools: dummy reminders, dummy lists, hide overdue, tutorial every start, reset tutorial shown.
- Access and diagnostics: password, self checks, profiler.

## Proposed naming

- Flags: `reminderly-ff-<feature>`
- User settings: `reminderly-pref-<setting>`
- Config: `reminderly-config-<setting>`
- Testing: `reminderly-test-<setting>`

Renaming existing keys needs a one-time migration so current values are not lost (protected area: local storage persistence).

## Decisions

1. Siri: separate for reminders and lists, in line with the rule that reminders and lists are always separate.
2. Paywall flag: keep for a future feature.
3. Enable reminders: keep, as a saved flag matching Enable lists.
4. List templates and pinned lists: flag only.
5. New user settings default to off during development, and the user's last value is kept. Options inside a feature default to on, so turning the feature on works straight away. Existing installs keep their current behaviour. Launch defaults (the out-of-the-box state) to be agreed before release.
6. No standalone user settings. Every user setting is backed by a flag, which may be a shared parent flag.
7. One admin flag per feature, not per setting. Settings inside a feature share its flag.
8. Smart reminders is a built-in feature with no user setting. The toggle is removed from Lists settings.
9. Natural language capture has a user setting, with its options (parse mode, date, time and repeats recognition) as user settings under the same flag.

## Notifications permission flow (agreed)

- New users: notifications and badge start off.
- Ask in the app first (end of tutorial, or on the first reminder created with a time). Only on "Allow" do we trigger the one-time iOS permission prompt.
- Granted: the app setting turns on automatically. No trip to iOS Settings needed.
- Denied or revoked: the setting shows off with a "Turn on in Settings" link that opens Reminderly's iOS settings page.
- Value used by the app = flag AND user setting AND iOS permission. Re-check iOS permission on every app resume.
- Existing users: when migrating, set the user value on if iOS permission is already granted, so no one silently loses notifications.

## Senior developer review (approved)

Direction approved, with these clarifications:

1. Development defaults stay off, with options inside a feature defaulting on. Launch defaults must be formally reviewed before release.
2. Smart reminders and list templates default on, including existing installs with no saved value. Explicitly saved off values are preserved.
3. Smart reminders is built in, with no user setting.
4. Existing repeating reminders keep working when the repeat flag is off. Users cannot create or change repeat rules, and editing other properties keeps the recurrence.
5. The remaining documentation is completed in Phase 0 and approved before Phase 1.

Also to resolve in Phase 0 (covered in `docs/settings-flags-spec.md` sections 7 to 10):
- Existing NLC behaviour preserved through migration, with the default parsing mode defined.
- Notification preferences independent of iOS permission, including for users who previously turned alerts off.
- Migration of the single Siri flag into separate Reminders and Lists flags and preferences.

Approval scope: Phase 0 only (documentation, code inspection and baseline verification). Phase 1 needs separate approval.

## Phase 0 corrections to this audit

Code inspection during Phase 0 found these points, which supersede the tables above where they differ (details in the spec, section 3):

- "Reminder system notifications" is saved but has no effect. Alerts are always scheduled when iOS permission is granted.
- Alerts and badge are linked: badge numbers are delivered through alert notifications.
- NLC settings (master, mode, recognition) are never saved. NLC is off for every user on every launch.
- iOS always offers the Siri shortcut. The flag only controls whether the app acts on it. No Siri list actions exist.
- Turning Lists off saves smart reminders as off, and it is not restored when Lists is turned back on.
- "Tutorial shown" keys are saved but never read, so "tutorial on first launch" shows the tutorial on every launch.
- Template set in clean state is stored as `reminderly-dev-default-templates-in-clean-state`.

