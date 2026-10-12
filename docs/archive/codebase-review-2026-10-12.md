# Reminderly - Phase 1 technical codebase review

- Review date: 2026-10-12
- Branch: main
- Commit: e194f02 (e194f02736f4e1c2b7be298362c8483fe32789e4), "Record self-check-audit merge into main in development history"
- Scope: read-only review. No application code or existing documentation was changed. Temporary location; permanent treatment to be decided in Phase 2.

## 1. Summary

Reminderly is a single-page React 18 + TypeScript app, bundled by Vite and shipped to iOS inside a Capacitor 8 shell. All data lives in the WebView's `localStorage`. There is no backend, no network sync and no router. Almost all state and orchestration sits in one component, `src/app/App.tsx` (about 5,400 lines), supported by pure utility modules that carry most of the testable logic. A small amount of native Swift adds a lock screen widget, a Siri/App Shortcuts intent, a URL scheme and a patched local notifications plugin.

The codebase originated in Figma Make, which explains the `src/imports/` folder of generated components and SVG path files, and the unused shadcn `src/app/components/ui/` folder.

## 2. Technology stack

| Area | Technology |
|------|-----------|
| UI | React 18.3, TypeScript, Tailwind CSS 4 (via `@tailwindcss/vite`), `motion` (Framer Motion) for animation |
| Build | Vite 6.3.5 (`vite.config.ts`), `@` alias to `src/` |
| Native shell | Capacitor 8.3 (`@capacitor/ios`), Swift Package Manager (`ios/App/CapApp-SPM`), no CocoaPods |
| Capacitor plugins | `@capacitor/app`, `@capacitor/haptics`, `@capacitor/local-notifications` (patched), `@capawesome/capacitor-badge` |
| Native extras | WidgetKit lock screen widget, AppIntents (Siri), custom `WidgetBridge` plugin |
| Tests | Vitest 4 (`npm run test`), plus the in-app Self Check suite |
| Dates | Native `Date` with local-time `yyyy-mm-dd` / `HH:mm` strings. `date-fns` is installed but not used by app code |

`package.json` still carries the Figma Make name (`@figma/my-make-file`) and a large set of Radix, Recharts, Emotion and other dependencies that exist only to support the unused `components/ui` folder. `vitest` sits in `dependencies` rather than `devDependencies`. `postinstall` runs `patch-package`.

## 3. Repository layout

```
src/
  main.tsx                    Entry: settings migration, notification listener, render <App/>
  app/
    App.tsx                   All primary state, effects, handlers and most rendering
    reminder-utils.ts         Reminder types, load/sanitise, categorise, sort, overdue, badge, calendar, labels
    notifications.ts          Local notification build/sync/clear, action types
    useNotificationTapHandler.ts  Handles taps and action buttons from notifications
    settings/                 keys.ts, resolver.ts, useStoredSetting.ts, migration.ts
    utils/                    NLC, text normalisation, schedule, lists, haptics, sounds, widget, dummy data
    components/               Overlays (DevTools, Repeats, ReminderInfo, Tutorial, Settings panels, Calendar), onboarding pages, lists
    components/ui/            48 shadcn files - platform scaffolding, not imported by the app
    dev/                      Self Check suites, check runner, BASELINE.md
    __tests__/                Vitest suites (9 files)
    types/reminder.ts         RepeatRule plus an earlier "canonical" Schedule model (mostly unused, see 11)
  imports/                    Figma Make output: NewReminderOverlay, TimePicker, Header, InfoOverlays, svg-*.ts paths
  styles/                     index.css, tailwind.css, theme.css, fonts.css
ios/App/
  App/                        AppDelegate, MainViewController, WidgetBridgePlugin, AddReminderIntent, AppShortcuts, Info.plist
  ReminderlyWidget/           Lock screen widget extension
  CapApp-SPM/                 Capacitor-managed Swift package (do not edit)
patches/                      patch-package patch for @capacitor/local-notifications 8.0.2
scripts/guard-no-ui-suite.mjs Warning-only script about components/ui
docs/                         Numbered documentation tree, development history, plans and audits, archive
```

## 4. Architecture

### 4.1 Startup

`src/main.tsx`:

1. Runs `migrateSettings()` (one-time settings key migration) before anything reads settings.
2. Registers notification action types (`mark-done`, `move-tomorrow`).
3. Adds the `localNotificationActionPerformed` listener. It writes the tapped reminder id and action to `localStorage` (`reminderly.pendingNotificationReminderId`, `reminderly.pendingNotificationAction`) and dispatches `reminderly:notification-tap`. This lets a tap that launches the app be picked up once React mounts.
4. Renders `<App/>` in `StrictMode`.

