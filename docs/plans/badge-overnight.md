# Badge overnight repair - plan

Status: implemented (2026-10-20) on `fix/badge-overnight`. Awaiting John's iPhone validation across two consecutive midnights, then CTO merge approval.

Type C under Working Agreement v1.3 (protected areas: notification scheduling, badge counts, date handling). Branch `fix/badge-overnight` from `main` at 7ab6fe5.

## 0. Decision record

Decisions made by John on 2026-10-20, following the read-only badge investigation:

- D1 Clean repair and historical cleanup. No additional workarounds or unnecessary refactoring.
- D2 Seven future midnight badge notifications.
- D3 Keep the existing native correction after notification actions. The exact cut-off enhancement is deferred.
- D4 The widget's one-day limit stays out of scope (separate follow-up if wanted).
- D5 Tests and documentation updated to the corrected behaviour.

CTO review, 2026-10-20: plan approved. R1, R2 and R3 approved as proposed. Correction: exclude the 7 midnight ids from reminder-generated ids (no new id mechanism). Done by hashing reminder ids modulo 2147483641, so they fall below the midnight range (section 4).

Implementation note: a midnight whose count is 0 is skipped. Counts never fall as time passes with unchanged reminders, so a 0 midnight would change nothing; this also keeps an empty reminder list scheduling nothing.

## 1. Problem

While the app is suspended, iOS changes the badge only when a scheduled local notification is delivered. Today the app schedules at most one silent midnight notification, for the next midnight only, and only when an active date-only reminder exists (`hasActiveDateOnlyReminder`, notifications.ts:89). Result: no badge change at midnight when every reminder has a time, and none from the second night on. Opening the app recalculates the badge, which hides the fault.

Two secondary faults: the badge plugin's default `persist: true` puts back the last value the app set every time the plugin loads (including background launches), which can overwrite a delivered value; and the native patch writes `reminderly.nativeBadgeCount`, which nothing reads.

History: the guard was added (14a4c85), correctly removed (f98d81f), then restored (b81c142) because self-checks still expected it. The tests enforce the defect.

## 2. Target design: one mechanism per job

| Job | Mechanism | Change |
|---|---|---|
| Badge while the app is open | `Badge.set(computeBadgeCount(now))` (App.tsx:1471-1483) | None |
| Time-of-day changes while suspended (timed reminder becomes overdue) | Badge value in each timed reminder's notification | None |
| Day changes while suspended | Silent badge notifications at the next 7 local midnights | Replaces the single guarded midnight notification |
| Notification action while suspended | Native decrement in the plugin patch | Dead code removed, behaviour kept |

Same principle as the lock screen widget: future values are prepared in advance so the app does not need to open. Counting rules match the widget when Include today is on (section 5).

## 3. Changes

notifications.ts
- Remove `hasActiveDateOnlyReminder`, `buildMidnightBadgeNotification` and `MIDNIGHT_BADGE_NOTIFICATION_ID`.
- Add `buildMidnightBadgeNotifications`: when the badge is on, one silent notification at each of the next 7 local midnights (built with `setDate(+k)` and `setHours(0, 0, 0, 0)`, so clock changes are handled), badge `computeBadgeCount(reminders, includeToday, midnight + 1ms)`, empty title and body, `silent: true`, no actions. Fixed ids 2147483641 to 2147483647.
- Slot rule (section 4) replaces `reservedSlots`.
- No migration: `syncReminderNotifications` already cancels every pending notification when the set changes, so the old single midnight notification is replaced on the first sync.

capacitor.config.json
- `plugins.Badge.persist = false` (autoClear stays false, the plugin default). Removes the stale restore. Synced into ios/App/App/capacitor.config.json by `npx cap copy ios`.

patches/@capacitor+local-notifications+8.0.2.patch
- Remove the `reminderly.nativeBadgeCount` writes (willPresent and `correctBadgeAfterAction`) and the key constant. The `badge` payload support and the action correction stay unchanged.

Tests
- Vitest notifications.test.ts: remove the guard cases (lines 155-260: "excludes midnight notification when all reminders have times", "excludes completed/deleted date-only reminders from midnight guard", the 64/63 slot cases tied to the guard, "gives all 64 slots ... when no midnight notification needed").
- Self Check dev/notification-checks.ts: remove the matching midnight group (lines 197-310); update BASELINE.md counts.
- Add, in both where the existing suites mirror each other: 7 midnights when the badge is on, none when it is off; each midnight's count is correct (date-only becomes overdue, timed reminder due that day counted with Include today on); empty title and body; slot rule (64 timed reminders leave no midnights, 60 leave 4, the earliest 4); badge and widget counts agree (`computeBadgeCount(r, true, t) === getTodayProgress(r, t).outstanding` over a mixed fixture).

