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
- Display formats: dates via `formatSelectedDate` / `formatDateLabel` ("Monday 3 March", with the year when it is not this year); times via `formatTime12h` ("2:30 PM").
- Weeks run Monday to Sunday.
- `utils/schedule.ts` provides `dateUtils`, `scheduleEquality` (date, time, repeat rule; `byDay` order-insensitive) and `detectScheduleDeltas`. Used for edit-mode comparisons and duplicate detection.

### Date and time rules in the editor

Enforced by the manual toggle handlers in `NewReminderOverlay.tsx`:

1. Turning date on sets the date (today if none) and, if time is off, turns time on at 12:00. A new reminder with a date therefore gets a time by default.
2. Turning time on with date off turns date on (today) as well.
3. Turning date off also turns time off and clears both values.
4. Turning time off clears the time only, leaving a date-only reminder.
5. Date and time changes never affect the repeat setting.

NLC applies values through `applyToggleStateSilently`, which does not open drawers. NLC date tokens also set 12:00 when time is off.

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
- Mode: Apply as you type (`reminderly-pref-nlc-auto-parsing`, default on) gives auto mode; off gives click mode.
- Not available in smart reminder mode.

### Recognition

Recognised spans (tokens) are drawn in Reminderly blue `#4784F8`. Recognition is passive: highlighting changes nothing until a token is applied.

### Click mode

Tapping a token turns on its toggle and sets its value without opening a drawer. If a category has several tokens, applying one hides the others.

### Auto mode

Tokens are applied 200ms after parsing when the category has exactly one token and its toggle is off. Several tokens in a category are ambiguous and nothing is applied. A repeats token auto-applies only when both repeats and date are off.

Edit mode:

1. The first auto-apply pass after opening is suppressed (`suppressAutoApplyRef`), so saved values are not overwritten.
2. The original text is parsed once to form a baseline keyed by `category:lowercased text`.
3. A token not in the baseline makes its category eligible even if its toggle is on. Unchanged tokens never re-apply.
4. The one-token rule and 200ms debounce still apply.

Typing "at 3pm" in an edit therefore updates the time even if it was 2pm, without re-applying an unchanged "tomorrow".

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
| `February 28th`, `Feb 28`, `28 Feb`, `28th February` | Next occurrence of that date (this year, or next if passed) |
| `Feb 28 2027`, `28th February 2027` | That exact date |

Case-insensitive; full or short month names; "on Friday" tokenises the weekday only.

Time tokens:

| Input | Meaning |
|-------|---------|
| `7pm`, `7:30pm`, `7 pm` | 12-hour (hour 1-12) |
| `19:00`, `07:30` | 24-hour (hour 0-23) |
| `morning` / `lunchtime`, `noon` / `afternoon` / `evening` / `night` | 07:00 / 12:00 / 15:00 / 18:00 / 21:00 |
| `this morning`, `this afternoon`, `this evening`, `tonight` | Same times, and date today |

- Minutes must be 00, 15, 30 or 45 (`7:10pm` is not recognised), regardless of the 1 minute increments setting.
- An explicit clock time suppresses all time-of-day words.
- "this night" is not recognised.
- A time with no date token sets the date to today when date is off; the compound forms always set today when there is no date token.

Repeats tokens:

| Input | Result | Implied time |
|-------|--------|--------------|
| `every day/week/month/year/hour` | Interval 1 | - |
| `every N days/weeks/months/years/hours` | Interval N | - |
| `every Monday` ... | Custom days | - |
| `every morning/afternoon/evening/night` | Daily | 07:00 / 15:00 / 18:00 / 21:00 |
| `weekdays` | Custom days Mon-Fri | - |
| `Mon, Wed, Fri` (2 or more short names) | Custom days | - |

- Short names: Mon, Tue, Wed, Thu, Thur, Fri, Sat, Sun. Singular and plural units both work.
- `everyday` and `every other` are not recognised.
- A repeats token suppresses all date tokens (not time tokens).
- Applying a repeat turns on repeats and date, with an anchor date: the next matching day, or today for interval repeats. Without an implied time it also turns time on at 12:00 if time is off.

### How it works

- `parseTokens(text, recognition)` (`nlc-parser.ts`) returns tokens with category, start, end and text. Repeats are matched first; overlaps resolve greedily left to right, longer matches winning, so "Wednesday" inside "every Wednesday" is not a date.
- `computeEligibleTokens()` hides other tokens in a category once one is applied.
- `applyToken(token)` is the single path for click and auto: records the token, parses its value, sets toggles silently and sets values.
- The auto-apply effect reads toggle state from refs to avoid stale closures, and pre-computes the repeats anchor date so a time token in the same pass cannot overwrite it.
- `computeScheduleKind` decides scheduled or sometime at save from the date toggle and value.
- The input uses three layers: a transparent textarea, a mirror behind it colouring tokens (`pointer-events: none`), and a hit layer above it where only tokens are tappable. One `renderLayerContent(mode)` function draws both layers, and scroll is synchronised.
- All parsing and interaction logic is pure (`nlc-parser.ts`, `nlc-interaction.ts`); the overlay holds the React state.

### Non-goals

No fuzzy matching, spelling correction or synonyms; no numeric dates ("15/03"); no relative phrases beyond today, tomorrow, weekdays and month-name dates ("in 3 days", "next week"); NLC never changes the reminder text or opens pickers; no explicit undo.

Siri uses the same parser in auto mode. See [../ios.md](../ios.md).

## Text normalisation and rendering

Text is processed twice: once at save and again at render.

### Save time: `normaliseReminderText()` (`utils/normalise-text.ts`)

Makes the stored `displayText` stay correct on later days. `originalText` keeps the raw input.

- "today" and "tomorrow" become the absolute date ("Monday 3 March").
- "tonight", "next Monday" and month-name dates are stripped (the schedule carries the date).
- Weekday names stay. If stripping leaves a bare weekday matching the scheduled date, it becomes "Weekday DD Mon" in place rather than adding a duplicate.
- Applied to scheduled reminders when NLC is active; otherwise `displayText` is the typed text. Siri reminders skip date and time injection.

Example: "Buy milk today at 5pm" is stored with `displayText` "Buy milk Monday 3 March at 5pm".

### Render time: `renderReminderText()` and `getDisplayTitle()` (`utils/render-text.ts`)

- `renderReminderText` swaps the stored date back to "today" or "tomorrow" when it matches. Presentation only.
- `getDisplayTitle` strips date and time phrases for the row title: "Monday 3 March at 5pm", "today at 5pm", "at 5pm", month-name dates, and time-of-day words or phrases when a clock time exists (unless preceded by "every"). "Buy milk Monday 3 March at 5pm" becomes "Buy milk".

## Files

- `src/app/utils/schedule.ts`, `repeat-conversion.ts`, `nlc-parser.ts`, `nlc-interaction.ts`, `normalise-text.ts`, `render-text.ts`, `date-display.ts`
- `src/app/reminder-utils.ts` - labels and calendar helpers
- `src/imports/NewReminderOverlay.tsx`, `src/imports/TimePicker.tsx`
- `src/app/components/RepeatsOverlay.tsx`, `src/app/components/RemindersCalendar.tsx`
- `src/app/App.tsx` - `getNextOccurrence`, completion and reschedule, calendar state
