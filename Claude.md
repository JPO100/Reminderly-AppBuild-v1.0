# Reminderly - Claude Code Instructions

Re-read this file before starting work.

## Purpose

You are an AI engineering agent working in an existing codebase.

Implement exactly what the user asks using the smallest safe change set.

Reminderly is an established application with existing functionality, existing users and significant behavioural complexity.

Maintain stability while continuing to deliver features quickly.

Remember:

Build an app, not a rocket ship.

## Core rules

* Do only the requested work.
* Do not expand scope.
* Do not refactor unless explicitly requested.
* Do not redesign architecture.
* Do not introduce new patterns without approval.
* Do not solve problems that were not requested.
* If something appears wrong but is outside scope, leave it alone.

## Scope control

Literal user instructions override assumptions.

If multiple valid implementations exist:

* Present up to two options.
* Explain the trade-off in one sentence each.
* Ask which to use.

If the request is clear:

* Implement it.
* Do not perform unnecessary investigation.
* Do not create additional work that was not requested.

## Delivery philosophy

Reminderly already works.

The objective is to improve it safely.

Prefer:

* Small changes
* Existing patterns
* Proven approaches
* Minimal risk

Avoid:

* Broad refactors
* Architecture experiments
* Premature abstraction
* Rewriting working code

## Anti-stall rules

Default to implementation.

Do not stop to analyse when the task is already understood.

Only stop when:

* The task is genuinely ambiguous.
* A required file cannot be located.
* A user decision is required.
* The request conflicts with approved project documentation.

Ask one concise question only.

## Read policy

Read only what is required.

For small changes:

* Read only the relevant files.

For feature work:

* Read the relevant implementation area.
* Read supporting files only if required.

Avoid broad repository exploration unless necessary.

## Work classification

Before starting work classify the request as one of:

Before beginning each development task, state the proposed classification (Type A, B or C) and briefly state the expected testing and verification requirements. This is a statement, not an approval step. Existing approval rules for Git operations and significant architectural changes still apply.

### Type A - Minor change

Examples:

* UI tweaks
* Copy updates
* Icon changes
* Spacing adjustments
* Animation adjustments
* Small bug fixes

Scope: minor UI adjustments, copy, icons, spacing, animations and small isolated fixes.

Requirements:

* Implement change.
* Explain what changed.
* Provide local testing commands.
* No new automated tests required for trivial changes.
* Do not run existing tests, builds or Capacitor commands unless requested, except where protected functionality requires targeted verification.

No full regression required.

### Type B - Feature work

Examples:

* New functionality
* New workflows
* New settings
* Notification behaviour changes
* Scheduling behaviour changes

Scope: new functionality, workflows, settings or behaviour changes.

Requirements:

* Implement feature.
* Define self-tests.
* Add or extend tests where they provide meaningful protection.
* Run relevant targeted tests and Self Check checks.
* Perform targeted regression checks.
* Update documentation if required.
* A build is required when the feature is complete, not after every implementation step.

### Type C - Release candidate work

Examples:

* Merge candidate
* Major feature completion
* Release preparation

Requirements:

* Run full verification.
* Run the full automated test suite and Self Check.
* Run build.
* Run appropriate regression coverage.
* Report outstanding issues before declaring the work ready.
* Confirm readiness.

## Self-tests

Every feature must have a clear verification method.

A self-test may be:

* Automated test
* Existing test extension
* Dev tools verification
* Manual validation steps

Do not create automated tests for trivial UI changes.

Only add tests where they provide meaningful protection.

## Regression coverage

Regression coverage should be proportionate.

Minor changes:

* Verify the affected area.

Feature work:

* Verify related functionality.

Release candidate work:

* Run full regression coverage.

Avoid expanding the automated test suite unnecessarily.

## Protected areas

Changes affecting the following areas require additional care:

* Notification scheduling
* Notification actions
* Badge counts
* Date handling
* Time handling
* Repeating reminders
* Reminder completion flows
* Reminder deletion flows
* App lifecycle behaviour
* Local storage persistence

These rules apply regardless of Type A, B or C classification.

For these areas:

* Define explicit verification steps.
* Perform targeted regression checks.
* Report verification results.

## Development history

`docs/development-history.md` is the authoritative project history.

Update it when:

* A feature is completed
* A branch is created
* A branch is merged
* An architectural decision is made
* A significant bug is fixed

Do not update it for every small implementation step.

## UI standards

UI changes must follow established Reminderly design conventions and any supplied visual specifications.

## Existing architecture

Reminderly architecture is already established.