### 4.2 State ownership

`App.tsx` owns reminders, lists, saved list templates, every overlay's open state, filters, view modes, transient animation sets (`pendingDoneIds`, `pendingDeleteIds` and list equivalents) and roughly 40 stored settings. There is no context store or reducer; state flows down as props (the `DevToolsOverlay` call alone passes 60+ props). `ShowInfoIconsContext` is the only React context.

Pattern used throughout: data changes go through `setReminders` / `setCreatedLists` / `setSavedLists`, and `useEffect` hooks react to those arrays to persist, sync notifications, set the badge and update the widget. Side effects are therefore derived from state rather than called from handlers.

### 4.3 Persistence

| Key | Contents | Written by |
|-----|----------|-----------|
| `reminderly.reminders.v1` | `Reminder[]` JSON | Effect on `reminders` via `persistStringIfChanged` |
| `reminderly-created-lists` | `CreatedList[]` | Effect on `createdLists` |
| `reminderly-saved-lists` | `SavedListTemplate[]` | Effect on `savedLists` |
| `reminderly-active-main-tab` | `reminders` / `lists` | Tab change |
| `reminderly-ff-*`, `-pref-*`, `-config-*`, `-test-*` | Settings as `'true'`/`'false'` strings or JSON | `useStoredSetting` setters only |
| `reminderly-settings-schema` | Migration version (1) | `migrateSettings` |
| `reminderly.pending*` | Hand-off from native (notification tap, Siri text) | `main.tsx`, `AppDelegate.swift` |

`loadReminders()` (`src/app/reminder-utils.ts:37`) is defensive: invalid JSON or non-arrays give `[]`, corrupt records are dropped, legacy `text` and `inbox` shapes are migrated, and only known fields are kept. Persistence writes fail silently; settings write failures raise the app's existing storage error via `setSettingsWriteFailureListener`.

### 4.4 Data model (runtime)

Defined in `src/app/reminder-utils.ts`:

```ts
type ReminderSchedule = { kind: "scheduled"; date: string; time?: string } | { kind: "sometime" };
type Reminder = {
  id; originalText; displayText; createdAt: number; schedule: ReminderSchedule;
  repeatRule?: RepeatRule | null; completedAt?: number | null; deletedAt?: number | null;
  linkedListId?: string | null; isSmartReminder?: boolean;
};
```

- Dates are local calendar strings (`yyyy-mm-dd`), times `HH:mm`. No time zone is stored; everything is interpreted in device local time.
- Active vs done vs deleted is derived from `completedAt` and `deletedAt` (soft delete). "Clear all" in the archive view removes records permanently.
- Category (`today`, `this-week`, `later`, `sometime`) is derived at render time, never stored. Weeks run Monday to Sunday.
- `RepeatRule` (`src/app/types/reminder.ts`): `frequency` (hourly to yearly), `interval`, `byDay`. The UI uses `RepeatConfig` and converts with `repeatConfigToRule` (`src/app/utils/repeat-conversion.ts`).

Lists (`src/app/utils/list-utils.ts`): `CreatedList` with items, sort mode, pin, smart reminder date/time and `status` (`active` / `done` / `deleted`). Saved list templates are a separate array.

## 5. Principal features and mechanisms

### 5.1 Reminder lifecycle

- Create/edit: `src/imports/NewReminderOverlay.tsx` (NLC, date, time picker, repeats) feeds `addReminder` or the edit handler in `App.tsx`. Inserts are delayed 500ms and highlighted for 1s.
- Complete: 350ms visual transition (`COMPLETION_DELAY`), then `completedAt` is set. For repeating reminders a further 1000ms timer (`RESCHEDULE_DELAY`) inserts the next occurrence as a new reminder, computed by `getNextOccurrence` (`App.tsx:452`). The completed instance stays in history.
- Uncomplete: cancels any pending reschedule timer and removes the spawned next occurrence if exactly one confident match exists.
- Delete / undelete: soft delete via `deletedAt`, with the same transient animation pattern.
- Several timers are held in refs and cleaned up on unmount; behaviour depends on these exact delays.

### 5.2 Natural language capture (NLC)

- `src/app/utils/nlc-parser.ts`: deterministic regex tokeniser returning `date`, `time` and `repeats` token ranges. No AI.
- `src/app/utils/nlc-interaction.ts`: converts tokens to values, handles click-to-apply and auto-apply modes, invalidation and schedule kind.
- `src/app/utils/normalise-text.ts`: at save, rewrites relative phrases into absolute text to produce `displayText`.
- `src/app/utils/render-text.ts`: at render, substitutes "today"/"tomorrow" when applicable. Presentation only.
- Gated by `reminderly-ff-nlc` (default off for new installs) and NLC preferences.

