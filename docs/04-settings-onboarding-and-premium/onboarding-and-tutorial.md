# Onboarding and Tutorial

## Overview

The tutorial system provides the reminders and lists onboarding flows. It can be re-run from the Reminders or Lists settings overlay (`Reminders tutorial` or `Lists tutorial` row, last in each) when the tutorial feature flag and the Dev Tools `Settings menu` toggle are enabled. Tutorial content mirrors the current feature configuration: the phone mock-ups hide the Reminders/Lists tab bar when Lists are disabled, and pages for disabled features are omitted.

The active reminders tutorial render path is:

`App.tsx` -> `TutorialOverlay.tsx` -> `TutorialOnboardingContent.tsx` -> `TutorialPhoneShell.tsx` -> `TutorialPhoneHeader.tsx` -> `TutorialMainTabBar.tsx` -> `TutorialReminderFilters.tsx` -> page body

Reminder tutorial pages are content-only. Shared components own the phone shell, header, tabs, and filters. No page renders a full phone UI layout.

## Reminders Tutorial Pages

The reminders tutorial has 5 base pages (indexed `0-4`). When the Dev Tools `Settings menu` feature flag is on, optional page 6 is included after page 5 and becomes the final reminders tutorial page.

1. **OnboardingPage1Content** (page 0) - "A tour of reminders" — reminder list build sequence showing grouped/coloured reminders
2. **OnboardingPage2Content** (page 1) - "Filter your reminders" — filter cycle with reminder list filtering demo
3. **OnboardingPage3Content** (page 2) - "Manage your reminders" — 3-dot menu attention throb circle + reminder info overlay demo
4. **OnboardingPage4Content** (page 3) - "Mark reminders as ‘done’" — done sequence animation completing reminders
5. **OnboardingPage5Content** (page 4) - "See what you’ve done" — Reminderly logo tick throb showing the Done reminders mini-list
6. **OnboardingPage6Content** (optional page 5) - "Re-run this tutorial" — static populated reminder mini-list; shown only when `settingsMenuEnabled` is true

## Lists Tutorial Pages

The lists tutorial is rendered by `ListsTutorialPlaceholderPage` inside `TutorialOnboardingContent.tsx`. It has 3 core pages (indexed `0-2`). Page 3 is included only when smart reminders are enabled, and page 4 only when saved lists are enabled. Visible pages are selected by `getTutorialPageIds` (`src/app/utils/tutorial-pages.ts`).

The tutorial variant is determined by the active tab when the tutorial opens: `activeMainTab === ‘lists’` opens the lists tutorial, otherwise the reminders tutorial opens. The variant is tracked by `tutorialVariant` state in `App.tsx`.

### Lists tutorial page titles and content

1. **Page 0** - "A tour of lists" — lists are grouped by colour and filtered in the same way as reminders. Uses the shared tutorial phone with list filter items.
2. **Page 1** - "Manage completed lists" — move finished lists to done and view completed lists. Logo tick highlight throb triggers a transition to the done lists view, then cycles back. Uses the same throb/pause pattern as reminders page 4.
3. **Page 2** - "View and edit lists" — quickly add, update, and organise lists. Opens a list editor overlay with a typing demo that inserts "Prepare update" into the "Work tasks" list. Add-button attention throb circle (50px), followed by auto-type at 80ms per character, item insertion with highlight, then a 2000ms post-insert pause before recycling.
4. **Page 3** (smart reminders only) - "Create smart reminders" — link lists to reminders so you never miss important tasks. Multi-phase smart reminder flow: 3-dot menu throb on target list → list settings overlay opens → smart reminders toggle activates → settings closes → tab switches to reminders → smart reminder sheet appears with tick-button throb (62px circle) → sheet closes → reminder inserts into reminder list. The tab switching between lists and reminders is unique to this page.
5. **Page 4** (saved lists only) - "Use list templates" — create lists from ready-made templates. Multi-phase template editor flow: templates button throb → templates panel opens showing 6 templates (Weekly food shop, Morning routine, Weekend tasks, Packing list, Spaghetti bolognese, Pancakes) → "Weekly food shop" row throb → template editor opens with 8 items (Milk, Bread, Eggs, Chicken, Rice, Bananas, Pasta, Butter) → typing demo inserts "Olive oil" → add-button throb → item added → menu-button throb → template settings overlay appears.

### Signed-off reminder tutorial pages 0-4

Reminders tutorial pages 0-4 are locked and signed off.

- Page 0 shows the shared reminder mini-list build sequence. It cycles with the existing row fade-in behaviour and waits 2000ms before restarting.
- Page 1 cycles the reminder filters and waits 2000ms before returning to the start of the filter loop.
- Page 2 shows the 3-dot menu attention throb, opens the scaled reminder info overlay, waits 2000ms after the full sequence, then restarts.
- Page 3 marks every non-`sometime` tutorial reminder as done, excludes `Organise family photo` from the completed set, and waits 2000ms before restarting. Its reset uses the same fade-in approach as page 0.
- Page 4 starts on the default mini-list filtered to `Organise family photo`, then uses the Reminderly logo tick throb to reveal the Done reminders list. The first visible logo tick throb starts after the shared 400ms animation delay; later state-to-state throbs wait 2000ms before starting. The Done reminders list contains only the reminders completed by page 3: `Put the bins out`, `Submit expenses`, `Pay credit card`, `Call the dentist`, and `Pick up milk`.

### Page 2 attention circle behaviour

OnboardingPage3Content displays a blue attention circle over the "Pick up milk" reminder's 3-dot menu button. The circle runs the shared 3-throb opacity keyframe sequence with `duration: 2.3`, `delay: 0.4`, `times: [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1]`, and `ease: "easeInOut"`. After the final throb fades out, the scaled reminder info overlay opens. The overlay title, due line, and button formatting mirrors the main app's `ReminderInfoOverlay` proportions at the tutorial overlay scale.

