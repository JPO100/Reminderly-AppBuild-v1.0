# Reminderly - project rules

These rules cover Reminderly-specific technical and operational requirements. Shared governance is defined in the NeatlyMade Working Agreement.

## Project
- iOS app: React, TypeScript, Vite, Capacitor 8, Swift Package Manager. Two variants (docs/plans/testflight-dev-release-split.md): Reminderly Dev (com.neatlymade.reminderly.dev) and Reminderly Release (com.neatlymade.reminderly), team NeatlyMade Ltd (9B4GQCUS3R). Values per variant live in ios/Dev.xcconfig and ios/Release.xcconfig. John's original install (com.reminderly.app) stays untouched until he authorises its removal.
- Reference docs: docs/architecture.md, docs/design-standards/ (the design standards, one document each), docs/development.md, docs/ios.md, docs/features/.
- Follow the established architecture and existing implementation patterns.
- Keep every command scoped to the project folder or scratchpad. Never run tools against / or ~.
- Never commit the generated ios/App/App/public/index.html.
- Loaders hold no rules. CLAUDE.md (Claude) imports this file; the Working Agreement loads from ~/.claude/CLAUDE.md. AGENTS.md (Codex) says to read and follow the Working Agreement, then this file.

## Documentation
- docs/development-history.md is the authoritative project history. Update it when a feature is completed, a branch is merged, an architectural decision is made or a significant bug is fixed.
- Fold pending merge records into the next branch that touches docs. Never open a branch only to record a merge.
- Update docs/release-readiness.md when a change affects App Store readiness (permissions, data handling, native features, paid features, defaults). Claude's recommendations stay proposals until John decides.
- Record new UI standards in docs/design-standards/, one document per standard (see its README). Never restate a rule in two places.

## Protected areas
Notification scheduling, notification actions, badge counts, date handling, time handling, repeating reminders, completion flows, deletion flows, app lifecycle, local storage persistence.
For changes touching these: define explicit verification steps, run targeted regression checks and report the results.

## Planning
- For changes affecting native functionality, inspect the relevant plugin, patch or Swift implementation and identify material side effects.
- Where relevant, check fresh install against existing install, permission states, small screens and plugin behaviour.
- If a change affects UI the onboarding tutorial reproduces, update the tutorial in the same branch and include it in regression checks.

## UI conventions
- docs/design-standards/ is the standard.
- Colour names: Reminderly blue #4784F8, Reminderly dark blue #1C2C42, medium grey #BABABA (row and toggle subtitles), inactive grey #D9D9D9, description grey #939393 (Lato Medium).
- Toggles: on is dark blue text with a blue switch; off is dark blue text with a medium grey switch; inactive is inactive grey text and switch, not tappable.
- No gradients or fades. Hard edges only. (The one approved exception is the Siri tutorial screen-edge glow.)
- Settings and Dev tools pages: row order, sub-page height and footers follow docs/design-standards/overlay-standards.md (section 4 Settings, section 5 Scrolling).
- Minimum supported screen is 360 x 667. Vertical scroll is acceptable; horizontal overflow is not.
- Dev tools control feature availability only, never user preferences.
- Siri phrases must avoid "remind", "reminder" and "note".

## Testing
- Vitest: npm run test.
- Self Check: in-app (Dev tools > Testing tools > Self checks), or a Node run through a scratch Vitest file importing runChecks and the get*Checks getters with an in-memory localStorage shim. There is no npm script for it.
- When checks or tests change, update src/app/dev/BASELINE.md.
- There is no type-check setup (no tsconfig, no React types). Report type checking as not run.
- Small UI fixes: targeted screenshots, not long automated measurement runs.

## Build and deployment
Discover device ids each time:
    xcrun devicectl list devices
    xcrun simctl list devices booted

Build web assets once. Dev (Dev tools on): npx vite build. Release (Dev tools removed): npx vite build --mode release. Then:
    npx cap copy ios
Configurations: Debug and Release-Dev build the Dev variant (scheme App-Dev archives Release-Dev); Release builds the Release variant (scheme App). Use -configuration Debug for Dev and -configuration Release for Release in the commands below.
Use npx cap sync ios only when Capacitor plugins change. Open App.xcodeproj, not a workspace.

Simulator:
    xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'id=<simulator-id>' -derivedDataPath ios/App/build build
    xcrun simctl install <simulator-id> ios/App/build/Build/Products/Debug-iphonesimulator/App.app
    xcrun simctl launch <simulator-id> <bundle-id>

Chime: run afplay /System/Library/Sounds/Glass.aiff as its own command right before the iPhone build. A PreToolUse hook in ~/.claude/settings.json is a backup.

iPhone (its own command):
    xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'id=<device-id>' -derivedDataPath ios/App/build build
    xcrun devicectl device install app --device <device-id> ios/App/build/Build/Products/Debug-iphoneos/App.app
    xcrun devicectl device process launch --device <device-id> <bundle-id>

- Never change signing, provisioning, bundle ids or app data, except under the Signing exception below.
- Never uninstall the app or erase simulator data. Install in place.
- The free team profile expires every 7 days. -allowProvisioningUpdates needs John's approval for each deploy.
- If deployment fails, report the error, investigate within the agreed scope and retry where appropriate. Do not claim successful deployment until both simulator and device installation and launch are verified.
- If deployment cannot be completed, report the issue and seek John's direction.

## Signing exception (John, 2026-11-06, Dev/Release split only)
- Covered: bundle ids (both apps and the Reminderly widget), signing team NeatlyMade Ltd (9B4GQCUS3R), App Group entitlements and build configuration, URL schemes, -allowProvisioningUpdates for the new ids, and a temporary migration exporter/importer that writes restored data into the target app.
- Not covered: Apple portal registrations, App Store Connect records, TestFlight uploads (each needs John's explicit authorisation), physical iPhone installs, anything touching John's original Reminderly install or data.
- The migration branch is never merged. Installing a migration build over the original install needs separate explicit approval.
- Status (2026-11-06): the split is complete for Reminderly. The migration exporter/importer and snapshot tooling lived only on the never-merged branch migration/reminderly-snapshot-import and are not on main; this exception covers no migration code on main.
