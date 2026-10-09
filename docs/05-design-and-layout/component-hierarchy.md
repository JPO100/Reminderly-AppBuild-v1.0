# Component Hierarchy

## Root

- `src/app/App.tsx`

## Main Surface Groups

### Reminder surfaces

- reminder header and filters
- active reminder list
- done/deleted reminder archive
- new reminder button

### List surfaces

- reminder/list main-tab switch
- active lists surface
- list done/deleted surface
- saved templates panel

## Overlay / Modal Surfaces

- `NewReminderOverlay`
- `ReminderInfoOverlay`
- `RepeatsOverlay`
- `TutorialOverlay`
- `DevToolsOverlay`
- list info overlay
- deleted info overlay

### Tutorial hierarchy

- `App.tsx`
- `TutorialOverlay.tsx`
- `TutorialOnboardingContent.tsx`
- `TutorialPhoneShell.tsx`
- `TutorialPhoneHeader.tsx`
- `TutorialMainTabBar.tsx`
- `TutorialReminderFilters.tsx`
- `OnboardingPage1Content.tsx` through `OnboardingPage8Content.tsx` as content-only page bodies

## List-Specific Building Blocks

- `AddListItemInput`
- `EditableListItem`
- list header/imported list shell components

## Developer/Test Surfaces

- DevTools home
- Dummy reminders
- Dummy lists
- self-check runner UI

## Notes

- not all overlays share the same presentation pattern
- the app now contains both reminder and list product trees inside the same root component
- the reminders tutorial uses one shared shell/header/tabs/filter path; page components do not own full phone UI structure

## Related Documentation

- [Architecture](../../00-overview/architecture.md)
- [Lists Overview](../../07-lists/lists-overview.md)
- [Active reminder list](../../01-core-surfaces/active-list.md)
