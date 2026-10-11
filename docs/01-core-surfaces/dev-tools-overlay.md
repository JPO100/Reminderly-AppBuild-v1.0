# Dev Tools Overlay

## Overview

Reminderly includes a built-in developer tools overlay opened by triple-tapping the text portion of the header logo. The overlay is a multi-page slide-up surface used to control feature availability, app configuration, testing tools and dev tools access.

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

## Purpose

Decision (2026-10-11 12:23 BST, John, product owner): Dev tools controls availability only - what is and is not available to the user. Users manage their own preferences for whatever is available, in Reminders and Lists settings. Dev tools holds no user preference controls.

See [Settings and feature flags specification](../settings-flags-spec.md) for the full model.

## Overlay Behaviour

- slide-up motion from the bottom of the viewport
- backdrop tap closes the overlay
- close button closes the overlay
- internal navigation is page-based rather than route-based

## Home Page

The home page has four groups.

### Feature flags

Availability flags. Rows with a toggle are master flags; turning one on or off asks for confirmation.

| Row | Page contents | Storage keys |
| --- | --- | --- |
| Reminders (master) | Enable reminders, Repeat reminders, 1 minute time increments | `reminderly-ff-reminders`, `reminderly-ff-repeat-reminders`, `reminderly-ff-one-minute-increments` |
| Lists (master) | Enable lists, Smart reminders, List templates, Pinned lists | `reminderly-ff-lists`, `reminderly-ff-smart-reminders`, `reminderly-ff-saved-lists`, `reminderly-ff-pinned-lists` |
| Natural Language Capture (master) | Enable Natural Language Capture | In-memory only until Phase 3 (`reminderly-ff-nlc`) |
| Notifications (master) | Enable notifications | `reminderly-ff-notifications` |
| Siri | Siri for reminders | `reminderly-ff-siri-reminders` |
| Onboarding (master) | Enable onboarding, Show tutorial on first launch | `reminderly-ff-onboarding-tutorial`, `reminderly-config-tutorial-first-launch` |
| System | Settings menu, Show info icons | `reminderly-ff-settings-menu-v2`, `reminderly-ff-info-icons` |

- Reminders and Lists cannot both be off. The last one on ignores the tap (`canChangeModuleFlag` in `src/app/settings/resolver.ts`).
- Not yet read by the app: Enable reminders, Repeat reminders and 1 minute time increments (Phase 3), Enable notifications (Phase 4).
- Unimplemented features (Siri for lists, phone and contact recognition) are hidden until built.

### Config

- Use template set in clean state (`reminderly-config-templates-in-clean-state`): when all lists are cleared, restores the default template set.

### Testing tools

- Self checks: runs the self-check suite (pass/fail counts, grouped results, copy, reset)
- Dummy reminders: generates reminder data; includes `Hide overdue reminders` (in-memory only). Requires Reminders on
- Dummy lists: generates list data. Requires Lists on
- Show tutorial on every app start (`reminderly-test-tutorial-every-start`): turning it on turns off Show tutorial on first launch, and the reverse

### Access and diagnostics

- Dev tools password: Password required toggle and password reset

## Storage

- Every setting has one authoritative key, read once and written only when changed (`useStoredSetting`).
- Settings write failures show the app's storage error banner.
- In-memory only: Natural Language Capture master, `hideOverdue`, `isDevToolsUnlocked`.

## File Locations

- `src/app/components/DevToolsOverlay.tsx`
- `src/imports/DevTools.tsx` (home page)
- `src/imports/DummyReminders.tsx`
- `src/imports/DummyLists.tsx`
- `src/app/settings/` (keys, resolver, migration, `useStoredSetting`)
- `src/app/dev/check-system.ts`, `src/app/dev/*.ts`

## Related Documentation

- [Dev Tools](../06-quality-and-dev/dev-tools.md)
- [Settings and feature flags specification](../settings-flags-spec.md)
- [Self-Check System](../06-quality-and-dev/self-check-system.md)
- [Tests and Baselines](../06-quality-and-dev/tests-and-baselines.md)
