# Lock screen widget - scope and implementation plan

Status: implemented on `feature/lock-screen-widget`; deployed to simulator and iPhone; awaiting lock screen visual check.

## Summary

A circular lock screen widget showing today's reminders at a glance.

- Number in the centre: outstanding reminders (due today or overdue, not yet done).
- Arc: completed as a proportion of the total workload.
- Reminderly tick at the bottom.
- Tap opens the app. No actions from the widget.

## States

| State | Number | Arc |
| --- | --- | --- |
| None done (3 due) | 3 | Empty |
| Some done (2 of 3) | 1 | Two thirds |
| All done | 0 | Full |
| Nothing due | 0 | Full |

## Counting rules

- Outstanding = active reminders (not done, not deleted) scheduled today or overdue.
- Done = reminders completed today (completedAt is today), not deleted, that were scheduled today or earlier.
- Total = outstanding + done.
- Progress = done / total. When total is 0, progress is full.
- Sometime, future-dated and deleted reminders are excluded.
- Recurring reminders: existing behaviour unchanged. Completing one sets completedAt on the original and spawns the next occurrence. Known v1 limitation: an hourly repeat spawns a new occurrence for today, which adds to outstanding. Accepted for v1.

## In scope

- One widget: circular lock screen widget (accessoryCircular), iOS 16+.
- SwiftUI open arc (two trimmed circles) on the system accessory background. The system circular `Gauge` style uses a marker rather than a fill, so the arc is drawn directly; iOS still tints it for the lock screen.
- Tick: supplied SVG in the widget asset catalog, template rendering, preserve vector data.
- Snapshot refreshed whenever reminders are created, completed, edited or deleted, and on app resume.
- Widget timeline includes a midnight entry. iOS decides when the widget actually redraws.

## Feature flag

- Dev tools > System > Lock screen widget (`reminderly-ff-lock-screen-widget`), default on. No user-facing setting.
- Off: stop publishing, clear shared data, widget shows a neutral empty state (track arc and tick, no number). Reminders unaffected.
- On: publish current data again.

## Out of scope

- Home screen widgets, other lock screen sizes.
- Complete or snooze from the widget.
- Settings or toggles for the widget.
- Any change to reminder, recurrence, notification or badge logic.

## Approach

The widget cannot read the app's localStorage, so the app writes a small snapshot to shared storage that the widget reads.

1. App Group `group.com.reminderly.app` on the app and the widget extension.
2. Widget extension: WidgetKit target with one circular widget. It reads the snapshot from the App Group. If the snapshot date is not today, it shows outstanding + dueTomorrow with done reset to 0 until the app next runs.
3. Bridge: local Capacitor plugin `WidgetBridge` in the App target with one method, `setSnapshot`, which writes to the App Group and calls `WidgetCenter.shared.reloadAllTimelines()`.
4. App: pure function `getTodayProgress(reminders, now)` in `reminder-utils.ts`, and one effect in `App.tsx` that sends the snapshot when reminders change and on app resume. No-op on web.
5. Midnight: the timeline ends with an entry at the next midnight.

## Testing

- Self Check: checks for `getTodayProgress` covering the four states, overdue, deleted, sometime, future-dated and a completed repeating reminder.
- Physical iPhone: add the widget; create, complete, edit and delete reminders and confirm the widget updates; relaunch the app; confirm midnight rollover.
- Regression: completion, recurring reminders, notifications and badge counts behave as before.
- Build and deploy to simulator and iPhone when complete.

## Documentation

- Short section in `docs/08-ios/implementation.md` when done.
- Development history entry for the branch.
