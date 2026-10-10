import { useEffect, useRef } from "react";
import svgPaths from "../../imports/svg-oxn8g14l6y";
import type { Reminder } from "../reminder-utils";
import { categoriseReminder, formatRepeatRuleText, formatScheduledDateForRow, isOverdue } from "../reminder-utils";

// ── Due line formatting ──────────────────────────────────────────────

function formatTime12h(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "pm" : "am";
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  if (mm === 0) return `${h12}${suffix}`;
  return `${h12}:${String(mm).padStart(2, "0")}${suffix}`;
}

function formatOverlayDatePart(dateLabel: string): string {
  if (dateLabel === "Today") return "today";
  if (dateLabel === "Tomorrow") return "tomorrow";
  return dateLabel;
}

export function formatDueLine(reminder: Reminder, now: Date = new Date()): string {
  const hasDate =
    reminder.schedule.kind === "scheduled" && !!reminder.schedule.date;
  const hasTime =
    reminder.schedule.kind === "scheduled" && !!reminder.schedule.time;

  if (!hasDate && !hasTime) return "No schedule set";

  let datePart = "";
  if (hasDate) {
    datePart = formatOverlayDatePart(formatScheduledDateForRow(
      (reminder.schedule as { date: string }).date,
      now
    ));
  }

  let timePart = "";
  if (hasTime) {
    timePart = formatTime12h(
      (reminder.schedule as { time: string }).time
    );
  }

  const overdue = isOverdue(reminder, now);
  const prefix = overdue ? "Was due" : "Due";

  if (datePart && timePart) return `${prefix} ${datePart} at ${timePart}`;
  if (datePart) return `${prefix} ${datePart}`;
  return `${prefix} at ${timePart}`;
}

function stripTrailingTitleTime(displayText: string): string {
  return displayText.replace(/\s+at\s+\d{1,2}(?::\d{2})?(?:am|pm)$/i, "");
}

// ── Component ────────────────────────────────────────────────────────

interface ReminderInfoOverlayProps {
  reminder: Reminder;
  smartReminderProgressLine?: string | null;
  onClose: () => void;
  onMarkAsDone: () => void;
  onEdit?: () => void;
  onGoToList?: () => void;
  onMoveToTomorrow?: () => void;
  onDelete: () => void;
}