### 5.3 Notifications and badge (protected area)

`src/app/notifications.ts`:

- `buildScheduledNotifications` creates one notification per active, timed, future reminder, with a numeric id hashed from the reminder id, and a precomputed badge value for the moment it fires. Capped at 64 (iOS limit), including one silent midnight badge notification when date-only reminders exist.
- `syncReminderNotifications` requests permission, compares signatures with pending notifications and only cancels/reschedules when they differ.
- `clearReminderNotifications` runs when the Reminders module is turned off, and again on every foreground while it stays off.
- The in-app badge is set by an effect using `computeBadgeCount` (overdue plus optionally today), recomputed on resume and at time boundaries (`getNextTimeRefreshBoundary`).
- Notification actions (`mark-done`, `move-tomorrow`) are handled by `useNotificationTapHandler.ts`. A plain tap opens the reminder's info overlay after 300ms.
- The patch in `patches/@capacitor+local-notifications+8.0.2.patch` stores the delivered badge value natively and corrects the badge by `badgeDeltaOnAction` when an action is taken from the lock screen without opening the app.

### 5.4 Settings and feature flags

- Keys and new-install defaults: `src/app/settings/keys.ts`. Prefixes: `ff` (admin flag), `pref` (user preference), `config`, `test`.
- `useStoredSetting` reads once on mount and writes only when the setter is called; nothing is written at startup.
- `resolver.ts` (`isFeatureActive`) defines parent/flag/preference/permission rules. It is used by tests and Self Check; `App.tsx` mostly combines flags inline.
- `migration.ts` copies legacy keys to new keys once, never overwriting, and preserves existing-install behaviour.
- Specification: `docs/settings-flags-spec.md`. Notifications are the remaining unintegrated phase (Phase 4); see 11.

### 5.5 Lists and smart reminders

Lists, templates, pinning and smart reminders live in `App.tsx` with helpers in `list-utils.ts`. A smart reminder is a normal `Reminder` with `isSmartReminder` and `linkedListId`; an effect reconciles reminders with lists so each eligible list has at most one active smart reminder.

### 5.6 Other UI features

- Calendar view (`RemindersCalendar.tsx`, calendar helpers in `reminder-utils.ts`): behind `reminderly-ff-calendar` and `reminderly-pref-calendar`, both off by default, and only on screens at least 852pt tall.
- Settings panels (`SettingsPanelContent.tsx`), tutorial/onboarding (`TutorialOverlay.tsx`, `OnboardingPage*Content.tsx`, `utils/tutorial-pages.ts`).
- Haptics (`utils/haptics.ts`, `@capacitor/haptics`) and click sounds (`utils/sounds.ts`, Web Audio), each with per-action configuration stored as JSON.

### 5.7 Native iOS integration

| Component | File | Role |
|-----------|------|------|
| URL scheme | `Info.plist`, `AppDelegate.swift` | `reminderly://add?text=...` writes `reminderly.pendingSiriText` into the WebView and dispatches `reminderly:siri-add` |
| Siri / Shortcuts | `AddReminderIntent.swift`, `AppShortcuts.swift` | "Add to Reminderly app" opens the URL scheme. Parsed in `App.tsx` with the NLC parser plus a month-name fallback |
| Widget bridge | `WidgetBridgePlugin.swift`, `MainViewController.swift`, `src/app/utils/widget.ts` | Writes `todayProgress` to App Group `group.com.reminderly.app` and reloads timelines; deduplicated in JS |
| Lock screen widget | `ReminderlyWidget/ReminderlyWidget.swift` | Circular widget; rolls a stale snapshot forward at midnight |

Bundle ids: `com.reminderly.app` and `com.reminderly.app.widget`. Deployment targets: app iOS 15.0, widget iOS 16.0. Portrait only. `capacitor.config.json` uses `webDir: dist` and logging off.

## 6. Developer tools and Self Check

- Dev tools open by tapping the logo three times (`handleLogoClick`, `App.tsx:2224`). An optional password gate uses a hard-coded value in `DevToolsOverlay.tsx`.
- Dev tools control feature flags (availability only, per the 2026-10-11 product decision), dummy data generation (`utils/dummy-generator.ts`, `utils/dummy-list-generator.ts`), tutorial testing and Self Check.
- Self Check: `src/app/dev/check-system.ts` runner plus 10 suites (reminders, schedule, NLC parser, NLC interaction, completion, done/deleted, notifications, lists, settings, dev tools). Baseline: 354 checks (`src/app/dev/BASELINE.md`).

## 7. Testing and build

