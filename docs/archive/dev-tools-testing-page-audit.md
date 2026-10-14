# Dev tools testing page audit

Source file: `src/app/components/DevToolsOverlay.tsx`, lines 578-738.
Component: `TestingPage`

---

## Page structure

The testing page is wrapped in the shared `PageShell` component.

PageShell: `flex flex-col gap-[30px] items-start pt-[30px] px-[20px] pb-[60px] relative w-full flex-1 min-h-0` with `style={{ overflowY: 'auto' }}`.

PageShell renders `BackHeader` at the top then the page children below it with the 30px column gap.

The page title passed to BackHeader is "Testing".

The page content inside PageShell consists of two direct children:

1. A shrink-0 div containing the action buttons.
2. A conditional results area that only renders when a report exists.

---

## Button layout

Container: `flex flex-col gap-[12px] shrink-0`

Inner row: `flex gap-[12px]`

Three buttons sit in a single horizontal row with 12px gap between them. The row wraps if the viewport is narrow (no explicit nowrap). Buttons are not full-width - they size to their content.

---

## Button styling

All three buttons share the same shape: `px-[20px] py-[10px] rounded-[8px]`
Font: `font-['Lato',sans-serif] font-bold text-[14px]`
Text colour: `text-white`
Disabled state: `disabled:opacity-50 disabled:cursor-not-allowed`

Note: button corners use `rounded-[8px]` (rectangular with small radius), not the pill `rounded-[100px]` used elsewhere in dev tools. This is the only place in dev tools that uses this button style.

Run self-checks button:
- Background: `bg-[#4784f8]`
- Label: "Run self-checks" (idle) or "Running..." (when `isRunning` is true)
- Disabled when: `isRunning` is true
- Always enabled otherwise

Copy results button:
- Background: `bg-[#4784f8]`
- Label: "Copy results" (idle) or "Copied!" (for 2 seconds after copy succeeds)
- Disabled when: `report` is null (no results yet)

Reset button:
- Background: `bg-[#6b7280]` (grey, distinct from the blue buttons)
- Label: "Reset"
- Disabled when: `report` is null

---

## Idle / empty state

When no run has been performed (`report` is null):

- Only the button row is visible.
- "Copy results" and "Reset" are disabled (opacity 50%).
- No results area, no summary, no status text.
- The page shows the header and three buttons only.

---

## Running state

When `isRunning` is true:

- "Run self-checks" button label changes to "Running..."
- "Run self-checks" button is disabled.
- "Copy results" and "Reset" remain disabled (report is still null during the run).
- No loading indicator, no spinner. The label change is the only feedback.

---

## Run self-checks behaviour

`handleRunChecks` is called on click. Guards against double-invocation with `if (isRunning) return`.

Sequence:
1. Sets `isRunning` to true.
2. Sets `report` to null (clears any previous results).
3. Sets `copyStatus` to 'idle'.
4. Calls `runChecks()` with a callback that returns the full check array.
5. On completion, sets `report` to the result.
6. Sets `isRunning` to false.
7. Errors are caught and logged to console. The running state is still cleared via `finally`.

Check suites included (in order):
- Schedule and reminder logic (prefixed `[Schedule and reminder logic]`)
- Persistence and hydration (prefixed `[Persistence and hydration]`)
- Natural language parsing (prefixed `[Natural language parsing]`)
- Natural language interaction (prefixed `[Natural language interaction]`)
- Done, deleted, and completion (two suites both prefixed `[Done, deleted, and completion]`)
- Lists and smart reminders (prefixed `[Lists and smart reminders]`)
- Dev tools and feature flags (prefixed `[Dev tools and feature flags]`)
- Notification and badge (prefixed `[Notification and badge]`)

---

## Results summary layout

Rendered when `report` is not null. Container: `flex flex-col gap-[8px] flex-1 min-h-0`

