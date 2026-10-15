# Self-Check Baseline Report

Last updated: 2026-10-15

## Verified Baseline (2026-10-15, feature/notifications-settings, Phase 4 stage 3)

- Vitest (`npm run test`): 205 passed, 0 failed (11 files). 4 Phase 4 settings checks run through settings.test.ts.
- Self Check: 386 passed, 0 failed across 11 suites (Node run). 4 Phase 4 checks added to Settings foundation (fallbacks removed, saved off kept, saved on kept, sound default). Stored settings precedence check now uses the remaining fallback key; migrated alerts and badge defaults are off for new installs.

## Previous baseline (2026-10-15, feature/notifications-settings, Phase 4 stage 2)

- Vitest (`npm run test`): 201 passed, 0 failed (11 files). 11 Phase 4 scheduling tests added to notifications.test.ts (alerts and badge combinations, badge-only, sound, 64 limit).
- Self Check: 382 passed, 0 failed across 11 suites (Node run). 4 Phase 4 checks added to Notification and badge (badge-only, alerts and badge off, sound on alerts only, badge-only limit).

## Previous baseline (2026-10-15, feature/date-presets)

- Vitest (`npm run test`): 190 passed, 0 failed (11 files; date-presets.test.ts added).
- Self Check: 378 passed, 0 failed across 11 suites (Node run). 5 date preset checks added to Schedule and reminder logic, 1 date presets gate check added to Settings foundation.

## Previous baseline (2026-10-12, fix/self-check-audit)

- Vitest (`npm run test`): 167 passed, 0 failed (9 files). Dev tools controls guard now includes Sounds and Lock screen widget.
- Self Check: 354 passed, 0 failed across 10 suites (Node run of the same checks).
- Dev tools and feature flags: 33 checks that only exercised localStorage or local variables replaced by 1 check of the real defaults path (paywall defaults off).
- Persistence and hydration: 2 calendar checks added (month navigation, New reminder prefill); calendar filter ranges check extended with combined Later and Sunday.
- Since the click-sounds baseline, lock screen widget (+10) and calendar view (+5) checks were added, giving 384 before this change.

## Earlier baselines

Full detail is in `docs/development-history.md`.

| Date | Branch | Vitest | Self Check |
|------|--------|--------|------------|
| 2026-10-11 | feature/click-sounds | 132 (7 files; sounds.test.ts added) | 369 (Settings foundation 35) |
| 2026-10-11 | feature/settings-flags-model, Phase 3 close-out | 120 (6 files) | 366 (new Settings foundation suite, 32) |
| 2026-10-09 | main, feature/lists-disabled-ui-refinement, settings-menu-phase1 | 36 | 340 on iPhone 15 Pro and iPhone 17 Pro simulator; later 327 after removing 13 grouped-filter checks, then 334 after 7 settings-menu checks |

Note: five midnight badge expectations in `src/app/__tests__/notifications.test.ts` were corrected to match the intentionally restored `hasActiveDateOnlyReminder` guard in `buildMidnightBadgeNotification` (restored 2026-06-18).

## Clean Run (Expected)

