# Reminderly Documentation

Welcome to the Reminderly documentation. This documentation set serves as the canonical reference for the current implementation of the Reminderly mobile reminders app.

## Documentation Structure

Documentation is organized into 8 logical sections with numeric prefixes for clear ordering:

### 📘 00-overview
Start here for high-level understanding.

- **[Product Overview](./product-overview.md)** - App purpose, key features, and technology stack
- **[Architecture](./architecture.md)** - System architecture, component hierarchy, and file structure
- **[Data Model and Persistence](./data-model-and-persistence.md)** - Reminder schema, localStorage, and data flow

### 🖥️ 01-core-surfaces
User-facing screens and overlays.

- **[Active List](../01-core-surfaces/active-list.md)** - Main reminder list view with filters
- **[Done/Deleted Archive](../01-core-surfaces/done-deleted-archive.md)** - Archive view for completed and deleted reminders
- **[New Reminder Overlay](../01-core-surfaces/new-reminder-overlay.md)** - Creating new reminders with NLC
- **[Reminder Info Overlay](../01-core-surfaces/reminder-info-overlay.md)** - Viewing and editing reminder details
- **[Repeats Overlay](../01-core-surfaces/repeats-overlay.md)** - Repeat configuration interface
- **[Settings Overlay](../01-core-surfaces/settings-overlay.md)** - Removed legacy settings overlay
- **[Tutorial Overlay](../01-core-surfaces/tutorial-overlay.md)** - Configuration-aware onboarding tutorial system
- **[Dev Tools Overlay](../01-core-surfaces/dev-tools-overlay.md)** - Developer diagnostic tools

### ⚙️ 02-reminder-behaviour
How reminders work and behave.

- **[Reminder Lifecycle](../02-reminder-behaviour/reminder-lifecycle.md)** - Create, edit, complete, delete, restore operations
- **[Filters and Sorting](../02-reminder-behaviour/filters-and-sorting.md)** - Filter system and sort behaviour
- **[Overdue and Status](../02-reminder-behaviour/overdue-and-status.md)** - Overdue detection, categories, and status icons
- **[Empty States and Transitions](../02-reminder-behaviour/empty-states-and-transitions.md)** - Empty states and visual transitions

### 📝 03-natural-language-and-scheduling
NLC and time-based features.

- **[Natural Language Capture](../03-natural-language-and-scheduling/nlc.md)** - NLC token parsing, application, and invalidation
- **[Text Normalisation and Rendering](../03-natural-language-and-scheduling/text-normalisation-and-rendering.md)** - Display text processing and substitution
- **[Scheduling](../03-natural-language-and-scheduling/scheduling.md)** - Date/time scheduling logic and invariants
- **[Repeats](../03-natural-language-and-scheduling/repeats.md)** - Repeat rules and auto-rescheduling
- **[Calendar and Time Picker](../03-natural-language-and-scheduling/calendar-and-time-picker.md)** - Date/time picker components

### ⚙️ 04-settings-onboarding-and-premium
Settings, tutorial, and premium UI.

- **[Settings](../04-settings-onboarding-and-premium/settings.md)** - Settings system and user preferences
- **[Onboarding and Tutorial](../04-settings-onboarding-and-premium/onboarding-and-tutorial.md)** - Tutorial flow and pages
- **[Premium UI](../04-settings-onboarding-and-premium/premium-ui.md)** - Premium feature display

### 🎨 05-design-and-layout
Visual design and responsive behaviour.

- **[Responsive Layout](../05-design-and-layout/responsive-layout.md)** - Breakpoints and responsive behaviour
- **[Content Overlay Responsive](../05-design-and-layout/content-overlay-responsive.md)** - Overlay responsive pattern
- **[Component Hierarchy](../05-design-and-layout/component-hierarchy.md)** - Component structure
- **[Colour Styles](../05-design-and-layout/colour-styles.md)** - Colour definitions
- **[Sizing and Spacing](../05-design-and-layout/sizing-spacing.md)** - Spacing system

### 🔧 06-quality-and-dev
Development, testing, and quality.

- **[Build Guide](../06-quality-and-dev/build-guide.md)** - Development and build instructions
- **[Self-Check System](../06-quality-and-dev/self-check-system.md)** - Automated test suite (280 checks)
- **[Tests and Baselines](../06-quality-and-dev/tests-and-baselines.md)** - Test coverage and expected output
- **[Dev Tools](../06-quality-and-dev/dev-tools.md)** - Developer tools reference

### 📋 07-lists

* **[Lists overview](/docs/07-lists/lists-overview.md)** - Lists as a standalone app area
* **[List lifecycle](/docs/07-lists/list-lifecycle.md)** - List states and transitions
* **[List UI and interactions](/docs/07-lists/list-ui-and-interactions.md)** - Lists surface behaviour

## Quick Reference

**Target Device:** iPhone 16 Pro (402px × 874px)  
**Viewport Threshold:** iPhone SE at 667px height  
**Framework:** React 18 + TypeScript  
**Styling:** Tailwind CSS v4  
**Animation:** Motion (formerly Framer Motion)  
**Persistence:** localStorage

## Key Concepts

### Natural Language Capture (NLC)
Regex-based date, time, and repeat extraction from free text. As users type, recognised patterns highlight and can be applied via click or auto modes.

### Filter System
Filter buttons provide categorised views: Today (blue), This week (pink), Later (orange), Sometime (grey).

### Done/Deleted Archive
Soft-delete with 350ms visual transitions, uncomplete/undelete capability, sub-filters (All/Done/Deleted), and 3-step clear-all.

### Repeating Reminders
Auto-rescheduling after completion. Supports hourly, daily, weekly, monthly, yearly, and custom-day repeats.

### Overdue Detection
Past-due reminders highlighted in red and pinned to top of all filter views.

### Self-Check System
274 automated checks validating business logic across 7 test suites: Schedule, Reminder, NLC Parser, NLC Interaction, Done/Deleted, Completion, Dev Tools.

## Getting Started

1. **New to Reminderly?** Start with [Product Overview](./product-overview.md)
2. **Understanding the codebase?** Read [Architecture](./architecture.md)
3. **Looking for a specific feature?** Use the section links above
4. **Need to build/deploy?** See [Build Guide](../06-quality-and-dev/build-guide.md)
5. **Running tests?** Check [Self-Check System](../06-quality-and-dev/self-check-system.md)

## Important Notes

- **Do not add a shared UI component suite** under `src/app/components/ui`. UI primitives are added locally when needed.
- The `src/app/components/ui` folder is **platform-managed and protected** in Figma Make. It is intentionally unused and must not be imported.
- For development constraints, see `/Claude.md` (surgical changes only, no taste refactors, preserve UX/motion).

## Documentation Maintenance

This documentation was restructured on 2026-03-11. See `MIGRATION-MAP.md` and `RESTRUCTURE-SUMMARY.md` in the `/docs` root for details on the reorganization.

**Canonical documentation is now in the numbered folders (00-07).** Original documentation has been archived in `/docs/archive/`.

---

**Questions or issues?** Refer to the specific section documentation above, or consult the archived original docs in `/docs/archive/original-docs/` for historical reference.