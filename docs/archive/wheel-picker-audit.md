# Wheel picker implementation audit

Investigation of Reminderly's hour/minute wheel picker for reuse in Noterly's Dev Tools retention selectors.

---

## 1. Component / code location

Single file: `src/imports/TimePicker.tsx` (264 lines).

Two exports:
- `WheelColumn` — the reusable wheel (internal function component, not exported).
- `TimePicker` — the default export, which composes two `WheelColumn` instances side by side.

`WheelColumn` is generic. It accepts `values: number[]`, `selectedValue: number`, `onChange`, and an optional `formatValue`. All hour/minute logic lives in the parent `TimePicker` wrapper, not in `WheelColumn`.

Integration: `NewReminderOverlay.tsx` imports `TimePicker` (line 16) and renders it inside an animated drawer via a `SetTime` wrapper (lines 453-496). The drawer uses `motion.div` from the Motion library for expand/collapse.

---

## 2. Implementation approach

Fully custom React implementation. No third-party picker library.

Dependencies used:
- React 18 — `useState`, `useRef`, `useEffect`, `useCallback`
- Tailwind CSS 4 — utility classes
- Standard Web APIs — `PointerEvent`, `WheelEvent`, `setPointerCapture`/`releasePointerCapture`

No CSS `scroll-snap` is used. Scrolling, snapping and momentum are all handled manually via pointer event tracking and pixel arithmetic.

DOM structure of one wheel:

```
div.relative.w-[84px].overflow-hidden  (container, pointer handlers, CROP offset)
  └─ div  (inner wrapper, translateY(-CROP))
      ├─ div.bg-[#f5f5f5].rounded-[30px]  (selection highlight pill, absolute, z-0)
      └─ div.flex.flex-col.z-10  (items column, translateY(fractionalPx))
          ├─ div > span  (item -3)
          ├─ div > span  (item -2)
          ├─ div > span  (item -1)
          ├─ div > span  (item  0 — selected)
          ├─ div > span  (item +1)
          ├─ div > span  (item +2)
          └─ div > span  (item +3)
```

---

## 3. Scrolling and selection

Constants:

| Constant | Value | Purpose |
|---|---|---|
| `ITEM_HEIGHT` | 38px | Height of each row |
| `VISIBLE_ITEMS` | 7 | Number of rows rendered |
| `CENTER_INDEX` | 3 | Zero-indexed position of the selected row |
| `CROP` | 12px | Pixels trimmed top and bottom for visual polish |

Vertical scrolling (drag):
- `handlePointerDown` captures the pointer and records `startY`, `lastY`, `lastTime`. Resets `offsetY` to 0 and cancels any pending animation frame.
- `handlePointerMove` calculates `dy = e.clientY - startY` and calls `setOffsetY(dy)`. Velocity is computed as `(currentY - lastY) / dt` on each move.
- The items column applies `transform: translateY(${fractionalPx}px)` during dragging, so items track the finger in real time.
- During drag, `transition` is set to `"none"` so movement is immediate.

Vertical scrolling (mouse wheel):
- Non-passive wheel listener via `useEffect` (line 64-85).
- `scrollAccumulator` accumulates `deltaY`. When it exceeds a threshold of 50px, the selected index moves by 1 in the appropriate direction. Accumulator resets to 0.

Snapping to values:
- `handlePointerUp` computes final displacement:
  ```
  momentum = velocity * 40
  totalDy = dy + momentum
  indexDelta = Math.round(-totalDy / ITEM_HEIGHT)
  ```
- `snapToIndex(selectedIndex + indexDelta)` clamps to `[0, values.length - 1]`, resets `offsetY` to 0, and calls `onChange`.
- After pointer up, `transition` becomes `"transform 0.15s ease-out"`, animating the snap.

Selected value determination:
- The parent component holds state (`selectedValue`). `WheelColumn` receives it as a prop and finds `selectedIndex = values.indexOf(selectedValue)`.
- On snap, `onChange(values[clampedIndex])` propagates upward.

