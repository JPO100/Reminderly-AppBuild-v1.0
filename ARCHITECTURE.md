# Reminderly Architecture

## Overview

Reminderly is a mobile-first reminders app built with React, TypeScript, and Tailwind CSS v4. All state is managed in a single `App.tsx` component using React hooks. Reminders are persisted to `localStorage`.

---

## Data Model

### Reminder (Runtime Type in App.tsx)

```typescript
type Reminder = {
  id: string;
  originalText: string;       // user-typed text, preserved for editing
  displayText: string;        // normalised text shown in the list
  createdAt: number;          // epoch ms
  schedule: ReminderSchedule;
  repeatRule?: RepeatRule | null;
  completedAt?: number | null; // epoch ms when marked done; null/undefined = active
};
```

### ReminderSchedule

```typescript
type ReminderSchedule =
  | { kind: "scheduled"; date: string; time?: string }  // date: yyyy-mm-dd, time: HH:MM
  | { kind: "sometime" };
```

### RepeatRule (in `/src/app/types/reminder.ts`)

```typescript
interface RepeatRule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay: Array<'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'> | null;
}
```

### RepeatConfig (UI-layer type in App.tsx)

```typescript
type RepeatConfig = {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom-days';
  interval: number;
  selectedDays?: string[];
} | null;
```

`RepeatConfig` is the overlay-facing type. It maps to/from `RepeatRule` at save and edit time.

---

## State Ownership

All primary state lives in `App.tsx`:

| State | Type | Purpose |
|-------|------|---------|
| `reminders` | `Reminder[]` | All reminders (active and done) |
| `isOverlayOpen` | `boolean` | New reminder overlay visibility |
| `isRepeatsOverlayOpen` | `boolean` | Repeats configuration overlay |
| `repeatConfig` | `RepeatConfig` | Current repeat configuration |
| `editingReminder` | `Reminder \| null` | Reminder being edited |
| `viewMode` | `ViewMode` | `"list"` or `"done-deleted"` |
| `activeFilter` | `string` | Current filter pill |
| `nlcMode` | `NlcMode` | NLC mode (`"click"` or `"auto"`) |
| `pendingDoneIds` | `Set<string>` | IDs in 350ms done transition |
| `pendingUncompleteIds` | `Set<string>` | IDs in 350ms uncomplete transition |

Ephemeral overlay state (toggles, selected date/time, reminder text) lives in `NewReminderElements` and is destroyed on unmount.

---

## Persistence

Reminders are serialised to `localStorage` under key `"reminderly.reminders.v1"`. The `loadReminders` function handles:

- Invalid JSON (returns `[]`)
- Non-array values (returns `[]`)
- Legacy `text` field migration to `originalText`/`displayText`
- Legacy `inbox` schedule kind migration to `sometime`
- Corrupt entries (skipped)

---

## Key Subsystems

### Natural Language Capture (NLC)

Fully implemented. Deterministic regex-based parser extracts date, time, and repeat tokens from reminder text. See `/docs/nlc.md`.

- Parser: `/src/app/utils/nlc-parser.ts`
- Interaction logic: `/src/app/utils/nlc-interaction.ts`
- Integrated into `NewReminderOverlay` with click and auto-apply modes

### Text Normalisation

`normaliseReminderText()` in `/src/app/utils/normalise-text.ts` replaces relative date/time phrases with absolute equivalents at save time. Produces `displayText` from `originalText` + schedule.

Includes a guard for bare weekday duplication: if stripping leaves a bare weekday that matches the schedule date's weekday, the weekday is replaced in-place with `Weekday DD Mon` instead of appending a duplicate.

### Render Text

`renderReminderText()` in `/src/app/utils/render-text.ts` substitutes "today" or "tomorrow" into `displayText` at render time when the schedule date matches. Presentation-only; never mutates stored data.

### Completion System

Single `completedAt` field determines active vs done. 350ms visual transition via `pendingDoneIds`/`pendingUncompleteIds` transient sets. Repeating reminders auto-reschedule after 1000ms post-completion.

### Schedule Utilities

`/src/app/utils/schedule.ts` contains pure functions for date parsing/formatting, semantic equality, and delta detection between schedule states.

### Categorisation and Sorting

`categoriseReminder()` and `sortReminders()` in `reminder-utils.ts`. Categories: today, this-week, later, sometime. Overdue reminders float to absolute top of every view.

---

## Architectural Type Definitions

`/src/app/types/reminder.ts` contains `Schedule`, `ScheduleSources`, `SuggestedSchedule`, and `SuggestedScheduleEvidence` types. These were defined during early architecture planning. The runtime `Reminder` type in `App.tsx` uses a simpler `ReminderSchedule` union. The types in `reminder.ts` are used by `schedule.ts` utilities.

---

## Component Structure

See `/docs/component-hierarchy.md` for visual breakdown.

Key files:

| File | Role |
|------|------|
| `/src/app/App.tsx` | Main component, all primary state, list rendering |
| `/src/app/reminder-utils.ts` | Non-component exports: loadReminders, categoriseReminder, sortReminders, isOverdue, formatRepeatLabel |
| `/src/imports/NewReminderOverlay.tsx` | Create/edit overlay with NLC integration |
| `/src/app/components/RepeatsOverlay.tsx` | Repeat configuration overlay |
| `/src/app/components/ReminderInfoOverlay.tsx` | Reminder detail/edit/done modal |
| `/src/app/components/DevToolsOverlay.tsx` | Dev tools (self-checks, dummy data, NLC mode) |

---

## Self-Check System

327 deterministic checks across 9 files in `/src/app/dev/`. Run via DevTools overlay. See `/src/app/dev/BASELINE.md` for expected output.