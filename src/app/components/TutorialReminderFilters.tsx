import type { ReactNode } from "react";
import { LIST_CATEGORY_COLOURS } from "@/app/utils/list-utils";

export type TutorialFilterKey =
  | "today"
  | "thisWeek"
  | "later"
  | "sometime"
  | "done"
  | "deleted"
  | "complete"
  | "almost"
  | "started"
  | "todo"
  | "grouped-todo";

export const TUTORIAL_FILTER_STEP_DELAY = 1000;
export const TUTORIAL_FILTER_RECYCLE_DELAY = 2000;

export interface TutorialFilterItem {
  key: TutorialFilterKey;
  label: string;
  color: string;
  hideOnNarrow?: boolean;
}

export const UNGROUPED_TUTORIAL_FILTER_ITEMS: TutorialFilterItem[] = [
  { key: "today", label: "Today", color: "#00AFEE" },
  { key: "thisWeek", label: "This week", color: "#E466FD" },
  { key: "later", label: "Later", color: "#FDB146" },
  { key: "sometime", label: "Sometime", color: "#939393", hideOnNarrow: true },
];

// Settings menu on: Sometime is combined into Later and the Settings button sits on the right
export const SETTINGS_MENU_TUTORIAL_FILTER_ITEMS: TutorialFilterItem[] = UNGROUPED_TUTORIAL_FILTER_ITEMS.filter((item) => item.key !== "sometime");

// Settings button scaled to match the tutorial Templates button height (45px in the app)
export function TutorialSettingsButton() {
  return (
    <svg data-tutorial-settings-button className="block shrink-0" width="32.308" height="32.308" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="45" height="45" rx="22.5" fill="#4784F8" />
      <circle cx="16" cy="22.5" r="1.75" fill="white" />
      <circle cx="22.5" cy="22.5" r="1.75" fill="white" />
      <circle cx="29" cy="22.5" r="1.75" fill="white" />
    </svg>
  );
}