- Vitest: 9 files in `src/app/__tests__/`, 167 tests at the last recorded baseline. Capacitor plugins are mocked with `vi.mock`. Tests target the pure modules (notifications, calendar, settings, sounds, widget, delete, validation, tutorial pages), not `App.tsx` rendering.
- Vitest excludes `.claude/**` so worktree copies are not run.
- Build: `npx vite build` then `npx cap copy ios`, then Xcode or the `xcodebuild` / `simctl` / `devicectl` commands in `Claude.md`.
- No linting, type-check script or CI configuration exists in the repository. Vite does not type-check, so TypeScript errors do not fail a build.

## 8. Conventions a developer needs to know

- Smallest safe change; follow existing patterns; protected areas listed in `Claude.md`.
- Dates and times are local strings; derive categories and overdue status from `now`, never store them.
- Settings are string booleans under prefixed keys; never write settings at startup; add new keys to `SETTINGS_DEFAULTS`.
- Side effects (persist, notifications, badge, widget) run from effects on state, not from handlers.
- Animation timings (350ms, 500ms, 1000ms) are behavioural, and tests and Self Check depend on them.
- Native to web hand-off uses a `localStorage` key plus a `window` custom event.
- Do not import from `src/app/components/ui`. Do not edit `ios/App/CapApp-SPM`.
- `docs/development-history.md` is the authoritative history and is updated on merges and feature completion.

## 9. Documentation present (for Phase 2 context only)

- Root: `README.md`, `ARCHITECTURE.md`, `Claude.md`, `ATTRIBUTIONS.md`, `app-wide-code-review.md`, `guidelines/Guidelines.md`.
- `docs/00-overview` to `docs/08-ios`: numbered reference tree.
- `docs/` root: development history, settings spec, feature plans and audits.
- `docs/archive/`: original docs and historical notes.

Not assessed further here, as agreed.

## 10. Git repository state

- Current branch: `main`, level with `origin/main` (0 ahead, 0 behind).
- HEAD: e194f02, 2026-10-12 16:22 +0100. 589 commits since 2026-04-03.
- Uncommitted changes (preserved, not touched by this review):
  - `Claude.md`: modified (deployment section reordered: simulator first, then iPhone, chime note).
  - `ios/App/App/public/index.html`: modified (new asset hashes from the latest web build).
- Untracked: `.claude/` (launch.json, worktrees) and `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/` (Xcode package resolution).
- New untracked file from this review: `docs/codebase-review-2026-10-12.md`.
- Stashes: 3 (`stash@{0}` holds an earlier version of the same `Claude.md` and `index.html` changes; two older WIP stashes from `long-list-sheet-bounce`).
- Branches: 39 local branches and 27 remote branches, mostly merged feature branches. Two `claude/*` branches are checked out in `.claude/worktrees`.

## 11. Material observations

These are noted for awareness, not as recommendations.

1. `App.tsx` concentration. About 5,400 lines, around 70 `useState` and 30 `useStoredSetting` hooks, and 44 effects. This is the established architecture, but it is the main source of change risk and the reason most behaviour is verified through Self Check and device testing rather than component tests.
2. Notification preferences not yet wired. Notification alerts and the notifications flag are stored and shown in Dev tools, but scheduling is gated only by the Reminders module and iOS permission. Permission is requested on every sync, and notifications are not resynced on resume. All of this is documented as Phase 4 in `docs/settings-flags-spec.md` (F3, F4).
3. Two reminder models. `src/app/types/reminder.ts` defines a `Schedule`/`Reminder` model that differs from the runtime model in `reminder-utils.ts`. Only `RepeatRule` and the types used by `schedule.ts` are live. Easy to confuse when reading the code or docs.
4. Unused Figma Make output. Around 55 of the 135 files in `src/imports/` are not referenced by the app (for example `app-fix.tsx`, `app-revert.tsx`, `Frame*.tsx`, older overlay variants), alongside the unused `components/ui` folder and its dependencies. There is also a stray `ios/App/OnboardingPage4Content.tsx`. Harmless at runtime, but noisy for anyone navigating the code.
5. Generated file under version control. `ios/App/App/public/index.html` is tracked even though `ios/.gitignore` ignores `App/App/public`, so every web build shows it as modified.
6. Existing documentation drift. `ARCHITECTURE.md` and `README.md` still describe earlier counts (327 checks, `docs/nlc.md` paths) and omit lists, settings, widget and Siri. Relevant input for Phase 2.
7. No type-check or lint in the build path, so type errors can reach a device build unnoticed.
8. Local-time model. All scheduling uses device local time with no stored time zone. Consistent and intentional, but travel or DST changes shift how reminders are interpreted.