```
Reminderly Self-Checks Report
Run invocation id: [varies]
Ran at: [varies]
Duration: [varies]ms
Passed: 354 | Failed: 0
Schedule and reminder logic

✓ Date equality: null equals null
✓ Date equality: null does not equal value
✓ Date equality: value does not equal null
✓ Date equality: same date string equals same
✓ Date equality: different date strings not equal
✓ Time equality: null equals null
✓ Time equality: null does not equal value
✓ Time equality: value does not equal null
✓ Time equality: same hour/minute equals
✓ Time equality: different hour not equal
✓ Time equality: different minute not equal
✓ RepeatRule equality: null equals null
✓ RepeatRule equality: null does not equal value
✓ RepeatRule equality: same frequency + interval equals
✓ RepeatRule equality: different frequency not equal
✓ RepeatRule equality: different interval not equal
✓ RepeatRule equality: byDay is order-insensitive
✓ RepeatRule equality: byDay null equals null
✓ RepeatRule equality: byDay null does not equal value
✓ Delta detection: date add (null → value)
✓ Delta detection: date remove (value → null)
✓ Delta detection: date change (value A → value B)
✓ Delta detection: date no change (value A → value A)
✓ Delta detection: time add (null → value)
✓ Delta detection: time remove (value → null)
✓ Delta detection: time change (value A → value B)
✓ Delta detection: time no change (value A → value A)
✓ Delta detection: repeat add (null → value)
✓ Delta detection: repeat remove (value → null)
✓ Delta detection: repeat change (value A → value B)
✓ Delta detection: repeat no change (value A → value A)
✓ Delta detection: date changed, time removed
✓ Delta detection: no changes across all fields
✓ Derived: hasTime is true when time is non-null
✓ Derived: hasTime is false when time is null
✓ Derived: isRecurring is true when repeatRule is non-null
✓ Derived: isRecurring is false when repeatRule is null

Persistence and hydration

✓ Persistence: loadReminders returns [] for invalid JSON
✓ Persistence: loadReminders returns [] for JSON object
✓ Persistence: loadReminders returns [] for JSON string
✓ Persistence: loadReminders returns [] for JSON number
✓ Persistence: record with missing schedule is dropped
✓ Persistence: record with unknown schedule.kind is dropped
✓ Persistence: scheduled with invalid date/time is dropped
✓ Persistence: scheduled with malformed time (non-HH:mm) is dropped
✓ Persistence: record with missing/empty id is dropped
✓ Persistence: record where both text paths fail is dropped
✓ Persistence: invalid createdAt defaults to a finite number
✓ Persistence: invalid repeatRule becomes null
✓ Persistence: write then load preserves reminders (new format)
✓ Categorisation: scheduled on same day returns "today"
✓ Categorisation: scheduled later in same Mon-Sun week returns "this-week"
✓ Categorisation: scheduled on Monday of current week returns "this-week"
✓ Categorisation: scheduled after end of week returns "later"
✓ Categorisation: schedule.kind "sometime" returns "sometime"
✓ Settings menu on: Sometime displays as Later, other categories unchanged
✓ Settings menu off: Sometime keeps its own display category
✓ Settings menu on: Later and Sometime filters switch to combined Later
✓ Settings menu off: combined Later filter restores standard Later
✓ Settings menu on -> off -> on: filter is always a visible filter
✓ Settings menu: combined Later lists dated Later before undated Sometime
✓ Settings menu: presentation helpers do not change stored reminders
✓ Sorting: scheduled reminders sort by date ascending
✓ Sorting: same-date scheduled reminders sort by time ascending
✓ Sorting: unscheduled come after scheduled, ordered by createdAt asc
✓ Sorting: same-date reminder with time sorts before one without time
✓ Persistence: round trip preserves hourly repeatRule
✓ Persistence: round trip preserves weekly repeatRule with byDay (custom-days mapping)
✓ formatRepeatLabel: hourly interval 1 returns "Repeats every hour"
✓ formatRepeatLabel: hourly interval 3 returns "Repeats every 3 hours"
✓ formatRepeatLabel: weekly with byDay (mo, we, fr) interval 1
✓ formatRepeatLabel: daily interval 2 returns "Repeats every 2 days"
✓ formatRepeatLabel: daily with time includes "at 5pm"
✓ formatRepeatLabel: weekly with byDay and time includes day and "at 4pm"
✓ formatRepeatLabel: daily without time returns "Repeats every day"
✓ formatRepeatLabel: monthly interval 1 with time returns "Repeats every month at 12pm"
✓ formatRepeatLabel: monthly interval 3 with time returns "Repeats every 3 months at 12pm"
✓ formatRepeatLabel: monthly interval 1 + date + time → "Repeats every month on 12th at 12pm"
✓ formatRepeatLabel: monthly interval 2 + date + time → "Repeats every 2 months on 12th at 12pm"
✓ formatRepeatLabel: monthly with no schedule date omits "on …"
✓ Overdue: yesterday (date only) is overdue
✓ Overdue: today + earlier time is overdue
✓ Overdue: today + later time is NOT overdue
✓ Overdue: tomorrow is NOT overdue
✓ Overdue: sometime schedule is never overdue
✓ Overdue: today (date only, no time) is NOT overdue
✓ Overdue sorting: overdue items pinned to top within this-week list
✓ Overdue sorting: overdue items appear above ALL non-overdue items regardless of category
✓ Hydration: legacy localStorage with removed schedule kind loads as "sometime"
✓ Hydration: legacy localStorage with "text" migrates to originalText + displayText
✓ Normalise: "Call mum tomorrow night at 7:30pm" → "Call mum on Friday at 7:30pm"
✓ Normalise: "Pay rent next Monday" → "Pay rent on Monday" (within 6 days uses weekday)
✓ Normalise: "Dinner tonight" → "Dinner on Thursday at 7pm"
✓ Normalise: "Buy milk" with no date returns unchanged
✓ Normalise: scheduled date-only does not inject "at" time
✓ Normalise: recurring "Call mum every wednesday at 7pm" does not inject "on Wednesday"
✓ Normalise: "Call mum Feb 28 at 7pm" → "Call mum at 7pm"
✓ Normalise: "Call mum February 28th" → "Call mum"
✓ Normalise: "Car MOT March 7th 2027 at 12pm" → "Car MOT at 12pm"
✓ Normalise: "Car MOT March 7th at 12pm" → "Car MOT at 12pm"
✓ Normalise: "Call mum March 1 in the morning" → "Call mum at 7am"
✓ Normalise: "Call mum March 1 in morning" → "Call mum at 7am"
✓ Normalise: "Call mum on speaker March 1 in the morning" keeps "on speaker"
✓ Normalise: manual date selection (skipDateInjection) does not alter text
✓ Normalise: bare weekday after stripping is replaced in-place, not duplicated
✓ Restore: bucket colour after clearing completedAt matches repeat reinsertion derivation
✓ Restore: overdue restored reminder gets OVERDUE colour (same as repeat reinsertion)
✓ renderReminderText: scheduled date equals today → output contains "today"
✓ renderReminderText: scheduled date not today/tomorrow → output equals displayText
✓ renderReminderText: non-scheduled reminder → output equals displayText
✓ renderReminderText: scheduled date equals tomorrow → output contains "tomorrow"
✓ renderReminderText: scheduled date 2+ days away → output equals displayText
✓ renderReminderText: recurring reminder due today → "Meditate today at 7am"
✓ renderReminderText: recurring reminder not due today → unchanged displayText
✓ Date indicator: same year → "Mar 7th" (no year)
✓ Date indicator: different year → "Mar 7th, 2027"
✓ getDisplayTitle: strips exact trailing " on <date> at <time>"
✓ getDisplayTitle: strips exact trailing " on <date>"
✓ getDisplayTitle: strips exact trailing " at <time>"
✓ getDisplayTitle: does NOT strip when same text appears mid-string
✓ getDisplayTitle: does NOT strip when no exact match exists
✓ Calendar: Monday-first grid uses only the rows the month needs (4, 5, 6) and handles leap years
✓ Calendar: max 4 dots per day; overdue on its original date; done, deleted and sometime excluded
✓ Calendar: filter ranges match Today, This week and Later, past days never in range
✓ Calendar: today lists due today plus overdue; another day lists only that date
✓ Calendar: month navigation crosses year boundaries, returning to the current month follows today
✓ Calendar: New reminder from a selected day prefills that local date at 12pm, nothing without a day

Natural language parsing

✓ NLC parser: recognises "today" as date token
✓ NLC parser: recognises "tomorrow" as date token
✓ NLC parser: recognises bare weekday as date token
✓ NLC parser: recognises "next Friday" as single date token
✓ NLC parser: recognises two weekdays as separate date tokens
✓ NLC parser: weekday matching is case-insensitive
✓ NLC parser: recognises "February 28" as date token
✓ NLC parser: recognises "February 28th" as date token
✓ NLC parser: recognises "Feb 28" as date token
✓ NLC parser: recognises "Feb 28th" as date token
✓ NLC parser: recognises "28 Feb" as date token
✓ NLC parser: recognises "28th Feb" as date token
✓ NLC parser: recognises "28 February" as date token
✓ NLC parser: recognises "28th February" as date token
✓ NLC parser hardening: rejects month+year (Feb 2027)
✓ NLC parser hardening: rejects 2-digit year (23 Feb 27)
✓ NLC parser hardening: rejects comma format (Feb 23, 2027)
✓ NLC parser hardening: rejects year-first (2027 Feb 23)
✓ NLC parser hardening: rejects invalid date with year (31 February 2027)
✓ NLC parser: recognises "7pm" as time token
✓ NLC parser: recognises "7:30pm" as time token
✓ NLC parser: recognises "7 pm" as time token
✓ NLC parser: rejects "7:10pm" (non-quarter-hour)
✓ NLC parser: accepts :00, :15, :30, :45 only
✓ NLC parser: rejects "13pm" (invalid 12h hour)
✓ NLC parser: "every Wednesday" is repeats (not date)
✓ NLC parser: recognises "every day" as repeats
✓ NLC parser: recognises "every 3 days" as repeats
✓ NLC parser: recognises "every 2 weeks" as repeats
✓ NLC parser: recognises "weekdays" as repeats
✓ NLC parser: recognises "Mon, Wed, Fri" as repeats
✓ NLC parser: recognises date + time + repeats in one sentence
✓ NLC parser: returns empty for plain text with no patterns
✓ NLC parser: returns empty for empty string
✓ NLC parser: recognises "morning" as time token
✓ NLC parser: recognises "night" as time token
✓ NLC parser: time-of-day tokens are case-insensitive
✓ NLC parser: "Goodnight" does not match "night"
✓ NLC parser: "this morning" is a single compound time token
✓ NLC parser: "tonight" is a time token
✓ NLC parser: explicit clock time suppresses time-of-day tokens
✓ NLC parser: "tomorrow at 8pm tomorrow night" — night never tokenises
✓ NLC parser: "this night" is not a compound — "night" is standalone
✓ NLC parser: "tomorrow morning" produces date + time tokens
✓ NLC parser: "every morning" is a repeats token
✓ NLC parser: "every night" is a repeats token
✓ NLC parser: "every year" is a repeats token
✓ NLC parser: "everyday" does not tokenise (no space)
✓ NLC parser: "every other day" does not tokenise
✓ NLC parser: "every weekday" does not tokenise
✓ NLC parser: repeat token suppresses date tokens
✓ NLC parser: "every morning at 6am" produces repeats + time tokens
✓ NLC parser: token start/end match exact substring position
✓ NLC parser: date recognition OFF produces no date tokens
✓ NLC parser: time recognition OFF produces no time tokens
✓ NLC parser: repeats recognition OFF produces no repeats tokens
✓ NLC parser: repeats OFF allows "every Wednesday" weekday as date token
✓ NLC parser: repeats OFF allows "every morning" morning as time token
✓ NLC parser: date OFF + time ON returns only time tokens
✓ NLC parser: all recognition OFF returns empty array
✓ NLC parser: default recognition config enables all categories

Natural language interaction

✓ NLC interaction A: recognition-only does not apply toggles or schedule
✓ NLC interaction B: clicking time token sets time only, not date
✓ NLC interaction C: clicking date token sets date only
✓ NLC interaction D: clicking repeats token sets repeats + date
✓ NLC interaction E: applying one date token makes others ineligible
✓ NLC interaction F: deleting applied token invalidates and re-enables alternatives
✓ NLC interaction G: ambiguous duplicate tokens cause invalidation
✓ NLC interaction H: non-quarter-hour time (7:10pm) produces no time token
✓ NLC interaction I: "every Wednesday" anchor is next upcoming Wednesday (or today)
✓ NLC interaction I: "every 3 days" anchor is today
✓ NLC interaction J: two identical time tokens after edit cause invalidation, not relocation
✓ NLC interaction K: no token clicks means schedule is "sometime"
✓ NLC auto parsing: applies time when exactly one time token exists and time toggle is off
✓ NLC auto parsing: does not apply date when two date tokens exist
✓ NLC auto parsing: applies repeats+date when exactly one repeats token exists
✓ NLC auto parsing: does not overwrite when toggle already on
✓ NLC auto parsing: after invalidation clears toggle, new text can re-trigger auto-apply
✓ NLC interaction Q: standalone "morning" returns time 07:00
✓ NLC interaction R: "this morning" returns time 07:00 + date today
✓ NLC interaction S: "tonight" returns time 21:00 + date today
✓ NLC interaction T: all time-of-day tokens return correct fixed times
✓ NLC interaction U: "tomorrow morning" auto-applies date=tomorrow, time=morning
✓ NLC interaction V: "every morning" → repeat daily, time 07:00
✓ NLC interaction W: "every evening" → repeat daily, time 18:00
✓ NLC interaction X: "every day" → repeat daily, no implied time
✓ NLC interaction Y: "every year" → repeat yearly
✓ NLC interaction Z: "every Monday" → weekly on Monday, no time
✓ NLC interaction AA: repeat token suppresses date tokens
✓ NLC interaction AB: getRepeatsImpliedTime returns correct values
✓ NLC interaction AC: "every morning" auto-applies as single repeats action
✓ NLC interaction AD: deleting explicit time while "every morning" survives → implied time reactivates
✓ NLC interaction AE: "tomorrow night" → date=tomorrow, time-of-day must not imply today
✓ NLC interaction AF: "every wednesday at 7pm" on Thursday → anchor is next Wednesday
✓ NLC interaction AG: "every thursday at 7pm" on Thursday → anchor is today
✓ NLC interaction AH: "Feb 28" resolves to 2026-02-28 (future date in same year)
✓ NLC interaction AI: "Feb 26" resolves to next year when date is past
✓ NLC interaction AJ: "28 Feb" resolves to 2026-02-28
✓ NLC interaction AK: "26 Feb" resolves to next year when date is past
✓ NLC interaction AL: "23 Feb 2027" resolves to 2027-02-23
✓ NLC interaction AM: "Feb 23 2027" resolves to 2027-02-23
✓ NLC interaction AN: "23 Feb 2025" resolves to 2025-02-23 (past year allowed)
✓ NLC interaction AO: "29 Feb 2028" resolves correctly (leap year valid)
✓ NLC interaction AP: "29 Feb 2027" does not tokenise (invalid date)
✓ NLC interaction AQ: nlcEnabled=false produces empty token list without calling parseTokens
✓ NLC interaction AR: date recognition OFF prevents date auto-apply
✓ NLC interaction AR: time recognition OFF prevents time auto-apply
✓ NLC interaction AR: repeats recognition OFF prevents implied date/time from repeats
✓ NLC interaction AR: mixed recognition config filters correctly through pipeline

Done, deleted, and completion

✓ ViewMode: list -> done-deleted on tick click
✓ ViewMode: done-deleted -> list on tick click
✓ ViewMode: Today filter -> done-deleted on tick click (resets filter)
✓ Navigation: tick click area (0-22%) does not overlap text area (25%-100%)
✓ Done/deleted: sub-filter classifies done-only, deleted-only, and both items correctly
✓ Done/deleted: pendingUncomplete/pendingUndelete items visible in correct sub-filters
✓ Done/deleted: clear-all includes pending restore ids, excludes pendingDelete ids
✓ Derivation: sort key uses pendingUndeleteSortKey ?? deletedAt ?? completedAt ?? pendingUncompleteCompletedAt
✓ Persistence: deletedAt survives save/load cycle
✓ Derivation: active list excludes reminders with completedAt != null
✓ Derivation: done/deleted list includes reminders with completedAt != null
✓ Derivation: done list sorted by completedAt descending
✓ Derivation: done list derived only from completedAt, no transient state
✓ Field: completedAt undefined treated as active
✓ Field: completedAt null treated as active
✓ Field: completedAt number treated as done
✓ Concurrency: timer map prevents duplicate timers for same id
✓ Concurrency: two different reminders can complete simultaneously
✓ Persistence: completedAt survives save/load cycle
✓ Uncomplete: setting completedAt to null returns item to active list
✓ Uncomplete: no-op when completedAt is already null
✓ Uncomplete: only clears completedAt, preserves all other fields
✓ Repeat: second click during in-flight window cancels completion and prevents spawn

Lists and smart reminders

✓ List date storage: round-trips YYYY-MM-DD values
✓ List date storage: invalid stored values return null
✓ List due date formatting: current-year dates omit year
✓ List due date formatting: cross-year dates include short year
✓ List smart reminders: 0% progress uses Complete copy
✓ List smart reminders: 1%-74% progress uses Finish copy
✓ List smart reminders: 75%+ progress uses Nearly done copy
✓ List smart reminders: no due date means no linked reminder
✓ List smart reminders: linked reminder uses scheduled noon and list metadata
✓ List categories: todo, started, almost, complete derive from completion ratio
✓ List ordering: insertion mode preserves authored order
✓ List ordering: alphabetical mode sorts by item text
✓ List ordering: alphabetical pinned item stays at its current visual index temporarily
✓ List ordering: missing pinned item falls back to alphabetical list
✓ List settings: closing overlay delays sort apply by 150ms when draft changed
✓ List settings: closing overlay does not schedule sort apply when draft matches current
✓ List settings: Uncheck all closes overlay and applies item reset after 150ms
✓ List smart reminder overlays: toggling on from no-date state opens picker
✓ List smart reminder overlays: back from no-date picker restores no date and turns toggle off
✓ List smart reminder overlays: back from existing-date picker preserves saved date and toggle
✓ List smart reminder overlays: Set date stores pending display date and collapses picker
✓ List smart reminder overlays: saved due-date update clears pending display buffer
✓ List smart reminder sync: active linked reminders are removed when feature is disabled
✓ List smart reminder sync: done or deleted linked reminders are preserved when feature is disabled
✓ List smart reminder sync: linked reminder text and schedule update when list changes
✓ List smart reminder sync: missing linked reminder is created for eligible list

Dev tools and feature flags

✓ Dev tools defaults: password required on, paywall off, onboarding on, first-launch tutorial on, every-start tutorial off

Notification and badge

✓ Badge count: counts overdue reminders
✓ Badge count: includes today reminders when includeTodayInBadge is true
✓ Badge count: excludes today reminders when includeTodayInBadge is false
✓ Badge count: excludes completed reminders
✓ Badge count: excludes deleted reminders
✓ Badge count: excludes sometime reminders
✓ Badge count: returns 0 when no reminders match
✓ Notification payload: sets badge to computed count at fire time
✓ Notification payload: sets badge to 0 when notifAppBadge is false
✓ Badge delta: sets badgeDeltaOnAction to 1 when badge > 0
✓ Badge delta: sets badgeDeltaOnAction to 0 when badge is 0
✓ Scheduling limits: limits to 64 notifications when no midnight needed
✓ Scheduling limits: 63 reminder notifications plus midnight when date-only exists
✓ Midnight notification: included when active date-only reminder exists
✓ Midnight notification: excluded when all reminders have times
✓ Midnight notification: excluded when badge is disabled
✓ Midnight notification: has empty title and body
✓ Midnight notification: excludes completed date-only reminders
✓ Midnight notification: excludes deleted date-only reminders
✓ Scheduling limits: all 64 slots for reminders when no midnight needed
✓ Refresh boundary: returns ms to midnight when no timed reminders today
✓ Refresh boundary: returns ms to next timed reminder when sooner than midnight
✓ Widget progress: today and overdue reminders count as outstanding
✓ Widget progress: reminders completed today count as done
✓ Widget progress: all done gives 0 outstanding
✓ Widget progress: nothing due gives 0 outstanding and 0 done
✓ Widget progress: excludes deleted, sometime and future-dated reminders
✓ Widget progress: reminders completed before today are not counted
✓ Widget progress: reminders due tomorrow are counted separately for midnight rollover
✓ Widget progress: reminder due tomorrow but completed today is not counted for midnight rollover
✓ Widget progress: completed daily repeat counts as done, next occurrence is tomorrow

Settings foundation

✓ Migration: new install writes only the schema marker and gets development defaults
✓ Migration: existing install with nothing saved keeps notifications and haptics on
✓ Migration: each existing-install key on its own marks an existing install
✓ Migration: every saved current key is copied to its new key
✓ Migration: explicitly saved off values stay off (alerts, badge, include today, smart reminders, templates)
✓ Migration: a second run changes nothing
✓ Migration: never overwrites a new key that already has a value
✓ Migration: current keys, reminders, lists and tutorial state are unchanged
✓ Migration: Siri on moves to Siri reminders. Siri lists stays off with its preference kept
✓ Migration: an unreadable schema value runs the migration safely
✓ Stored settings: a saved value wins over the fallback, a missing value uses it
✓ Stored settings: explicit false stays distinct from missing
✓ Stored settings: a malformed value uses the fallback and is not overwritten by reading
✓ Stored settings: reading every setting never writes
✓ Stored settings: a change writes only the authoritative key, legacy keys unchanged
✓ Stored settings: every migrated setting reads its authoritative key with its default
✓ Stored settings: an install already migrated in Phase 1 keeps its new values
✓ Stored settings: a new install has no preference keys until something is changed
✓ Stored settings: a failed write is reported, a successful write reports nothing (cannot clear other errors)
✓ Dev tools: the last enabled of Reminders and Lists cannot be turned off
✓ Repeat flag off: new reminders and Siri get no rule, edits keep the existing rule, on allows changes
✓ Repeat flag off: NLC recognises no repeats but still recognises dates and times
✓ Haptics: every action belongs to exactly one switch, on the right panel
✓ Haptics: existing saved choices carry over to the per-panel design
✓ Haptics: active while either panel is on, off when both are off
✓ Sounds: same switches, actions and panels as haptics
✓ Sounds: off by default for both panels, saved choices win
✓ Sounds: active while either panel is on, saved choices kept when the flag is turned off and on
✓ Resolver: never writes to storage
✓ Resolver: Lists off hides lists features. Turning it back on restores them unchanged
✓ Resolver: Reminders off hides reminders features, including smart reminders and notifications
✓ Resolver: a flag off hides the feature without changing the preference
✓ Resolver: alerts and badge resolve independently and need iOS permission
✓ Resolver: unrecognised values read as off, haptics reads its master switch
✓ Resolver: testing-only keys never change any feature
✓ Lock screen widget: on by default, master flag turns it off and on, reminders unaffected
✓ Calendar: flag and Show calendar both default off, active only when Reminders, flag and setting are on

```

