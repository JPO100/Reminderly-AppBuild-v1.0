# Reminderly animation system audit

Complete implementation reference for Noterly UI parity.

Reference file: `src/app/App.tsx`
Supporting files:
- `src/imports/NewReminderOverlay.tsx`
- `src/app/components/lists/EditableListItem.tsx`
- `src/app/components/TutorialOnboardingContent.tsx`
- `src/app/components/TutorialPhoneHeader.tsx`
- `src/app/components/OnboardingPage3Content.tsx`
- `src/app/components/OnboardingPage7Content.tsx`
- `src/app/components/OnboardingPage8Content.tsx`
- `src/app/components/OnboardingPage9Content.tsx`
- `src/app/components/OnboardingPage2Content.tsx`
- `src/app/components/TutorialStaticReminderList.tsx`

## Section 1 - Animation architecture

### Libraries

One animation library: `motion/react` (Framer Motion v11+, imported as `motion/react` not `framer-motion`).

```typescript
import { motion, AnimatePresence, useDragControls } from "motion/react";
```

No CSS animations. No @keyframes. No CSS animation property. No third-party transition libraries.

### Architecture

All animations are implemented inline using Framer Motion's declarative API:

- `motion.div` for animated elements
- `AnimatePresence` for mount/unmount animations
- `useDragControls` for drag-to-dismiss on bottom sheets
- `layout` prop for automatic position/size animation during reorder
- CSS `transition` property for non-motion micro-interactions (colour changes, opacity fades)

### Design principles

1. Opacity-only for row enter/exit (no scale, no translateY on rows)
2. Layout animation for reorder (Framer Motion handles position interpolation)
3. Slide-up/down for overlays (y: "100%" to y: 0)
4. Delayed data commits create visual feedback windows (pending state shown for COMPLETION_DELAY before data changes)
5. Spring physics only for list item reorder inside the lists overlay and swipe-to-delete
6. All other animations use timed durations with easeInOut

### Reusable patterns

Pattern A - Row animation (reminders, lists, done/deleted):
```
layout, exit={{ opacity: 0 }}, transition={{ layout: { duration: 0.25 } }}
```

Pattern B - Row animation with reinsertion:
```
layout
initial={isReinserted ? { opacity: 0 } : false}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={isReinserted ? { opacity: { duration: 0.2 } } : { layout: { duration: 0.25 } }}
onAnimationComplete → clear reinsertedId
```

Pattern C - Bottom sheet overlay (three layers):
```
Layer 1 (backdrop):  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
Layer 2 (slide):     initial={{ y: "100%" }} animate={{ y: 0, top: sheetTop }} exit={{ y: "100%" }} transition={{ duration: 0.25, ease: "easeInOut" }}
Layer 3 (drag):      drag="y" dragListener={false} dragConstraints={{ top: 0, bottom: viewportHeight }} dragElastic={0} dragMomentum={false}
```

Pattern D - Tutorial attention throb:
```
initial={{ opacity: 0 }}
animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
transition={{ duration: 2.3, delay: 0.4, times: [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1], ease: "easeInOut" }}
```

## Section 2 - Row animation system

### 2.1 Active reminder row (insert, delete, complete, reinsert, reorder)

Location: App.tsx:4622-4747

AnimatePresence: `key={`${viewMode}-${activeFilter}`}` (re-keys on filter/view change to reset animations)

motion.div per row:
- `key={reminder.id}`
- `layout` (bare prop, animates position changes)
- `initial={isReinserted ? { opacity: 0 } : false}`
- `animate={{ opacity: 1 }}`
- `exit={{ opacity: 0 }}`
- `transition={isReinserted ? { opacity: { duration: 0.2 } } : { layout: { duration: 0.25 } }}`
- `onAnimationComplete`: clears `reinsertedId` state

