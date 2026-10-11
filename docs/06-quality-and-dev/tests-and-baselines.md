# Tests and Baselines

## Current Test Coverage

Reminderly currently has **366 self-checks across 10 suites** (shown in 9 sections; the two done, deleted and completion suites share one), plus **120 Vitest tests** (2026-10-11).

| Suite | Checks | Focus |
| --- | ---: | --- |
| Schedule and reminder logic | 37 | Schedule helpers and derived schedule state |
| Persistence and hydration | 84 | Reminder validation, migration, persistence, categorisation, sorting, labels, overdue logic, and rendering |
| Natural language parsing | 61 | Parser token recognition and hardening |
| Natural language interaction | 48 | Token application and auto-apply behaviour |
| Done, deleted, and completion | 9 | Done/deleted views, restore paths, ordering, and cleanup |
| Done, deleted, and completion | 14 | Completion logic and repeat rescheduling |
| Lists and smart reminders | 26 | Lists, templates, smart reminders, pinning, and list state rules |
| Dev tools and feature flags | 33 | Developer settings and feature-flag behaviour |
| Notification and badge | 22 | Badge count, notification payload, scheduling limits, midnight notification |
| Settings foundation | 32 | Settings migration, single source of truth, flags and preferences, repeat flag, haptics |

## Baseline Output

Expected clean-run output is tracked in `src/app/dev/BASELINE.md`.

### Clean Run Characteristics

- all 366 checks pass
- failed count is 0
- run invocation id varies per execution
- duration varies per execution
- output ordering is stable because the suite aggregation order is fixed

## Test Shape

The current self-checks are:

- pure-function driven
- in-memory only
- synchronous from the point of view of the UI runner
- grouped into labelled sections for reporting

The tests do not mount React components and do not directly verify:

- gesture handling
- animations
- overlay transitions
- responsive layout behaviour
- native iOS shell behaviour

## Running Tests

### Via Dev Tools

1. Open Dev tools from the header logo gesture.
2. Open `Automated tests`.
3. Run `Run self-checks`.
4. Review grouped results or copy the report text.

### Result Output

The page currently displays:

- run invocation id
- passed count
- failed count
- run duration
- grouped result sections
- per-check error text when a check throws

## Baseline Maintenance

When the implementation changes, the baseline and documentation must stay aligned with:

- suite count
- total check count
- section labels shown in the automated tests page
- current focus of each suite

## Related Documentation

- [Self-Check System](./self-check-system.md)
- [Dev Tools](./dev-tools.md)
- [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md)