Summary line: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42] shrink-0`

Content of the summary line (inline spans, all `font-bold`):
"Run invocation id: {report.runId} | Passed: {report.passCount} | Failed: {report.failCount} | Duration: {report.durationMs}ms"

The pipe separators ` | ` are plain text nodes between the bold spans.

---

## Results list layout

Container below the summary line: `flex flex-col gap-[4px] flex-1 overflow-y-auto min-h-0`

This container scrolls independently. It grows to fill remaining space (`flex-1`) and clips with `overflow-y-auto`. The outer `PageShell` also scrolls but the results list has its own internal scroll context.

---

## Grouped results layout

The check suite names are used as section headers. Section brackets are extracted by stripping the `[Section name]` prefix from each check name.

`groupResultsBySection` is called on the report results. If `grouped.hasAnySections` is true, the grouped view renders.

Section wrapper: `flex flex-col gap-[4px]`

Section header (only rendered when `section.sectionName !== ''`):
`font-['Lato',sans-serif] text-[14px] text-[#1C2C42] font-bold mt-[8px] mb-[4px]`
Text content: the section name string (e.g. "Schedule and reminder logic")

Individual result items are rendered inside each section group.

If `grouped.hasAnySections` is false (no prefixes found), results are rendered as a flat list without section headers.

---

## Individual result item styling

Each result is a `div` with: `flex flex-col gap-[4px] p-[8px] rounded-[4px]`

Background colour:
- Passed: `bg-[#e8f5e9]` (light green)
- Failed: `bg-[#ffebee]` (light red)

Inner row: `flex items-center gap-[8px]`

Pass/fail icon: `font-['Lato',sans-serif] text-[16px]`
- Passed: ✓ (unicode checkmark)
- Failed: ✗ (unicode cross)

Result name: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42]`
The section prefix is stripped from the name before display: `.replace(/^\[.+?\] /, '')`

Error message (only rendered when `result.error` exists):
`font-['Lato',sans-serif] text-[12px] text-[#c62828] ml-[24px]`
The 24px left margin aligns the error text below the result name (to the right of the icon).

---

## Copy results behaviour

Uses a hidden `textarea` element: `absolute opacity-0 pointer-events-none` positioned at `top: -9999, left: -9999`, `aria-hidden="true"`. The textarea value is `formatReportAsText(report)` (a pre-formatted plain-text string).

On click: `textAreaRef.current.select()` then `document.execCommand('copy')`.

On success: `setCopyStatus('copied')`. The button label changes to "Copied!" for 2 seconds, then `setCopyStatus('idle')` restores the original label.

Errors are caught and logged to console.

---

## Reset behaviour

`handleReset` sets `report` to null and `copyStatus` to 'idle'.

This clears the results area entirely. The page returns to the idle state showing only the buttons.

---

## Typography summary

All interactive buttons: `font-['Lato',sans-serif] font-bold text-[14px]` white text
Summary line: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42]` with inline bold spans
Section headers: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42] font-bold`
Result names: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42]`
Error text: `font-['Lato',sans-serif] text-[12px] text-[#c62828]`
Pass/fail icons: `font-['Lato',sans-serif] text-[16px]` (slightly larger than result names)

Note: the Testing page uses `font-['Lato',sans-serif]` (regular weight) throughout, not `font-['Lato:Bold',sans-serif]`. This is the only page in dev tools that uses the non-bold Lato variant as its base font. Bold is applied via `font-bold` class where needed.

---

## Colour summary

Run and copy buttons: `#4784f8`
Reset button: `#6b7280`
Passed result background: `#e8f5e9`
Failed result background: `#ffebee`
Error text: `#c62828`
Summary and section header text: `#1C2C42`
Result name text: `#1C2C42`
Button text: white

---

## Spacing summary

PageShell column gap (between header, button row, results area): 30px
Button row gap: 12px
Button padding: 20px horizontal, 10px vertical
Results column gap: 8px
Individual result padding: 8px
Result inner gap (icon to name): 8px
Result gap between items: 4px
Section header margin-top: 8px, margin-bottom: 4px
Error indent: 24px left margin
Button border-radius: 8px
Result border-radius: 4px