Clicking/tapping a specific value:
- Not directly supported. A tap registers as pointerDown + pointerUp with near-zero displacement and velocity, resulting in `indexDelta = 0`, so the selected value stays the same.

Initial positioning:
- On mount, `selectedValue` is passed as a prop. `selectedIndex = values.indexOf(selectedValue)` positions it at `CENTER_INDEX`. No scroll animation on open — the correct value renders in place immediately.

Centring:
- The items array is built from `virtualIndex - CENTER_INDEX` to `virtualIndex + CENTER_INDEX` (7 items). The selected item always occupies offset 0, which renders at row position `CENTER_INDEX` (row 3 of 7).

Values above/below:
- Items at indices outside `[0, values.length - 1]` render as empty divs (same height, no text).

Scroll-end detection:
- For drag: `handlePointerUp` fires, calls `snapToIndex`, which calls `onChange`.
- For wheel: the accumulator threshold triggers `onChange` immediately.

---

## 4. Visual implementation

Container:
- Width: `w-[84px]` (84px)
- Height: `ITEM_HEIGHT * VISIBLE_ITEMS - 2 * CROP` = `38 * 7 - 24` = **242px**
- Overflow: `overflow-hidden`
- Cursor: `cursor-grab`, `active:cursor-grabbing`
- Text selection: `select-none`

Row height: 38px (`ITEM_HEIGHT`)

Selection highlight pill:
- Background: `#f5f5f5`
- Position: absolute, `top: CENTER_INDEX * ITEM_HEIGHT` = 114px
- Height: `ITEM_HEIGHT` = 38px
- Border radius: `rounded-[30px]` (30px)
- Layer: `z-0` (behind items)
- Left/right: 0 (full width of container)

Text styling per offset from centre (`getItemStyle`):

| Offset | Font size | Opacity | Scale | SkewX |
|---|---|---|---|---|
| 0 (selected) | 20px | 0.8 | 1.0 | 0deg |
| ±1 | 17px | 0.4 | 0.95 | ∓1deg |
| ±2 | 15px | 0.25 | 0.85 | ∓2deg |
| ±3 | 13px | 0.1 | 0.75 | ∓3deg |

Note: skewX is `offset * -1` so negative offsets skew positive and vice versa, creating a barrel/cylinder perspective.

Selected text colour: `#1C2C42`
Non-selected text colour: `rgba(0,0,0,${opacity})` where opacity comes from the table above.

Font: `font-['Lato:Bold',sans-serif]`, `text-center`

Font variation settings:
- Offset 0: `'wdth' 100`
- Offset ±1: `'wdth' 100`
- Offset ±2: `'wdth' 122`
- Offset ±3: `'wdth' 150`

Letter spacing:
- Offset 0, ±1: none
- Offset ±2: `1.6px`
- Offset ±3: `2.4px`

Spacing between hour and minute wheels: `gap-[61px]` (61px) on the parent flex container.

CROP mechanism:
- The inner wrapper is shifted up by `translateY(-12px)`.
- Combined with `overflow-hidden` on the outer container, this crops 12px from the top and 12px from the bottom, hiding the outermost partial rows for a cleaner edge.

No gradient or mask overlays. The fading effect is achieved purely through decreasing opacity on distant items.

Padding: `pt-[20px] pb-[20px]` on the parent `TimePicker` wrapper.

Top border: 1px solid `#EDEDED`, absolute, full width, `pointer-events-none`.

Format function default: `String(v).padStart(2, "0")` — so values display as `00`, `01`, etc.

---

## 5. State / data

State ownership:
- `TimePicker` does not hold state. It receives `selectedTime: { hour: number; minute: number } | null` and calls `onTimeSelect(newTime)` on change.
- The actual state lives in the parent — `NewReminderOverlay` manages `selectedTime` via its own `useState`.

