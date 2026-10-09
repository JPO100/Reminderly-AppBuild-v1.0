# Development history

## Project overview

Reminderly is a mobile-first reminders application built with React, TypeScript, and Capacitor for iOS. It combines natural language input with structured scheduling, allowing users to create, organise, and track reminders with optional dates, times, and repeat rules. The app includes a lists system, smart reminders, dev tools overlay, notification system with native badge support, and haptic feedback.

The codebase originated from a Figma Make build and was extended with a Capacitor iOS shell.

## Branch history

### main

Created: 2026-04-03
Purpose: Primary development branch
Status: Active
Tip: a6ee791

### settings-menu-phase2-lists

Created: 2026-10-09
Parent: main (b724d52)
Purpose: Settings Menu Phase 2 - Lists tab Settings button and redesigned Templates button

Status: Active (pushed, not merged)

Summary:
- Templates pill replaced by the supplied 45 x 45px Templates SVG whenever List templates is on, regardless of the Settings menu toggle. Click behaviour unchanged (opens the templates panel)
- Lists Settings button (same SVG as Reminders Settings) shown when the Settings menu toggle is on, independent of List templates. Opens the existing Lists Settings placeholder via handleHeaderMenuClick; Reminders Settings still opens Reminders Settings. No new flag
- Settings on: visible filters grouped left and action buttons grouped right, 10px gaps, buttons 45 x 45px
- Settings on, Templates on: pill padding 13px below 390px; Started hidden below 360px (only needed at 320px)
- Settings on, Templates off: Started hidden below 440px; pill padding 11px below 375px, 13px from 375px, 16px from 390px
- Settings off: existing layouts kept apart from the Templates button
- No horizontal overflow at 320, 360, 375, 390 and 430px in the three affected combinations
- Known pre-existing issue, left unchanged: with Settings and Templates both off, the legacy four-pill row overflows by 16px at 390px
- Lists Settings panel contents and the onboarding tutorial unchanged

### integration-settings-sometime

Created: 2026-10-09
Parent: settings-menu-phase1 (15967cf)
Purpose: Combined build of Settings Menu Phase 1 and the undated Sometime reminder fix (cherry-picked ce3fe6a from fix-undated-reminder-add)

Status: Active (pushed, not merged)

Summary:
- Needed because fix-undated-reminder-add was branched from main, which lacks the unmerged Settings Menu Phase 1 commits (including 60cb9b6, legacy hamburger removal), so its build showed the legacy hamburger
- Source applied cleanly; conflicts only in this file and the generated iOS asset reference

### settings-menu-phase1

Created: 2026-10-09
Parent: main (ed7e849)
Purpose: Settings Menu Phase 1 - Settings button in the reminder filter row and combined Later/Sometime presentation, behind the Dev Tools > System > Settings menu toggle

Status: Active (pushed, not merged)

Summary:
- Toggle now stored as reminderly-ff-settings-menu-v2, default off, so existing installs (which persisted the old default of true) start with the feature off. Off keeps the separate Later and Sometime filters and colours
- On: Reminders tab filter row is Today, This week, Later grouped left (10px gaps) with the Settings button (45px SVG, existing settings action) right-aligned. Below 375px pill side padding is 13px so the row fits at 320px
- Post-testing correction: legacy header hamburger removed in both states. Accepted loss: no access to the placeholder Lists settings panel, and with the toggle off no manual tutorial re-run
- On: Later uses the existing combined 'other' filter (Later and Sometime), and Sometime circles use the Later colour. Presentation only - no reminder data, categorisation or persistence changes
- Active filter is remapped when the toggle changes so it is never left on a hidden filter
- Tutorial reflects the toggle: no hamburger in either state; on shows grouped filters, the blue Settings button, combined Later/Sometime and the re-run page pointing to the blue settings button; off keeps the Sometime filter and omits the re-run page
- Calendar not applicable (no calendar in use). A future calendar must respect the combined Later/Sometime behaviour

### fix-undated-reminder-add

