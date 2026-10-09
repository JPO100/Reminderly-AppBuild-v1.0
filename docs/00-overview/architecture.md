# Architecture

## System Architecture

Reminderly uses a single-component architecture with App.tsx as the central state owner. All data flows through App.tsx and is distributed to child components via props.

## Component Hierarchy

```
App.tsx (root)
├── Header (inline)
│   ├── Logo (with done/deleted toggle and dev tools triple-tap)
│   └── Filter buttons
├── Active list view (conditional)
│   └── Reminder rows (motion.div with AnimatePresence)
├── Done/deleted view (conditional)
│   ├── Sub-filter buttons (Done, Deleted, back arrow)
│   ├── Clear all button (3-step confirmation)
│   └── Archive reminder rows
├── New reminder button
├── NewReminderOverlay (from /src/imports)
│   ├── Text input with NLC (3-layer architecture)
│   ├── Date toggle and picker
│   ├── Time toggle and TimePicker
│   └── Repeats toggle
├── ReminderInfoOverlay (/src/app/components)
│   ├── Title display
│   ├── Schedule display
│   ├── Edit button
│   ├── Done button
│   └── Delete button
├── RepeatsOverlay (/src/app/components)
│   ├── Frequency selector (hourly/daily/weekly/monthly/yearly/custom-days)
│   ├── Interval input
│   └── Day selection (custom-days only)
├── TutorialOverlay (/src/app/components)
│   └── TutorialOnboardingContent
│       └── OnboardingPage[1-8]Content components
└── DevToolsOverlay (/src/app/components)
    ├── DevTools home (/src/imports)
    ├── Automated tests page
    ├── Dummy reminders page (/src/imports/DummyReminders.tsx)
    └── NLC toggle page
```

## File Structure

```
/src
├── /app
│   ├── App.tsx                          # Main app component (state, rendering, core logic)
│   ├── reminder-utils.ts                # Non-component exports: types, loadReminders, categoriseReminder, sortReminders, isOverdue, formatRepeatLabel
│   ├── /components
│   │   ├── DevToolsOverlay.tsx          # DevTools overlay (triple-tap logo)
│   │   ├── NewReminderPopPage4.tsx      # Unused legacy component
│   │   ├── OnboardingPage1Content.tsx   # Tutorial page 1
│   │   ├── OnboardingPage2Content.tsx   # Tutorial page 2
│   │   ├── OnboardingPage3Content.tsx   # Tutorial page 3
│   │   ├── OnboardingPage4Content.tsx   # Tutorial page 4
│   │   ├── OnboardingPage5Content.tsx   # Tutorial page 5
│   │   ├── OnboardingPage6Content.tsx   # Tutorial page 6
│   │   ├── OnboardingPage7Content.tsx   # Tutorial page 7
│   │   ├── OnboardingPage8Content.tsx   # Tutorial page 8
│   │   ├── OnboardingPage9Content.tsx   # Unused (TOTAL_PAGES=8)
│   │   ├── ReminderInfoOverlay.tsx      # Reminder detail/edit/done/delete modal
│   │   ├── RepeatsOverlay.tsx           # Repeat configuration overlay
│   │   ├── TutorialOnboardingContent.tsx # Tutorial page controller
│   │   ├── TutorialOverlay.tsx          # Tutorial overlay shell
│   │   ├── /figma
│   │   │   └── ImageWithFallback.tsx    # Image component with fallback
│   │   └── /ui                          # Unused, protected (see DO_NOT_USE.md)
│   ├── /dev                             # DevTools: self-checks & debug tools
│   │   ├── check-system.ts              # Check runner framework
│   │   ├── nlc-parser-checks.ts         # 53 NLC parser checks
│   │   ├── nlc-interaction-checks.ts    # 43 NLC interaction checks
│   │   ├── schedule-checks.ts           # 37 schedule equality/delta checks
│   │   ├── reminder-checks.ts           # 77 persistence, categorisation, sorting, repeat label, normalise, render, display title checks
│   │   ├── done-deleted-checks.ts       # 4 done/deleted view checks
│   │   ├── completion-checks.ts         # 14 completion behaviour checks
│   │   └── BASELINE.md                  # Expected self-check output
│   ├── /types
│   │   └── reminder.ts                  # RepeatRule, Schedule, ScheduleSources type definitions
│   └── /utils
│       ├── nlc-parser.ts                # NLC token parser (pure, regex-based)
│       ├── nlc-interaction.ts           # NLC interaction logic (pure functions)
│       ├── normalise-text.ts            # Display text normalisation (pure function)
│       ├── render-text.ts               # Presentation-only today/tomorrow substitution
│       ├── schedule.ts                  # Schedule equality, delta detection, date utilities
│       └── dummy-generator.ts           # Dummy reminder data generator
├── /imports
│   ├── NewReminderOverlay.tsx           # New reminder overlay component
│   ├── TimePicker.tsx                   # Time picker component
│   ├── DevTools.tsx                     # DevTools home page component
│   ├── DummyReminders.tsx               # Dummy reminders debug page
│   ├── LaterBtn.tsx                     # Later/settings button component
│   └── svg-*.ts                         # SVG path data
├── /styles
│   ├── fonts.css                        # Font imports
│   ├── index.css                        # Global styles entry
│   ├── tailwind.css                     # Tailwind imports
│   └── theme.css                        # CSS custom properties
└── main.tsx                             # Application entry point
```

