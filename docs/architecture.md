# Architecture

Living technical reference for Reminderly. Describes the application as implemented on main. Feature behaviour is in [features/](./features/); build and test in [development.md](./development.md); the native layer in [ios.md](./ios.md).

## Overview

Reminderly is a single-page React 18 + TypeScript app, bundled by Vite and shipped to iOS inside a Capacitor 8 shell. All data lives in the WebView's `localStorage`. There is no backend, no network sync and no router.

Almost all state and orchestration sits in one component, `src/app/App.tsx` (about 5,400 lines). Business logic that can be tested without React lives in pure utility modules. A small amount of native Swift adds a lock screen widget, a Siri intent, a URL scheme and a patched local notifications plugin.

The codebase originated in Figma Make. This explains the `src/imports/` folder (generated components and SVG path files) and the unused shadcn `src/app/components/ui/` folder.

Design philosophy: mobile-first, deterministic and user-controlled. No AI. All behaviour is explicit and predictable.

## Technology stack

| Area | Technology |
|------|-----------|
| UI | React 18.3, TypeScript, Tailwind CSS 4 (via `@tailwindcss/vite`), `motion` (formerly Framer Motion) |
| Build | Vite 6.3.5 (`vite.config.ts`), `@` alias to `src/` |
| Native shell | Capacitor 8.3 (`@capacitor/ios`), Swift Package Manager (`ios/App/CapApp-SPM`), no CocoaPods |
| Capacitor plugins | `@capacitor/app`, `@capacitor/haptics`, `@capacitor/local-notifications` (patched), `@capawesome/capacitor-badge` |
| Native extras | WidgetKit lock screen widget, AppIntents (Siri), local `WidgetBridge` plugin |
| Tests | Vitest 4 and the in-app Self Check suite |
| Dates | Native `Date` with local `yyyy-mm-dd` / `HH:mm` strings. `date-fns` is installed but not used by app code |
| Icons | Custom SVG path data (`src/imports/svg-*.ts`) |

`package.json` still carries the Figma Make name (`@figma/my-make-file`) and a set of Radix, Recharts, Emotion and other dependencies that exist only for the unused `components/ui` folder. `postinstall` runs `patch-package`.

Target device: iPhone, portrait only. Designed at iPhone 16 Pro size (402 x 874), responsive down to iPhone SE. See [design.md](./design.md).

## Repository layout

```
src/
  main.tsx                     Entry: settings migration, notification listener, render <App/>
  app/
    App.tsx                    All primary state, effects, handlers and most rendering
    reminder-utils.ts          Reminder types, load/sanitise, categorise, sort, overdue, badge,
                               widget progress, calendar helpers, row labels
    notifications.ts           Build, sync and clear local notifications; action types
    useNotificationTapHandler.ts  Notification taps and action buttons
    settings/                  keys.ts, resolver.ts, useStoredSetting.ts, migration.ts
    utils/                     nlc-parser, nlc-interaction, normalise-text, render-text, schedule,
                               repeat-conversion, date-display, list-utils, haptics, sounds,
                               widget, tutorial-pages, dummy generators
    components/                DevToolsOverlay, RepeatsOverlay, ReminderInfoOverlay,
                               RemindersCalendar, ListSmartReminderCalendar, SettingsPanelContent,
                               TutorialOverlay and tutorial/onboarding pages, lists/, icons/
    components/ui/             48 shadcn files. Not imported by the app. Do not use
    dev/                       Self Check runner, 10 suites, BASELINE.md
    __tests__/                 Vitest suites
    types/reminder.ts          RepeatRule, plus an early Schedule model (see Known constraints)
  imports/                     Figma Make output: NewReminderOverlay, TimePicker, Header,
                               InfoOverlay, list-info-overlay, deleted-info-overlay, DevTools,
                               DummyReminders, DummyLists, svg-*.ts. Many files are unused
  styles/                      index.css, tailwind.css, theme.css, fonts.css
ios/App/                       Native project. See ios.md
patches/                       patch-package patch for @capacitor/local-notifications 8.0.2
scripts/guard-no-ui-suite.mjs  Warning-only script about components/ui
```

## Startup

