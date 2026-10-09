import { AnimatePresence, motion } from "motion/react";
import { formatReminderNextOccurrenceLabel, formatRepeatLabel, formatRepeatRuleText, formatScheduledDateForRow } from "../reminder-utils";
import { useEffect, useRef, useState } from "react";
import { formatTime12h } from "../utils/normalise-text";
import { TUTORIAL_FILTER_RECYCLE_DELAY, TUTORIAL_FILTER_STEP_DELAY, type TutorialFilterKey } from "./TutorialReminderFilters";
import { CompletedCircleIcon } from "./icons/ReminderStateIcons";

export const TUTORIAL_REMINDER_LIST_SCALE = 0.696;
const TUTORIAL_NOW = new Date(2025, 7, 11, 12, 0, 0, 0);
const PAGE_1_INITIAL_INSERT_DELAY = 450;
const PAGE_1_INSERT_START_GAP = 750;
const NEW_REMINDER_INSERT_DELAY = 500;
const INSERT_HIGHLIGHT_MS = 1000;
const TUTORIAL_RECYCLE_DELAY = 2000;
const COMPLETION_DELAY = 350;
const DONE_SEQUENCE_INITIAL_DELAY = 1000;
const DONE_SEQUENCE_REMOVAL_GAP = 500;
const DONE_BLUE = "#4784F8";
const PAGE_1_BUILD_SEQUENCE_IDS = ["sometime", "later-2", "later", "this-week", "today-2", "today"] as const;

type TutorialReminder = {
  id: string;
  title: string;
  category: "today" | "thisWeek" | "later" | "sometime";
  circleColor: string;
  schedule:
    | { kind: "scheduled"; date: string; time?: string }
    | { kind: "sometime" };
  repeatRule?: { frequency: "weekly" | "monthly"; interval: number; byDay: string[] | null } | null;
};

type TutorialList = {
  id: string;
  title: string;
  subtitle: string;
  state: "todo" | "started" | "done";
  circleColor: string;
};

const STATIC_REMINDERS: readonly TutorialReminder[] = [
  {
    id: "today",
    title: "Pick up milk",
    category: "today",
    circleColor: "#00AFEE",
    schedule: { kind: "scheduled", date: "2025-08-11", time: "14:00" },
  },
  {
    id: "today-2",
    title: "Call the dentist",
    category: "today",
    circleColor: "#00AFEE",
    schedule: { kind: "scheduled", date: "2025-08-11", time: "16:30" },
  },
  {
    id: "this-week",
    title: "Pay credit card",
    category: "thisWeek",
    circleColor: "#E466FD",
    schedule: { kind: "scheduled", date: "2025-08-12", time: "11:00" },
    repeatRule: { frequency: "monthly", interval: 1, byDay: null },
  },
  {
    id: "later",
    title: "Submit expenses",
    category: "later",
    circleColor: "#FDB146",
    schedule: { kind: "scheduled", date: "2025-08-28", time: "08:00" },
  },
  {
    id: "later-2",
    title: "Put the bins out",
    category: "later",
    circleColor: "#FDB146",
    schedule: { kind: "scheduled", date: "2025-09-18", time: "19:00" },
    repeatRule: { frequency: "weekly", interval: 1, byDay: ["th"] },
  },
  {
    id: "sometime",
    title: "Organise family photo",
    category: "sometime",
    circleColor: "#939393",
    schedule: { kind: "sometime" },
  },
] as const;

const STATIC_LISTS: readonly TutorialList[] = [
  {
    id: "list-1",
    title: "Holiday packing",
    subtitle: "0 of 8",
    state: "todo",
    circleColor: "#939393",
  },
  {
    id: "list-2",
    title: "Work tasks",
    subtitle: "0 of 5",
    state: "todo",
    circleColor: "#939393",
  },
  {
    id: "list-3",
    title: "Weekly shop",
    subtitle: "3 of 9",
    state: "started",
    circleColor: "#9468D5",
  },
  {
    id: "list-4",
    title: "Birthday plans",
    subtitle: "2 of 7",
    state: "started",
    circleColor: "#9468D5",
  },
  {
    id: "list-5",
    title: "House jobs",
    subtitle: "6 of 6",
    state: "done",
    circleColor: "#005BE3",
  },
  {
    id: "list-6",
    title: "Weekend DIY",
    subtitle: "4 of 4",
    state: "done",
    circleColor: "#005BE3",
  },
] as const;