Trigger: new reminder insert
- Flow: overlay closes → NEW_REMINDER_INSERT_DELAY (500ms) → reminder added to state → `reinsertedId` set → row fades in over 0.2s → INSERT_HIGHLIGHT_MS (1000ms) highlight timer starts → highlight clears
- Location: App.tsx:1829-1841

Trigger: reminder complete (checkbox click)
- Flow: `pendingDoneIds.add(id)` → row shows filled circle + line-through + #BABABA text (immediate visual) → COMPLETION_DELAY (350ms) → `completedAt` set → `pendingDoneIds.remove(id)` → row exits (opacity fade to 0, default framer-motion exit duration)
- Location: App.tsx:2698-2841

Trigger: reminder delete
- Flow: `pendingDeleteIds.add(id)` → row shows filled grey circle + line-through + #939393 text → COMPLETION_DELAY (350ms) → `deletedAt` set → `pendingDeleteIds.remove(id)` → row exits (opacity fade to 0)
- Location: App.tsx:3058-3118

Trigger: repeat reminder rescheduled (after complete)
- Flow: original completed → RESCHEDULE_DELAY (1000ms) → new reminder spawned → `reinsertedId` set → row fades in over 0.2s → INSERT_HIGHLIGHT_MS (1000ms) highlight
- Location: App.tsx:2750-2813

Trigger: reminder uncomplete (from done/deleted view)
- Flow: `completedAt` cleared → reminder reappears in active list → `reinsertedId` set → row fades in over 0.2s → INSERT_HIGHLIGHT_MS (1000ms) highlight
- Location: App.tsx:2845-2930

Trigger: reminder undelete (from done/deleted view)
- Flow: `deletedAt` cleared → reminder reappears → `reinsertedId` set → row fades in over 0.2s → INSERT_HIGHLIGHT_MS (1000ms) highlight
- Location: App.tsx:2845-2930 (shares uncomplete path)

Trigger: row reorder (sort changes, filter changes)
- Flow: `layout` prop handles position interpolation automatically → duration 0.25s
- No explicit trigger; Framer Motion detects DOM position changes

### 2.2 Active list row (insert, delete, complete, reinsert, reorder, pin)

Location: App.tsx:4026-4147

AnimatePresence: `key={`lists-${activeListFilter}`}`

motion.div per row:
- `key={list.id}`
- `layout` (bare)
- `initial={isReinserted ? { opacity: 0 } : false}`
- `animate={{ opacity: 1 }}`
- `exit={{ opacity: 0 }}`
- `transition={isReinserted ? { opacity: { duration: 0.2 } } : { layout: { duration: 0.25 } }}`
- `onAnimationComplete`: clears `listReinsertedId`

Trigger: list complete
- Flow: `pendingDoneListIds.add(id)` → visual feedback → COMPLETION_DELAY (350ms) → status set to 'done' → row exits
- Location: App.tsx:2468-2517

Trigger: list delete
- Flow: `pendingDeletedListIds.add(id)` → visual feedback → COMPLETION_DELAY (350ms) → status set to 'deleted' → row exits
- Location: App.tsx:2575-2659

Trigger: list undo (from done view)
- Flow: status restored to 'active' → `listReinsertedId` set → `listInsertHighlightId` set → row fades in → INSERT_HIGHLIGHT_MS (1000ms) highlight
- Location: App.tsx:2519-2573

Trigger: list pin/unpin
- Flow: `pinnedAt` toggled → `layout` animation moves row to new position → duration 0.25s
- No separate pin animation; the `layout` prop handles the position shift when pinned lists sort to the top
- Location: App.tsx:2278-2285

### 2.3 Done/deleted reminder rows

Location: App.tsx:4489-4599

AnimatePresence: `key={`${viewMode}-${activeFilter}-${doneDeletedFilter}`}`

motion.div per row:
- `key={item.id}`
- `layout` (bare)
- No `initial`, no `animate`
- `exit={{ opacity: 0 }}`
- `transition={{ layout: { duration: 0.25 } }}`