`src/main.tsx`:

1. Runs `migrateSettings()` (one-time settings key migration) before anything reads settings.
2. Registers notification action types (`mark-done`, `move-tomorrow`).
3. Adds the `localNotificationActionPerformed` listener. It stores the reminder id and action in `localStorage` and dispatches `reminderly:notification-tap`, so a tap that launches the app is picked up once React mounts.
4. Renders `<App/>` in `StrictMode`.

## Component structure

```
App.tsx
├── Header: logo (tap tick = done/deleted view; triple-tap text = dev tools), settings button
├── Reminders/Lists tab bar (Lists module on)
├── Reminders tab
│   ├── Filter pills (active list) or Done/Deleted filters and Clear all (archive)
│   ├── RemindersCalendar (calendar flag and preference on, tall screens only)
│   ├── Reminder rows (motion.div + AnimatePresence)
│   └── New reminder button
├── Lists tab
│   ├── List filter pills, list cards, add list button
│   └── Lists done/deleted view
├── NewReminderOverlay (src/imports) - create and edit, NLC, date, TimePicker, repeats
├── ReminderInfoOverlay - reminder detail, edit, done, delete
├── RepeatsOverlay - repeat frequency, interval, days
├── Lists overlay (ListsHeader, AddListItemInput, EditableListItem) and Templates overlay
├── InfoOverlay / ListInfoOverlay / DeletedInfoOverlay (src/imports) - list info and smart reminders
├── RemindersSettingsContent / ListsSettingsContent - centred settings panels
├── TutorialOverlay - TutorialOnboardingContent and OnboardingPage1-8Content
└── DevToolsOverlay
```

Overlays slide up from the bottom (`y: "100%"` to `0`) with a backdrop, except the settings panels, which use the centred overlay standard. See [design.md](./design.md).

## State management

`App.tsx` owns all primary state: about 70 `useState` hooks, about 34 `useStoredSetting` hooks and 44 effects. There is no reducer, store or router. State flows down as props. `ShowInfoIconsContext` (from `DevToolsOverlay`) is the only React context.

Main groups:

- Data: `reminders`, `createdLists`, `savedLists`.
- View: `activeMainTab`, `viewMode`, `activeFilter`, `doneDeletedFilter`, `activeListFilter`, calendar selection and month.
- Overlays: `isOverlayOpen`, `editingReminder`, `infoReminder`, `isRepeatsOverlayOpen`, `isListsOverlayOpen`, `isSavedListsOverlayOpen`, `isTutorialOpen`, `isDevToolsOpen`, settings panel flags.
- Settings: flags and preferences through `useStoredSetting` (see [features/settings.md](./features/settings.md)).
- Transient animation state: `pendingDoneIds`, `pendingUncompleteIds`, `pendingDeleteIds`, `pendingUndeleteIds` and list equivalents, `reinsertedId`, `insertHighlightId`, `clearListStep`.
- Dev-only: `hideOverdue` (not persisted).
- Timer refs: completion, uncomplete, reschedule, delete, insert and highlight timers, all cleared on unmount.

Ephemeral editor state (text, selected date and time, NLC tokens) lives inside `NewReminderOverlay` and is discarded when it closes.

## Data flow

1. A user action calls a handler in `App.tsx`.
2. The handler updates state, often after a short visual delay held in a timer ref.
3. Effects react to the changed arrays: persist to `localStorage`, sync notifications, set the badge, update the widget, reconcile smart reminders.
4. Children re-render from props. Motion handles enter, exit and layout transitions.

Side effects are derived from state rather than called from handlers. Keep to this pattern.

Timings are behavioural and tested:

| Constant | Value | Use |
|----------|-------|-----|
| `COMPLETION_DELAY` | 350ms | Done and delete visual transition before data commit |
| `EMPTY_STATE_DELAY` | 350ms | Delay before an empty-state message appears |
| `NEW_REMINDER_INSERT_DELAY` | 500ms | New reminder appears after the overlay closes |
| `RESCHEDULE_DELAY` | 1000ms | Next occurrence of a repeating reminder is inserted |
| `INSERT_HIGHLIGHT_MS` | 1000ms | Highlight on new or restored rows |