## State Management

All state lives in App.tsx. No context providers or external state management.

### Primary State

- `reminders: Reminder[]` - All reminders (active, done, deleted)
- `activeFilter: ReminderCategory | "all"` - Active list filter
- `viewMode: ViewMode` - "list" or "done-deleted"
- `doneDeletedFilter: "all" | "done" | "deleted"` - Archive sub-filter

### Overlay State

- `isNewReminderOpen: boolean`
- `isDevToolsOpen: boolean`
- `isTutorialOpen: boolean`
- `editReminder: Reminder | null` - Reminder being edited
- `infoReminder: Reminder | null` - Reminder in info overlay
- `isRepeatsOverlayOpen: boolean`

### Dev-Only State

- `nlcMode: "click" | "auto"` - NLC mode for A/B testing
- `hideOverdue: boolean` - Hides overdue reminders (dev tool)

### Transient State

- `pendingDoneIds: Set<string>` - Visual transition state (350ms window)
- `pendingDeleteIds: Set<string>` - Visual transition state
- `pendingUncompleteIds: Set<string>` - Visual transition state
- `pendingUndeleteIds: Set<string>` - Visual transition state
- `reinsertedId: string | null` - Fade-in trigger for restored reminders
- `insertHighlightId: string | null` - 1000ms highlight for new/restored items
- `clearListStep: 0 | 1 | 2` - 3-step clear-all confirmation

### Timer Refs

- `completionTimersRef: Map<string, number>` - Completion delay timers
- `pendingDeleteTimersRef: Map<string, number>` - Delete delay timers
- `rescheduleTimersRef: Map<string, number>` - Repeat reschedule timers
- `insertHighlightTimerRef: { current: number | null }`
- `emptyPlaceholderDelayRef: { current: number | null }`
- `clearAllButtonRef: React.RefObject<HTMLButtonElement>`

## Data Flow

1. User action triggers event handler in App.tsx
2. Handler updates state and/or sets timers
3. State change triggers React re-render
4. Child components receive new props
5. Visual updates via conditional rendering and AnimatePresence
6. Timers execute delayed data commits
7. localStorage sync on reminder state changes

## Pure Function Modules

All business logic is extracted into pure functions:

- **nlc-parser.ts**: Token parsing (regex-based, no side effects)
- **nlc-interaction.ts**: Token application logic (pure functions)
- **normalise-text.ts**: Text normalisation (pure function)
- **render-text.ts**: Display text substitution (pure function)
- **schedule.ts**: Schedule utilities (pure functions)
- **reminder-utils.ts**: Categorisation, sorting, overdue detection, repeat labels (pure functions)

This separation allows deterministic testing via the self-check system without React component mounting.

## Animation System

Motion (formerly Framer Motion) handles all transitions:

- Overlay slide-up: `initial={{ y: "100%" }}` to `animate={{ y: 0 }}`
- List item exits: `exit={{ opacity: 0 }}`
- Layout animations: `layout` prop on motion.div
- AnimatePresence with dynamic keys for view/filter scopes

## Persistence

localStorage under `reminderly.reminders.v1` key. Defensive hydration with legacy migration support. Settings persisted under separate keys.

## Constraints

- No external state management (Redux, Zustand, etc.)
- No routing library
- No backend or API calls
- All data in-memory and localStorage
- Single-page application

### Lists

Lists are stored in a separate state slice from reminders.
Lists are persisted via localStorage.
Lists do not interact with reminder scheduling or lifecycle logic.