These rows only animate on exit (when uncompleted/undeleted and removed from done/deleted view).

### 2.4 Done/deleted list rows (archived)

Location: App.tsx:3846-3913

AnimatePresence: `key={`${viewMode}-${activeMainTab}-${doneDeletedFilter}`}`

motion.div per row:
- `key={`${entry.kind}-${list.id}`}`
- `layout` (bare)
- No `initial`, no `animate`
- `exit={{ opacity: 0 }}`
- `transition={{ layout: { duration: 0.25 } }}`

### 2.5 Saved list template rows

Location: App.tsx:4234-4280

AnimatePresence: `initial={false}` (no animation on first render)

motion.div per row:
- `key={list.id}`
- `layout` (bare)
- No `initial`, no `animate`
- `exit={{ opacity: 0 }}`
- `transition={{ layout: { duration: 0.25 } }}`

### 2.6 List items inside lists overlay (editable items)

Location: App.tsx:5065-5119

AnimatePresence: `initial={false}`

motion.div per item:
- `key={item.id}`
- `layout="position"` (only animates position, not size)
- `initial={isItemReinserted ? { opacity: 0 } : false}`
- `animate={{ opacity: 1 }}`
- `exit={{ opacity: 0 }}`
- `transition={isItemReinserted ? { opacity: { duration: 0.2 }, layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } } : { layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }}`
- `onAnimationComplete`: clears `listItemReinsertedId`

This is the only location using spring-based layout transitions for rows.

## Section 3 - Layout animation system

### layout prop usage

| location | value | context |
|---|---|---|
| App.tsx:4636 | `layout` (bare/true) | active reminder rows |
| App.tsx:4073 | `layout` (bare/true) | active list rows |
| App.tsx:3855 | `layout` (bare/true) | done/deleted list rows |
| App.tsx:4491 | `layout` (bare/true) | done/deleted reminder rows |
| App.tsx:4239 | `layout` (bare/true) | saved list template rows |
| App.tsx:5070 | `layout="position"` | list items in lists overlay |

`layout` (bare) = animate both position and size changes.
`layout="position"` = animate only position, not size.

### layoutId usage

None. No `layoutId` prop anywhere in the codebase.

### AnimatePresence configuration

| location | key | mode | initial |
|---|---|---|---|
| App.tsx:3846 | `${viewMode}-${activeMainTab}-${doneDeletedFilter}` | default | default |
| App.tsx:4026 | `lists-${activeListFilter}` | default | default |
| App.tsx:4234 | none | default | `false` |
| App.tsx:4489 | `${viewMode}-${activeFilter}-${doneDeletedFilter}` | default | default |
| App.tsx:4622 | `${viewMode}-${activeFilter}` | default | default |
| App.tsx:4854 | none | default | default |
| App.tsx:4920 | none | default | default |
| App.tsx:5065 | none | default | `false` |
| App.tsx:5482 | none | default | default |
| App.tsx:5539 | none | default | default |
| App.tsx:5592 | none | default | default |
| App.tsx:5682 | none | default | default |
| App.tsx:5772 | none | default | default |
| App.tsx:5819 | none | default | default |

Row-level AnimatePresence blocks use `key` to force remount on filter/view changes (instant swap, no cross-animation). Overlay AnimatePresence blocks have no key (single instance toggled by conditional render).

`initial={false}` on saved list template rows and list items means no animation on first mount.

### Reordering behaviour

Reordering is handled entirely by the `layout` prop. When the data array order changes (due to sorting, filtering, pin/unpin), Framer Motion detects the DOM position change and interpolates. Duration: 0.25s for timed layout, spring (stiffness 220, damping 26, mass 0.9) for list items.

## Section 4 - Overlay animation system

### Bottom sheet pattern (8 overlays)

All bottom sheets use the same three-layer architecture:

