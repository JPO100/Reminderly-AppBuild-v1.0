# NLC titles, numeric dates and format gaps - plan

Status: PLAN, conditionally approved by Kai (2026-10-24), revised for his five conditions and a staged implementation (sections 5 and 6). Awaiting final plan approval and John's decisions D1, D2, D4, D7, D8, D9. Not implemented.

Type D under Working Agreement v1.3. It is cross-component (the shared NLC parser and title logic used by the in-app editor, the Siri intent through the bundled siri-core.js, and notification text) and touches protected areas (date handling, time handling, notification scheduling input). Kai approves this plan before implementation and signs off before merge.

Branch: `feature/nlc-titles-dates`, from main (a89da9f).

## 0. Decision record

- 2026-10-23, simulator run of the 72-test NLC checklist (results in the NLC testing checklist doc): 70 pass, 0 fail, 2 not tested. Confirmed quirks: word order (a later date or time is ignored once the row is on), titles keeping weekday labels and relative words, times already past saved as overdue.
- 2026-10-24, John: with NLC on, the reminder title is the task only ("Call mum"); the date, time and repeat the user typed are applied and shown in the subtitle, not the title. "Call mum on Monday at 9pm" currently saves as "Call mum Monday on Monday at 9pm"; this change replaces that path rather than patching it.
- 2026-10-24, John: refinements accepted - capitalise the first letter after removal; only remove a word that ends the text, follows at/on/in, or sits next to another removed word.
- 2026-10-24, John: every reminder has a time. Siri date-only reminders default to 12pm, as the app does.
- 2026-10-24, John: support DD/MM/YYYY, D/M/YY and variations, and fill every gap in the date format table.
- 2026-10-24, Kai: Type D and the approach confirmed, no scope reduction. Conditionally approved, subject to five conditions (title cleaning, word order, numeric safety, Siri behaviour, regression; section 5) and at most 5 implementation stages (section 6). No implementation or merge approval yet.

## 1. Current behaviour

- In-app titles: `normaliseReminderText` (normalise-text.ts) strips some relative words and inserts a date label ("on Friday", "on 27 Feb"); the row title (`getDisplayTitle`) then strips only a trailing " on D Mon at <time>", " on D Mon" or " at <time>". Results vary by phrase: "Call mum at 9pm" gives "Call mum", "Buy milk at 9pm today" gives "Buy milk on Friday", "Pay rent in 3 days" gives "Pay rent in 3 days on Monday".
- Siri titles: `buildSiriReminder` (siri.ts) already removes the applied date and time token spans with a preceding at/on/in (Stage 4, D3). Repeat words stay.
- Notifications use `displayText` as the body (app and AddReminderIntent.swift).
- Siri date-only phrases ("the day after tomorrow", "in 3 days", "every Monday") save with no time. In the app a date always gets 12pm.
- Auto-apply only applies a token while its row is off (`computeAutoApplyResult`). A date token turns Time on at 12pm, so a later "3pm" is ignored; a time token turns Date on (today), so a later "tomorrow" is ignored.

## 2. Changes

### 2.1 Task-only titles (app and Siri)

One shared helper, extracted from Siri's existing title cleaning (no new parsing): `titleFromAppliedTokens(text, appliedTokens)`.

1. Remove each applied date, time and repeat token, with a directly preceding at/on/in.
2. Remove a token only when it ends the text, follows at/on/in, or sits next to another removed token (refinement, John). "Monday meeting notes" and "Buy flowers for Sunday lunch" keep the day.
3. Tidy spaces and trailing commas, then capitalise the first letter.
4. If nothing is left, keep the text as typed ("Tomorrow at 9pm").
5. Only tokens actually applied are removed: the in-app editor passes its applied tokens (auto or tapped); Siri passes its auto-apply actions. Words not applied, and dates set by hand, stay.
6. `originalText` keeps the full typed text, so editing re-parses as today. Each save rebuilds the title from `originalText`.
7. The editor save path stops calling `normaliseReminderText` for NLC reminders. Siri drops its own copy of the logic and uses the helper. `normaliseReminderText` and `getDisplayTitle` stay for reminders saved before this change, which are not rewritten.

Incidentally resolved: the "Monday on Monday" duplication, weekday labels in titles ("Buy milk on Friday"), relative words in titles ("in 3 days", "in 10 minutes"), and the duplicated time in 24-hour notifications ("Meet Sam 19:00 at 7pm" becomes "Meet Sam").

Sample results (real parser, 2026-10-24, before refinement 2): 16 of 20 clean, for example "Gym every Monday at 7am" -> "Gym", "Take the cake out of the oven in 20 minutes" -> "Take the cake out of the oven". Refinement 2 fixes the "Monday meeting notes" and "Sunday lunch" cases.

### 2.2 Word order in auto mode (dependency of 2.1)

A value NLC filled in as a default (Time 12pm from a date token, Date today from a time token) no longer blocks a later token. Auto-apply treats a row as off when its current value came from such a default rather than from a token or the user. Typing "Call mum tomorrow at 3pm" with pauses then gives tomorrow at 3pm, and "at 3pm tomorrow" gives tomorrow too. Rows the user set by hand, and tokens already applied, are never overwritten (existing rule). Without this, titles would keep unapplied words ("Call mum at 3pm").