## Data model

### Reminders (`src/app/reminder-utils.ts`)

```ts
type ReminderSchedule =
  | { kind: "scheduled"; date: string; time?: string }   // date yyyy-mm-dd, time HH:mm
  | { kind: "sometime" };

type Reminder = {
  id: string;                 // UUID
  originalText: string;       // text as typed
  displayText: string;        // normalised text stored at save
  createdAt: number;          // epoch ms
  schedule: ReminderSchedule;
  repeatRule?: RepeatRule | null;
  completedAt?: number | null; // set = done
  deletedAt?: number | null;   // set = deleted (soft delete)
  linkedListId?: string | null; // smart reminders only
  isSmartReminder?: boolean;
};
```

- Dates and times are local calendar strings. No time zone is stored; everything is interpreted in device local time at runtime.
- Time exists only on `scheduled` reminders.
- Active, done and deleted are derived from `completedAt` and `deletedAt`. "Clear all" in the archive removes records permanently.
- Smart reminders are ordinary reminders in the same collection.

### Repeats

```ts
interface RepeatRule {            // persisted, src/app/types/reminder.ts
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay: Array<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'> | null;  // weekly only
}

type RepeatConfig = {             // UI state, reminder-utils.ts
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom-days';
  interval: number;
  selectedDays?: string[];
} | null;
```

`repeatConfigToRule` (`utils/repeat-conversion.ts`) maps `custom-days` to `weekly` with `byDay`.

### Lists (`src/app/utils/list-utils.ts`, `App.tsx`)

```ts
type ListItem = { id: string; text: string; completed: boolean; completedAt?: number | null };

type CreatedList = {
  id: string; title: string; items: ListItem[];
  sortMode?: 'alphabetical' | 'insertion';
  pinnedAt?: number | null;
  smartReminders?: boolean; smartReminderDueDate?: string | null; smartReminderTime?: string | null;
  status?: 'active' | 'done' | 'deleted'; statusChangedAt?: number | null;
};

type SavedListTemplate = {   // App.tsx
  id: string; title: string; items: ListItem[];
  status?: 'active' | 'deleted'; statusChangedAt?: number | null;
};
```

### Derived values (never stored)

- `ReminderCategory`: `today`, `this-week`, `later`, `sometime` (`other` is used for styling only). Weeks run Monday to Sunday.
- Overdue status, badge count, widget progress, calendar dots.
- `ListCategory`: `complete`, `almost`, `started`, `todo`, from item completion.
- `ViewMode`: `list` or `done-deleted` (lists also use `lists-done`).

## Persistence

| Key | Contents | Written by |
|-----|----------|-----------|
| `reminderly.reminders.v1` | `Reminder[]` | Effect on `reminders` (`persistStringIfChanged`) |
| `reminderly-created-lists` | `CreatedList[]` | Effect on `createdLists` |
| `reminderly-saved-lists` | `SavedListTemplate[]` | Effect on `savedLists` |
| `reminderly-active-main-tab` | `reminders` or `lists` | Tab change |
| `reminderly-tutorial-reminders-shown`, `reminderly-tutorial-lists-shown` | First-launch tutorial shown | Tutorial |
| `reminderly-ff-*`, `-pref-*`, `-config-*`, `-test-*`, `reminderly-dev-tools-password-required` | Settings | `useStoredSetting` setters only. See [features/settings.md](./features/settings.md) |
| `reminderly-settings-schema` | Settings migration version | `migrateSettings` |
| `reminderly.pendingNotificationReminderId`, `reminderly.pendingNotificationAction` | Notification hand-off | `main.tsx` |
| `reminderly.pendingSiriText` | Siri hand-off | `AppDelegate.swift` |

Writes are skipped when the serialised value is unchanged. Storage failures fail silently for data; settings write failures raise the app's storage error bar through `setSettingsWriteFailureListener`.

### Loading and migration

`loadReminders()` (`reminder-utils.ts`):