Created: 2026-10-09
Parent: main (ed7e849)
Purpose: Allow undated Sometime reminders to be added from New reminder

Status: Active (pushed, not merged)

Summary:
- Root cause: commit f3d0de7 made the Add tick and submit handler require Date and Time in create mode, blocking Sometime reminders
- Fix: shared canSubmitReminder check. Text is mandatory; Date OFF saves as Sometime; Date ON still requires a selected date and Time ON with a selected time (Date ON, Time OFF stays disabled)
- Unchanged: date/time toggle interactions (Date ON still auto-enables Time at 12:00), data structures, parsing, notifications, categorisation, edit and smart reminder modes
- Tests: src/app/__tests__/add-reminder-validation.test.ts (9 tests). Vitest 53 passed. Self Check schedule, persistence, natural language interaction and notification sections 184 passed, 0 failed (headless). Verified on iPhone 17 Pro simulator; deployed to physical iPhone 15 Pro

### feature/lists-disabled-ui-refinement

Created: 2026-10-09
Parent: main (96327aa)
Purpose: Lists-disabled UI refinement - filters inside the white panel, Sometime filter restored, legacy settings cog removed

Status: Active (pushed, not merged)

Summary:
- Removed the Dev Tools grouped filters layout, its legacy settings cog, SettingsOverlay and the show date/time subtitles setting
- Lists off: Today, This week, Later and Sometime filters (and Done/Deleted filters) render inside the white panel, reusing the Lists-on filter row
- Header settings button and its panels unchanged

### fix/midnight-badge-tests

Created: 2026-10-09
Parent: main (4675087)
Purpose: Correct outdated midnight badge notification tests

Status: Merged
Merged into: main (normal merge)
Final commit: see merge history

Summary:
- Restored notifications.test.ts to its pre-f98d81f expectations, matching the hasActiveDateOnlyReminder guard restored on 2026-06-18
- Updated src/app/dev/BASELINE.md with the verified baseline

### badge-midnight-fix

Created: 2026-06-16
Parent: main (7765120)
Purpose: Fix midnight badge notification scheduling - remove overly restrictive date-only guard

Status: Merged
Merged into: main (fast-forward)
Final commit: f98d81f

Summary:
- Removed hasActiveDateOnlyReminder guard from buildMidnightBadgeNotification
- Updated notification tests to match new behaviour

### add-haptic-feedback

Created: 2026-06-15
Parent: main (1c3b696)
Purpose: Add haptic feedback to key user actions with per-action dev tools controls

Status: Merged
Merged into: main
Merge commit: 7765120
Final commit: dc2079d

Summary:
- Added haptic feedback to reminder and list actions
- Unified haptics to single light impact tap
- Added dev tools haptics settings page with per-action toggles
- Updated iOS build artifacts

### overdue-subtitle-format

Created: 2026-06-03
Parent: main (167ce2d)
Purpose: Show overdue duration in reminder subtitles and add App Library category

Status: Merged
Merged into: main
Merge commit: 24aeb9b
Final commit: f321245

Summary:
- Show overdue duration in reminder subtitle from day 1 onwards
- Added productivity category to Info.plist for App Library grouping
- Synced iOS public index with current build
- Added persistence failure visibility
- Review infrastructure updates

### code-review

Created: 2026-06-03
Parent: main (167ce2d)
Purpose: Code review infrastructure and fixes

Status: Archived (subsumed by overdue-subtitle-format merge)
Tip: c5a885a

Summary:
- Same commits as early overdue-subtitle-format work
- Branch diverged at same point, appears to have been used as a staging area

### reminder-refresh-v2

Created: 2026-06-02
Parent: main (1972dc2)
Purpose: Reminder time refresh and badge notification system

Status: Archived (work landed directly on main)
Tip: 1972dc2

Summary:
- Branch pointer sits at same commit as main at time of creation
- All badge/notification work was committed directly to main

### devtools-2.0

