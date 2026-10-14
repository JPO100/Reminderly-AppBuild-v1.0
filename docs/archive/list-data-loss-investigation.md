# Investigation: intermittent list data loss

## What happened

On two separate occasions, opening an existing pinned list caused the panel to open and then close automatically without user interaction. Afterward, the list displayed with no title and 0 of 0 items. The original title and items were permanently lost.

Common details across both occurrences:
- The list was pinned (first/top pinned list)
- The list was called "Reminderly todos"
- It contained 2 items, 0 completed
- Both times it was likely the first list opened after launching the app
- Both failures resulted in the same visible state: untitled and 0 of 0

The broken list from the most recent occurrence is still present in the Lists tab.

---

## 1. What the persisted broken list should look like

Storage key: `reminderly-created-lists` in localStorage.

To inspect via Safari Web Inspector:
1. Open the app in Simulator (or connect device with USB)
2. Safari > Develop > [device] > Reminderly
3. Console tab, run:

```js
JSON.parse(localStorage.getItem('reminderly-created-lists')).find(l => l.title === '' || l.items.length === 0)
```

The broken list should have this shape:

```json
{
  "id": "<original UUID - preserved>",
  "title": "",
  "items": [],
  "sortMode": "insertion",
  "pinnedAt": "<original timestamp - preserved>",
  "smartReminders": false,
  "smartReminderDueDate": null,
  "smartReminderTime": null,
  "status": "active",
  "statusChangedAt": null
}
```

A healthy populated list would look like:

```json
{
  "id": "<UUID>",
  "title": "Reminderly todos",
  "items": [
    { "id": "<UUID>", "text": "...", "completed": false, "completedAt": null },
    { "id": "<UUID>", "text": "...", "completed": false, "completedAt": null }
  ],
  "sortMode": "insertion",
  "pinnedAt": 1724900000000,
  "smartReminders": false,
  "smartReminderDueDate": null,
  "smartReminderTime": null,
  "status": "active",
  "statusChangedAt": null
}
```

## 2. How the broken object differs from a healthy list

The broken object is NOT a new/blank list. It retains:
- the original `id`
- the original `pinnedAt` timestamp
- the original `status`/`statusChangedAt`

But `title`, `items`, `sortMode`, and smart reminder fields are overwritten with the exact default values that `openListEditor` sets as temporary placeholders during its initial phase. This is a distinctive corruption fingerprint.

## 3. Whether the data is genuinely lost

Yes. The data is genuinely overwritten in `createdLists` state, which triggers the persistence `useEffect` at App.tsx line 1622-1628. That effect writes `JSON.stringify(createdLists)` to localStorage via `persistStringIfChanged`. Once written, the original title and items are gone from all storage.

This is not a display/read problem. The data has been permanently overwritten.

---

## 4. The exact code paths capable of producing this

Two functions open the list editor. One is safe. One is not.

### Safe path - `openListOverlayForListId` (App.tsx line 699-717)

Sets all real data synchronously, then opens the overlay. No race window. Used by smart reminder linked-list flows.

### Vulnerable path - `openListEditor` (App.tsx line 2209-2237)

This is the function called when tapping a list card (lines 4165, 4179).

```
Phase 1 (synchronous):
  setListTitle("")          <- blank
  setListItems([])          <- blank
  setEditingListId(list.id) <- points to the real list
  setIsListsOverlayOpen(true)

Phase 2 (setTimeout(0)):
  setListTitle(list.title)  <- real data
  setListItems(list.items)  <- real data
```

Between phase 1 and phase 2, there is a race window. The overlay is open in edit mode with `editingListId` pointing to the real list, but the editing state (`listTitle`, `listItems`) is blank.

If `persistOverlayListDraft` (line 5031-5067) is called during this window, it writes blank data over the real list:

```javascript
const title = (nextTitle ?? listTitle).trim();   // "" during race window
const items = (nextItems ?? listItems).map(...); // [] during race window
setCreatedLists(prev => prev.map(l =>
  l.id === targetId ? { ...l, title, items, sortMode: listSortMode, ... } : l
));
```

`persistOverlayListDraft` is invoked by four close triggers:
- Backdrop click (line 5076)
- Drag-to-close (line 5098)
- Close button (line 5114)
- Submit/header enter (line 5113)

---

## 5. Most likely root cause

Root cause: `openListEditor` uses `setTimeout(0)` to defer real data population, creating a race window where blank data can be persisted if anything triggers a close.

The exact close trigger is harder to pin down, but the candidates ranked by likelihood:

### Candidate A - iOS WKWebView touch event timing (highest likelihood)

On iOS, a tap generates a sequence: `touchstart` > `touchend` > mouse events > `click`. The list card `onClick` fires and calls `openListEditor`. React renders after the handler returns, adding the backdrop (full-screen fixed element at z-40 with `onClick` handler). If a stray mouse event or secondary click fires at the same coordinates after React renders, it would hit the backdrop, calling `persistOverlayListDraft({ closeAfterSave: true })` with blank data.