Internal wheel state:
- `WheelColumn` maintains one piece of React state: `offsetY` (the pixel displacement during a drag).
- `dragState` is a ref (not state) holding `startY`, `startOffset`, `isDragging`, `lastY`, `lastTime`, `velocity`.
- `scrollAccumulator` is a ref tracking wheel scroll deltas.
- `animFrameRef` is a ref for cancelling animation frames.

All of these reset on each interaction cycle. No persistent internal state survives between drags.

Values supplied:
- Hours: `Array.from({ length: 24 }, (_, i) => i)` → `[0, 1, 2, ..., 23]`
- Minutes (default): `[0, 15, 30, 45]`
- Minutes (one-minute mode): `Array.from({ length: 60 }, (_, i) => i)` → `[0, 1, 2, ..., 59]`

Minute snapping: when the parent `selectedTime.minute` does not match a value in the minutes array, `nearestMinute` is computed via reduce to find the closest valid value.

Disabled / read-only: not supported. No prop or code path for disabling interaction.

---

## 6. Reusability assessment

`WheelColumn` is already generic. It accepts any `number[]` for values, any initial `selectedValue`, any `onChange` callback, and an optional `formatValue` function.

To build the Noterly picker with:

Days: `[30, 15, 10, 5, 2, 1, 0]`
Minutes: `[30, 15, 10, 5, 2, 1, 0]`

You would:

1. Copy `WheelColumn` and the supporting code (`getItemStyle`, constants) into a new file in Noterly.
2. Create a wrapper component analogous to `TimePicker`:

```tsx
const DAYS = [30, 15, 10, 5, 2, 1, 0];
const MINUTES = [30, 15, 10, 5, 2, 1, 0];

function RetentionPicker({ days, minutes, onChange }) {
  return (
    <div className="flex gap-[61px] items-center justify-center ...">
      <WheelColumn
        values={DAYS}
        selectedValue={days}
        onChange={(d) => onChange({ days: d, minutes })}
        formatValue={(v) => String(v)}
      />
      <WheelColumn
        values={MINUTES}
        selectedValue={minutes}
        onChange={(m) => onChange({ days, minutes: m })}
        formatValue={(v) => String(v)}
      />
    </div>
  );
}
```

3. Use `formatValue` to suppress zero-padding if desired (the default pads to 2 digits).

No structural changes to `WheelColumn` are needed. The only Reminderly-specific code is in the `TimePicker` wrapper (hour/minute types, 12-hour formatting, minute increment modes), none of which lives inside `WheelColumn` itself.

---

## 7. Code extract

The reusable portion is everything from line 1 to line 231 in `TimePicker.tsx`. The Reminderly-specific portion is lines 233-264 (the `TimePicker` default export).

Reusable code (copy this verbatim):

