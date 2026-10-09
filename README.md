# Reminderly

A lightweight reminders app. This is a reminders app, not a framework.

Built with React, TypeScript, and Tailwind CSS. Designed for simplicity over abstraction.

## Overview

Reminderly is a mobile-first reminders application targeting iPhone 16 Pro (402x874px), responsive across all devices. Core features include natural language capture, recurring reminders, filter system, done/delete workflows, and localStorage persistence.

For detailed feature documentation, see [docs/README.md](./docs/README.md).

## Project structure

Core logic lives in three places:

- `src/app/App.tsx` - primary state and orchestration
- `src/app/reminder-utils.ts` - categorisation, overdue, sorting, persistence sanitisation
- `src/app/utils/` - NLC and helper logic

```
src/
  app/
    App.tsx                     # Main component - state, rendering, core logic
    reminder-utils.ts           # Non-component exports
    components/
      DevToolsOverlay.tsx
      ReminderInfoOverlay.tsx
      RepeatsOverlay.tsx
      figma/
        ImageWithFallback.tsx
      ui/                       # Platform-managed, unused (see below)
    dev/                        # Self-checks and debug tools
    types/
      reminder.ts               # RepeatRule, Schedule, ScheduleSources
    utils/
      nlc-parser.ts             # NLC token parser (regex-based)
      nlc-interaction.ts        # NLC interaction logic
      normalise-text.ts         # Display text normalisation
      render-text.ts            # today/tomorrow substitution
      schedule.ts               # Schedule equality, delta, date utilities
      dummy-generator.ts        # Dummy reminder data generator
  imports/
    NewReminderOverlay.tsx
    TimePicker.tsx
    DevTools.tsx
    DummyReminders.tsx
    LaterBtn.tsx
    svg-*.ts                    # SVG path data
  styles/
    fonts.css
    index.css
    tailwind.css
    theme.css

docs/                           # Detailed documentation
  README.md                     # Full feature and architecture docs
  build-guide.md
  calendar-module.md
  colour-styles.md
  component-hierarchy.md
  and others...
```

## Platform constraints

### src/app/components/ui

The `src/app/components/ui` folder is platform-managed by Figma Make. It contains 48 shadcn/ui component files.

- Reminderly application code does not import or use any of them.
- They must not be imported or modified.
- They cannot be deleted in the Figma Make environment.
- They remain present solely due to platform scaffolding and protection.

In a normal git environment, the folder can be removed with `rm -rf src/app/components/ui`.

### ATTRIBUTIONS.md

ATTRIBUTIONS.md is platform-protected and cannot be edited in Figma Make. See Ticket 7 (blocked) for context.

## Development

```
npm run dev      # Start development server
npm run build    # Production build
npm run test     # Run tests
```

## Rules of engagement

### Dependencies

Do not remove dependencies unless:

1. They are unused repo-wide, including platform-managed folders, and
2. A build can be verified in the target environment.

### Code changes

All changes follow the constraints in [Claude.md](./Claude.md):

- Surgical changes only - smallest safe change set.
- No taste refactors, no "while I'm here" improvements.
- Preserve existing UX and motion behaviour.
- No unintended changes to behaviour, styling, or timing.

### Documentation

Detailed docs live in [docs/](./docs/). The root README.md (this file) is the single authoritative entry point.