export default function ReminderInfoOverlay({
  reminder,
  smartReminderProgressLine,
  onClose,
  onMarkAsDone,
  onEdit,
  onGoToList,
  onMoveToTomorrow,
  onDelete,
}: ReminderInfoOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key closes overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus panel on mount
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // Prevent background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const dueLine = formatDueLine(reminder);
  const displayTitle = stripTrailingTitleTime(reminder.displayText);
  const repeatRuleText = formatRepeatRuleText(
    reminder.repeatRule,
    reminder.schedule.kind === "scheduled" ? reminder.schedule.date : undefined
  );
  const repeatsLine = repeatRuleText
    ? `Repeats ${repeatRuleText.charAt(0).toLowerCase()}${repeatRuleText.slice(1)}`
    : null;
  const overdue = isOverdue(reminder, new Date());
  const dueLineColour = overdue ? "#FF0000" : "#1C2C42";

  return (
    <>
      {/* 50% dark backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />

      {/* Centred modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className="bg-white relative flex flex-col gap-[30px] items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] pointer-events-auto outline-none"
          style={{ width: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reminder text in single quotes */}
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center mb-[10px]">
            <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>{displayTitle}</p>
          </div>

          {/* Due line */}
          <div className="content-stretch flex items-center justify-center gap-[8px] min-w-full relative shrink-0">
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] min-w-0 not-italic relative shrink text-[17px] text-center max-w-full" style={{ color: dueLineColour }}>
              <p className="leading-[normal] whitespace-nowrap" style={{ fontWeight: 700 }}>{dueLine}</p>
            </div>
          </div>

          {/* Smart reminder progress line (optional) */}
          {reminder.isSmartReminder && smartReminderProgressLine && (
            <div className="content-stretch flex items-center justify-center gap-[8px] min-w-full relative shrink-0">
              <div className="relative shrink-0 w-[19px] h-[21px] flex items-center justify-center" aria-hidden="true">
                <svg className="block w-[19px] h-[21px]" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 19.5002 21.5002">
                  <g>
                    <path clipRule="evenodd" d={svgPaths.p23b20a00} fill="#BABABA" fillRule="evenodd" />
                    <path clipRule="evenodd" d={svgPaths.p15d6fbb2} fill="#BABABA" fillRule="evenodd" />
                    <path clipRule="evenodd" d={svgPaths.p1797f00} fill="#BABABA" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#bababa] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>{smartReminderProgressLine}</p>
              </div>
            </div>
          )}

          {/* Repeats line (optional) */}
          {repeatsLine && (
            <div className="content-stretch flex items-center justify-center gap-[8px] min-w-full relative shrink-0">
              <div className="relative shrink-0 w-[21px] h-[21px] flex items-center justify-center" aria-hidden="true">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block w-[21px] h-[21px]"
                >
                  <path d="M1.44434 3.48096C1.59681 3.4883 1.73996 3.55905 1.84961 3.64502L1.94824 3.73486L3.07227 4.96729C3.30912 5.22148 3.29491 5.61985 3.04102 5.85693C2.78691 6.09383 2.38854 6.08048 2.15137 5.82666L1.62598 5.26318C0.87435 7.43043 1.46921 9.9307 3.31738 11.5122C5.32505 13.2299 8.17595 13.3202 10.2646 11.9106L10.2666 11.9087C10.2757 11.9033 10.3905 11.8364 10.5479 11.8081C10.6863 11.7833 10.8615 11.7883 11.0264 11.8931L11.0967 11.9438L11.1592 12.0044C11.2904 12.1495 11.3179 12.3217 11.3105 12.4614C11.3021 12.6199 11.2485 12.742 11.2451 12.7495C11.2416 12.7571 11.2362 12.764 11.2295 12.769C8.66386 14.6783 5.03173 14.6353 2.49902 12.4683C-0.0335254 10.3011 -0.63702 6.71916 0.852539 3.88916L0.866211 3.87256C0.869116 3.87039 0.872651 3.86918 0.875977 3.86768C0.95226 3.72692 1.03936 3.62903 1.13379 3.56689C1.23497 3.50033 1.34146 3.47608 1.44434 3.48096ZM2.92969 1.43115C5.49535 -0.478399 9.1283 -0.435229 11.6611 1.73193C14.1936 3.89913 14.7972 7.48108 13.3076 10.311C13.3022 10.3211 13.2926 10.3271 13.2822 10.3315C13.206 10.4722 13.1208 10.5712 13.0264 10.6333C12.925 10.6999 12.8179 10.7243 12.7148 10.7192C12.5115 10.7092 12.3252 10.5866 12.2119 10.4653V10.4644L11.0869 9.23291V9.23193C10.8507 8.97767 10.8654 8.58009 11.1191 8.34326C11.3731 8.10643 11.7706 8.12002 12.0078 8.37354L12.5332 8.93604C13.2845 6.76911 12.6904 4.27039 10.8428 2.68896C8.83508 0.971123 5.98426 0.879935 3.89551 2.28955L3.89258 2.2915L3.8916 2.29053C3.87902 2.29792 3.76692 2.36318 3.61328 2.39111C3.45498 2.41981 3.2479 2.41007 3.06348 2.25537C2.87832 2.09972 2.84024 1.89826 2.84863 1.73877C2.85699 1.58032 2.91071 1.45818 2.91406 1.45068C2.91753 1.44303 2.92297 1.4362 2.92969 1.43115ZM7.08008 3.94678C7.41603 3.94686 7.68848 4.2192 7.68848 4.55518V7.08545L8.90527 8.30029C9.14308 8.53749 9.14424 8.92271 8.90723 9.16064C8.67004 9.39845 8.28481 9.39862 8.04688 9.16162L6.65039 7.77002C6.53601 7.65596 6.4718 7.50082 6.47168 7.33936V4.55518C6.47168 4.21915 6.74406 3.94678 7.08008 3.94678Z" fill="#BABABA" stroke="#BABABA" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#bababa] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>{repeatsLine}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="content-stretch flex flex-col gap-[30px] items-start mt-[10px] relative shrink-0 w-full">
            <button
              className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full"
              onClick={onMarkAsDone}
            >
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-left text-white whitespace-nowrap">
                    <p className="leading-[normal]">Mark as done</p>
                  </div>
                </div>
              </div>
            </button>

            {(overdue || categoriseReminder(reminder, new Date()) === "today") && onMoveToTomorrow && (
              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full"
                onClick={onMoveToTomorrow}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Move to tomorrow</p>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {onEdit && (
              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full"
                onClick={onEdit}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Edit reminder</p>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {reminder.isSmartReminder && reminder.linkedListId && onGoToList && (
              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full"
                onClick={onGoToList}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Go to list</p>
                    </div>
                  </div>
                </div>
              </button>
            )}

            <button
              className="bg-[#939393] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full"
              onClick={onDelete}
            >
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                    <p className="leading-[normal]">Delete reminder</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