```tsx
import { useRef, useState, useEffect, useCallback } from "react";

const ITEM_HEIGHT = 38;
const VISIBLE_ITEMS = 7;
const CENTER_INDEX = 3;
const CROP = 12;

interface WheelColumnProps {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
}

function getItemStyle(offset: number): {
  fontSize: number;
  opacity: number;
  skewX: number;
  scale: number;
} {
  const abs = Math.abs(offset);
  if (abs === 0) return { fontSize: 20, opacity: 0.8, skewX: 0, scale: 1 };
  if (abs === 1) return { fontSize: 17, opacity: 0.4, skewX: offset * -1, scale: 0.95 };
  if (abs === 2) return { fontSize: 15, opacity: 0.25, skewX: offset * -1, scale: 0.85 };
  return { fontSize: 13, opacity: 0.1, skewX: offset * -1, scale: 0.75 };
}

function WheelColumn({ values, selectedValue, onChange, formatValue }: WheelColumnProps) {
  const selectedIndex = values.indexOf(selectedValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startY: number;
    startOffset: number;
    isDragging: boolean;
    lastY: number;
    lastTime: number;
    velocity: number;
  }>({ startY: 0, startOffset: 0, isDragging: false, lastY: 0, lastTime: 0, velocity: 0 });

  const [offsetY, setOffsetY] = useState(0);
  const animFrameRef = useRef<number>(0);
  const scrollAccumulator = useRef<number>(0);
  const format = formatValue || ((v: number) => String(v).padStart(2, "0"));

  const snapToIndex = useCallback(
    (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(values.length - 1, targetIndex));
      setOffsetY(0);
      onChange(values[clamped]);
    },
    [values, onChange]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumulator.current += e.deltaY;
      const threshold = 50;
      if (Math.abs(scrollAccumulator.current) >= threshold) {
        const direction = scrollAccumulator.current > 0 ? 1 : -1;
        scrollAccumulator.current = 0;
        const idx = values.indexOf(selectedValue);
        const newIndex = Math.max(0, Math.min(values.length - 1, idx + direction));
        if (newIndex !== idx) {
          onChange(values[newIndex]);
        }
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [selectedValue, values, onChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (el) el.setPointerCapture(e.pointerId);
      dragState.current = {
        startY: e.clientY,
        startOffset: 0,
        isDragging: true,
        lastY: e.clientY,
        lastTime: Date.now(),
        velocity: 0,
      };
      setOffsetY(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current.isDragging) return;
      const dy = e.clientY - dragState.current.startY;
      const now = Date.now();
      const dt = now - dragState.current.lastTime;
      if (dt > 0) {
        dragState.current.velocity = (e.clientY - dragState.current.lastY) / dt;
      }
      dragState.current.lastY = e.clientY;
      dragState.current.lastTime = now;
      setOffsetY(dy);
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current.isDragging) return;
      dragState.current.isDragging = false;
      const el = containerRef.current;
      if (el) el.releasePointerCapture(e.pointerId);
      const dy = e.clientY - dragState.current.startY;
      const velocity = dragState.current.velocity;
      const momentum = velocity * 40;
      const totalDy = dy + momentum;
      const indexDelta = Math.round(-totalDy / ITEM_HEIGHT);
      snapToIndex(selectedIndex + indexDelta);
    },
    [selectedIndex, snapToIndex]
  );

  const dragIndexOffset = dragState.current.isDragging ? Math.round(-offsetY / ITEM_HEIGHT) : 0;
  const virtualIndex = Math.max(0, Math.min(values.length - 1, selectedIndex + dragIndexOffset));
  const fractionalPx = dragState.current.isDragging
    ? (offsetY + dragIndexOffset * ITEM_HEIGHT)
    : 0;

  const items: { value: number; offset: number }[] = [];
  for (let i = -CENTER_INDEX; i <= CENTER_INDEX; i++) {
    const idx = virtualIndex + i;
    if (idx >= 0 && idx < values.length) {
      items.push({ value: values[idx], offset: i });
    } else {
      items.push({ value: -1, offset: i });
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 w-[84px] overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS - 2 * CROP }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={{ transform: `translateY(${-CROP}px)` }}>
        <div
          className="absolute left-0 right-0 bg-[#f5f5f5] rounded-[30px] pointer-events-none z-0"
          style={{
            top: CENTER_INDEX * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />
        <div
          className="relative z-10 flex flex-col items-center"
          style={{
            transform: `translateY(${fractionalPx}px)`,
            transition: dragState.current.isDragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          {items.map(({ value, offset }) => {
            const style = getItemStyle(offset);
            if (value === -1) {
              return (
                <div
                  key={`empty-${offset}`}
                  className="flex items-center justify-center w-full"
                  style={{ height: ITEM_HEIGHT }}
                />
              );
            }
            return (
              <div
                key={`${value}-${offset}`}
                className="flex w-full items-center justify-center"
                style={{
                  height: ITEM_HEIGHT,
                  transform: `skewX(${style.skewX}deg)`,
                }}
              >
                <span
                  className="font-['Lato:Bold',sans-serif] text-center"
                  style={{
                    fontSize: style.fontSize,
                    color: offset === 0 ? '#1C2C42' : `rgba(0,0,0,${style.opacity})`,
                    fontVariationSettings: offset === 0 ? "'wdth' 100" : `'wdth' ${Math.abs(offset) <= 1 ? 100 : Math.abs(offset) === 2 ? 122 : 150}`,
                    letterSpacing: Math.abs(offset) >= 2 ? `${Math.abs(offset) * 0.8}px` : undefined,
                  }}
                >
                  {format(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Reminderly-specific wrapper (do not copy — replace with your own):

```tsx
export default function TimePicker({ selectedTime, onTimeSelect, useOneMinuteIncrements = false }: TimePickerProps) {
  const hour = selectedTime?.hour ?? 12;
  const minute = selectedTime?.minute ?? 0;
  const minutes = useOneMinuteIncrements ? Array.from({ length: 60 }, (_, i) => i) : [0, 15, 30, 45];
  const nearestMinute = minutes.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
  );

  return (
    <div className="bg-white content-stretch flex gap-[61px] items-center justify-center pt-[20px] pb-[20px] relative size-full">
      <div aria-hidden="true" className="absolute border-[#EDEDED] border-solid border-t inset-0 pointer-events-none" />
      <WheelColumn values={HOURS} selectedValue={hour} onChange={(h) => onTimeSelect({ hour: h, minute: nearestMinute })} />
      <WheelColumn values={minutes} selectedValue={nearestMinute} onChange={(m) => onTimeSelect({ hour, minute: m })} />
    </div>
  );
}
```

---

## 8. Risks / assumptions to parameterise

1. **Zero-padded formatting** — the default `formatValue` pads to 2 digits (`"00"`, `"05"`). For your days/minutes arrays `[30, 15, 10, 5, 2, 1, 0]`, you likely want no padding. Pass `formatValue={(v) => String(v)}`.

2. **Non-sequential values** — the wheel moves one array index at a time, not one numeric unit. With `[30, 15, 10, 5, 2, 1, 0]`, a single flick moves from 30 to 15, not 30 to 29. This is the desired behaviour but worth noting — the momentum multiplier of 40 and `ITEM_HEIGHT` of 38 mean a moderate flick skips 1-2 indices. With only 7 values this feels appropriate.

3. **Short value arrays** — with 7 values and `VISIBLE_ITEMS = 7`, the wheel will have empty slots at both extremes. When `30` is selected (index 0), positions -3 through -1 render as empty divs. When `0` is selected (index 6), positions +1 through +3 are empty. This matches the existing Reminderly behaviour for hour 0 and hour 23.

4. **`data-name="Hours"`** — hardcoded on the container div at line 170. Cosmetic only (no functional impact), but should be removed or parameterised if you want clean markup.

5. **Tailwind dependency** — `WheelColumn` uses Tailwind classes throughout. The Noterly project must have Tailwind configured with the same class support (v4 arbitrary value syntax like `w-[84px]`, `rounded-[30px]`, etc.).

6. **Lato font** — the font family is set to `Lato:Bold`. If Noterly does not load the Lato font, the text will fall back to sans-serif. The `fontVariationSettings` for `wdth` will silently no-op if Lato's variable font axis is not available.

7. **Colour values** — `#1C2C42` (selected text), `#f5f5f5` (pill background), `#EDEDED` (border) are Reminderly brand values. Adjust for Noterly's palette if needed.

8. **`scale` property in `getItemStyle`** — it is computed but never applied in the JSX. Only `fontSize`, `opacity`, and `skewX` are used. The `scale` value is dead code.

9. **No tap-to-select** — tapping a non-centre value does not select it. If Noterly requires tap-to-select, you would need to add click handlers on individual items that compute the offset and call `snapToIndex(selectedIndex + offset)`.