// Calendar button scaled to match TutorialSettingsButton (45px in the app)
export function TutorialCalendarButton() {
  return (
    <svg className="block shrink-0" width="32.308" height="32.308" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="45" height="45" rx="22.5" fill="#4784F8" />
      <path d="M28.5 12.5V14.5M16.5 12.5V14.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22.4955 23.5H22.5045M22.4955 27.5H22.5045M26.491 23.5H26.5M18.5 23.5H18.509M18.5 27.5H18.509" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 18.5H31" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 22.7432C13 18.3859 13 16.2073 14.2521 14.8536C15.5042 13.5 17.5195 13.5 21.55 13.5H23.45C27.4805 13.5 29.4958 13.5 30.7479 14.8536C32 16.2073 32 18.3859 32 22.7432V23.2568C32 27.6141 32 29.7927 30.7479 31.1464C29.4958 32.5 27.4805 32.5 23.45 32.5H21.55C17.5195 32.5 15.5042 32.5 14.2521 31.1464C13 29.7927 13 27.6141 13 23.2568V22.7432Z" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 18.5H31.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mirrors the live Reminders filter row: pills grouped left, calendar then settings buttons on the right
export function TutorialRemindersFilterRow({ settingsMenuEnabled, calendarEnabled = false, activeKey }: { settingsMenuEnabled: boolean; calendarEnabled?: boolean; activeKey?: TutorialFilterKey }) {
  if (settingsMenuEnabled || calendarEnabled) {
    return (
      <TutorialReminderFilters
        items={settingsMenuEnabled ? SETTINGS_MENU_TUTORIAL_FILTER_ITEMS : UNGROUPED_TUTORIAL_FILTER_ITEMS}
        activeKey={activeKey}
        trailing={
          <div className="flex items-center gap-[5.744px]">
            {calendarEnabled && <TutorialCalendarButton />}
            {settingsMenuEnabled && <TutorialSettingsButton />}
          </div>
        }
        groupGapClassName="gap-[5.744px]"
        showHiddenItems
      />
    );
  }
  return <TutorialReminderFilters items={UNGROUPED_TUTORIAL_FILTER_ITEMS} activeKey={activeKey} showHiddenItems />;
}

export const UNGROUPED_TUTORIAL_LIST_FILTER_ITEMS: TutorialFilterItem[] = [
  { key: "complete", label: "Complete", color: "#005BE3" },
  { key: "almost", label: "Almost", color: "#9468D5" },
  { key: "started", label: "Started", color: "#00AFEE", hideOnNarrow: true },
  { key: "todo", label: "Todo", color: "#939393" },
];

export const SAVED_LISTS_TUTORIAL_FILTER_ITEMS: TutorialFilterItem[] = [
  { key: "todo", label: "Todo", color: LIST_CATEGORY_COLOURS.todo },
  { key: "started", label: "Started", color: LIST_CATEGORY_COLOURS.started },
  { key: "complete", label: "Done", color: LIST_CATEGORY_COLOURS.complete },
];

export const PAGE8_DONE_FILTER_ITEMS: TutorialFilterItem[] = [
  { key: "done", label: "Done", color: "#FFFFFF" },
  { key: "deleted", label: "Deleted", color: "#FFFFFF" },
];

function TutorialReminderFilterPill({
  item,
  activeKey,
  variant = "default",
}: {
  item: TutorialFilterItem;
  activeKey?: TutorialFilterKey;
  variant?: "default" | "ghost";
}) {
  const isActive = activeKey === item.key;
  const isDefault = activeKey == null;
  const color = isActive || isDefault ? item.color : "#D9D9D9";
  const isGhost = variant === "ghost";

  return (
    <div
      className={`content-stretch flex items-center justify-center px-[9.751px] py-[10.448px] relative rounded-[69.652px] shrink-0 h-[31.5px] ${isGhost ? "bg-[rgba(255,255,255,0.15)]" : isActive ? "bg-white" : "bg-transparent"}`}
      style={{ boxShadow: `inset 0 0 0 ${isGhost ? "1px" : isActive ? "1.5px" : "1px"} ${isGhost ? "#FFFFFF" : color}` }}
    >
      <div
        className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[9.751px]"
        style={{ color: isGhost ? "#FFFFFF" : color }}
      >
        <p className="leading-[normal]">{item.label}</p>
      </div>
    </div>
  );
}

export default function TutorialReminderFilters({
  items,
  activeKey,
  leading,
  trailing,
  layout = "between",
  rowGapClassName = "gap-[10px]",
  groupGapClassName = "gap-[8px]",
  showHiddenItems = false,
  pillVariant = "default",
  onTrailingElementChange,
}: {
  items: TutorialFilterItem[];
  activeKey?: TutorialFilterKey;
  leading?: ReactNode;
  trailing?: ReactNode;
  layout?: "between" | "inline";
  rowGapClassName?: string;
  groupGapClassName?: string;
  showHiddenItems?: boolean;
  pillVariant?: "default" | "ghost";
  onTrailingElementChange?: (element: HTMLDivElement | null) => void;
}) {
  const hasTrailingControl = trailing != null;
  const isFullWidthBetweenLayout = layout === "between" && !hasTrailingControl;
  const visibleItems = items.filter((item) => showHiddenItems || isFullWidthBetweenLayout || !item.hideOnNarrow);

  return (
    <div className="relative shrink-0 w-full px-[14px] pt-[14px] pb-[8px]">
      <div
        className={`flex items-center ${layout === "between" ? "justify-between" : ""} ${rowGapClassName}`}
      >
        {isFullWidthBetweenLayout ? (
          visibleItems.map((item) => (
            <TutorialReminderFilterPill key={item.key} item={item} activeKey={activeKey} />
          ))
        ) : (
          <div className={`flex items-center ${groupGapClassName}`}>
            {leading ? <div className="shrink-0">{leading}</div> : null}
            {visibleItems.map((item) => (
              <TutorialReminderFilterPill key={item.key} item={item} activeKey={activeKey} variant={pillVariant} />
            ))}
          </div>
        )}
        {trailing ? (
          <div ref={onTrailingElementChange} className="shrink-0">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}