### Page 4 Done reminders behaviour

OnboardingPage5Content demonstrates the Done reminders view as a continuation of the page 3 done sequence.

- Default state: the active mini-list shows only `Organise family photo`.
- Initial main-list phase: the first Reminderly logo tick throb starts immediately from page load and becomes visible after the shared 400ms animation delay.
- Done state: the tab label changes to `Done reminders`, the logo tick changes to white fill with Reminderly blue tick, and the filter row changes to scaled `Done`, `Deleted`, and `Clear all` pills.
- Done mini-list: only page 3 completed reminders appear. The `sometime` reminder remains excluded, and row 3-dot menu buttons are hidden in this Done mini-list.
- Later phases: after the initial throb, each main-list or Done-list state pauses for 2000ms before the logo tick throb repeats and the view changes state.
- The Done / Deleted pills mirror the main app Done / Deleted controls scaled to the tutorial mini size: 31.5px pill height (45px app buttons at tutorial scale), 9.751px text, 11.144px side padding, and 66px `Clear all` width.

### Optional page 5 behaviour

OnboardingPage6Content is included only when the Dev Tools `Settings menu` feature flag is on.

- When `settingsMenuEnabled` is false, page 4 is the final reminders tutorial page.
- When `settingsMenuEnabled` is true, page 5 appears after page 4 and becomes the final reminders tutorial page.
- Page 5 copy is `Re-run this tutorial` with subtitle `You can re-run this tutorial from` / `the settings menu`.
- Page 5 has no animation, transition, highlight circle, overlay, timing sequence, or automatic state change.
- Page 5 shows the populated reminder mini-list inside the shared tutorial phone.

## Navigation

- **Page indicators**: Dynamic dot count based on the active flow (5 or 6 for reminders, 8 for lists), horizontally centred for the visible number of dots
- **Back button**: Navigate to previous page (hidden on page 0)
- **Next button**: Navigate to next page, or `Okay, got it` on the final visible page
- **Restart button**: Reset to page 0 (visible on the final visible page)

## Access

Via the "Reminders tutorial" row in the Reminders settings overlay or the "Lists tutorial" row in the Lists settings overlay, when `isOnboardingTutorialEnabled === true`.

## Feature Flag

```typescript
isOnboardingTutorialEnabled: boolean // in App.tsx
```

When false, TutorialOverlay returns null.

### Additional Tutorial Feature Flags

**Show Tutorial on First Launch**
- State: `showTutorialOnFirstLaunch: boolean`
- Persisted to: `localStorage` key `'reminderly-ff-tutorial-first-launch'`
- Default: `true`
- Controls whether tutorial automatically opens on first app launch

**Show Tutorial on Every Start**
- State: `showTutorialOnEveryStart: boolean`
- Persisted to: `localStorage` key `'reminderly-ff-tutorial-every-start'`
- Default: `false`
- Dev-only toggle: when enabled, tutorial opens on every app start

Both flags are controlled via DevTools and interact with the main `isOnboardingTutorialEnabled` flag.

## Shared Ownership

- `TutorialOnboardingContent.tsx` owns page selection, variant routing (reminders vs lists), shared shell usage, and page-specific shell/header/filter configuration. The lists tutorial pages are rendered by the `ListsTutorialPlaceholderPage` internal component.
- `TutorialPhoneShell.tsx` owns phone sizing, frame padding, shell colour, and bezel colour
- `TutorialPhoneHeader.tsx` owns shared header layout
- `TutorialMainTabBar.tsx` owns shared tabs (switches between reminders and lists tabs in the lists tutorial page 3 smart reminder flow)
- `TutorialReminderFilters.tsx` owns shared filter rendering, including done/deleted state handling
- `TutorialStaticReminderList.tsx` owns the default reminders tutorial mini-list data and rendering

## Default reminders tutorial mini-list

The shared default reminders tutorial mini-list lives in `TutorialStaticReminderList.tsx`.

Default items and groups:

1. Today: `Pick up milk`
2. Today: `Call the dentist`
3. This week: `Pay credit card`
4. Later: `Submit expenses`
5. Later: `Put the bins out`
6. Sometime: `Organise family photo`

Default formatting rules:

- Every non-`sometime` reminder has both a date and a time.
- Reminder subtitles are derived from the same formatting path used by the live app list.
- `Pay credit card` is the default monthly repeating reminder example.
- `Put the bins out` is the default weekly repeating reminder example.

## Responsive Behaviour

### Container
- Default height: 808px
- Below 570px: auto height

### Navigation
- Page dots hidden below 570px
- Special padding adjustments below 570px

## File Locations

- TutorialOverlay: `/src/app/components/TutorialOverlay.tsx`
- TutorialOnboardingContent: `/src/app/components/TutorialOnboardingContent.tsx`
- TutorialPhoneShell: `/src/app/components/TutorialPhoneShell.tsx`
- TutorialPhoneHeader: `/src/app/components/TutorialPhoneHeader.tsx`
- TutorialMainTabBar: `/src/app/components/TutorialMainTabBar.tsx`
- TutorialReminderFilters: `/src/app/components/TutorialReminderFilters.tsx`
- OnboardingPage[1-9]Content: `/src/app/components/OnboardingPage[1-9]Content.tsx`

## Related Documentation

- [Tutorial Overlay](../01-core-surfaces/tutorial-overlay.md) - Complete tutorial overlay documentation
- [Settings Overlay](../01-core-surfaces/settings-overlay.md) - Access point