Layer 1 - Backdrop:
```
className="fixed inset-0 bg-black/0 z-40"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.25 }}
onClick → close handler
```

Note: backdrop is `bg-black/0` (transparent black) - the backdrop fades in but is visually transparent. It exists as a click target, not a visual dimming layer.

Layer 2 - Slide panel:
```
className="fixed left-0 right-0 z-50 mx-auto w-full"
style={{ bottom: 0 }}
initial={{ y: "100%" }}
animate={{ y: 0, top: getBottomSheetTopPosition() }}
exit={{ y: "100%" }}
transition={{ duration: 0.25, ease: "easeInOut" }}
```

`getBottomSheetTopPosition()`: returns `tabsBarRef.getBoundingClientRect().top - 2` (aligns sheet top with the tab bar, 2px above).

Layer 3 - Draggable content:
```
drag="y"
dragControls={sheetDragControls}
dragListener={false}
dragConstraints={{ top: 0, bottom: viewportHeight }}
dragElastic={0}
dragMomentum={false}
onDragEnd={(_, info) => {
  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
  closeHandler();
}
```

Drag handle: `absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y` with `onPointerDown → dragControls.start(event)`.

### Overlay inventory

| overlay | backdrop bg | inner className | drag | special |
|---|---|---|---|---|
| New reminder | bg-black/0 | bg-white rounded-tl-[15px] rounded-tr-[15px] size-full | yes | onAnimationComplete sets focus ready |
| Lists (create/edit) | bg-black/0 | bg-white rounded-tl-[15px] rounded-tr-[15px] size-full | yes | initial includes top position |
| Repeats | bg-black/0 | relative (no bg/radius) | yes | |
| Reminders settings | bg-black/0 | bg-white rounded-tl-[15px] rounded-tr-[15px] size-full | yes | |
| Lists settings | bg-black/0 | bg-white rounded-tl-[15px] rounded-tr-[15px] size-full | yes | |
| Settings | bg-black/0 | relative (no bg/radius) | yes | |
| Tutorial | bg-black/0 | relative size-full | yes | |
| Dev tools | (no bg-black/0) | (no drag layer) | no | devToolsTopRef cached |

### Drag close threshold

```typescript
const shouldCloseBottomSheetFromDrag = (offsetY: number, velocityY: number) => {
  return offsetY > 120 || velocityY > 600;
};
```

Close if dragged down > 120px OR velocity > 600px/s.

### Overlay delete sequence

```typescript
const runOverlayDeleteSequence = (closeOverlay, closePanel, deleteAction) => {
  closeOverlay();
  setTimeout(() => { closePanel(); setTimeout(() => { deleteAction(); }, 50); }, 50);
};
```

50ms gap between each step (overlay close → panel close → data delete).

### Settings close sequence

```typescript
setTimeout(() => setIsSettingsOpen(false), 250);
```

250ms delay before closing settings (allows UI response before slide-out).

### New reminder overlay

NewReminderOverlay internal animations (src/imports/NewReminderOverlay.tsx):

1. Toggle switch circle: `transition: 'cx 0.2s ease'` (SVG circle position)
2. Date picker expand/collapse: `initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}`
3. Time picker expand/collapse: same as date picker
4. Textarea height: `animate={{ height: getTextareaHeight() }} transition={{ duration: 0.3, ease: "easeInOut" }}`
5. Repeats section disabled opacity: `transition-opacity duration-200` (Tailwind class)

## Section 5 - Gesture interactions

### Swipe to delete (list items)

Location: `src/app/components/lists/EditableListItem.tsx`

Implementation: manual pointer event tracking (not Framer Motion drag).

- `onPointerDownCapture`: records start position
- `onPointerMoveCapture`: tracks horizontal delta, activates swipe if |deltaX| > 8 and |deltaX| > |deltaY|
- `onPointerUpCapture`: commits reveal if threshold met
- Threshold: `SWIPE_REVEAL_THRESHOLD = 28px` (reveal delete button)
- Reveal offset: `DELETE_REVEAL_OFFSET = 64px`

