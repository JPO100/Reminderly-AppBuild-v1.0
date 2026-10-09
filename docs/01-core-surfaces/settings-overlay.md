# Settings Overlay

## Status

Removed on branch `feature/lists-disabled-ui-refinement`.

The legacy settings bottom sheet (`src/app/components/SettingsOverlay.tsx`) no longer exists. Its contents were removed with it:

- the `Show date and time subtitles` setting (`reminderly.showDateAndTimeSubtitles`)
- the `Reminderly tutorial` row
- the premium marketing section

It was opened from the settings cog in the filter row (`LaterBtn-146-39`), which was only shown with the grouped filters layout. That cog and the grouped filters layout have also been removed.

The separate header settings button (Dev Tools `Settings menu` toggle) and its Reminders and Lists settings panels are unaffected. Tutorial re-run access now lives in the header Reminders settings panel (`Reminderly tutorial` row, shown when the onboarding tutorial is enabled).

## Related Documentation

- [Tutorial Overlay](./tutorial-overlay.md)
- [Premium UI](../04-settings-onboarding-and-premium/premium-ui.md)
