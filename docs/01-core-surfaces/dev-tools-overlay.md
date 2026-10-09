# Dev Tools Overlay

## Overview

Reminderly includes a built-in developer tools overlay opened by triple-tapping the text portion of the header logo. The overlay is a multi-page slide-up surface used for testing, data generation, feature-flag control, and tutorial/dev access settings.

## Access

The logo hit area is split:

- left portion toggles the done/deleted reminder surface
- text portion increments the dev tools tap counter

Dev tools open after three taps on the text portion within the reset timeout window.

## Password Gating

Dev tools can require a password before the main content is shown.

### State

- `isDevToolsPasswordRequired`: persisted setting
- `isDevToolsUnlocked`: session-only unlock state

### Persistence

- localStorage key: `reminderly-dev-tools-password-required`
- default: `true`

### Behaviour

- when password protection is required and the session is locked, the overlay opens to the password screen
- when protection is required and already unlocked in the current session, normal content is shown
- when protection is disabled, normal content is shown immediately
- unlock state resets on refresh/reload

The current unlock password is implemented in `DevToolsOverlay.tsx`.

## Overlay Behaviour

- slide-up motion from the bottom of the viewport
- backdrop tap closes the overlay
- close button closes the overlay
- internal navigation is page-based rather than route-based

## Navigation Structure

`DevToolsPage` currently supports:

- `home`
- `tests`
- `test-data`
- `dummy-reminders`
- `dummy-lists`
- `nlc`
- `onboarding-tutorial`
- `dev-tools-password`
- `reminder-settings`
- `list-settings`
- `paywall`

## Home Page

The home page is grouped into three sections.

### Testing and QA

- `Automated tests`
- `Test data`

### Developer settings

- `Reminder settings`
- `List settings`
- `Dev tools password`

`List settings` is visually disabled unless the top-level lists feature flag is enabled.

### Feature flags

- `Natural Language Capture`
- `Repeat reminders`
- `Onboarding tutorial`
- `Lists`
- `Premium`

The `Natural Language Capture`, `Onboarding tutorial`, and `Lists` rows each include both a toggle and page navigation.  
The `Repeat reminders` row is currently a visual toggle on the home page only.  
The `Premium` row navigates to the current `paywall` page, which presently renders the same `Lists` page component.

## Page Behaviour

### Automated Tests

Runs the full self-check suite and shows:

- run invocation id
- pass/fail counts
- duration
- grouped per-check results
- copy results action
- reset action

The current suite contains 8 groups and 425 checks in total.

### Test Data

Parent page for generated test content:

- `Dummy reminders`
- `Dummy lists`

### Dummy Reminders

Used to generate reminder data for reminder-state testing. This page also includes the `Hide overdue reminders` toggle.

### Dummy Lists

Used to generate list data for list-state testing. The page feeds generated list payloads back into app state rather than working as a read-only preview.

### Natural Language Capture

Controls NLC application mode:

- `Auto-parsing`
- `Click-parsing`

This page is only practically useful when the NLC feature flag is enabled.

### Onboarding Tutorial

Controls tutorial-related persisted state:

- `Show tutorial on first launch`
- `Show tutorial on every app start`

Enabling one setting disables the other.

### Dev Tools Password

Controls dev-tools access requirements:

- `Password required`
- password reset inputs
- confirm/reset flow UI

### Reminder Settings

Current reminder-specific dev setting:

- `Display 1 minute time increments`

Persistence key:

- `reminderly-dev-one-minute-time-increments`

### List Settings

Current list-specific dev setting:

- `Use default templates in clean state`

This controls whether a clean lists state is repopulated with default templates.

### Lists

The current lists page inside dev tools controls:

- `Smart reminders`
- `List templates`
- `Pinned lists`

These are feature flags for the current lists system and are persisted by the app.

## Dev-Only State and Flags

The overlay currently controls a mix of in-memory state and persisted settings.

### In-memory only

- `nlcMode`
- `hideOverdue`
- `isDevToolsUnlocked`

### Persisted

- `reminderly-dev-tools-password-required`
- `reminderly-dev-one-minute-time-increments`
- `reminderly-ff-onboarding-tutorial`
- `dev.listsEnabled`
- `reminderly-ff-tutorial-first-launch`
- `reminderly-ff-tutorial-every-start`
- `reminderly-ff-smart-reminders`
- `reminderly-ff-saved-lists`
- `reminderly-ff-pinned-lists`

## Destructive Actions

The developer tools home screen still includes the `Clear reminders list` destructive control with two-step confirmation:

1. `Clear reminders list`
2. `Are you sure?`
3. `Cleared!`

## File Locations

- `src/app/components/DevToolsOverlay.tsx`
- `src/imports/DevTools.tsx`
- `src/imports/DummyReminders.tsx`
- `src/imports/DummyLists.tsx`
- `src/app/dev/check-system.ts`
- `src/app/dev/*.ts`

## Related Documentation

- [Dev Tools](../06-quality-and-dev/dev-tools.md)
- [Self-Check System](../06-quality-and-dev/self-check-system.md)
- [Tests and Baselines](../06-quality-and-dev/tests-and-baselines.md)
