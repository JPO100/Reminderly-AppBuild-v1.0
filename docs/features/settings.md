# Settings and feature flags

Current reference for how settings work and what each flag and preference does. The design and remaining phases are in [../settings-flags-spec.md](../settings-flags-spec.md), the active specification.

Decision (2026-10-11, John, product owner): Dev tools control availability only. Users manage their own preferences, for whatever is available, in the Reminders and Lists settings panels.

## Model

| Prefix | Meaning | Changed in |
|--------|---------|-----------|
| `reminderly-ff-*` | Feature flag: is the feature available | Dev tools |
| `reminderly-pref-*` | User preference | Reminders or Lists settings panel |
| `reminderly-config-*` | App behaviour set by us | Dev tools > Config |
| `reminderly-test-*` | Testing tools only | Dev tools > Testing tools |

A feature is active when its parent features, its flag, its preferences and (for notifications) iOS permission are all on. The rules are in `isFeatureActive` (`src/app/settings/resolver.ts`); `App.tsx` combines the same conditions inline (for example `isNlcActive = Reminders on && nlc flag && nlc preference`).

## Storage rules

- Values are strings: `'true'` / `'false'`, or JSON for haptics and sounds.
- `useStoredSetting(key)` reads once on mount and writes only when its setter is called. Nothing is written at startup, so a missing key stays missing and a saved choice is never overwritten.
- A missing key uses `TRANSITIONAL_FALLBACKS`, then `SETTINGS_DEFAULTS` (`src/app/settings/keys.ts`). New keys go in `SETTINGS_DEFAULTS`.
- A failed settings write shows the app's storage error bar.
- `settings.test.ts` fails if a legacy key is used in active code.

## Migration

`migrateSettings()` (`src/app/settings/migration.ts`) runs once in `main.tsx`, before anything reads settings, and records `reminderly-settings-schema = 1`.

- Copies legacy keys to their new keys without overwriting a new key, changing or deleting the old key, or touching reminder and list data. Safe to run repeatedly.

| Legacy key | New key |
|-----------|---------|
| `dev.listsEnabled` | `reminderly-ff-lists` |
| `reminderly-dev-one-minute-time-increments` | `reminderly-pref-one-minute-increments` |
| `reminderly-notif-reminder-alerts` | `reminderly-pref-notif-alerts` |
| `reminderly-notif-app-badge` | `reminderly-pref-notif-badge` |
| `reminderly-notif-include-today-in-badge` | `reminderly-pref-notif-include-today` |
| `reminderly-haptics-config` | `reminderly-pref-haptics` |
| `reminderly-ff-tutorial-first-launch` | `reminderly-config-tutorial-first-launch` |
| `reminderly-ff-tutorial-every-start` | `reminderly-test-tutorial-every-start` |
| `reminderly-dev-default-templates-in-clean-state` | `reminderly-config-templates-in-clean-state` |
| `reminderly-ff-siri-shortcuts` | `reminderly-ff-siri-reminders`, `reminderly-pref-siri-reminders`, `reminderly-pref-siri-lists` |

- Existing installs (detected by `reminderly.reminders.v1`, `reminderly-created-lists` or `reminderly-active-main-tab`) keep earlier behaviour where nothing was saved: notification alerts and badge on, haptics on.

## Flags and preferences

Defaults are for new installs.

### Reminders

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-reminders` | on | Reminders module. Off hides the tab and clears notifications, badge and Siri |
| `reminderly-ff-repeat-reminders` | on | Off: no repeat rules can be created or changed; NLC ignores repeats |
| `reminderly-ff-one-minute-increments` / `-pref-` | on / off | Time picker minutes in 1-minute steps instead of 15 |
| `reminderly-ff-calendar` / `reminderly-pref-calendar` | off / off | Calendar view (also needs an 852pt screen) |

### Lists

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-lists` | on | Lists module and tab bar |
| `reminderly-ff-smart-reminders` | on | Smart reminders (needs Reminders and Lists) |
| `reminderly-ff-saved-lists` | on | List templates and the grouped filter set |
| `reminderly-ff-pinned-lists` | on | Pin to top |
| `reminderly-config-templates-in-clean-state` | off | Reseed default templates when lists are cleared |

Reminders and Lists cannot both be off (`canChangeModuleFlag`).

### Notifications

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-notifications` | on | Availability (Dev tools > Reminders > Features). Off cancels notifications, clears the badge and hides the user setting |
| `reminderly-pref-notif-alerts` | off | Reminder alerts |
| `reminderly-pref-notif-sound` | off | Alerts play the iOS default sound |
| `reminderly-pref-notif-badge` | off | App icon badge and badge payloads |
| `reminderly-pref-notif-include-today` | on | Badge counts today's reminders as well as overdue |
| `reminderly-notif-ask-state` | missing | In-app permission ask state (internal, not a preference) |

New installs use the defaults above; the in-app ask turns alerts and badge on when the user taps Allow. Existing installs keep their saved values (the migration wrote alerts and badge on where nothing was saved). Permission never changes a preference. See [notifications.md](./notifications.md).

### Natural language capture

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-nlc` | off | NLC available |
| `reminderly-pref-nlc` | off | NLC on |
| `reminderly-pref-nlc-date`, `-time`, `-repeats` | on | Recognise each category |
| `reminderly-pref-nlc-auto-parsing` | on | Auto-fill as you type (auto mode); off is Tap highlighted words (click mode) |
| `reminderly-ff-nlc-phone`, `-contacts` | off | Not built |