### 2.3 Siri date-only reminders default to 12pm

`buildSiriReminder`: a date or repeat with no time gets 12:00, matching the app. Past-time handling is unchanged (a time with no date still moves to tomorrow once past).

### 2.4 Date formats

All new forms are date tokens, so they highlight, tap, auto-apply and are removed from titles like existing dates. Day comes before month in every numeric form (UK order; no US MM/DD).

| Form | Examples | Result |
|---|---|---|
| D/M/YYYY, DD/MM/YYYY | 3/3/2027, 03/03/2027 | 3 Mar 2027 |
| D/M/YY, DD/MM/YY | 3/3/27, 03/03/27 | 3 Mar 2027 (two-digit years are 2000 + YY) |
| Same with - | 3-3-27, 03-03-2027 | As above |
| Same with . (year required) | 3.3.27, 03.03.2027 | As above |
| D/M, DD/MM (no year, D4) | 3/3, 03/03 | Next 3 March (this year, or next if passed) |
| YYYY-MM-DD | 2027-03-03 | 3 Mar 2027 |
| Month name with two-digit year | 3 Mar 27, 3rd March '27, Mar 3rd 27 | 3 Mar 2027 |
| "of" | 3rd of March, the 3rd of March 2027 | As without "of" |
| Sept | Sept 3, 3 Sept, 3rd Sept 2027 | September |
| Weekday with a date | Wednesday 4 November, Wed 4 Nov, Wednesday, 4 November, Wednesday the 4th of November | One token; the date wins (D8) |

Rules: day 1-31 and month 1-12, checked against the real calendar (no 31/4, 29/2 only in leap years), as month-name dates are today. A date with an explicit year in the past is recognised as typed (existing behaviour). Numeric forms are not recognised inside longer digit runs (phone numbers, "24/7", "1/2/3/4"), next to a further / - . digit, or directly before am/pm or ":" (so "3.30pm" stays a time).

### 2.5 Small related fixes

- Recognise repeats: add `daily`, `weekly`, `monthly`, `yearly`, `hourly` (D9). The "Recognise repeats" info text already cites "daily".
- Docs: scheduling-and-nlc.md (titles, word order, formats, Siri 12pm default), ios.md (Siri says "Okay, that's added", not "That's done"; 12pm default), development history. Recheck the NLC FAQ answer (release-readiness ticket).

## 3. Native and dependency review

- siri-core.js (JavaScriptCore bundle) must be rebuilt with `npm run build:siri-core`; a test fails if it is stale. No change to the bundle's interface.
- AddReminderIntent.swift: no code change. Behaviour change from 2.3: Siri date-only reminders now have a time, so the intent schedules their notification at 12pm when that is in the future, and the badge counts them from the due time rather than the next midnight (`badgeCountsFrom`). The lock screen widget snapshot counts are unaffected (counts only, no titles).
- Notifications: the body is `displayText`, so alerts show the task only ("Call mum") at the due time (D2).
- No Capacitor plugin, permission, persistence schema or migration change. Saved reminders are not rewritten.
- Tutorial: the Natural Language Capture page already saves its demo row as "Take the bins out" (task only) from its own mock; no tutorial change expected. To confirm during implementation (tutorial consistency rule).

## 4. Risks and decisions needed

Risks:

- R1, false positives for numeric dates: fractions and scores ("1/2 price", "won 3-2"), versions, phone numbers. Mitigated by the boundary rules in 2.4 and, for D4, the yearless form.
- R2, "3.30" as a time: dots need a year (D5), and numeric dates never sit directly before am/pm or ":".
- R3, meaning lost from titles: mitigated by refinement 2; the applied word is highlighted before saving and the full text is kept for editing.
- R4, Siri transcription: iOS may turn spoken dates into "3/3/2027", "March 3rd" or words. Unrecognised phrases still save with the raw text as the title, which shows what iOS sent. John tests spoken phrases on device.
- R5, edit mode: older reminders whose text contains newly recognised forms re-parse in the editor. The existing baseline rule (tokens already in the original text do not auto-apply) prevents silent changes. Covered by a test.
- R6, 2.2 changes protected auto-apply logic. Covered by the existing Self Check interaction suite plus new cases for each typing order.

Decisions (recommendation first):

- D1, remove repeat words from titles ("Gym every Monday at 7am" -> "Gym")? Recommended yes, in app and Siri; the subtitle shows the repeat. John.
- D2, notifications show the task only ("Call mum")? Recommended yes. John.
- D3, include the word-order fix (2.2)? Recommended yes; titles depend on it. John and Kai.
- D4, yearless numeric dates ("3/3")? Recommended yes, with / only and the boundary rules; higher false-positive risk than dated forms. John.
- D5, dots only with a year? Recommended yes. Kai.
- D6, two-digit years are 2000 + YY? Recommended yes. Kai.
- D7, Siri date-only at 12pm when that is already past today ("call mum today" at 3pm)? Recommended keep 12pm, as the app does; past-time handling is a separate open quirk. John.
- D8, weekday and date that disagree ("Wednesday 5 November" when 5 November is a Thursday)? Recommended the date wins. John.
- D9, add daily/weekly/monthly/yearly/hourly? Recommended yes. John.

