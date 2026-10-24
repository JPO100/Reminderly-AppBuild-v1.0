# Scheduling and natural language capture

Dates, times, repeats, the date and time pickers, the calendar view, natural language capture (NLC) and text normalisation. Date handling, time handling and repeating reminders are protected areas (see `Claude.md`).

## Schedule model

```ts
type ReminderSchedule =
  | { kind: "scheduled"; date: string; time?: string }  // "2026-03-11", "14:30"
  | { kind: "sometime" };
```

- Dates are `yyyy-mm-dd` local calendar dates; times are `HH:mm` 24-hour. No time zone is stored.
- Sometime reminders have no date or time and show "No date / time set".
- Display formats: editor Date row via `formatSelectedDate` ("Today", "Tomorrow", otherwise a short date); date labels in saved text via `formatDateLabel` ("on Friday" within 6 days, "on 27 Feb" later this year, "on 27 Feb, 2027" in another year); times via `formatTime12h` ("2:30pm", "5pm").
- Weeks run Monday to Sunday.
- `utils/schedule.ts` provides `dateUtils`, `scheduleEquality` (date, time, repeat rule; `byDay` order-insensitive) and `detectScheduleDeltas`. Used for edit-mode comparisons and duplicate detection.

### Date and time rules in the editor

Enforced by the manual toggle handlers in `NewReminderOverlay.tsx`:

1. Turning date on sets the date (today if none) and, if time is off, turns time on at 12:00. A new reminder with a date therefore gets a time by default.
2. Turning time on with date off turns date on (today) as well.
3. Turning date off also turns time off and clears both values.
4. Turning time off clears the time only, leaving a date-only reminder.
5. Date and time changes never affect the repeat setting.

NLC applies values through `applyToggleStateSilently`, which does not open drawers. In auto mode, NLC date tokens also set 12:00 when time is off, and NLC time tokens with date off turn date on (today) only when the text has no date token. Those NLC defaults can be replaced by a token typed later (see Auto mode). Click mode differs (see Click mode).

## Pickers

### Date picker

Inline month calendar in the New reminder overlay, opened from the Date row.

- Month title in the Reminders header (Lato Bold 20, `#1C2C42`); Monday-first 7-column grid.
- Tap a day to select it; the selected day is filled `#0088FE` with a white number. Past days are grey (`#D9D9D9`) and cannot be selected.
- Returns a `Date`; stored as `yyyy-mm-dd`.

### Time picker

`src/imports/TimePicker.tsx`, opened from the Time row.

- Two wheel columns: hours 0-23 and minutes.
- Minutes in 15-minute steps (00, 15, 30, 45), or every minute when 1 minute increments are active (`reminderly-ff-one-minute-increments` available and `reminderly-pref-one-minute-increments` on). The current minute snaps to the nearest valid value.
- Default 12:00.

Drawers open and close only on user action, never because NLC applied a value.

## Repeats

### Configuring a repeat

`src/app/components/RepeatsOverlay.tsx`, opened from the Repeats row. Title "Reminder repeats"; the back button closes and returns the configuration (there is no Done button).

| Mode | Configuration | Summary |
|------|---------------|---------|
| Custom days | Monday to Sunday rows ("Every Monday"...), any combination | Listed days |
| Hourly | Interval, minimum 1 | "Repeats every hour" / "every N hours" |
| Daily | Interval, minimum 1 | "Repeats every day" / "every N days" |
| Weekly | Interval, minimum 1 | "Repeats every week" / "every N weeks" |
| Monthly | Interval, minimum 1 | "Repeats every month" / "every N months" |

- Tapping the active mode clears it. Opening a mode resets its interval to 1. Sections expand with a `max-height` animation.
- Returns `null` when no mode is active, or Custom days has no days selected.
- Yearly repeats exist in the data model and can come from NLC ("every year"), but the overlay has no Yearly mode.
- `repeatConfigToRule` turns Custom days into `{ frequency: 'weekly', interval: 1, byDay }`.

Repeat reminders flag off (`reminderly-ff-repeat-reminders`): no rule can be created or changed, NLC does not recognise repeats, Siri never creates a rule, and an edited reminder keeps its existing rule (`keepRepeatRuleWhenOff`).

### Next occurrence

Completing a repeating reminder inserts the next occurrence 1000ms after completion is committed (see [reminders.md](./reminders.md)). `getNextOccurrence(baseDateTime, rule)` in `App.tsx` works from the completed occurrence's scheduled date and time, never from now:

