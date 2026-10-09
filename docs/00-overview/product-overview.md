# Product Overview

## Purpose

Reminderly is a mobile-first reminders application that combines natural language input with structured scheduling. The app allows users to create, organise, and track reminders with optional dates, times, and repeat rules.

## Key Features

### Natural Language Capture (NLC)
Regex-based date, time, and repeat extraction from free text. As users type, recognised patterns are highlighted and can be applied to the reminder's schedule via click or auto-apply modes.

### Filter System
Filter buttons provide categorised views of reminders:
- Today (blue)
- This week (pink)
- Later (orange)
- Sometime (grey)

### Completion and Deletion
- Mark reminders as done with visual transitions
- Soft-delete with undelete capability
- Done/deleted archive view with sub-filters (All, Done, Deleted)
- 3-step clear-all confirmation

### Recurring Reminders
Auto-rescheduling after completion for hourly, daily, weekly, monthly, yearly, and custom-day repeats.

### Text Processing
- Text normalisation: relative date phrases replaced with absolute equivalents at save time
- Render-time substitution: "today"/"tomorrow" shown contextually in the list

### Editing
Edit existing reminders with full NLC re-parsing and token invalidation.

### Overdue Detection
Visual treatment (red colour) and sort pinning for past-due reminders.

### Settings
User-facing settings overlay (subtitle toggle, tutorial access) and premium feature display.

### Developer Tools
Triple-tap logo access to:
- Self-check test suite (280 checks)
- Dummy reminder generation

### Lists

Lists are a core organisational feature of the app.
Lists are separate from reminders and do not share lifecycle or scheduling behaviour.

### Responsive Design
Mobile-first design optimised for iPhone 16 Pro (402px × 874px) with full responsiveness across all device sizes. Special behaviours for iPhone SE viewport (667px height threshold).

### Persistence
All reminders and settings stored in localStorage with defensive hydration and legacy migration support.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Motion (formerly Framer Motion)
- **State Management**: React hooks (useState, useRef, useEffect, useCallback)
- **Persistence**: localStorage
- **Icons**: Custom SVG graphics
- **Build Tool**: Vite

## Target Devices

**Primary:** iPhone 16 Pro (402px × 874px)
**Tested:** iPhone SE (320px - 667px), various iPhone models, iPad, desktop browsers
**Browser Support:** Modern browsers (ES2020+), iOS Safari 14+, Chrome/Edge 90+, Firefox 88+

## Design Philosophy

Mobile-first, deterministic, and user-controlled. No AI or NLP. All behaviour is explicit and predictable. The UI emphasises visual clarity, smooth transitions, and instant feedback.