## 5. CTO conditions (Kai, 2026-10-24)

1. Title cleaning. Only tokens the parser positively identified and NLC applied are removed (2.1, rules 1, 2 and 5). Unmatched text stays, including words that resemble dates or repeats but were not applied ("Monday meeting notes", "Sunday lunch", "every so often", "evening" when a clock time was applied). The helper never strips by word lists: the existing word-list stripping in `normaliseReminderText` is not used for new titles. An empty result keeps the typed text (rule 4).
2. Word order. Only a value NLC filled in as a default can be replaced by a later token (2.2). A date, time or repeat the user set by hand, a tapped token and an applied token are never overwritten. Both orders are tested ("tomorrow ... at 3pm" and "at 3pm ... tomorrow", with and without pauses), plus a hand-set time followed by a typed time.
3. Numeric dates. A pattern that is not a valid calendar date (31/4, 29/2/2027, 0/3, 3/13) or fails the boundary rules is not a token, so it never highlights or schedules. Boundary tests: phone numbers (07700 900123, 0161 496 0000, +44 20 7946 0000), fractions and scores ("1/2 price", "3/4 cup", "won 3-2"), dotted and colon times ("3.30", "3.30pm", "at 3:30"), versions ("v2.1.3"), "24/7", dates inside longer digit runs ("12/12/12/12").
4. Siri. The helper keeps Siri's current results except the agreed changes, and every existing Siri test keeps its expected title unless listed here. Agreed changes: repeat words removed (D1); capitalisation; refinement 2 ("Monday meeting notes" stays whole, today "meeting notes"); words not applied are kept ("Parents evening at 6pm" becomes "Parents evening", today "Parents", because the old normalisation strips "evening" by word list). The 12pm default follows D7: a date with no time gets 12:00 even when that is already past today; a time with no date still moves to tomorrow once past; the 15-minute refusal and Siri-off error are unchanged.
5. Regression. Validation includes edit-mode re-parsing (older text with newly recognised forms does not auto-apply), notification title and body consistency (body equals the saved title, app and Siri), recurrence (next occurrence keeps the task-only title and its rule), and the stale siri-core.js check.

## 6. Implementation stages

Each stage ends with its tests and the full vitest suite and Self Check passing before the next starts. Stages 1 and 2 are committed on this branch and can be tried in the app on their own.

1. Date formats and repeat words (2.4, 2.5 repeat words). Parser only: numeric dates, ISO, two-digit years, "of", "Sept", weekday with a date, daily/weekly/monthly/yearly/hourly. Validation: unit tests for every form and every boundary case in condition 3; Self Check parsing suite extended; simulator spot check of numeric dates in the editor.
2. Word order (2.2). Auto-apply replaces NLC defaults only. Validation: condition 2 cases in unit tests and the Self Check interaction suite; simulator re-run of checklist group E typed with pauses.
3. Titles and Siri (2.1, 2.3). Shared title helper used by the editor save and Siri; Siri 12pm default; siri-core.js rebuilt. Validation: the 20 sample titles and refinement cases, conditions 1 and 4 (existing Siri tests unchanged except the listed changes), notification body, edit mode and recurrence (condition 5); stale bundle test.
4. Verification and docs. Full regression: vitest, Self Check (Node run), type-check, production build; simulator re-run of checklist groups A, B, E, G, H, J plus new rows for numeric dates and titles, recorded in the checklist doc; existing reminders keep their titles; docs (scheduling-and-nlc.md, ios.md, development history). Then deploy to simulator and iPhone for John's device tests (spoken Siri with numeric and date-only phrases, a 12pm Siri notification), and request Kai's merge approval.

## 7. Testing and verification

- Unit (vitest): every form in 2.4, including the boundary cases and false-positive phrases; the 20 sample titles plus refinement cases; empty-title fallback; capitalisation; word order in both typing orders; Siri 12pm default; edit-mode baseline for older text.
- Self Check: extend the NLC parsing and interaction suites; Node run with the localStorage shim.
- Regression: full vitest suite and Self Check, type-check, production build, siri-core.js rebuilt and its test passing; notification body matches the saved title; repeating reminders keep their title and rule on completion.
- Simulator: re-run the affected checklist groups (A, B, E, G, H, J) and new rows for numeric dates and titles, recorded in the NLC testing checklist doc. Check that existing reminders keep their titles.
- Device (John): spoken Siri phrases for numeric and date-only commands; a 12pm notification for a Siri date-only reminder.

## 8. Out of scope

Deleting a word leaving Time on; times already past saved as overdue in the app; US date order; "next week", "this weekend"; short weekday names on their own ("Tues"); bare day numbers ("the 3rd"); times off the quarter hour in the app; rewriting existing reminders.