| Frequency | Next occurrence |
|-----------|----------------|
| Hourly | + interval hours (time updated) |
| Daily | + interval days |
| Weekly, no `byDay` | + 7 x interval days |
| Weekly, `byDay` | Walk forward day by day (up to 365) to the next allowed weekday whose week distance is divisible by the interval |
| Monthly | Same day + interval months; clamped to the last day of a shorter month |
| Yearly | Same date + interval years; 29 February clamps to 28 February |

The new reminder keeps the original text and rule. A date-only reminder stays date-only. The next occurrence is not inserted if the original was deleted in the meantime.

Second tap cancellation: tapping the circle again during the in-flight completion cancels it (`cancelPendingRepeatCompletion`, tracked in `pendingRepeatCompletionIdsRef`), clearing the completion and reschedule timers, the pending state and `completedAt` if already set.

Uncompleting a repeating reminder removes the spawned next occurrence when exactly one confident match exists.

### Repeat labels

`formatRepeatLabel` and `formatRepeatRuleText` (`reminder-utils.ts`) produce text such as "Every hour", "Every 3 hours", "Every day", "Every 2 days", "Every week", "Mon, Wed, Fri", "Every month", "Every 3 months", "Every year". Row subtitles combine the next occurrence label with the repeat text.

## Calendar view

A month calendar on the Reminders tab, between the filter row and the list. `src/app/components/RemindersCalendar.tsx`, helpers in `reminder-utils.ts`.

