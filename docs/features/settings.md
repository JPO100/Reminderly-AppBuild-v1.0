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
| `reminderly-pref-nlc-auto-parsing` | on | Apply as you type (auto mode) |
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

- Use Siri shortcuts (toggle)
- 1 minute time increments (toggle)
- Notifications (page): Notifications, Sound (inactive while Notifications is off), App badge, Include today in badge (inactive while App badge is off); "Turn on in Settings" at the top when iOS permission is denied
- Natural Language Capture (page): on/off, Recognise dates, times, repeats (repeats only while repeat reminders are active), Apply as you type
- Haptic feedback (page), Sounds (page)
- Reminders tutorial (re-runs the tutorial)

Lists settings:

- Sort items A to Z (toggle, `reminderly-pref-list-sort-az`, default off): item order for every list
- Clear done lists nightly (toggle, `reminderly-pref-list-auto-clear`, default off): fully ticked lists move to Done after midnight (see [lists.md](./lists.md))
- Use Siri shortcuts (toggle, only once Siri for lists exists)
- Haptic feedback (page), Sounds (page)
- Lists tutorial

With the settings menu off there is no settings entry point. The legacy settings bottom sheet, its "Show date and time subtitles" setting and the premium marketing section were removed (see [../development-history.md](../development-history.md)).

## Known UI issues

- Time increments info text (recorded 2026-10-12, not yet fixed): the info pop-ups for "1 minute time increments" in Reminders settings (`SettingsPanelContent.tsx`) and Dev tools (`DevToolsOverlay.tsx`) say the time picker uses 5-minute steps when the setting is off. The picker actually uses 15-minute steps (00, 15, 30, 45; `TimePicker.tsx`). The Dev tools text also refers to a removed "Testing tools > User preferences" page.

## Files

- `src/app/settings/keys.ts`, `resolver.ts`, `useStoredSetting.ts`, `migration.ts`
- `src/app/components/SettingsPanelContent.tsx`
- `src/app/utils/haptics.ts`, `sounds.ts`
- `src/app/components/DevToolsOverlay.tsx`
