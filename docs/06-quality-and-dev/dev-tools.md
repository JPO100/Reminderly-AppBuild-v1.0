# Dev Tools

See [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md) for the structure, controls and storage keys.

## Overview

Reminderly includes a built-in developer tools overlay opened by triple-tapping the header logo text. It is grouped into:

- Feature flags: what is available to the user
- Config: app behaviour set by us
- Testing tools: self checks, dummy data and tutorial testing
- Access and diagnostics: dev tools password

Decision (2026-10-11 12:23 BST, John, product owner): Dev tools controls availability only. Users manage their own preferences for whatever is available, in Reminders and Lists settings. Dev tools holds no user preference controls.

## Self-Check Suite

See [Self-Check System](./self-check-system.md). The current suite runs 361 checks across 10 sections, including the Settings foundation section (desktop browser, 2026-10-11).

## Related Documentation

- [Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md)
- [Settings and feature flags specification](../settings-flags-spec.md)
- [Self-Check System](./self-check-system.md)
- [Tests and Baselines](./tests-and-baselines.md)