- Invalid JSON or a non-array gives `[]`.
- Records missing a usable `id` or text, or with an invalid schedule, are dropped rather than partially loaded.
- Legacy `text` becomes `originalText` and `displayText`. Legacy `inbox` becomes `sometime`.
- Empty time becomes `undefined`; times outside 00:00-23:59 are dropped.
- Invalid repeat data becomes `null`. `linkedListId` is kept when valid; `isSmartReminder` only when `true`.
- Output keeps only fields in the current `Reminder` type.

Lists load in `App.tsx`: legacy string items become `ListItem` objects, and missing `status`, `pinnedAt` and smart reminder fields get defaults. Saved templates always load with items uncompleted.

### Invariants

- Reminder ids are unique; schedules are always present and valid after load.
- Archive membership comes from `completedAt` / `deletedAt` (reminders) and `status` (lists).
- Pinned state is `pinnedAt`, not a separate collection.
- Each eligible list has at most one active smart reminder (reconciled by an effect in `App.tsx`).

## Pure modules

Most business logic is in pure functions, tested by Vitest and Self Check without mounting React:

| Module | Responsibility |
|--------|----------------|
| `reminder-utils.ts` | Load, categorise, sort, overdue, badge count, widget progress, refresh boundary, calendar, labels |
| `utils/nlc-parser.ts` | Regex token parsing |
| `utils/nlc-interaction.ts` | Token values, click and auto-apply, invalidation |
| `utils/normalise-text.ts` | Save-time display text |
| `utils/render-text.ts` | Render-time today/tomorrow substitution |
| `utils/schedule.ts` | Date utilities, schedule equality and deltas |
| `utils/list-utils.ts` | List categories, display order, smart reminder text and due labels |
| `notifications.ts` | Notification payloads and badge values |
| `settings/*` | Defaults, resolver, migration |

`getNextOccurrence` (repeat calculation) is the main exception: it lives in `App.tsx`.

## Conventions

- Smallest safe change; follow existing patterns. Protected areas are listed in `Claude.md`.
- Store dates and times as local strings. Derive categories and overdue status from `now`; never store them.
- Settings are string booleans (or JSON for haptics and sounds) under prefixed keys. Never write settings at startup. Add new keys to `SETTINGS_DEFAULTS`.
- Persist, notify, badge and widget updates run from effects on state, not from handlers.
- Native to web hand-off uses a `localStorage` key plus a `window` custom event.
- Keep the animation timings above; tests and Self Check depend on them.
- Do not import from `src/app/components/ui`. Do not edit `ios/App/CapApp-SPM` (Capacitor-managed).
- Record merges and completed features in [development-history.md](./development-history.md).

## Known constraints

Current characteristics to keep in mind. None is scheduled for change unless stated.

1. `App.tsx` concentration. Most behaviour is verified through Self Check and device testing rather than component tests.
2. Notification preferences are not yet wired. Scheduling is gated only by the Reminders module and iOS permission. Permission is requested on every sync, and notifications are not resynced on resume. Planned as Phase 4 in [settings-flags-spec.md](./settings-flags-spec.md).
3. Two reminder models. `src/app/types/reminder.ts` also defines `Schedule`, `ScheduleSources` and `SuggestedSchedule`, an early design that differs from the runtime model. Only `RepeatRule` and the types used by `utils/schedule.ts` are live.
4. Unused Figma Make output. Around 55 of 135 files in `src/imports/` are unreferenced, as is `components/ui` and its dependencies, and `ios/App/OnboardingPage4Content.tsx`.
5. `ios/App/App/public/index.html` is tracked although `ios/.gitignore` ignores `App/App/public`, so each web build shows it as modified.
6. No type-check or lint step. There is no `tsconfig.json` and TypeScript is not installed; Vite does not type-check, so type errors do not fail a build.
7. Local-time model. No stored time zone, so travel and DST changes shift how reminders are interpreted.
8. The dev tools password is hard-coded in `DevToolsOverlay.tsx`.
9. Tutorial first launch does not yet match the confirmed requirement (show once on first launch). The "shown" keys (`reminderly-tutorial-*-shown`) are written but not read, so the tutorial opens on every app start. See [features/onboarding.md](./features/onboarding.md).

History: a dated technical review is kept at [archive/codebase-review-2026-10-12.md](./archive/codebase-review-2026-10-12.md).
