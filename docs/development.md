# Development

How to set up, run, test, build and deploy Reminderly. Working rules for changes are in `Claude.md`. Architecture is in [architecture.md](./architecture.md).

## Setup

Prerequisites: Node.js (current LTS or later), npm, Xcode with the iOS SDK, and an Apple developer account for device builds.

```bash
npm install          # also runs patch-package (applies patches/@capacitor+local-notifications+8.0.2.patch)
```

The repository uses npm (`package-lock.json`). There is no `tsconfig.json` and TypeScript is not installed as a dependency; Vite transpiles TypeScript without type-checking.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server in a desktop browser. Native features (notifications, badge, haptics, widget, Siri) are unavailable and fail silently |
| `npm run test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run build` | Production web build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run guard:repo` | Prints a warning that `src/app/components/ui` must not be imported |

## iOS build and deploy

Build the web assets, copy them into the native project, then build in Xcode:

```bash
npx vite build
npx cap copy ios
open ios/App/App.xcodeproj
```

In Xcode: Product > Clean Build Folder, then Product > Run.

Notes:

- `npx cap copy ios` copies `dist/` into `ios/App/App/public`. Use `npx cap sync ios` only when Capacitor plugins or their versions change, as it also updates the Swift package (`ios/App/CapApp-SPM`).
- Open `App.xcodeproj`, not a workspace. The project uses Swift Package Manager; there is no CocoaPods workspace.
- Command-line build, install and launch for the simulator and a physical iPhone (`xcodebuild`, `xcrun simctl`, `xcrun devicectl`) are listed in `Claude.md`.
- Do not change signing, provisioning or bundle identifiers without approval. Identifiers are in [ios.md](./ios.md).

## Dev tools

Hidden developer overlay, opened by tapping the text portion of the header logo three times, each tap within 500ms of the previous one. The tick on the left of the logo toggles the done/deleted view instead.

Decision (2026-10-11, John, product owner): dev tools control availability only - what is and is not available to the user. Users manage their own preferences in the Reminders and Lists settings panels. Dev tools hold no user preference controls.

### Access

- Password gate: `reminderly-dev-tools-password-required` (default on). Unlock lasts for the session only.
- The password is hard-coded in `src/app/components/DevToolsOverlay.tsx`.

### Pages

| Group | Page | Controls and storage keys |
|-------|------|---------------------------|
| Feature flags | Reminders (master) | Enable reminders `reminderly-ff-reminders`; Repeat reminders `reminderly-ff-repeat-reminders`; 1 minute time increments `reminderly-ff-one-minute-increments`; Calendar `reminderly-ff-calendar` |
| | Lists (master) | Enable lists `reminderly-ff-lists`; Smart reminders `reminderly-ff-smart-reminders`; List templates `reminderly-ff-saved-lists`; Pinned lists `reminderly-ff-pinned-lists` |
| | Natural Language | Enable Natural Language Capture `reminderly-ff-nlc` |
| | Notifications | Enable notifications `reminderly-ff-notifications` (stored, not yet read by scheduling; Phase 4) |
| | Siri shortcuts | Siri for reminders `reminderly-ff-siri-reminders` |
| | Onboarding | Enable onboarding `reminderly-ff-onboarding-tutorial`; Show tutorial on first launch `reminderly-config-tutorial-first-launch` |
| | System | Settings menu `reminderly-ff-settings-menu-v2`; Haptics `reminderly-ff-haptics`; Sounds `reminderly-ff-sounds`; Lock screen widget `reminderly-ff-lock-screen-widget`; Show info icons `reminderly-ff-info-icons` |
| Config tools | Lists | Use template set in clean state `reminderly-config-templates-in-clean-state`: restores the default templates when all lists are cleared |
| Testing tools | Self checks | Runs the Self Check suite |
| | Dummy reminders | Generates reminder data; Hide overdue reminders (in-memory only). Needs Reminders on |
| | Dummy lists | Generates list data. Needs Lists on |
| | Show tutorial on every app start | `reminderly-test-tutorial-every-start`; mutually exclusive with Show tutorial on first launch |
| Access | Dev tools password | Password required toggle and password reset |

- Turning a master flag on or off asks for confirmation.
- Reminders and Lists cannot both be off; the last one on shows "One module must stay on" (`canChangeModuleFlag` in `src/app/settings/resolver.ts`).
- Unbuilt features (Siri for lists, NLC phone and contact recognition, paywall) have flags in `SETTINGS_DEFAULTS` but no dev tools row.

Files: `src/app/components/DevToolsOverlay.tsx`, `src/imports/DevTools.tsx` (home page), `src/imports/DummyReminders.tsx`, `src/imports/DummyLists.tsx`, `src/app/utils/dummy-generator.ts`, `src/app/utils/dummy-list-generator.ts`.

## Testing

Reminderly has two complementary test layers. Neither mounts React components, so neither covers gestures, animation, layout, overlay transitions or native iOS behaviour. Those are verified manually on the simulator and a physical iPhone.

### Vitest

`src/app/__tests__/` (9 files). Capacitor plugins are mocked with `vi.mock`.

| File | Covers |
|------|--------|
| `add-reminder-validation.test.ts` | Add reminder validation |
| `calendar.test.ts` | Calendar grid, categories, filter ranges, dots, day lists, month navigation, New reminder date |
| `delete.test.ts` | Delete and done/deleted view filters |
| `notifications.test.ts` | Badge count, notification payload, badge delta, scheduling limits, midnight badge, refresh boundary |
| `reminders-off-notifications.test.ts` | Clearing notifications when Reminders is off |
| `settings.test.ts` | Settings foundation, no legacy keys in active code, dev tools controls |
| `sounds.test.ts` | Click sounds and haptics interaction |
| `tutorial-pages.test.ts` | Tutorial page sequences |
| `widget.test.ts` | Widget bridge sync |

`vite.config.ts` excludes `.claude/**` so worktree copies are not run.

### Self Check

An in-app suite of deterministic checks over the pure logic, run from Dev tools > Testing tools > Self checks. The runner is `src/app/dev/check-system.ts`; suites are aggregated in `DevToolsOverlay.tsx`. Duplicate check ids fail the run immediately.

| Section | File | Scope |
|---------|------|-------|
| Schedule and reminder logic | `schedule-checks.ts` | Schedule equality, deltas, derived values |
| Persistence and hydration | `reminder-checks.ts` | Loading, migration, categorisation, sorting, labels, overdue, rendering, calendar |
| Natural language parsing | `nlc-parser-checks.ts` | Token recognition and hardening |
| Natural language interaction | `nlc-interaction-checks.ts` | Token application, auto-apply, invalidation |
| Done, deleted, and completion | `done-deleted-checks.ts`, `completion-checks.ts` | Archive views, restore, completion, repeat rescheduling |
| Lists and smart reminders | `list-checks.ts` | Lists, templates, pinning, smart reminders |
| Dev tools and feature flags | `dev-tools-checks.ts` | Dev tools defaults through the real settings path |
| Notification and badge | `notification-checks.ts` | Badge, payloads, limits, midnight badge, refresh boundary, widget progress |
| Settings foundation | `settings-checks.ts` | Migration, stored settings, resolver, module guard, haptics, sounds, widget and calendar flags |

The page shows pass and fail counts, duration, grouped results and per-check errors, with Copy results and Reset.

### Baselines

Current expected counts and the full clean-run output are in `src/app/dev/BASELINE.md`. When checks or tests are added or removed, update `BASELINE.md` and record the change in [development-history.md](./development-history.md).

### Manual checks

For UI changes, check the affected screens on the simulator and a physical iPhone, including a small screen (iPhone SE width 320-375pt, height 667pt) and the design size (402 x 874). Check pill states, transitions, text truncation and scrolling.

## Verification expectations

`Claude.md` sets the verification required for each type of change (Type A, B, C) and the protected areas that always need targeted checks (notifications, badge, dates and times, repeats, completion, deletion, lifecycle, persistence).

## Troubleshooting

- Styles not applying: check Tailwind class spelling and arbitrary values; clear the Vite cache with `rm -rf node_modules/.vite`.
- Stale app on device: rebuild with `npx vite build` and `npx cap copy ios`, then Clean Build Folder in Xcode.
- Notification or badge behaviour wrong after updating Capacitor: confirm `patch-package` applied the local notifications patch (see [ios.md](./ios.md)).
