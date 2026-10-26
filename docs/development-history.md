# Development history

## Project overview

Reminderly is a mobile-first reminders application built with React, TypeScript, and Capacitor for iOS. It combines natural language input with structured scheduling, allowing users to create, organise, and track reminders with optional dates, times, and repeat rules. The app includes a lists system, smart reminders, dev tools overlay, notification system with native badge support, and haptic feedback.

The codebase originated from a Figma Make build and was extended with a Capacitor iOS shell.

## Branch history

### main

Created: 2026-04-03
Purpose: Primary development branch
Status: Active
Tip: merge of feature/siri-onboarding (2026-10-22)

Merge - 2026-10-22: Siri tutorial page
- feature/siri-onboarding (87951d2) into main (2c0444d) as 9067897, --no-ff, no conflicts. The branch had been brought up to date with main in 35ac5d2 (development history entries only, both kept). CTO approved; John signed off, including the Siri phrase in Reminderly blue (#4784F8)
- Reminders tutorial page "Add reminders with Siri" (page id 9), third after Create a reminder, shown while Siri for reminders is available: home screen, iOS 27 Siri orb and panel with the edge glow, Reminderly opening, "Call Mum" inserted at the top
- Verification on main (9067897): Vitest 298/298, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main deployed to the simulator (iPhone 17 Pro, iOS 26.3) and John's iPhone 15 Pro (iOS 27.0.1): build, signing, install and launch successful
- feature/siri-onboarding deleted locally and on origin. It had been missing from John's devices because it was unmerged while later builds came from main; the deploy note now states plainly when a seen feature is excluded

Merge - 2026-10-22: Siri Phase 3, locked-device creation
- feature/siri-locked-stage3 (fc19ca7, containing stages 1 and 2) into main (c990dcd) as 2c0444d, --no-ff, no conflicts. CTO approved (Type E); John signed off Siri Phase 3
- Siri now creates reminders in the background with the iPhone locked, unlocked and in CarPlay, without opening Reminderly: JavaScriptCore parse with the bundled siri-core.js, App Group pending list imported by id, notification identical to the Capacitor plugin's, exact badge adjustment, widget, "That's done". Plan: [plans/siri-locked-device.md](./plans/siri-locked-device.md)
- Verification on main (2c0444d): Vitest 296/296, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main deployed to the simulator (iPhone 17 Pro, iOS 26.3) and John's iPhone 15 Pro (iOS 27.0.1): build, signing, install and launch successful. Stage 4 device tests: 9/9 passed
- Deleted locally and on origin: feature/siri-locked-stage1, -stage2, -stage3 (merged) and feature/siri-done-confirmation (superseded, never merged; its spoken confirmation is part of this work)
- Kept: spike/siri-background-webview (Option A findings, CTO decision), feature/siri-onboarding (separate, awaiting its own merge), docs/siri-option-c-proposal (superseded proposal)
- Separate follow-ups: natural-language time handling (for example times without am or pm); the existing badge-correction patch re-adds pending notifications with their original interval


Merge - 2026-10-22: Siri Phase 2 and settings panel lifecycle fixes
- ui/notifications-keyline (821bea3) into main (eaded41) as 327baf6, --no-ff, no conflicts. CTO approved (Type A)
- fix/settings-close-on-background (4dd5e74) into main (327baf6) as 3cdf0e7, --no-ff, no conflicts. CTO approved (Type B)
- feature/siri-phrases brought current with main in a7b53cf (conflict: development history entries only, both kept), then merged into main (3cdf0e7) as b980d34, --no-ff. CTO approved; John authorised. Siri Phase 2: four phrases, Siri shortcuts settings page, Siri off spoken refusal on iOS 26+ (fail closed), iOS 16.0 to 25 unchanged
- Post-merge iPhone check found the settings panel still open after Home Screen and reopen (Siri reopen passed). Follow-up fix/settings-close-on-resume (f6d5047) into main (b980d34) as 1afe653, --no-ff, no conflicts. CTO approved (Type B)
- Verification on main (1afe653): Vitest 270/270, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main deployed to the simulator (iPhone 17 Pro, iOS 26.3) and John's iPhone 15 Pro (iOS 27.0.1): build, signing, install and launch successful
- Device verification (John, iPhone, iOS 27.0.1): Siri on, off, change while backgrounded, lock screen: pass. Settings panel closed after Home Screen and reopen, Siri reopen and hard close: pass. Simulator: fresh install refuses until the app is first opened (approved uninstall): pass
- Before the record was merged, John found that the three added phrases (with "remind" or "reminder") made Siri ask "Reminderly or Notes?" every time. fix/siri-single-phrase (5ad634b) into main (1afe653) as 617b75a, --no-ff, no conflicts. CTO approved (Type B). Only "Add to Reminderly app" remains; the Siri page reads "To add a reminder with Siri just say...", "Hey Siri..." and the phrase (bold), "...then when Siri replies, say your reminder."
- Verification on main (617b75a): Vitest 270/270, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main deployed to the simulator and John's iPhone: build, signing, install and launch successful. John's iPhone check of the single phrase and Siri page passed
- feature/siri-phrases, fix/settings-close-on-background, fix/settings-close-on-resume and fix/siri-single-phrase deleted locally and on origin. Siri Phase 2 COMPLETE. Next: Phase 3 (Siri onboarding/tutorial). Phase 4 (relative time expressions) stays a future enhancement

Merge - 2026-10-22: Siri Phase 1, technical reliability
- Merge commit of fix/siri-reliability (0cb25fd) into main (4f274c6) as ae3e94d, --no-ff, no conflicts. CTO approved (Type C); John authorised
- Verification on main: Vitest 265/265, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main deployed to the simulator (iPhone 17 Pro) and John's iPhone 15 Pro: build, signing, install and launch successful
- fix/siri-reliability deleted locally and on origin. Next: Siri Phase 2 (invocation phrases). Phase 4 (relative time expressions) stays recorded as a future enhancement

Merge - 2026-10-20: Final consolidation (onboarding gaps)
- feature/onboarding-gaps brought up to date with main in 63ffefa (conflicts: notification-checks imports, BASELINE and development history records, generated index.html; resolved with no behaviour change), then merged into main (071efb9) as 71ff2a5, --no-ff, no conflicts. CTO approved; John confirmed
- Verification on main: Vitest 246/246, Self Check 412/412 (Node run), production build successful
- All development branches merged and deleted locally and on origin (feature/onboarding-gaps, feature/list-template-haptics-sounds); main is the only branch
- Outstanding (not blocking): badge validation on the physical iPhone (from the morning of 2026-10-21, on final main); simulator tutorial checks of the onboarding pages; onboarding fresh-install device checks (Allow, deny, Not now); physical iPhone checks of both list fixes. Any problem goes to a new fix branch from main. No TestFlight or release changes

Merge - 2026-10-20: Consolidation (known issue 8 fix and badge overnight repair)
- Merge commit of fix/list-item-edit-background-save (f8ff91a) into main (a3eaf08) as a368cad, --no-ff. No conflicts
- Merge commit of fix/badge-overnight (fdaf97e) into main (a368cad) as edcdc18, --no-ff. Only conflict: generated ios/App/App/public/index.html, resolved by patch-package, vite build and cap copy ios from the merged source
- Verification on main: Vitest 238/238, Self Check 411/411 (Node run), production build successful, native simulator build installed and launched. CTO consolidation approval; John confirmed
- Outstanding: badge two-midnight physical iPhone validation; any problem goes to a new fix branch from main. Physical iPhone checks of both list fixes follow when the deployment hold lifts. No TestFlight or release changes
- feature/onboarding-gaps parked unchanged for separate review. Merged fix branches deleted locally and on origin after confirmation in main

Merge - 2026-10-20: List editor keyboard scroll lock fix
- Merge commit of fix/list-keyboard-scroll-lock (dd88b6d) into main (7ab6fe5) as ac17400, --no-ff, after CTO approval and John's confirmation. No conflicts
- Verification on main: Vitest 237/237, Self Check 411/411, production build successful. Simulator verified by John; physical iPhone validation follows when the deployment hold lifts
- Known issue 8 (open list item edit lost on app close) kept open and separate; no persistence changes

Merge - 2026-10-14: Tutorial first-launch fix (D9 / F9)
- Merge commit of fix/tutorial-first-launch (ce86ac7) into main (60bb9a8). No conflicts
- Verification on main: Vitest 182/182, Self Check 372/372, production build successful


Merge - 2026-10-14: Reminder attachments
- Merge commit of reminder-attachments (9007529) into main (3f04e30). No conflicts
- Before merging, the uncommitted work on main was committed and pushed: 62e7a9f (monetisation decision, paywall specification, deployment order) and 3f04e30 (calendar empty text). Generated index.html restored and regenerated; local Package.resolved replaced by the branch version (adds ion-ios-camera 1.0.5 and ion-ios-filesystem 1.1.2)
- Adds reminder attachments behind `reminderly-ff-reminder-attachments` (default off), the recovered list data loss and smart reminder fixes, the Move to tomorrow helper and tests, and the Repeats inactive tick colours
- Verification on main: Vitest 177/177, Self Check 370/370, production build successful, Info.plist permissions and 9 native plugins confirmed. Attachments passed John's iPhone testing. Device checks outstanding for the recovered list and smart reminder fixes and the Repeats tick
- reminder-attachments retained until the repository audit

Merge - 2026-10-09: Panel header standardisation
- Fast-forward merge of feature/settings-panels-header-keyline into main, 83f5a77 to d079bbb (no merge commit)
- Settings panel keyline below headers; New reminder and list panel headers 45px with standard 45 x 45 buttons (10px apart, #D9D9D9 inactive); list add-item + centred under the header tick; list header subtitle gap matched to the Lists list rows
- Verification on main: Vitest 53/53, production build successful. Self Check 334/334 on the branch

Merge - 2026-10-09: Settings panels phase 1 (UI only)
- Fast-forward merge of feature/settings-panels-ui into main, 81f8306 to 9271189 (no merge commit)
- Reminders and Lists settings panels use Dev Tools style click-through and toggle rows with info pop-ups, a key line and a System settings section. Click-through rows open empty titled pages. Toggles are not saved; Use Siri shortcuts is shared by both panels. Functionality to be wired in phase 2
- Verification on main: Vitest 53/53, production build successful. Self Check not run

Merge - 2026-10-09: Reminder three-dot alignment
- Fast-forward merge of feature/reminder-menu-alignment into main, d5660d4 to 9dfaf5e (no merge commit)
- Settings menu on: reminder row three-dot buttons inset 11.5px (margin-right) so they centre on the Reminders Settings button's dots, with the 16px text-to-dots gap preserved. Settings menu off unchanged
- Verification on main: Vitest 53/53, Self Check 334/334, production build successful. Settings on: dots aligned, 16px gap. Settings off: unchanged

Merge - 2026-10-09: Templates slide-up panel
- Fast-forward merge of feature/templates-slide-up-panel into main, a002abc to b8877aa (no merge commit)
- Templates presented as a Settings-style slide-up panel with the standard 45px header and close button; Back button removed; template content and behaviour unchanged
- Verification on main: Vitest 53/53, Self Check 334/334, production build successful. Drag-down dismissal passed on physical iPhone 15 Pro

Merge - 2026-10-09: Settings Menu Phase 2 and Settings panel updates
- Fast-forward merge of settings-panel-header-update into main, b724d52 to 3356673 (no merge commit)
- Includes Settings Menu Phase 2 (Lists Settings button, redesigned Templates button, Lists filter spacing correction), 45px Settings panel headers with Close SVGs, and standardised sliding panel positioning
- Final approved positioning: all sliding panels stop 28px below the bottom edge of the Reminderly logo, with Lists on or off
- Verification on main: Vitest 53/53, Self Check 334/334, production build successful. Physical iPhone testing passed

### feature/siri-onboarding

Created: 2026-10-22
Parent: main (c990dcd)
Purpose: Siri Phase 3, Type B. Reminders tutorial page "Add reminders with Siri" (page id 9), third, straight after Create a reminder. Shown while Siri for reminders is available (Siri flag and Reminders module on), whatever the user's Siri setting (John). Standard title, description and phone top slice. The phone plays the Siri journey, modelled on Siri in iOS 27 (no screen-edge glow; dark orb from the Dynamic Island, multicolour waveform, dark response panel): home screen with generic icons, Siri asks "What would you like to be reminded about?", the reply "Call Mum at 6pm today", Reminderly opens from its icon and "Call Mum" (today 6pm) is inserted at the top of the list. At John's request the Siri screen-edge glow (rotating colour band, blurred inwards) shows while Siri is active, as an agreed exception to the no-gradients rule. No native changes. Built as a draft for John's review at his request; the CTO's scope approval is needed before merge
Verification: see the Phase 3 completion report
Status: Merged into main (merge commit 9067897, branch head 87951d2, 2026-10-22). Branch deleted after the merge

### feature/siri-locked-stage3

Created: 2026-10-22
Parent: feature/siri-locked-stage2 (1acc2bf)
Purpose: Siri locked-device creation, stage 3 of 4 (Type E, [plans/siri-locked-device.md](./plans/siri-locked-device.md)). The Siri intent creates the reminder in the background, also when locked, without opening Reminderly: JavaScriptCore parse with the bundled siri-core.js, App Group pending list with read-back, plugin-identical notification and exact badge adjustment (Swift port of siri-badge.ts), widget snapshot, "That's done". Concurrent Siri retries share one run
Verification: see the stage 3 evidence in the plan. Stage 4 on John's iPhone (iOS 27.0.1): all 9 tests passed, including locked, CarPlay, alert actions and badge parity (plan, section 6)
Status: Merged into main (merge commit 2c0444d, 2026-10-22). Branch deleted after the merge

### feature/siri-locked-stage2

Created: 2026-10-22
Parent: feature/siri-locked-stage1 (62bb816)
Purpose: Siri locked-device creation, stage 2 of 4 (Type E, [plans/siri-locked-device.md](./plans/siri-locked-device.md)). No user-visible change. The app publishes the Siri context (effective notification settings, repeat flag, badge timeline) to the App Group and imports reminders from the App Group pending list by id on launch and return to the foreground, removing each once saved. Bridge: setSiriContext, getSiriPending, removeSiriPending
Verification: see the stage 2 evidence in the plan
Status: Merged into main (merge commit 2c0444d, 2026-10-22). Branch deleted after the merge

### feature/siri-locked-stage1

Created: 2026-10-22
Parent: main (c990dcd)
Purpose: Siri locked-device creation, stage 1 of 4 (Type E, [plans/siri-locked-device.md](./plans/siri-locked-device.md)). No behaviour change. Badge specification `addReminderToScheduled` and badge timeline (src/app/utils/siri-badge.ts), property-tested against `buildScheduledNotifications`; Siri core bundle exporting only `buildSiriReminder` (`npm run build:siri-core`), parity-tested in a no-DOM sandbox. `notifications.ts` exports its payload type and signature and moves the id hash into `notificationIdForReminder`, with no behaviour change
Verification: see the stage 1 evidence in the plan
Status: Merged into main (merge commit 2c0444d, 2026-10-22). Branch deleted after the merge

### fix/siri-single-phrase

Created: 2026-10-22
Parent: main (1afe653)
Purpose: Type B. John's iPhone testing: each of the three added phrases ("Remind me in / New reminder in / Add a reminder in Reminderly app") made Siri ask "Do you want to use Reminderly or Notes?" every time; "Add to Reminderly app" worked every time. Likely cause: "remind" and "reminder" also match Siri's built-in reminder and note handling. John chose to keep only the original phrase. AppShortcuts.swift and SIRI_PHRASES now hold one phrase; the settings page reads "To add a reminder with Siri just say...", "“Hey Siri...”" and the phrase (bold), "...then when Siri replies, say your reminder."
Verification: Vitest 270/270, Self Check 412/412, type-check 0 errors, build successful. John's iPhone (iOS 27.0.1, 006c5d3): "Add to Reminderly app" works with no app choice, removed phrases no longer offer Reminderly, Siri page approved (2026-10-22)
Status: Merged into main (merge commit 617b75a, branch head 5ad634b, 2026-10-22). Branch deleted after the merge

### fix/settings-close-on-resume

Created: 2026-10-22
Parent: main (b980d34)
Purpose: Type B (app lifecycle). Follow-up to fix/settings-close-on-background: on John's iPhone (main b980d34) the settings panel still showed after going to the Home Screen and reopening, though the Siri reopen passed. Likely cause: on a device the web view is suspended before the 'pause' handler runs (the simulator and the Siri background launch give it time). Fix: the panels also close on the Capacitor 'resume' event, when the web view is running again. A hard close already starts with the panels closed
Verification: Vitest 270/270, type-check 0 errors, build successful. John's iPhone (iOS 27.0.1): Home Screen and reopen, Siri reopen and hard close all show settings closed (2026-10-22)
Status: Merged into main (merge commit 1afe653, branch head f6d5047, 2026-10-22). Branch deleted after the merge

### feature/siri-phrases

Created: 2026-10-22
Parent: ui/notifications-keyline (821bea3, merged into main as 327baf6 before this branch)
Purpose: Siri Phase 2. (1) Phrases, Type B: four phrases accepted by John ("Add to / Remind me in / New reminder in / Add a reminder in Reminderly app"), all registered in AppShortcuts.swift and always active; a test keeps the settings list in step. (2) Settings, Type B: the "Use Siri shortcuts" toggle became a "Siri shortcuts" page: on/off, key line, "You can use any of these with Siri...", the phrases, "Then reply when Siri asks." (inactive while Siri is off). (3) Siri off spoken refusal, Type C ([plans/siri-off-refusal.md](./plans/siri-off-refusal.md)), superseding Phase 1 decision D1: on iOS 26+ the intent checks a fail-closed App Group value and says "Siri is turned off in Reminderly, so I can't add a reminder right now." without opening the app; when on, it continues in the foreground with no confirmation. iOS 16.0 to 25 keep the previous behaviour. Spike 1 (ForegroundContinuableIntent, iOS 16.4) was dropped because it added a "continue in the app" step
Verification: see the merge record on main
Status: Merged into main (merge commit b980d34, 2026-10-22). Branch deleted after the merge

### ui/notifications-keyline

Created: 2026-10-22
Parent: main (eaded41)
Purpose: Type A. Notifications settings page: key line between the alerts group (Notifications, Sound) and the badge group (App badge, Include today in badge)
Verification: preview check at phone width; included in the feature/siri-phrases device build
Status: Merged into main (merge commit 327baf6, 2026-10-22). Branch deleted after the merge
### fix/settings-close-on-background

Created: 2026-10-22
Parent: main (327baf6)
Purpose: Type B (app lifecycle). Found by John while testing Siri: the Reminders or Lists settings panel was still open when returning to the app. The open state is in memory only (not saved); iOS kept the app suspended, so it resumed as left. Fix: both panels close on the Capacitor App 'pause' event (app goes to the background). 'pause' rather than appStateChange, so Control Centre or a notification banner does not close them. The sub-page resets with the panel
Verification: Vitest 265/265, type-check 0 errors, build successful. Simulator: Lists settings open, Home, return (same process): panel closed
Status: Merged into main (merge commit 3cdf0e7, 2026-10-22). Branch deleted after the merge

### fix/siri-reliability

Created: 2026-10-22
Parent: main (4f274c6)
Purpose: Siri Phase 1, technical reliability ([plans/siri-phase-1.md](./plans/siri-phase-1.md)). Type C. The intent encodes "&+=?#" so "&" no longer cuts the text short. A time with no date at or before the current minute moves to tomorrow. A month-name date with no year that has passed moves to next year. The Siri settings info text is corrected. The Siri parsing moved from App.tsx to utils/siri.ts for tests. Siri still acts only when the flag, the preference and the Reminders module are all on; otherwise the request is ignored (John, D1)
Verification: Vitest 265/265 (16 new Siri tests), Self Check 412/412 (Node run), type-check clean, production build successful, simulator and iPhone builds installed and launched. John's iPhone Siri tests passed (cold launch, background, lock screen, Siri off, several variations), 2026-10-22. Phase 1 accepted from functional testing
Follow-up: relative time expressions ("Call mum in an hour" creates a Sometime reminder) recorded as a feature gap for Siri Phase 4, not a Phase 1 defect. Sequence: Phase 2 Siri phrases, Phase 3 Siri onboarding, Phase 4 relative time expressions
Status: Merged into main (merge commit ae3e94d, branch head 0cb25fd, 2026-10-22). Branch deleted after the merge

### fix/list-item-edit-background-save

Created: 2026-10-20
Parent: main (a3eaf08)
Purpose: Known issue 8 - an open list item edit was lost when the app was closed, because edits commit only on blur or Return and leaving the app does not blur the input. Fix: EditableListItem blurs its focused input on Capacitor appStateChange with isActive false, so the existing blur commit saves the edit (no new persistence logic). visibilitychange was tried first and rejected: it fires only on full backgrounding (about 1-2s after Home) and not before an app-switcher swipe-away, so those edits were still lost. Approved by the CTO
Verification (simulator): app switcher swipe-away (including about 0.8s after opening the switcher), Home plus 0.5s kill, background and resume, edit near the bottom with the keyboard scroll fix, template editor with A-Z re-sort after a switcher close: all retained. Home plus a synthetic kill within tens of milliseconds still loses the edit; not reachable by a user. Side effect: anything that makes the app inactive (Notification Centre, Control Centre, calls, system alerts) ends the edit and saves it. Vitest 237/237, Self Check 411/411, build successful. List title and unsubmitted new-item text out of scope
Status: Merged into main (merge commit a368cad, branch head f8ff91a, 2026-10-20). Branch deleted after the merge

### fix/list-keyboard-scroll-lock

Created: 2026-10-20
Parent: main (7ab6fe5)
Purpose: Fix the list editor locking with its header, title, close tick and add field off-screen after editing an item low in a long list. Root cause (measured on the simulator): with the keyboard open, iOS shrinks the viewport (874 to 471) and scrolls the page by 403 to reveal the item. Committing the edit re-renders the list sheet, whose top is taken from the logo's on-screen position, so the sheet was pinned 403px higher (140.6px to -262.4px) and stayed there after the keyboard closed. Fix: the list sheet adds the page scroll to that measured position (`getListSheetTop`, list sheet call site only; the shared `getBottomSheetTopPosition` is unchanged). Checks list-sheet-top-* added to list-checks (Vitest and Self Check)
Persistence finding (no change, approval required): item edits are saved only on blur or Return, as since the list editor was built (3989b32, 2026-04-04). An edit still open when the app is killed is lost. Long-standing behaviour, not a regression
Status: Merged into main (merge commit ac17400, branch head dd88b6d, 2026-10-20). Branch deleted after consolidation

### docs/rationalisation

Created: 2026-10-12
Parent: main (e194f02)
Purpose: Documentation review and rationalisation (Phase 1 technical review, Phase 2 audit, approved by the CTO and John). About 64 active documents consolidated into about 16, each checked against the code: README, docs/architecture.md, docs/development.md, docs/ios.md, docs/design.md, docs/features/ (reminders, scheduling-and-nlc, notifications, lists, settings, onboarding), docs/plans/reminder-attachments.md. settings-flags-spec.md kept in place as the active specification. Dated reviews, completed plans and audits moved to docs/archive, including the Phase 1 review (docs/archive/codebase-review-2026-10-12.md). Removed: ARCHITECTURE.md, guidelines/Guidelines.md, the numbered docs/00-08 tree, the March restructure records, the Noterly specification and the 61 superseded files in docs/archive (original-docs and notes), all recoverable from Git history at e194f02. Three code comments updated to point at the new documents (comment-only). No application changes
Status: Awaiting review by John and the CTO. Not merged

### feature/calendar-view

Created: 2026-10-12
Parent: main (1b4b92d)
Purpose: Calendar view on the Reminders tab - month grid with reminder dots, day selection, filter ranges, month navigation and New reminder date prefill. Behind `reminderly-ff-calendar` (Dev tools > Reminders) and the Show calendar setting `reminderly-pref-calendar`, both default off. Needs a screen at least 852pt tall (iPhone 15 Pro). Plan: docs/calendar-view-plan.md. Approved by the CTO and John
Status: Merged into main (merge commit 93c9917, branch head b70b24e, 2026-10-12). Pushed to origin and retained

### feature/lock-screen-widget

Created: 2026-10-12
Parent: main (751ced4)
Purpose: Circular lock screen widget - outstanding reminders for today (including overdue) with a completed-progress arc. Plan: docs/lock-screen-widget-plan.md
Status: Merged into main (merge commit cf2c300, branch head ad60f1e, 2026-10-12). Pushed to origin

### feature/settings-panels-header-keyline

Created: 2026-10-09
Parent: main (83f5a77)
Purpose: Header standardisation - keyline below the settings panel headers; 45px New reminder and list panel headers with 45 x 45 buttons; list add-item button aligned under the header tick
Status: Merged into main (fast-forward to d079bbb, 2026-10-09). Pushed to origin

### feature/settings-panels-ui

Created: 2026-10-09
Parent: main (81f8306)
Purpose: Settings panels phase 1 - Dev Tools style rows in the Reminders and Lists header settings panels (UI only)
Status: Merged into main (fast-forward to 9271189, 2026-10-09)

### feature/reminder-menu-alignment

Created: 2026-10-09
Parent: main (d5660d4)
Purpose: Align reminder row three-dot buttons with the Reminders Settings button when the settings menu is on
Status: Merged into main (fast-forward to 9dfaf5e, 2026-10-09)

### feature/templates-slide-up-panel

Created: 2026-10-09
Parent: main (a002abc)
Purpose: Present the List templates panel as a Settings-style slide-up panel
Status: Merged into main (fast-forward to b8877aa, 2026-10-09)

### settings-panel-header-update

Created: 2026-10-09
Parent: settings-menu-phase2-lists (4cb973d). Branched from Phase 2 because it is not yet merged into main (b724d52)
Purpose: Reminders Settings and Lists Settings panel header update

Status: Merged into main (fast-forward to 3356673, 2026-10-09)

Summary:
- Header row height changed from 40px to 45px in both panels; title remains left-aligned and vertically centred
- Close button changed from a 30 x 30px button with a grey 15px X to the supplied 45 x 45px blue circle Close SVG (stroke attributes written in JSX form)
- Same implementation in both panels. Horizontal margins (24px), 30px gap to panel content, panel positioning, drag-to-close and close behaviour unchanged
- Verified at 320, 375, 390 and 430px in both panels: header 45px, Close SVG 45 x 45px, title centre offset 0px, no overflow or clipping, both Close buttons close their panels
- Tests: Vitest 53 passed. Self Check 334 passed, 0 failed (headless). Vite build succeeded. Deployed to iPhone 17 Pro simulator and physical iPhone 15 Pro

Correction - Reminders Settings panel alignment with Lists off:
- Issue (predates the header update): with Lists off there is no tab bar, so getBottomSheetTopPosition fell back to fixed values (121.653px, or 54px at 570px height or less). The Reminders Settings panel opened 24px (91.64px on short screens) above the Reminders panel at 145.64px
- Fix: added mainPanelRef on the main white panel and getRemindersSettingsTopPosition. With Lists off it returns the panel's measured top minus 2px (same convention as Lists on); otherwise it uses getBottomSheetTopPosition. Used by the Reminders Settings panel only
- Shared bottom-sheet fallback and the New Reminder, Repeats, Tutorial, Dev Tools and Lists Settings positioning unchanged
- Verified at 320 x 568, 375 x 667, 390 x 844 and 430 x 932: settings top 143.64px, 2px above the Reminders panel (Lists off) and the tab bar (Lists on). Bottom edge unchanged. Header 45px, Close SVG 45 x 45px. At 320 x 568 all content visible; Close button and backdrop both close the panel
- Tests: Vitest 53 passed. Self Check 334 passed, 0 failed (headless). Vite build succeeded. Deployed to iPhone 17 Pro simulator and physical iPhone 15 Pro

Standardised sliding panel positioning (supersedes the Lists-off correction above):
- Decision: all sliding panels that use getBottomSheetTopPosition stop 28px below the rendered bottom edge of the Reminderly logo, with Lists on or off. No dependency on the Lists tab bar
- getBottomSheetTopPosition now measures the logo (new logoRef) and returns logo bottom + 28px. getOverlayTopPosition kept as the fallback if the logo has not rendered
- Removed getRemindersSettingsTopPosition and mainPanelRef; Reminders Settings uses the shared function again
- Panels affected: New reminder, Repeats, Tutorial, Dev Tools, Reminders Settings, Lists Settings, New/edit list. Bottom edges unchanged (screen bottom)
- Verified at 320 x 568, 375 x 667, 390 x 844 and 430 x 932 with Lists on and off: logo bottom 112.64px, panel top 140.64px, gap 28px for every panel
- 320 x 568: New reminder content scrolls fully with Date and Time on; Repeats opens at the same position. Dev Tools position verified on its log-in screen
- Storage unavailable banner (simulated, 51px): logo and panels move down together, gap stays 28px
- Tests: Vitest 53 passed. Self Check 334 passed, 0 failed (headless). Vite build succeeded. Deployed to iPhone 17 Pro simulator and physical iPhone 15 Pro

### settings-menu-phase2-lists

Created: 2026-10-09
Parent: main (b724d52)
Purpose: Settings Menu Phase 2 - Lists tab Settings button and redesigned Templates button

Status: Merged into main (fast-forward to 3356673, 2026-10-09)

Summary:
- Templates pill replaced by the supplied 45 x 45px Templates SVG whenever List templates is on, regardless of the Settings menu toggle. Click behaviour unchanged (opens the templates panel)
- Lists Settings button (same SVG as Reminders Settings) shown when the Settings menu toggle is on, independent of List templates. Opens the existing Lists Settings placeholder via handleHeaderMenuClick; Reminders Settings still opens Reminders Settings. No new flag
- Settings on: visible filters grouped left and action buttons grouped right, 10px gaps, buttons 45 x 45px
- Settings on, Templates on: pill padding 13px below 390px; Started hidden below 360px (only needed at 320px)
- Settings on, Templates off: Started hidden below 440px; pill padding 11px below 375px, 13px from 375px, 16px from 390px
- Settings off, Templates on (correction after device testing): Todo, Started and Done now grouped left with 10px gaps, matching Settings on, with the Templates button at the far right. Pill padding 13px below 390px; no filters hidden at any width
- Settings off, Templates off: legacy layout unchanged apart from a gap correction. At 389-405px (Started visible) the gap between the four filters is 10px instead of 18px, fixing the pre-existing 16px overflow at 390px. 18px elsewhere
- No horizontal overflow at 320, 360, 375, 390 and 430px in the three affected combinations
- Pre-existing 16px overflow at 390px with Settings and Templates both off: corrected (see gap correction above)
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

### fix/tutorial-first-launch

Created: 2026-10-14
Parent: main (60bb9a8)
Purpose: Tutorial first-launch fix (D9 / F9), recovered from the uncommitted claude/great-shannon-fbec22 worktree (preserved unchanged on recovery/tutorial-first-launch-wip, 2411d04)
Status: Merged into main 2026-10-14. Fresh-install simulator check: tutorial opens on first launch

Summary:
- "Show tutorial on first launch" reads the saved shown keys: each variant auto-opens only until it has been closed once. "Show tutorial on every start" unchanged. Manual access unchanged
- `shouldAutoOpenTutorial` (utils/tutorial-pages.ts) as recovered; App.tsx guard on start and on tab switch
- Adapted to current main: Self Checks rewritten without the removed storage helper; unit test added for an existing user who has seen only one tutorial
- Verification: Vitest 182/182, Self Check 372/372, production build successful


Created: 2026-08-25
Parent: main
Purpose: Reminder attachments feature - attach files and photos to reminders

Status: Merged into main 2026-10-14. Retained until the repository audit

Integration - 2026-10-14: main (10c6216) merged into reminder-attachments
- Approved by John (Option 1). Main is authoritative: every non-attachment conflict resolved to main
- Flag migrated to the settings model: `reminderly-ff-reminder-attachments` via useStoredSetting, default off in SETTINGS_DEFAULTS, toggle in Dev tools > Reminders > Features (John, 2026-10-14). Active only when Reminders is on. Off hides attachment UI and keeps attachments and files
- Excluded from the merge (kept as on main, not attachment scope): Claude.md to agents.md rename and Codex config, list data loss diagnostic and openListEditor change (c9baa91), smart reminder insert animation and smart reminder deletion fix (a3a56c3), Move to tomorrow restricted to overdue (84dacf3), header close button, tick colours and global user-select WIP (9cd01c6), 31px tutorial pills
- pdf.js now loaded on first PDF preview (dynamic import), so modules importing NewReminderOverlay load without browser globals
- Attachment Self Checks for the flag rewritten on the settings path (main removed the old helper)
- Branch docs (animation and wheel picker audits, attachment viewing handover, list data loss investigation) moved to docs/archive
- Verification: Vitest 167/167, Self Check 370/370 (14 attachment), production build successful, simulator and physical iPhone build, install and launch successful

Recovered fixes - 2026-10-14 (approved by John)
- List data loss fix (from c9baa91): openListEditor loads the list's values in the same render as opening the editor, instead of blanking them and filling them on a timer. Diagnostic log of populated lists becoming blank kept (`reminderly-debug-list-corruption-log`, last 20), detection in `getBlankedLists` (list-utils)
- Smart reminder fixes (from a3a56c3): deleting a smart reminder clears the list's due date and time (`clearListSmartReminder`) and updates an open list editor so saving it cannot restore the reminder. A smart reminder created from the reminder panel inserts with the normal reminder delay, haptic and highlight
- Move to tomorrow kept as on main: offered for reminders due today or overdue, not future or sometime. Condition moved to `canMoveToTomorrow` (reminder-utils). 84dacf3 (overdue only) not merged, by decision
- Header and UI work-in-progress from 9cd01c6 kept excluded
- Tests: recovered-fixes.test.ts (10 tests). Vitest 177/177, Self Check 370/370, production build successful, simulator and physical iPhone build, install and launch successful

Repeats tick - 2026-10-14 (approved by John): Repeats panel inactive tick matches the List header and New reminder panel (#D9D9D9 circle, white tick). Active colours and 50px size unchanged. Other 9cd01c6 UI changes (app-wide text selection, auto-generated list title) remain excluded

Summary:
- Step 7A: Choose a File via @capawesome/capacitor-file-picker with metadata-first validation, 25 MB limit, pending attachment lifecycle, generic file tile, delete confirmation
- Step 7B: Choose a Photo via Camera.getPhoto() with CameraSource.Photos opening standard iOS PHPickerViewController with album navigation, JPEG output, same pending attachment lifecycle
- Step 7C: Take a Photo via Camera.getPhoto() with CameraSource.Camera opening native iOS camera, same JPEG/pending attachment flow as Choose a Photo
- Added NSPhotoLibraryAddUsageDescription to Info.plist (required by Camera plugin getPhoto() method)
- Architectural decision: uses deprecated Camera.getPhoto() API because the newer chooseFromGallery() delegates to IONCameraLib which presents a custom SwiftUI picker without album navigation
- Physical-device camera UAT for Take a Photo remains outstanding
- 12 Self Checks cover attachment validation and persistence logic; native picker/camera behaviour verified through manual UAT only

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

### Camera plugin deprecated getPhoto() API for photo selection (2026-08-27)
Choose a Photo and Take a Photo use the deprecated Camera.getPhoto() API rather than the newer chooseFromGallery()/takePhoto() methods. The newer methods delegate to IONCameraLib which presents a custom SwiftUI photo grid without album navigation. The deprecated getPhoto() uses PHPickerViewController (for photos) and UIImagePickerController (for camera), providing the standard iOS experience. Trade-off: all images are returned as JPEG regardless of original format. Acceptable for reminder attachments. Plugin version: @capacitor/camera@8.2.3.

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

### 2026-10-09 (templates slide-up panel)

Branch: feature/templates-slide-up-panel

Completed:
- Templates panel moved out of the inline Lists container into a fixed bottom sheet that reuses the Settings panel pattern: slide-up/slide-down (0.25s easeInOut), transparent backdrop tap to close, drag-down to close, top 28px below the logo
- Standard 45px header titled Templates with the 45 x 45px close (X) button; the < Back control is removed
- Template rows, empty state, row menu, editor round-trip and New template button unchanged. Panel stays mounted beneath the template editor and is restored when the editor closes, as before
- Content uses the Settings panel 24px side padding; 34px bottom inset retained

Test results: Vitest 53 passed. Production build successful. Browser checks at 402px: open/close transitions, header geometry, scrolling with fixed header, editor open/close round-trip, New template, row menu and Use as list. Create template from list then Go to template opens Templates and the editor. Self Check 334 passed, 0 failed. Drag-down dismissal passed on physical iPhone 15 Pro. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (reminder menu alignment)

Branch: feature/reminder-menu-alignment

Completed:
- Settings menu on: reminder row three-dot buttons inset with margin-right: 11.5px so their centre sits on the same X axis as the dots in the 45px Reminders Settings button. The title/subtitle area ends 11.5px earlier so the 16px text-to-dots gap is preserved (an initial relative-positioning approach reduced the gap to 4.5px and failed testing). Offset derived from fixed geometry: 22.5 (Settings half-width) - 10 (row button half-width) - 1 (row px-px), so it holds at any width
- Applied via an optional alignWithSettingsButton prop on RowMenuButton, set only on the main Reminders list rows. Title/subtitle start positions, status circles and other RowMenuButton usages unchanged
- Settings menu off: no change

Test results: Vitest 53 passed. Self Check 334 passed, 0 failed. Production build successful. Browser checks with Settings on: dots centres matched exactly at 320, 375, 393 and 430px with a 16px text-to-dots gap at each width; title start and circle positions unchanged; row menu opens the reminder info overlay. Settings off: row dots unchanged at original position. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (settings panels UI, phase 1)

Branch: feature/settings-panels-ui

Completed:
- Reminders and Lists header settings panels populated with Dev Tools row types (UI only, phase 1). The Setting title / Setting subtitle placeholder row is removed; the Reminderly tutorial row is kept at the top of the Reminders panel
- Reminders panel: Natural Language Capture, Haptic feedback and Sounds click-through rows; Show calendar, Use 1 minute time increments and Show reminder sub-titles toggles; key line; System settings subtitle; Use Siri shortcuts toggle
- Lists panel: Sounds click-through row; Use Smart Reminders and Use list templates toggles; key line; System settings subtitle; Use Siri shortcuts toggle
- Every row has an (i) info pop-up with new user-facing copy
- Click-through rows open an empty page inside the panel with a back chevron, title and the panel close button
- Toggles hold local state only and are not saved. All start off except Use 1 minute time increments and Use Siri shortcuts, which start at the current Dev Tools values. Functionality to be wired in phase 2
- System settings Use Siri shortcuts toggle is shared by both panels (state held in App, UI only), so it stays in sync between panels and is kept when a panel is closed and reopened. Resets to the Dev Tools value on app restart
- ToggleRow, MenuRow, SectionSubtitle and KeyLine exported from DevToolsOverlay and reused in the new SettingsPanelContent component

Test results: Vitest 53 passed. Production build successful. Simulator checks: both panels render, a toggle flips, an info pop-up opens and closes, a click-through page opens and back returns with the toggle state kept. Siri toggled on in the Lists panel shows on in the Reminders panel. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (settings panels header keyline)

Branch: feature/settings-panels-header-keyline

Completed:
- Reminders and Lists settings panels: grey keyline (Dev Tools KeyLine) below the header, with 24px above and 24px below to the first setting row. Also shown under the header on the click-through pages
- Spacing between setting rows unchanged at 30px

Test results: Production build successful. Simulator: keyline and 24px gaps confirmed on the Reminders panel and the Sounds page. Lists panel uses the same component. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (New reminder header standardised)

Branch: feature/settings-panels-header-keyline

Completed:
- New reminder panel header set to 45px high, matching the settings panels
- Add tick button reduced from 50 x 50 to 45 x 45. The SVG viewBox crops the original 50px artwork, so the tick icon keeps its size and stays centred. Active and inactive colours unchanged
- Applies to every title using this header: New reminder, Edit reminder, Add smart reminder, Edit smart reminder

Test results: Production build successful. Simulator: header 45px, tick button 45 x 45 and aligned with the settings close button position; inactive (grey) and active (blue) states checked; panel closed without saving. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (list panel header standardised)

Branch: feature/settings-panels-header-keyline

Completed:
- List panel header title row set to 45px high. Subtitle (progress) line unchanged below it
- Small grey three dots replaced with the standard 45 x 45 three-dot button (blue circle, white dots); bare grey tick replaced with the standard 45 x 45 tick button (blue circle, white tick). 10px gap between the two
- Inactive state (no items yet): both buttons show a #D9D9D9 circle with a white icon and are not tappable, as before
- Button actions unchanged: three dots opens list settings (or the template menu), tick saves and closes
- Shared header component (src/imports/Header.tsx), so the template editor and the tutorial list mock-ups also use the new buttons

Test results: Vitest 53 passed. Production build successful. Simulator: new list panel header 45px, both buttons 45 x 45 with a 10px gap, inactive grey state confirmed; panel closed empty and no list was saved. Active (blue) state not checked on device, to avoid saving a test list. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (list add-item button alignment)

Branch: feature/settings-panels-header-keyline

Completed:
- List panel add-item (+) button inset 4px (mr-[4px], plus the row's existing 1px) so the 35px + is centred under the 45px header tick button. Shared AddListItemInput component, so the tutorial list mock-ups match

Test results: Production build successful. Simulator: + and header tick centres measured on the same vertical line; panel closed empty, no list saved. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (list title to subtitle gap)

Branch: feature/settings-panels-header-keyline

Completed:
- List panel header: gap between the title row and the subtitle reduced from 7px to 2px. The 45px title row added 5px under the vertically centred title, which had pushed the subtitle down; it is now back in its original position

Test results: Production build successful. Simulator: subtitle moved up 5px, matching its position before the 45px header change; panel closed empty, no list saved. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (list header subtitle gap matched to Lists list)

Branch: feature/settings-panels-header-keyline

Completed:
- Replaces the 2px gap fix above. List panel header subtitle now sits 4.25px up into the 45px title row (no flex gap) so the title-baseline to subtitle-cap distance matches the Lists list rows: 14.28px against 14.27px
- Subtitle set to ignore taps so the bottom edge of the three-dot and tick buttons stays tappable. No glyph overlap with the buttons
- Title vs subtitle left edge checked: both start at exactly 24px. The ~1px visual inset is the Lato bold capital's built-in left spacing at 20px (about 1.5px for 'N' against 0.4px for '0'); the Lists list rows show the same effect. No change made

Test results: Production build successful. Browser preview (402px): spacing measured against a real Lists list row; buttons tappable to the bottom edge. Simulator visual check. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (New reminder inactive tick standardised)

Branch: feature/settings-panels-header-keyline

Completed:
- New reminder panel inactive tick button now matches the list panel: #D9D9D9 circle with a white tick (was #F5F5F5 circle, #D5D5D5 tick). 45 x 45 size, centred icon, active blue state and behaviour unchanged. Applies to New reminder, Edit reminder, Add smart reminder and Edit smart reminder (shared header)
- List header subtitle offset (4.25px) and tap pass-through accepted. Title/subtitle horizontal alignment left unchanged at 24px; optional 1px nudge not applied

Test results: Vitest 53/53 passed. Production build successful. Self Check 334 passed, 0 failed. Simulator (iPhone 17 Pro): New reminder inactive (#D9D9D9) and active (blue) tick, Edit reminder header; nothing saved. Browser preview (402px): list panel active and inactive buttons, three-dot opens list settings from its bottom edge, template editor header, Reminders settings keyline (24px either side), tutorial list mock-up. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator.

### 2026-10-09 (panel spacing and layout standardisation)

Branch: feature/ui-tweaks (created from main)

Completed:
- Panel top padding standardised to 26px on all panels (main Reminders and Lists, settings, Templates, Lists editor, New and edit reminder, Repeats, Dev tools)
- Header to content space standardised to 26px (except Lists editor, which stays 30px below its subtitle). Margins used where a shared container gap also spaces other content
- Top corner radius standardised to 15px on all panels. Main panel no longer switches to 20px when Lists is off; Dev tools 20px to 15px
- Bottom space standardised to 24px on all panels; bottom buttons now 24px from the content above and 24px from the bottom of the screen. Reminders and Lists done/deleted pages left at 0px
- Dev tools headers (home and sub-pages) set to 45px high with the standard 45 x 45 close button
- Settings panels: separator below the header removed; rows reordered with toggles first, then click-through rows
- Row 3-dot button aligned with the 45px top right button when settings are on, now on Lists rows, both done/deleted pages and Templates (Reminders rows already aligned)
- docs/05-design-and-layout/sizing-spacing.md updated with the panel standards

Test results: Vitest 53/53 passed. Production build successful. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator after each change; visual checks by user on device.

### 2026-10-09 (Lists editor header spacing)

Branch: feature/ui-tweaks

Completed:
- Lists editor header to content space reduced from 30px to 26px, measured from the bottom of the subtitle (title row and subtitle treated as one header block). Add-item input moves up 4px, now about 40px below the 45px title row. Resolves the last panel spacing exception
- Tutorial copy of the Lists editor updated to match (gap 30px to 26px). Its existing 30px top padding left unchanged
- 35px gap between the add-item input and list items unchanged
- docs/05-design-and-layout/sizing-spacing.md updated: exception removed, subtitle header rule added

Test results: Vitest 53/53 passed. Production build successful. Capacitor copy and Xcode builds successful. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator. Visual sign-off by product owner.

### 2026-10-09 (feature/ui-tweaks merged into main)

Branch: main

Completed:
- feature/ui-tweaks merged into main (merge commit 08a9917, branch head b4152f0). Panel spacing and consistency standards: 26px top padding and header to content space, 24px bottom space and content to bottom button, 15px top corners, standard 45px headers and close buttons, settings panel row order, row 3-dot alignment when settings are on, Lists editor header spacing
- Feature branch retained

Test results: Vitest 53/53 passed. Production build successful after merge.

### 2026-10-10 (feature/panel-spacing-24)

Branch: feature/panel-spacing-24 (created from main at ee5444a)

Completed:
- Panel top padding and header to content space standardised from 26px to 24px on the main Reminders and Lists panels, Reminders and Lists settings, Templates, New and edit reminder, Repeats and Dev tools
- Bottom space and content to bottom button already 24px, unchanged. Done/deleted pages keep 0px bottom space
- Lists editor: top padding 24px, header to content (below the subtitle) kept at 26px
- Tutorial copy of the Lists editor aligned with the app: top padding 30px to 24px
- docs/05-design-and-layout/sizing-spacing.md updated
- Reminders settings: tutorial link icon and subtitle removed, "Use 1 minute time increments" renamed "1 minute time increments", "Show reminder sub-titles" toggle removed
- Lists settings: "Use list templates" toggle removed
- Info icons in the user-facing Reminders and Lists settings panels hidden by default. New Dev tools > System > Features toggle "Show info icons" (default off, stored as reminderly-ff-info-icons) turns them back on. Dev tools info icons always shown. Code and info copy kept
- Centred overlay standard applied to every overlay (user-facing and Dev tools): 340px wide, 40px top and bottom padding, 30px side padding, 20px minimum from the screen edge, 40px from title to content and between content sections, 30px between content elements and between buttons. List titles in overlays now wrap. Template editor menu copy "Use a list" corrected to "Use as list". centred-overlay-ui.md rewritten to the new standard

### 2026-10-10 (feature/settings-overlays)

Branch: feature/settings-overlays (created from feature/panel-spacing-24 at c76f5f3)

Completed:
- Reminders and Lists settings changed from slide-up panels to centred overlays following the overlay standard: 340px wide, 40px top and bottom and 30px side padding, centred title, no close button (tap outside to close), no open or close animation
- Sub-pages (Natural Language Capture, Haptic feedback, Sounds) open inside the overlay with a back arrow left of the centred title
- Rows keep label left, toggle or arrow right, 30px apart. 30px above and below the separator (overlay standard: separators always have 30px either side), followed by the System settings subtitle and Siri row
- Tutorial link closes the settings overlay immediately before the tutorial opens (previously closed after 250ms)
- Docs: centred-overlay-ui.md, sizing-spacing.md
- Settings overlays: separator and System settings subtitle removed; Use Siri shortcuts moved to below the last toggle (Reminders: after 1 minute time increments; Lists: after Use Smart Reminders)
- Settings overlays: "Reminderly tutorial" row added to Lists settings (opens the lists tutorial) and moved to the bottom of both overlays. Tutorial icon centred on the row chevrons and recoloured to the chevron grey #939393
- Tutorial row icon replaced with the click-through row chevron (same size and colour) rotated to point up
- Use Siri shortcuts toggles in Reminders and Lists settings are now independent (previously one shared value)
- Tutorial rows renamed: "Reminders tutorial" in Reminders settings, "Lists tutorial" in Lists settings
- Reminders settings: 1 minute time increments moved to the bottom of the toggle rows (after Use Siri shortcuts)
- Lists settings: Haptic feedback click-through row added above Sounds (opens an empty sub-page, like Reminders)

### 2026-10-10 (feature/settings-overlays merged into main)

Branch: main

Completed:
- feature/settings-overlays merged into main (merge commit 78e19cb, branch head edf2bbb), including the underlying feature/panel-spacing-24 work (c76f5f3). Panel spacing 24px, settings row changes, info icons hidden by default behind the Dev tools "Show info icons" toggle, centred overlay standard on every overlay, Reminders and Lists settings as centred overlays with tutorial rows, independent Siri toggles and Lists Haptic feedback row
- Both feature branches retained

Test results: Vitest 53/53 passed. Type check clean. Production build successful after merge. Product owner visual sign-off confirmed.

### 2026-10-11 (feature/settings-flags-model - Phase 0)

Branch: feature/settings-flags-model (created from main at 15c44d4, matching origin/main)

Completed:
- Settings and feature flags model agreed and approved by senior developer review: dev tools flags control availability, user settings control state, one flag per feature, flags never reset preferences, development defaults off with options inside a feature on, existing installs keep established behaviour
- docs/settings-audit.md: item-by-item audit of dev tools and user settings, decisions, defaults and migration matrix, review outcome, Phase 0 corrections
- docs/settings-flags-spec.md: Phase 0 specification covering baseline results, code-validated findings, resolver, parent flags, repeat reminders flag, notifications, storage migration mapping, NLC, Siri, UI approach, acceptance criteria per phase and decisions for approval
- No application code changed

Test results (baseline on unchanged code): Vitest 53/53 passed. Self Check 334/334 passed (desktop browser). Repo guard passed. Web build succeeded. iOS simulator build succeeded. Type check not run (no tsconfig or TypeScript compiler in the project). Not deployed to device.

Decisions: D1 to D9 provisionally approved by senior developer review (D3 visual sign-off in Phase 3, D4 with migration regression tests, D6 with rollback verified, D8 spoken Siri reply recorded as a future improvement, D9 as a separate tracked fix). D10 ask state key and values awaiting confirmation. Spec updated with repeat flag enforcement points, ask state values, rollback behaviour and expanded acceptance criteria.

Outstanding: D10 confirmation. Phase 1 awaits approval.

### 2026-10-11 (feature/settings-flags-model - Phase 1)

Branch: feature/settings-flags-model

Completed:
- Phase 0 final review corrections recorded in docs/settings-flags-spec.md (independent alerts and badge, D10 refinements, Phase 1 boundary, existing-install detection check)
- New src/app/settings/: keys.ts (storage keys and development defaults), resolver.ts (read-only isFeatureActive with parent flags, preferences and iOS permission), migration.ts (one-time copy of current keys to new keys, never overwrites, never deletes, schema marker reminderly-settings-schema = 1)
- Migration runs in src/main.tsx before the app renders
- Dev tools Enable reminders, Enable notifications and Repeat reminders toggles now saved (reminderly-ff-reminders, reminderly-ff-notifications, reminderly-ff-repeat-reminders). Nothing outside dev tools reads them yet
- New Self Check suite "Settings foundation" (17 checks, in-memory storage), also run by Vitest (src/app/__tests__/settings.test.ts)
- The app still reads its current keys. No user-facing behaviour change

Test results: Vitest 70/70 passed. Self Check 351/351 passed (desktop browser). Repo guard passed. Web build succeeded. iOS simulator and iPhone builds succeeded with refreshed web assets. Existing-install detection verified (first launch with no data saves the detection keys). Simulator upgrade and rollback test passed (main -> Phase 1 -> main -> Phase 1: data and current keys unchanged, no second migration). iPhone 15 Pro upgrade verified with real data (25 reminders, 4 repeating, 17 lists): data and current keys unchanged, new keys correct.

Outstanding: Phase 2 awaits approval. Phase 3 dependency on settings changed in dev tools after migration recorded in the spec.

### 2026-10-11 (feature/settings-flags-model - Phase 1.1)

Branch: feature/settings-flags-model

Completed:
- One authoritative storage key per setting. App.tsx reads 16 settings through useStoredSetting (src/app/settings/useStoredSetting.ts): read once, written only on change. The 16 write-on-startup effects were removed
- Migrated settings now read and written only under their new keys (reminderly-ff-lists, reminderly-pref-one-minute-increments, reminderly-pref-notif-alerts, reminderly-pref-notif-badge, reminderly-pref-notif-include-today, reminderly-config-tutorial-first-launch, reminderly-test-tutorial-every-start, reminderly-config-templates-in-clean-state, reminderly-ff-siri-reminders). Haptics uses reminderly-pref-haptics. utils/featureFlags.ts (dummy lists) reads reminderly-ff-lists with the same fallback as the app
- Transitional fallbacks equal to the current app defaults (TRANSITIONAL_FALLBACKS in keys.ts). Development defaults take effect at each integration phase without overwriting saved values
- F8 fixed: turning Lists off no longer saves smart reminders as off
- Dev tools tutorial checks now use the new tutorial keys
- 8 new Self Check checks and a Vitest source scan that fails if any legacy settings key is used outside the migration

Test results: Vitest 79/79 passed. Self Check 359/359 passed (desktop browser). Repo guard passed. Web build, simulator and iPhone builds succeeded. Browser: new install writes no settings keys, second launch writes nothing, a Dev tools change writes only the authoritative key and persists after reload, smart reminders unchanged through Lists off and on (on and off cases). Simulator: Phase 1 to 1.1, relaunch, rollback to main and re-upgrade, no keys changed. iPhone 15 Pro: Phase 1 to 1.1 and restart with real data (25 reminders, 4 repeating, 17 lists), no keys changed.

Outstanding: Phase 2 awaits review.

### 2026-10-11 (feature/settings-flags-model - Phase 2)

Branch: feature/settings-flags-model

Completed:
- Dev tools home grouped into Feature flags, Config, Testing tools, and Access and diagnostics, using the existing rows and section heading style
- Feature pages now hold availability flags only. New pages: Siri (Siri for reminders, Siri for lists locked off), Config, Testing tools, User preferences (temporary home for preference controls until Phase 3)
- New 1 minute time increments availability flag (reminderly-ff-one-minute-increments), not yet read by the app
- Reminders and Lists cannot both be off: canChangeModuleFlag in the resolver, used by every Dev tools change to either flag
- Settings writes report failures through the existing "Storage unavailable" banner
- Self checks page title renamed from Testing to Self checks
- Tests: 2 new Self Check checks (last module guard, write failure) and a Vitest check that each of the 44 Dev tools controls appears exactly once

Test results: Vitest 125/125 passed. Self Check 361/361 passed (desktop browser). Repo guard passed. Web build, simulator and iPhone builds succeeded. Browser (375px): structure checked, last module guard both directions, preferences and data unchanged, Lists off persisted through reload. Simulator and iPhone 15 Pro: installed in place, no stored keys changed. Manual iPhone Dev tools checks outstanding.

Outstanding: manual iPhone checks; Phase 3 awaits review.

### 2026-10-11 (feature/settings-flags-model - Phase 2 corrections)

Branch: feature/settings-flags-model

Completed (after iPhone acceptance testing and audit):
- C1: Show tutorial on first launch moved to Feature flags > Onboarding (same key and behaviour)
- C2: Unimplemented Siri for lists, Phone number recognition and Contact recognition rows removed from Dev tools (keys unchanged)
- C3: Settings writes only raise the storage error, never clear it, so they cannot hide a reminder or list save failure
- C4: Preference controls renamed "Temporary user preferences", with info text stating they are temporary and do not control availability. They are removed in Phase 3

Test results: Vitest 122/122 passed. Self Check 361/361 passed (desktop browser). Web build, simulator and iPhone builds succeeded. Deployed to iPhone 15 Pro and iPhone 17 Pro simulator, no stored keys changed. iPhone retest outstanding.
- Temporary user preferences page removed from Dev tools. Decision made 2026-10-11 12:23 BST by John (product owner): Dev tools controls availability only, users control their own preferences. Until their user settings are wired (Phase 3, notifications Phase 4), 1 minute increments, NLC options, notification alerts, badge, include today and haptics stay at their saved values (NLC options at their defaults). Vitest 111/111 passed

### 2026-10-11 (feature/settings-flags-model - Phase 3 progress)

Branch: feature/settings-flags-model

- Steps 1 to 5 implemented (foundation, Reminders master with Lists-only layout and notification safeguard, Repeat reminders flag, 1 minute increments, Siri). C1 fix: Reminders off cancels pending then removes delivered Reminderly notifications, at toggle, launch and resume
- iPhone acceptance (product owner): steps 1-2 visual tests, C1-C4, C6, D1-D4, E1-E3, F1-F4 passed. C5 confirmed as expected behaviour: notifications missed while Reminders was off are not re-created; future reminders resume and the badge is recalculated
- Siri (G1-G4): deferred, not failed. Siri is unusable and off by default; to be addressed and tested separately
- Steps 6 and 7 built (NLC and Haptic feedback user pages, Haptics availability flag), awaiting visual approval

### 2026-10-11 (feature/settings-flags-model - Phase 3 complete)

Branch: feature/settings-flags-model

Completed:
- Step 8: Show calendar and Sounds rows hidden behind their flags (reminderly-ff-calendar, reminderly-ff-sounds, default off, no Dev tools control until built). "Use Smart Reminders" removed from Lists settings (smart reminders is admin-only). No saved preferences or data changed
- NLC preferences stored as booleans (reminderly-pref-nlc, -date, -time, -repeats, -auto-parsing); the original mode and recognition keys were never written by any build, so there is nothing to migrate
- Phase 3 summary: availability flags wired for Reminders (Lists-only layout and notification safeguard), Repeat reminders, 1 minute increments, Siri, NLC, Haptics, Calendar and Sounds. Every working preference is set in Reminders or Lists settings. Dev tools holds availability, config and testing only

Deferred: Siri testing (G1-G4). Phase 4 (notifications) not started.

### 2026-10-11 (feature/settings-flags-model - settings overlay fixes from testing)

Branch: feature/settings-flags-model

- Centred overlays: at least 100px from the top and bottom of the screen (and clear of the notch and home indicator); content that does not fit scrolls inside the card. Settings overlays keep the title fixed. viewport-fit=cover added so safe-area insets are available
- Haptic feedback page (product owner decision): the top "Haptic feedback" toggle turns every action off in one go and the actions stay listed. Turning it back on restores each action's previous choice (or turns all on if none were on). Turning an action on while the top toggle is off turns on only that action and the top toggle; turning the last action off turns the top toggle off. The Dev tools Haptics flag also preserves saved choices

### 2026-10-11 (feature/settings-flags-model - Phase 3 closed)

Branch: feature/settings-flags-model

Completed:
- Haptics redesign approved (product owner and senior developer): per-panel Haptic feedback on/off plus three literal switches per panel (Reminders: Creating, Completing, Deleting a reminder; Lists: Ticking off a list item, Completing a list, Deleting a list item). Related actions follow their parent switch. Existing choices preserved; no migration
- Clean-up: unused per-action list removed; resolver treats haptics as on while either panel is on; 3 new Self Check checks (every action in exactly one switch, preserved choices, resolver)
- Baselines updated: src/app/dev/BASELINE.md (clean run regenerated from the actual checks), docs/06-quality-and-dev/tests-and-baselines.md
- Phase 3 approved for closure by the senior developer after physical iPhone testing (haptic feedback, smart reminders, list item editing all passed)

Test results: Vitest 120/120 passed. Self Check 366/366 passed. Repo guard passed. Web, simulator and iPhone builds succeeded.

Deferred: Siri testing, tutorial on first launch (D9), parser observations, template haptics. Phase 4 not authorised. Not merged to main.

### 2026-10-11 (feature/settings-flags-model merged into main)

Branch: main

Completed:
- feature/settings-flags-model merged into main (merge commit 4dafe0e, branch head abafb8b), approved by the senior developer after Phase 3 closure. Merge introduced no changes beyond the branch (identical tree). Settings and feature flags Phases 0 to 3: settings foundation (keys, resolver, migration, single source of truth), Dev tools reorganised into availability, config, testing and access, availability flags wired, user preferences in Reminders and Lists settings, Reminders-off notification safeguard, centred overlay height limits, haptics redesign
- Branch retained

Test results (post-merge on main): Vitest 120/120 passed. Self Check passed with no failures. Repo guard passed. Web, simulator and iPhone builds succeeded.

Deferred: Siri testing, tutorial on first launch (D9), parser observations, template haptics. Phase 4 not authorised.

### 2026-10-11 (feature/click-sounds - click sounds built)

Branch: feature/click-sounds (created from main at a54e3b3, approved by the senior developer). Step 1 committed as 50277dc; the rest committed after senior developer approval. Physical iPhone testing passed. Not merged.

Completed:
- Click sounds on the same actions as haptics, generated in code with Web Audio (utils/sounds.ts). No audio files, native code or new dependencies. Audio session set to ambient where supported
- Sounds pages in Reminders and Lists settings, same layout and behaviour as Haptic feedback, with choices saved separately (reminderly-pref-sounds, JSON). Both panels off by default
- Dev tools > System > Sounds availability flag (reminderly-ff-sounds), off by default (senior developer decision); on during branch testing
- hapticTap calls playClick first, so sounds and haptics each follow only their own settings
- Product owner request: the New reminder and New list buttons give a haptic and click. New reminder follows Creating a reminder; Lists gains a Creating a list switch (createList) on both the Haptic feedback and Sounds pages
- Decisions (senior developer): no TypeScript tooling added (check not applicable); SOUND_GROUPS defined in sounds.ts to avoid a circular import, kept in step with HAPTIC_GROUPS by Self Check

Test results: Vitest 132/132 passed. Self Check 369/369 passed (Node run). Repo guard passed. Web, simulator and iPhone builds succeeded.

### 2026-10-11 (feature/click-sounds merged into main)

Branch: main

Completed:
- feature/click-sounds merged into main (merge commit 1b7cd66, branch head 30769b8), approved by the senior developer after physical iPhone testing passed. Merge introduced no changes beyond the branch (identical tree). Click sounds: Web Audio click on the same actions as haptics, Sounds pages in Reminders and Lists settings with choices saved separately from haptics (both panels off by default), Dev tools > System > Sounds availability flag (reminderly-ff-sounds, off by default), feedback on the New reminder and New list buttons, Creating a list switch added to Lists haptics and sounds
- Branch retained

Test results (post-merge on main): Vitest 132/132 passed. Repo guard passed. Production build succeeded. Self Check 369/369 passed on the branch (identical tree).

Deferred: Siri testing, tutorial on first launch (D9), parser observations, template haptics. Phase 4 not authorised.

### 2026-10-11 (feature/ui-tweaks-2 - UI tweaks)

Branch: feature/ui-tweaks-2 (created from main at 1cabc35, approved by the product owner). Back arrow and overlay height changes accepted by the product owner after iPhone testing and committed. Not merged.

Completed:
- Settings overlay back arrow: the handler was wired, but only the 9x17 arrow glyph was tappable, so it appeared broken on iPhone. PanelHeader back button now has a 45x45 tap area with the arrow in the same position. Applies to every click-through page in Reminders and Lists settings. Dev tools back buttons have the same small tap area and are unchanged
- Settings overlay height (product owner decision): Reminders and Lists settings cards are a fixed 450px tall, so moving between pages no longer resizes the card or moves the title. The existing centred overlay wrapper keeps at least 100px clear top and bottom; on shorter screens the card shrinks to fit and the rows scroll. Other centred overlays unchanged

### 2026-10-11 (feature/dev-tools-restyle - Dev tools look and feel)

Branch: feature/dev-tools-restyle (created from main at 1cabc35, approved by the product owner). Accepted by the product owner after iPhone testing, committed and pushed. Not merged.

Completed:
- Dev tools restyled to the product owner's mockups: #F7F7F7 page, 20px side and 24px top margins, 45px header (robot icon on home, blue back button on sub-pages, title centred, blue close button), white cards with 6px corners 24px apart, 60px rows with a full-width 1px #F7F7F7 separator
- New Dev tools components in DevToolsOverlay.tsx (DevPage, DevHeader, DevCard, DevCardBody, DevToggleRow, DevNavToggleRow, DevMenuRow). Toggles sit to the left of the label. The shared ToggleRow, MenuRow and KeyLine used by the settings overlays and onboarding are unchanged
- Home page: toggle rows grouped first, click-through rows after. Siri is now "Siri shortcuts" with a toggle (Siri for reminders flag, no confirmation) after Onboarding. Config row renamed "Config tools" (page title too), Testing card titled "Testing", Siri page titled "Siri shortcuts"
- Login: robot logo, 70px password field with lock icon, 65px Login button, 6px corners. "Log-in to Reminderly" title and placeholder removed; eye icon, error and reveal behaviour kept
- Other pages (Self checks, Dummy reminders, Dummy lists, Dev tools password) moved into white cards with their existing controls, for product owner review
- settings.test.ts Dev tools label list updated for the renamed rows
- Dev tools panel now opens level with the top of the logo (other sliding panels unchanged, still 28px below it), with 15px top corners visible. Pages inside the panel have no background of their own, because iOS painted the corners black when clipping scrolling content

Test results: Vitest 132/132 passed. Self Check 369/369 passed (in-app). Repo guard passed.

### 2026-10-11 (feature/ui-tweaks-2 and feature/dev-tools-restyle merged into main)

Branch: main

Completed:
- Merge approved by the senior developer in the proposed order, after product owner iPhone testing of both branches
- feature/ui-tweaks-2 merged into main first (merge commit 9573271, branch head 053de45), no conflicts: settings overlay back arrow tap area and fixed 450px overlay height
- feature/dev-tools-restyle merged second (merge commit 003aabf, branch head 732f766): Dev tools restyle, panel at logo top with 15px corners. Only conflict was this file (both branches added an entry); resolved by keeping both entries
- Both branches retained

Test results (post-merge on main): Vitest 132/132 passed. Self Check 369/369 passed (Node run). Repo guard passed. Production build succeeded.

### 2026-10-12 (feature/lock-screen-widget merged into main)

Branch: main

Completed:
- Merge approved by the senior developer after simulator test sheet (67 passed, 0 failed) and product owner iPhone 15 Pro checks (visual, count accuracy, flag off/on)
- feature/lock-screen-widget merged into main (merge commit cf2c300, branch head ad60f1e), no conflicts: circular lock screen widget, WidgetBridge plugin, App Group, Dev tools > System > Lock screen widget flag (default on)
- Branch pushed to origin and retained

Test results (post-merge on main): Vitest 138/138 passed. Self Check 379/379 passed (Node run). TypeScript clean. Repo guard passed. Production build succeeded.

### 2026-10-12 (feature/calendar-view - Calendar view)

Branch: feature/calendar-view (created from main at 1b4b92d, approved by the CTO and John). Pushed. Not merged.

Completed:
- Month calendar between the filter row and the reminder list, behind the Dev tools > Reminders > Calendar flag and Reminders settings > Show calendar, both default off
- Up to 4 dots per day by category; overdue stays on its original date; repeats show the current occurrence only; done, deleted and Sometime reminders have no dot
- Tap a day to list its reminders (today includes overdue); filters highlight their date range and grey the rest; selecting a day clears the filter and the other way round
- Month arrows and swipe; changing month clears the selected day and the list stays on today; active filters persist
- New reminder from a selected future day starts with that date at 12pm
- Empty day message "No reminders... take it easy!"; turning the calendar back on resets to today with no filter
- Needs a screen at least 852pt tall (iPhone 15 Pro, product owner decision; 6-row months leave about one reminder row, below the CTO's 103pt guideline); shorter screens keep the existing view and hide Show calendar (setting kept). A tighter spacing that allowed 840pt (0fe87e4) was rejected after device testing and reverted (c946791); SVG spacing kept
- Pure calendar helpers in reminder-utils.ts; RemindersCalendar component; no changes to scheduling, notifications, recurrence or badges

Commits: fec8864 (flag and setting), c3c327e (calendar logic), 7bed069 (component), 9dc0772 (day selection), 350cf65 (navigation and New reminder date), 94707c5 (reset, empty day, minimum height, tests), 0fe87e4 (spacing, reverted by c946791), 8b6dac5 (880pt minimum, then set to 852pt) and docs.

Test results: Vitest 165/165 passed. Self Check 384/384 passed (Node run). Repo guard passed. Production build succeeded. Browser preview checks at 402x874, 393x852 and 393x851. Built, installed and launched on the iPhone 17 Pro simulator and iPhone 15 Pro. Product owner on-device checks outstanding.

### 2026-10-12 (feature/calendar-view merged into main)

Branch: main

Completed:
- Merge approved by the CTO after product owner on-device testing passed on the iPhone 15 Pro
- feature/calendar-view merged into main (merge commit 93c9917, branch head b70b24e), no conflicts: calendar view on the Reminders tab behind Dev tools > Reminders > Calendar and Reminders settings > Show calendar (both default off), 852pt minimum screen height, show/hide animation
- Branch retained

Test results (post-merge on main): Vitest 165/165 passed. Self Check 384/384 passed (Node run). Repo guard passed. Production build succeeded.

### 2026-10-12 (fix/self-check-audit - Self Check coverage audit fixes)

Branch: fix/self-check-audit (created from main at b584736, approved by John). Committed as c96f491 and pushed.

Completed:
- Self Check coverage audit agreed with the CTO and John; small, focused update only
- Dev tools and feature flags suite: 33 checks that only exercised localStorage, local variables or copies of default rules replaced by 1 check of the real defaults path (readStoredBool and the resolver). Paywall now checked as default off, matching SETTINGS_DEFAULTS (the old check assumed on)
- Calendar: month navigation and New reminder prefill checks added; calendar filter ranges check extended with combined Later and Sunday (no rest of week)
- Vitest Dev tools controls guard extended to Sounds and Lock screen widget
- BASELINE.md, self-check-system.md, tests-and-baselines.md and dev-tools.md updated to the verified counts

Test results: Self Check 354/354 passed (Node run, 10 suites: 384 - 33 + 1 + 2). Vitest 167/167 passed. Production build succeeded.

### 2026-10-12 (fix/self-check-audit merged into main)

Branch: main

Completed:
- Merge approved by the CTO after the product owner confirmed the in-app Self Check passed on the iPhone 15 Pro (354/354)
- fix/self-check-audit fast-forwarded into main, b584736 to c96f491 (no merge commit), 8 files: Self Check audit fixes and baseline 354
- Branch deleted locally and on the remote

Test results: Self Check 354/354 passed (in-app on iPhone 15 Pro and Node run). Vitest 167/167 passed. Production build succeeded.

### 2026-10-15 (feature/date-presets - Date presets)

Branch: feature/date-presets (created from main at 4abbf9c, approved by the CTO and John). Plan: [plans/date-presets.md](plans/date-presets.md).

Completed:
- Date preset pills in the new and edit reminder panel: Tomorrow morning (next day 8am), Tonight (today 6pm), Next week (next Monday after today 8am)
- Tapping a pill turns date and time on with the pickers closed; tapping the active pill turns them off through the manual toggle-off path; any later date or time change resets the pill. Repeats unchanged. Hidden in smart reminder mode
- Dev tools > Reminders > Date presets flag (default off) and Reminders settings > Show date presets (default on); flag off overrides the setting
- Preset dates use local calendar arithmetic (`utils/date-presets.ts`); checks cover every weekday, month and year end and UK daylight saving weeks
- Tonight saved after 6pm schedules no notification (Vitest, using the existing `buildScheduledNotifications` past-time rule)

Test results: Vitest 190/190 passed. Self Check 378/378 passed (Node run, 6 new). Production build succeeded. Simulator checks passed on the iPhone 17 Pro simulator. iPhone confirmation of Tonight after 6pm outstanding.

Follow-up (2026-10-15, after CTO and product review): "Tomorrow morning" label shortened to "Tomorrow". Pills keep the standard 10px gap, aligned left, and fit on 375pt screens and wider (295.5pt needed, 327pt available at 375pt); the row still scrolls sideways if it ever does not fit. Vitest 190/190 passed. Deployed to the iPhone 17 Pro simulator and iPhone 15 Pro.

### 2026-10-15 (feature/notifications-settings - Notifications Phase 4)

Branch: feature/notifications-settings (created from main at bd5b11a after verifying main clean and equal to origin/main; approved by the CTO and John). Plan: [plans/notifications-phase-4.md](plans/notifications-phase-4.md).

Decisions: D1 to D5 approved by the CTO. Notification sound added to Phase 4 scope by John: one on/off toggle using the iOS default sound, off by default for all users (D3).

Completed:
- Scope committed (2e9eaa5)
- Step 1 device checks on the iPhone 15 Pro, all passed: current alerts are silent; sound name `default` plays the iOS Default Alerts tone; `app-settings:` opens Reminderly's iOS Settings page. Temporary test card removed, not committed
- Stage 2 (7e2e79c): alerts preference controls alerts (F1); alerts and badge independent with silent badge-only notifications (same selection and 64 limit); sound on adds the iOS default sound to alerts only; sync checks permission and never prompts (F3); Notifications flag off cancels notifications and clears the badge. Vitest 201/201, Self Check 382/382
- fix/time-picker-scroll merged into this branch so Phase 4 builds have working time wheels (fix awaits CTO approval for main)
- Stage 3: notification transitional fallbacks removed (new installs: alerts and badge off, include today on, sound off); Settings > Reminders > Notifications page with Notifications, Sound (while alerts on), App badge and Include today in badge (while badge on); "Turn on in Settings" row when iOS permission is denied, re-checked on return to the foreground. Settings checks for saved off and on values, defaults and the sound key. Vitest 205/205, Self Check 386/386. Toggling on while permission is undecided saves the preference only; the in-app ask (6.3) is stage 4
- Device checks for stages 2 and 3, all passed. iPhone 15 Pro (John): default state; Notifications on with Sound off gives a silent alert and badge update; Sound on plays the Default Alerts tone; Notifications off with App badge on gives badge-only updates and no alert; both off clears the badge; child rows restore their values. iPhone 17 Pro simulator: with Allow Notifications off in iOS Settings, Turn on in Settings appears with toggles unchanged, opens Reminderly's iOS Settings page, and disappears on return to the foreground once allowed
- Stage 4 (5b83592): in-app ask at the end of the Reminders tutorial and when a timed reminder is saved, only while iOS permission is undecided; Not now gives not-now-1 then not-now-2; settings toggles ask first while undecided (Not now from settings changes nothing); existing installs with permission marked accepted on launch; permission re-checked on return to the foreground, then resync. Vitest 208/208, Self Check 389/389. Existing-install path verified on the simulator (no ask)
- Dev tools Notifications flag moved from the home page into Dev tools > Reminders > Features at John's request (notifications are reminders only). The separate Notifications page is removed; the flag is a plain toggle like the other Reminders features. Vitest 207/207 (one duplicate label check removed)
- fix/time-picker-scroll fast-forwarded into main (bd5b11a to c629523) with CTO approval; local and remote main in sync. Feature branch already contained the fix, no update needed
- Fresh-permission journeys verified on an unused iPhone 17 simulator (John's iPhone and the existing simulator untouched): tutorial ask, Not now twice (not-now-1, not-now-2), settings ask with Not now and Allow, iOS prompt only after Allow, denied with Turn on in Settings, recovery, Allow from the automatic ask. All passed
- Defect found during that verification and fixed: the badge plugin (@capawesome/capacitor-badge) requests iOS permission on every Badge.set and Badge.clear, so a new install saw the iOS prompt at launch. The in-app badge effect now runs only once permission is granted. Verified: no prompt on a fresh install; badge still updates on the existing simulator install
- Phase 4 documentation (plan section 13): features/notifications.md, features/settings.md, settings-flags-spec.md (12.3 Phase 4 as delivered, 7.3 settings rule superseded), release-readiness.md, plan results
- John's iPhone 15 Pro checks passed: Dev tools layout (Notifications first in Dev tools > Reminders > Features, gone from the home page), flag gating (off hides Reminders settings > Notifications and clears the badge, on restores it with preferences kept), and the Turn on in Settings link opens Reminderly's iOS Settings page and clears once allowed
- CTO final technical approval for a --no-ff merge into main, conditional on the checks above (2026-10-15)

### 2026-10-15 (fix/time-picker-scroll - time picker wheels)

Branch: fix/time-picker-scroll (created from main at bd5b11a, verified equal to origin/main). Phase 4 (feature/notifications-settings) paused after stage 2 while this is fixed.

Issue: on the iPhone 15 Pro the time picker wheels could not be scrolled. A drag jumped the value to the end of the wheel and scrolled the whole panel instead. Not reproducible on the taller iPhone 17 Pro simulator.

Cause: the wheels (`src/imports/TimePicker.tsx`) follow pointer events but did not set `touch-action: none`. When the new reminder panel is scrollable, iOS claims a vertical drag as a scroll and cancels the pointer; the cancel handler ran the drag-end snap with an unreliable position. The date presets row (+69pt) makes the panel scrollable on 852pt screens, which exposed it.

Completed:
- Wheel container sets `touch-action: none`, so a drag that starts on a wheel always moves the wheel. The panel still scrolls outside the wheels
- Pointer cancel ends the drag and keeps the current value

Test results: Vitest 190/190 passed. Self Check 378/378 passed (Node run). Simulator: panel scroll and both wheels work. iPhone 15 Pro: confirmed by John, wheels scroll and hold their value. Awaiting CTO approval to merge into main.

Merged and closed (2026-10-15): feature/notifications-settings merged into main with --no-ff (merge commit 3fea7ae) after CTO final technical approval and John's iPhone checks. Post-merge on main: Vitest 207/207, Self Check 389/389, web and iOS builds succeeded. Branch cleanup authorised by the CTO: feature/date-presets (08076ff), fix/time-picker-scroll (c629523) and feature/notifications-settings (53d93bb) confirmed merged and safe-deleted locally and remotely; only main remains. Phase 4 formally closed by the CTO.

### 2026-10-15 (fix/notification-settings-inactive-rows - Notifications page inactive rows)

Branch: fix/notification-settings-inactive-rows (created from main at 3fea7ae). Type A, CTO fast-track approval. John asked for this to be done on main; Claude challenged that under the working agreement and proposed a branch and CTO plan note instead.

Completed:
- Reminders settings > Notifications: Sound stays listed but inactive while Notifications is off, and Include today in badge while App badge is off (grey #D9D9D9 text and toggle, shown off, cannot be changed). Previously both rows were hidden. Saved choices are kept and return when the parent is turned back on. Uses the existing ToggleRow disabled state


### 2026-10-15 (feature/global-list-sort - one sort setting for all lists)

Branch: feature/global-list-sort (created from main at cc10b14, verified equal to origin/main). Type B, touches local storage persistence. CTO approved the proposal with Option 1.

Completed:
- Lists settings: new "Sort items A to Z" toggle (ToggleRow, info text approved). Stored as `reminderly-pref-list-sort-az`, default off (order added)
- Sort rows (List in order added / List alphabetically) removed from the list 3-dot overlay and from the lists tutorial mockups
- Single source of truth: `resolveListSortMode` in list-utils derives the order from the global setting. The template editor still always sorts A to Z. Switching the setting re-sorts every list, including an open one
- No migration. Existing per-list `sortMode` values are kept untouched in list data and are no longer read or written
- Existing temporary placement of a newly added item before A to Z repositioning unchanged

Test results: Vitest 215/215 passed. Self Check 391/391 passed (Node run). Repo guard passed. Web build succeeded. Simulator (iPhone 17 Pro): Lists settings shows the toggle, setting persists across relaunch. iPhone 15 Pro: built, signed, installed and launched. Awaiting John's device checks and CTO review before merge.

Merged and closed (2026-10-15): feature/global-list-sort merged into main with --no-ff (merge commit 627ab9a) after CTO approval and John's iPhone functional checks. Post-merge on main: Vitest 215/215, Self Check 391/391 (Node run), repo guard passed, web build succeeded. Branch deleted locally and remotely as authorised by the CTO. No TestFlight or App Store release authorised.

### 2026-10-15 (fix/list-category-colour - three list buckets)

Branch: fix/list-category-colour (created from main at 25aafab, verified equal to origin/main). Type B, list completion is a protected area. CTO approved the three-bucket proposal.

Issue: lists with at least half their items checked were in a hidden "almost" bucket coloured `#9468D5`, almost identical to Done `#8168D5`, so a 15 of 18 list looked done while filed under Started. Empty lists categorised as Done because the inline App.tsx logic had no item count guard. Pinned lists always showed a navy circle.

Completed:
- One shared helper, `getCurrentListCategory`, for cards, filters, ordering and the editor accent. Todo: nothing checked, including empty lists. Started: at least one checked, not all. Done: all checked
- Colours in `LIST_CATEGORY_COLOURS`: Todo `#939393`, Started `#60C1E7`, Done `#8168D5`
- Pinned lists use their bucket colour; the pin icon and top position still mark them
- `orderListsByCategory`: Todo, Started, Done, oldest first within each bucket; pinned priority unchanged
- Removed the Almost bucket and colour, the legacy four-pill layout (templates flag off now shows the same three pills) and the unused grouped-todo filter
- Not changed: tutorial mockups (own palette, Started purple and Done blue) and the Dev tools dummy list generator (its "almost" mode only generates data)

Test results: Vitest 220/220 passed. Self Check 395/395 passed (Node run). Repo guard passed. Web build succeeded. Web preview with seeded lists: 0/0 and 0/5 grey under Todo; 1/5, 15/18 and pinned 9/20 and 15/22 blue (pinned at top with pin icon); 18/18 purple under Done; unticking one item moved 18/18 to Started with list data and legacy sortMode intact. Simulator and iPhone 15 Pro built, installed and launched. Awaiting John's device checks and CTO review before merge.

Merged and closed (2026-10-15): fix/list-category-colour merged into main with --no-ff (merge commit 81eab60) after CTO approval and John's iPhone checks. Post-merge on main: Vitest 220/220, Self Check 395/395 (Node run), repo guard passed, web build succeeded. Branch deleted locally and remotely. Tutorial mockups unchanged and accepted for this delivery; alignment to be scoped separately. No TestFlight or App Store release authorised.

### 2026-10-15 (feature/list-auto-clear - Clear done lists nightly)

Branch: feature/list-auto-clear (created from main at 75e2db5, verified equal to origin/main). Type B. Protected areas: list completion, date and time, app lifecycle, notifications and badge through smart reminders. CTO approved the proposal with two safeguards (completion timestamp and single completion).

Completed:
- Lists settings toggle "Clear done lists nightly" (`reminderly-pref-list-auto-clear`, default off). ". Clears tonight" hint on fully ticked, active, unpinned lists while on
- List-level `fullyTickedAt`: item tick times cannot show when a list became fully ticked (deleting the last unticked item adds no tick). Stamped on full tick, cleared on untick, reset on retick, persisted. Existing fully ticked lists stamped on first run and cleared no earlier than the next midnight
- Lists fully ticked before the start of the local day move to Done on the existing time refresh and when the setting is turned on, with catch-up after days away. Shared `commitListDone` with manual completion (manual unchanged); auto is quiet, keeps tick times and dates the list from `fullyTickedAt`. Skips the list open in the editor and lists mid-animation; ref guard completes each list once

Material issue found and reported to the CTO before further changes: the smart reminder sync effect removes a list's active smart reminder as soon as the list is no longer active, before list-sync completion commits (350ms), so marking a list done (manual or auto) deletes the linked smart reminder instead of completing it. Pre-existing. CTO decision: Option 1, keep it out of this branch and fix on fix/smart-reminder-list-done after this merge, before any TestFlight release containing auto-clear.

Test results: Vitest 229/229 passed. Self Check 404/404 passed (Node run). Repo guard passed. Web build succeeded. Web preview: setting off changes nothing; turning it on cleared a list fully ticked two days earlier (dated two days ago) and kept today's, the pre-existing and the pinned lists; deleting the last unticked item stamped the time of deletion, kept the list and showed Clears tonight; manual completion unchanged (all items ticked now, done date now); restoring from Done unticks the items and clears fullyTickedAt. Simulator iPhone 17 Pro: build, install and launch succeeded, "1 of 1. Clears tonight" shown on a fully ticked list. iPhone 15 Pro: build, signing, install and launch succeeded. Awaiting John's device checks and CTO merge approval.
### 2026-10-15 (fix/pinned-list-navy - navy circle for pinned lists)

Branch: fix/pinned-list-navy (created from main at 75e2db5, verified equal to origin/main), independent of feature/list-auto-clear. Type A. John asked for navy pinned lists after device use; Claude flagged that it reverses an approved decision and sent a CTO change note; the CTO approved.

Completed:
- Pinned list circles are navy `#1C2C42` again (`getListCircleColour` in list-utils), only while the pinned lists flag is on. Buckets, filters, ordering and the pin icon unchanged

Test results: Vitest 220/220 passed. Self Check 395/395 passed (Node run). Repo guard passed. Web build succeeded. Web preview: pinned 0/3, 9/20 and 4/4 navy with pin icon at the top of All; unpinned Todo grey, Started blue, Done purple; filters unchanged. Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded. Awaiting CTO merge approval.

Merged and closed (2026-10-15): after CTO incident review (device build swap between the two branches, not a code regression), feature/list-auto-clear was redeployed and the setting confirmed visible with its saved state intact. feature/list-auto-clear merged into main with --no-ff (merge commit 9dc03ea); post-merge Vitest 229/229, Self Check 404/404, repo guard passed, web build succeeded. fix/pinned-list-navy then merged with --no-ff (merge commit 56df01b): App.tsx import list conflict resolved by keeping both sides, synced iOS web asset regenerated, BASELINE and history entries combined. Combined main: Vitest 229/229, Self Check 404/404 (Node run), repo guard passed, web build succeeded; simulator and iPhone 15 Pro built, installed and launched with both changes. Both branches deleted locally and remotely. fix/smart-reminder-list-done remains required before any TestFlight release containing auto-clear. No TestFlight or App Store release authorised.

### 2026-10-15 (fix/smart-reminder-list-done - smart reminders move to Done with their list)

Branch: fix/smart-reminder-list-done (created from main at 0e97fb7, verified equal to origin/main). Type B. Protected areas: completion flows, notifications, badge. CTO authorised after closing the auto-clear and navy merges; required before any TestFlight release containing auto-clear.

Issue (pre-existing, found during auto-clear verification): the smart reminder sync effect removed a list's still-active smart reminder as soon as the list was no longer active. List-sync completion commits the reminder's completedAt after 350ms, so the sync always won and marking a list done (manually or by auto-clear) deleted the reminder instead of moving it to Done.

Completed:
- `syncSmartReminderForInactiveList` (list-utils), used by the sync effect for lists that are no longer active: a done list's active smart reminder is completed at the list's done time (`statusChangedAt`); deleted and missing lists still remove it; done and deleted reminders untouched. List-sync completion still runs afterwards and sets the completion time to now, as before
- No change to notification or badge code: both already exclude completed reminders, so cancellation and badge updates behave as before
- Not changed (observed only): deleting a list has the same race with its smart reminder's deletedAt; outside this fix's scope

Test results: Vitest 232/232 passed. Self Check 407/407 passed (Node run). Repo guard passed. Web build succeeded. Web preview: manual completion and auto-clear (setting turned on with an overdue list) both left the linked smart reminder in Done (previously deleted); restoring the manual list returned the same reminder to active with no duplicate; two reloads left reminder data stable (only the loader's existing null-field tidy-up on first load). Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded. Awaiting John's device checks and CTO merge approval.

Correction before merge (CTO condition, Option 1 approved): the delayed list-sync completion reset an auto-cleared list's smart reminder completedAt to now 350ms later when auto-clear ran in the open app (setting turned on, resume, midnight while open). At launch it did not, only because handleCompleteClickRef was not yet set when the auto-clear effect ran. `commitListDone` now skips list-sync for auto-clear; the smart reminder sync completes the reminder at the list's done date. Manual completion unchanged. The unused `quiet` option was removed, restoring `handleCompleteClick` to its pre-auto-clear form (verified identical to 75e2db5). Side effects checked: for a smart reminder the skipped step only set the pending-done animation and completedAt; notifications and badge follow reminder state.

Test results: Vitest 233/233 passed. Self Check 408/408 passed (Node run). Repo guard passed. Web build succeeded. Web preview: auto-clear at launch and from the open app both left the reminder completed at the list done date after 350ms (previously the open app reset it to now); manual completion dated list and reminder now; restore returned the same reminder active with no duplicate; reloads left reminder data identical. Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded (cf1074a). Awaiting CTO merge approval; John to confirm overnight auto-clear on device.

Merged and closed (2026-10-15): fix/smart-reminder-list-done merged into main with --no-ff (merge commit 4daa7f5) after CTO approval of the Option 1 correction and John's iPhone checks. Post-merge on main: Vitest 233/233, Self Check 408/408 (Node run), repo guard passed, web build succeeded. Branch deleted locally and remotely. Release readiness known issue 6 closed; the list-deletion race recorded as known issue 7 for future consideration. John to verify real overnight auto-clear on device on 2026-10-16. No TestFlight or App Store release authorised.

### 2026-10-15 (fix/preset-pill-off-colour - preset pill off-state grey)

Branch: fix/preset-pill-off-colour (created from main at e887585). Type A under Working Agreement v1.3, no CTO consultation required. John's direct request.

Completed:
- Date preset pills in the off state now use `#B7B7B7` for the border and text instead of `#BABABA`, matching the Date, Time and Repeats off state. Active pill unchanged (`#4784F8`)

Test results: no automated tests (trivial styling). Web build succeeded. Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded; simulator new reminder panel checked by eye, pills and Date label render the same grey. Awaiting CTO merge approval.

### 2026-10-15 (feature/date-preset-spacing - preset label and spacing by screen width)

Branch: feature/date-preset-spacing (created from fix/preset-pill-off-colour at efe4747, which is unmerged and touches the same pill code). Type B under Working Agreement v1.3. John's direct request; even spacing on the 15 Pro agreed as a trial that can be rolled back.

Completed:
- Tomorrow preset label is "Tomorrow morning" (new optional `shortLabel` "Tomorrow" in DATE_PRESETS). Below 393pt (smaller than iPhone 15 Pro) the short label shows
- Spacing: 10px gaps by default; at 393-401pt (iPhone 15 Pro width) the pills spread edge to edge (justify-between, no minimum gap). CSS breakpoints only, no JS. Preset behaviour (tomorrow 8am) unchanged

Test results: date-presets Vitest 7/7 passed. Web build succeeded. Web preview measurements: 375pt "Tomorrow" with 10px gaps; 393pt "Tomorrow morning" edge to edge (24 to 369) with 7.2pt gaps, no overflow; 402pt "Tomorrow morning" with 10px gaps, 3.5pt spare. Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded; simulator panel checked visually. Awaiting John's 15 Pro check and CTO merge approval (after fix/preset-pill-off-colour).

Pre-merge (2026-10-15): John confirmed the edge-to-edge spacing on his iPhone 15 Pro. Full Vitest 233/233 passed, Self Check 408/408 passed (Node run), repo guard passed. Merge request sent to the CTO for fix/preset-pill-off-colour and feature/date-preset-spacing.

Merged and closed (2026-10-15): CTO approved both branches; John confirmed. fix/preset-pill-off-colour merged into main with --no-ff (merge commit 9aed557), then feature/date-preset-spacing (merge commit fc326ca); no conflicts. Post-merge on main: Vitest 233/233, Self Check 408/408 (Node run), repo guard passed, web build succeeded, synced iOS web asset unchanged. Simulator iPhone 17 Pro and iPhone 15 Pro: build, install and launch succeeded; simulator check showed "Tomorrow morning" with 10px gaps, tapping it set Date tomorrow and Time 8am with the pill active, tapping again cleared it. Both branches deleted locally and remotely. No TestFlight or App Store release authorised.

### 2026-10-17 (feature/templates-page - templates panel to page)

Branch: feature/templates-page (created from main at 8675c29). Type C under Working Agreement v1.3; CTO agreed the classification and the in-container view switch. John's direct request.

Plan: `docs/plans/templates-page.md`. Product decisions P1-P4 (keep "...", tab label stays "Lists", no transition, update tutorial page 5) follow the CTO recommendations and await John's confirmation. Implementation awaits CTO approval of the plan. No code changed.

Implemented (2026-10-17, CTO approved the plan; John confirmed P1-P4): code commit aecdec3.
- The templates button switches the Lists content to the List templates page (rendered in place of the filter row and lists; the `isTemplatesPageShown` flag reuses `savedListsPanelOpen` and `restoreSavedListsPanelAfterOverlayClose`). Header 45px: "List templates" (Lato Bold 20, #1C2C42), x button (back to Lists) and the existing "..." (Lists settings). No transition
- Bottom sheet removed: AnimatePresence wrapper, backdrop, slide, drag handle and `templatesSheetDragControls`. Template rows, empty state and the New template button moved unchanged
- Lists tab label stays "Lists"
- The editor return flag is cleared by the logo tick (which also closes templates, so Done lists and templates stay exclusive), both tabs, the saved lists flag turning off, Use as list from the editor, and delete from the editor
- Tutorial page 5: header row 45px with the blue 45px x; phases unchanged

Test results: Vitest 233/233 passed. Self Check 408/408 passed (Node run). Repo guard passed. Web build succeeded. Web preview (393pt and 375pt): the page matched the visual; x, the templates button, both tabs, "..." and the logo tick behaved as planned; the row tap and Edit template opened the editor with the page underneath, and Save returned to the page; closing New template returned to the page; Use as list from the row menu left templates and opened the new list; delete from the row menu and from the editor; restore from Done lists; the empty state; Create template from list returned to the page via the editor; 12 templates scroll with the button pinned and no horizontal overflow. Tutorial page 5 ran through all phases. Simulator iPhone 17 Pro and iPhone 15 Pro (physical): build, install and launch succeeded; on the simulator the page opened and x returned to Lists. Awaiting CTO review and merge approval.

Onboarding corrections (2026-10-17, CTO request after John's device testing): code commit 6df2bd2. Tutorial only; App.tsx unchanged.
- Lists row (all lists tutorial pages with templates on): the Templates pill is replaced by the 45px templates icon button (scaled like TutorialSettingsButton) plus the settings button when the settings menu is on, grouped right with 10px-equivalent gaps as in the app. The page 5 throb now targets the icon button
- Templates view: template titles and icons #1C2C42 (were #4784F8); static row menu dots added (new shared `TutorialRowMenuDots`, also used by the existing tutorial rows with identical output); settings button beside x when the settings menu is on
- Template menu overlay copy "Use as list" (was "Use a list"), matching the app
- Observed, not changed (outside the templates scope): the tutorial Lists pill colours (Started purple, Done blue) differ from the app (Started cyan, Done purple); the tutorial row dots do not use the app's 11.5px settings alignment inset; the settings button only appears on the tutorial Lists row when templates are on

Test results: Vitest 233/233 passed. Self Check 408/408 passed (Node run). Repo guard passed. Web build succeeded. Web preview at 375pt: Lists tutorial page 1 header matched the app; page 5 ran all phases in order (templates throb centred on the icon button, templates view 4.0s, row throb 4.7s on the target row, editor 8.1s, menu overlay 11.6s showing "Use as list"); production templates page and x unchanged (App.tsx no diff). Simulator iPhone 17 Pro and iPhone 15 Pro (physical): build, install and launch succeeded. Awaiting CTO review and merge approval.

Onboarding round 3 (2026-10-17, CTO request): tutorial only; App.tsx unchanged.
- Row menu dots on tutorial reminder, list and template rows use the app's 11.5px inset when the settings menu is on (`TutorialRowMenuDots` alignWithSettingsButton). At 393pt list rows sit within 0.4px of the settings button; template rows match the header "..." exactly
- Tutorial Lists row shows the settings button whenever the settings menu is on, as in the app
- Lists page 4 and page 5 menu highlight: the 50px button ring centred on the 45px menu button (was 35px with a +7 offset, about 24px rendered and 4.8px off-centre). Page 4 measured: ring 34.8 centred on the 31.3 button
- Templates button highlight scaled to the filter row's button scale

Test results: Vitest 233/233, Self Check 408/408 (Node run), repo guard passed, web build succeeded. Not separately re-measured: 375pt and the reminders tutorial highlights (unchanged code, ring positions measured from their targets).

Highlight size correction (2026-10-17, John: page 4 ring still barely larger than the button): the Templates ring is restored to its previous 50px on screen. The page 4 and page 5 menu rings now use the same on-screen size (50 / TUTORIAL_REMINDER_LIST_SCALE inside the scaled panel = 50px rendered around the 31.3px button), still centred on the button. Vitest 233/233, Self Check 408/408, repo guard passed, web build succeeded.

Onboarding consistency corrections A-D (2026-10-17, CTO approved after John's clarification). Tutorial only; App.tsx unchanged.
- A Done colours: tutorial rows being marked done and done rows use the app colours (lists #404040, reminders #3F3F3F) instead of #4784F8
- B List pills: Todo/Started/Done use the app's LIST_CATEGORY_COLOURS
- C Highlight circles: two sizes, 35px standard (rows, small controls) and 50px on screen large (45px buttons: templates, settings, add item, list menu, smart reminder tick); lists page 3 row circle centred on its target (fixed -40/+10 offsets removed)
- D1 Reminder info overlay title and subtitle #1C2C42
- D2 Re-run page: highlights the Settings button, opens Reminders settings (production RemindersSettingsContent, three rows), highlights the Reminders tutorial option, then stops

Test results: Vitest 233/233, Self Check 408/408 (Node run), repo guard passed, web build succeeded. Preview: re-run page at 375pt (tutorial option circle 35px centred on its chevron) and 393pt (settings circle 50px centred on the button); row dots aligned under the settings button.

Settings panel height (2026-10-17, John): the production Reminders and Lists settings panels are 570px tall at 393pt and wider (iPhone 15 Pro and larger), 450px below that (smaller screens still scroll). On the 15 Pro, Reminders settings shows six rows including "Reminders tutorial" without scrolling (six rows need 510px). The centred-overlay max-height cap (screen minus 200px, 652px on the 15 Pro) is unchanged. Vitest 233/233, Self Check 408/408, repo guard passed, build succeeded.

Settings panel height revised (2026-10-17, John): at 393pt and wider the Reminders and Lists settings panels now size to their own rows (h-auto) instead of a fixed 570px, so each adjusts independently when rows are turned on or off (for example the tutorial row). Below 393pt they stay 450px and scroll. The max-height cap is unchanged. Simulator iPhone 17 Pro: Reminders settings fits its five rows with standard padding. Vitest 233/233, repo guard passed, build succeeded.

Settings sub-page height (2026-10-17, John): each settings panel keeps its main page height on its sub-pages (PanelShell records the main page height and applies it while a sub-page is open; taller sub-page content scrolls). Reminders and Lists are independent; when main rows change (for example tutorials off) the next sub-page uses the new height. Web preview: Reminders main, Notifications and Haptic feedback all 414px; Lists main and sub-page both 354px. Vitest 233/233, repo guard passed, build succeeded.

Merged and closed (2026-10-17): feature/templates-page merged into main with --no-ff (merge commit 3af588b) after CTO approval and John's sign-off and confirmation. No conflicts (main had no new commits). Branch deleted locally and remotely. No TestFlight or App Store release authorised.

Template identity (2026-10-17, John, branch feature/template-identity from main 5c0c837): a new template opens with the next free "Template N" title (Template 1, Template 2, ...) instead of a random list name. The template editor header shows the 25px templates icon (#1C2C42) before the title, with a 16px gap, matching the list item circle and gap so the title and subtitle line up with the item text. Header gains an optional leadingIcon prop; list headers are unchanged. Simulator iPhone 17 Pro: icon and title aligned with "Add your first item...".

Template subtitle icon removed (2026-10-17, John confirmed, CTO agreed): the template editor no longer shows the small grey templates icon after the subtitle, since the header icon now identifies a template. Standard 45px header buttons kept; the menu button stays hidden on unsaved templates. The tutorial's mock template editor still shows the subtitle icon (out of scope). Vitest 233/233, build succeeded, simulator and iPhone deployed.

Header title truncation (2026-10-17, John): long titles in the list and template editor header now end with an ellipsis when not being edited (overflow-hidden text-ellipsis on the title input). Legacy issue, more visible now the template title is inset by the icon. Vitest 233/233, build succeeded, simulator and iPhone deployed; long-title rendering left for John to confirm on iPhone (simulator text entry did not reach the web view).

Merged and closed (2026-10-17): feature/template-identity merged into main with --no-ff (merge commit 9fc9096) after CTO approval and John's confirmation. No conflicts (main had no new commits). Branch deleted locally and remotely. No TestFlight or App Store release authorised.

Tutorial template subtitle icon (2026-10-17, CTO, branch fix/tutorial-template-subtitle-icon from main e03fba1): the tutorial mock template editor (Lists page 5) no longer shows the grey templates icon after the subtitle, matching the live template editor. Process rule from the CTO: changes to UI shown in the tutorial include the matching tutorial update in the original scope and regression checks. Vitest 233/233, Self Check 408/408 (Node run), build succeeded, simulator and iPhone deployed. The tutorial mock header also gains the templates icon before the title (John approved), matching the live template editor. Web preview at 393pt, tutorial scale 0.696: icon left edge matches the item circles (73.2px), gap 11.1px (16px unscaled), title in line with the item text, no subtitle icon. Vitest 233/233, Self Check 408/408, build succeeded, simulator and iPhone deployed.

Merged and closed (2026-10-17): fix/tutorial-template-subtitle-icon merged into main with --no-ff (merge commit 3cc7d86) after CTO approval and John's confirmation. No conflicts (main had no new commits). Branch deleted locally and remotely. No TestFlight or App Store release authorised.

Agreed principle (2026-10-17, CTO and John): tutorial UI updates are part of the original feature scope and its regression checks. Any change to a UI element the onboarding tutorial reproduces includes the matching tutorial update on the same branch, and tutorial consistency is checked before merge, not left as an outstanding item.

Onboarding gaps scope (2026-10-17, John, branch feature/onboarding-gaps from main d00588f): following the onboarding tutorial review, a Type C scope for CTO review in docs/plans/onboarding-gaps.md. Adds Reminders pages Create a reminder (always), Type it naturally (natural language capture active only) and Never miss a reminder (in-tutorial notification ask, replacing the dialog shown after the tutorial closes), plus Lists copy fixes. Out of scope at John's request: Skip control, navigation button changes, a welcome line on page 0. Not implemented.

Onboarding gaps implemented (2026-10-17, CTO approved the scope, branch feature/onboarding-gaps): Reminders tutorial pages Create a reminder (always), Type it naturally (NLC flag and user setting on, demo driven by the live parser and recognition settings, auto or click mode) and Never miss a reminder (last page, eligibility fixed when the tutorial opens, Allow alerts only while iOS is undecided, then granted or denied result). Closing on that page without Allow counts as Not now (`askStateOnTutorialClose`); closing earlier changes nothing; the dialog after the tutorial closes is removed; the timed-reminder and settings asks are unchanged. Lists copy fixes. Vitest 241/241, Self Check 409/409 (Node run), build succeeded, simulator and iPhone deployed. Deviations from the scope: Create a reminder types "Book a haircut" (the mini list already has "Call the dentist"); sheet time labels use the live sheet format (9pm, 3pm); the date presets row is left out of the mock so the Date and Time rows stay visible; the mini list scrolls to show the saved row; time recognition off falls back to "Take the bins out tomorrow" (CTO clarification 1); Type it naturally opens the sheet without the New reminder throb (taught on the previous page); "Allow alerts" is an outlined button under the phone so it does not compete with the unchanged navigation button. Device checks of the permission page on a fresh install outstanding.

List template haptics and sounds (2026-10-19, John, Type B, branch feature/list-template-haptics-sounds from main d00588f): the Lists Haptic feedback and Sounds pages now list Creating a list, Ticking off a list item, Completing a list, Deleting a list item, Creating a template (New template, create from list info, create from list settings) and Deleting a template (delete and restore). Using a template follows Creating a list. The two template switches show only while templates are available; hidden switches keep their saved choices and play no part in the page's on/off. New actions (createTemplate, deleteTemplate, undeleteTemplate) default to on, so older saved choices need no migration. Native and dependency review: same @capacitor/haptics light impact and Web Audio click, no new permissions. Tutorial does not reproduce these sub-pages, so no tutorial change. Vitest 234/234, Self Check 408/408 (Node run), build succeeded, simulator and iPhone deployed.

Settings scroll hint and pinned switches (2026-10-19, John, same branch): rows that do not fit in a settings panel now scroll to the card's bottom edge (into its 40px bottom padding, clipped by the rounded corners), so the next row can show cut off; space after the last row lets it scroll clear of the edge. Pages that fit are unchanged. On the Reminders and Lists Haptic feedback and Sounds pages, the main switch and divider stay pinned at the top and only the switches below scroll. Shared ScrollArea in SettingsPanelContent; the 17 October rule that sub-pages keep the main page's height is unchanged. Simulator iPhone 17 Pro: Lists Haptic feedback switch pinned, rows scroll under the divider; at rest the bottom row sat exactly on the card's edge rather than part-way, since the visible amount depends on panel height. Vitest 234/234, build succeeded, simulator and iPhone deployed.

Settings scroll hint revised (2026-10-19, John): no fades or gradients (Reminderly design rule); the hard cut stays. When rows do not fit, the scroll area's bottom edge now always cuts through the middle of a row (dividers skipped): the lowest row whose middle falls within the card's 40px bottom padding, or the row above when none does, so half a row always shows. The pinned main switch on the Haptic feedback and Sounds pages is removed; the whole page scrolls as one list, which suits smaller panels with fewer options. Vitest 234/234, build succeeded, simulator and iPhone deployed; visual check on device by John.

Inactive sub switches (2026-10-19, John): on the Reminders and Lists Haptic feedback and Sounds pages, while the main switch is off every sub switch is inactive (#D9D9D9 label and switch, not tappable), following the Notifications sound pattern. With the main switch on, a sub switch that is off keeps the usual #C9C9C9. Turning the main switch back on restores previous choices as before. John confirmed the mid-row scroll cut works on device. Vitest 234/234, build succeeded, simulator and iPhone deployed.

Toggle standard planned (2026-10-19, John, Type C, branch fix/toggle-standard from feature/list-template-haptics-sounds 1d45a29, so it can be rolled back by redeploying that branch): on = dark blue #1C2C42 text and reminderly blue #4784F8 switch; off = dark blue text and medium grey #BABABA switch; inactive = inactive grey #D9D9D9 text and switch, not tappable; subtitles medium grey; info icons follow the text. Audit and scope in docs/plans/toggle-standard.md (settings rows, smart reminder toggle, reminder panel Date/Time/Repeats, tutorial copies, Dev tools). Awaiting CTO plan review before implementation.

Toggle standard implemented (2026-10-19, CTO approved plan, branch fix/toggle-standard): visual only. Off toggles now show dark blue #1C2C42 text and row icons with a medium grey #BABABA track; inactive stays #D9D9D9 text and track, not tappable; info icons grey only when inactive. Covers the shared settings ToggleRow, the smart reminder toggle in list settings and list info (subtitle text unchanged, medium grey on and off), the reminder panel Date, Time and Repeats (Repeats unavailable now inactive grey at full opacity instead of 30% opacity; disabled conditions unchanged), the tutorial page 3 copies (also corrected on-state colours to match live), Dev tools toggles, home rows and dummy lists/reminders, and docs/design.md. Vitest 234/234, Self Check 408/408, repo guard passed, build succeeded, simulator and iPhone deployed; physical-device checks by John pending.

Merged (2026-10-19): feature/list-template-haptics-sounds merged into main with --no-ff (merge commit 82b08c4) after CTO approval and John's confirmation, including his physical-device checks. No conflicts (main had no new commits). Branch kept locally and remotely (deletion not requested). fix/toggle-standard (built on it) has CTO conditional sign-off and awaits CTO merge authorisation. No TestFlight or App Store release authorised.

Merged (2026-10-19): fix/toggle-standard merged into main with --no-ff (merge commit 4e40a39) after CTO final approval and John's confirmation. No conflicts (branch was current with main). Vitest 234/234 on main after the merge. Branch retained locally and remotely, as the CTO asked. No TestFlight or App Store release authorised.

Calendar empty state and empty-state ellipses (2026-10-19, John, Type A, branch fix/calendar-empty-state from main 6b5ae53): the calendar empty state uses the standard empty text (17px regular Lato, #CCCCCC, was bold #BABABA) and is centred between the calendar's date heading and the New reminder button (68px each side at 393pt, for a selected day and for filters). Empty-state ellipses standardised to three dots (Lists, Templates, done/deleted lists); wording otherwise unchanged. Vitest 234/234, build succeeded, simulator and iPhone deployed.

Merged (2026-10-19): fix/calendar-empty-state merged into main with --no-ff (merge commit 433a059) after CTO approval and John's confirmation. No conflicts. Vitest 234/234 on main after the merge. Branch retained. No TestFlight or App Store release authorised.

Badge overnight repair planned (2026-10-20, John, Type C, branch fix/badge-overnight from main 7ab6fe5): read-only investigation found the badge only changes overnight through one silent midnight notification, scheduled for the next midnight only and skipped unless an active date-only reminder exists (guard removed in f98d81f, restored in b81c142 because tests still expected it). Also found: the badge plugin's persist restore can overwrite delivered values, and the native patch writes reminderly.nativeBadgeCount, which nothing reads. Approved in principle by John: clean repair with 7 silent midnight badge notifications, removal of the guard, dead code and guard tests, persist off, native action correction kept (exact cut-off deferred), widget one-day limit kept separate. Plan in `docs/plans/badge-overnight.md`, including the slot rule (reminder notifications first, midnights take whatever slots are left) and the known limitation on future counts after notification actions. Awaiting CTO plan review. No code changed.

Badge overnight repair implemented (2026-10-20, CTO approved the plan with R1-R3 and the id correction, branch fix/badge-overnight): the single guarded midnight notification is replaced by silent badge notifications at the next 7 local midnights whenever the badge is on. Reminder notifications take the 64 iOS slots first; midnights only use slots left. Reminder notification ids are hashed below the midnight id range (2147483641-2147483647). Badge plugin `persist` off in capacitor.config.json. Dead `reminderly.nativeBadgeCount` writes removed from the local notifications patch; native action correction kept, with its future-count limitation documented. Removed: `hasActiveDateOnlyReminder`, `buildMidnightBadgeNotification` and the Vitest and Self Check cases that enforced the guard. Added: 7 midnights, per-midnight counts, slot priority, id range, and a badge-widget count match. Docs: features/notifications.md, ios.md, BASELINE.md, plan. Vitest 235/235, Self Check 408/408 (Node run). Physical iPhone validation across two consecutive midnights pending before acceptance.

CTO adjustment (2026-10-20, same branch): the skip for midnight badge notifications with a count of 0 is removed. All 7 midnights are scheduled whenever the badge is on, including counts of 0 (deterministic, no extra conditional). Reminder notifications keep slot priority. Tests updated: all 7 midnights carry their count including 0; an empty reminder list with the badge on builds only the 7 midnights at 0 (Reminders off still clears everything through clearReminderNotifications). Vitest 235/235, Self Check 408/408 (Node run). Physical iPhone validation across two consecutive midnights still pending.

Merged (2026-10-20): fix/badge-overnight merged into main with --no-ff (merge commit edcdc18) after CTO consolidation approval and John's confirmation, following fix/list-item-edit-background-save (a368cad). Generated index.html conflict resolved by rebuild. Vitest 238/238, Self Check 411/411, build successful on main. Physical iPhone validation across two consecutive midnights outstanding; issues go to a new fix branch from main. Branch deleted after the merge.

Calendar header toggle planned (2026-10-20, John, Type C, branch feature/calendar-header-toggle from main 2205a01): the calendar view is switched from a header button on the Reminders tab (calendar and list icons), following the List templates page pattern. In calendar view the month title replaces the filter pills, the month arrows are removed (swipe stays) and the "Show calendar" setting is removed; the last view is remembered using the existing preference. Filter rows in the Reminders, Lists and Done / Deleted views move to 8px gaps and 14px pill padding (13px where small screens need it); Clear all keeps a fixed width sized for its widest state. Plan in docs/plans/calendar-header-toggle.md. Awaiting CTO plan review. No code changed.

Calendar header toggle implemented (2026-10-20, CTO approved the plan, branch feature/calendar-header-toggle): the Reminders header gets a 45px calendar button (supplied SVG) between the filter pills and the settings button; in calendar view it becomes a list button and the month title (Lato Bold 20, #1C2C42) replaces the pills. Month arrows and the calendar's own title row removed; swipe unchanged. "Show calendar" removed from Reminders settings. `reminderly-pref-calendar` now records the shown view, so it persists across launches and existing users with Show calendar on open in calendar view (same semantics, no migration). The button follows the Dev tools Calendar flag and the 852pt height gate; flag off hides the button and calendar and keeps the saved view. The list view's filter is kept aside on switching to the calendar and restored on switching back. Filter rows (Reminders, Lists, both Done / Deleted views, templates header): 8px gaps, 14px pill padding (Reminders pills 13px below 390px, where the calendar button left a 3.8px gap at 375px); Clear all fixed at 88px (14px either side of "Clear all?"). Tutorial filter mirrors scaled to match. Fit check: no overspill at 393x852, 375x852, 375x812, 375x667 and 360x780; at 360x852 (no iPhone has this size) the Reminders row with the calendar button overspills by 5.2px. Vitest 246/246, Self Check 412/412 (Node run), repo guard passed, build succeeded.

Merged (2026-10-20): feature/calendar-header-toggle merged into main with --no-ff (merge commit c4059e6) after CTO approval and John's confirmation, including his physical-device acceptance. No conflicts (main had no new commits). Vitest 246/246 on main after the merge. CTO accepted the 360x852 overflow exception (no iPhone has that size). Branch retained locally and remotely. No TestFlight or App Store release authorised.

Clear all buttons (2026-10-21, John, Type A, branch ui/clear-all-buttons from main c4f9e98): the Clear all button on the Reminders and Lists Done / Deleted views is now solid reminderly blue #4784F8 with white text in its idle state, matching the filter bar's blue header buttons (it previously used the blue outline style). The confirm and cleared states already used this styling and are unchanged; the disabled state (#CCCCCC outline and text) is unchanged. Size (88x45), radius, position, spacing, behaviour and confirmation flow unchanged. Tutorial page 5 Clear all mirror updated to match. Verified in the web preview on both screens in Done and Deleted views (computed 88x45, #4784F8 background, white text; confirm step still shows "Clear all?"). Build succeeded, simulator and iPhone deployed.

Tutorial calendar button (2026-10-21, John, Type A, same branch ui/clear-all-buttons): the Reminders tutorial filter row (TutorialRemindersFilterRow, used on every Reminders tutorial page, the Create a reminder, Type it naturally and Never miss a reminder pages, and the Lists tutorial smart reminder step) now mirrors the live header: a scaled calendar button (same SVG as the app) sits before the settings button whenever the live calendar button is available (isCalendarAvailable passed through TutorialOverlay as calendarEnabled). Calendar on with the settings menu off shows all four pills with the calendar button, as in the live row. Calendar unavailable leaves the row unchanged. OnboardingPage8Content and OnboardingPage9Content are not used by any tutorial and were left unchanged. Verified in the web preview at 393x852 (Reminders tutorial pages 1 and 3, Lists tutorial done lists Clear all). Vitest 246/246, build succeeded, simulator and iPhone deployed.

Merged (2026-10-21): ui/clear-all-buttons merged into main with --no-ff (merge commit caf9359) on John's approval (Type A, no CTO implementation review required). No conflicts (main had no new commits). On main after the merge: Vitest 246/246, Self Check 412/412 (Node run), build succeeded. Branch pushed and retained locally and remotely. No TestFlight or App Store release authorised.

Calendar swipe hint (2026-10-21, John, Type B, branch ui/calendar-swipe-hint from main bfd3658): with the month arrows gone, the calendar dates nudge left (32px) then right (24px) and settle, once, 0.5s after the calendar first opens (1.4s, ease in-out, no fade). Only the dates move, as in the month slide; the weekday row stays. A touch on the calendar stops the hint. Shown state saved in `reminderly-calendar-swipe-hint-shown`. Testing tools gets "Show calendar swipe hint on every visit" (`reminderly-test-calendar-swipe-hint-every-visit`, default off, needs Reminders and the Calendar flag), which plays the hint every time the calendar opens. Helper in utils/calendar-swipe-hint.ts with 3 unit tests. Vitest 249/249, build succeeded, simulator and iPhone deployed. Awaiting John's device testing; not committed.

Merged (2026-10-21): ui/calendar-swipe-hint merged into main with --no-ff (merge commit 96b03c8) on John's approval after his device testing (Type B, no CTO implementation review required). No conflicts (main had no new commits). On main after the merge: Vitest 249/249, Self Check 412/412 (Node run), build succeeded. Branch pushed and retained locally and remotely. No TestFlight or App Store release authorised.

Subtitle descenders (2026-10-21, John, Type A, branch ui/subtitle-descenders from main 73f22cd): row subtitles clipped descenders (for example the g in "Clears tonight") because the 14px subtitle text has overflow hidden at line-height 1. The earlier descender fix covered titles only. All six subtitle elements (active, done and saved list rows, active and done reminder rows, tutorial list row) now have paddingBottom 4px with marginBottom -4px, so descenders render while the layout box stays 14px: title-to-subtitle gap, row height and ellipsis truncation unchanged. clipPath was rejected because it cannot extend an element's own overflow clip. Verified on simulator iPhone 17 Pro (reminder subtitles "days" and "Every" render in full, long subtitle still truncates, list row spacing unchanged). Build succeeded, simulator and iPhone deployed.

Merged (2026-10-21): ui/subtitle-descenders merged into main with --no-ff (merge commit 1cd9938) on John's approval (Type A, no CTO implementation review required). No conflicts (main had no new commits). On main after the merge: Vitest 249/249, Self Check 412/412 (Node run), build succeeded. Branch pushed and retained locally and remotely. No TestFlight or App Store release authorised.

Panel viewport scroll lock (2026-10-21, John, Type B, branch fix/panel-viewport-scroll from main de911db): with the iOS keyboard open, a vertical swipe on the new / edit reminder panel or the list panel scrolled the whole app view (WKWebView's own scroll view becomes scrollable when the keyboard shows; the reminder panel always opens with the keyboard, so it always scrolled). Fixed with `ios.scrollEnabled: false` in capacitor.config.json, which disables user panning of the web view app-wide; inner scroll areas are unaffected. Trade-off: with the keyboard up, panel content hidden behind the keyboard can no longer be reached by panning the page (dismiss the keyboard first). Verified on simulator iPhone 17 Pro: reminder panel and list panel stay put on swipe with the keyboard open. Build succeeded, simulator and iPhone deployed. Awaiting John's device testing.

Merged (2026-10-21): fix/panel-viewport-scroll merged into main with --no-ff (merge commit ec27b04) on John's approval after his device testing (Type B, no CTO implementation review required). No conflicts (main had no new commits). On main after the merge: Vitest 249/249, Self Check 412/412 (Node run), build succeeded. Branch pushed and retained locally and remotely. No TestFlight or App Store release authorised.

Onboarding tutorials (2026-10-21, John, branch feature/onboarding-tutorials from main 5b42c9b): branch created for onboarding tutorial work, starting with the Reminders tutorials. Scope and classification to be set per task. No code changed.

Create a reminder page redesign (2026-10-21, John, Type B under Working Agreement v1.3, branch feature/onboarding-tutorials): Reminders tutorial page 2 updated from John's sketch and device testing. Header body copy stays "Tap New reminder, type it in / and set when it's due" (a "+ New reminder" pill in the header was tried and removed once the button was shown in place). In-situ New reminder button: page 2 shows a full mini iPhone (TutorialPhoneShell gains an optional showBottomBezel: bottom bezel, rounded bottom corners and a home indicator; off by default so other pages are unchanged). Each cycle opens on the phone's bottom (the slot shows the lower part; the phone is sized at 2.05 x its width), the in-situ New reminder button pulses, the view pans up (0.9s ease in-out) to the usual top slice, and 0.2s later the sheet slides up and typing starts (John found opening the sheet before the pan did not feel right). At the end of the cycle the view pans back down. The first view on entering the page is instant (no pan). The Type it naturally page is unchanged (no pan, its own button). The demo reminder is "Take the bins out": Date toggles on showing "Today" in blue, Time toggles on showing "7pm" in blue, then the tick (its ring now has a 10px gap, about 45px on screen around the 31px tick, so it reads against the blue button). The reminder is inserted at the top of the mini list as "Today at 7pm" so it is easy to see (tutorial liberty: the app would sort it after the earlier Today reminders); TutorialStaticReminderList inserts at the top when no anchor row is given. A first attempt that opened the calendar and time wheels inside the tutorial phone was dropped after John's device testing (the phone is too short for the drawers). Row labels stay "Date" / "Time" as in the app. So the 7pm reminder is genuinely first, the tutorial's two Today reminders are rewritten for every tutorial page: "Pick up milk" (2pm) is now "Water the plants" (9:30pm) and "Call the dentist" (4:30pm) is now "Lock the back door" (10pm), in TutorialStaticReminderList, the Manage your reminders overlay reminder (OnboardingPage3Content) and the Never miss a reminder notification banner ("Today at 9:30 PM"). The Type it naturally page's "tonight" (9pm) reminder now also inserts at the top, ahead of 9:30pm and 10pm. The tutorial's Later reminder "Put the bins out" (weekly, Thursdays at 7pm) is renamed "Yoga class" so the bins reminder appears only once (legacy unused components and the NLC dev checks keep their bins text). Verified in the web preview at 393x852 (page 2 timeline: bottom view with button pulse, pan up 3.3-4.1s, sheet opens at the top, pan back down at the end of the cycle; page 2 order 7pm, 9:30pm, 10pm; tour and Manage pages show the new rows). Vitest 249/249, build succeeded, simulator and iPhone deployed. Awaiting John's device testing; not committed (commit blocked by a session permission check, awaiting John's go-ahead).

Type it naturally page update (2026-10-21, John, Type B under Working Agreement v1.3, branch feature/onboarding-tutorials): the mini New reminder button is removed from the tutorial phone on this page. After "Take the bins out tonight" is typed, the blue "tonight" gets the standard three-pulse highlight, then Date turns on ("Today", as the app shows it) and Time turns on ("9pm", the app's time for "tonight"). With Apply as you type off (tap mode) Date waits for the highlight, standing in for the tap; with it on, Date and Time turn on while the highlight shows, as the app applies them as you type (copy unchanged for each mode). John chose the app's own labels over "Tonight" and 7pm. For consistency the Create a reminder page's "Take the bins out" moves from 7pm to 9pm ("Today at 9pm", still first in the list ahead of 9:30pm and 10pm). Verified in the web preview at 393x852: tap mode (ring 4.7s, Date 7.4s, Time 9pm 8.1s, saved "Today at 9pm", no mini button), Apply as you type mode (ring 4.4s, Date 5.4s, Time 6.0s) and page 2 saving "Today at 9pm". Vitest 249/249, build succeeded, simulator and iPhone deployed (this build excludes the unmerged fix/nlc-settings-inactive-rows).

Type it naturally cadence (2026-10-21, John, Type B, branch feature/onboarding-tutorials): after John's device check, the highlight on "tonight" is now a circle centred on the word (54px around the 38x14px word at 393pt, same three pulses as the other tutorial pages), and in both modes the highlight flashes fully before Date turns on, then Time (previously Apply as you type turned them on during the highlight). Verified in the web preview at 393x852: circle centre matches the word centre, pulses reach 0.99/0.93/0.91 opacity, circle 4.2s, Date 7.0s, Time 9pm 7.6s. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page title and highlight (2026-10-21, John, Type B, branch feature/onboarding-tutorials): the tutorial page "Type it naturally" is retitled "Natural Language Capture" (matching the settings name; one line at 375pt). The highlight on "tonight" uses the standard 35px tutorial target circle (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE), centred on the word, and after it flashes Date and Time turn on together. Verified in the web preview at 375x812: title one line (258px), circle 35px with its centre on the word's centre, circle 4.0s then Date and Time together at 6.6s. Pulse opacity not re-measured in this round (the Browser pane was hidden, which pauses animation frames); the pulse code is unchanged from the previous round. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page gating (2026-10-21, John, Type B, branch feature/onboarding-tutorials): the tutorial page now shows whenever NLC is available (Dev tools flag, with Reminders on), whether or not the user has Natural Language Capture on (previously it needed the user setting on). With the user setting on, the demo follows the user's recognition settings; with it off, or if those recognise nothing (dates and times both off), the demo uses dates and times. Change is in App.tsx (tutorialNlcDemo). Verified in the web preview: flag on and user setting off shows the page as step 3; flag off leaves it out (step 3 is Filter your reminders); user setting on with dates and times off still shows it. Vitest 249/249, Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed.

Natural Language Capture settings inactive rows (2026-10-21, John, Type B under Working Agreement v1.3, branch fix/nlc-settings-inactive-rows from main 5b42c9b): the Natural Language Capture settings page hid its options (Recognise dates, Recognise times, Recognise repeats, Apply as you type) while the user setting was off, against the toggle standard. The options are now always listed and inactive (inactive grey text and switch, not tappable) while Natural Language Capture is off, keeping their saved choices, and a key line separates the main toggle from the options, as on the Haptic feedback and Sounds pages. Recognise repeats still appears only while repeat reminders are available (feature availability, not an off state). Found while John checked why the Type it naturally tutorial page was missing (it needs the user setting on, by design). Verified in the web preview at 393x852 (off: inactive rows below the key line, tapping one changes nothing; on: normal toggles). Vitest 249/249, Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed (this build excludes the unmerged feature/onboarding-tutorials work).

Merged (2026-10-21): fix/nlc-settings-inactive-rows merged into feature/onboarding-tutorials (not main) on John's request, so device builds carry both the tutorial work and the settings fix. Only conflict: this file (both branches appended entries; both kept). John signed off the Natural Language Capture tutorial page. Main unchanged; both pieces of work still need CTO approval before merging to main (the fix can still go to main on its own).

Natural Language Capture page copy (2026-10-21, John, Type A, branch feature/onboarding-tutorials): body copy now makes clear the feature has to be active, with minimal growth. Apply as you type on: "When active, a time or date you type turns / blue and is set for you"; off: "When active, a time or date you type turns / blue - just tap it to set it" ("blue" stays in reminderly blue). John chose this over a plural version; "When active, Reminderly spots a time or date," was ruled out because it measures 338px against the 322px line and would wrap to three lines. Verified at 375x812: two lines, 312px wide, the 60px text block unchanged. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page copy, final (2026-10-21, John, Type A, branch feature/onboarding-tutorials): John replaced the "When active..." copy with his own wording, the same for both Apply as you type modes: "If active, Reminderly can recognise a / date or time and populate it for you". The mode-specific copy and its autoMode prop on OnboardingTypeNaturallyText are removed (the animation still follows the mode-independent sequence). The text no longer mentions the word turning blue; the animation shows it. Verified at 375x812: two lines, 268px wide, 60px text block unchanged. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page copy colour (2026-10-21, John, Type A, branch feature/onboarding-tutorials): in "If active, Reminderly can recognise a / date or time and populate it for you", the words "date" and "time" are reminderly blue (#4784F8), echoing the blue recognised word in the demo; "or" and the rest stay grey. Verified at 375x812: both words #4784F8, two lines, 268px. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page copy, day added (2026-10-21, John, Type A, branch feature/onboarding-tutorials): to cover words like "tonight" and "tomorrow", the copy now reads "If active, Reminderly can recognise a / day, date or time and populate it for you", with "day", "date" and "time" in reminderly blue. Verified at 375x812: two lines, 292px, all three words #4784F8. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Natural Language Capture page signed off (2026-10-21, John).

Re-run this tutorial page fixes (2026-10-21, John, Type B, branch feature/onboarding-tutorials): (1) the first highlight landed on the calendar button when it was showing, because the page looked for the first 32px filter row button; TutorialSettingsButton now carries data-tutorial-settings-button and the page targets it, so the ring sits on the "..." settings button. (2) The Reminders settings card had a fixed 450px height, so it ran off the bottom of the tutorial phone and read as a panel; it now sizes to its three rows (Notifications, Sounds, Reminders tutorial), as the live overlay does at 393pt and up, with rounded corners and the dimmed list visible below, and the tutorial option fully in view. Verified in the web preview at 393x852 with the calendar button on: ring centre on the settings button (x 306, calendar at x 268); overlay card fully inside the phone. Vitest 249/249, build succeeded, simulator and iPhone deployed.

Re-run this tutorial overlay rework (2026-10-21, John, Type B, branch feature/onboarding-tutorials): the Reminders settings card is the live overlay scaled as the phone scales the app (340pt card on a 393pt screen, so it has side margins), centred in the phone, height capped to the visible phone so its rows scroll as on shorter screens. It shows the rows the app is configured to show (App passes notifications, date presets, sounds, NLC, haptics, 1 minute increments and Siri availability, their on states and the info icons setting through TutorialOverlay). After it opens, the rows scroll smoothly to the bottom, then the Reminders tutorial row is highlighted. Vitest 249/249, build succeeded, simulator and iPhone deployed. Not verified in the web preview (skipped at John's request to save usage).

Tutorial info icons (2026-10-21, John, Type A, branch feature/onboarding-tutorials): the whole tutorial (Reminders and Lists) now sits inside ShowInfoIconsContext with the Dev tools info icons setting, so info icons in any tutorial settings overlay follow it, as the live overlays do. Vitest 249/249, build succeeded, simulator and iPhone deployed. Not checked in the web preview (to save usage).

Calendar button needs the settings menu (2026-10-21, John, Type B, branch feature/onboarding-tutorials): the calendar button in the Reminders filter bar now shows only while the Dev tools settings menu toggle is on (isCalendarButtonShown = isCalendarAvailable && settingsMenuFeatureEnabled); with it off the filter bar has no calendar button, and the tutorial filter row follows the same rule. This replaces the earlier behaviour where calendar on with the settings menu off showed the button beside all four pills. Vitest 249/249, Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed. Not checked in the web preview (to save usage). Last change planned for this branch.

Merged (2026-10-21): feature/onboarding-tutorials merged into main with --no-ff (merge commit 8ee165f) on CTO approval and John's explicit authorisation. Main was at the expected baseline 5b42c9b; no conflicts. Brings in the Reminders tutorial Create a reminder, Natural Language Capture and Re-run this tutorial page work, the tutorial data updates, fix/nlc-settings-inactive-rows, tutorial info icons and the calendar button settings-menu rule. On main after the merge: Vitest 249/249, Self Check 412/412 (Node run), production build succeeded. Branches pushed and retained locally and remotely. Remaining Reminders tutorial pages (tour, filter, manage, done, see done, notification ask) not reworked. No TestFlight or App Store release authorised.

Badge overnight repair validated (2026-10-22, John): overnight testing on John's iPhone 15 Pro, running final main with the badge repair (edcdc18), shows the app badge working as expected. The outstanding physical iPhone validation is closed and the repair is accepted. No code changed; no new fix branch needed.

Lists tutorial page 3 ring and Re-run this tutorial page (2026-10-22, John, Type B under Working Agreement v1.3, branch ui/lists-tutorial-final-page from main 9755fa0): (1) on View and edit lists, the 35px ring was centred on the whole Work tasks row and measured against the row's offset parent rather than the container it is drawn in, so it sat off the text; it now centres on the list name text (row titles carry data-tutorial-row-title, measured with a text range, against the data-tutorial-ring-host container). (2) The Lists tutorial gains a last page, Re-run this tutorial (page id 5, shown while the settings menu is on, as in the Reminders tutorial): the same title, copy and sequence as the Reminders page, on the Lists tab, opening Lists settings with the rows the app shows (App passes sounds, haptics, templates, Siri availability, Sort A to Z, Clear done lists nightly and the info icons setting through TutorialOverlay) and ending on the Lists tutorial row. OnboardingPage6Overlay takes a lists variant. Verified in the web preview at 393x852: ring centre equals the text centre (129.8, 568.2); last page shows Lists settings with the ring on Lists tutorial. Vitest 250/250, Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed.

Lists tutorial page 4 overlay sizing (2026-10-22, John, Type B, branch ui/lists-tutorial-final-page): on Create smart reminders, the Work tasks settings card used the older mini overlay shell (340pt card scaled to the full 280px phone width, pinned 63px from the top), so it filled the phone edge to edge and Delete list was cut off. TutorialMiniOverlayShell gains an appScale option (the Re-run this tutorial sizing: card scaled as the phone scales the app, 340pt on a 393pt screen, centred); only this card uses it, at John's choice, so other tutorial overlays are unchanged. Verified in the web preview at 393x852: card 242x292 inside the 280x347 phone, 18px side and 27px top and bottom margins, all rows visible. Vitest 250/250, build succeeded, simulator and iPhone deployed.

Lists tutorial page 5 header buttons (2026-10-22, John, Type B, branch ui/lists-tutorial-final-page): on Use list templates, the buttons moved when the List templates page opened. In the app both headers use 45px buttons with 8px gaps in the same place, so the Lists filter row (32.308px buttons, 5.744px gap, the 0.718 tutorial scale used on every tutorial page) was right. The templates header was drawn inside the templates panel at the panel's 0.696 scale, with a 10px gap and its own top padding, so its buttons were 1px smaller, 2.7px lower and 1.2px to the right. The List templates header now renders in the phone's filter row slot with the same row, sizes and gap; the templates rows start where the list rows start. Verified in the web preview at 393x852: both buttons at identical positions and sizes in both states (x 252.1 and 290.2, y 469, 32.3px); the page 5 sequence still plays through to the template settings card. Vitest 250/250, build succeeded, simulator and iPhone deployed.

Tutorial overlay consistency (2026-10-22, John, Type B, branch ui/lists-tutorial-final-page; touches overlays on several tutorial pages, flagged for Kai's merge review): an audit of every tutorial overlay against the live app. Bottom sheets (new reminder, smart reminder, open list, template editor) already shared one scale, slide-up and 15px corners; unchanged. The centred cards did not: Reminders page Manage your reminders (reminder info), Lists Create smart reminders (list settings) and Lists Use list templates (template) used an older card (35px vertical and 32px side padding, 25-33px gaps; reminder info also had an 18px title, 15px due line and 44px buttons with 15px text), and all but the list settings card used the older shell (card stretched to the full phone width and pinned 63px from the top). All tutorial centred cards now use one shell (the live 340pt card scaled as the phone scales the app, 280/393, centred, as on Re-run this tutorial; the appScale option and the old top-pinned mode are removed) and one card matching the live overlays: 40px top and bottom, 30px sides, 32px corners, 20px dark blue title (TutorialOverlayTitle), 50px buttons with 17px text and 30px gaps, card gap as the live card (reminder info 30px with the live 10px title and button offsets and 17px due line, others 40px). Card content is unchanged. Verified in the web preview at 393x852: all five cards (reminder info, list settings, template, both Re-run settings cards) are 242.2px wide with 18.9px side margins, 40/30px padding, 20px titles and 35.6px buttons. Fit on a 375x667 phone not measured. Vitest 250/250, build succeeded, simulator and iPhone deployed.

Merged (2026-10-22): ui/lists-tutorial-final-page merged into main with --no-ff (merge commit 41a4250) on CTO approval and John's explicit authorisation. Main was at the expected baseline 9755fa0; no conflicts. Brings in the Lists tutorial page 3 ring on the list name, the Lists Re-run this tutorial page, the page 5 List templates header buttons keeping the Lists row positions, and the tutorial overlay standardisation (one centred shell and the live card styling for every tutorial centred overlay, Reminders and Lists). On main after the merge: Vitest 250/250, Self Check 412/412 (Node run), production build succeeded; main's code is identical to 1e860d5, already on both test devices. Branch retained locally and remotely. Outstanding, non-blocking: overlay fit on a 375x667 phone not measured. No TestFlight or App Store release authorised.

Dev tools template set toggle (2026-10-22, John, Type B, branch ui/devtools-templates-info): the info overlay for Use template set in clean state now lists the seven default templates under a "Default templates:" heading. The template seed moved unchanged from App.tsx into src/app/utils/default-templates.ts, so the overlay and the clean-state restore read one list. The toggle moved from Config tools to the Lists page, in the Features card under List templates (the toggle it depends on); behaviour, enabled conditions and storage key reminderly-config-templates-in-clean-state are unchanged. Config tools held only this toggle, so the page and its home card were removed: settings for a feature now sit under that feature. settings.test.ts 75/75, build succeeded, simulator and iPhone deployed; John signed off the UI on device.

Merged (2026-10-22): ui/devtools-templates-info merged into main with --no-ff (merge commit f997033) on CTO approval and John's on-device sign-off. Branch within the reported scope (6 files); default template content confirmed byte-identical to the previous seed. Main's tree is identical to 45cd897, already on both test devices. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Dev tools tap above panel to close (2026-10-22, John, Type B, on branch docs/devtools-templates-merge-record at John's request): on iOS, tapping the blue area above the Dev tools panel did not close it. A temporary on-screen touch event readout in the simulator showed taps on the transparent full-screen backdrop arrive as touchstart and touchend but WebKit never produces a click, and the backdrop closed the panel in onClick (the web preview sends a click directly, so it worked there; cursor-pointer did not help). The backdrop now closes on pointer up; the click that follows lands on the fading backdrop, so nothing underneath is tapped. Taps on the status bar itself never reach the web view (iOS limitation). Verified in the simulator (tap at y 68 closes the panel); debug code removed before the final builds; simulator and iPhone deployed; John accepted.

Siri Stage 4: spoken dates and times (2026-10-22, John and Kai, Type D under Working Agreement v1.3, branch feature/siri-stage4-datetime from main 9067897; plan docs/plans/siri-stage4-datetime.md, approved by Kai with decisions D1-D5): the shared NLC parser now recognises relative times ("in 10 minutes", "in 30 mins", "in an hour", "in two hours", 1 to 99), "in N days" (date only), spoken clock times ("4 o'clock", "half past four", "quarter past/to five", "four pm"; without am/pm the next occurrence after now) and "the day after tomorrow". Relative times round to the nearest quarter hour (midpoint up; a result at or before now moves to the next quarter) and set their own date, also in the in-app editor. Siri refuses explicit times off the quarter hour ("4:10pm", "16:10") with "Reminderly currently supports reminders in 15-minute increments. Try 4:00 or 4:15." (SiriUnsupportedTimeError, the Siri-off error mechanism) and creates nothing. Siri titles drop the applied date and time words (with a preceding at/on/in); in-app titles unchanged. siri-core.js rebuilt. Vitest 349/349 (new nlc-spoken-times.test.ts, siri.test.ts and siri-core.test.ts extended), Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed. Spoken device test by John outstanding.

Siri Stage 4 D1 correction (2026-10-22, John and Kai, branch feature/siri-stage4-datetime): a spoken hour without am/pm now gives way to a stated date or repeat. With a date, 7 to 11 are am and 12 to 6 are pm ("tomorrow at 4 o'clock" is tomorrow 4pm whenever it is said; "tomorrow at 9 o'clock" is tomorrow 9am); without a date the next occurrence stays. Applies to Siri and the in-app editor (parseTimeTokenValue / computeTokenClickResult take dateGiven). siri-core.js rebuilt. Vitest 356/356 (7 new regression cases), Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed. Awaiting Kai's merge approval.

Merged (2026-10-22): feature/siri-stage4-datetime merged into main with --no-ff (merge commit 08cac2d) on CTO approval and John's explicit confirmation. Main was at the expected baseline 9067897; no conflicts; main's tree is identical to 8d8da83, already on both test devices. Siri Stage 4 (spoken dates and times) is complete: relative times with quarter-hour rounding, in N days, spoken clock times with the stated-date precedence correction, the day after tomorrow, the spoken 15-minute refusal and Siri title cleaning. John's spoken device tests passed. On main after the merge: Vitest 356/356, Self Check 412/412 (Node run), production build succeeded. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Siri reminder switches to the Reminders tab (2026-10-22, John, Type B under Working Agreement v1.3, branch fix/siri-import-reminders-tab from main 953f90d): with Reminderly left on the Lists tab, a reminder added through Siri was imported on reopening while the Lists tab stayed open. The Siri import now switches to the Reminders tab exactly as tapping it does (done lists view closed, filters reset to all, templates panel closed) when the Lists tab is showing and both modules are on. Verified in the simulator: Lists tab, app backgrounded, pending Siri reminder queued in the App Group, reopened on the Reminders tab with the reminder imported and the pending list cleared. Vitest 356/356, build succeeded, simulator and iPhone deployed.

Siri confirmation wording (2026-10-22, John, Type A under Working Agreement v1.3, branch ui/siri-confirmation-wording from fix/siri-import-reminders-tab): after adding a reminder Siri now says "Okay, that's added" instead of "That's done". Wording only (AddReminderIntent.swift); still spoken only after the save is confirmed. Build succeeded, simulator and iPhone deployed. Stacked on the Siri Reminders tab fix, which should merge first.

Merged (2026-10-22): fix/siri-import-reminders-tab (80f803a) into main as 6bbeafe, then ui/siri-confirmation-wording (7ecfe34, stacked on it) as b4c4a89, both --no-ff with no conflicts, on CTO approval and John's explicit confirmation. Main was at the expected baseline 953f90d; main's tree is identical to 7ecfe34, already on both test devices. Siri reminders now open the app on the Reminders tab when it was left on Lists, and Siri confirms with "Okay, that's added". On main after the merges: Vitest 356/356, Self Check 412/412 (Node run), production build succeeded. Both branches deleted locally and on origin. No TestFlight or App Store release authorised.

Siri workstream complete (2026-10-22, John and Kai): Siri Stages 1-4 are complete and on main. 1 technical reliability; 2 invocation phrase "Add to Reminderly app", Siri settings page and spoken refusal when Siri is off; 3 onboarding tutorial page and locked-device and CarPlay creation; 4 spoken dates and times (docs/plans/siri-stage4-datetime.md); plus the Reminders tab switch and the "Okay, that's added" confirmation. Outside this close-out and still open: the badge-correction patch interval concern, and unsupported phrases such as "next week" and "this weekend".

Onboarding UI tweaks (2026-10-22, John, Type A under Working Agreement v1.3, branch feature/onboarding-ui-tweaks from main e7c7e76): seven small tutorial and Siri settings changes. Lists tutorial Create smart reminders: the standard pulsing ring now shows on the Set smart reminder toggle, then the toggle switches on after TUTORIAL_ATTENTION_SEQUENCE_DELAY (page about 2.75s longer). Mark as done (Reminders page and Lists page 2, shared sequence): the ring shows on the first tick circle only, then the ticks run as before; the list clip box grows 10px on those pages only so the ring is not cut off, rows unchanged. Re-run this tutorial (Reminders and Lists): the sequence now loops, holding the end state for TUTORIAL_ATTENTION_RECYCLE_DELAY (2s) before restarting, about 11s per cycle. Siri shortcuts settings sub-page: the prompt text is centred; it now reads "To add a reminder with Siri just say", “Hey Siri... add to Reminderly app” (built from SIRI_PHRASES, so it stays in step with AppShortcuts.swift) and "Then when Siri replies, say your reminder." Verified in the simulator (timed screenshot bursts for the animations); siri.test.ts 52/52, type-check clean, simulator and iPhone deployed after each change; John signed off on device.

Merge approval (2026-10-22): feature/onboarding-ui-tweaks merged into main with --no-ff on John's approval as CEO. Kai was not consulted for this Type A branch, at John's explicit instruction; Claude raised the v1.3 rule that Kai approves every merge to main before merging. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Settings info icons and settings tidy-up (2026-10-22, John, Types A and B under Working Agreement v1.3, branch feature/settings-info-icons from main 831d064). Info icons in Reminders and Lists settings no longer open a second overlay: the description shows as a page in the same card (title with a dark blue info icon 10px before it, 1px below centre, grey text, Back button) and the card fits its height to the text; Dev tools keep the info overlay. Row info icons are medium grey (#BABABA, inactive rows #D9D9D9), 15px from the label, and hidden on all sub-pages (kept in code to bring back). Copy review: Quick date buttons, 1 minute time steps, Ticked lists to Done, Siri shortcuts (Lists), Set dates as you type, Allow in iOS Settings, Alert sound, Overdue badge, Include due today; Natural Language Capture kept as a recognised term. Sounds and Haptic feedback merged into one Sounds and haptics page per panel (Sounds group, a key line, Haptic feedback group; no key line under each on/off). Settings scroll area fixes: each page now has its own scroll area, so a sub-page's cut no longer skews the main page height (sub-pages opened too big or too small on alternate visits, pre-existing); sub-pages that scroll always cut the bottom row 24px above the card edge, growing or shrinking the card by up to 30px (Lists Sounds and haptics +29px). Also at John's request: 20px above and below the calendar key line (was 11px and 16.75px), and square corners on the Reminders and Lists list scroll areas (the 10px radius clipped cut-off rows to a curve). Verified in the browser preview at 402pt width (measured spacing and repeat visits), Vitest 356/356, simulator and iPhone deployed after each change; John signed off on device.

Merge (2026-10-22): feature/settings-info-icons (40ad962) into main (831d064) as 01547b8, --no-ff, no conflicts. CTO approved (Kai, Types A and B); John approved. Verification on main (01547b8): Vitest 356/356, Self Check 412/412 (Node run), type-check 0 errors, production build successful. Main pushed and deployed to the simulator (iPhone 17 Pro, iOS 26.3) and John's iPhone 15 Pro: build, signing, install and launch successful. Post-merge checks in the browser preview at 402pt width (sounds and haptics on): Reminders and Lists settings navigation, info page and Back; Sounds and haptics opens at the same height on repeat visits with the bottom row cut 24px above the card edge and the last row clearing 40px at the end of the scroll; both list scroll areas have square corners. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Hotfix (2026-10-22, John, Type A under Working Agreement v1.3, branch fix/one-minute-info-text from main bb2a476): the "1 minute time steps" info text in Reminders settings said the time picker moves in 5 minute steps when off; it moves in 15 minute steps (00, 15, 30, 45; TimePicker.tsx). Corrected there and in the Dev tools "1 minute time increments" info text, which also now points to Reminders settings > 1 minute time steps instead of the removed Testing tools page. Closes the known UI issue recorded 2026-10-12 (settings.md, scheduling-and-nlc.md).

Merge approval (2026-10-22): fix/one-minute-info-text merged into main with --no-ff on John's approval as CEO. Kai was not consulted for this Type A hotfix, at John's explicit instruction; Claude raised the v1.3 rule that Kai approves every merge to main before merging. Recorded on the branch before the merge so no separate documentation merge is needed. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Fix (2026-10-22, John, Type A under Working Agreement v1.3, branch fix/tutorial-phone-island from main 335688a): the tutorial phone's Dynamic Island and camera were missing on Reminders tutorial pages. They were still drawn, but in the header's own blue: the 2026-05-20 and 2026-05-21 colour renames (Reminderly dark blue #1C2C42 to List blue, which became #4784F8) replaced their colour along with the List blue uses. Restored to #1C2C42 in TutorialPhoneHeader.tsx (default and page 8 variant); Lists tutorial pages keep black. Verified in the browser preview.

Merge approval (2026-10-22): fix/tutorial-phone-island merged into main with --no-ff on John's approval as CEO. Kai was not consulted for this Type A fix, at John's explicit instruction; Claude raised the v1.3 rule that Kai approves every merge to main. Recorded on the branch before the merge so no separate documentation merge is needed. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Settings Support section (2026-10-23, John and Kai, Type C under Working Agreement v1.3, branch feature/reminder-list-settings from main 81c8adf; plan approved by Kai with John's clarification that all three pages show Version 1.0): Reminders and Lists settings now end with a key line, a Support row, then the tutorial row. Support opens a sub-page with FAQs, a key line, Privacy policy and Terms of use; each opens a page with the title, a grey Version 1.0 line (15px, #BABABA) and placeholder text. FAQs are separate per panel (own content and version); Privacy policy and Terms of use are shared. Back goes up one level (page to Support to the overlay). Existing spacing kept (30px between rows and around key lines); at John's request the Support pages sit 30px under the title instead of 40px. The Support row has no info icon. Tutorial Re-run pages show the new rows through the shared settings content; the Reminders card now scrolls to the tutorial row. All in SettingsPanelContent.tsx; no native, persistence or notification changes. Verified in the simulator: both overlays, Support navigation and Back at every level, Notifications sub-page unchanged, both tutorial Re-run pages (scroll and ring). Vitest 356/356, Self Check 412/412 (Node run), build succeeded, simulator and iPhone deployed. Real privacy policy and terms content still open (release-readiness D4).

Privacy policy Version 1.0 in the app (2026-10-23, John and Kai, within the Type C Support section, branch feature/reminder-list-settings): Settings > Support > Privacy policy now shows the Version 1.0 text (last updated 23 October 2026, Neatly Made Limited) in place of the placeholder; FAQs and Terms of use stay placeholders. Support documents are sections of centred grey paragraphs under dark blue bold headings (17px), 30px between sections and 15px within; links in Reminderly blue open outside the app (Safari, Mail) through Capacitor's hand-off of navigation away from the app (a target _blank link was not reliably handed off and was dropped). Text pages scroll freely within the page height with a hard edge, instead of the row cut-and-grow scroll area, which needs evenly spaced rows. Privacy audit at Kai's request, before publication: no analytics, crash reporting, advertising or identifier SDKs (npm dependencies, Swift packages, app and widget Swift code); no network calls from app code (the only fetch calls read local attachment files); no identifierForVendor or advertising identifier; Capacitor logging off; App Group storage is on-device. One third-party request: Google Fonts (fonts.googleapis.com) on launch, which sends the device IP address to Google; bundling Lato is already recommended in release-readiness.md. neatlymade.co does not resolve (no DNS record), so the policy's website link fails. Vitest 356/356, build succeeded, simulator verified (full scroll, website link opens Safari, app state kept), simulator and iPhone deployed.

Terms of use Version 1.0 in the app (2026-10-23, John, within the Type C Support section, branch feature/reminder-list-settings): Settings > Support > Terms of use now shows the Version 1.0 text (last updated 23 October 2026, Neatly Made Limited) in the same layout as the privacy policy, with the Back button at the end. Approved in principle only: legal sign-off is required before it goes live, flagged in release-readiness.md (Privacy and legal) and in the code. Also recorded: purchase and configure neatlymade.co and host the privacy policy at https://neatlymade.co/privacy before release. Vitest 356/356, build succeeded, simulator verified (full scroll, Back returns to Support), simulator and iPhone deployed.

Lato bundled with the app (2026-10-23, Kai approved, separate contained change on feature/reminder-list-settings): src/styles/fonts.css no longer imports Google Fonts; it imports @fontsource/lato 400, 700 and 900 (new dependency, SIL Open Font License), the same weights and Latin and Latin Extended subsets Google served, so typography is unchanged (Medium and SemiBold styles resolve to these as before). The app now makes no font or other third-party requests. Verified: no googleapis or gstatic references in dist or the iOS public folder; in the browser preview Lato 400 and 700 load from the bundle with no external requests; the simulator renders identically to the earlier Google-loaded screenshots. Small-screen check at 375x667 (browser preview): Reminders and Lists overlays fit without scrolling (the preview has no Siri row; with it the Reminders card is about 510 of 667pt), Support, Terms of use (scroll to the end, Back) and both tutorial Re-run pages work. Vitest 356/356, Self Check 412/412 (Node run), type-check clean, build succeeded, simulator and iPhone deployed.

Reminders FAQs Version 1.0 (2026-10-23, John approved, Type A under Working Agreement v1.3, branch feature/reminder-list-settings): Settings > Support > FAQs on the Reminders panel now shows 12 questions approved by John after Kai's review (adding, natural language capture, edit or delete, colours and filters, missed reminders, notifications, app icon badge, repeats, Siri, completing and the done/deleted archive, local storage, Lock Screen widget), with the version line, last updated date and Back button. Answers were checked against the code: notifications only for future timed reminders; badge counts overdue and due today by default; repeats are based on the due date. Attachments excluded (not confirmed for release). The NLC answer is to be rechecked in the NLC release-readiness ticket. Lists FAQs remain placeholders. Vitest 356/356, build succeeded, simulator verified (scroll to the end, Back returns to Support), simulator and iPhone deployed.

Expandable FAQs (2026-10-23, John, Type B under Working Agreement v1.3, branch feature/reminder-list-settings): the FAQs pages (Reminders, and Lists when its content is added) now list the questions only. Each question is a left-aligned dark blue row with the MenuRow chevron on the right, 30px apart; tapping one opens its grey answer beneath it (chevron turns down) and closes any other, and tapping the open one closes it. The answer opens with the Repeats overlay's max-height transition (300ms). The last updated line is left-aligned above the questions; the version line and Back button are unchanged. Privacy policy and Terms of use keep the centred text layout. Verified in the browser preview at 375x667 (one open at a time, re-tap closes, Back reachable with the last answer open) and on the simulator; Vitest 356/356, type-check clean, build succeeded, simulator and iPhone deployed.

FAQ tweaks (2026-10-23, John, Type A, branch feature/reminder-list-settings): closed FAQ questions show the chevron pointing up (a right-pointing chevron suggests a tap-through to another page); it turns down while open. The FAQs pages no longer have the Back button at the end (the header back arrow remains); Privacy policy and Terms of use keep theirs. Simulator verified, Vitest 356/356, simulator and iPhone deployed.

Lists FAQs Version 1.0 (2026-10-23, John approved after Kai's content review, Type A, branch feature/reminder-list-settings): Settings > Support > FAQs on the Lists panel now shows 12 questions in the expandable FAQ layout (creating a list, ticking and removing items, colours and filters, edit or delete, marking a list done, Ticked lists to Done at midnight with the pinned exception, pinning, templates, smart reminders, Sort items A to Z, done and deleted lists including restore and Clear all, local storage). Checked against the code: marking a list done ticks every item and completes its smart reminder; restoring a done list unticks every item; Clear all permanently removes done and deleted lists and deleted templates. Free and Premium limits excluded until built. The unused placeholder text was removed; the Support section has no placeholder content left. Vitest 356/356, type-check clean, build succeeded, simulator verified, simulator and iPhone deployed.

Merged (2026-10-23): feature/reminder-list-settings (ae0b3a6) merged into main (81c8adf) as 40d7bdb with --no-ff, no conflicts. Type C, CTO approved (Kai) with all conditions met: John's go-ahead, Lato confirmed rendering in airplane mode on John's iPhone 15 Pro, branch at the reviewed commit ae0b3a6, generated ios/App/App/public/index.html excluded. Brings in the Support section in Reminders and Lists settings (FAQs for each panel in an expandable list, Privacy policy and Terms of use Version 1.0), Lato bundled with the app (no third-party requests), and the release-readiness records (Terms of Use legal sign-off, global distribution legal review, neatlymade.co and hosted privacy policy, NLC ships). main's tree is identical to ae0b3a6, already on both test devices. On main after the merge: Vitest 356/356, Self Check 412/412 (Node run), type-check 0 errors, production build succeeded. Branch retained locally and remotely. No TestFlight or App Store release authorised.

FAQs back to the policy page layout (2026-10-23, John, Type A under Working Agreement v1.3, branch ui/faqs-policy-layout from main 75f5339): after user testing, John chose the Privacy policy and Terms of use layout for the FAQs pages too: centred, every question and answer shown, and the Back button at the end. The expandable FAQ list (FaqItem, FaqPage and the faq flag) was removed as no longer used. Content unchanged. Vitest 356/356, type-check clean, build succeeded, simulator verified (centred text, scrolls; Back button present in the browser preview), simulator and iPhone deployed.

Merge approval (2026-10-23): ui/faqs-policy-layout merged into main with --no-ff on John's approval as CEO. Kai was not consulted for this Type A change, at John's explicit instruction ("CTO approval not needed to implement and merge"); Claude raised the v1.3 rule that Kai approves every merge to main. Recorded on the branch before the merge so no separate documentation merge is needed. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Back to top on Support pages (2026-10-23, John, Type A under Working Agreement v1.3, branch ui/support-back-to-top from main b74891e): the button at the end of the FAQs, Privacy policy and Terms of use pages now reads "Back to top" and smoothly scrolls the page's text back to the top; the header arrow is the way back. Same style as before (the info pages' Back button). The topButton flag replaces backButton. Verified on the simulator (scrolled to the end, Back to top returns to the top). Smooth scrolling does not run in the browser preview pane, but works on iOS. Vitest 356/356, type-check clean, build succeeded, simulator and iPhone deployed.

Merge approval (2026-10-23): ui/support-back-to-top merged into main with --no-ff on John's approval as CEO. Kai was not consulted for this Type A change, at John's explicit instruction ("CTO involvement not needed - you have my approval to implement and merge"); Claude raised the v1.3 rule that Kai approves every merge to main. Recorded on the branch before the merge so no separate documentation merge is needed. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Fix (2026-10-23, John, Type A under Working Agreement v1.3, branch fix/tutorial-settings-scroll-gap from main 87951cb): on the Reminders and Lists tutorial Re-run pages, the mini phone's settings card left a 52px gap under the tutorial row after scrolling, instead of the 40px card padding. The card is capped to the phone, and its rows' scroll area ended above the bottom padding (the cut row sat above it, cut < 0), with the spare space kept as card height. ScrollArea now caps its own height at that point (cap), so the card shrinks with it and keeps 40px below the last row; it resets on window resize. Affects only main settings pages whose rows scroll with the cut above the padding (in practice the tutorial cards and short screens); sub-pages and rows that fit are unchanged. Measured in the browser preview at 393x852: gap 40px on both Re-run pages (was 52px), card 430 instead of 442. Vitest 356/356, type-check clean, build succeeded, simulator and iPhone deployed; on-device visual check by John outstanding.

Follow-up (2026-10-23, same branch): John reported the Lists Re-run card sat higher than the Reminders card (screenshots). With the cap, a card whose cut is above the padding is shorter, and the tutorial centred it, so its bottom gap to the mini phone grew. The tutorial card is now anchored PAGE_6_CARD_MARGIN (16pt) above the phone's bottom edge and scaled from its bottom (OnboardingPage6Content.tsx), so both cards keep the same bottom gap; a shorter card leaves its extra space at the top. Measured in the browser preview: bottom gap 16, inside gap 40 on both Re-run pages. Vitest 356/356, type-check clean, simulator and iPhone deployed; John's on-device check outstanding.

Second follow-up (2026-10-23, same branch): John's screenshots showed the actual difference: before the scroll, the half-cut row on the Lists card sat about 43pt above the card's edge, against 24pt on Reminders, leaving more white space. Main settings pages that scroll now place the cut row as sub-pages do: the lowest row whose middle is at least SUB_PAGE_GLIMPSE_GAP (24pt) above the edge, with the area capped so the card shrinks to put it exactly there (base keeps the height measured before the cap). Measured in the browser preview at 393x852, Reminders and Lists Re-run cards: cut row 24pt above the edge, 40pt after the scroll, card 16pt above the mini phone's bottom. Applies to main settings pages only when their rows scroll. Vitest 356/356, type-check clean, simulator and iPhone deployed; John's on-device check outstanding.

Merge approval (2026-10-23): fix/tutorial-settings-scroll-gap merged into main with --no-ff on John's approval as CEO after his on-device check ("accepted - you have my approval to merge"). Kai was not consulted for this Type A fix, at John's instruction; Claude raised the v1.3 rule that Kai approves every merge to main. Recorded on the branch before the merge. Branch retained locally and remotely. No TestFlight or App Store release authorised.

Tutorial option moved to Support (2026-10-23, John, Type B under Working Agreement v1.3, branch feature/tutorial-in-support from main d8bd2cd): in Reminders and Lists settings, the tutorial row moved from the bottom of the main page into the Support sub-page, under FAQs, and the key line above the Support row on the main page was removed. Support now reads FAQs, [panel] tutorial, a key line, Privacy policy, Terms of use; the tutorial row keeps its existing style. The tutorial Re-run pages now ring the settings button, scroll, ring Support, open it (a programmatic click on the Support row) and ring the tutorial row. With the shorter main card, the Lists Support page now scrolls with the usual cut row. SettingsPanelContent.tsx and OnboardingPage6Content.tsx only; no native, persistence or notification changes. Vitest 356/356, Self Check 412/412 (Node run), type-check clean, build succeeded; simulator verified (Lists main page and Support, tutorial opens from the new row, Re-run page opens Support); simulator and iPhone deployed. Accepted and signed off by John. Merged into main as 84666fa (feature/tutorial-in-support at f59fc5a) with --no-ff on Kai's approval and John's go-ahead; generated ios/App/App/public/index.html excluded; branch retained locally and remotely. No TestFlight or App Store release authorised.

Support pages: last updated line in the header and reduced footer standard (2026-10-23, John, Type B under Working Agreement v1.3, branch ui/support-header-last-updated from main 84666fa): on Privacy policy and Terms of use, "Last updated" moved out of the text into the fixed header, under the version line, in the same grey 15px style (commit 78c1ec3). John then flagged, not for the first time, that the text pages did not use the reduced footer that scrolling pages use. Standard agreed and recorded in design.md (Scrolling settings pages): a settings page that scrolls ends its scroll area 24px above the card's edge instead of 40px, with space after the content so it scrolls clear to 40px. Text pages (FAQs, Privacy policy, Terms of use) now follow it. Review at 402x874 in the browser preview: in both panels, every page that scrolls (Notifications, Sounds and haptics on Lists, Support, FAQs, Privacy policy, Terms of use) measures 24px; pages that fit measure 40px; text scrolled to the end finishes 40px above the edge. The tutorial Re-run pages (Reminders and Lists) render the live settings content and measure the same (main page 40px when it fits, Support 24px). SettingsPanelContent.tsx only; no native, persistence or notification changes. Vitest 356/356, build succeeded, simulator and iPhone deployed. Accepted and signed off by John on device ("passed"). Merged into main as 01ed74a (ui/support-header-last-updated at 9802a06) with --no-ff on Kai's approval and John's go-ahead; generated ios/App/App/public/index.html excluded; branch retained locally and remotely. No TestFlight or App Store release authorised.

Merged (2026-10-23): docs/merge-records (c1857f6, merge records for 84666fa and 01ed74a) merged into main as 84d4c83 with --no-ff on Kai's approval and John's go-ahead. Branch retained locally and remotely.

NLC documentation brought up to date (2026-10-23, John and Kai, documentation only under Working Agreement v1.3, branch docs/nlc-documentation from main 84d4c83): ahead of NLC functional testing, the NLC documentation was checked against the code, including everything Siri Stage 4 added to the shared parser. scheduling-and-nlc.md now covers the Stage 4 tokens (relative times with quarter-hour rounding, "in N days", "the day after tomorrow", spoken clock times, number words with am/pm), the rule for spoken times without am/pm, Siri's refusal of times off the quarter hour, the settings page layout and its "Set dates as you type" label, and the tutorial page. Corrected: "every N years" is not recognised (nor "daily" or "every weekday"); the non-goals no longer list "in 3 days"; save-time normalisation adds "on Friday" / "on 27 Feb" labels (not "Monday 3 March") and times as "5pm"; row titles strip only a trailing date or time suffix added at save; renderReminderText is not called; computeScheduleKind is not used by the editor. Also corrected: settings.md (mode label), onboarding.md (Natural Language Capture page title, gating, copy and sequence), settings-flags-spec.md (F5 and the unwired NLC page superseded by Phase 3) and ios.md (Siri parsing, refusal and titles). No application code changed.

Merged (2026-10-23): docs/nlc-documentation (85b4ef6, NLC docs aligned with the implementation) merged into main as 90368af with --no-ff on Kai's conditional approval (documentation only, no unintended changes, based on main 84d4c83, all confirmed) and John's approval. Branch retained.

Merged (2026-10-24): ui/faqs-header-last-updated (798f065, FAQs "Last updated" line moved into the fixed header to match Privacy policy and Terms of use, Type A) merged into main as a89da9f with --no-ff on John's approval as CEO. John explicitly overrode the CTO merge step for this Type A change; Kai did not approve the merge. Branch retained.

NLC simulator test run (2026-10-23, Claude, read-only): the 72-test NLC functional checklist was run in the iOS Simulator (iPhone 17 Pro, main 90368af, all NLC settings on): 70 pass, 0 fail, 2 not tested (notification text, next-day reopen). All flagged quirks confirmed. Siri was exercised through the Shortcuts app with typed text. Found: docs/ios.md says Siri replies "That's done"; it says "Okay, that's added". Results recorded in the NLC testing checklist doc.

NLC titles, numeric dates and format gaps - plan (2026-10-24, John, Type D under Working Agreement v1.3, branch feature/nlc-titles-dates from main a89da9f): docs/plans/nlc-titles-and-dates.md for Kai's review. Task-only titles with NLC on (applied date, time and repeat words removed, shared by app and Siri, with John's two refinements), the word-order fix it depends on, a 12pm default for Siri date-only reminders, DD/MM/YYYY and D/M/YY numeric dates with variations, and the remaining gaps in the date format table (two-digit years after month names, "of", "Sept", weekday with a date). Decisions D1-D9 open. Not implemented.

NLC titles, numeric dates and format gaps - implemented (2026-10-24, John and Kai, Type D under Working Agreement v1.3, branch feature/nlc-titles-dates; plan docs/plans/nlc-titles-and-dates.md, approved by Kai with John's decisions D1, D2, D4, D7, D8, D9 and the Siri past-time deviation). Stage 1 (b87353e): day-first numeric dates (D/M/YY, DD/MM/YYYY with / - .; dots need a year; D/M with no year only after on/by/before/until/from/due/for), YYYY-MM-DD, two-digit years after month names, "of"/"the", "Sept", a weekday joined to a following date (the date wins), and daily/weekly/monthly/yearly/hourly; boundary rules keep phone numbers, fractions, 24/7, versions and dotted times out; no regex lookbehind (iOS 15 web view). Stage 2 (c924746): a token typed later replaces a value NLC filled in as a default (togglesForAutoApply); user-set and token-set values are never overwritten. Stage 3 (238d6d0): task-only titles from the shared titleFromAppliedTokens in the editor and Siri, edit mode keeping saved tokens out of the title; Siri date-only reminders at 12pm and times with no date on today even once passed. Stage 4: simulator re-run of the affected checklist groups plus new rows, 29 of 29 pass (recorded in the NLC testing checklist doc); docs updated (scheduling-and-nlc.md, reminders.md, ios.md including the "Okay, that's added" wording). normaliseReminderText kept, no longer called by the app (Kai).


NLC titles, numeric dates and format gaps - follow-ups and merge (2026-10-24, John and Kai): 1aabec2 keeps an unrecognised repeat phrase whole in the title when repeat reminders are off ("every Monday" stays in the title, no repeat saved); ba1411d makes tap mode apply each highlighted token separately (a date or plain repeat sets no time, so a new reminder needs a time before saving, as canSubmitReminder already required). feature/nlc-titles-dates merged into main as ca75bae (Kai authorised, John approved) at ba1411d; simulator checklist 100 pass, 0 fail; G8 passed on John's iPhone. H5 (reopening a reminder saved for "tomorrow" on the following day) still to run.

No automatic 12pm - plan (2026-10-24, John, Type D under Working Agreement v1.3, branch feature/no-auto-time from main ca75bae): docs/plans/no-auto-time.md for Kai's review. The app stops filling in 12pm when a date is set without a time (Date switch, calendar prefill, NLC auto mode date and repeat tokens, list smart reminders); a dated reminder needs a time the user adds before saving. Siri asks "What time?" for a date with no time and refuses with a spoken explanation if the answer can't be used. Supersedes the Siri 12pm decision (D7) in nlc-titles-and-dates.md. Decisions D1-D7 open. Not implemented.


No automatic 12pm - implemented (2026-10-24, John and Kai, Type D under Working Agreement v1.3, branch feature/no-auto-time; plan docs/plans/no-auto-time.md, D1-D7 confirmed by John, implementation authorised by Kai). Stage 1 (637b356): the Date switch, calendar prefill and NLC auto-mode date and repeat tokens no longer set 12pm; "Add a time" in the Time row while Date is on and Time is off; Date on needs a time in every mode (edit-mode deviation, plan section 11). Stage 2 (261f9e1): list smart reminders only with the list's own date and time, no 12pm fallback written; the smart reminder panel opens with Date and Time off. Stage 3 (56408e0): Siri asks "What time?" for a date with no time and refuses with SiriNeedsTimeError if there is still none; siri-core.js rebuilt. ea50398: smart reminder Save follows the save guard (found on the simulator). Vitest 431, Self Check 422/0, simulator S1-S14 partial (plan section 11), Siri gate G1-G5 passed locked and unlocked on John's iPhone (Kai accepted). Edit-mode deviation approved by Kai. cb5e043: cancel phrases at "What time?" (cancel, stop, never mind, forget it) give "Okay, cancelled." and save nothing (John's wording); Vitest 444, Self Check 422/0; G3 re-check passed locked and unlocked. Open: final Type D sign-off. Not merged.

No automatic 12pm - merged (2026-10-24, Kai final Type D sign-off at 9440614, John confirmed): feature/no-auto-time merged into main as 23bfee1 (--no-ff, content identical to 9440614). Verified on main: Vitest 444 passed, Self Check 422 passed 0 failed, web build succeeded. Out of scope, accepted by Kai: the pre-existing list-header "Jan 1st 2026 at 12pm" flash; iOS 16-25 not device-tested. No TestFlight or App Store action.

Settings scroll cut fix (2026-10-24, John and Kai, Type C under Working Agreement v1.3, branch fix/settings-scroll-peek; plan docs/plans/settings-scroll-peek.md approved by Kai): sub-pages measured their scroll area from the main page's header, so a title on two lines (Natural Language Capture, 48px against 24px) moved the cut into a gap and hid a whole row. ScrollArea now subtracts the sub-page header's extra height (VERSION_LINE_HEIGHT removed). Measured every Reminders and Lists settings page at 402x874 and 375x812: every scrolling page cuts through a row; footers 24 and 40 at 402 unchanged except Natural Language Capture (card 474 to 498). Pre-existing on the fixed 450px card (375 wide): cut 31 to 60 above the edge and fitted footers 47 or 76, reported, not changed. Merged into main as acc5d3c (2026-10-24, Kai final Type C sign-off at bd0cfea, John confirmed); verified on main: Vitest 444 passed, Self Check 422 passed 0 failed, web build succeeded.

NLC mode toggles - merged (2026-10-24, John and Kai, Type B under Working Agreement v1.3, branch feature/nlc-mode-toggles): "Set dates as you type" replaced by two linked toggles, "Auto-fill as you type" (default) and "Tap highlighted words", exactly one on, both reading reminderly-pref-nlc-auto-parsing (storage, default and behaviour unchanged), placed first under the key line so both stay in view (b358bde). Page title shortened to "Natural Lang. Capture" so it fits on one line (f17f4b0, Type A, after Kai's approval at b358bde). Kai approved the merge; John confirmed. Merged into main as 08e2d27; verified on main: Vitest 444 passed, Self Check 422 passed 0 failed, web build succeeded. Deployed to the simulator and John's iPhone (with the scroll cut fix). Recorded on fix/settings-scroll-peek, merged with it.

Repeats panel UI (2026-10-24, John, Type A under Working Agreement v1.3, branch feature/repeats-panel-ui from main acc5d3c): header standardised to 45px with a 45 x 45 back button (left) and 45 x 45 tick button (right, #D9D9D9 until a repeat is selected), title "Reminder repeats" centred between them, Lato Bold 20 (f9a1ccf). Header to content stays at the 24px standard. Custom days replaced the "Every Monday" to "Every Sunday" checkbox list with a full-width row of seven 45 x 45 day buttons (M T W T F S S, white Lato Bold 17), reminderly blue when on and #D9D9D9 when off; toggling and the saved selectedDays values are unchanged (27ac0bd). RepeatsOverlay.tsx only; not mirrored in the tutorial; no native, persistence, scheduling or notification changes. Simulator verified (header, both tick states, Monday and Thursday selected); simulator and iPhone deployed. Tested and accepted by John. Merged into main as 62958f1 with --no-ff on John's approval as CEO; Kai was not consulted for this UI-only Type A change, at John's instruction. Generated ios/App/App/public/index.html excluded. Branch retained locally and remotely. No TestFlight or App Store release authorised.

List ticks saved immediately - plan (2026-10-24, John, Type C under Working Agreement v1.3, branch fix/list-tick-persist from main 62958f1): John found ticked list items coming back unticked ("Finalise and sign off NLC" in Reminderly todos). Cause: ticking or deleting an item in an open list only changes the editor's items, which are saved when the list closes, so ending the app with a list open loses them (adding and editing items already save immediately). Confirmed in code and consistent with John's iPhone data (copied read-only). docs/plans/list-tick-persist.md for Kai's review: save each tick and delete as it happens through the existing persistOverlayListDraft path. Plan approved by Kai. Implemented: the list editor's onToggle and onDelete now build the next items and call persistOverlayListDraft({ nextItems }), as adding an item does (App.tsx only; close path, storage format and template editor unchanged). Siri imports only reminders, never list items, so no new Siri exposure. Simulator (iPhone 17 Pro), each followed by xcrun simctl terminate with the list open and a relaunch: tick and swipe-delete kept (1 of 2); last item ticked kept (2 of 2), fullyTickedAt stamped at the tick, Done colour and order correct; untick kept, fullyTickedAt cleared. The open editor covers the Lists tab, so no visible change behind it. Vitest 444 passed, Self Check 422 passed 0 failed, web build succeeded; simulator and iPhone deployed. On-device check passed by John (2026-10-24, iPhone 15 Pro: ticks, unticks and deletes kept after closing the app with the list open). Merged into main as 59b33db (2026-10-24, Kai final Type C sign-off at 9160d68, John confirmed); verified on main: Vitest 444 passed, Self Check 422 passed 0 failed, web build succeeded.

Onboarding tutorial updates (2026-10-24, John, branch feature/onboarding-tutorial-updates from main 59b33db): the Filter your reminders page (page 1) is hidden from the reminders tutorial to keep it short (Type B under Working Agreement v1.3); content kept so it can return; sequence tests and onboarding.md updated. A new "Add an attachment" page after Create a reminder (Type C) is planned in docs/plans/onboarding-attachment-page.md for Kai's review; decisions D1-D5 open. Not implemented.

Add an attachment tutorial page - implemented (2026-10-24, John and Kai, Type C under Working Agreement v1.3, branch feature/onboarding-tutorial-updates; plan docs/plans/onboarding-attachment-page.md approved by Kai with D1-D5). New reminders tutorial page 10 straight after Create a reminder, only while reminder attachments are available: the paperclip is circled, the live Add an attachment overlay (copied value for value, scaled as the other tutorial overlays) opens and Choose a photo is ringed, a simple mock Photos grid rings a flat-colour holiday photo, and it attaches as the live thumbnail tile (OnboardingAttachmentContent.tsx). The mock New reminder sheet gained the live paperclip and thumbnail tile, shown on Create a reminder and Natural Language Capture on the same gate (D4). On short phones (375 x 667) the attachment page stops the sheet higher so the text field stays in view; the centred overlay clips there as the existing Manage your reminders overlay does. Web layer only: no picker, permission, storage or native calls. Vitest 446 passed, Self Check 422 passed 0 failed, web build succeeded; browser preview at 402 x 874 and 375 x 667 (gate on and off, every step, navigation). On-device check passed by John (2026-10-24, iPhone 15 Pro, build 0a13bb6). Merged into main as fef1a96 (2026-10-24, Kai final Type C sign-off at 078f7d8, John confirmed; content identical to 078f7d8). Kai accepted browser-preview verification in place of a simulator step-through, and the pre-existing 375 x 667 overlay clipping as out of scope. Verified on main: Vitest 446 passed, Self Check 422 passed 0 failed, web build succeeded. No TestFlight or App Store action.

List item order and Hide ticked items - plan (2026-10-24, John, Type C under Working Agreement v1.3, branch feature/list-item-order from main fef1a96): docs/plans/list-item-order.md for Kai's review. Sort items A to Z replaced by three linked options (Newest first, Oldest first, A to Z; existing A to Z setting carries over, Oldest first is display only), and a Hide ticked items setting that folds ticked items into a tappable "N ticked" row. Decisions D1-D3 open. Not implemented. This branch also records the 59b33db and fef1a96 merges (grouped docs housekeeping).

List item order and Hide ticked items - implemented (2026-10-24, John and Kai, Type C under Working Agreement v1.3, branch feature/list-item-order; plan docs/plans/list-item-order.md, implementation authorised by Kai with John's D1-D3). Lists settings: "Sort items A to Z" replaced by Newest first, Oldest first and A to Z as linked toggles on the main page, exactly one on (reminderly-pref-list-sort-az kept, so A to Z users carry over; new reminderly-pref-list-oldest-first). Oldest first is display only (stored order unchanged); a new item shows at the top with the highlight for 1500ms, then moves into place, as in A to Z. Hide ticked items (reminderly-pref-list-hide-ticked, default off) hides ticked items completely; a newly ticked item stays for 1500ms and stays if unticked in that time (createKeptTickedTracker). Counts, item data, list status and templates unchanged. Lists Re-run tutorial page mirrors the new rows. Vitest 454 passed, Self Check 430 passed 0 failed, web build succeeded; browser preview at 402 x 874 and 375 x 667. Not merged.

List item order follow-ups (2026-10-24, John, feature/list-item-order): key line after the three order toggles (95a8815). With Hide ticked items on, a ticked item now stays in its list position for the 1500ms and fades out in place instead of moving to the bottom first (getDisplayListItems orders kept items as unticked). The delay tracker now adds and removes ids one at a time with functional state updates and no unmount cleanup, so a release cannot be lost. Vitest 454 passed, Self Check 430 passed 0 failed; browser preview: middle item stays in place, fades from 1.5s, gone by 1.9s. Not merged.

Item order click-through (2026-10-24, John, feature/list-item-order): the separator after the order toggles did not work in the UI, so the three order toggles moved to an "Item order" sub-page opened from a row on Lists settings (the plan's original section 2 layout; reverses D1 on John's UI decision) and the key line was removed. Main Lists settings page now fits without scrolling at 375 x 667 (76px under the last row on the fixed 450px card, as recorded for fitted pages) and 402 x 874. Logic and storage unchanged. Not merged.

Lists settings follow-ups (2026-10-24, John, feature/list-item-order): Item order moved below the toggles with the other click-throughs (toggles first, a13e1b7). "Ticked lists to Done" renamed "Tidy finished lists" (copy only; reminderly-pref-list-auto-clear and behaviour unchanged); Lists FAQ answer updated and its Last updated date set to 24 October 2026. Not merged.

List item order and Hide ticked items - iPhone check passed (2026-10-24, John, iPhone 15 Pro, build 8a9b75e). At branch head: Vitest 454 passed, Self Check 430 passed 0 failed, web build succeeded. Kai's final Type C sign-off given at 7175bd1; merged (see below).

Merge - 2026-10-24: feature/list-item-order into main as a6cea14. Kai's final Type C sign-off at 7175bd1, accepting John's D1 click-through, D3 fade-in-place and the "Tidy finished lists" rename, and browser-preview testing; John confirmed. Content identical to 7175bd1. Verified on main: Vitest 454 passed, Self Check 430 passed 0 failed, web build succeeded. Optional follow-up from Kai (not a merge condition): Lists FAQ entries for Item order and Hide ticked items.

Default list templates trimmed to 4 (2026-10-24, John, Type B under Working Agreement v1.3, branch feature/default-templates-trim, 18b2205). The set restored in clean state (DEFAULT_TEMPLATE_SEED, also listed in the Dev tools "Use template set in clean state" info overlay) is now Morning workout (8), Spaghetti bolognese (6), Films to watch (10) and Holiday destination ideas (10); Weekly food shop, Morning routine, Weekend tasks, Packing list and Pancakes removed. Lists tutorial page 5 shows the same 4 and opens Spaghetti bolognese, adding "Parmesan". The code that runs when lists are cleared is unchanged. Vitest 454 passed, Self Check 430 passed 0 failed; deployed to iPhone 15 Pro and simulator. The clean-state wipe was not run on a device (John daily drives the app).

Merge - 2026-10-24: feature/default-templates-trim into main as 89e87e3, --no-ff. Merged on John's CEO authority without Kai's merge approval (John: "Proceed - merge ... on my authority"); Kai informed after the merge.

Hidden ticked items note (2026-10-24, John, Type B under Working Agreement v1.3, branch feature/hidden-done-items-note; 8b4e016, c3d74c1, e02f842). With Hide ticked items on, lists show "Done items are currently hidden", centred in the empty state text style (Lato 17px, #CCCCCC), 40px below the last item (the column's 23px gap plus 17px). Lists only, not the template editor, and only when the list has items; the note moves with the items' layout spring. Tutorial unaffected. Vitest 454 passed, Self Check 430 passed 0 failed; simulator check; passed by John on his iPhone.

Merge - 2026-10-24: feature/hidden-done-items-note into main as 21ab069, --no-ff. Merged on John's CEO authority without Kai's merge approval ("merge on ceo approval"); Kai informed after the merge.

NLC Interactions click-through (2026-10-24, John, Type B under Working Agreement v1.3, branch feature/nlc-mode-clickthrough from main 21ab069). As with Lists Item order, the two linked mode toggles (Auto-fill as you type, Tap highlighted words) moved from Reminders settings > Natural Language Capture to an "Interactions" sub-page, opened from a row below the Recognise toggles (toggles first, click-throughs below) and inactive while NLC is off. Interactions shows the two toggles, a key line and info text in the Siri page style; Back returns to Natural Language Capture. Storage and behaviour unchanged (both rows still read and flip reminderly-pref-nlc-auto-parsing). This branch also records the a6cea14, 89e87e3 and 21ab069 merges (grouped docs housekeeping). Info text final wording (5f7559c, eaf5309): "'Auto-fill as you type' applies recognised dates, times and repeats as you type." / "'Tap highlighted words' lets you choose which ones to apply by tapping on the highlighted text." Merged into main as ec453cc on 2026-10-24 on John's CEO authority, without Kai's merge approval; Kai acknowledged it on 2026-10-24 (no rollback). Verified on main: Vitest 454, Self Check 430/0; signed off by John on device.

Reminders tour filters (2026-10-24, John, Type B under Working Agreement v1.3, branch feature/reminders-tour-filters). Reminders tutorial page 0 clicks through the filters twice after the list builds, with the same timing as lists page 0 (Sometime skipped when the settings menu combines it into Later); the hidden filters page 1 render block removed, OnboardingPage2Content.tsx kept. Tests: tutorial-pages 21/21; simulator check of the double pass; deployed to simulator and iPhone. Merged into main as 3005722 (d983519) on 2026-10-24 with Kai's merge approval. That branch edited docs/features/onboarding.md but did not fold in the pending docs housekeeping (miss, disclosed to Kai).

Reminders tutorial and badge copy tweaks (2026-10-24, John, Type A under Working Agreement v1.3, branch fix/reminders-tutorial-tweaks from main 3005722). Reminders tutorial page 1: trailing colon removed from "Your reminders are grouped and coloured by when they are due"; no other reminders or lists tutorial text block ends in a colon. Reminders settings > Notifications: "Overdue badge" renamed "Show app icon badge" (copy only; setting, info text and behaviour unchanged; feature docs updated). This branch also records the ec453cc and 3005722 merges (grouped docs housekeeping). Deployed to simulator and iPhone; signed off by John on device, tests passing. Merged into main as c239465 on John's CEO approval (2026-10-24), without Kai's merge approval.

Screen size testing - started (2026-10-25, John, Type A under Working Agreement v1.3, branch docs/screen-size-testing from main c239465). Usability testing across screen sizes before upgrades and payments; documented in docs/usability/screen-size-testing.md. Current state reviewed: small-screen rules exist only for onboarding and tutorials (570px height), settings panels (393pt width) and the calendar (hidden below 852pt height, so also on 844pt iPhones); the main screens have none; minimum iOS 15.0 allows 320pt devices; iPhone only not yet applied to TARGETED_DEVICE_FAMILY. Proposed support: 375 x 667pt smallest supported iPhone, 320pt not supported, Android designed to 360dp, Fold outer screen in principle, iPad compatibility mode usable only (release-readiness D6, open). Decisions (John): the Reminders header (reduced filters, calendar icon, settings icon) and the Lists header ship in v1; on small screens filters and calendar may be hidden, the settings button never is. Agreed test set: 320 x 568 (one-off), 360 x 780, 375 x 667, 375 x 812, 393 x 852 (reference), 440 x 956, with a fixed page and state checklist and usable / polished pass criteria. Text size scope open. Milestone 1 next: smallest supported width and height. Docs only; no code changed. This branch also records the c239465 merge (grouped docs housekeeping).

Screen size testing milestone 1 - first pass (2026-10-25, John, Type A under Working Agreement v1.3, branch docs/screen-size-testing). Checklist captured at 320 x 568 and 360 x 780 (browser pane), 375 x 667 (browser pane; SE 3rd gen simulator launch screen matched) and 375 x 812 (iPhone 13 mini simulator, iOS 26.4, plus browser pane); 62 screenshots in docs/usability/screens/. Findings F1-F10 in docs/usability/screen-size-testing.md: tutorial mock-up hidden at 568 (F1) and mostly out of view at 667 (F2); list options card clipped at 360 and off-centre at 375 (F3); custom days overlap at 360 (F4); reminder options and date picker need scrolling at 667 (F5, F6); Natural Language Capture settings toggle half off the card at 320 (F7); keyboard covers Time and Repeats on the mini (F9). Recommendation: minimum 360pt wide and 667pt tall, 320 unsupported; fixes F2, F3 and F4 needed. SE keyboard check outstanding (simulator panel access). No code changed; simulators iPhone SE (3rd generation) and iPhone 13 mini created for testing.

Screen size fixes - plan (2026-10-25, John, Type C under Working Agreement v1.3, docs/plans/screen-size-fixes.md on docs/screen-size-testing): F3 (list options and list info cards fixed at width 340 inside a non-shrinking wrapper; change to 100% with a 340 maximum), F4 (custom days buttons shrink only below 375, about 42.8px at 360) and F2 (tutorial sheet top moves to the safe area top when the viewport is under 740pt, covering the logo header; prototype at 375 x 667 shows every demo). Decisions D1-D4 for Kai. Not implemented; implementation on fix/screen-size-fixes after approval.

Screen size fixes - implemented (2026-10-25, John and Kai, Type C under Working Agreement v1.3, branch fix/screen-size-fixes from docs/screen-size-testing 15cbb0e; plan docs/plans/screen-size-fixes.md approved by Kai with D1-D4). F3: InfoOverlay.tsx and list-info-overlay.tsx cards width 100% with a 340 maximum (fit at 360, centred at 375, unchanged at 380 and wider). F4: RepeatsOverlay.tsx day buttons min(45px, (100% - 12px) / 7), square, 2px gap (42.8px at 360, 45px at 375 and wider). F2: App.tsx tutorial sheet top is the safe area top when the viewport is under 740pt (TUTORIAL_FULL_HEIGHT_MAX_VIEWPORT_HEIGHT, getSafeAreaTopInset); other sheets unchanged; 393 x 852 and 440 x 956 sheet top 140.6px as before. Browser before/after at 360 x 667, 375 x 667, 466 x 678, 393 x 852 and 440 x 956; both tutorials every page at 375 x 667 including the attachment page, navigation and drag-close; SE 3rd gen and 13 mini simulators; SE keyboard check done (usable, unchanged). Vitest 454 passed, Self Check 430 passed 0 failed, web build succeeded; deployed to the SE 3rd gen and 13 mini simulators and John's iPhone 15 Pro. Not merged; awaiting Kai's final review. The branch was cut from the docs branch tip before the docs-only merge (content equal to main after that merge).

Merge - 2026-10-25: docs/screen-size-testing into main as 5870589 (documentation only: screen size testing, findings, screenshots, fix plan, release-readiness D6 and header decision), with Kai's docs-only merge approval and John's go-ahead. fix/screen-size-fixes then reconciled with main. Kai's final review accepted F2, F3 and F4 with conditional merge approval; the browser-resize divider artefact is recorded as a non-blocking observation. Merge approval does not authorise TestFlight or App Store release.

Merge - 2026-10-25: fix/screen-size-fixes into main as cc8f95f, with Kai's conditional merge approval (conditions met: docs merged first, branch reconciled, diff only the 4 approved files plus docs, Vitest 454 and Self Check 430/0 rerun) and John's go-ahead ("approval granted").

Screen support decision (2026-10-25, John): pre-release cross-device screen support passed at this stage, after the iPhone 17 Pro Max visual check. Remaining: the release-candidate screen pass after the paywall, and the open items (iPhone only, D6 iOS 16, calendar 852pt rule, Dynamic Type, Display Zoom). Recorded in docs/usability/screen-size-testing.md.

Onboarding testing mode (2026-10-25, John, Type B under Working Agreement v1.3, branch feature/dev-force-notification-ask-page from main cc8f95f). First built as a single "Always show tutorial notification page" toggle (5296116); John then asked for full control, so it was replaced. Testing tools > Onboarding testing opens Reminders tutorial and Lists tutorial pages, each with a Testing mode master toggle and a toggle per page (all on by default, inactive while testing mode is off). With testing mode on, the tutorial shows exactly the pages switched on, in the normal order, each time it opens (settings or app start), ignoring flags, feature availability and the notification ask state; none on shows the first page. Keys reminderly-test-tutorial-<variant>-mode and reminderly-test-tutorial-<variant>-page-<id>, read when the tutorial opens (getTutorialTestPageIds in utils/tutorial-pages.ts). The Natural Language Capture page uses the default demo when NLC is off. Normal rules unchanged when testing mode is off. The notification page's Allow follows the real iOS permission; closing on it still runs the normal Not now rule. Tests: tutorial-pages 4 new cases (Vitest 458 passed), Self Check 430 passed 0 failed; browser check of the Reminders tutorial with two pages off (8 pages, Siri, Natural Language Capture and notification pages render with their features off); Lists tutorial covered by unit tests only. This branch also records the cc8f95f merge and the screen support decision (grouped docs housekeeping).

Tutorial page dots gap (2026-10-25, John, Type A under Working Agreement v1.3, on branch feature/dev-force-notification-ask-page). Tutorial pagination dots are always 10px apart, centred, and close up only if they would not fit the navigation row's width (up to 322px, the Back and Restart edges). Previously the dots were 10px apart up to 7 pages and squeezed into a fixed 115.5px row above that (7.4px at 8 pages, 4.0px at 10). Dots drawn as 7.935px circles in a flex row with gap min(10px, fit). Browser check at 375 x 812 with all 10 Reminders pages: 10px gaps, centred; forced 120px row: gap 4.5px, dots inside the row.

Tutorial live page config - plan (2026-10-25, John, Type C under Working Agreement v1.3, docs/plans/tutorial-live-page-config.md on feature/dev-force-notification-ask-page). "Push to live" on the Onboarding testing pages copies the tested page set into per-page live config (reminderly-config-tutorial-<variant>-page-<id>, default on, part of the golden master config review); the normal journey applies the existing rules then removes pages switched off in live config. Decisions D1-D3 for Kai. Not implemented; implementation on feature/tutorial-live-page-config after approval.

Review - 2026-10-25: John passed the tutorial page dots on device. Kai accepted the Type B and Type A classifications for onboarding testing mode and the page dots; merge approval pending verification of the branch against main (at 69e0c20: 3 commits ahead of main cc8f95f, 0 behind, merges cleanly; Vitest 458, Self Check 430/0). Tutorial live page config: D1-D3 approved in principle with requirements R1-R5; plan revised for final Type C approval.

Merge - 2026-10-25: feature/dev-force-notification-ask-page into main as 7b693ea, --no-ff, at the reviewed tip 25bab8c, with Kai's merge approval and John's go-ahead ("Proceed - merge"). Checks before merge: Vitest 458 passed, Self Check 430 passed 0 failed.

Tutorial live page config - implemented (2026-10-25, John and Kai, Type C under Working Agreement v1.3, branch feature/tutorial-live-page-config from main 7b693ea; plan docs/plans/tutorial-live-page-config.md approved by Kai with D1-D3 and R1-R5). Dev tools > Testing tools > Onboarding testing > Reminders or Lists tutorial gains a Live journey card: "Live: n of m pages" (info lists the live pages), Push to live (confirmation, copies the page toggles into live config) and Reset live to all pages. Live config keys reminderly-config-tutorial-<variant>-page-<id>, 16 added to SETTINGS_DEFAULTS as 'true'; release values added to release-readiness.md Recommended release defaults as a decision. getTutorialPageIds applies the existing rules, then removes pages switched off in live config (never adds; none left shows the first page the rules allow); testing mode ignores live config. App reads the live set in openTutorial; ask state logic unchanged. Tests: tutorial-pages 6 new cases (R1 missing and malformed read as on, R2 never adds, empty fallback, testing mode ignores live, live unaffected by test keys); Self Check notif-ask-tutorial-live-page-off (R3). Vitest 465 passed, Self Check 431 passed 0 failed, web build OK. Browser at 375 x 812: pushed 8 of 10 (See what you've done and Never miss a reminder off), testing mode off, permission undecided: Reminders tutorial 5 pages (rules gave 7), ask page not shown, ask state unasked after close, first timed reminder showed "Get reminder alerts?"; Reset returned Live to 10 of 10. Lists tutorial covered by unit tests only. Awaiting Kai's final Type C review; not merged.

Tutorial notifications page redesign (2026-10-25, John, Type B under Working Agreement v1.3, branch feature/tutorial-notification-page stacked on feature/tutorial-live-page-config 0a484e0). Never miss a reminder now comes before Re-run this tutorial, which is the last page again (rules, testing page list and live keys reordered). Footer while iOS is undecided: Turn on and Skip in place of Next (standard height, 20px either side of the text, 16px gap); Turn on uses the existing Allow handler then moves on; Skip is Not now (askStateAfterNotNow, automatic) once per opening, then moves on, and closing later, even back on the page, does not count again. Once iOS has decided, the page shows the existing result note and the normal Next. Phone mock-up replaced by the bottom of a locked iPhone: illustrated, hard-edged wallpaper (no gradients), torch and camera buttons, home indicator, and the Water the plants alert sliding up into place (no fades). Dev tools > Testing tools reordered: toggles first, click-throughs below (John). Tests: tutorial-pages expectations updated for the order, Self Check notif-ask-tutorial-skip added. Vitest 466 passed, Self Check 432 passed 0 failed, web build OK. Browser at 375 x 812: page 6 of 7, buttons 54px high, 20px padding, 16px gap, phone 45px above the dots; Skip moved to Re-run with ask state not-now-1, Back and close left it unchanged; Turn on set accepted, alerts and badge on and moved to Re-run; decided permission shows the note and Next. Not merged; follows feature/tutorial-live-page-config.

Notification wording (2026-10-25, John, Type A under Working Agreement v1.3, on feature/tutorial-notification-page). User-facing "alerts" changed to "notifications" to match iOS and the Reminderly Notifications toggle: tutorial body and in-app ask dialog body "Reminderly can notify you when a reminder is due...", tutorial result notes "Notifications are on" and "You can turn on notifications later in Settings", dialog title "Turn on notifications?", Notifications info text "Notifies you when a reminder with a time is due.". "Alert sound" unchanged. Feature docs updated; plan documents left as historical records.

Tutorial notifications page, turned-off state (2026-10-25, John, Type B under Working Agreement v1.3, on feature/tutorial-notification-page). John tested with notifications turned off in iOS Settings and saw only the hint. iOS cannot show its prompt again once decided, so with notifications turned off the page now shows Turn on and Skip: Turn on opens Reminderly's page in iOS Settings (app-settings:, as Settings > Notifications already does), switches alerts and badge on and records accepted, and stays on the page; on return the foreground listener re-reads permission and the page shows "Notifications are on" with Next. Skip moves on without changing the ask state while turned off. The denied hint is removed; "Notifications are on" with Next is kept when allowed. In the normal journey the page is still shown only while iOS is undecided; showing it to users with notifications turned off (John's request) changes the eligibility rule and is proposed for Kai in docs/plans/tutorial-notification-page-turned-off.md. Browser: turned off showed Turn on and Skip; allowed showed the note and Next. Vitest 466 passed, web build OK.

Tutorial testing mode icon (2026-10-25, John, Type A under Working Agreement v1.3, on feature/tutorial-notification-page). When Onboarding testing mode is on for a tutorial, the Dev tools icon (John's SVG, 27px, stroke #141B34) shows at the top right of the tutorial card (20px from the top and right), so it is clear which journey is showing. Not shown in the normal journey. Browser: icon shown with Reminders testing mode on, absent with it off. Web build OK.

Tutorial notifications page eligibility - plan revised (2026-10-25). John's iPhone showed 8 Reminders tutorial pages: live config 9 of 10, and Never miss a reminder hidden by the rules because the ask was answered. John's earlier decision ("Note and Next" when notifications are on, rather than leaving the page out) meant keeping the page in that state; Claude had applied it only to the page's rendering, not its eligibility (miss, disclosed). docs/plans/tutorial-notification-page-turned-off.md now proposes showing the page whenever the Reminders and Notifications flags are on, in every permission state, for Kai's review (D1-D3). Not implemented.

Tutorial notifications page wallpaper (2026-10-25, John, Type A under Working Agreement v1.3, on feature/tutorial-notification-page). The lock screen wallpaper is redrawn after John's reference (standard iOS wallpaper): sky blue background, rounded blue shape top right, white sliver, deep navy sweep and a warm patch at the bottom left, as flat hard-edged shapes in the existing illustrative style (no gradients or fades). Centred in the phone so the middle of the design shows. Browser check at 375 x 812; web build OK.

Tutorial notifications page wallpaper - reverted (2026-10-25, John). John found the redrawn wallpaper (2eca70a) janky; the previous flat blue waves wallpaper is restored and kept.

Tutorial notifications page in every permission state - implemented (2026-10-25, John, on feature/tutorial-notification-page). John pushed 9 pages to live, turned testing mode off and saw 8: the rules hid Never miss a reminder because his ask was answered. John: the page must show whenever Dev tools says so; Turn on while notifications are off, the confirmation note while on. Implemented on John's direct instruction (CEO authority) ahead of Kai's review of docs/plans/tutorial-notification-page-turned-off.md: tutorialNotifAskEligible is true whenever the Reminders and Notifications flags are on (App.tsx openTutorial); permission is still read on open for rendering. Ask state rules, the timed reminder ask and the Allow handler unchanged (D2, D3 as proposed). Browser, normal journey with ask state accepted: notifications off showed the page with Turn on and Skip (7 pages); notifications on showed "Notifications are on" and Next (7 pages). Vitest 466 passed, web build OK. Kai to be informed; not merged.

Reminders at a glance tutorial page (2026-10-25, John, Type B under Working Agreement v1.3, on feature/tutorial-notification-page). New Reminders tutorial page 11 after Never miss a reminder and before Re-run this tutorial, shown when the Reminders module and the Lock screen widget flag are on. Tells users they can add the Reminderly lock screen widget: top of a locked iPhone (the notifications page's blue waves wallpaper, shared and anchored to the top), Dynamic Island, date and 9:41, with a mock of the real accessoryCircular widget (ReminderlyWidget.swift: 270 degree ring with the gap at the bottom, outstanding count, tick) ticking from 4 left to none. Title named by John. Added to the testing page list, the live page config (reminderly-config-tutorial-reminders-page-11, default on) and Dev tools Onboarding testing. Tests: 3 new tutorial-pages cases, expectations updated; Vitest 469 passed, Self Check 432 passed 0 failed; browser check of the page in testing mode. Web build OK.

Sign-off - 2026-10-25: John signed off feature/tutorial-live-page-config (0a484e0) and feature/tutorial-notification-page (to 91f585a) on device. Pre-merge checks at 91f585a: 0 behind main 7b693ea, merges cleanly; Vitest 469 passed, Self Check 432 passed 0 failed, web build OK. Awaiting Kai's merge approval: live page config (Type C final review) first, then the notification page branch (including 01d6980, built on John's instruction ahead of review).

Merge - 2026-10-25: feature/tutorial-live-page-config (0a484e0) into main as e6d71fc, --no-ff, with Kai's Type C approval and John's go-ahead. feature/tutorial-notification-page (ba063cc) into main as dc5737c, --no-ff, with Kai's approval (including retrospective approval of D1-D3, 01d6980) and John's separate go-ahead. Checks on main dc5737c: Vitest 469 passed, Self Check 432 passed 0 failed, web build OK. Devices already on code-identical 91f585a; no redeploy. Kai's final sign-off the same day: CTO status closed. Records folded into fix/nlc-interactions-descriptions (grouped docs housekeeping).

NLC Interactions descriptions (2026-10-25, John, Type A under Working Agreement v1.3, branch fix/nlc-interactions-descriptions from main dc5737c). Reminders settings > Natural Language Capture > Interactions: each description now sits directly under the toggle it describes, left aligned (Auto-fill as you type, then its description; Tap highlighted words, then its description); the key line is removed. Wording and toggle behaviour unchanged. Browser at 402 x 874: page scrolls (inherits the parent page's card height, as on main) and the scroll area ends 24px above the card edge, per the reduced footer standard.

NLC Interactions descriptions shortened (2026-10-25, John, Type A, same branch): the repeated toggle name is dropped, so the descriptions read "Applies recognised dates, times and repeats as you type." and "Lets you choose which ones to apply by tapping on the highlighted text.".

NLC Interactions spacing (2026-10-25, John, Type A, same branch): each toggle and its description are grouped with 8px between them (was the page's 30px); 30px between the two groups is unchanged. Browser at 402 x 874: 8px, 30px, 8px measured; the page now fits without scrolling.

NLC Interactions spacing revised (2026-10-25, John): 16px between each toggle and its description; 30px between toggle groups unchanged.

Merge - 2026-10-25: fix/nlc-interactions-descriptions (d62096c) into main as 35fc67f, --no-ff. Merged on John's CEO authority ("signed off - merge on my authority"). CTO merge approval was not obtained for this merge; Kai is informed through this record. Checks on main: Vitest 469 passed, Self Check 432 passed 0 failed, web build succeeded. Devices were already on d62096c (code-identical).

Merge - 2026-10-25: fix/support-contact-logo (c69d2f9, ef4b95c: NeatlyMade logo under the Contact heading on the Support pages, 140px wide; company name "NeatlyMade Ltd.") into main as 5e938a1, --no-ff, with Kai's sign-off and John's approval ("signed off - merge approved"). Checks on main: Vitest 469 passed, web build succeeded. Devices were already on ef4b95c (code-identical).

Merge - 2026-10-25: fix/company-name-neatlymade-ltd (ea2a13d: company name "NeatlyMade Ltd." throughout the Terms of use and Privacy policy; 5db2087: Contact links in NeatlyMade red as a trial, reverted at John's request by 81abf87) into main as 12d013a, --no-ff, with Kai's sign-off and John's approval. Checks on main: Vitest 469 passed, web build succeeded. Devices were already on 81abf87 (code-identical).
