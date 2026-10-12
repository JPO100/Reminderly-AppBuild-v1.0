# Long list item title marquee scroll audit

Source file: `src/app/components/lists/EditableListItem.tsx`, lines 40-177 (state/refs/logic), lines 296-336 (input rendering and event wiring).

---

## How the marquee works

### State and refs

- `isMarqueeActive` (boolean state) - true while the scroll animation is running
- `hasCompletedMarqueeScroll` (boolean state) - true after scroll completes, stays true until reset
- `marqueeDelayTimeoutRef` (ref, number) - holds the 250ms pre-scroll delay timeout ID
- `marqueeFrameRef` (ref, number) - holds the current requestAnimationFrame ID
- `inputRef` (ref, HTMLInputElement) - the native input element whose scrollLeft is manipulated

### Overflow detection

```js
const overflow = input.scrollWidth - input.clientWidth;
if (overflow <= 1) return;
```

If the text content does not overflow by more than 1px, the marquee does not start. This is checked on the native `<input>` element.

### Scroll distance

The scroll distance equals the overflow value: `input.scrollWidth - input.clientWidth`. The animation scrolls from `scrollLeft = 0` to `scrollLeft = overflow`.

### Scroll duration

```js
const duration = Math.max(1200, overflow * 35);
```

35ms per pixel of overflow, with a minimum of 1200ms. A 200px overflow produces a 7000ms scroll. The animation is linear (constant progress ratio).

### Animation method

requestAnimationFrame loop driving `inputNode.scrollLeft` directly. No CSS transitions, no Framer Motion, no `transform: translateX`. The native input's built-in horizontal scroll is used.

```js
const progress = Math.min(1, elapsed / duration);
inputNode.scrollLeft = overflow * progress;
```

Linear easing (no ease-in/ease-out).

### Start trigger

`startMarqueeIfNeeded()` is called from the input's `onFocus` handler. There is a 250ms delay (`window.setTimeout`) before the animation begins. During this delay the user sees the text at its normal position. Then the scroll starts.

### Cancel trigger

The input's `onPointerDown` handler checks: if `isMarqueeActive` (currently scrolling) OR `hasCompletedMarqueeScroll` (scroll finished but still in scrolled position), it calls `event.preventDefault()` then `resetMarquee()` then `inputRef.current?.focus()`. This stops the animation, resets scrollLeft to 0, and re-focuses the input for editing.

If neither flag is set (text is short, or marquee was never started), the onPointerDown does nothing and the input focuses normally.

### Also resets on

- `onBlur` - resets marquee and commits draft
- `onChange` - any typing resets marquee immediately
- Component unmount - cleans up both the timeout and the rAF

### Cleanup logic

```js
useEffect(() => {
    return () => {
        if (marqueeDelayTimeoutRef.current !== null) {
            window.clearTimeout(marqueeDelayTimeoutRef.current);
        }
        if (marqueeFrameRef.current !== null) {
            window.cancelAnimationFrame(marqueeFrameRef.current);
        }
    };
}, []);
```

### Input classes enabling truncation

```
overflow-hidden text-ellipsis whitespace-nowrap
```

These are on the `<input>` element itself. When scrollLeft is 0 (default), the input shows truncated text with ellipsis. When the rAF loop drives scrollLeft, the text scrolls left and the truncated portion becomes visible.

---

## Key insight

The entire trick relies on the fact that an `<input type="text">` with `overflow: hidden` and `text-overflow: ellipsis` still maintains its internal scrollWidth. Setting scrollLeft programmatically scrolls the text within the input while the visual container stays fixed. No wrapper tricks, no translateX, no cloned elements.

---

## Full function reference

### resetMarquee

Clears both the delay timeout ref and the rAF ref. Resets `inputRef.current.scrollLeft` to 0. Sets `isMarqueeActive` to false and `hasCompletedMarqueeScroll` to false.

### startMarqueeIfNeeded

1. Calls resetMarquee() first (ensures clean state).
2. Reads `input.scrollWidth - input.clientWidth`. If <= 1, returns (no overflow).
3. Sets a 250ms setTimeout.
4. Inside the timeout: calculates `duration = Math.max(1200, overflow * 35)`, records `performance.now()` as startTime, sets `isMarqueeActive` to true.
5. Starts rAF loop. Each frame: calculates linear progress, sets `inputNode.scrollLeft = overflow * progress`.
6. When progress reaches 1: clears the rAF ref, sets `isMarqueeActive` to false, sets `hasCompletedMarqueeScroll` to true.

### Event wiring on the input

- `onFocus`: calls `startMarqueeIfNeeded()`
- `onBlur`: calls `resetMarquee()`, then commits draft, then clears focus state
- `onPointerDown`: if `isMarqueeActive || hasCompletedMarqueeScroll`, calls `event.preventDefault()`, `resetMarquee()`, `inputRef.current?.focus()`. Otherwise does nothing.
- `onChange`: calls `resetMarquee()` then updates draft value

---

## Recommended replication approach

1. Add two refs: a delay timeout ref and a rAF ref.
2. Add two state booleans: isMarqueeActive and hasCompletedMarqueeScroll.
3. Add resetMarquee() that clears both refs, sets scrollLeft = 0, resets both states.
4. Add startMarqueeIfNeeded() that checks `scrollWidth - clientWidth > 1`, then runs a 250ms delayed rAF loop setting `scrollLeft = overflow * progress` with duration `Math.max(1200, overflow * 35)`.
5. Wire onFocus to call startMarqueeIfNeeded().
6. Wire onPointerDown to cancel if marquee is active or completed.
7. Wire onBlur and onChange to call resetMarquee().
8. Add unmount cleanup for both refs.
9. The title input must have `overflow-hidden text-ellipsis whitespace-nowrap` (or equivalent CSS).

### Requirements for the target element

The target element must be a single-line `<input type="text">` (or an element that supports horizontal scrollLeft). The approach will not work on `<textarea>`, `<div contentEditable>`, or `<p>` tags without modification.

### Risks

1. If the target element focuses for editing on tap, the marquee and editing could conflict. Reminderly handles this by using onPointerDown to cancel the marquee and re-focus for editing. The same pattern should work but needs testing to confirm the focus/edit flow is not disrupted.

2. If the target element has custom pointer handlers (e.g. Framer Motion drag), the marquee onPointerDown handler must not interfere with existing interactions.