export const TUTORIAL_PAGE_2_DONE_LIST_IDS = STATIC_LISTS.slice(0, -1).map((list) => list.id);
const SMART_REMINDER_ID = "smart-work-tasks";
const SMART_REMINDER_TITLE = "Complete ‘Work tasks’ list";
const SMART_REMINDER_SUBTITLE = "0 of 6 items. Aug 11th at 12pm";
const SMART_REMINDER_CIRCLE_COLOR = "#00AFEE";
const REMINDER_DEFAULT_VISIBLE_IDS = STATIC_REMINDERS.map((reminder) => reminder.id);
const LIST_DEFAULT_VISIBLE_IDS = STATIC_LISTS.map((list) => list.id);
const PAGE_1_LIST_BUILD_SEQUENCE_IDS = [...LIST_DEFAULT_VISIBLE_IDS].reverse();
const LIST_FILTER_LOOP_SEQUENCE: Array<TutorialFilterKey | undefined> = [
  "todo",
  "started",
  "complete",
  undefined,
  "todo",
  "started",
  "complete",
  undefined,
];

function getTutorialReminderSubtitle(reminder: TutorialReminder): string {
  if (reminder.repeatRule) {
    if (reminder.schedule.kind === "scheduled" && reminder.schedule.date) {
      const nextOccurrenceLabel = formatReminderNextOccurrenceLabel(reminder.schedule.date, reminder.schedule.time, TUTORIAL_NOW);
      const repeatText = formatRepeatRuleText(reminder.repeatRule, reminder.schedule.date);
      if (nextOccurrenceLabel && repeatText) {
        return `${nextOccurrenceLabel}. ${repeatText}`;
      }
    }
    const label = formatRepeatLabel(
      reminder.repeatRule,
      reminder.schedule.kind === "scheduled" ? reminder.schedule.time : undefined,
      reminder.schedule.kind === "scheduled" ? reminder.schedule.date : undefined
    );
    if (label) return label;
  }

  if (reminder.schedule.kind === "scheduled" && reminder.schedule.date) {
    const dateLabel = formatScheduledDateForRow(reminder.schedule.date, TUTORIAL_NOW);
    if (reminder.schedule.time) {
      return `${dateLabel} at ${formatTime12h(reminder.schedule.time)}`;
    }
    return dateLabel;
  }

  return "No date / time set";
}