Availability: Reminders module on and Dev tools > Reminders > Calendar (`reminderly-ff-calendar`, default off). It also needs a screen at least 852pt tall (iPhone 15 Pro); below that the calendar and its header button are hidden and the saved view is kept. Hidden in the done/deleted view. Switching: a 45px header button on the Reminders tab, between the filter pills and the settings button (calendar icon in list view, list icon in calendar view), following the List templates page pattern. In calendar view the month title (Lato Bold 20, #1C2C42) replaces the filter pills; there are no month arrows, and a horizontal swipe changes month. The last view is remembered across launches (`reminderly-pref-calendar`, default list view). Switching to the calendar resets it to the current month, today selected and no filter; the list view's filter is restored when switching back.

### Layout

Filter row, month header, weekday row, date grid, 1px `#E4E4E4` divider, list heading, list, New reminder button. The calendar and heading stay fixed; only the list scrolls. The grid is Monday-first and uses 4, 5 or 6 rows as the month needs.

- Month title Lato Bold 20 (header); weekday names Lato Bold 13; dates Lato Bold 16 `#1C2C42`; past days `#D9D9D9`.
- Today: filled 30px `#00AFEE` circle, white number, always.

### Dots

- One 4px dot per active scheduled reminder, up to 4 per day, in sort order, coloured by category (overdue `#FF0000`, today `#00AFEE`, this week `#E466FD`, later `#FDB146`).
- Overdue reminders keep their dot on their original date. Repeating reminders show the current occurrence only. Sometime reminders have no dot. Smart reminders are included. Dev tools Hide overdue also hides overdue dots.

### Selection and filters

- Default: no filter, today selected. The heading shows the date (for example "Tuesday 6th January"); the list shows today's and overdue reminders.
- Tapping today or a future day selects it (filled circle in that day's range colour) and clears any filter. Past days cannot be selected.
- Changing month clears the selection; the heading and list stay on today until a day in that month is chosen. Returning to the current month selects today.
- With a filter active: the selection clears, days outside the filter's range and their dots turn `#D9D9D9`, the heading shows the filter name in its colour, and the list shows the filter's results. Tapping a greyed future day clears the filter and selects it.
- Settings menu on: Later is the combined Later and Sometime filter. Sometime reminders appear in the list but have no dots. With the separate Sometime pill, all days are greyed.
- An empty selected day shows "No reminders... take it easy!" (Lato Bold 17, `#BABABA`).
- Navigation: a horizontal swipe on the calendar (not the list), with a slide between months, unlimited in both directions.
- Midnight rollover moves today, greying and the default selection on the next time refresh tick.

### New reminder from the calendar

If a day other than today is selected, New reminder opens with that date and 12:00 filled in (`getCalendarPrefill`). Otherwise behaviour is unchanged.

Out of scope as built: a Lists calendar, viewing past or completed reminders, projected future repeats, week view, drag to reschedule.

## Natural language capture (NLC)

Extracts dates, times and repeats from the reminder text as the user types. Deterministic and regex-based; no AI.

### Availability

- Active when the Reminders module is on, Dev tools > Natural Language > Enable (`reminderly-ff-nlc`, default off) and Reminders settings > Natural Language Capture (`reminderly-pref-nlc`) are on. When inactive, the text is not parsed at all.
- Per-category recognition preferences: Recognise dates, times and repeats (`reminderly-pref-nlc-date`, `-time`, `-repeats`, default on). Repeats are only recognised while repeat reminders are active.
- Mode: Set dates as you type (`reminderly-pref-nlc-auto-parsing`, default on) gives auto mode; off gives click mode.
- Settings: Reminders settings > Natural Language Capture lists the on/off, a key line, then Recognise dates, Recognise times, Recognise repeats (only while repeat reminders are available) and Set dates as you type. While NLC is off the options stay listed, inactive and not tappable, keeping their saved choices.
- Not available in smart reminder mode.
- Siri parses with all categories recognised, whatever the NLC flag and settings; a repeat is only saved while repeat reminders are active. See [../ios.md](../ios.md).
- The Reminders tutorial page Natural Language Capture shows whenever NLC is available, using the user's recognition settings when NLC is on (see [onboarding.md](./onboarding.md)).

### Recognition

Recognised spans (tokens) are drawn in Reminderly blue `#4784F8`. Recognition is passive: highlighting changes nothing until a token is applied.

### Click mode

Tapping a token turns on its toggle and sets its value without opening a drawer. If a category has several tokens, applying one hides the others.

Each token is tapped separately (`applyDefaultsTime`, `timeSetsToday`): a date or a plain repeat ("every Monday") sets no time, so Time stays off and the save tick stays inactive until a time is tapped, typed or set by hand (a new reminder with a date needs a time, `canSubmitReminder`). A repeat with an implied time ("every morning", 7am) and a relative time ("in an hour") still set both, as one token. Tapping a time with Date off sets today, even when a date token is in the text but not tapped. Untapped tokens stay in the title; with nothing tapped the reminder saves with no date. Auto mode, Siri and the manual Date switch keep the 12pm default.

### Auto mode

Tokens are applied 200ms after parsing when the category has exactly one token and its toggle is off. Several tokens in a category are ambiguous and nothing is applied. A repeats token auto-applies only when both repeats and date are off.

Word order: a row NLC filled in as a default counts as off, so a token typed later can still set it (`togglesForAutoApply`, `nlcDefaultsRef` in the overlay). The defaults are Time 12pm after a date or repeat token, a repeat's implied time ("every morning" 7am), and Date today after a time token. "Call mum tomorrow", pause, "at 3pm" gives tomorrow at 3pm; "at 3pm", pause, "tomorrow" gives tomorrow too; "every morning", pause, "at 6am" gives 6am. A date or time set by the user (the switches, the pickers, a date preset) or from a token is never replaced; switching Time on by hand starts it at 12pm, and that 12pm is the user's.

Edit mode:

1. The first auto-apply pass after opening is suppressed (`suppressAutoApplyRef`), so saved values are not overwritten.
2. The original text is parsed once to form a baseline keyed by `category:lowercased text`.
3. A token not in the baseline makes its category eligible even if its toggle is on. Unchanged tokens never re-apply.
4. The one-token rule and 200ms debounce still apply.

Typing "at 3pm" in an edit therefore updates the time even if it was 2pm, without re-applying an unchanged "tomorrow". An unchanged relative time ("in an hour") is not recalculated either.

### Invalidation

On every re-parse, `computeInvalidation()` checks each applied token:

1. Same text at the same position: valid.
2. Same text once at a different position: its range is updated silently.
3. Text gone, or present at several positions: invalidated - the toggle turns off and the value is cleared.

Invalidation never closes drawers. Invalidating a repeats token also clears the date it implied, and an implied time (from "every morning" and similar), unless an independent date or time token is still applied. Re-typing the token restores them.

If no tokens remain applied, the reminder saves as Sometime unless dates were set by hand.

### Supported terms

Date tokens:

| Input | Meaning |
|-------|---------|
| `today`, `tomorrow` | That date |
| `Monday` ... `Sunday` | Next occurrence, including today |
| `next Monday` ... | That weekday at least 7 days ahead |
| `the day after tomorrow`, `day after tomorrow` | Today + 2 (wins over `tomorrow`) |
| `in 3 days`, `in three days`, `in a day` | Today + N, date only (N 1-99 in digits, one to twelve in words, or "a") |
| `February 28th`, `Feb 28`, `28 Feb`, `28th February`, `the 3rd of March`, `Sept 3` | Next occurrence of that date (this year, or next if passed) |
| `Feb 28 2027`, `28th February 2027`, `3 Mar 27`, `3rd March '27`, `Mar 3rd 27` | That exact date; two-digit years are 2000 + YY |
| `3/3/27`, `03/03/2027`, `3-3-27`, `3.3.27`, `2027-03-03` | Numeric, day first; dots need a year |
| `on 3/3`, `by 30/11` | Numeric with no year, slash only, after on, by, before, until, from, due or for; next occurrence |
| `Wednesday 4 November`, `Wed, 4 Nov`, `Wed 4/11/26` | One token; the date decides the day, the weekday is not checked |

Case-insensitive; full or short month names; "on Friday" tokenises the weekday only.

- A month-name year joins the token only when the date is real in that year. A two-digit year must not be in the past and, after a month-first date, needs an ordinal or apostrophe, so "Mar 3 27" is "Mar 3" and "3 Mar 20 people" is "3 Mar".
- Numeric dates must start the text or follow a space or "(", and end before a space, punctuation or the end. Phone numbers, "1/2 price", "3/4 cup", "won 3-2", "open 24/7", versions ("v2.1.3"), runs such as "12/12/12/12", and times such as "3.30pm" are not dates. Invalid calendar dates (31/4, 29/2/2027, 3/13) are not tokens.
- Not recognised: US month-first order, a comma before the year ("Feb 23, 2027"), and short weekday names on their own ("Tues").

Time tokens:

| Input | Meaning |
|-------|---------|
| `7pm`, `7:30pm`, `7 pm` | 12-hour (hour 1-12) |
| `19:00`, `07:30` | 24-hour (hour 0-23) |
| `four pm`, `twelve am` | Number words one to twelve with am/pm, as 12-hour |
| `4 o'clock`, `four o'clock` (also `oclock`, `o clock`) | On the hour (hour 1-12, digits or words) |
| `half past four`, `quarter past 4`, `quarter to five` | :30, :15, and :45 of the hour before |
| `in 10 minutes`, `in 30 mins`, `in an hour`, `in two hours`, `in 2 hrs` | Now + N (N 1-99 in digits, one to twelve in words, or "a"/"an"), rounded to a quarter hour; sets date and time |
| `morning` / `lunchtime`, `noon` / `afternoon` / `evening` / `night` | 07:00 / 12:00 / 15:00 / 18:00 / 21:00 |
| `this morning`, `this afternoon`, `this evening`, `tonight` | Same times, and date today |

- Minutes must be 00, 15, 30 or 45 (`7:10pm` is not recognised), regardless of the 1 minute increments setting. Siri refuses such times instead (see [../ios.md](../ios.md)).
- Spoken clock times take an optional am/pm. Without one: if the text has a date token (in Siri, an applied date or repeat), 7 to 11 are am and 12 to 6 are pm; otherwise the next occurrence of that clock time after now ("4 o'clock" at 10am is 4pm; at 5pm it is 4am). In the app and in Siri a time with no date is today, even once it has passed; the reminder then shows as overdue.
- Relative times round to the nearest quarter hour, a midpoint rounding up; a result at or before now moves to the next quarter. At 10:07: 10 minutes gives 10:15, 20 or 30 minutes 10:30, 1 hour 11:00. They set their own date, which can be tomorrow.
- Bare hours ("at 4") are not recognised.
- Any other time token (clock, spoken or relative) suppresses all time-of-day words.
- "this night" is not recognised.
- A time with no date token sets the date to today when date is off; the compound forms always set today when there is no date token.

Repeats tokens:

| Input | Result | Implied time |
|-------|--------|--------------|
| `every day/week/month/year/hour`, `daily`, `weekly`, `monthly`, `yearly`, `hourly` | Interval 1 | - |
| `every N days/weeks/months/hours` (digits) | Interval N | - |
| `every Monday` ... | Custom days | - |
| `every morning/afternoon/evening/night` | Daily | 07:00 / 15:00 / 18:00 / 21:00 |
| `weekdays` | Custom days Mon-Fri | - |
| `Mon, Wed, Fri` (2 or more short names) | Custom days | - |

- Short names: Mon, Tue, Wed, Thu, Thur, Fri, Sat, Sun. Singular and plural units both work.
- `every N years`, number words in `every N ...`, `everyday`, `every weekday` and `every other` are not recognised.
- A repeats token suppresses all date tokens (not time tokens).
- Applying a repeat turns on repeats and date, with an anchor date: the next matching day, or today for interval repeats. Without an implied time it also turns time on at 12:00 if time is off.

### How it works

- `parseTokens(text, recognition)` (`nlc-parser.ts`) returns tokens with category, start, end and text. Repeats are matched first; overlaps resolve greedily left to right, longer matches winning, so "Wednesday" inside "every Wednesday" is not a date.
- `computeEligibleTokens()` hides other tokens in a category once one is applied.
- `applyToken(token)` is the single path for click and auto: records the token, parses its value, sets toggles silently and sets values.
- The auto-apply effect reads toggle state from refs to avoid stale closures, and pre-computes the repeats anchor date so a time token in the same pass cannot overwrite it.
- At save, `handleSubmit` saves a scheduled reminder when date and time are both on with values, otherwise Sometime. `computeScheduleKind` (date toggle and value only) is covered by Self Check but not used by the editor.
- The input uses three layers: a transparent textarea, a mirror behind it colouring tokens (`pointer-events: none`), and a hit layer above it where only tokens are tappable. One `renderLayerContent(mode)` function draws both layers, and scroll is synchronised.
- All parsing and interaction logic is pure (`nlc-parser.ts`, `nlc-interaction.ts`); the overlay holds the React state.

### Non-goals

No fuzzy matching, spelling correction or synonyms; no relative phrases beyond those listed above ("next week", "this weekend"); NLC never changes the text in the input or opens pickers; no explicit undo.

Siri uses the same parser and value resolution, applied as in auto mode with all toggles off. See [../ios.md](../ios.md).

## Titles and rendering

With NLC active the saved title (`displayText`) is the task only; `originalText` keeps the full typed text, and the editor shows it again on edit (docs/plans/nlc-titles-and-dates.md).

### Save time: `titleFromAppliedTokens()` (`utils/normalise-text.ts`)

Shared by the editor and Siri.

- Removes only the tokens NLC applied (date, time and repeat), each with a directly preceding "at", "on" or "in". It never strips by word lists, so words that were not applied stay ("Parents evening at 6pm" is "Parents evening").
- A token is removed only when it ends the text, follows at/on/in, or sits next to another removed token (spaces, a comma or a connector between). "Monday meeting notes" and "Buy flowers for Sunday lunch" keep the day. A token directly after "every" is never removed, so with repeats not recognised "Gym every Monday at 7am" is "Gym every Monday" (Monday at 7am, no repeat).
- After a removal the first letter is capitalised. If nothing would be left, the typed text is kept ("Tomorrow at 9pm").
- Editor: the applied tokens, plus, when editing, the tokens the reminder was saved with while their row is still on, so the date does not come back on the next save. A date set by hand leaves the text alone. With NLC off, `displayText` is the typed text.
- Siri: the auto-applied tokens; repeat words are removed only when a repeat rule is saved.

Examples: "Call mum on Monday at 9pm" is "Call mum"; "Gym every Monday at 7am" is "Gym"; "Dentist 3/3/27 at 3pm" is "Dentist"; "Take the cake out of the oven in 20 minutes" is "Take the cake out of the oven"; "Meet Sam 19:00" is "Meet Sam".

Reminders saved before this change keep their titles. `normaliseReminderText()` (the earlier word-list normalisation with "on Friday" labels) is kept but no longer called by the app.

### Render time: `getDisplayTitle()` (`utils/render-text.ts`)

- The row title strips one trailing suffix from older titles: " on D Mon at <time>", " on D Mon" or " at <time>". Task-only titles pass through unchanged.
- The reminder info overlay strips a trailing " at <time>" only. Notifications use `displayText` as is.
- `renderReminderText` (swaps a stored date for "today" or "tomorrow") is imported by `App.tsx` but not called.

## Files

- `src/app/utils/schedule.ts`, `repeat-conversion.ts`, `nlc-parser.ts`, `nlc-interaction.ts`, `normalise-text.ts`, `render-text.ts`, `date-display.ts`, `tutorial-nlc-demo.ts`, `siri.ts` (Siri parsing)
- Tests: `src/app/__tests__/nlc-spoken-times.test.ts`, `nlc-dates.test.ts`, `nlc-word-order.test.ts`, `nlc-titles.test.ts`, `tutorial-nlc-demo.test.ts`; Self Check `src/app/dev/nlc-parser-checks.ts`, `nlc-interaction-checks.ts`
- `src/app/reminder-utils.ts` - labels and calendar helpers
- `src/imports/NewReminderOverlay.tsx`, `src/imports/TimePicker.tsx`
- `src/app/components/RepeatsOverlay.tsx`, `src/app/components/RemindersCalendar.tsx`
- `src/app/App.tsx` - `getNextOccurrence`, completion and reschedule, calendar state
