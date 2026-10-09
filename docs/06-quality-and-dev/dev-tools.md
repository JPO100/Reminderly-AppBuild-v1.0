# Dev Tools

See [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md) for the UI structure and page-by-page behaviour.

## Overview

Reminderly includes a built-in developer tools system that opens from the header logo triple-tap gesture. The overlay is used for:

- running the self-check suite
- generating dummy reminders and dummy lists
- switching dev-only reminder and filter settings
- toggling feature flags that gate in-progress product surfaces
- controlling tutorial and dev-tools access behaviour

## Current Features

- **Automated tests**: Runs the full self-check suite from the `Automated tests` page
- **Test data**: Parent page that links to dummy reminder and dummy list generation
- **Dummy reminders**: Generates reminders for category and state testing
- **Dummy lists**: Generates lists for active, done, deleted, pinned, smart reminder, and template-related testing
- **Natural Language Capture**: Switches between auto-parsing and click-parsing NLC modes
- **Reminder settings**: Controls one-minute time increments for time selection UI
- **List settings**: Controls whether a clean lists state is repopulated with default templates
- **Onboarding tutorial**: Controls tutorial feature state and tutorial launch behaviour
- **Dev tools password**: Controls whether the dev tools overlay requires a password
- **Lists feature flags**: Controls smart reminders, list templates, and pinned lists

## Dev-Only State

State used by the developer tools and associated experiments:

| State | Type | Default | Persistence | Purpose |
| --- | --- | --- | --- | --- |
| `nlcMode` | `'click' \| 'auto'` | `'auto'` | In-memory only | Controls NLC token application mode |
| `hideOverdue` | `boolean` | `false` | In-memory only | Hides overdue reminders from rendered reminder lists |
| `isDevToolsUnlocked` | `boolean` | `false` | In-memory only | Session unlock state after password entry |

These values affect debugging and exploration only. They are not production user settings.

## Persisted Dev Tool Toggles

The overlay also controls a number of persisted settings and feature flags:

| Setting | localStorage key |
| --- | --- |
| Dev tools password required | `reminderly-dev-tools-password-required` |
| One-minute time increments | `reminderly-dev-one-minute-time-increments` |
| Onboarding tutorial feature flag | `reminderly-ff-onboarding-tutorial` |
| Lists feature flag | `dev.listsEnabled` |
| Tutorial on first launch | `reminderly-ff-tutorial-first-launch` |
| Tutorial on every app start | `reminderly-ff-tutorial-every-start` |
| Smart reminders feature flag | `reminderly-ff-smart-reminders` |
| Saved lists / templates feature flag | `reminderly-ff-saved-lists` |
| Pinned lists feature flag | `reminderly-ff-pinned-lists` |

The `Use default templates in clean state` toggle is also persisted, but its storage key is defined in `App.tsx` rather than repeated directly in this document.

## Self-Check Suite

See [Self-Check System](./self-check-system.md) for the complete test runner and suite documentation.

Current self-check inventory:

- 8 suites
- 425 checks total

## Related Documentation

- [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md)
- [Self-Check System](./self-check-system.md)
- [Tests and Baselines](./tests-and-baselines.md)
