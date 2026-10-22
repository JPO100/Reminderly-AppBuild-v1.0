# Siri locked-device creation: Option C - architecture proposal

Status: proposal for CTO review. Planning only, no implementation authorised.

Type E under Working Agreement v1.3 (reminder creation, persistence, notification scheduling, native and web coordination). Follows the closed Option A spike ([siri-background-spike.md](./siri-background-spike.md)).

## 1. Requirement

With the iPhone locked in a pocket or in CarPlay: "Hey Siri, add to Reminderly app", then "Call Mum at 6pm". The reminder is created and saved, its 6pm alert is scheduled immediately, Siri says "That's done", and Reminderly never opens.

## 2. Recommendation in one paragraph

Run Reminderly's existing TypeScript logic for Siri, not a native rewrite of it, inside the intent with JavaScriptCore. JavaScriptCore runs in the app process and is not suspended like the web view. A small script built from the same source files parses the text (`buildSiriReminder`) and builds the notification (`buildScheduledNotifications`). The intent then saves the new reminder to a Siri inbox in the App Group, schedules its notification immediately with the same identifier and payload the Capacitor plugin uses, and says "That's done". The web app moves inbox reminders into its normal storage the next time it runs, by reminder id, so it can never add one twice. The web app stays the owner of all reminder data; the inbox is a short-lived hand-over.

## 3. Architecture

| Part | Owner | What it is |
|---|---|---|
| Siri core script | Built from existing TS | A second build entry (Vite library mode, one file, no DOM) exporting `buildSiriReminder`, `buildScheduledNotifications` and the id hash, bundled into the app. Same source files as the web app, so parsing and notification rules cannot drift |
| App Group mirror | Web app writes, intent reads | On every change, the web app writes what the core needs: the reminders (the same list it saves to localStorage), the repeat flag and the notification preferences (alerts, sound, badge, include today), plus `siriRemindersActive` as now. Same pattern as the widget snapshot |
| Siri inbox | Intent writes, web app clears | A JSON file in the App Group: reminders created by Siri and not yet imported. Written atomically with `NSFileCoordinator`, file protection "complete until first user authentication" so it is readable and writable while locked |
| Intent | Native | Reads the mirror, runs the core in JavaScriptCore, writes the inbox, schedules the notification, says "That's done". `openAppWhenRun` false and `supportedModes` `[.background]`: one path for iOS 16 and later, and the Siri off refusal then works on every version |
| Import | Web app | On launch, return to the foreground and a Darwin notification from the intent: reads the inbox, adds any reminder whose id is not already saved, saves, then removes those ids from the inbox. The normal notification sync then replaces the native notification with an identical one |

### Flow

1. Siri: phrase, then "What would you like to be reminded about?", then "Call Mum at 6pm".
2. Intent: Siri off or the mirror missing means refuse (fail closed, as today).
3. Dedupe: if the inbox or the mirror has a reminder with the same normalised text created by Siri in the last 60 seconds, reuse it (Siri re-runs a slow intent; the spike saw three runs for one request).
4. Core (JavaScriptCore): `buildSiriReminder(text, now, repeatActive)`, giving the reminder with a new id; `buildScheduledNotifications([...mirror, reminder], prefs)`, keeping only the payload for the new reminder.
5. Inbox: append the reminder; read it back to confirm it was written.
6. Notification: `UNNotificationRequest` with identifier `"<id>"` and content matching the plugin (`cap_extra`, `cap_schedule`, title, body, badge, `categoryIdentifier` "reminder-actions", sound when on). Only when notification permission is granted, as the web app does.
7. "That's done" only after 5 and 6 succeed; otherwise "I couldn't confirm your reminder was added." No foregrounding at any point.
8. Next time Reminderly runs: import, save, clear, then the usual sync.

## 4. Requirement checklist

| CTO question | Answer |
|---|---|
| Create and persist without opening the app | Inbox write in the intent, readable and writable while locked; confirmed by read-back before "That's done" |
| Share or coordinate data safely | One writer per store: web app writes localStorage and the mirror, intent writes the inbox, web app clears the inbox by id. No native writes to WebKit storage |
| Timed notifications scheduled immediately | Native `UNUserNotificationCenter` request in the intent, built by the existing `buildScheduledNotifications` |
| Natural-language parsing preserved | The same TypeScript runs in JavaScriptCore; parity tests run the built script against the existing Siri tests |
| Duplicate prevention | 60-second text dedupe in the intent; import by reminder id; notification identifier derived from the reminder id, so a repeat replaces rather than adds |
| Not recreating the engine natively | Native code only moves data and calls iOS (file, notification, Darwin notification). All reminder rules stay in TypeScript |

## 5. Risks

| Risk | Level | Mitigation |
|---|---|---|
| Payload mismatch with the Capacitor plugin breaks taps, actions or the native badge patch | High | Build the request from the plugin's own mapping (`LocalNotificationsPlugin.swift`); device tests of tap, Done and snooze actions on a Siri-created notification |
| Badge counts on other pending notifications are one short until the app next runs | Medium | Accepted in the first version: only the new notification is scheduled natively. The next app run resyncs every badge. Option: schedule the full set natively in a later stage |
| Mirror out of date (for example reminders changed on another device; settings changed while the app was killed) | Medium | Written on every change and on launch; Reminderly has no sync, so the only source is this device |
| JavaScriptCore bundle drifts from the web build | Medium | Built in the same Vite build from the same files; parity tests in Vitest and in Self Check |
| Concurrent inbox access (intent and web app in the same process) | Medium | `NSFileCoordinator` for every read and write; import removes only the ids it imported |
| Lock-screen data protection | Medium | App Group file created with "complete until first user authentication"; tested with the phone locked for more than 10 seconds |
| Widget and badge stale until the app runs | Low | The widget snapshot can include inbox reminders (later stage) |
| App Review | Low | Background App Intents with `alwaysAllowed` are the documented pattern; no background-execution workarounds |

Migration and compatibility: no change to existing reminder data. The inbox and mirror are new keys and files; older builds ignore them. No data migration. Rollback: removing the import leaves inbox reminders unimported, so the import stays in place once released.

## 6. Staged plan (each stage on its own branch, CTO review per stage)

| Stage | Work | Behaviour change | Exit test |
|---|---|---|---|
| 1 | Feasibility spike: core script built and run in JavaScriptCore inside the intent, with the phone locked; parse result logged, nothing saved | None | Same output as Vitest for the Siri test cases, on a locked device in the background |
| 2 | App Group mirror written by the web app | None | Mirror matches localStorage after add, edit, complete and delete |
| 3 | Inbox and import (web app), with idempotency tests | None until stage 4 | Unit tests: import once, twice, partial, concurrent |
| 4 | Intent: dedupe, core, inbox write, native notification, "That's done"; foreground path removed | Siri creates in the background | Device matrix: locked for more than 10 seconds and unlocked; backgrounded and not running; CarPlay; Siri retries; notification fires while locked; tap and actions work; import adds once |
| 5 | Optional: widget includes inbox; full badge resync natively | Badge and widget exact while locked | Badge and widget counts |

Estimated complexity: Type E, medium. Stage 1 is small and decides feasibility before any data work; stages 2 to 4 are each a contained change.

## 7. Decisions needed

1. CTO: approve the architecture and stage 1 (feasibility spike).
2. John: accept that, until stage 5, other pending notifications' badge numbers can be one short until Reminderly next runs.
3. John: the dedupe window (60 seconds proposed) for identical requests.
