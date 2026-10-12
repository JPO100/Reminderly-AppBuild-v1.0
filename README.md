# Reminderly

A lightweight iPhone reminders and lists app. Built with React, TypeScript and Tailwind CSS, shipped to iOS with Capacitor. All data stays on the device.

Build an app, not a rocket ship.

## What it does

- Reminders with an optional date, time and repeat (hourly to yearly, or chosen weekdays), grouped as Today, This week, Later and Sometime. Overdue reminders are highlighted and pinned to the top.
- Done and deleted archive with restore and Clear all.
- Lists with progress categories, pinning, templates and smart reminders that link a list to a reminder.
- Natural language capture: dates, times and repeats picked out of the text as you type ("tomorrow at 3pm", "every Monday"). Deterministic, no AI.
- Local notifications with Mark as done and Move to tomorrow actions, an app icon badge, a lock screen widget and a Siri shortcut.
- Optional calendar view, haptics and click sounds, and an animated tutorial.
- Hidden dev tools for feature flags, test data and the in-app Self Check suite.

Features are controlled by flags; see [docs/features/settings.md](./docs/features/settings.md).

## Quick start

```bash
npm install          # also applies the local notifications patch
npm run dev          # browser preview (native features unavailable)
npm run test         # Vitest
npx vite build && npx cap copy ios && open ios/App/App.xcodeproj
```

Full instructions: [docs/development.md](./docs/development.md).

## Documentation

| Document | Contents |
|----------|----------|
| [docs/architecture.md](./docs/architecture.md) | Stack, structure, state, data model, storage, conventions, known constraints |
| [docs/development.md](./docs/development.md) | Setup, commands, iOS build, dev tools, testing, baselines |
| [docs/ios.md](./docs/ios.md) | Native layer: Siri, widget, notifications patch, project settings |
| [docs/design.md](./docs/design.md) | Colours, typography, spacing, panel and overlay standards |
| [docs/features/reminders.md](./docs/features/reminders.md) | Reminder list, filters, lifecycle, archive, overlays |
| [docs/features/scheduling-and-nlc.md](./docs/features/scheduling-and-nlc.md) | Dates, times, repeats, calendar view, natural language capture, text normalisation |
| [docs/features/notifications.md](./docs/features/notifications.md) | Notifications, badge, actions |
| [docs/features/lists.md](./docs/features/lists.md) | Lists, templates, pinning, smart reminders |
| [docs/features/settings.md](./docs/features/settings.md) | Feature flags, preferences, migration, settings panels |
| [docs/features/onboarding.md](./docs/features/onboarding.md) | Tutorial |
| [docs/settings-flags-spec.md](./docs/settings-flags-spec.md) | Active settings specification (Phase 4 outstanding) |
| [docs/release-readiness.md](./docs/release-readiness.md) | Living App Store release readiness plan and checklist |
| [docs/plans/](./docs/plans/) | Planned features not yet built |
| [docs/development-history.md](./docs/development-history.md) | Authoritative project history |
| [docs/archive/](./docs/archive/) | Dated reviews, completed plans and audits, kept for reference |

`Claude.md` holds the working rules for AI-assisted development. `ATTRIBUTIONS.md` holds third-party licence notices.

## Keeping docs current

- Update the relevant feature document in the same change as the behaviour it describes.
- Record completed features, merges and significant fixes in `docs/development-history.md`.
- Put new feature plans in `docs/plans/`; when built, fold the current behaviour into the feature document and move the plan to `docs/archive/`.
