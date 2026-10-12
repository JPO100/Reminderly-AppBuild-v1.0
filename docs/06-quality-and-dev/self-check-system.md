# Self-Check System

## Overview

Reminderly includes a deterministic self-check system that validates core business logic without mounting React components. The suite runs entirely in memory and is exposed through Dev tools → `Automated tests`.

## Architecture

### Check Runner

`src/app/dev/check-system.ts` provides the runner and report formatting layer.

Checks are registered as named pure functions and executed in a single run report. The automated tests page then groups and displays the results by section label.

### Aggregation

The current aggregation lives in `src/app/components/DevToolsOverlay.tsx`. The `Run self-checks` action builds the full run by concatenating the outputs of:

- `getScheduleChecks()`
- `getReminderChecks()`
- `getNlcParserChecks()`
- `getNlcInteractionChecks()`
- `getDoneDeletedChecks()`
- `getCompletionChecks()`
- `getListChecks()`
- `getDevToolsChecks()`
- `getNotificationChecks()`
- `getSettingsChecks()`

## Current Check Suites

Reminderly currently has 10 suites and 354 checks (2026-10-12).

| Suite | File | Checks | Scope |
| --- | --- | ---: | --- |
| Schedule and reminder logic | `src/app/dev/schedule-checks.ts` | 37 | Schedule equality, delta detection, and derived schedule helpers |
| Persistence and hydration | `src/app/dev/reminder-checks.ts` | 90 | Reminder loading, validation, migration, categorisation, sorting, labels, overdue logic, rendering, and calendar view |
| Natural language parsing | `src/app/dev/nlc-parser-checks.ts` | 61 | Token recognition and parser hardening |
| Natural language interaction | `src/app/dev/nlc-interaction-checks.ts` | 48 | Token application, auto-apply behaviour, invalidation, and resolved schedule output |
| Done, deleted, and completion | `src/app/dev/done-deleted-checks.ts` | 9 | Done/deleted view logic, filters, restore behaviour, ordering, and cleanup rules |
| Done, deleted, and completion | `src/app/dev/completion-checks.ts` | 14 | Completion flows, repeat rescheduling, uncomplete handling, and completion guards |
| Lists and smart reminders | `src/app/dev/list-checks.ts` | 26 | List persistence, smart reminder state, list lifecycle, pinning, templates, and empty-state behaviour |
| Dev tools and feature flags | `src/app/dev/dev-tools-checks.ts` | 1 | Dev tools settings defaults through the real settings path |
| Notification and badge | `src/app/dev/notification-checks.ts` | 31 | Badge count, notification payload, scheduling limits, midnight notification, refresh boundary, lock screen widget progress |
| Settings foundation | `src/app/dev/settings-checks.ts` | 37 | Settings migration, stored settings, resolver, last-module guard, repeat flag, haptics, sounds, lock screen widget and calendar flags |

## Automated Tests Page

The `Automated tests` page currently provides:

- a `Run self-checks` action
- grouped pass/fail output
- run invocation id
- total pass/fail counts
- total duration
- a `Copy results` action
- a `Reset` action

Results are grouped by the labels injected at aggregation time:

- `Schedule and reminder logic`
- `Persistence and hydration`
- `Natural language parsing`
- `Natural language interaction`
- `Done, deleted, and completion`
- `Lists and smart reminders`
- `Dev tools and feature flags`
- `Notification and badge`
- `Settings foundation`

## Coverage Shape

The current suite covers:

- reminder schedule and persistence logic
- reminder categorisation and sorting
- reminder title and subtitle rendering helpers
- NLC parsing and interaction flows
- done, deleted, restore, and completion flows
- list lifecycle, pinning, templates, and smart reminders
- developer settings defaults and feature flags
- badge, notification scheduling and lock screen widget progress
- settings migration, stored settings and the feature resolver
- calendar grid, dots, filter ranges, day lists, month navigation and New reminder date

The system does not mount UI components and does not validate animation timing, gesture handling, or layout behaviour.

## Baseline

Expected clean-run output is documented in `src/app/dev/BASELINE.md`.

The current documented baseline target is:

- 354 passed
- 0 failed

## Test Philosophy

Current test design principles reflected in the suite:

1. **Pure logic first**: checks exercise extracted business logic rather than component trees.
2. **Deterministic inputs**: checks avoid randomness and uncontrolled time.
3. **Fast execution**: all runs stay in-memory with no network dependency.
4. **Feature-level coverage**: checks are organised around product behaviours rather than UI screens.
5. **Regression focus**: checks heavily cover persistence, migration, scheduling, and filter-state rules.

## Related Documentation

- [Dev Tools](./dev-tools.md)
- [Tests and Baselines](./tests-and-baselines.md)
- [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md)
