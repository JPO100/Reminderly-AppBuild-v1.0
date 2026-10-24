# List item ticks and deletes saved immediately - plan

Status: plan approved by Kai (2026-10-24); implemented on fix/list-tick-persist, awaiting final Type C review. Not merged.

Type C under Working Agreement v1.3: it changes existing logic in a protected area (local storage persistence of lists). Branch `fix/list-tick-persist` from main 62958f1.

## 0. Decision record

- 2026-10-24, John: ticked list items sometimes come back unticked when a list is reopened later. Seen in "Reminderly todos" on his iPhone ("Finalise and sign off NLC"). Save ticks and deletes immediately.

## 1. Problem

The open list editor keeps its items in `listItems` (App.tsx). These changes are written to `createdLists`, and so to `reminderly-created-lists`, straight away:

- adding an item (`persistOverlayListDraft({ nextItems })`, App.tsx about 5032 and 5044)
- committing an edit to an item's text (about 5098)

These are only held in `listItems` until the list closes (backdrop, close button or keyboard close, all calling `persistOverlayListDraft({ closeAfterSave: true })`):

- ticking or unticking an item (`onToggle`, about 5091)
- swiping an item away (`onDelete`, same line)

If the app ends while a list is open, every tick and delete since the list was opened is lost. That happens when iOS ends the app in the background, when the user closes it from the app switcher, or when a new build is installed. Known issue 8 (a368cad) saved an open text edit on going inactive, but ticks and deletes were not covered.

## 2. Evidence

- Code: `onToggle` and `onDelete` call only `setListItems`; no effect writes `listItems` to `createdLists` while the list is open (checked: no effect depends on `listItems` for this).
- John's iPhone, local storage copied read-only on 2026-10-24: "Finalise and sign off NLC" is ticked at 14:48, with two other items ticked in the same minute, shortly after Claude installed builds at about 14:42 and 14:46. An install ends the running app, which fits a lost unsaved tick followed by John ticking again.
- The list corruption log (`reminderly-debug-list-corruption-log`) is empty; it only records a list going blank, so it has no record of this.

## 3. Proposed fix

In the list overlay's item rows (App.tsx about 5091), make `onToggle` and `onDelete` compute the next items and call `persistOverlayListDraft({ nextItems })`, the same pattern adding an item already uses. Keep the haptic and the delete-reveal reset as they are. No change to the close path, the template editor (its toggle is already off), storage format or keys.

About 10 lines in App.tsx. No new pattern.

## 4. Native and dependency review

Web layer only. No plugins, notifications, scheduling or native code. Writes to `reminderly-created-lists` move from once per close to once per tick or delete; `persistStringIfChanged` already skips identical writes, and the widget and Siri list sync read the same key, so they see ticks sooner (on the next tick rather than on close).

## 5. Failure modes to check

- Effects keyed on `createdLists` run on each tick: `syncFullyTickedAt` now stamps `fullyTickedAt` when the last item is ticked rather than when the list closes (more accurate). Clear done lists nightly already skips the open list.
- The Lists tab behind the open editor may change the list's colour and position (Todo, Started, Done) while it is open, instead of on close. Check it is not visible or is acceptable.
- A new list being created: ticking or deleting before close may create the list early, as adding an item already does (needs a title and at least one item).
- Siri adding to the same list while it is open: the editor's items would overwrite the Siri item on the next tick, as they already do on close. Check whether Siri's pending items are imported while a list is open; if this is a new exposure, report it rather than widen scope.
- Uncheck all from list settings, undo list completion, and smart reminder sync for the linked list are unchanged.

## 6. Stages

1. Implement the change in App.tsx.
2. Verify on the simulator: open a list, tick two items and delete one, end the app with `xcrun simctl terminate` while the list is open, relaunch and reopen: ticks and the delete are kept. Repeat with untick. Check fully ticked colour, "Clears tonight" and the Lists tab order.
3. Vitest and Self Check (Node run), web build; add a unit test only if the change is factored into a testable helper.
4. Deploy to the simulator and John's iPhone for his check, then completion evidence to Kai.

## 7. Out of scope

- The template editor and the saved lists overlay.
- Any change to how the list overlay closes or to the corruption log.