## Check Count Breakdown

- **Schedule checks** (schedule-checks.ts): 37
  - Date equality: 5
  - Time equality: 6
  - RepeatRule equality: 8
  - Delta detection: 14
  - Derived properties: 4
- **Reminder checks** (reminder-checks.ts): 90 (per-section split not itemised since the 77-check baseline; includes 6 calendar checks)
- **NLC parser checks** (nlc-parser-checks.ts): 61
  - Date token recognition: 6
  - Month-name date recognition: 8
  - Month-name date hardening (negative): 5
  - Time token recognition: 6
  - Repeats token recognition: 6
  - Cross-category and edge cases: 3
  - Time-of-day tokens: 10
  - "every" pattern tokens: 8
  - Token range accuracy: 1
  - Recognition config: 8
- **NLC interaction checks** (nlc-interaction-checks.ts): 48
  - Token click behaviour (A-K): 12
  - Auto-apply behaviour: 5
  - Time-of-day interaction (Q-T): 4
  - Compound patterns (U-Z): 6
  - Advanced patterns (AA-AE): 5
  - Repeats anchor auto-apply (AF-AG): 2
  - Month-name date resolution (AH-AK): 4
  - Explicit year resolution (AL-AP): 5
  - Feature flag control (AQ): 1
  - Recognition config (AR): 4