Created: 2026-05-29
Parent: main (01c874d)
Purpose: Dev tools 2.0 overhaul

Status: Archived (work landed directly on main)
Tip: 01c874d

### colour-palette-2

Created: unknown
Parent: main
Purpose: Colour palette exploration

Status: Archived (no unique commits)
Tip: ee1bc8c

### ios-integration-phase-1

Created: 2026-04-04
Parent: main (3989b32)
Purpose: iOS integration work

Status: Archived (work landed directly on main)
Tip: 3989b32

### long-list-sheet-bounce

Created: 2026-04-28
Parent: main (097e822)
Purpose: Long list sheet bounce behaviour

Status: Archived (no unique commits)
Tip: 097e822

### saved-lists

Created: 2026-04-28
Parent: main (1d72997)
Purpose: Saved lists feature

Status: Archived (work landed directly on main)
Tip: 1d72997

### smart-reminders

Created: 2026-04-08
Parent: main (4759143)
Purpose: Smart reminders feature

Status: Archived (work landed directly on main)
Tip: 4759143

### smart-reminders-ui-2

Created: unknown
Parent: main
Purpose: Smart reminders UI iteration

Status: Archived (no unique commits)
Tip: 96d4cbe

### tutorial-v2

Created: unknown
Parent: main
Purpose: Tutorial system v2

Status: Archived (no unique commits)
Tip: e86c3d3

### ui-exploration-3-dots

Created: 2026-04-05
Parent: main (49686e6)
Purpose: 3-dot menu UI exploration

Status: Archived (work landed directly on main)
Tip: 49686e6

## Merge history

### 2026-06-16

Source: badge-midnight-fix
Destination: main
Result: fast-forward to f98d81f

Changes:
- Removed date-only guard from midnight badge notification scheduling
- Updated notification tests to reflect new behaviour
- Follow-up commit 3c85c52 updated iOS web assets

### 2026-06-15

Source: add-haptic-feedback
Destination: main
Merge commit: 7765120

Changes:
- Added haptic feedback to key user actions (create, complete, delete, undelete, uncomplete, clear done/deleted)
- Unified all haptics to single light impact tap
- Added dev tools haptics settings page with per-action toggles
- Updated iOS build artifacts after cap sync

### 2026-06-11

Source: overdue-subtitle-format
Destination: main
Merge commit: 24aeb9b

Changes:
- Added overdue day count to reminder subtitles
- Added productivity category to Info.plist
- Added persistence failure visibility banner
- Synced iOS public index
- Review infrastructure updates

## Release history

### Baseline build - 2026-04-03

Commit: c30b1e8
Milestone: Initial Figma Make build with Capacitor iOS shell established as project baseline.

### Stable rollback points - 2026-04-04

Commits: 2fce61a, 4d44338, e12212a
Milestone: Three stable rollback points created before and after notification work and code cleanup.

## Significant decisions

### Capacitor as iOS bridge (2026-04-03)
The project uses Capacitor to bridge a web-based React/TypeScript application to native iOS. This allows the core UI and logic to remain in web technologies while accessing native capabilities (notifications, badge, haptics) through Capacitor plugins.

### Per-notification badge values (2026-06-02)
Badge counts are embedded in each scheduled local notification payload rather than using background app refresh or push notifications. Each notification carries the pre-computed badge count for its fire time. A silent midnight notification handles day-boundary badge transitions.

### Native badge correction on action (2026-06-02)
When a user acts on a notification (mark done, move to tomorrow), the native iOS handler decrements the badge and reschedules pending notification badge values. This avoids requiring the JS layer to be active.

### Midnight badge notification gated on active date-only reminders (2026-06-18)
Restored the hasActiveDateOnlyReminder guard in buildMidnightBadgeNotification. The midnight silent badge notification is only scheduled when badge is enabled AND at least one active (non-completed, non-deleted) date-only reminder exists. This was reverted from the 2026-06-16 change which removed the guard, because removing it caused 5 self-check failures in the notification suite.