function SmartReminderIndicator({ color = "#BABABA" }: { color?: string }) {
  return (
    <svg
      width="13"
      height="14"
      viewBox="0 0 13 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M5.01045 5.36829C5.34496 5.20257 5.73795 5.20253 6.07245 5.36829C6.21799 5.44044 6.34594 5.55543 6.46998 5.67748L12.3491 11.5566C12.4712 11.6807 12.5862 11.8086 12.6583 11.9541C12.8241 12.2886 12.824 12.6816 12.6583 13.0161C12.5621 13.2102 12.3901 13.3733 12.2262 13.5372C12.0623 13.7011 11.8992 13.8732 11.7051 13.9693C11.3706 14.135 10.9776 14.1351 10.6431 13.9693C10.4976 13.8972 10.3696 13.7822 10.2456 13.6601L4.36646 7.78101C4.2444 7.65696 4.12941 7.52901 4.05726 7.38348C3.8915 7.04897 3.89154 6.65599 4.05726 6.32147C4.15343 6.12741 4.32547 5.96428 4.48936 5.80039C4.65326 5.6365 4.81639 5.46445 5.01045 5.36829ZM6.94049 8.96464L10.8179 12.842C10.9177 12.9418 10.9784 13.002 11.0266 13.045C11.0602 13.075 11.0756 13.0853 11.0797 13.0878C11.1391 13.1173 11.2091 13.1173 11.2685 13.0878C11.2722 13.0856 11.2881 13.0755 11.3223 13.045C11.3704 13.002 11.4312 12.9418 11.531 12.842C11.6308 12.7423 11.691 12.6815 11.7339 12.6333C11.7645 12.5991 11.7746 12.5833 11.7768 12.5796C11.8063 12.5201 11.8063 12.4502 11.7768 12.3907C11.7743 12.3867 11.7639 12.3712 11.7339 12.3376C11.691 12.2895 11.6308 12.2287 11.531 12.1289L7.65362 8.25152L6.94049 8.96464ZM5.63587 6.24977C5.57642 6.22031 5.50648 6.22031 5.44703 6.24977C5.44334 6.25202 5.42751 6.26208 5.39325 6.29266C5.34514 6.33564 5.28434 6.39582 5.18457 6.49559C5.08479 6.59536 5.02461 6.65617 4.98164 6.70428C4.95105 6.73854 4.941 6.75437 4.93875 6.75805C4.90929 6.8175 4.90929 6.88745 4.93875 6.9469C4.94125 6.95095 4.95163 6.96642 4.98164 7.00003C5.0246 7.04814 5.08476 7.10891 5.18457 7.20872L6.24529 8.26944L6.95842 7.55632L5.89769 6.49559C5.79789 6.39579 5.73712 6.33563 5.689 6.29266C5.6554 6.26266 5.63993 6.25228 5.63587 6.24977Z" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.45817 1.31102C2.66378 1.31102 2.8476 1.43899 2.91908 1.63174L3.06439 2.02351C3.27003 2.57924 3.32945 2.71106 3.42288 2.80449C3.5163 2.89792 3.64813 2.95734 4.20386 3.16298L4.59563 3.30829C4.78838 3.37977 4.91634 3.56359 4.91634 3.7692C4.91634 3.9748 4.78838 4.15863 4.59563 4.2301L4.20386 4.37542C3.64813 4.58106 3.5163 4.64047 3.42288 4.7339C3.32945 4.82733 3.27003 4.95916 3.06439 5.51488L2.91908 5.90665C2.8476 6.09941 2.66378 6.22737 2.45817 6.22737C2.25257 6.22737 2.06874 6.09941 1.99726 5.90665L1.85195 5.51488C1.64631 4.95916 1.58689 4.82733 1.49347 4.7339C1.40004 4.64047 1.26821 4.58106 0.712486 4.37542L0.320715 4.2301C0.127961 4.15863 -1.41671e-10 3.9748 0 3.7692C1.79745e-08 3.56359 0.127961 3.37977 0.320715 3.30829L0.712486 3.16298C1.26821 2.95734 1.40004 2.89792 1.49347 2.80449C1.58689 2.71106 1.64631 2.57924 1.85195 2.02351L1.99726 1.63174L2.02927 1.5626C2.11517 1.40902 2.27829 1.31102 2.45817 1.31102ZM2.45817 3.12841C2.38328 3.26674 2.29746 3.3909 2.18867 3.49969C2.07987 3.60849 1.95571 3.6943 1.81738 3.7692C1.95571 3.84409 2.07987 3.9299 2.18867 4.0387C2.29733 4.14736 2.38334 4.27122 2.45817 4.40935C2.533 4.27122 2.61901 4.14736 2.72767 4.0387C2.83634 3.93003 2.96019 3.84403 3.09832 3.7692C2.96019 3.69437 2.83634 3.60836 2.72767 3.49969C2.61888 3.3909 2.53306 3.26674 2.45817 3.12841Z" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M9.66881 0C9.87441 1.79745e-08 10.0582 0.127961 10.1297 0.320715L10.323 0.843076C10.592 1.56998 10.6838 1.78699 10.8396 1.94285C10.9955 2.09872 11.2125 2.19047 11.9394 2.45945L12.4618 2.65278C12.6545 2.72426 12.7825 2.90808 12.7825 3.11368C12.7825 3.31929 12.6545 3.50311 12.4618 3.57459L11.9394 3.76792C11.2125 4.0369 10.9955 4.12865 10.8396 4.28452C10.6838 4.44038 10.592 4.65738 10.323 5.38429L10.1297 5.90665C10.0582 6.09941 9.87441 6.22737 9.66881 6.22737C9.4632 6.22737 9.27938 6.09941 9.2079 5.90665L9.01458 5.38429C8.7456 4.65738 8.65384 4.44038 8.49798 4.28452C8.34211 4.12865 8.12511 4.0369 7.3982 3.76792L6.87584 3.57459C6.68309 3.50311 6.55512 3.31929 6.55512 3.11368C6.55512 2.90808 6.68309 2.72426 6.87584 2.65278L7.3982 2.45945C8.12511 2.19047 8.34211 2.09872 8.49798 1.94285C8.65384 1.78699 8.7456 1.56998 9.01458 0.843076L9.2079 0.320715L9.23991 0.251579C9.32581 0.0979978 9.48893 -1.15009e-10 9.66881 0ZM9.66881 1.87756C9.53824 2.18256 9.39863 2.4326 9.19318 2.63805C8.98772 2.84351 8.73769 2.98312 8.43268 3.11368C8.73769 3.24425 8.98772 3.38386 9.19318 3.58931C9.39851 3.79465 9.53831 4.04441 9.66881 4.34917C9.79931 4.04441 9.9391 3.79465 10.1444 3.58931C10.3498 3.38398 10.5995 3.24419 10.9043 3.11368C10.5995 2.98318 10.3498 2.84339 10.1444 2.63805C9.93898 2.4326 9.79938 2.18256 9.66881 1.87756Z" fill={color}/>
    </svg>
  );
}