This is a known class of issue with overlays that appear at the same coordinates as the tap target in WKWebView. The viewport meta tag (`width=device-width, initial-scale=1.0`) disables the 300ms delay but does not eliminate all synthetic event edge cases.

### Candidate B - Notification tap handler (lower likelihood)

`useNotificationTapHandler` (src/app/useNotificationTapHandler.ts) re-runs whenever `reminders` changes (via its `onMarkAsDone`/`handleCompleteClick` dependency). On each re-run, it calls `openTappedReminder()` which checks localStorage for a pending notification. If a pending notification exists, it calls `setIsListsOverlayOpen(false)` and `setActiveMainTab("reminders")`.

This would close the overlay but would NOT call `persistOverlayListDraft`, so by itself it should not persist blank data. However, if the tab change (to "reminders") causes the overlay's AnimatePresence condition (`activeMainTab === 'lists'`) to become false, there may be some edge in exit animation or cleanup.

### Candidate C - Accidental gesture (lowest likelihood)

The drag-to-close threshold is `offsetY > 120 || velocityY > 600`, triggered only via the 24px handle area at the top of the panel. Unlikely from a simple tap on the list card, and unlikely to happen twice identically.

---

## 6. Other plausible causes, ranked

1. `openListEditor` setTimeout(0) race - the root vulnerability (confirmed by code analysis)
2. iOS touch event pass-through to backdrop - most likely close trigger
3. Notification handler interference during app resume - possible but would not call persistOverlayListDraft
4. React StrictMode double effect invocation - only in dev builds, would not cause overlay close
5. Pinned list sorting/identity mismatch - ruled out; each card captures the correct `list` reference via closure

---

## 7. Whether "first list after launch" and "top pinned list" are technically relevant

### First list after launch

Potentially relevant. On app start, effects run (notification handler, smart reminder sync, badge update). The `useNotificationTapHandler` effect fires `openTappedReminder()` on mount. If there were a stale notification ID in localStorage (which should not happen, but would if the app crashed between localStorage write and consumption), it could interfere. More importantly, the app's initial render cycle might create subtle timing conditions where the `setTimeout(0)` race is more likely to trigger.

### Top pinned list

Not technically relevant to the failure mechanism. Pinned list sorting (line 4097-4099, sorted by `pinnedAt` descending) uses a straightforward sort. Each list card captures its own `list` object via closure in the `onClick` handler. There is no index-based lookup that could cause a mismatch. The "top pinned" position is coincidental rather than causal.

---

## 8. Reproduction attempt

Not a guaranteed reproduction, but the following should maximise the chance:

1. Create a pinned list with items
2. Kill the app completely
3. Relaunch the app
4. Immediately tap the pinned list (as fast as possible after the UI appears)
5. If the UI is still settling (effects running, first render completing), the `setTimeout(0)` race window might be slightly wider

The intermittency suggests a timing dependency. Factors that could affect timing: device CPU load, app state size (more reminders/lists = slower render), whether the app is a fresh launch vs resumed from background.

To confirm the mechanism with certainty, add a temporary `console.log` inside `persistOverlayListDraft` when `title.length === 0 && editingListId !== null`. This would fire if and only if the race condition triggers.

---

## 9. Recommended fix (not yet implemented)

### Primary fix

Eliminate the `setTimeout(0)` in `openListEditor` by setting the real data synchronously, matching the pattern already used in `openListOverlayForListId`.

Specifically, in `openListEditor` (line 2209-2237): remove the two-phase initialization and set `list.title`, `list.items`, and all other fields directly in the synchronous phase, before opening the overlay. The `setTimeout(0)` appears to exist for animation smoothness (panel slides up while empty, then fills). The same visual effect can be achieved with a CSS transition on the content area, or simply accepted as a minor animation trade-off in exchange for data safety.

### Belt-and-suspenders guard

Add a guard in `persistOverlayListDraft`: if `listOverlayMode === 'edit'` and `editingListId !== null` and `title === ''` and `items.length === 0`, skip the write. An existing populated list should never be intentionally saved as completely blank.

---

## Key files referenced

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/App.tsx` | 2209-2237 | `openListEditor` - vulnerable two-phase open |
| `src/app/App.tsx` | 699-717 | `openListOverlayForListId` - safe synchronous open |
| `src/app/App.tsx` | 5031-5067 | `persistOverlayListDraft` - save/close handler |
| `src/app/App.tsx` | 5076 | Backdrop click triggers persist+close |
| `src/app/App.tsx` | 1622-1628 | `useEffect` persists `createdLists` to localStorage |
| `src/app/App.tsx` | 4165, 4179 | List card click handlers calling `openListEditor` |
| `src/app/useNotificationTapHandler.ts` | 1-98 | Notification tap handler that can close overlays |
| `src/app/utils/list-utils.ts` | 1-161 | `CreatedList` type definition and utilities |
| `src/imports/Header.tsx` | 1-161 | ListsHeader component (close button, input) |
