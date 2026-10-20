import { useRef } from "react";
import { motion } from "motion/react";
import { getCalendarDayCategory, getCalendarWeeks, isDateInFilterRange } from "../reminder-utils";
import type { CalendarDotKind, ReminderCategory } from "../reminder-utils";

// Calendar view (docs/features/scheduling-and-nlc.md), measured from the supplied SVGs.
// Presentational: the parent owns the shown month, selection and filter.

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DATE_DARK = "#1C2C42";
const DATE_GREY = "#D9D9D9";
const ROW_HEIGHT = 41;
const SWIPE_MIN_PX = 50;

export type CalendarColours = Record<CalendarDotKind, string>;

export default function RemindersCalendar({
  year,
  month,
  now,
  todayKey,
  selectedKey,
  filter,
  dots,
  colours,
  heading,
  headingColour,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number; // 0-based
  now: Date;
  todayKey: string;
  selectedKey: string | null;
  filter: ReminderCategory | "all";
  dots: Map<string, CalendarDotKind[]>;
  colours: CalendarColours;
  heading: string; // list heading: the selected day, or the active filter's name
  headingColour: string;
  onSelectDay?: (dateKey: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}) {
  const weeks = getCalendarWeeks(year, month);
  // Slide the dates in from the side the user moved towards. No slide on first show.
  const monthIndex = year * 12 + month;
  const prevMonthIndexRef = useRef(monthIndex);
  const slideDirectionRef = useRef(0);
  if (prevMonthIndexRef.current !== monthIndex) {
    slideDirectionRef.current = monthIndex > prevMonthIndexRef.current ? 1 : -1;
    prevMonthIndexRef.current = monthIndex;
  }
  // Horizontal swipe on the calendar changes month: left for next, right for previous (no arrow buttons)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    // The month title is in the Reminders header; the weekday row sits the parent column's 24px gap below it
    <div
      className="w-full shrink-0"
      data-name="reminders-calendar"
      onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
        if (dx < 0) onNextMonth?.(); else onPrevMonth?.();
      }}
    >
      {/* Weekday names */}
      <div className="grid grid-cols-7 w-full h-[16px]">
        {WEEKDAYS.map((day) => (
          <p key={day} className="font-['Lato',sans-serif] font-bold leading-[16px] text-[13px] text-center" style={{ color: "rgba(0, 0, 0, 0.2)" }}>
            {day}
          </p>
        ))}
      </div>

      {/* Dates */}
      <motion.div
        key={monthIndex}
        className="w-full mt-[4px]"
        initial={slideDirectionRef.current === 0 ? false : { x: slideDirectionRef.current * 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {weeks.map((week, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 w-full" style={{ height: ROW_HEIGHT }}>
            {week.map((dateKey, colIndex) => {
              if (!dateKey) return <div key={colIndex} />;
              const category = getCalendarDayCategory(dateKey, now);
              const isPast = category === "past";
              const inRange = filter === "all" || isDateInFilterRange(dateKey, filter, now);
              const isToday = dateKey === todayKey;
              const isSelected = !isToday && !isPast && dateKey === selectedKey;
              const circleColour = isToday ? colours.today : isSelected ? colours[category as CalendarDotKind] : null;
              const numberColour = circleColour ? "#FFFFFF" : isPast || !inRange ? DATE_GREY : DATE_DARK;
              const dayDots = dots.get(dateKey) ?? [];
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={isPast}
                  onClick={() => onSelectDay?.(dateKey)}
                  className="relative flex flex-col items-center p-0 m-0 border-none bg-transparent"
                  style={{ cursor: isPast ? "default" : "pointer" }}
                  aria-label={dateKey}
                >
                  <span
                    className="flex items-center justify-center size-[30px] rounded-full font-['Lato',sans-serif] font-bold leading-[normal] text-[16px]"
                    style={{ backgroundColor: circleColour ?? "transparent", color: numberColour }}
                  >
                    {Number(dateKey.slice(8))}
                  </span>
                  {dayDots.length > 0 && (
                    <span className="flex items-center gap-[3px] mt-[4px] h-[4px]">
                      {dayDots.map((kind, i) => (
                        <span key={i} className="block size-[4px] rounded-full" style={{ backgroundColor: inRange ? colours[kind] : DATE_GREY }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Divider between the calendar and the list */}
      <div className="w-full h-px mt-[11px]" style={{ backgroundColor: "#E4E4E4" }} />

      {/* List heading, fixed above the scrolling list */}
      <p className="font-['Lato',sans-serif] font-bold leading-[normal] text-[17px] whitespace-nowrap" style={{ color: headingColour, marginTop: 16.75, marginBottom: -2.75 }}>
        {heading}
      </p>
    </div>
  );
}