- **Done/deleted checks** (done-deleted-checks.ts): 9
  - ViewMode toggling: 3
  - Navigation (click areas): 1
  - Sub-filter classification: 2
  - Clear-all scope: 1
  - Sort key precedence: 1
  - Persistence (deletedAt): 1
- **Completion checks** (completion-checks.ts): 14
  - Derivation (active/done lists): 4
  - Field semantics (completedAt): 3
  - Concurrency: 2
  - Persistence: 1
  - Uncomplete: 3
  - Repeat double-click cancellation: 1
- **List checks** (list-checks.ts): 26
  - Date storage round-trip: 2
  - Due date formatting: 2
  - Smart reminder text (progress-based): 3
  - Smart reminder creation: 2
  - List category derivation: 1
  - List ordering (insertion/alphabetical/pinned): 4
  - List settings (sort apply, uncheck all): 3
  - Smart reminder overlay flows: 5
  - Smart reminder sync: 4
- **Dev tools and feature flags checks** (dev-tools-checks.ts): 1
  - Dev tools defaults (password, paywall, onboarding, tutorial first launch and every start): 1
- **Notification checks** (notification-checks.ts): 31
  - Badge count: 7
  - Notification payload: 2
  - Badge delta: 2
  - Scheduling limits: 3
  - Midnight notification: 6
  - Refresh boundary: 2
  - Widget progress: 9
- **Settings foundation checks** (settings-checks.ts): 37
  - Migration: 10
  - Stored settings (single source of truth, write failures): 9
  - Dev tools last-module guard: 1
  - Repeat reminders flag: 2
  - Haptics (per-panel switches, preserved choices, resolver): 3
  - Sounds (switches match haptics, defaults, resolver and flag): 3
  - Resolver: 7
  - Lock screen widget flag: 1
  - Calendar flag and Show calendar: 1
- **Total**: 354 checks across 10 suites

## Runner Integrity Check

If duplicate check IDs are detected, the system will fail fast with:

```
Passed: 0 | Failed: 1

✗ Runner integrity: duplicate check ids detected
  Error: Duplicate ids: [comma-separated list of duplicate ids]
```

No other checks will execute when duplicates are detected.

## Usage

When making changes to any utility or component:

1. Run the self-checks
2. Compare output against this baseline
3. If check count changes, update this document
4. If any checks fail unexpectedly, investigate before committing
