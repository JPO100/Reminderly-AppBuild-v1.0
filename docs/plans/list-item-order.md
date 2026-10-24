# List item order and Hide ticked items - plan

Status: implementation authorised by Kai (2026-10-24) with John's D1-D3 below; implemented on feature/list-item-order, awaiting final Type C review. Not merged.

Type C under Working Agreement v1.3: it replaces an existing setting (Sort items A to Z) and changes list editor behaviour. Branch `feature/list-item-order` from main fef1a96.

## 0. Decision record

- 2026-10-24, John: Lists settings feel light. Two settings accepted:
  - Item order (Option B): replace "Sort items A to Z" with three linked options, exactly one on: Newest first (default), Oldest first, A to Z.
  - Hide ticked items.

## 1. Current behaviour (code)

- `getDisplayListItems` (src/app/utils/list-utils.ts): A to Z sorts unticked items, then ticked items, alphabetically. Otherwise items keep their stored order, with ticked items at the bottom, most recently ticked first.
- New items are prepended to the stored items (App.tsx, `AddListItemInput` onAdd), so stored order is newest first. No other path inserts single items: Siri imports reminders only; templates and duplicates copy whole item arrays.
- With A to Z on, a new or edited item is pinned at its position for 1500ms with the insert highlight, then moves to its sorted place (`alphabeticalPinnedListItemId`).
- The add-item input sits above the items.
- Setting: `reminderly-pref-list-sort-az` (boolean, default false). Templates always edit A to Z (`resolveListSortMode`).

## 2. Item order

Storage:
- Keep `reminderly-pref-list-sort-az` and add `reminderly-pref-list-oldest-first` (boolean, default false), using the existing `useStoredSetting` booleans.
  - A to Z = sort-az on.
  - Oldest first = sort-az off and oldest-first on.
  - Newest first = both off.
- Existing A to Z users keep A to Z with no migration. Everyone else stays on Newest first, today's behaviour.
- Item data and stored order are unchanged. Oldest first is display only: unticked items shown in reverse stored order. Ticked items stay at the bottom in every order.

Settings UI:
- Lists settings gets an "Item order" row (MenuRow) opening a sub-page with three linked ToggleRows, as on the Natural Language Capture sub-page.
- Tapping an option turns it on and the others off. Tapping the option already on does nothing, so exactly one is always on.
- Info copy:
  - Newest first: "New items appear at the top of every list."
  - Oldest first: "Items appear in the order you added them, with new items at the bottom."
  - A to Z: "Sorts the items in every list alphabetically."

Adding an item with Oldest first:
- The new item appears at the top with the insert highlight, held there for 1500ms, then moves to the end of the unticked items.
- This reuses the A to Z pin (`alphabeticalPinnedListItemId`, generalised to any non-newest order), so you see what you added, next to where you typed.
- In a long list it then moves out of view, as it already does with A to Z.

Templates: unchanged, always A to Z.

## 3. Hide ticked items

- New setting `reminderly-pref-list-hide-ticked` (boolean, default off), a ToggleRow on the Lists settings page. Info: "Ticked items move out of sight. Tap the ticked row at the bottom of a list to see them."
- When on, the list editor shows unticked items, then a single row "N ticked" at the bottom (decision D2). Tapping it shows or hides the ticked items for that visit. It is closed again when the list next opens.
- Ticking an item while hidden: the item ticks as now, stays in place for 1500ms (time to untick a mistake), then folds into the ticked row and the count updates.
- A list with every item ticked shows just the ticked row.
- Not affected:
  - list progress ("2 of 5")
  - Ticked lists to Done
  - the Done view
  - smart reminders
  - templates, which have no ticks

## 4. Main Lists settings page after the change

Item order >, Hide ticked items, Ticked lists to Done, Siri shortcuts (when available), Sounds and haptics >, Support >.

That is two more rows than today. The 450px card at 375 wide may then scroll; it follows the existing scroll-cut rules (measure every time).

## 5. Tutorial consistency

- The Lists "Re-run this tutorial" page (OnboardingPage6Content) mirrors the live Lists settings rows. It gets the Item order and Hide ticked items rows with the user's state.
- The lists tutorial animations keep today's default behaviour (newest first, ticked items visible). No other tutorial change.