### Haptics and sounds

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-haptics` | on | Haptic feedback available |
| `reminderly-pref-haptics` | `{"allHaptics":false}` | JSON: per-panel on/off (`remindersHaptics`, `listsHaptics`, falling back to `allHaptics`) and per-action switches |
| `reminderly-ff-sounds` | off | Click sounds available |
| `reminderly-pref-sounds` | both panels off | JSON: per-panel on/off (`remindersSounds`, `listsSounds`) and per-action switches |

Both use the same 12 actions (`HapticAction` in `utils/haptics.ts`), grouped per panel: creating, completing and deleting reminders; creating a list, ticking an item, completing a list, deleting an item. Missing actions default to on. `hapticTap(action)` plays the click (`playClick`, a 10ms Web Audio click on the ambient audio session) and a light haptic impact, each gated by its flag, panel switch and action switch. Turning a panel off turns its groups off; turning it back on restores the previous choices.

### Siri

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-siri-reminders` / `reminderly-pref-siri-reminders` | off / off | Siri can add reminders (see [../ios.md](../ios.md)) |
| `reminderly-ff-siri-lists` / `reminderly-pref-siri-lists` | off / off | Not built; no Dev tools row |

### Onboarding

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-onboarding-tutorial` | on | Tutorial available |
| `reminderly-config-tutorial-first-launch` | on | Show on first launch |
| `reminderly-test-tutorial-every-start` | off | Show on every start (mutually exclusive with first launch) |

### System

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-settings-menu-v2` | on | Header settings button and panels; combined Later filter |
| `reminderly-ff-info-icons` | off | Info icons on settings and dev tools rows |
| `reminderly-ff-lock-screen-widget` | on | Lock screen widget data |
| `reminderly-ff-paywall` | off | Not built; no Dev tools row |
| `reminderly-dev-tools-password-required` | on | Dev tools password gate |

## Settings panels

With the settings menu on, a settings button in the Reminders or Lists header opens a centred panel (340 x 450, `bg-black/50` backdrop, 100px clear above and below; rows scroll on small screens). Rows only show when the related feature is available. Click-through rows open a sub-page with a back button.

Reminders settings:

- 1 minute time steps (toggle)
- Siri shortcuts (page): Siri shortcuts on/off, a key line, "To add a reminder with Siri just say...", "“Hey Siri...”" and the phrase "Add to Reminderly app" (both bold), then "...then when Siri replies, say your reminder.", inactive while Siri is off. The phrase is registered in `AppShortcuts.swift` and listed in `SIRI_PHRASES`; a test keeps them in step. Phrases containing "remind" or "reminder" were removed because Siri asked "Reminderly or Notes?" every time
- Notifications (page): Notifications, Alert sound (inactive while Notifications is off), a key line, Overdue badge, Include due today (inactive while Overdue badge is off); "Allow in iOS Settings" at the top when iOS permission is denied
- Natural Language Capture (page, titled "Natural Lang. Capture" so it fits on one line): on/off, key line, the mode as two linked toggles, Auto-fill as you type and Tap highlighted words (exactly one on), then Recognise dates, times, repeats (repeats only while repeat reminders are active)
- Sounds and haptics (page, shown while sounds or haptics are available): the Sounds on/off and its switches, a key line, then the Haptic feedback on/off and its switches; each group only while its feature is available. Rows scroll with the usual half-row glimpse
- Reminders tutorial (re-runs the tutorial)

Lists settings:

- Item order (page): Newest first, Oldest first, A to Z as linked toggles, exactly one on (`reminderly-pref-list-sort-az` and `reminderly-pref-list-oldest-first`, default Newest first): item order for every list (see [lists.md](./lists.md))
- Hide ticked items (toggle, `reminderly-pref-list-hide-ticked`, default off): ticked items fade out of the list editor in place 1500ms after ticking
- Ticked lists to Done (toggle, `reminderly-pref-list-auto-clear`, default off): fully ticked lists move to Done after midnight (see [lists.md](./lists.md))
- Siri shortcuts (toggle, only once Siri for lists exists)
- Sounds and haptics (page, shown while sounds or haptics are available): the Sounds on/off and its switches, a key line, then the Haptic feedback on/off and its switches; each group only while its feature is available. Rows scroll with the usual half-row glimpse
- Lists tutorial

With the settings menu off there is no settings entry point. The legacy settings bottom sheet, its "Show date and time subtitles" setting and the premium marketing section were removed (see [../development-history.md](../development-history.md)).

## Known UI issues

- None. The time increments info text (recorded 2026-10-12) was fixed on 2026-10-22: Reminders settings and Dev tools now say 15 minute steps, and Dev tools points to Reminders settings > 1 minute time steps.

## Files

- `src/app/settings/keys.ts`, `resolver.ts`, `useStoredSetting.ts`, `migration.ts`
- `src/app/components/SettingsPanelContent.tsx`
- `src/app/utils/haptics.ts`, `sounds.ts`
- `src/app/components/DevToolsOverlay.tsx`
