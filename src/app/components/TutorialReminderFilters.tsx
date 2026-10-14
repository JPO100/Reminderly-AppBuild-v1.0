import type { ReactNode } from "react";

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
    <svg className="block shrink-0" width="32.308" height="32.308" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="45" height="45" rx="22.5" fill="#4784F8" />
      <circle cx="16" cy="22.5" r="1.75" fill="white" />
      <circle cx="22.5" cy="22.5" r="1.75" fill="white" />
      <circle cx="29" cy="22.5" r="1.75" fill="white" />
    </svg>
  );
}

export function TutorialRemindersFilterRow({ settingsMenuEnabled, activeKey }: { settingsMenuEnabled: boolean; activeKey?: TutorialFilterKey }) {
  if (settingsMenuEnabled) {
    return (
      <TutorialReminderFilters
        items={SETTINGS_MENU_TUTORIAL_FILTER_ITEMS}
        activeKey={activeKey}
        trailing={<TutorialSettingsButton />}
        groupGapClassName="gap-[7.18px]"
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
  { key: "todo", label: "Todo", color: "#939393" },
  { key: "started", label: "Started", color: "#9468D5" },
  { key: "complete", label: "Done", color: "#005BE3" },
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
      className={`content-stretch flex items-center justify-center px-[11.144px] py-[10.448px] relative rounded-[69.652px] shrink-0 h-[31.5px] ${isGhost ? "bg-[rgba(255,255,255,0.15)]" : isActive ? "bg-white" : "bg-transparent"}`}
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