Documentation
- docs/features/notifications.md (lines 9, 53-55, 71-80, 126) and docs/ios.md:60: the 7 midnights, the slot rule, `persist: false`, removal of the dead key, and the known limitation in section 6.
- docs/development-history.md entry on completion.

Out of scope: widget code, App.tsx, reminder data, notification action handling in JS, the exact cut-off enhancement.

## 4. Slot rule: reminder alerts cannot be displaced

iOS keeps at most 64 pending notifications per app. Today one slot is reserved for the midnight notification ahead of reminders, so it can push out the 64th reminder alert.

New rule: timed reminder notifications are chosen first (earliest first, up to 64). Midnight notifications only take slots that are left, earliest midnight first. A midnight notification can therefore never displace a reminder notification.

- Fewer than 58 upcoming timed reminders (the normal case): all 7 midnights scheduled.
- 58 to 63: fewer midnights, the furthest ones dropped first.
- 64 or more: no midnight notifications. The badge still updates each time a reminder notification fires (each one carries the full count, including date-only reminders that have become overdue). Day changes between notifications are picked up at the next notification or the next time the app is opened.
- Unchanged: reminders beyond the 64 earliest get no notification until the next sync (every app open), as today.

Ids: reminder ids are hashed modulo 2147483641 (was 2147483647), so they are always below the midnight range 2147483641 to 2147483647 and cannot clash. Existing reminder notification ids change once; the first sync after the update cancels and reschedules them, as it does for any change.

## 5. Counting rules (badge and widget)

- Widget outstanding: not done, not deleted, scheduled, date on or before today (`getTodayProgress`, reminder-utils.ts:170).
- Badge with Include today on: overdue plus due today (`computeBadgeCount`, reminder-utils.ts:141). This is the same set of reminders.
- Badge with Include today off: overdue only. A badge-only user setting; the widget has no equivalent.
- Sometime, future, completed and deleted reminders: excluded by both.
- The two functions stay separate (identical logic, no refactor); the new equivalence test protects it.

## 6. Known limitation: future counts after notification actions

Badge values in pending notifications are calculated when the app last synced. When "Mark as done" or "Move to tomorrow" is used from a notification while the app is suspended, the native correction lowers the current badge and every pending badge by 1. It cannot see reminder data, so:

- Move to tomorrow: the reminder comes due again (from midnight with Include today on, or later when it becomes overdue), but later badges stay 1 lower.
- Mark as done on a repeating reminder: the next occurrence is not counted in later badges.
- Each further action from a notification adds the same gap.

The badge is correct again the next time the app is opened (full recalculation and resync). The exact cut-off enhancement (D3, deferred) would remove this. Documented in docs/features/notifications.md.

## 7. Verification

- Vitest and Self Check (Node run): full suites pass with the updated cases.
- Build, then simulator and iPhone deployment.
- Pending notifications read on the simulator through the web inspector (`LocalNotifications.getPending()`): 7 midnight entries with the expected counts, alongside the reminder notifications. Dev tools has no pending list, and none is added.
- Device checks (simulator clock where possible, iPhone overnight by John):
  1. Timed reminders only, Include today on: the badge rises at midnight without opening the app.
  2. Date-only reminder due today: the badge counts it as overdue after midnight.
  3. Two nights without opening the app: correct after each midnight.
  4. Mark as done from the lock screen: the badge drops by 1.
  5. Silent midnight notifications do not appear in Notification Centre or as banners.
  6. Badge setting off: no midnight notifications, badge cleared.
- Regression: alerts, sound, alerts off with the badge on (silent badge-only notifications), Reminders and Notifications flags off (everything cleared), permission ask unchanged.

## 8. Scope and risk

About 40 lines of TypeScript changed in notifications.ts, 1 config entry, about 10 patch lines removed, test replacement, docs. No new dependencies, native files or architecture.

Risks: protected area (notification scheduling and badge); midnight counts are only as current as the last sync (section 6); a full night has to pass on the device before John can confirm item 1.

## 9. CTO review requested

- R1 Slot rule in section 4 (reminder alerts first, midnights take whatever slots are left).
- R2 `persist: false` for the badge plugin.
- R3 Acceptance of the limitation in section 6 as documented behaviour.