## 6. Implementation

- `list-utils.ts`: `getDisplayListItems` takes an order ('newest' | 'oldest' | 'alphabetical') and a hide-ticked flag; the pin applies to oldest as well as alphabetical; `resolveListSortMode` extended.
- `App.tsx`:
  - the two new stored settings
  - the add-item pin for Oldest first
  - the ticked row, with its 1500ms fold and open state
  - props to settings and tutorial
- `SettingsPanelContent.tsx`: Item order sub-page and Hide ticked items row.
- `OnboardingPage6Content.tsx`: mirrored rows.
- `settings/keys.ts`: two defaults.
- Tests: Vitest for getDisplayListItems in all three orders, with hide on and off and the pin. Self Check: defaults and linked-toggle exclusivity.
- Docs: lists feature doc, settings-flags-spec, development history.

## 7. Native and dependency review

- Web layer only. No plugins, notifications, scheduling or native code.
- Two new localStorage keys; no change to `reminderly-created-lists` or item format.
- The widget and Siri list sync read stored items, not display order, so they are unaffected.

## 8. Risks and checks

- The A to Z pin generalised to Oldest first: check edit-in-place still pins only in A to Z (an edited item does not move in Newest or Oldest).
- Ticking with hide on, then unticking within 1500ms: the item must stay and not fold.
- Deleting (swipe) a ticked item while the ticked row is open; the count updates.
- Fresh install vs existing user with A to Z on (carries over); an existing user with A to Z off (Newest first).
- Settings card height at 375 x 667 and 402 x 874; the sub-page has 3 rows.

## 9. Decisions needed (John)

- D1 Item order location: a sub-page from an "Item order" row (recommended, keeps the main page short), or the three options directly on the Lists settings page.
- D2 Hide ticked items: fold them into a tappable "N ticked" row at the bottom (recommended, ticked items stay reachable), or hide them completely while the setting is on.
- D3 Ticking with hide on: stay 1500ms then fold (recommended), or fold straight away.

## 10. Verification

- Vitest and Self Check (full).
- Simulator:
  - each order, adding items in each
  - switching orders on an existing list
  - hide on and off: tick, untick within 1500ms, open and close the ticked row, a fully ticked list
  - A to Z carry-over with an existing setting
  - settings card and sub-page at 402 x 874 and 375 x 667
  - Re-run page rows
- Deploy to the simulator and John's iPhone; John's on-device check.

## 11. Confirmed decisions (John, relayed by Kai, 2026-10-24)

These supersede sections 2-4 where they differ:

- D1: Newest first, Oldest first and A to Z sit directly on the Lists settings page as linked toggles, exactly one on. No Item order sub-page. Existing A to Z preference preserved.
- D2: Hide ticked items hides ticked items completely. No "N ticked" row. Turning the setting off shows them again. No change to item data, counts or list status.
- D3: a newly ticked item stays visible for 1500ms, can be unticked in that time and then stays; with the setting off, ticked-item behaviour is unchanged.

Lists settings page: Newest first, Oldest first, A to Z, Hide ticked items, Ticked lists to Done, Siri shortcuts (when available), Sounds and haptics >, Support >.

## 12. Implementation notes

- The order mapping (`resolveListItemOrder`, `listItemOrderSettings`) and the tick delay (`createKeptTickedTracker`, injectable timers) are small pure helpers in list-utils.ts so they are tested directly in Vitest and Self Check.
- A list with every item ticked and Hide ticked items on shows only the add-item input and the list header with its progress ("5 of 5"), as decided in D2.

## 13. Change after implementation (John, 2026-10-24)

D1 reversed on the device: with the three order toggles on the main page, a separator (key line) after them did not work visually. John chose the click-through from section 2 instead: an "Item order" row on Lists settings opens a sub-page with Newest first, Oldest first and A to Z. The separator is removed. Main page: Item order >, Hide ticked items, Ticked lists to Done, Siri shortcuts (when available), Sounds and haptics >, Support >. Ordering logic and storage unchanged.