motion.div animate:
```
animate={{ x: isSwipeDragging ? dragOffsetX : (isDeleteRevealed ? -DELETE_REVEAL_OFFSET : 0) }}
transition={isSwipeDragging ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
```

During drag: instant (duration: 0). On release: spring snap (stiffness 320, damping 28, mass 0.8).

### Bottom sheet drag to dismiss

Location: App.tsx (all overlays except dev tools)

Implementation: Framer Motion `useDragControls` + `drag="y"`.

- `dragListener={false}` (drag only via handle)
- `dragConstraints={{ top: 0, bottom: viewportHeight }}` (can't drag up past origin, can drag down to full viewport)
- `dragElastic={0}` (no rubber-band)
- `dragMomentum={false}` (no momentum after release)
- Close threshold: `offsetY > 120 || velocityY > 600`

Drag handle: 24px tall, absolute positioned at top of sheet, `touch-pan-y` for CSS touch handling.

### Tap interactions

No Framer Motion tap animations. All taps are standard onClick/onPointerDown handlers.

### Long press interactions

None.

## Section 6 - Timing inventory

### Named constants (App.tsx)

| constant | value | purpose |
|---|---|---|
| COMPLETION_DELAY | 350ms | visual feedback window before data commit (done/delete) |
| RESCHEDULE_DELAY | 1000ms | delay after completedAt before spawning repeat |
| EMPTY_STATE_DELAY | 350ms | delay before showing empty-state placeholder |
| NEW_REMINDER_INSERT_DELAY | 500ms | delay before inserting new reminder row (lets overlay slide-down finish) |
| INSERT_HIGHLIGHT_MS | 1000ms | duration of coloured highlight on just-inserted row |

### Framer Motion durations

| element | duration | ease | context |
|---|---|---|---|
| row layout reorder | 0.25s | (default framer) | all rows except list items |
| row reinsert fade-in | 0.2s | (default framer) | reinserted rows opacity |
| row exit fade-out | (default framer) | (default framer) | all row exits |
| backdrop fade | 0.25s | (default framer) | all overlay backdrops |
| sheet slide | 0.25s | easeInOut | all overlay panels |
| date/time picker expand | 0.3s | easeInOut | NewReminderOverlay |
| textarea height | 0.3s | easeInOut | NewReminderOverlay |

### Spring configurations

| element | stiffness | damping | mass | context |
|---|---|---|---|---|
| list item layout (overlay) | 220 | 26 | 0.9 | list items inside lists overlay |
| swipe-to-delete snap | 320 | 28 | 0.8 | EditableListItem swipe release |

### CSS transitions

| element | property | duration | ease | location |
|---|---|---|---|---|
| text colour (reminder row) | color | 300ms | (default) | App.tsx:4673 |
| text colour (list item) | color | 300ms | (default) | EditableListItem.tsx:335,340 |
| clear-all button | colors | (Tailwind default) | (Tailwind default) | App.tsx:3595,3775,4388 |
| add-to-list button | colors | (Tailwind default) | (Tailwind default) | App.tsx:4191,4834 |
| saved list use button bg | background-color | 150ms | ease | App.tsx:5270,5371 |
| saved list use button text | opacity | 150ms/250ms | ease | App.tsx:5296,5397 |
| toggle switch circle | cx | 0.2s | ease | NewReminderOverlay.tsx:374 |
| repeats section disabled | opacity | 200ms | (Tailwind default) | NewReminderOverlay.tsx:498 |
| list item uncheck tick | opacity | 150ms | ease | EditableListItem.tsx:284 |

### Tutorial attention throb

| param | value |
|---|---|
| TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE | 35px |
| TUTORIAL_ATTENTION_THROB_DURATION | 2.3s |
| TUTORIAL_ATTENTION_THROB_DELAY | 0.4s |
| TUTORIAL_ATTENTION_THROB_TIMES | [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1] |
| TUTORIAL_ATTENTION_SEQUENCE_DELAY | 2750ms |
| TUTORIAL_ATTENTION_RECYCLE_DELAY | 2000ms |
| opacity keyframes | [0, 1, 0, 0, 1, 0, 0, 1, 0] |
| ease | easeInOut |

### Animation state variables

| variable | type | purpose |
|---|---|---|
| reinsertedId | string/null | tracks just-reinserted reminder for fade-in |
| insertHighlightId | string/null | tracks highlighted reminder (coloured text/circle) |
| pendingDoneIds | Set<string> | reminders in visual "done" state before data commit |
| pendingDeleteIds | Set<string> | reminders in visual "delete" state before data commit |
| listReinsertedId | string/null | tracks just-reinserted list for fade-in |
| listInsertHighlightId | string/null | tracks highlighted list |
| listItemReinsertedId | string/null | tracks just-reinserted list item for fade-in |
| pendingDoneListIds | Set<string> | lists in visual "done" state |
| pendingDeletedListIds | Set<string> | lists in visual "delete" state |
| isReminderOverlayFocusReady | boolean | set true when reminder overlay open animation completes |

## Section 7 - Noterly implementation handoff

---

BEGIN NOTERLY CLAUDE PROMPT

You are implementing the animation system for Noterly. This system must exactly replicate the Reminderly animation system. The following is the complete, audited specification. Do not deviate from it.

PROHIBITIONS:
- Do not approximate any timing, easing, or transition value
- Do not redesign the animation architecture
- Do not substitute alternative animation systems (no CSS animations, no react-spring, no GSAP, no custom hooks)
- Do not "improve" any animation (no added polish, no extra easing, no bounce effects)
- Do not change any duration, delay, spring constant, or threshold value
- Do not add animations that do not exist in this specification
- Do not remove animations that exist in this specification

REQUIRED LIBRARY: `motion/react` (Framer Motion). Import as:
```typescript
import { motion, AnimatePresence, useDragControls } from "motion/react";
```

ANIMATION CONSTANTS (define these exactly):
```typescript
const COMPLETION_DELAY = 350;
const RESCHEDULE_DELAY = 1000;
const EMPTY_STATE_DELAY = 350;
const NEW_REMINDER_INSERT_DELAY = 500;
const INSERT_HIGHLIGHT_MS = 1000;
```

ROW ANIMATIONS (notes/reminders/folders/lists):

Every list of rows must be wrapped in AnimatePresence. The AnimatePresence must be keyed on the current view/filter state so it remounts when filters change.

Standard row (no reinsertion tracking):
```tsx
<motion.div
  key={item.id}
  layout
  exit={{ opacity: 0 }}
  transition={{ layout: { duration: 0.25 } }}
>
```

Row with reinsertion tracking (active items that can be restored/inserted):
```tsx
<motion.div
  key={item.id}
  layout
  initial={isReinserted ? { opacity: 0 } : false}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={isReinserted
    ? { opacity: { duration: 0.2 } }
    : { layout: { duration: 0.25 } }
  }
  onAnimationComplete={() => {
    if (isReinserted) clearReinsertedId();
  }}
>
```

List items inside an overlay (spring-based layout):
```tsx
<AnimatePresence initial={false}>
  <motion.div
    key={item.id}
    layout="position"
    initial={isReinserted ? { opacity: 0 } : false}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={isReinserted
      ? { opacity: { duration: 0.2 }, layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }
      : { layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }
    }
  >
```

COMPLETION/DELETION FLOW:
1. User taps checkbox/delete → add id to pendingDoneIds/pendingDeleteIds (immediate visual change)
2. Row shows filled circle, line-through text, greyed colour
3. After COMPLETION_DELAY (350ms) → set completedAt/deletedAt in data → remove from pending set → row exits via AnimatePresence (opacity fade)
4. For repeat items: after RESCHEDULE_DELAY (1000ms) → spawn new item → set reinsertedId → new row fades in

REINSERTION FLOW:
1. New item added to data array
2. Set reinsertedId to new item id
3. Set insertHighlightId to new item id
4. Row appears with opacity 0 → animates to opacity 1 over 0.2s
5. After INSERT_HIGHLIGHT_MS (1000ms) → clear insertHighlightId
6. On animation complete → clear reinsertedId

NEW ITEM INSERT FLOW:
1. Overlay closes
2. After NEW_REMINDER_INSERT_DELAY (500ms) → item added to data → reinsertedId set → row fades in

BOTTOM SHEET OVERLAY (exact pattern for every overlay):

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={handleClose}
      />
      {/* Slide panel */}
      <motion.div
        className="fixed left-0 right-0 z-50 mx-auto w-full"
        style={{ bottom: 0 }}
        initial={{ y: "100%" }}
        animate={{ y: 0, top: sheetTopPosition }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Draggable content */}
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: viewportHeight }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) handleClose();
          }}
          className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
        >
          {/* Drag handle */}
          <div
            className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
            onPointerDown={(e) => dragControls.start(e)}
          />
          {/* Content */}
        </motion.div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

