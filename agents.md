# Reminderly - Codex instructions

Re-read this file before starting work.

## Purpose

You are an AI engineering agent working in the existing Reminderly codebase.

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
* Never modify, discard, revert or overwrite pre-existing uncommitted changes unless explicitly instructed.
* Before adding a dependency, confirm the required capability is not already available in the existing dependency set.

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

### Type A - Minor change

Examples:

* UI tweaks
* Copy updates
* Icon changes
* Spacing adjustments
* Animation adjustments
* Small bug fixes

Requirements:

* Implement the change.
* Explain what changed.
* Provide local testing commands.

No full regression required.

### Type B - Feature work

Examples:

* New functionality
* New workflows
* New settings
* Notification behaviour changes
* Scheduling behaviour changes

Requirements:

* Implement the feature.
* Define self-tests.
* Perform targeted regression checks.
* Update relevant project documentation where required by the documentation rules below.

### Type C - Release candidate work

Examples:

* Merge candidate
* Major feature completion
* Release preparation

Requirements:

* Run full verification.
* Run build.
* Run appropriate regression coverage.
* Confirm readiness.

## Self-tests

Every feature must have a clear verification method.

A self-test may be:

* Automated test
* Existing test extension
* Dev Tools verification
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

For these areas:

* Define explicit verification steps.
* Perform targeted regression checks.
* Report verification results.

## Development history

`docs/development-history.md` is the authoritative project history.

Update it when:

* A feature is completed.
* A branch is created.
* A branch is merged.
* An architectural decision is made.
* A significant bug is fixed.

Do not update it for every small implementation step.

Do not make unrelated documentation changes outside the scope of the current work.

## UI standards

`docs/ui-standards.md` is the implementation reference.

Update it only when:

* A reusable standard changes.
* A new reusable standard is introduced.
* An approved value changes.

Do not update it for every UI tweak.

## Existing architecture

Reminderly architecture is already established.

Follow existing implementation patterns.

Do not introduce alternative architectural approaches unless explicitly approved.

Prefer extending existing mechanisms over creating parallel implementations.

## Dependency management

Use the existing dependency set wherever practical.

Before installing or recommending a new dependency:

* Check whether the required capability already exists in the project.
* Check whether an existing Capacitor, browser or native capability can provide it.
* Do not add a dependency merely for implementation convenience.
* If a new dependency is genuinely required, explain why before adding it unless its addition has already been explicitly approved.

Do not update unrelated dependencies as part of feature work.

## Build requirements

Builds are not required for every change.

Builds are required when:

* The user requests a build.
* The user requests verification.
* Feature work is complete.
* Preparing for commit.
* Preparing for merge.
* Preparing for release.
* Notification behaviour changes.
* Capacitor behaviour changes.
* Native behaviour changes.

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

## Local testing

After every source code change provide the following local iOS refresh command for the user to run manually:

```bash
cd "/Users/john/Personal/Reminderly/Reminderly app build v2/FINAL builds/ReminderlyV300"
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
* Do not run builds, tests, or Capacitor commands unless specifically requested.
* Always provide the local iOS refresh command at sign-off.
* Assume the user will perform the refresh and verification.
* Report implementation changes only.

If Codex has not run a build, state:

"Build not run. Local iOS refresh command provided."

### Type B - Feature work and Type C - Phase completion

For Type B and Type C work:

* Run only the verification required by the task classification.
* Builds, tests, and validation may be performed where required by the workflow.
* The local iOS refresh command should still be provided at sign-off if source code was changed.

If Codex has run a build, report:

* Build result
* Any errors
* Git status

The local iOS refresh command must still be provided after implementation so the user can verify the latest code in the simulator without risk of testing stale assets.

## Final principle

Reminderly is already a successful application.

Protect what works.

Improve what does not.

Build an app, not a rocket ship.
