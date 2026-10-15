import { useRef, useState, useEffect, useCallback } from "react";

interface TimePickerProps {
  selectedTime: { hour: number; minute: number } | null;
  onTimeSelect: (time: { hour: number; minute: number }) => void;
  useOneMinuteIncrements?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ITEM_HEIGHT = 38;
const VISIBLE_ITEMS = 7;
const CENTER_INDEX = 3; // middle of 7
const CROP = 12; // px to trim from top and bottom of wheel container

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

  // Snap to nearest item
  const snapToIndex = useCallback(
    (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(values.length - 1, targetIndex));
      setOffsetY(0);
      onChange(values[clamped]);
    },
    [values, onChange]
  );

  // Non-passive wheel listener so preventDefault() actually works
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

      // Reduced momentum for less sensitivity
      const momentum = velocity * 40;
      const totalDy = dy + momentum;

      const indexDelta = Math.round(-totalDy / ITEM_HEIGHT);
      snapToIndex(selectedIndex + indexDelta);
    },
    [selectedIndex, snapToIndex]
  );

  // Cancelled drag (iOS interrupted the touch): end it and keep the current value
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current.isDragging) return;
      dragState.current.isDragging = false;
      const el = containerRef.current;
      if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      setOffsetY(0);
    },
    []
  );

  // Render items centered around selected
  // During drag, compute a virtual index so the correct items are shown in real-time
  const dragIndexOffset = dragState.current.isDragging ? Math.round(-offsetY / ITEM_HEIGHT) : 0;
  const virtualIndex = Math.max(0, Math.min(values.length - 1, selectedIndex + dragIndexOffset));
  const fractionalPx = dragState.current.isDragging
    ? (offsetY + dragIndexOffset * ITEM_HEIGHT)  // remainder after snapping to nearest item
    : 0;

  const items: { value: number; offset: number }[] = [];
  for (let i = -CENTER_INDEX; i <= CENTER_INDEX; i++) {
    const idx = virtualIndex + i;
    if (idx >= 0 && idx < values.length) {
      items.push({ value: values[idx], offset: i });
    } else {
      items.push({ value: -1, offset: i }); // empty slot
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 w-[84px] overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS - 2 * CROP, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      data-name="Hours"
    >
      {/* Inner wrapper shifted up by CROP so clipping is symmetric */}
      <div style={{ transform: `translateY(${-CROP}px)` }}>
        {/* Selection highlight */}
        <div
          className="absolute left-0 right-0 bg-[#f5f5f5] rounded-[30px] pointer-events-none z-0"
          style={{
            top: CENTER_INDEX * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />

        {/* Items */}
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
                    fontVariationSettings: offset === 0 ? "'wdth' 100" : `'wdth' ${offset === 0 ? 100 : Math.abs(offset) <= 1 ? 100 : Math.abs(offset) === 2 ? 122 : 150}`,
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

export default function TimePicker({ selectedTime, onTimeSelect, useOneMinuteIncrements = false }: TimePickerProps) {
  const hour = selectedTime?.hour ?? 12;
  const minute = selectedTime?.minute ?? 0;
  const minutes = useOneMinuteIncrements ? Array.from({ length: 60 }, (_, i) => i) : [0, 15, 30, 45];

  // Snap minute to nearest valid value
  const nearestMinute = minutes.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
  );

  return (
    <div
      className="bg-white content-stretch flex gap-[61px] items-center justify-center pt-[20px] pb-[20px] relative size-full"
      data-name="time-picker"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#EDEDED] border-solid border-t inset-0 pointer-events-none"
      />
      <WheelColumn
        values={HOURS}
        selectedValue={hour}
        onChange={(h) => onTimeSelect({ hour: h, minute: nearestMinute })}
      />
      <WheelColumn
        values={minutes}
        selectedValue={nearestMinute}
        onChange={(m) => onTimeSelect({ hour, minute: m })}
      />
    </div>
  );
}