Follow existing implementation patterns.

Do not introduce alternative architectural approaches unless explicitly approved.

## Build requirements

Builds are not required for every change.

Builds are required when:

* User requests a build
* User requests verification
* Feature work is complete
* Preparing for commit
* Preparing for merge
* Preparing for release
* Notification behaviour changes
* Capacitor behaviour changes
* Native behaviour changes

If a build is not run, state:

"Build not run."

If a build is run, report:

* Build result
* Any errors
* Git status

## Git rules

Do not perform:

* git add
* git commit
* git push
* git merge
* git rebase
* git reset
* branch creation

Unless explicitly instructed.

You may recommend a commit.

You may recommend a merge.

Do not perform them automatically.

## Response style

* Sentence case only.
* No bold text.
* No emojis.
* Normal hyphens only.
* Concise.
* Implementation focused.

## iPhone and simulator deployment

Claude performs the full deployment directly whenever a deployment is requested or required as part of the agreed task.

Deployment targets both the connected physical iPhone and the currently selected iOS Simulator.

Deployment is not mandatory for every change. Type A/B/C classification and testing requirements are unchanged.

Discover device identifiers when needed. Do not assume they are unchanged:

```bash
xcrun devicectl list devices
xcrun simctl list devices booted
```

* Physical iPhone: use the physical device that is available (paired).
* Simulator: use the simulator shown in the Claude Desktop simulator panel.
* If device selection is ambiguous, ask.

Build web assets once and reuse them for both targets:

```bash
cd "/Users/john/Developer/Reminderly/Reminderly-AppBuild-v1.0"
npx vite build
npx cap copy ios
```

Physical iPhone, replacing <device-id> with the discovered identifier:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'id=<device-id>' -derivedDataPath ios/App/build build
xcrun devicectl device install app --device <device-id> ios/App/build/Build/Products/Debug-iphoneos/App.app
xcrun devicectl device process launch --device <device-id> com.reminderly.app
```

Simulator, replacing <simulator-id> with the discovered identifier:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'id=<simulator-id>' -derivedDataPath ios/App/build build
xcrun simctl install <simulator-id> ios/App/build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch <simulator-id> com.reminderly.app
```

Rules:

* Use the existing signing configuration and bundle identifier.
* Never change signing, provisioning, bundle identifiers or app data without explicit permission.
* Do not use -allowProvisioningUpdates without explicit permission.
* Never uninstall the existing application or erase simulator data as part of routine deployment. Install updates in place.
* If a device is unavailable or any step fails, report the issue for that device and stop. Do not make unapproved configuration changes.
* Deployment is only fully successful when both devices succeed.

At sign-off, report separately for each device:

* Device used
* Build result
* Signing result (physical iPhone)
* Installation result
* Launch result

Then report Git status.

## ## Local testing

Manual Xcode deployment is the fallback.

If Claude has not deployed to the iPhone, or deployment failed, provide the following local iOS refresh command for the user to run manually after every source code change:

```bash
cd "/Users/john/Developer/Reminderly/Reminderly-AppBuild-v1.0"
npx vite build
npx cap copy ios
open ios/App/App.xcodeproj
```

Then:

Product → Clean Build Folder

Product → Run

This process ensures the latest web assets are rebuilt, copied into the iOS project, and available for testing in Xcode.

Do not provide:

```bash
git checkout <current-branch>
npm run build
npx cap sync ios
open ios/App/App.xcworkspace
```

unless explicitly instructed by the user.

### Type A - Minor changes

For Type A - Minor changes:

* Do not run terminal commands unless explicitly requested by the user.
* Do not run builds, tests, or Capacitor commands unless specifically requested, except where protected functionality requires targeted verification.
* Always provide the local iOS refresh command at sign-off, unless Claude deployed to the iPhone as requested.
* Assume the user will perform the refresh and verification.
* Report implementation changes only.

If Claude has not run a build, state:

"Build not run. Local iOS refresh command provided."

### Type B - Feature work and Type C - Phase completion

For Type B and Type C work:

* Run only the verification required by the task classification.
* Builds, tests, and validation may be performed where required by the workflow.
* The local iOS refresh command should still be provided at sign-off if source code was changed and Claude has not deployed to the iPhone.

If Claude has run a build, report:

* Build result
* Any errors
* Git status

Unless Claude has deployed to the iPhone, the local iOS refresh command must still be provided after implementation so the user can verify the latest code in the simulator without risk of testing stale assets.


## Final principle

Reminderly is already a successful application.

Protect what works.

Improve what does not.

Build an app, not a rocket ship.
