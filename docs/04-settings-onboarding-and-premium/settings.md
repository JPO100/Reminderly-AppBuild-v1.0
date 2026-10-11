# Settings

See [Settings Overlay](../01-core-surfaces/settings-overlay.md).

The legacy settings overlay and its `Show date and time subtitles` setting, tutorial row and premium section were removed on branch `feature/lists-disabled-ui-refinement`.

The separate header settings button (Dev Tools `Settings menu` toggle) and its Reminders and Lists settings panels are unaffected. The header Reminders settings panel includes a `Reminderly tutorial` row (shown when the onboarding tutorial is enabled) that re-runs the tutorial from its first page.

## Availability and preferences

Decision (2026-10-11 12:23 BST, John, product owner): Dev tools controls availability only - what is and is not available to the user. Users manage their own preferences for whatever is available, in Reminders and Lists settings. Dev tools holds no user preference controls, including temporary ones. See [Settings and feature flags specification](../settings-flags-spec.md).

## Related Documentation

- [Settings Overlay](../01-core-surfaces/settings-overlay.md)
- [Premium UI](./premium-ui.md)
- [Onboarding and Tutorial](./onboarding-and-tutorial.md)