Drag close threshold: offsetY > 120px OR velocityY > 600px/s.
Drag handle: 24px tall touch target at top of sheet.
Backdrop: bg-black/0 (transparent, acts as click target only).
Sheet top position: aligned to tab bar top minus 2px.

SWIPE TO DELETE (list items only):

Manual pointer tracking, not Framer Motion drag:
- Activate swipe when |deltaX| > 8px and |deltaX| > |deltaY|
- Reveal threshold: 28px horizontal
- Reveal offset: 64px (delete button width)
- During drag: instant position update (duration: 0)
- On release: spring snap: stiffness 320, damping 28, mass 0.8

```tsx
<motion.div
  animate={{ x: isDragging ? dragOffsetX : (isRevealed ? -64 : 0) }}
  transition={isDragging ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
>
```

CSS TRANSITIONS (apply to relevant elements):
- Row text colour changes: `transition: 'color 300ms'`
- Button background changes: `transition: 'background-color 150ms ease'`
- Button text opacity: `transition: 'opacity 150ms ease'` (or 250ms for certain stages)
- Toggle switch: `transition: 'cx 0.2s ease'` on SVG circle
- Section disable: Tailwind `transition-opacity duration-200`
- Checkbox uncheck tick fade: `transition: 'opacity 150ms ease'`

EXPAND/COLLAPSE SECTIONS (date picker, time picker):
```tsx
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
```

TEXTAREA HEIGHT ANIMATION:
```tsx
<motion.div
  animate={{ height: computedHeight }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
```

TUTORIAL ATTENTION THROB (if implementing tutorial):
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
  transition={{
    duration: 2.3,
    delay: 0.4,
    times: [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1],
    ease: "easeInOut",
  }}
>
```

OVERLAY DELETE SEQUENCE:
```typescript
closeOverlay();
setTimeout(() => {
  closePanel();
  setTimeout(() => {
    deleteAction();
  }, 50);
}, 50);
```

WHAT DOES NOT EXIST (do not add):
- No scale animations on any element
- No rotation animations
- No blur animations
- No colour interpolation via Framer Motion (colour changes use CSS transition)
- No stagger animations
- No path animations
- No SVG morphing
- No parallax
- No scroll-linked animations
- No hover animations
- No active/pressed state animations on rows
- No layoutId shared layout animations
- No AnimatePresence mode="wait" on row lists (only on tutorial/onboarding page transitions)
- No spring physics on row-level animations (only on list items inside overlay and swipe-to-delete)

END NOTERLY CLAUDE PROMPT

---