function RepeatReminderIndicator({ color = "#BABABA" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M1.44434 3.48096C1.59681 3.4883 1.73996 3.55905 1.84961 3.64502L1.94824 3.73486L3.07227 4.96729C3.30912 5.22148 3.29491 5.61985 3.04102 5.85693C2.78691 6.09383 2.38854 6.08048 2.15137 5.82666L1.62598 5.26318C0.87435 7.43043 1.46921 9.9307 3.31738 11.5122C5.32505 13.2299 8.17595 13.3202 10.2646 11.9106L10.2666 11.9087C10.2757 11.9033 10.3905 11.8364 10.5479 11.8081C10.6863 11.7833 10.8615 11.7883 11.0264 11.8931L11.0967 11.9438L11.1592 12.0044C11.2904 12.1495 11.3179 12.3217 11.3105 12.4614C11.3021 12.6199 11.2485 12.742 11.2451 12.7495C11.2416 12.7571 11.2362 12.764 11.2295 12.769C8.66386 14.6783 5.03173 14.6353 2.49902 12.4683C-0.0335254 10.3011 -0.63702 6.71916 0.852539 3.88916L0.866211 3.87256C0.869116 3.87039 0.872651 3.86918 0.875977 3.86768C0.95226 3.72692 1.03936 3.62903 1.13379 3.56689C1.23497 3.50033 1.34146 3.47608 1.44434 3.48096ZM2.92969 1.43115C5.49535 -0.478399 9.1283 -0.435229 11.6611 1.73193C14.1936 3.89913 14.7972 7.48108 13.3076 10.311C13.3022 10.3211 13.2926 10.3271 13.2822 10.3315C13.206 10.4722 13.1208 10.5712 13.0264 10.6333C12.925 10.6999 12.8179 10.7243 12.7148 10.7192C12.5115 10.7092 12.3252 10.5866 12.2119 10.4653V10.4644L11.0869 9.23291V9.23193C10.8507 8.97767 10.8654 8.58009 11.1191 8.34326C11.3731 8.10643 11.7706 8.12002 12.0078 8.37354L12.5332 8.93604C13.2845 6.76911 12.6904 4.27039 10.8428 2.68896C8.83508 0.971123 5.98426 0.879935 3.89551 2.28955L3.89258 2.2915L3.8916 2.29053C3.87902 2.29792 3.76692 2.36318 3.61328 2.39111C3.45498 2.41981 3.2479 2.41007 3.06348 2.25537C2.87832 2.09972 2.84024 1.89826 2.84863 1.73877C2.85699 1.58032 2.91071 1.45818 2.91406 1.45068C2.91753 1.44303 2.92297 1.4362 2.92969 1.43115ZM7.08008 3.94678C7.41603 3.94686 7.68848 4.2192 7.68848 4.55518V7.08545L8.90527 8.30029C9.14308 8.53749 9.14424 8.92271 8.90723 9.16064C8.67004 9.39845 8.28481 9.39862 8.04688 9.16162L6.65039 7.77002C6.53601 7.65596 6.4718 7.50082 6.47168 7.33936V4.55518C6.47168 4.21915 6.74406 3.94678 7.08008 3.94678Z" fill={color} stroke={color} strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TutorialStaticReminderRow({
  titleColor = "#1C2C42",
  title,
  subtitle,
  circleColor,
  showRepeatIcon = false,
  showSmartReminderIcon = false,
  isDone = false,
  isPendingDone = false,
  showMenuButton = true,
  menuButtonRef,
}: {
  titleColor?: string;
  title: string;
  subtitle: string;
  circleColor: string;
  showRepeatIcon?: boolean;
  showSmartReminderIcon?: boolean;
  isDone?: boolean;
  isPendingDone?: boolean;
  showMenuButton?: boolean;
  menuButtonRef?: ((node: HTMLDivElement | null) => void) | null;
}) {
  const isPendingAway = isDone || isPendingDone;
  const effectiveTitleColor = isPendingAway ? DONE_BLUE : titleColor;
  const subtitleColor = isPendingAway ? DONE_BLUE : "#BABABA";

  return (
    <div className="content-stretch flex items-start justify-between px-px relative w-full">
      <div className="flex-[1_0_0] min-h-px min-w-px relative">
        <div className="flex flex-row items-start size-full">
          <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full">
            <div
              className="relative shrink-0 size-[25px] flex items-center justify-center"
              style={{ padding: 0, lineHeight: 0, marginTop: "3px" }}
            >
              {isPendingAway ? (
                <CompletedCircleIcon className="absolute block size-full" color={DONE_BLUE} />
              ) : (
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                  <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke={circleColor} strokeWidth="2" />
                </svg>
              )}
            </div>
            <div
              className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative"
              style={{ gap: "9px", minHeight: "38px" }}
            >
              <div
                className={`overflow-hidden whitespace-nowrap${isPendingAway ? " line-through" : ""}`}
                style={{ color: effectiveTitleColor, textDecorationColor: effectiveTitleColor, height: "17px", maxWidth: "100%", minWidth: 0 }}
              >
                <p
                  style={{
                    display: "block",
                    width: "100%",
                    minWidth: 0,
                    fontSize: "17px",
                    fontWeight: 700,
                    lineHeight: "17px",
                    transform: "translateY(-1px)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    paddingBottom: "2px",
                    boxSizing: "content-box",
                  }}
                >
                  {title}
                </p>
              </div>
              <div className={`flex items-center overflow-visible${isPendingAway ? " line-through" : ""}`} style={{ textDecorationColor: subtitleColor }}>
                <p
                  className="overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: subtitleColor }}
                >
                  {subtitle}
                </p>
                {(showRepeatIcon || showSmartReminderIcon) && (
                  <div className="flex items-center gap-[6px] h-0 overflow-visible shrink-0 self-center pl-[6px]">
                    {showSmartReminderIcon && <SmartReminderIndicator color={subtitleColor} />}
                    {showRepeatIcon && <RepeatReminderIndicator color={subtitleColor} />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showMenuButton && (
        <div
          className="relative shrink-0 self-stretch w-[20px] flex items-center justify-center"
          style={{ padding: 0, lineHeight: 0 }}
          aria-hidden="true"
          ref={menuButtonRef ?? undefined}
        >
          <div className="flex flex-row items-center justify-center gap-[3px]">
            <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
            <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
            <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorialStaticReminderList({
  mode = "reminders",
  page1BuildSequence = false,
  page3DoneSequence = false,
  page3DoneSequenceCycle = true,
  doneReminderIds,
  activeFilter,
  menuTargetReminderId,
  onMenuTargetElementChange,
  onListFilterChange,
  onPage3DoneSequenceComplete,
  rowTargetListId,
  onRowTargetElementChange,
  prependSmartReminder = false,
  combineLaterSometime = false,
}: {
  mode?: "reminders" | "lists";
  page1BuildSequence?: boolean;
  page3DoneSequence?: boolean;
  page3DoneSequenceCycle?: boolean;
  doneReminderIds?: readonly string[];
  activeFilter?: TutorialFilterKey;
  menuTargetReminderId?: string;
  onMenuTargetElementChange?: (element: HTMLDivElement | null) => void;
  onListFilterChange?: (activeFilter: TutorialFilterKey | undefined) => void;
  onPage3DoneSequenceComplete?: () => void;
  rowTargetListId?: string;
  onRowTargetElementChange?: (element: HTMLDivElement | null) => void;
  prependSmartReminder?: boolean;
  combineLaterSometime?: boolean;
}) {
  // Settings menu on: Sometime is presented as Later (yellow, included in the Later filter)
  const getCircleColor = (item: TutorialReminder | TutorialList) =>
    combineLaterSometime && "category" in item && item.category === "sometime" ? "#FDB146" : item.circleColor;
  const sequenceIds = mode === "lists" ? PAGE_1_LIST_BUILD_SEQUENCE_IDS : PAGE_1_BUILD_SEQUENCE_IDS;
  const defaultVisibleIds = mode === "lists" ? LIST_DEFAULT_VISIBLE_IDS : REMINDER_DEFAULT_VISIBLE_IDS;
  const [visibleIds, setVisibleIds] = useState<string[]>(
    page1BuildSequence ? [] : defaultVisibleIds
  );
  const [reinsertedId, setReinsertedId] = useState<string | null>(null);
  const [insertHighlightId, setInsertHighlightId] = useState<string | null>(null);
  const [pendingDoneIds, setPendingDoneIds] = useState<Set<string>>(new Set());
  const [page3ResetFadeIds, setPage3ResetFadeIds] = useState<Set<string>>(new Set());
  const [suppressPage3ResetAnimation, setSuppressPage3ResetAnimation] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const insertHighlightTimerRef = useRef<number | null>(null);
  const smartReminderHighlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!prependSmartReminder) {
      if (smartReminderHighlightTimerRef.current !== null) {
        clearTimeout(smartReminderHighlightTimerRef.current);
        smartReminderHighlightTimerRef.current = null;
      }
      return;
    }

    setReinsertedId(SMART_REMINDER_ID);
    setInsertHighlightId(SMART_REMINDER_ID);
    smartReminderHighlightTimerRef.current = window.setTimeout(() => {
      smartReminderHighlightTimerRef.current = null;
      setInsertHighlightId(null);
    }, INSERT_HIGHLIGHT_MS);

    return () => {
      if (smartReminderHighlightTimerRef.current !== null) {
        clearTimeout(smartReminderHighlightTimerRef.current);
        smartReminderHighlightTimerRef.current = null;
      }
    };
  }, [prependSmartReminder]);

  useEffect(() => {
    if (!page1BuildSequence) {
      setVisibleIds(defaultVisibleIds);
      setReinsertedId(null);
      setInsertHighlightId(null);
      if (mode === "lists") {
        onListFilterChange?.(undefined);
      }
      return;
    }

    const startCycle = () => {
      setVisibleIds([]);
      setReinsertedId(null);
      setInsertHighlightId(null);
      if (mode === "lists") {
        onListFilterChange?.(undefined);
      }

      const initialTimer = window.setTimeout(() => {
        const insertTimer = window.setTimeout(() => {
          setVisibleIds([sequenceIds[0]]);
          setReinsertedId(sequenceIds[0]);
          setInsertHighlightId(sequenceIds[0]);

          if (insertHighlightTimerRef.current !== null) {
            clearTimeout(insertHighlightTimerRef.current);
          }
          insertHighlightTimerRef.current = window.setTimeout(() => {
            insertHighlightTimerRef.current = null;
            setInsertHighlightId(null);
          }, INSERT_HIGHLIGHT_MS);
          timeoutsRef.current.push(insertHighlightTimerRef.current);
        }, NEW_REMINDER_INSERT_DELAY);
        timeoutsRef.current.push(insertTimer);
      }, PAGE_1_INITIAL_INSERT_DELAY);

      const timers = sequenceIds.slice(1).map((id, index) =>
        window.setTimeout(() => {
          const insertTimer = window.setTimeout(() => {
            setVisibleIds((prev) => [id, ...prev]);
            setReinsertedId(id);
            setInsertHighlightId(id);

            if (insertHighlightTimerRef.current !== null) {
              clearTimeout(insertHighlightTimerRef.current);
            }
            insertHighlightTimerRef.current = window.setTimeout(() => {
              insertHighlightTimerRef.current = null;
              setInsertHighlightId(null);
            }, INSERT_HIGHLIGHT_MS);
            timeoutsRef.current.push(insertHighlightTimerRef.current);
          }, NEW_REMINDER_INSERT_DELAY);
          timeoutsRef.current.push(insertTimer);
        }, PAGE_1_INITIAL_INSERT_DELAY + (index + 1) * PAGE_1_INSERT_START_GAP)
      );

      const populatedAt = PAGE_1_INITIAL_INSERT_DELAY + (sequenceIds.length - 1) * PAGE_1_INSERT_START_GAP + NEW_REMINDER_INSERT_DELAY + INSERT_HIGHLIGHT_MS;
      let recycleTimer: number;
      if (mode === "lists") {
        let elapsed = TUTORIAL_FILTER_RECYCLE_DELAY;
        LIST_FILTER_LOOP_SEQUENCE.forEach((filter, index) => {
          const filterTimer = window.setTimeout(() => {
            onListFilterChange?.(filter);
          }, populatedAt + elapsed);
          timeoutsRef.current.push(filterTimer);
          const isFullListPause = filter == null && index < LIST_FILTER_LOOP_SEQUENCE.length - 1;
          elapsed += isFullListPause ? TUTORIAL_FILTER_RECYCLE_DELAY : TUTORIAL_FILTER_STEP_DELAY;
        });
        recycleTimer = window.setTimeout(() => {
          startCycle();
        }, populatedAt + elapsed + TUTORIAL_FILTER_RECYCLE_DELAY - TUTORIAL_FILTER_STEP_DELAY);
      } else {
        recycleTimer = window.setTimeout(() => {
          startCycle();
        }, populatedAt + TUTORIAL_RECYCLE_DELAY);
      }

      timeoutsRef.current.push(initialTimer, ...timers, recycleTimer);
    };

    startCycle();

    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
      if (insertHighlightTimerRef.current !== null) {
        clearTimeout(insertHighlightTimerRef.current);
        insertHighlightTimerRef.current = null;
      }
    };
  }, [mode, onListFilterChange, page1BuildSequence]);

  useEffect(() => {
    if (!page3DoneSequence) {
      setPendingDoneIds(new Set());
      setPage3ResetFadeIds(new Set());
      setSuppressPage3ResetAnimation(false);
      return;
    }

    const resetIds = mode === "lists"
      ? STATIC_LISTS.map((list) => list.id)
      : STATIC_REMINDERS.map((reminder) => reminder.id);

    setVisibleIds(resetIds);
    setPendingDoneIds(new Set());
    setPage3ResetFadeIds(new Set());
    setSuppressPage3ResetAnimation(false);

    const sequenceIds = mode === "lists"
      ? STATIC_LISTS.slice(0, -1).map((list) => list.id)
      : STATIC_REMINDERS
        .map((reminder) => reminder.id)
        .filter((id) => id !== "sometime");
    const timers: number[] = [];
    let cancelled = false;

    const startCycle = ({ fadeReset }: { fadeReset: boolean }) => {
      if (cancelled) {
        return;
      }

      setSuppressPage3ResetAnimation(false);
      setPendingDoneIds(new Set());
      setPage3ResetFadeIds(new Set());

      if (fadeReset) {
        setVisibleIds([]);
        const resetTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          setPage3ResetFadeIds(new Set(resetIds));
          setVisibleIds(resetIds);
        }, NEW_REMINDER_INSERT_DELAY);
        timers.push(resetTimer);
      } else {
        setPage3ResetFadeIds(new Set(resetIds));
        setVisibleIds(resetIds);
      }

      sequenceIds.forEach((id, index) => {
        const startTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          if (index === 0) {
            setSuppressPage3ResetAnimation(false);
          }

          setPendingDoneIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });

          const commitTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }
            setPendingDoneIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            setVisibleIds((prev) => prev.filter((visibleId) => visibleId !== id));
          }, COMPLETION_DELAY);

          timers.push(commitTimer);
        }, DONE_SEQUENCE_INITIAL_DELAY + index * (COMPLETION_DELAY + DONE_SEQUENCE_REMOVAL_GAP));

        timers.push(startTimer);
      });

      const recycleTimer = window.setTimeout(() => {
        if (page3DoneSequenceCycle) {
          startCycle({ fadeReset: true });
        } else {
          onPage3DoneSequenceComplete?.();
        }
      }, DONE_SEQUENCE_INITIAL_DELAY + (sequenceIds.length - 1) * (COMPLETION_DELAY + DONE_SEQUENCE_REMOVAL_GAP) + COMPLETION_DELAY + TUTORIAL_RECYCLE_DELAY);
      timers.push(recycleTimer);
    };

    startCycle({ fadeReset: false });

    return () => {
      cancelled = true;
      timers.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [mode, onPage3DoneSequenceComplete, page3DoneSequence, page3DoneSequenceCycle]);

  const sourceVisibleIds = doneReminderIds ?? visibleIds;
  const visibleReminders = sourceVisibleIds
    .map((id) => STATIC_REMINDERS.find((reminder) => reminder.id === id))
    .filter((reminder): reminder is (typeof STATIC_REMINDERS)[number] => reminder != null)
    .filter((reminder) => {
      if (doneReminderIds != null) return true;
      if (activeFilter == null) return true;
      if (activeFilter !== "today" && activeFilter !== "thisWeek" && activeFilter !== "later" && activeFilter !== "sometime") {
        return true;
      }
      if (combineLaterSometime && activeFilter === "later" && reminder.category === "sometime") return true;
      return reminder.category === activeFilter;
    });
  const listSourceVisibleIds = doneReminderIds ?? visibleIds;
  const visibleLists = listSourceVisibleIds
    .map((id) => STATIC_LISTS.find((list) => list.id === id))
    .filter((list): list is (typeof STATIC_LISTS)[number] => list != null)
    .filter((list) => {
      if (activeFilter == null) return true;
      if (activeFilter === "complete") return list.state === "done";
      if (activeFilter === "todo" || activeFilter === "started") return list.state === activeFilter;
      return true;
    });
  const visibleItems = mode === "lists" ? visibleLists : visibleReminders;

  const animatePresenceKey = mode === "lists"
    ? `tutorial-lists-${doneReminderIds != null ? "done-lists" : page1BuildSequence && activeFilter == null ? "page1-sequence" : activeFilter ?? "all"}`
    : `tutorial-${doneReminderIds != null ? "done-reminders" : page1BuildSequence ? "page1-sequence" : activeFilter ?? "all"}`;

  return (
    <div className="flex flex-[1_0_0] min-h-px w-full items-start justify-center overflow-hidden">
      <div
        className="shrink-0"
        style={{
          width: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
          transform: `scale(${TUTORIAL_REMINDER_LIST_SCALE})`,
          transformOrigin: "top center",
        }}
      >
        <div className="flex flex-col gap-[23px] w-full" style={{ position: "relative", zIndex: 1 }}>
          <AnimatePresence key={animatePresenceKey}>
            {prependSmartReminder && (
              <motion.div
                key={SMART_REMINDER_ID}
                layout
                initial={reinsertedId === SMART_REMINDER_ID ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={reinsertedId === SMART_REMINDER_ID
                  ? { opacity: { duration: 0.2 } }
                  : { layout: { duration: 0.25 } }
                }
                onAnimationComplete={() => {
                  if (reinsertedId === SMART_REMINDER_ID) {
                    setReinsertedId(null);
                  }
                }}
              >
                <TutorialStaticReminderRow
                  title={SMART_REMINDER_TITLE}
                  subtitle={SMART_REMINDER_SUBTITLE}
                  circleColor={SMART_REMINDER_CIRCLE_COLOR}
                  showSmartReminderIcon
                  titleColor={insertHighlightId === SMART_REMINDER_ID ? SMART_REMINDER_CIRCLE_COLOR : "#1C2C42"}
                />
              </motion.div>
            )}
            {visibleItems.map((item) => {
              const isReinserted = reinsertedId === item.id;
              const isPage3ResetFade = page3ResetFadeIds.has(item.id);
              const isHighlighted = insertHighlightId === item.id;
              const isDoneReminder = doneReminderIds != null;
              const isPendingDone = pendingDoneIds.has(item.id);
              if (suppressPage3ResetAnimation) {
                return (
                  <div key={item.id}>
                    <TutorialStaticReminderRow
                      title={item.title}
                      subtitle={mode === "lists" ? (item as TutorialList).subtitle : getTutorialReminderSubtitle(item as TutorialReminder)}
                    circleColor={getCircleColor(item as TutorialReminder | TutorialList)}
                    showRepeatIcon={mode === "reminders" && Boolean((item as TutorialReminder).repeatRule)}
                    titleColor={isHighlighted ? getCircleColor(item as TutorialReminder | TutorialList) : "#1C2C42"}
                    isDone={isDoneReminder}
                    isPendingDone={isPendingDone}
                    showMenuButton={!isDoneReminder}
                    menuButtonRef={item.id === menuTargetReminderId ? onMenuTargetElementChange ?? null : null}
                  />
                </div>
              );
            }

              return (
                <motion.div
                  key={item.id}
                  ref={mode === "lists" && item.id === rowTargetListId ? onRowTargetElementChange : undefined}
                  layout
                  initial={isReinserted || isPage3ResetFade ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={isReinserted || isPage3ResetFade ? { opacity: { duration: 0.2 } } : { layout: { duration: 0.25 } }}
                  onAnimationComplete={() => {
                    if (isReinserted) {
                      setReinsertedId(null);
                    }
                    if (isPage3ResetFade) {
                      setPage3ResetFadeIds((prev) => {
                        const next = new Set(prev);
                        next.delete(item.id);
                        return next;
                      });
                    }
                  }}
                >
                  <TutorialStaticReminderRow
                    title={item.title}
                    subtitle={mode === "lists" ? (item as TutorialList).subtitle : getTutorialReminderSubtitle(item as TutorialReminder)}
                    circleColor={getCircleColor(item as TutorialReminder | TutorialList)}
                    showRepeatIcon={mode === "reminders" && Boolean((item as TutorialReminder).repeatRule)}
                    titleColor={isHighlighted ? getCircleColor(item as TutorialReminder | TutorialList) : "#1C2C42"}
                    isDone={isDoneReminder}
                    isPendingDone={isPendingDone}
                    showMenuButton={!isDoneReminder}
                    menuButtonRef={item.id === menuTargetReminderId ? onMenuTargetElementChange ?? null : null}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