### Haptics unified to single light impact (2026-06-15)
All haptic feedback actions use a single light impact tap rather than varied intensities. Per-action controls were added to dev tools for granular enable/disable.

### Standard centred overlay pattern (2026-05-25 onwards)
Dev tools pages use a consistent PageShell with flat layout and shared components (ToggleRow, MenuRow, BackHeader).

### Hierarchical dev tools enable/disable (2026-05-26)
Dev tools pages have root-level enable toggles with hierarchical disabled states. Disabled pages use #D9D9D9 styling.

### Lists and reminders structurally separate (2026-04-04 onwards)
Lists and reminders are separate data structures. Smart reminders provide the bridge between them by linking a reminder to a list for progress tracking.

## Development log

### 2026-04-03

Branch: main
Commits: c30b1e8

Completed:
- Baseline ReminderlyV300 Figma Make build with Capacitor iOS shell

Outcome: Project initialised.

### 2026-04-04

Branch: main
Commits: 2fce61a, 4d44338, e12212a, b8d9799 through 3989b32

Completed:
- Created stable rollback points
- Refined reminder overlay and done view UI
- Refined list interactions, 3-dot menus, list overlays
- Polished smart list entry UI

Outcome: Core UI foundation established.

### 2026-04-05 to 2026-04-13

Branch: main
Commits: 49686e6 through a773e66

Completed:
- Built smart reminders list overlay flow
- Implemented smart reminder list sync
- Refined smart reminder overlay date actions
- Added list self-check coverage
- Built saved lists workflow and overlay interactions
- Refined template overlays, dev tools list template controls
- Refined reminder actions and text input behaviour

Outcome: Lists, smart reminders, and saved lists features built out.

### 2026-04-23 to 2026-05-03

Branch: main
Commits: 98cb381 through f674cac

Completed:
- Updated lists button copy
- Refined smart reminder subtitles and handoff flow
- Layout refinements: title truncation, descender clipping, panel spacing
- Reordered list filters to todo/started/done

Outcome: Layout polish and list filter refinements.

### 2026-05-25 to 2026-05-27

Branch: main
Commits: c698d55 through 19f0f20

Completed:
- Dev tools 2.0 overhaul: refactored all sub-pages to PageShell pattern
- Added shared ToggleRow, MenuRow, BackHeader components
- Added hierarchical enable/disable across all dev tools pages
- Added info icons with detailed cross-dependency descriptions
- Fixed sub-page scrolling issues
- Added Move to tomorrow notification long-press action
- Fixed notification sync signature
- Fixed resume refresh with visibilitychange event

Outcome: Dev tools fully restructured. Notification long-press actions added.

### 2026-05-29

Branch: main
Commits: 01c874d

Completed:
- Fixed resume refresh by replacing missing @capacitor/app listener with visibilitychange event

Outcome: App resume now correctly triggers time refresh.

### 2026-06-02

Branch: main
Commits: 417ef98 through 167ce2d

Completed:
- Stage 1 reminder time refresh with capped 30s re-arm timer
- Notification badge payload support
- Native badge correction on notification action (iOS Swift handler)
- Silent midnight badge notification for day-boundary transitions
- Midnight badge guard behind active date-only reminder check
- Notification badge tests
- Notification badge self-checks in dev tools
- Removed test artifacts

Outcome: Full notification badge system implemented with native iOS support.

### 2026-06-03

Branch: overdue-subtitle-format
Commits: 9458484 through c5a885a

Completed:
- Review infrastructure updates
- Added persistence failure visibility
- Synced iOS public index
- Added productivity category to Info.plist

Outcome: Infrastructure improvements.

### 2026-06-11

Branch: overdue-subtitle-format
Commits: f321245
Merge: 24aeb9b

Completed:
- Show overdue duration in reminder subtitle from day 1 onwards
- Merged overdue-subtitle-format into main

Outcome: Merged to main.

### 2026-06-15

Branch: add-haptic-feedback
Commits: fae4339 through dc2079d
Merge: 7765120

