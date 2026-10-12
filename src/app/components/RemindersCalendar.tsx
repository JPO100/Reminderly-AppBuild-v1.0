import { useRef } from "react";
import { motion } from "motion/react";
import { formatCalendarMonthTitle, getCalendarDayCategory, getCalendarWeeks, isDateInFilterRange } from "../reminder-utils";
import type { CalendarDotKind, ReminderCategory } from "../reminder-utils";

// Calendar view (docs/features/scheduling-and-nlc.md), measured from the supplied SVGs.
// Presentational: the parent owns the shown month, selection and filter.

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DATE_DARK = "#1C2C42";
const DATE_GREY = "#D9D9D9";
const ARROW_BLUE = "#0088FE";
const ROW_HEIGHT = 41;
const SWIPE_MIN_PX = 50;

export type CalendarColours = Record<CalendarDotKind, string>;

function ChevronLeft() {
  return (
    <svg width="10.377" height="17.626" viewBox="315.148 294.842 10.377 17.626" fill="none" aria-hidden="true">
      <path d="M315.148 303.65C315.148 303.424 315.189 303.219 315.271 303.035C315.354 302.843 315.487 302.659 315.671 302.481L323.054 295.252C323.328 294.979 323.666 294.842 324.069 294.842C324.336 294.842 324.579 294.907 324.797 295.037C325.023 295.16 325.201 295.331 325.331 295.549C325.46 295.768 325.525 296.014 325.525 296.288C325.525 296.684 325.372 297.033 325.064 297.333L318.573 303.65L325.064 309.956C325.372 310.264 325.525 310.619 325.525 311.022C325.525 311.289 325.46 311.532 325.331 311.75C325.201 311.969 325.023 312.144 324.797 312.273C324.579 312.403 324.336 312.468 324.069 312.468C323.666 312.468 323.328 312.332 323.054 312.058L315.671 304.819C315.487 304.641 315.354 304.46 315.271 304.275C315.189 304.084 315.148 303.875 315.148 303.65Z" fill={ARROW_BLUE} />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="10.387" height="17.626" viewBox="359.804 294.842 10.387 17.626" fill="none" aria-hidden="true">
      <path d="M370.191 303.65C370.191 303.875 370.15 304.084 370.068 304.275C369.986 304.46 369.853 304.641 369.668 304.819L362.275 312.058C362.009 312.332 361.674 312.468 361.271 312.468C361.004 312.468 360.758 312.403 360.532 312.273C360.313 312.144 360.136 311.969 359.999 311.75C359.869 311.532 359.804 311.289 359.804 311.022C359.804 310.619 359.961 310.264 360.276 309.956L366.767 303.65L360.276 297.333C359.961 297.033 359.804 296.684 359.804 296.288C359.804 296.014 359.869 295.768 359.999 295.549C360.136 295.331 360.313 295.16 360.532 295.037C360.758 294.907 361.004 294.842 361.271 294.842C361.674 294.842 362.009 294.979 362.275 295.252L369.668 302.481C369.853 302.659 369.986 302.843 370.068 303.035C370.15 303.219 370.191 303.424 370.191 303.65Z" fill={ARROW_BLUE} />
    </svg>
  );
}

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
  // Horizontal swipe on the calendar changes month: left for next, right for previous
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    // The parent column has a 24px gap; the design puts the month row 14.5px below the filter pills
    <div
      className="w-full shrink-0"
      style={{ marginTop: -9.5 }}
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
      {/* Month title and arrows */}
      <div className="flex items-center justify-between h-[45px] w-full">
        <p className="font-['Lato',sans-serif] font-bold leading-[normal] text-[17px] whitespace-nowrap pl-[10px]" style={{ color: DATE_DARK }}>
          {formatCalendarMonthTitle(year, month)}
        </p>
        <div className="flex items-center" style={{ marginRight: -5.5 }}>
          <button type="button" aria-label="Previous month" onClick={onPrevMonth} className="flex items-center justify-center size-[45px] p-0 m-0 border-none bg-transparent cursor-pointer">
            <ChevronLeft />
          </button>
          <button type="button" aria-label="Next month" onClick={onNextMonth} className="flex items-center justify-center size-[45px] p-0 m-0 border-none bg-transparent cursor-pointer">
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Weekday names */}
      <div className="grid grid-cols-7 w-full h-[16px] mt-[5.5px]">
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
