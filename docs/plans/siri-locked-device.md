# Siri locked-device creation - plan

Status: stage 1 complete (`feature/siri-locked-stage1`). Stage 2 complete on `feature/siri-locked-stage2` (from stage 1), awaiting CTO review. Stages 3 and 4 not started.

Type E under Working Agreement v1.3. Replaces the Option C proposal ([siri-option-c-proposal.md](./siri-option-c-proposal.md)) after the closed Option A spike ([siri-background-spike.md](./siri-background-spike.md)).

## 0. Decision record

- 2026-10-22, CTO: Option A closed; Option B rejected for timed reminders; Option C paused as too complex.
- 2026-10-22, CTO: simplified architecture approved in principle: App Group pending list, native notification for the new reminder, exact badge adjustment, no reminders mirror, no parallel notification engine, no text-based deduplication.
- 2026-10-22, John: P2. One spoken answer ("Call Mum at 6pm"), parsed by Reminderly's existing Siri logic.
- 2026-10-22, CTO: staged plan approved; stage 1 only.

## 1. Architecture

- The Siri intent runs in the background with the device locked, never opening Reminderly.
- Parsing: `buildSiriReminder`, unchanged, run in JavaScriptCore from the Siri core bundle (`src/app/siri-core.ts`, built by `vite.siri-core.config.ts`). Nothing else runs in JavaScriptCore.
- Persistence: the intent appends the new reminder to an App Group pending list and reads it back. The app imports pending reminders by id on launch and on return to the foreground, then removes them. Existing storage is unchanged.
- Notification: the intent schedules the new reminder's notification exactly as the Capacitor plugin would (identifier, `cap_extra`, `cap_schedule`, title, body, badge, category, sound, time-interval trigger). The app's sync stays the only notification engine and finds nothing to change.
- Badge: the app publishes the badge timeline (each reminder's start moment, `buildBadgeTimeline`). The intent applies `addReminderToScheduled` (src/app/utils/siri-badge.ts), ported line by line to Swift: +1 on notifications firing once the new reminder counts, the new notification's badge from the timeline, the 64 limit as the app applies it, and the icon badge now.
- Duplicates: the intent finishes in well under a second (the spike's retries came from a blocked intent); concurrent invocations are coalesced; import is by reminder id; the notification identifier derives from the reminder id.

## 2. Stages

| Stage | Work | Behaviour change |
|---|---|---|
| 1 | Badge specification and Siri core bundle, with tests | None |
| 2 | App publishes notification settings, repeat flag and badge timeline to the App Group; pending-list import by id | None until stage 3 |
| 3 | Intent: background creation, JavaScriptCore parse, pending write, notification, badge, widget, "That's done" | Siri creates reminders in the background |
| 4 | Device verification and regression checks | None |

## 3. Stage 1 evidence (2026-10-22)

Files: `src/app/utils/siri-badge.ts`, `src/app/siri-core.ts`, `vite.siri-core.config.ts` (`npm run build:siri-core`), tests `siri-badge.test.ts` and `siri-core.test.ts`. `notifications.ts` exports its payload type and signature function and moves the notification id hash into `notificationIdForReminder`, with no change in behaviour (existing notification tests unchanged and passing).

- Badge timeline: the count from the timeline equals `computeBadgeCount` at 2,000 random moments (100 random reminder sets, include today on and off, up to 30 days around now).
- Adding one reminder: `addReminderToScheduled` on the app's notifications gives exactly what `buildScheduledNotifications` gives with the reminder included, compared with the app's own sync signature (id, title, body, time, reminder id, badge delta, category, badge, sound):
  - 120 random sets of up to 40 reminders (timed, date-only, Sometime, completed, deleted, past and future) x all 16 combinations of alerts, sound, badge and include today
  - 40 sets of 58 to 70 future reminders at the 64 limit (midnight badge notifications squeezed out or dropped; equal times at the cut-off) x 16
  - date-only today and tomorrow (across midnight), due now, one minute ahead and Sometime, with an empty and a mixed list x 16
  - two Siri reminders in a row (without the app in between) x 40 x 16
  - the dates cross the 25 October 2026 clock change
- Mutation check: four deliberate faults in the specification (no badge increment, wrong boundary, limit off by one, strict time boundary) each fail the tests.
- Siri core bundle: 23.6 KB, no `window`, `document` or `localStorage`. Run in an empty Node sandbox (as JavaScriptCore will run it), it equals the app's `buildSiriReminder` for 18 phrases x 4 times (afternoon, morning, New Year's Eve, the night before the clock change) x repeats on and off. A run with the sandbox on the real clock fails, so the comparison is real.

## 4. Stage 2 evidence (2026-10-22)

Files: `src/app/utils/siri-pending.ts` (`buildSiriContext`, `isSiriReminder`, `planSiriImport`), `src/app/utils/widget.ts` (`syncSiriContext`, `getSiriPending`, `removeSiriPending`), `ios/App/App/WidgetBridgePlugin.swift` (`setSiriContext`, `getSiriPending`, `removeSiriPending`), `src/app/App.tsx` (publish and import), tests `siri-pending.test.ts` and `widget.test.ts`.

- App Group keys: `siriContext` (JSON: effective alerts and badge, sound, include today, repeat flag, badge timeline) and `siriPendingReminders` (JSON strings, written by the intent in stage 3). The pending list is read and changed on the main thread only.
- Effective settings: alerts and badge are off when Reminders or Notifications is off, matching the app, which then schedules nothing. The timeline is empty while the badge is off.
- Import: on launch and on return to the foreground. Adds by reminder id only (not through `addReminders`, which skips reminders whose text matches an existing one), with the usual insert highlight. Removes an entry only once the saved reminders include it, or when it is malformed and carries an id. Reminders the user has since completed or deleted are never re-added.
- Tests: 13 for context, validation and the import plan (once, twice, a stop between save and removal, the same id twice, the same text with different ids, empty, malformed and unreadable entries); 5 for the bridge wrappers (context sent once per change and again after a failure, strings only, failure and non-iOS, removal by id).
- Simulator end to end: four entries put in the pending list with the app not running (two "Call Mum at 6pm" reminders with different ids, one of them listed twice, and one malformed). After launch each reminder was saved exactly once and the pending list was empty. Then a saved reminder put back in the list (a stop before removal): removed on relaunch, still saved once. The context was published.
- Vitest 295/295, Self Check 412/412, type-check 0 errors, production build, Siri core bundle unchanged (23.57 kB), native build.