Completed:
- Added haptic feedback to key user actions
- Unified all haptic feedback to single light impact tap
- Added dev tools haptics settings page with per-action toggles
- Updated iOS build artifacts
- Merged add-haptic-feedback into main

Outcome: Merged to main.

### 2026-06-16

Branch: badge-midnight-fix
Commits: f98d81f, 3c85c52

Completed:
- Investigated badge not updating at midnight when app suspended
- Identified hasActiveDateOnlyReminder guard as overly restrictive
- Removed guard so midnight badge notification always schedules when badge enabled
- Updated notification tests
- Updated iOS web assets after badge fix

Outcome: Merged to main (fast-forward). Remaining limitation: badge updates for arbitrary times while app is suspended (e.g. timed reminder becoming overdue at 3pm) require additional silent notifications at each time boundary - a separate architectural change.

### 2026-06-18

Branch: main
Commits: b81c142

Issue: 5 self-checks failing in notification and badge suite (335/340 passing).
Root cause: The 2026-06-16 badge-midnight-fix removed the hasActiveDateOnlyReminder guard from buildMidnightBadgeNotification, causing midnight notifications to be generated unconditionally when badge was enabled. This broke tests that expected no midnight notification when all reminders had explicit times, or when the only date-only reminders were completed/deleted.
Resolution: Restored the hasActiveDateOnlyReminder(reminders) early-return guard in buildMidnightBadgeNotification (src/app/notifications.ts:86).
Test results: Self-check suite restored to 340/340 passing, 0 failed.

Failing checks fixed:
- Scheduling limits: limits to 64 notifications when no midnight needed
- Midnight notification: excluded when all reminders have times
- Midnight notification: excludes completed date-only reminders
- Midnight notification: excludes deleted date-only reminders
- Scheduling limits: all 64 slots for reminders when no midnight needed

Outcome: Notification self-checks green. Single line change.

### 2026-06-18 (governance)

Branch: main
Commits: f67662d, 112b0af, a6ee791

Completed:
- Recorded midnight notification fix in docs/development-history.md (f67662d)
- Committed development history maintenance rules to Claude.md with explicit bug fix trigger (112b0af)
- Added git push and branch publishing rules to Claude.md (a6ee791)

Outcome: Development workflow governance formalised in Claude.md. All changes pushed to origin/main.

### 2026-06-18 (git governance update)

Branch: main
Commits: pending

Completed:
- Expanded "Git push and branch publishing rules" in Claude.md to comprehensive "Git governance rules"
- Added: no automatic git add, no automatic commit, no automatic rebase, no automatic reset, no automatic branch creation
- Added: mandatory git status reporting in every implementation sign-off
- Added: mandatory commit recommendation (yes/no with reason) in every sign-off
- Aligned Reminderly git governance model with Noterly project standards

Outcome: Pending commit.

### 2026-06-19 (commit and build sign-off alignment)

Branch: main
Commits: pending

Completed:
- Separated "Required sign-off format" and "Build sign-off requirements" into distinct "Commit sign-off requirements" and "Build sign-off requirements" sections
- Added mandatory commit reporting fields: commit hash, files committed, test status, current branch, git status
- Added mandatory raw output requirements: git status (pre-commit), git log -1 --oneline (post-commit)
- Resolved short ref conflict: commit reference is now the actual post-commit hash from git log -1 --oneline, not a human-readable label
- Added test status field with three valid values (not run - not requested, not run - documentation only, run - with result)
- Preserved existing test prohibition: tests remain forbidden unless explicitly requested
- Preserved existing push, branch, merge, rebase, and reset approval rules unchanged
- Preserved existing anti-stall execution rules unchanged
- Updated git governance rule 10 to require raw git status output instead of narrative summary
- Aligned Reminderly commit/build workflow with Noterly standard

Outcome: Pending commit.

### 2026-06-19 (mandatory build sign-off correction)

Branch: main
Commits: pending

Completed:
- Updated build sign-off requirements to require Claude to execute npm run build and npx cap sync ios, not just output commands as text
- Added mandatory build reporting: build result, sync result, whether iOS assets changed, git status after sync
- Added documentation-only exception: explicitly state "Build/sync not run - documentation-only change."
- Added execution rules: both commands must be run in sequence, build first then sync
- Updated failure handling: report exact error output, do not proceed to sync if build failed
- Added stall prevention exemption: mandatory build sign-off is exempt from stall-risk classification
- Updated stall prevention rules to note the exemption for mandatory build sign-off
- Existing commit sign-off, testing rules, and git governance rules unchanged

Outcome: Pending commit.

### 2026-06-19 (terminal commands for local testing requirement)

Branch: main
Commits: pending

Completed:
- Added new "Terminal commands for local testing" section to claude.md after build sign-off requirements
- Requires copy/paste-ready terminal command block after every implementation change: cd, git checkout, git log, npm run build, npx cap sync ios, open xcworkspace
- Includes Xcode instructions: Product → Clean Build Folder, Product → Run
- Must use actual repository path and actual branch name, not placeholders
- Must be provided even if Claude has already run build/sync
- Documentation-only exception requires explicit statement: "Terminal commands for local testing not provided - documentation-only change."
- Cannot be removed, weakened, or overridden by anti-stall rules
- Existing build sign-off, commit sign-off, testing rules, and git governance rules unchanged

Outcome: Pending commit.

### 2026-10-09 (midnight badge test fix)

Branch: fix/midnight-badge-tests
Commits: bb9ceef

Issue: Vitest baseline was 30 passed, 5 failed. All failures were midnight badge notification tests.
Root cause: The 2026-06-16 badge-midnight-fix (f98d81f) changed the Vitest expectations to match removal of the hasActiveDateOnlyReminder guard. The guard was restored on 2026-06-18 (b81c142), but the Vitest file was not reverted.
Resolution: Restored notifications.test.ts to its pre-f98d81f content. Midnight notifications are expected only when an active date-only reminder exists; 64-notification limit coverage retained. No application code changed.
Test results: Vitest 36 passed, 0 failed, 0 skipped. Self Check 340 passed, 0 failed on physical iPhone 15 Pro and iPhone 17 Pro simulator. Both devices built, installed and launched successfully.

Outcome: Merged to main.

### 2026-10-09 (lists-disabled UI refinement)

Branch: feature/lists-disabled-ui-refinement

Completed:
- Removed the grouped filters layout entirely (decision: user approved removal over leaving an inert Dev Tools option): Dev Tools Filters menu page, legacy filter-row settings cog, SettingsOverlay and its show date/time subtitles setting, tutorial grouped variants
- Lists off: filter row moved from the blue header into the white panel by reusing the existing Lists-on in-panel row; panel now starts directly below the logo
- Sometime filter available when Lists are off; existing rule hiding it below 390px width retained
- Removed 13 Self Check checks covering the removed settings; expected Self Check count is 327

Test results: Vitest 36 passed, 0 failed. Visual checks at 402px and 375px with Lists off and on.

### 2026-10-09 (onboarding state consistency)

Branch: feature/lists-disabled-ui-refinement

Completed:
- Tutorial phone mock-ups hide the Reminders/Lists tab bar when Lists are off, matching the app layout
- Tutorial pages are selected from feature state (getTutorialPageIds): Reminders 5 pages, 6 with the header settings menu; Lists 3 core pages plus smart reminders and list templates pages when those features are on
- Removed three placeholder Lists tutorial pages
- Added a Reminderly tutorial row to the header Reminders settings panel (shown when the tutorial is enabled), restoring the re-run entry point lost with the legacy settings sheet
- Tutorial filter pills scaled to the 45px app buttons; unused tutorial cog option removed

Test results: Vitest 44 passed (8 new tutorial page tests). Tutorial walked through for Lists on/off, settings menu on/off, smart reminders on/off and saved lists on/off.
