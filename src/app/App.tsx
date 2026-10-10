import { useState, useRef, useEffect, useCallback } from "react";

import { Badge } from "@capawesome/capacitor-badge";
import { App as CapacitorApp } from "@capacitor/app";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import svgPaths from "../imports/svg-tzdfx9foxi";
import doneTickPaths from "../imports/svg-c9judk5sbu";
import NewReminderOverlay from "../imports/NewReminderOverlay";
import DevToolsOverlay, { ShowInfoIconsContext } from "./components/DevToolsOverlay";
import RepeatsOverlay from "./components/RepeatsOverlay";
import ReminderInfoOverlay from "./components/ReminderInfoOverlay";
import TutorialOverlay from "./components/TutorialOverlay";
import type { RepeatRule } from "./types/reminder";
import type { NlcMode } from "./utils/nlc-interaction";
import type { NlcRecognitionConfig } from "./utils/nlc-parser";
import { renderReminderText, getDisplayTitle } from "./utils/render-text";
import { STORAGE_KEY, loadReminders, isOverdue, categoriseReminder, sortReminders, formatRepeatLabel, formatScheduledDateForRow, formatReminderNextOccurrenceLabel, formatRepeatRuleText, computeBadgeCount, getNextTimeRefreshBoundary, getDisplayCategory, getFilterForSettingsMenu } from "./reminder-utils";
import { parseTokens, MONTH_NAME_TO_NUMBER } from "./utils/nlc-parser";
import { computeAutoApplyResult, computeTokenClickResult } from "./utils/nlc-interaction";
import { normaliseReminderText } from "./utils/normalise-text";
import { repeatConfigToRule } from "./utils/repeat-conversion";
import type { Reminder, ReminderCategory, ReminderSchedule, RepeatConfig, ViewMode } from "./reminder-utils";
import { formatTime12h } from "./utils/normalise-text";
import { scheduleEquality } from "./utils/schedule";
import { hapticTap } from "./utils/haptics";
import { PENDING_NOTIFICATION_REMINDER_ID_KEY, syncReminderNotifications } from "./notifications";
import { useNotificationTapHandler } from "./useNotificationTapHandler";
import laterBtnPaths from "../imports/svg-0tntgsesap";
import { RemindersSettingsContent, ListsSettingsContent } from "./components/SettingsPanelContent";
import tutorialIconPaths from "../imports/svg-orocxqk06z";
import ListsHeader from "../imports/Header";
import InfoOverlay from "../imports/InfoOverlay";
import ListInfoOverlay from "../imports/list-info-overlay";
import DeletedInfoOverlay from "../imports/deleted-info-overlay";
import AddListItemInput from "./components/lists/AddListItemInput";
import EditableListItem from "./components/lists/EditableListItem";
import { CompletedCircleIcon } from "./components/icons/ReminderStateIcons";
import {
  dateToStorageString,
  storageStringToDate,
  formatSmartReminderDueBy,
  getSmartReminderTime,
  formatListProgress,
  buildSmartReminderText,
  createSmartReminderForList,
  getCurrentListCategory,
  getDisplayListItems,
} from "./utils/list-utils";
import type { ListItem, CreatedList } from "./utils/list-utils";

type SavedListTemplate = {
  id: string;
  title: string;
  items: ListItem[];
  status?: 'active' | 'deleted';
  statusChangedAt?: number | null;
};

const DEFAULT_TEMPLATE_SEED: Array<{ title: string; items: string[] }> = [
  {
    title: "Weekly food shop",
    items: ["Milk", "Bread", "Eggs", "Chicken", "Rice", "Pasta", "Fruit", "Vegetables"],
  },
  {
    title: "Morning routine",
    items: ["Wake up", "Drink water", "Shower", "Get dressed", "Breakfast", "Check calendar"],
  },
  {
    title: "Weekend tasks",
    items: ["Clean kitchen", "Laundry", "Food shop", "Tidy living space", "Plan upcoming week"],
  },
  {
    title: "Packing list (weekend away)",
    items: ["Clothes", "Underwear", "Toiletries", "Phone charger", "Shoes", "Travel documents"],
  },
  {
    title: "Spaghetti bolognese",
    items: ["Minced beef", "Onion", "Garlic", "Chopped tomatoes", "Tomato purée", "Spaghetti"],
  },
  {
    title: "Pancakes (classic)",
    items: ["Flour", "Eggs", "Milk", "Butter", "Sugar", "Maple syrup"],
  },
  {
    title: "Films to watch",
    items: ["The Shawshank Redemption", "Inception", "The Dark Knight", "Forrest Gump", "Interstellar"],
  },
];

// Category colours matching existing static component tick circles
const CATEGORY_COLOURS: Record<string, string> = {
  today: "#00AFEE",
  "this-week": "#E466FD",
  later: "#FDB146",
  sometime: "#939393",
  other: "#FDB146",
};

function getReminderFilterPillStyle(filter: ReminderCategory, activeFilter: ReminderCategory | "all", listsOff?: boolean) {
  if (listsOff) {
    const isActive = activeFilter === filter;
    if (isActive) {
      return { color: '#4784F8' };
    }
    return { boxShadow: 'inset 0 0 0 1px #ffffff', color: '#ffffff' };
  }

  const pillColor = CATEGORY_COLOURS[filter] || "#939393";
  const isActive = activeFilter === filter;
  const isDefault = activeFilter === "all";

  if (isActive) {
    return {
      boxShadow: `inset 0 0 0 2px ${pillColor}`,
      color: pillColor,
    };
  }

  if (isDefault) {
    return {
      boxShadow: `inset 0 0 0 1px ${pillColor}`,
      color: pillColor,
    };
  }

  return {
    boxShadow: "inset 0 0 0 1px #D9D9D9",
    color: "#D9D9D9",
  };
}

function getArchiveFilterPillStyle(filter: "done" | "deleted", activeFilter: "all" | "done" | "deleted") {
  const pillColor = filter === "done" ? "#404040" : "#898989";
  const isActive = activeFilter === filter;
  const isDefault = activeFilter === "all";

  if (isActive) {
    return {
      boxShadow: `inset 0 0 0 2px ${pillColor}`,
      color: pillColor,
    };
  }

  if (isDefault) {
    return {
      boxShadow: `inset 0 0 0 1px ${pillColor}`,
      color: pillColor,
    };
  }

  return {
    boxShadow: "inset 0 0 0 1px #D9D9D9",
    color: "#D9D9D9",
  };
}

const LIST_CATEGORY_PILL_COLOURS: Record<string, string> = {
  complete: "#8168D5",
  almost: "#9468D5",
  started: "#60C1E7",
  todo: "#939393",
  "grouped-todo": "#939393",
};

function getListFilterPillStyle(
  filter: "complete" | "almost" | "started" | "todo" | "grouped-todo",
  activeFilter: "all" | "complete" | "almost" | "started" | "todo" | "grouped-todo"
) {
  const pillColor = LIST_CATEGORY_PILL_COLOURS[filter] || "#4784F8";
  const isActive = activeFilter === filter;
  const isDefault = activeFilter === "all";

  if (isActive) {
    return {
      boxShadow: `inset 0 0 0 2px ${pillColor}`,
      color: pillColor,
    };
  }

  if (isDefault) {
    return {
      boxShadow: `inset 0 0 0 1px ${pillColor}`,
      color: pillColor,
    };
  }

  return {
    boxShadow: "inset 0 0 0 1px #D9D9D9",
    color: "#D9D9D9",
  };
}

function getListArchiveFilterPillStyle(filter: "done" | "deleted", activeFilter: "all" | "done" | "deleted") {
  const pillColor = filter === "done" ? "#404040" : "#898989";
  const isActive = activeFilter === filter;
  const isDefault = activeFilter === "all";

  if (isActive) {
    return {
      boxShadow: `inset 0 0 0 2px ${pillColor}`,
      color: pillColor,
    };
  }

  if (isDefault) {
    return {
      boxShadow: `inset 0 0 0 1px ${pillColor}`,
      color: pillColor,
    };
  }

  return {
    boxShadow: "inset 0 0 0 1px #D9D9D9",
    color: "#D9D9D9",
  };
}

// Overdue colour for overdue reminders
const OVERDUE_COLOUR = "#FF0000";

// List blue constant for done styling
const DONE_BLUE = "#4784F8";
const APP_TEXT_DARK_BLUE = "#1C2C42";
const DEFAULT_TEMPLATES_IN_CLEAN_STATE_STORAGE_KEY = 'reminderly-dev-default-templates-in-clean-state';
const DONE_LIST_COLOUR = "#404040";
type TutorialVariant = 'reminders' | 'lists';


// Deleted grey constant for deleted styling
const DELETED_GREY = "#939393";
const DELETED_LIST_COLOUR = "#898989";

// Completion delay before setting completedAt (ms)
const COMPLETION_DELAY = 350; // ms 

// Delay after completedAt is set before rescheduling a repeating reminder (ms)
const RESCHEDULE_DELAY = 1000;

// Delay before showing empty-state message (ms)
const EMPTY_STATE_DELAY = 350;

// Delay before inserting a newly created reminder into the list (ms)
// Allows the overlay slide-down to finish before the row fades in.
const NEW_REMINDER_INSERT_DELAY = 500;

// Duration of the temporary "just inserted" text/icon highlight (ms)
const INSERT_HIGHLIGHT_MS = 1000;

function RowMenuButton({ onClick, alignWithSettingsButton = false }: { onClick?: () => void; alignWithSettingsButton?: boolean }) {
  return (
    <button
      className="relative shrink-0 self-stretch w-[20px] cursor-pointer flex items-center justify-center"
      // Settings menu on: inset from the right so the dots centre on the 45px Settings button's dots, keeping the 16px text gap:
      // 22.5 (Settings half-width) - 10 (this button's half-width) - 1 (row px-px) = 11.5px
      style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginRight: alignWithSettingsButton ? '11.5px' : undefined }}
      aria-label="Item menu"
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex flex-row items-center justify-center gap-[3px]">
        <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
        <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
        <span className="block w-[3.5px] h-[3.5px] rounded-full bg-[#BABABA]" />
      </div>
    </button>
  );
}

function PinnedListIcon({ color = "#1C2C42" }: { color?: string }) {
  return (
    <svg className="block" width="13" height="13" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0.875 13.8753L4.48541 10.2642" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.28359 12.3377C5.58063 11.7239 3.02682 9.16957 2.41312 6.46609C2.31597 6.03813 2.2674 5.82415 2.40812 5.47699C2.54885 5.12983 2.72076 5.02241 3.06457 4.80757C3.84178 4.32192 4.68336 4.16753 5.55675 4.2448C6.78228 4.35321 7.39504 4.40742 7.70072 4.24813C8.0064 4.08883 8.21412 3.71635 8.62957 2.97139L9.15584 2.02769C9.50252 1.40603 9.67586 1.0952 10.0836 0.948678C10.4914 0.802151 10.7368 0.890883 11.2275 1.06835C12.3752 1.48337 13.2653 2.37365 13.6803 3.52158C13.8577 4.01246 13.9465 4.2579 13.8 4.66574C13.6535 5.07357 13.3427 5.24695 12.7211 5.5937L11.7559 6.1322C11.0125 6.54693 10.6408 6.7543 10.4816 7.06303C10.3224 7.37175 10.3802 7.97129 10.4958 9.17037C10.5809 10.0521 10.4343 10.8995 9.94223 11.6864C9.72722 12.0303 9.61971 12.2022 9.27272 12.3429C8.92572 12.4835 8.71168 12.4349 8.28359 12.3377Z" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SavedListTemplateIcon({ color = "#1C2C42" }: { color?: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block size-full">
      <path d="M18.2471 22.9885C18.8026 22.9885 19.2529 23.4388 19.2529 23.9943C19.2529 24.5497 18.8026 25 18.2471 25H14.7989C14.2434 25 13.7931 24.5497 13.7931 23.9943C13.7931 23.4388 14.2434 22.9885 14.7989 22.9885H18.2471Z" fill={color}/>
      <path d="M8.85417 20.7099C9.39861 20.6007 9.92791 20.9534 10.0373 21.4978C10.1434 22.0259 10.3097 22.2927 10.5592 22.498C10.8351 22.7249 11.2415 22.8966 12.0106 22.9975C12.5611 23.0697 12.949 23.574 12.8772 24.1245C12.8049 24.6752 12.2998 25.0632 11.7491 24.991C10.7987 24.8664 9.96869 24.6154 9.28183 24.0504C8.58377 23.4761 8.23731 22.7449 8.06618 21.893C7.95704 21.3485 8.30971 20.8192 8.85417 20.7099Z" fill={color}/>
      <path d="M23.0087 21.4978C23.1181 20.9534 23.6474 20.6007 24.1918 20.7099C24.7363 20.8192 25.0889 21.3485 24.9798 21.893C24.8087 22.7449 24.4622 23.4761 23.7641 24.0504C23.0773 24.6154 22.2473 24.8664 21.2969 24.991C20.7462 25.0632 20.241 24.6752 20.1688 24.1245C20.0969 23.574 20.4849 23.0697 21.0354 22.9975C21.8044 22.8966 22.2109 22.7249 22.4868 22.498C22.7363 22.2927 22.9026 22.0259 23.0087 21.4978Z" fill={color}/>
      <path d="M9.62644 1.83515e-06C11.4911 1.97217e-06 12.9782 -0.00210536 14.1545 0.136945C15.3531 0.278622 16.3596 0.578533 17.2043 1.27178C17.4881 1.50462 17.7483 1.76481 17.9811 2.04854C18.638 2.84898 18.9418 3.79466 19.0924 4.912C19.2399 6.00698 19.2515 7.36839 19.2529 9.0506C19.2529 9.34636 19.1238 9.61191 18.9206 9.79593C18.8936 9.8204 18.866 9.84408 18.8364 9.86553C18.723 9.94779 18.5925 10.0081 18.4503 10.0373C18.3851 10.0507 18.3174 10.0574 18.2482 10.0575L18.2471 10.0563L14.7989 10.0575C14.2434 10.0575 13.7931 9.60718 13.7931 9.05172C13.7931 8.49627 14.2434 8.04598 14.7989 8.04598H17.2369C17.228 6.84247 17.1988 5.92324 17.0988 5.18139C16.9757 4.26764 16.7587 3.72976 16.4265 3.3248C16.2772 3.14293 16.1099 2.97568 15.9281 2.82642C15.5012 2.4762 14.9271 2.25419 13.9188 2.13497C12.8879 2.01311 11.5404 2.0115 9.62644 2.0115C7.71245 2.0115 6.36494 2.01311 5.33405 2.13497C4.32582 2.25419 3.75166 2.4762 3.3248 2.82642C3.14293 2.97568 2.97568 3.14293 2.82642 3.3248C2.4762 3.75166 2.25419 4.32582 2.13497 5.33405C2.01311 6.36494 2.0115 7.71245 2.0115 9.62644C2.0115 11.5404 2.01312 12.8879 2.13497 13.9188C2.25419 14.9271 2.4762 15.5012 2.82642 15.9281C2.97568 16.1099 3.14293 16.2772 3.3248 16.4265C3.72976 16.7587 4.26764 16.9757 5.18139 17.0988C5.92323 17.1988 6.84248 17.2269 8.04598 17.2358V14.7989C8.04598 14.2434 8.49627 13.7931 9.05172 13.7931C9.60718 13.7931 10.0575 14.2434 10.0575 14.7989V18.2471C10.0575 18.4206 10.0136 18.584 9.93624 18.7264C9.89781 18.7972 9.84956 18.8614 9.79593 18.9206C9.76531 18.9544 9.73319 18.9866 9.69828 19.016C9.68951 19.0234 9.68036 19.0303 9.67134 19.0374C9.5004 19.1716 9.28591 19.2529 9.05172 19.2529L9.0506 19.2518C7.36838 19.2504 6.00698 19.2399 4.912 19.0924C3.79466 18.9418 2.84898 18.638 2.04854 17.9811C1.76481 17.7483 1.50462 17.4881 1.27178 17.2043C0.578533 16.3596 0.278622 15.3531 0.136945 14.1545C-0.00210535 12.9782 1.69723e-06 11.4911 1.83489e-06 9.62644C1.97026e-06 7.76173 -0.0021054 6.27471 0.136945 5.09833C0.278623 3.89974 0.578532 2.89326 1.27178 2.04854C1.50462 1.76481 1.76481 1.50462 2.04854 1.27178C2.89326 0.578533 3.89974 0.278622 5.09833 0.136945C6.27471 -0.00210546 7.76173 1.69748e-06 9.62644 1.83515e-06Z" fill={color}/>
      <path d="M23.9943 13.7931C24.5497 13.7931 25 14.2434 25 14.7989V18.2471C25 18.8026 24.5497 19.2529 23.9943 19.2529C23.4388 19.2529 22.9885 18.8026 22.9885 18.2471V14.7989C22.9885 14.2434 23.4388 13.7931 23.9943 13.7931Z" fill={color}/>
      <path d="M11.7491 8.05496C12.2998 7.98274 12.8049 8.37077 12.8772 8.92152C12.949 9.47202 12.5611 9.97626 12.0106 10.0485C11.2415 10.1493 10.8351 10.3211 10.5592 10.548C10.3097 10.7533 10.1434 11.0201 10.0373 11.5481C9.92791 12.0926 9.39861 12.4453 8.85417 12.3361C8.30971 12.2268 7.95704 11.6975 8.06618 11.153C8.23731 10.3011 8.58377 9.56989 9.28183 8.9956C9.96869 8.43057 10.7987 8.17958 11.7491 8.05496Z" fill={color}/>
      <path d="M21.2969 8.05496C22.2473 8.17958 23.0773 8.43057 23.7641 8.9956C24.4622 9.5699 24.8087 10.3011 24.9798 11.153C25.0889 11.6975 24.7363 12.2268 24.1918 12.3361C23.6474 12.4453 23.1181 12.0926 23.0087 11.5481C22.9026 11.0201 22.7363 10.7533 22.4868 10.548C22.2109 10.3211 21.8044 10.1493 21.0354 10.0485C20.4849 9.97626 20.0969 9.47202 20.1688 8.92152C20.241 8.37077 20.7462 7.98274 21.2969 8.05496Z" fill={color}/>
    </svg>
  );
}

function SavedListOverlayCheckCircle() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25" aria-hidden="true">
      <path d="M14.1318 24.8936C13.5977 24.9632 13.0531 25 12.5 25C11.9466 25 11.4016 24.9633 10.8672 24.8936L11.126 22.9111C11.5748 22.9697 12.0334 23 12.5 23C12.9666 23 13.4252 22.9697 13.874 22.9111L14.1318 24.8936Z" fill="#BABABA"/>
      <path d="M6.1084 20.832C6.83155 21.3877 7.62891 21.8506 8.48145 22.2041L8.09766 23.127L7.73633 24L7.71484 24.0488C6.6992 23.6275 5.7523 23.0757 4.89258 22.415L6.1084 20.832Z" fill="#BABABA"/>
      <path d="M19.9004 22.1455L20.1064 22.415C19.2466 23.0756 18.2999 23.6276 17.2842 24.0488L16.9014 23.1279L16.5186 22.2041C17.3711 21.8506 18.1684 21.3877 18.8916 20.832L19.9004 22.1455Z" fill="#BABABA"/>
      <path d="M2.7959 16.5186C3.14943 17.3711 3.61225 18.1684 4.16797 18.8916L2.58398 20.1064C1.92348 19.2467 1.37138 18.2998 0.950195 17.2842L2.7959 16.5186Z" fill="#BABABA"/>
      <path d="M23.9648 17.249L24.0488 17.2842C23.6276 18.2999 23.0756 19.2466 22.415 20.1064L20.832 18.8916C21.3877 18.1684 21.8506 17.3711 22.2041 16.5186L23.9648 17.249Z" fill="#BABABA"/>
      <path d="M2.08887 11.126C2.03033 11.5748 2 12.0334 2 12.5C2 12.9666 2.03033 13.4252 2.08887 13.874L0.105469 14.1318C0.0358369 13.5978 0 13.0531 0 12.5C0 11.9466 0.0357548 11.4016 0.105469 10.8672L2.08887 11.126Z" fill="#BABABA"/>
      <path d="M24.8936 10.8672C24.9633 11.4016 25 11.9466 25 12.5C25 13.0531 24.9632 13.5977 24.8936 14.1318L22.9111 13.874C22.9697 13.4252 23 12.9666 23 12.5C23 12.0334 22.9697 11.5748 22.9111 11.126L24.8936 10.8672Z" fill="#BABABA"/>
      <path d="M4.16797 6.1084C3.61225 6.83155 3.14943 7.62891 2.7959 8.48145L0.950195 7.71484C1.37143 6.69926 1.92345 5.75228 2.58398 4.89258L4.16797 6.1084Z" fill="#BABABA"/>
      <path d="M22.415 4.89258C23.0757 5.7523 23.6275 6.6992 24.0488 7.71484L23.1279 8.09863L23.127 8.09766L22.2041 8.48145C21.8506 7.62891 21.3877 6.83155 20.832 6.1084L22.415 4.89258Z" fill="#BABABA"/>
      <path d="M8.48145 2.7959C7.62891 3.14943 6.83155 3.61225 6.1084 4.16797L4.89258 2.58398C5.75228 1.92345 6.69926 1.37143 7.71484 0.950195L8.48145 2.7959Z" fill="#BABABA"/>
      <path d="M17.2842 0.950195C18.2998 1.37138 19.2467 1.92348 20.1064 2.58398L18.8916 4.16797C18.1684 3.61225 17.3711 3.14943 16.5186 2.7959L17.1494 1.27637L17.2842 0.950195Z" fill="#BABABA"/>
      <path d="M12.5 0C13.0531 0 13.5978 0.0358369 14.1318 0.105469L13.874 2.08887C13.4252 2.03033 12.9666 2 12.5 2C12.0334 2 11.5748 2.03033 11.126 2.08887L10.8672 0.105469C11.4016 0.0357548 11.9466 0 12.5 0Z" fill="#BABABA"/>
    </svg>
  );
}

function SavedListOverlayAddItemIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25" aria-hidden="true">
      <path d="M14.1318 24.8936C13.5977 24.9632 13.0531 25 12.5 25C11.9466 25 11.4016 24.9633 10.8672 24.8936L11.126 22.9111C11.5748 22.9697 12.0334 23 12.5 23C12.9666 23 13.4252 22.9697 13.874 22.9111L14.1318 24.8936Z" fill="#D9D9D9"/>
      <path d="M6.1084 20.832C6.83155 21.3877 7.62891 21.8506 8.48145 22.2041L8.09766 23.127L7.73633 24L7.71484 24.0488C6.6992 23.6275 5.7523 23.0757 4.89258 22.415L6.1084 20.832Z" fill="#D9D9D9"/>
      <path d="M19.9004 22.1455L20.1064 22.415C19.2466 23.0756 18.2999 23.6276 17.2842 24.0488L16.9014 23.1279L16.5186 22.2041C17.3711 21.8506 18.1684 21.3877 18.8916 20.832L19.9004 22.1455Z" fill="#D9D9D9"/>
      <path d="M2.7959 16.5186C3.14943 17.3711 3.61225 18.1684 4.16797 18.8916L2.58398 20.1064C1.92348 19.2467 1.37138 18.2998 0.950195 17.2842L2.7959 16.5186Z" fill="#D9D9D9"/>
      <path d="M23.9648 17.249L24.0488 17.2842C23.6276 18.2999 23.0756 19.2466 22.415 20.1064L20.832 18.8916C21.3877 18.1684 21.8506 17.3711 22.2041 16.5186L23.9648 17.249Z" fill="#D9D9D9"/>
      <path d="M2.08887 11.126C2.03033 11.5748 2 12.0334 2 12.5C2 12.9666 2.03033 13.4252 2.08887 13.874L0.105469 14.1318C0.0358369 13.5978 0 13.0531 0 12.5C0 11.9466 0.0357548 11.4016 0.105469 10.8672L2.08887 11.126Z" fill="#D9D9D9"/>
      <path d="M24.8936 10.8672C24.9633 11.4016 25 11.9466 25 12.5C25 13.0531 24.9632 13.5977 24.8936 14.1318L22.9111 13.874C22.9697 13.4252 23 12.9666 23 12.5C23 12.0334 22.9697 11.5748 22.9111 11.126L24.8936 10.8672Z" fill="#D9D9D9"/>
      <path d="M4.16797 6.1084C3.61225 6.83155 3.14943 7.62891 2.7959 8.48145L0.950195 7.71484C1.37143 6.69926 1.92345 5.75228 2.58398 4.89258L4.16797 6.1084Z" fill="#D9D9D9"/>
      <path d="M22.415 4.89258C23.0757 5.7523 23.6275 6.6992 24.0488 7.71484L23.1279 8.09863L23.127 8.09766L22.2041 8.48145C21.8506 7.62891 21.3877 6.83155 20.832 6.1084L22.415 4.89258Z" fill="#D9D9D9"/>
      <path d="M8.48145 2.7959C7.62891 3.14943 6.83155 3.61225 6.1084 4.16797L4.89258 2.58398C5.75228 1.92345 6.69926 1.37143 7.71484 0.950195L8.48145 2.7959Z" fill="#D9D9D9"/>
      <path d="M17.2842 0.950195C18.2998 1.37138 19.2467 1.92348 20.1064 2.58398L18.8916 4.16797C18.1684 3.61225 17.3711 3.14943 16.5186 2.7959L17.1494 1.27637L17.2842 0.950195Z" fill="#D9D9D9"/>
      <path d="M12.5 0C13.0531 0 13.5978 0.0358369 14.1318 0.105469L13.874 2.08887C13.4252 2.03033 12.9666 2 12.5 2C12.0334 2 11.5748 2.03033 11.126 2.08887L10.8672 0.105469C11.4016 0.0357548 11.9466 0 12.5 0Z" fill="#D9D9D9"/>
    </svg>
  );
}

function SavedListOverlayAddItemFocusedIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25" aria-hidden="true">
      <path d="M14.1318 24.8936C13.5977 24.9632 13.0531 25 12.5 25C11.9466 25 11.4016 24.9633 10.8672 24.8936L11.126 22.9111C11.5748 22.9697 12.0334 23 12.5 23C12.9666 23 13.4252 22.9697 13.874 22.9111L14.1318 24.8936Z" fill="#BABABA"/>
      <path d="M6.1084 20.832C6.83155 21.3877 7.62891 21.8506 8.48145 22.2041L8.09766 23.127L7.73633 24L7.71484 24.0488C6.6992 23.6275 5.7523 23.0757 4.89258 22.415L6.1084 20.832Z" fill="#BABABA"/>
      <path d="M19.9004 22.1455L20.1064 22.415C19.2466 23.0756 18.2999 23.6276 17.2842 24.0488L16.9014 23.1279L16.5186 22.2041C17.3711 21.8506 18.1684 21.3877 18.8916 20.832L19.9004 22.1455Z" fill="#BABABA"/>
      <path d="M2.7959 16.5186C3.14943 17.3711 3.61225 18.1684 4.16797 18.8916L2.58398 20.1064C1.92348 19.2467 1.37138 18.2998 0.950195 17.2842L2.7959 16.5186Z" fill="#BABABA"/>
      <path d="M23.9648 17.249L24.0488 17.2842C23.6276 18.2999 23.0756 19.2466 22.415 20.1064L20.832 18.8916C21.3877 18.1684 21.8506 17.3711 22.2041 16.5186L23.9648 17.249Z" fill="#BABABA"/>
      <path d="M2.08887 11.126C2.03033 11.5748 2 12.0334 2 12.5C2 12.9666 2.03033 13.4252 2.08887 13.874L0.105469 14.1318C0.0358369 13.5978 0 13.0531 0 12.5C0 11.9466 0.0357548 11.4016 0.105469 10.8672L2.08887 11.126Z" fill="#BABABA"/>
      <path d="M24.8936 10.8672C24.9633 11.4016 25 11.9466 25 12.5C25 13.0531 24.9632 13.5977 24.8936 14.1318L22.9111 13.874C22.9697 13.4252 23 12.9666 23 12.5C23 12.0334 22.9697 11.5748 22.9111 11.126L24.8936 10.8672Z" fill="#BABABA"/>
      <path d="M4.16797 6.1084C3.61225 6.83155 3.14943 7.62891 2.7959 8.48145L0.950195 7.71484C1.37143 6.69926 1.92345 5.75228 2.58398 4.89258L4.16797 6.1084Z" fill="#BABABA"/>
      <path d="M22.415 4.89258C23.0757 5.7523 23.6275 6.6992 24.0488 7.71484L23.1279 8.09863L23.127 8.09766L22.2041 8.48145C21.8506 7.62891 21.3877 6.83155 20.832 6.1084L22.415 4.89258Z" fill="#BABABA"/>
      <path d="M8.48145 2.7959C7.62891 3.14943 6.83155 3.61225 6.1084 4.16797L4.89258 2.58398C5.75228 1.92345 6.69926 1.37143 7.71484 0.950195L8.48145 2.7959Z" fill="#BABABA"/>
      <path d="M17.2842 0.950195C18.2998 1.37138 19.2467 1.92348 20.1064 2.58398L18.8916 4.16797C18.1684 3.61225 17.3711 3.14943 16.5186 2.7959L17.1494 1.27637L17.2842 0.950195Z" fill="#BABABA"/>
      <path d="M12.5 0C13.0531 0 13.5978 0.0358369 14.1318 0.105469L13.874 2.08887C13.4252 2.03033 12.9666 2 12.5 2C12.0334 2 11.5748 2.03033 11.126 2.08887L10.8672 0.105469C11.4016 0.0357548 11.9466 0 12.5 0Z" fill="#BABABA"/>
    </svg>
  );
}

function SmartRemindersIndicator({ color = "#BABABA" }: { color?: string }) {
  return (
    <svg
      width="13"
      height="15"
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

function SmartReminderReminderIndicator({ color = "#BABABA" }: { color?: string }) {
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

// Playful default list names - one is picked at random for each new list
const DEFAULT_LIST_NAMES = [
  "Stuff to do...",
  "Don't forget...",
  "Getting it done...",
  "On my radar...",
  "Things & stuff...",
  "Brain dump...",
  "Sort this out...",
  "The game plan...",
  "Bits & bobs...",
  "On the list...",
  "Need to handle...",
  "The rundown...",
  "Top of mind...",
  "Note to self...",
  "The essentials...",
];

let _onPersistenceError: (() => void) | null = null;
let _onPersistenceSuccess: (() => void) | null = null;

function persistStringIfChanged(key: string, value: string) {
  try {
    if (localStorage.getItem(key) === value) return;
    localStorage.setItem(key, value);
    _onPersistenceSuccess?.();
  } catch {
    _onPersistenceError?.();
  }
}

/** Pick a random default name, avoiding titles already used by existing lists */
function pickDefaultListName(existingTitles: string[]): string {
  const used = new Set(existingTitles);
  const available = DEFAULT_LIST_NAMES.filter((n) => !used.has(n));
  const pool = available.length > 0 ? available : DEFAULT_LIST_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Pure helper: compute next occurrence for a repeating reminder.
// Always computes relative to the scheduled datetime being completed, never relative to "now".
function getNextOccurrence(baseDateTime: Date, repeatRule: RepeatRule): Date {
  const { frequency, interval, byDay } = repeatRule;

  // Weekly with byDay: find the next matching weekday
  if (frequency === 'weekly' && byDay && byDay.length > 0) {
    // Convert byDay abbreviations to JS weekday indices (0=Sun, 1=Mon, ..., 6=Sat)
    const abbrevToIndex: Record<string, number> = {
      su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6,
    };
    const allowedDays = new Set(byDay.map((d) => abbrevToIndex[d]).filter((n) => n !== undefined));

    // Walk forward day by day from baseDateTime + 1 day, up to 365 days
    for (let offset = 1; offset <= 365; offset++) {
      const candidate = new Date(baseDateTime);
      candidate.setDate(candidate.getDate() + offset);
      const candidateDay = candidate.getDay();

      if (!allowedDays.has(candidateDay)) continue;

      // Check interval: how many full weeks between base week and candidate week
      const weekDistance = Math.floor(offset / 7);
      if (weekDistance % interval === 0) {
        return candidate;
      }
    }
    // Fallback: should not reach here for valid inputs; advance 7 * interval days
    const fallback = new Date(baseDateTime);
    fallback.setDate(fallback.getDate() + 7 * interval);
    return fallback;
  }

  switch (frequency) {
    case 'hourly': {
      const next = new Date(baseDateTime);
      next.setHours(next.getHours() + interval);
      return next;
    }
    case 'daily': {
      const next = new Date(baseDateTime);
      next.setDate(next.getDate() + interval);
      return next;
    }
    case 'weekly': {
      // Plain weekly (no byDay)
      const next = new Date(baseDateTime);
      next.setDate(next.getDate() + 7 * interval);
      return next;
    }
    case 'monthly': {
      const originalDay = baseDateTime.getDate();
      const targetMonth = baseDateTime.getMonth() + interval;
      const next = new Date(baseDateTime.getFullYear(), targetMonth, originalDay,
        baseDateTime.getHours(), baseDateTime.getMinutes(), 0, 0);
      // Clamp if month overflowed (e.g. 31st → next month rolled to following month)
      if (next.getDate() !== originalDay) {
        // Last day of intended month: day 0 of the next month
        const clamped = new Date(baseDateTime.getFullYear(), targetMonth + 1, 0,
          baseDateTime.getHours(), baseDateTime.getMinutes(), 0, 0);
        return clamped;
      }
      return next;
    }
    case 'yearly': {
      const originalMonth = baseDateTime.getMonth();
      const originalDay = baseDateTime.getDate();
      const targetYear = baseDateTime.getFullYear() + interval;
      const next = new Date(targetYear, originalMonth, originalDay,
        baseDateTime.getHours(), baseDateTime.getMinutes(), 0, 0);
      // Clamp for Feb 29 on non-leap years
      if (next.getMonth() !== originalMonth || next.getDate() !== originalDay) {
        const clamped = new Date(targetYear, originalMonth + 1, 0,
          baseDateTime.getHours(), baseDateTime.getMinutes(), 0, 0);
        return clamped;
      }
      return next;
    }
    default:
      // Unknown frequency — fallback: advance 1 day
      const fallback = new Date(baseDateTime);
      fallback.setDate(fallback.getDate() + 1);
      return fallback;
  }
}

// Format a Date to yyyy-mm-dd string
function formatDateToSchedule(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Format a Date to HH:mm string
function formatTimeToSchedule(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Small component: delays rendering of empty-state text by EMPTY_STATE_DELAY ms
function DelayedEmptyState({ message }: { message: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), EMPTY_STATE_DELAY);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return <div className="flex items-center justify-center flex-1 w-full" />;
  return (
    <div className="flex items-center justify-center flex-1 w-full">
      <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
        {message}
      </p>
    </div>
  );
}

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders());
  const [persistenceError, setPersistenceError] = useState(false);
  const [timeRefreshTick, setTimeRefreshTick] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ReminderCategory | "all">("all");
  const [activeListFilter, setActiveListFilter] = useState<"all" | "complete" | "almost" | "started" | "todo" | "grouped-todo">("all");
  const [savedListsPanelOpen, setSavedListsPanelOpen] = useState(false);
  const [restoreSavedListsPanelAfterOverlayClose, setRestoreSavedListsPanelAfterOverlayClose] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode | 'lists-done'>("list");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isReminderOverlayFocusReady, setIsReminderOverlayFocusReady] = useState(false);
  const [isListsOverlayOpen, setIsListsOverlayOpen] = useState(false);
  const [isSavedListsOverlayOpen, setIsSavedListsOverlayOpen] = useState(false);
  const [savedListMenuId, setSavedListMenuId] = useState<string | null>(null);
  const [templateEditorMenuId, setTemplateEditorMenuId] = useState<string | null>(null);
  const [savedListUseFeedback, setSavedListUseFeedback] = useState<{ id: string; createdListId: string; stage: 'idle' | 'fill' | 'copied' | 'blank' | 'go' } | null>(null);
  const [createTemplateFeedback, setCreateTemplateFeedback] = useState<{ source: 'list-info' | 'list-settings'; key: string; createdTemplate: SavedListTemplate; stage: 'idle' | 'fill' | 'copied' | 'blank' | 'go' } | null>(null);
  const [editingSavedListId, setEditingSavedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [listTitle, setListTitle] = useState("");
  const openListEditorTimerRef = useRef<number | null>(null);
  const [createdLists, setCreatedLists] = useState<CreatedList[]>(() => {
    try {
      const stored = localStorage.getItem('reminderly-created-lists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Migrate old string[] items to { text, completed } format
          return parsed.map((list: any) => ({
            ...list,
            items: Array.isArray(list.items) ? list.items.map((item: any) =>
              typeof item === 'string'
                ? { id: crypto.randomUUID(), text: item, completed: false, completedAt: null }
                : {
                    id: item.id || crypto.randomUUID(),
                    text: item.text,
                    completed: item.completed,
                    completedAt: typeof item.completedAt === 'number' ? item.completedAt : null,
                  }
            ) : [],
            status: list.status ?? (list.completedAt != null ? 'done' : 'active'),
            statusChangedAt: list.statusChangedAt ?? list.completedAt ?? null,
            pinnedAt: typeof list.pinnedAt === 'number' ? list.pinnedAt : null,
            smartReminders: list.smartReminders ?? false,
            smartReminderDueDate: list.smartReminderDueDate ?? null,
            smartReminderTime: list.smartReminderTime ?? null,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [savedLists, setSavedLists] = useState<SavedListTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('reminderly-saved-lists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((list: any) => ({
            id: list.id || crypto.randomUUID(),
            title: typeof list.title === 'string' ? list.title : '',
            items: Array.isArray(list.items)
              ? list.items.map((item: any) => ({
                  id: item.id || crypto.randomUUID(),
                  text: typeof item.text === 'string' ? item.text : String(item ?? ''),
                  completed: false,
                  completedAt: null,
                }))
              : [],
            status: list.status === 'deleted' ? 'deleted' : 'active',
            statusChangedAt: typeof list.statusChangedAt === 'number' ? list.statusChangedAt : null,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // UI-only: list settings overlay (cog button in overlay header)
  const [isListSettingsOpen, setIsListSettingsOpen] = useState(false);
  const [listInfoOverlayListId, setListInfoOverlayListId] = useState<string | null>(null);
  const [doneInfoTarget, setDoneInfoTarget] = useState<{ kind: 'reminder' | 'list'; id: string } | null>(null);
  const [savedDeletedListInfoId, setSavedDeletedListInfoId] = useState<string | null>(null);
  const [listSortMode, setListSortMode] = useState<'alphabetical' | 'insertion'>('insertion');
  const [listSettingsSortModeDraft, setListSettingsSortModeDraft] = useState<'alphabetical' | 'insertion'>('insertion');
  const [listSmartReminders, setListSmartReminders] = useState(false);
  const [listSmartReminderDueDate, setListSmartReminderDueDate] = useState<string | null>(null);
  const [listSmartReminderTime, setListSmartReminderTime] = useState<string | null>(null);
  const [pendingListInfoSmartReminderListId, setPendingListInfoSmartReminderListId] = useState<string | null>(null);
  const listSettingsSortApplyTimerRef = useRef<number | null>(null);
  const listSettingsUncheckAllTimerRef = useRef<number | null>(null);
  const handleSmartRemindersChange = (val: boolean) => {
    setListSmartReminders(val);
    if (editingListId) {
      setCreatedLists(prev => prev.map(l => l.id === editingListId ? { ...l, smartReminders: val } : l));
    }
  };

  const clearSavedListUseFeedbackTimers = useCallback(() => {
    savedListUseFeedbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    savedListUseFeedbackTimersRef.current = [];
  }, []);

  const clearCreateTemplateFeedbackTimers = useCallback(() => {
    createTemplateFeedbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    createTemplateFeedbackTimersRef.current = [];
  }, []);

  const openListOverlayForListId = useCallback((listId: string) => {
    const list = createdLists.find((entry) => entry.id === listId);
    if (!list) return;
    setListInfoOverlayListId(null);
    setRevealedDeleteListItemId(null);
    setListItemReinsertedId(null);
    setListItemHighlightId(null);
    setAlphabeticalPinnedListItemId(null);
    setAlphabeticalPinnedListItemIndex(0);
    setListTitle(list.title);
    setListItems(list.items.map((item) => ({ id: (item as any).id || crypto.randomUUID(), ...item })));
    setListOverlayMode('edit');
    setEditingListId(list.id);
    setListSortMode(list.sortMode || 'insertion');
    setListSmartReminders(list.smartReminders ?? false);
    setListSmartReminderDueDate(list.smartReminderDueDate ?? null);
    setListSmartReminderTime(list.smartReminderTime ?? null);
    setIsListsOverlayOpen(true);
  }, [createdLists]);

  const openLinkedSmartReminderList = useCallback((linkedListId: string | null | undefined) => {
    if (!linkedListId) return;
    if (smartReminderOpenListTimerRef.current !== null) {
      clearTimeout(smartReminderOpenListTimerRef.current);
    }
    smartReminderOpenListTimerRef.current = window.setTimeout(() => {
      setActiveMainTab('lists');
      setViewMode('list');
      smartReminderOpenListTimerRef.current = window.setTimeout(() => {
        smartReminderOpenListTimerRef.current = null;
        openListOverlayForListId(linkedListId);
      }, 100);
    }, 100);
  }, [openListOverlayForListId]);

  const clearSmartReminderSetupTimer = useCallback(() => {
    if (smartReminderSetupTimerRef.current !== null) {
      window.clearTimeout(smartReminderSetupTimerRef.current);
      smartReminderSetupTimerRef.current = null;
    }
  }, []);

  const findActiveSmartReminderForListId = useCallback((listId: string) => (
    reminders.find((reminder) =>
      reminder.isSmartReminder === true &&
      reminder.linkedListId === listId &&
      reminder.completedAt == null &&
      reminder.deletedAt == null
    ) ?? null
  ), [reminders]);

  const openSmartReminderAddFlow = useCallback((listId: string, source: 'list-info' | 'list-settings') => {
    const list = createdLists.find((entry) => entry.id === listId);
    if (!list) return;

    clearSmartReminderSetupTimer();
    smartReminderCreateDidSaveRef.current = false;
    pendingSmartReminderCreateRef.current = {
      listId,
      source,
      previousSmartReminders: list.smartReminders ?? false,
      previousDueDate: list.smartReminderDueDate ?? null,
      previousTime: list.smartReminderTime ?? null,
    };

    if (source === 'list-settings') {
      setListSmartReminders(true);
    } else {
      setPendingListInfoSmartReminderListId(listId);
    }

    smartReminderSetupTimerRef.current = window.setTimeout(() => {
      if (source === 'list-settings') {
        setIsListSettingsOpen(false);
        setIsListsOverlayOpen(false);
      } else {
        setListInfoOverlayListId(null);
      }
      setActiveMainTab('reminders');
      smartReminderSetupTimerRef.current = window.setTimeout(() => {
        smartReminderSetupTimerRef.current = null;
        setRepeatConfig(null);
        setEditingReminder(null);
        setSmartReminderCreateListId(listId);
        setIsOverlayOpen(true);
      }, 100);
    }, 150);
  }, [clearSmartReminderSetupTimer, createdLists]);

  const openSmartReminderEditFlow = useCallback((listId: string, source: 'list-info' | 'list-settings') => {
    const reminder = findActiveSmartReminderForListId(listId);
    if (!reminder) return;

    clearSmartReminderSetupTimer();
    smartReminderCreateDidSaveRef.current = false;
    setSmartReminderCreateListId(null);

    if (source === 'list-settings') {
      setIsListSettingsOpen(false);
      setIsListsOverlayOpen(false);
    } else {
      setListInfoOverlayListId(null);
    }

    smartReminderSetupTimerRef.current = window.setTimeout(() => {
      setActiveMainTab('reminders');
      smartReminderSetupTimerRef.current = window.setTimeout(() => {
        smartReminderSetupTimerRef.current = null;
        setRepeatConfig(null);
        setEditingReminder(reminder);
        setIsOverlayOpen(true);
      }, 100);
    }, 100);
  }, [clearSmartReminderSetupTimer, findActiveSmartReminderForListId]);

  // UI-only: list overlay mode tracking (create vs edit, kept separate from reminders)
  const [listOverlayMode, setListOverlayMode] = useState<'create' | 'edit'>('create');
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // UI-only: list-specific insertion state (mirrors reminder insertion state, kept separate)
  const [listReinsertedId, setListReinsertedId] = useState<string | null>(null);
  const [listInsertHighlightId, setListInsertHighlightId] = useState<string | null>(null);
  const newListInsertTimerRef = useRef<number | null>(null);
  const listInsertHighlightTimerRef = useRef<number | null>(null);

  const triggerListInsertStyleHighlight = (listId: string) => {
    setListInsertHighlightId(listId);
    if (listInsertHighlightTimerRef.current !== null) {
      clearTimeout(listInsertHighlightTimerRef.current);
    }
    listInsertHighlightTimerRef.current = window.setTimeout(() => {
      listInsertHighlightTimerRef.current = null;
      setListInsertHighlightId((currentId) => (currentId === listId ? null : currentId));
    }, INSERT_HIGHLIGHT_MS);
  };

  const closeListSettingsOverlay = useCallback(() => {
    setIsListSettingsOpen(false);
    if (listSettingsSortApplyTimerRef.current !== null) {
      clearTimeout(listSettingsSortApplyTimerRef.current);
      listSettingsSortApplyTimerRef.current = null;
    }
    if (listSettingsSortModeDraft !== listSortMode) {
      const nextSortMode = listSettingsSortModeDraft;
      listSettingsSortApplyTimerRef.current = window.setTimeout(() => {
        listSettingsSortApplyTimerRef.current = null;
        setListSortMode(nextSortMode);
      }, 150);
    }
  }, [listSettingsSortModeDraft, listSortMode]);

  const handleListSettingsUncheckAll = useCallback(() => {
    setIsListSettingsOpen(false);
    if (listSettingsSortApplyTimerRef.current !== null) {
      clearTimeout(listSettingsSortApplyTimerRef.current);
      listSettingsSortApplyTimerRef.current = null;
    }
    if (listSettingsSortModeDraft !== listSortMode) {
      const nextSortMode = listSettingsSortModeDraft;
      listSettingsSortApplyTimerRef.current = window.setTimeout(() => {
        listSettingsSortApplyTimerRef.current = null;
        setListSortMode(nextSortMode);
      }, 150);
    }
    if (listSettingsUncheckAllTimerRef.current !== null) {
      clearTimeout(listSettingsUncheckAllTimerRef.current);
      listSettingsUncheckAllTimerRef.current = null;
    }
    listSettingsUncheckAllTimerRef.current = window.setTimeout(() => {
      listSettingsUncheckAllTimerRef.current = null;
      setListItems(prev => prev.map(i => ({ ...i, completed: false, completedAt: null })));
    }, 150);
  }, [listSettingsSortModeDraft, listSortMode]);

  // UI-only: list-item-specific insertion state (mirrors list insertion state, for items within the overlay)
  const [listItemReinsertedId, setListItemReinsertedId] = useState<string | null>(null);
  const [listItemHighlightId, setListItemHighlightId] = useState<string | null>(null);
  const [revealedDeleteListItemId, setRevealedDeleteListItemId] = useState<string | null>(null);
  const [pendingDoneListIds, setPendingDoneListIds] = useState<Set<string>>(new Set());
  const [pendingUndoneListIds, setPendingUndoneListIds] = useState<Set<string>>(new Set());
  const [pendingDeletedListIds, setPendingDeletedListIds] = useState<Set<string>>(new Set());
  const [pendingDeletedSavedListIds, setPendingDeletedSavedListIds] = useState<Set<string>>(new Set());
  const [pendingUndeletedListIds, setPendingUndeletedListIds] = useState<Set<string>>(new Set());
  const handleCompleteClickRef = useRef<((reminderId: string, opts?: { armEmptyDelay?: boolean; filterKey?: string; isRepeat?: boolean; source?: 'manual' | 'list-sync' }) => void) | null>(null);
  const handleUncompleteClickRef = useRef<((reminderId: string, opts?: { source?: 'manual' | 'list-sync' }) => void) | null>(null);
  const handleDeleteClickRef = useRef<((reminderId: string, opts?: { armEmptyDelay?: boolean; filterKey?: string; source?: 'manual' | 'list-sync' }) => void) | null>(null);
  const pendingUndoneListStatusChangedAtRef = useRef<Map<string, number>>(new Map());
  const pendingUndeletedListStatusChangedAtRef = useRef<Map<string, number>>(new Map());
  const completeListTimersRef = useRef<Map<string, number>>(new Map());
  const undoListTimersRef = useRef<Map<string, number>>(new Map());
  const deleteListTimersRef = useRef<Map<string, number>>(new Map());
  const deleteSavedListTimersRef = useRef<Map<string, number>>(new Map());
  const savedListUseFeedbackTimersRef = useRef<number[]>([]);
  const createTemplateFeedbackTimersRef = useRef<number[]>([]);
  const undeleteListTimersRef = useRef<Map<string, number>>(new Map());
  const [alphabeticalPinnedListItemId, setAlphabeticalPinnedListItemId] = useState<string | null>(null);
  const [alphabeticalPinnedListItemIndex, setAlphabeticalPinnedListItemIndex] = useState<number>(0);
  const alphabeticalListItemTimerRef = useRef<number | null>(null);
  const currentListCategory = getCurrentListCategory(listItems);
  const currentListAccentColor = LIST_CATEGORY_PILL_COLOURS[currentListCategory] || "#939393";
  const listItemHighlightTimerRef = useRef<number | null>(null);
  const tabsBarRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const listInfoOverlayList = listInfoOverlayListId == null
    ? null
    : createdLists.find((list) => list.id === listInfoOverlayListId) ?? null;
  const doneInfoReminder = doneInfoTarget?.kind === 'reminder'
    ? reminders.find((reminder) => reminder.id === doneInfoTarget.id) ?? null
    : null;
  const doneInfoList = doneInfoTarget?.kind === 'list'
    ? createdLists.find((list) => list.id === doneInfoTarget.id) ?? null
    : null;
  const savedDeletedListInfo = savedDeletedListInfoId != null
    ? savedLists.find((list) => list.id === savedDeletedListInfoId) ?? null
    : null;
  const displayListItems = getDisplayListItems(
    listItems,
    listSortMode,
    alphabeticalPinnedListItemId,
    alphabeticalPinnedListItemIndex,
  );

  useEffect(() => {
    if (listSortMode === 'alphabetical') return;
    if (alphabeticalListItemTimerRef.current !== null) {
      clearTimeout(alphabeticalListItemTimerRef.current);
      alphabeticalListItemTimerRef.current = null;
    }
    if (alphabeticalPinnedListItemId !== null) {
      setAlphabeticalPinnedListItemId(null);
      setAlphabeticalPinnedListItemIndex(0);
    }
  }, [listSortMode, alphabeticalPinnedListItemId]);

  useEffect(() => {
    return () => {
      if (alphabeticalListItemTimerRef.current !== null) {
        clearTimeout(alphabeticalListItemTimerRef.current);
      }
    };
  }, []);


  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const devToolsTopRef = useRef<number | null>(null);
  const [isDevToolsUnlocked, setIsDevToolsUnlocked] = useState(false);
  const [isDevToolsPasswordRequired, setIsDevToolsPasswordRequired] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-dev-tools-password-required');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [notifReminderAlerts, setNotifReminderAlerts] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-notif-reminder-alerts');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [notifAppBadge, setNotifAppBadge] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-notif-app-badge');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [notifIncludeTodayInBadge, setNotifIncludeTodayInBadge] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-notif-include-today-in-badge');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [isRepeatsOverlayOpen, setIsRepeatsOverlayOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialVariant, setTutorialVariant] = useState<TutorialVariant>('reminders');
  const [isRemindersSettingsPanelOpen, setIsRemindersSettingsPanelOpen] = useState(false);
  const [isListsSettingsPanelOpen, setIsListsSettingsPanelOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 0);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>(null);

  // Transient visual-only set: ids currently in the 350ms "pending done" window.
  // Affects rendering only — never list membership or done/deleted derivation.
  const [pendingDoneIds, setPendingDoneIds] = useState<Set<string>>(new Set());

  // Transient visual-only set: ids currently in the 350ms "pending uncomplete" window.
  const [pendingUncompleteIds, setPendingUncompleteIds] = useState<Set<string>>(new Set());

  // Completion timer map: one timer per reminder id, cleared on unmount.
  const completionTimersRef = useRef<Map<string, number>>(new Map());

  // Uncomplete timer map: one timer per reminder id, cleared on unmount.
  const uncompleteTimersRef = useRef<Map<string, number>>(new Map());

  // Stores the original completedAt for pending-uncomplete items so the done/deleted sort stays stable.
  const pendingUncompleteCompletedAtRef = useRef<Map<string, number>>(new Map());

  // Transient visual-only set: ids currently in the 350ms "pending delete" window.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  // Delete timer map: one timer per reminder id, cleared on unmount.
  const pendingDeleteTimersRef = useRef<Map<string, number>>(new Map());

  // Transient visual-only set: ids currently in the 350ms "pending undelete" window.
  const [pendingUndeleteIds, setPendingUndeleteIds] = useState<Set<string>>(new Set());

  // Undelete timer map: one timer per reminder id, cleared on unmount.
  const undeleteTimersRef = useRef<Map<string, number>>(new Map());

  // Stores the original deletedAt for pending-undelete items so the done/deleted sort stays stable.
  const pendingUndeleteSortKeyRef = useRef<Map<string, number>>(new Map());

  // Reschedule timer map: one timer per repeating reminder id, for the 500ms delay after completedAt is set.
  const rescheduleTimersRef = useRef<Map<string, number>>(new Map());

  // Pending repeat completion ids: tracks repeat reminders in the full in-flight completion cycle.
  // Used to allow second-click cancellation and prevent duplicate spawn.
  const pendingRepeatCompletionIdsRef = useRef<Set<string>>(new Set());

  // Dev-only: NLC parsing mode for A/B testing (click vs auto)
  const [nlcMode, setNlcMode] = useState<NlcMode>('auto');

  // Dev-only: NLC feature flag — controls whether NLC parsing and UI are active
  const [nlcEnabled, setNlcEnabled] = useState(false);

  // Dev-only: NLC recognition config — granular category gates
  const [nlcRecognition, setNlcRecognition] = useState<NlcRecognitionConfig>({ date: true, time: true, repeats: true });

  // Dev-only: onboarding tutorial feature flag — controls whether tutorial overlay is available
  const [isOnboardingTutorialEnabled, setIsOnboardingTutorialEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Dev-only: paywall feature flag — controls visibility of premium features
  const [isListsEnabled, setIsListsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dev.listsEnabled');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Lists mode: active main tab (reminders or lists)
  const [activeMainTab, setActiveMainTab] = useState<'reminders' | 'lists'>(() => {
    try {
      const stored = localStorage.getItem('reminderly-active-main-tab');
      if (stored === 'reminders' || stored === 'lists') return stored;
      return 'reminders';
    } catch {
      return 'reminders';
    }
  });

  // Dev-only: show tutorial on first launch toggle
  const [showTutorialOnFirstLaunch, setShowTutorialOnFirstLaunch] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
      if (stored === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Dev-only: show tutorial on every app start toggle
  const [showTutorialOnEveryStart, setShowTutorialOnEveryStart] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
      if (stored === 'true') return true;
      return false;
    } catch {
      return false;
    }
  });

  const [useOneMinuteTimeIncrements, setUseOneMinuteTimeIncrements] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminderly-dev-one-minute-time-increments') === 'true';
    } catch {
      return false;
    }
  });

  const [smartRemindersFeatureEnabled, setSmartRemindersFeatureEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminderly-ff-smart-reminders') === 'true';
    } catch {
      return false;
    }
  });
  const [savedListsFeatureEnabled, setSavedListsFeatureEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminderly-ff-saved-lists') === 'true';
    } catch {
      return false;
    }
  });
  const [pinnedListsFeatureEnabled, setPinnedListsFeatureEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-ff-pinned-lists');
      return stored == null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const [settingsMenuFeatureEnabled, setSettingsMenuFeatureEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('reminderly-ff-settings-menu-v2');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [showInfoIcons, setShowInfoIcons] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminderly-ff-info-icons') === 'true';
    } catch {
      return false;
    }
  });
  const [siriShortcutsEnabled, setSiriShortcutsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminderly-ff-siri-shortcuts') === 'true';
    } catch {
      return false;
    }
  });
  // Settings panels phase 1 (UI only): System settings Siri toggle shared by the Reminders and Lists panels
  const [settingsPanelSiriOn, setSettingsPanelSiriOn] = useState<boolean>(siriShortcutsEnabled);
  const [useDefaultTemplatesInCleanState, setUseDefaultTemplatesInCleanState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEFAULT_TEMPLATES_IN_CLEAN_STATE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const isSmartRemindersEnabled = isListsEnabled && smartRemindersFeatureEnabled;

  // Dev-only: hide overdue reminders from all views
  const [hideOverdue, setHideOverdue] = useState(false);

  // Conditional empty-placeholder delay: only active when the user removes the last visible item
  // in the current active list (complete or delete). Navigation-to-empty is always immediate.
  const emptyPlaceholderDelayRef = useRef<{ untilMs: number; filterKey: string } | null>(null);
  const [, setEmptyRerenderTick] = useState(0);

  const handleSavedListsFeatureEnabledChange = useCallback((enabled: boolean) => {
    setSavedListsFeatureEnabled(enabled);
    setActiveListFilter('all');
    if (!enabled) {
      setSavedListsPanelOpen(false);
    }
    try {
      persistStringIfChanged('reminderly-ff-saved-lists', String(enabled));
    } catch {
      // Fail silently
    }
  }, []);

  // Reminder info overlay: the reminder currently shown (null = closed)
  const [infoReminder, setInfoReminder] = useState<Reminder | null>(null);

  // Timer ref for overlay mark-as-done 200ms delay
  const overlayDoneTimerRef = useRef<number | null>(null);

  // Timer ref for overlay edit 200ms delay
  const overlayEditTimerRef = useRef<number | null>(null);
  const smartReminderOpenListTimerRef = useRef<number | null>(null);

  // State: which reminder is being edited (null = create mode)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [smartReminderCreateListId, setSmartReminderCreateListId] = useState<string | null>(null);
  const pendingSmartReminderCreateRef = useRef<{
    listId: string;
    source: 'list-info' | 'list-settings';
    previousSmartReminders: boolean;
    previousDueDate: string | null;
    previousTime: string | null;
  } | null>(null);
  const smartReminderCreateDidSaveRef = useRef(false);
  const smartReminderSetupTimerRef = useRef<number | null>(null);

  // UI-only: id of reminder that just reinserted via repeat reschedule (drives fade-in)
  const [reinsertedId, setReinsertedId] = useState<string | null>(null);

  // UI-only: id of reminder currently showing the temporary insert highlight
  const [insertHighlightId, setInsertHighlightId] = useState<string | null>(null);

  // Timer ref for delayed new-reminder insertion (last-one-wins; single timer)
  const newReminderInsertTimerRef = useRef<number | null>(null);

  // Timer ref for clearing the insert highlight (last-one-wins; single timer)
  const insertHighlightTimerRef = useRef<number | null>(null);

  // Done/deleted view sub-filter: 'all' | 'done' | 'deleted'
  const [doneDeletedFilter, setDoneDeletedFilter] = useState<'all' | 'done' | 'deleted'>('all');

  // Clear list button 3-step state: 0=default, 1=confirm, 2=cleared
  const [clearListStep, setClearListStep] = useState<0 | 1 | 2>(0);

  // Timer ref for clear list 500ms reset after "Cleared!" state
  const clearListTimerRef = useRef<number | null>(null);

  // Ref for clear all button (used for outside-click detection)
  const clearAllButtonRef = useRef<HTMLButtonElement | null>(null);

  // Cleanup overlay done timer on unmount
  useEffect(() => {
    return () => {
      if (overlayDoneTimerRef.current !== null) {
        clearTimeout(overlayDoneTimerRef.current);
      }
    };
  }, []);

  // Cleanup overlay edit timer on unmount
  useEffect(() => {
    return () => {
      if (overlayEditTimerRef.current !== null) {
        clearTimeout(overlayEditTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (smartReminderOpenListTimerRef.current !== null) {
        clearTimeout(smartReminderOpenListTimerRef.current);
      }
    };
  }, []);

  // Cleanup all completion timers on unmount
  useEffect(() => {
    const timers = completionTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Cleanup all uncomplete timers on unmount
  useEffect(() => {
    const timers = uncompleteTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Cleanup all reschedule timers on unmount
  useEffect(() => {
    const timers = rescheduleTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Cleanup new-reminder insert timer on unmount
  useEffect(() => {
    return () => {
      if (newReminderInsertTimerRef.current !== null) {
        clearTimeout(newReminderInsertTimerRef.current);
      }
    };
  }, []);

  // Cleanup insert highlight timer on unmount
  useEffect(() => {
    return () => {
      if (insertHighlightTimerRef.current !== null) {
        clearTimeout(insertHighlightTimerRef.current);
      }
    };
  }, []);

  // Cleanup new-list insert timer on unmount
  useEffect(() => {
    return () => {
      if (newListInsertTimerRef.current !== null) {
        clearTimeout(newListInsertTimerRef.current);
      }
    };
  }, []);

  // Cleanup list insert highlight timer on unmount
  useEffect(() => {
    return () => {
      if (listInsertHighlightTimerRef.current !== null) {
        clearTimeout(listInsertHighlightTimerRef.current);
      }
    };
  }, []);

  // Cleanup list-item insert highlight timer on unmount
  useEffect(() => {
    return () => {
      if (listItemHighlightTimerRef.current !== null) {
        clearTimeout(listItemHighlightTimerRef.current);
      }
    };
  }, []);

  // Cleanup clear list timer on unmount
  useEffect(() => {
    return () => {
      if (clearListTimerRef.current !== null) {
        clearTimeout(clearListTimerRef.current);
      }
    };
  }, []);

  // Persist reminders to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged(STORAGE_KEY, JSON.stringify(reminders));
    } catch {
      // Fail silently - storage may be full or unavailable
    }
  }, [reminders]);

  useEffect(() => {
    void syncReminderNotifications(reminders, notifAppBadge, notifIncludeTodayInBadge);
  }, [reminders, notifAppBadge, notifIncludeTodayInBadge]);

  // Persist onboarding tutorial feature flag to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-onboarding-tutorial', String(isOnboardingTutorialEnabled));
    } catch {
      // Fail silently
    }
  }, [isOnboardingTutorialEnabled]);

  // Persist paywall feature flag to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('dev.listsEnabled', String(isListsEnabled));
    } catch {
      // Fail silently
    }
  }, [isListsEnabled]);

  // Persist tutorial first-launch toggle to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-tutorial-first-launch', String(showTutorialOnFirstLaunch));
    } catch {
      // Fail silently
    }
  }, [showTutorialOnFirstLaunch]);

  // Persist tutorial every-start toggle to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-tutorial-every-start', String(showTutorialOnEveryStart));
    } catch {
      // Fail silently
    }
  }, [showTutorialOnEveryStart]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-dev-one-minute-time-increments', String(useOneMinuteTimeIncrements));
    } catch {
      // Fail silently
    }
  }, [useOneMinuteTimeIncrements]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-smart-reminders', String(smartRemindersFeatureEnabled));
    } catch {
      // Fail silently
    }
  }, [smartRemindersFeatureEnabled]);
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-saved-lists', String(savedListsFeatureEnabled));
    } catch {
      // Fail silently
    }
  }, [savedListsFeatureEnabled]);
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-pinned-lists', String(pinnedListsFeatureEnabled));
    } catch {
      // Fail silently
    }
  }, [pinnedListsFeatureEnabled]);
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-settings-menu-v2', String(settingsMenuFeatureEnabled));
    } catch {
      // Fail silently
    }
  }, [settingsMenuFeatureEnabled]);
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-info-icons', String(showInfoIcons));
    } catch {
      // Fail silently
    }
  }, [showInfoIcons]);
  useEffect(() => {
    setActiveFilter((current) => getFilterForSettingsMenu(current, settingsMenuFeatureEnabled));
  }, [settingsMenuFeatureEnabled]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-ff-siri-shortcuts', String(siriShortcutsEnabled));
    } catch {
      // Fail silently
    }
  }, [siriShortcutsEnabled]);

  useEffect(() => {
    try {
      persistStringIfChanged(DEFAULT_TEMPLATES_IN_CLEAN_STATE_STORAGE_KEY, String(useDefaultTemplatesInCleanState));
    } catch {
      // Fail silently
    }
  }, [useDefaultTemplatesInCleanState]);

  useEffect(() => {
    if (!savedListMenuId && !templateEditorMenuId) {
      clearSavedListUseFeedbackTimers();
      setSavedListUseFeedback(null);
    }
  }, [clearSavedListUseFeedbackTimers, savedListMenuId, templateEditorMenuId]);

  useEffect(() => {
    if (!listInfoOverlayListId && createTemplateFeedback?.source === 'list-info') {
      clearCreateTemplateFeedbackTimers();
      setCreateTemplateFeedback(null);
    }
  }, [clearCreateTemplateFeedbackTimers, createTemplateFeedback, listInfoOverlayListId]);

  useEffect(() => {
    if (!isListSettingsOpen && createTemplateFeedback?.source === 'list-settings') {
      clearCreateTemplateFeedbackTimers();
      setCreateTemplateFeedback(null);
    }
  }, [clearCreateTemplateFeedbackTimers, createTemplateFeedback, isListSettingsOpen]);

  useEffect(() => {
    if (!isSavedListsOverlayOpen && templateEditorMenuId) {
      setTemplateEditorMenuId(null);
    }
  }, [isSavedListsOverlayOpen, templateEditorMenuId]);

  useEffect(() => () => {
    clearSavedListUseFeedbackTimers();
  }, [clearSavedListUseFeedbackTimers]);

  useEffect(() => () => {
    clearCreateTemplateFeedbackTimers();
  }, [clearCreateTemplateFeedbackTimers]);

  useEffect(() => {
    let lastRefreshTs = 0;
    const DEDUP_MS = 500;

    const triggerRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshTs < DEDUP_MS) return;
      lastRefreshTs = now;
      setTimeRefreshTick((tick) => tick + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const appListener = CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        triggerRefresh();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void appListener.then((handle) => handle.remove());
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const ms = getNextTimeRefreshBoundary(reminders, now);
    if (ms == null) return;
    const boundaryTs = now.getTime() + ms;
    let timerId: number;
    const check = () => {
      if (Date.now() >= boundaryTs + 100) {
        setTimeRefreshTick((tick) => tick + 1);
      } else {
        const remaining = boundaryTs + 100 - Date.now();
        timerId = window.setTimeout(check, Math.min(remaining, 30_000));
      }
    };
    timerId = window.setTimeout(check, Math.min(ms + 100, 30_000));
    return () => { clearTimeout(timerId); };
  }, [reminders, timeRefreshTick]);

  useEffect(() => {
    if (!isListsEnabled) {
      setSmartRemindersFeatureEnabled(false);
    }
  }, [isListsEnabled]);

  // Persist dev tools password required toggle to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-dev-tools-password-required', String(isDevToolsPasswordRequired));
    } catch {
      // Fail silently
    }
  }, [isDevToolsPasswordRequired]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-notif-reminder-alerts', String(notifReminderAlerts));
    } catch {
      // Fail silently
    }
  }, [notifReminderAlerts]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-notif-app-badge', String(notifAppBadge));
    } catch {
      // Fail silently
    }
  }, [notifAppBadge]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-notif-include-today-in-badge', String(notifIncludeTodayInBadge));
    } catch {
      // Fail silently
    }
  }, [notifIncludeTodayInBadge]);

  useEffect(() => {
    if (!notifAppBadge) {
      void Badge.clear();
      return;
    }
    const count = computeBadgeCount(reminders, notifIncludeTodayInBadge, new Date());
    void Badge.set({ count });
  }, [reminders, notifAppBadge, notifIncludeTodayInBadge, timeRefreshTick]);

  // Persist created lists to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-created-lists', JSON.stringify(createdLists));
    } catch {
      // Fail silently
    }
  }, [createdLists]);

  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-saved-lists', JSON.stringify(savedLists));
    } catch {
      // Fail silently
    }
  }, [savedLists]);

  useEffect(() => {
    setReminders((prev) => {
      const desiredLists = isSmartRemindersEnabled
        ? createdLists.filter((list) => list.status === 'active' && list.smartReminders === true && list.smartReminderDueDate)
        : [];

      const desiredByListId = new Map(desiredLists.map((list) => [list.id, list]));
      const next: Reminder[] = [];
      let changed = false;
      const seenSmartListIds = new Set<string>();

      for (const reminder of prev) {
        if (!reminder.isSmartReminder || !reminder.linkedListId) {
          next.push(reminder);
          continue;
        }

        const isActiveSmartReminder =
          reminder.completedAt == null && reminder.deletedAt == null;

        const linkedList = desiredByListId.get(reminder.linkedListId);
        if (!linkedList) {
          if (!isActiveSmartReminder) {
            next.push(reminder);
          } else {
            changed = true;
          }
          continue;
        }

        if (!linkedList.smartReminders) {
          if (!isActiveSmartReminder) {
            next.push(reminder);
          } else {
            changed = true;
          }
          continue;
        }

        if (!isActiveSmartReminder) {
          next.push(reminder);
          continue;
        }

        if (seenSmartListIds.has(reminder.linkedListId)) {
          changed = true;
          continue;
        }

        seenSmartListIds.add(reminder.linkedListId);
        const nextText = buildSmartReminderText(linkedList);
        const nextDate = linkedList.smartReminderDueDate!;
        const nextTime = getSmartReminderTime(linkedList.smartReminderTime);
        const needsUpdate =
          reminder.originalText !== nextText ||
          reminder.displayText !== nextText ||
          reminder.schedule.kind !== "scheduled" ||
          reminder.schedule.date !== nextDate ||
          reminder.schedule.time !== nextTime ||
          reminder.linkedListId !== linkedList.id ||
          reminder.isSmartReminder !== true;

        if (needsUpdate) {
          changed = true;
          next.push({
            ...reminder,
            originalText: nextText,
            displayText: nextText,
            schedule: { kind: "scheduled", date: nextDate, time: nextTime },
            linkedListId: linkedList.id,
            isSmartReminder: true,
          });
        } else {
          next.push(reminder);
        }
      }

      for (const list of desiredLists) {
        if (seenSmartListIds.has(list.id)) continue;
        if (!list.smartReminders) continue;
        const smartReminder = createSmartReminderForList(list);
        if (!smartReminder) continue;
        next.push(smartReminder);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [createdLists, isSmartRemindersEnabled]);

  // Persist active main tab to localStorage
  useEffect(() => {
    try {
      persistStringIfChanged('reminderly-active-main-tab', activeMainTab);
    } catch {
      // Fail silently
    }
  }, [activeMainTab]);

  const getTutorialSeenStorageKey = (variant: TutorialVariant) => (
    variant === 'lists' ? 'reminderly-tutorial-lists-shown' : 'reminderly-tutorial-reminders-shown'
  );

  const markTutorialSeen = (variant: TutorialVariant) => {
    try {
      localStorage.setItem(getTutorialSeenStorageKey(variant), 'true');
    } catch {
      // Fail silently
    }
  };

  const tutorialVariantsShownThisSessionRef = useRef<Set<TutorialVariant>>(new Set());

  const openTutorial = useCallback((variant: TutorialVariant) => {
    tutorialVariantsShownThisSessionRef.current.add(variant);
    setTutorialVariant(variant);
    setIsTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    markTutorialSeen(tutorialVariant);
    setIsTutorialOpen(false);
  }, [tutorialVariant]);

  // Auto-launch tutorial on mount based on toggle states
  useEffect(() => {
    const pendingTappedReminderId = localStorage.getItem(PENDING_NOTIFICATION_REMINDER_ID_KEY);
    if (pendingTappedReminderId) return;
    if (!isOnboardingTutorialEnabled) return;
    if (!showTutorialOnFirstLaunch && !showTutorialOnEveryStart) return;
    const initialTutorialVariant: TutorialVariant = activeMainTab === 'lists' && isListsEnabled ? 'lists' : 'reminders';
    openTutorial(initialTutorialVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasHandledTutorialTabTransitionRef = useRef(false);

  useEffect(() => {
    if (!hasHandledTutorialTabTransitionRef.current) {
      hasHandledTutorialTabTransitionRef.current = true;
      return;
    }
    if (!isOnboardingTutorialEnabled) return;
    if (!showTutorialOnFirstLaunch && !showTutorialOnEveryStart) return;
    if (isTutorialOpen) return;
    const nextTutorialVariant: TutorialVariant = activeMainTab === 'lists' && isListsEnabled ? 'lists' : 'reminders';
    if (!tutorialVariantsShownThisSessionRef.current.has(nextTutorialVariant)) {
      openTutorial(nextTutorialVariant);
    }
  }, [activeMainTab, isListsEnabled, isOnboardingTutorialEnabled, isTutorialOpen, openTutorial, showTutorialOnEveryStart, showTutorialOnFirstLaunch]);


  // Helper: cancel and delete entries for a given id from all timer maps.
  const cancelAllTimersForId = (id: string) => {
    const maps = [completionTimersRef, uncompleteTimersRef, pendingDeleteTimersRef, undeleteTimersRef, rescheduleTimersRef];
    for (const map of maps) {
      const t = map.current.get(id);
      if (t !== undefined) {
        clearTimeout(t);
        map.current.delete(id);
      }
    }
  };

  // Helper: remove a given id from all pending visual sets and pending ref maps.
  const clearPendingStateForId = (id: string) => {
    setPendingDoneIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPendingUncompleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPendingDeleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPendingUndeleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    pendingUncompleteCompletedAtRef.current.delete(id);
    pendingUndeleteSortKeyRef.current.delete(id);
  };

  const addReminder = useCallback((reminder: Reminder) => {
    // Haptic feedback on new reminder
    hapticTap('createReminder');

    // Cancel any pending insert timer (last-one-wins)
    if (newReminderInsertTimerRef.current !== null) {
      clearTimeout(newReminderInsertTimerRef.current);
    }
    newReminderInsertTimerRef.current = window.setTimeout(() => {
      newReminderInsertTimerRef.current = null;
      setReminders((prev) => [...prev, reminder]);
      setReinsertedId(reminder.id);
      setInsertHighlightId(reminder.id);
      if (insertHighlightTimerRef.current !== null) {
        clearTimeout(insertHighlightTimerRef.current);
      }
      insertHighlightTimerRef.current = window.setTimeout(() => {
        insertHighlightTimerRef.current = null;
        setInsertHighlightId(null);
      }, INSERT_HIGHLIGHT_MS);
    }, NEW_REMINDER_INSERT_DELAY);
  }, []);

  useEffect(() => {
    const PENDING_SIRI_TEXT_KEY = 'reminderly.pendingSiriText';
    const SIRI_ADD_EVENT = 'reminderly:siri-add';

    const handleSiriAdd = () => {
      const text = localStorage.getItem(PENDING_SIRI_TEXT_KEY);
      if (!text) return;
      localStorage.removeItem(PENDING_SIRI_TEXT_KEY);

      if (!siriShortcutsEnabled) return;

      const tokens = parseTokens(text);
      const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

      let selectedDate: Date | null = null;
      let selectedTime: { hour: number; minute: number } | null = null;
      let repeatConfig: import("./reminder-utils").RepeatConfig = null;

      for (const action of actions) {
        const result = computeTokenClickResult(action.token);
        if (!result) continue;
        if (result.dateValue) selectedDate = result.dateValue;
        if (result.timeValue) selectedTime = result.timeValue;
        if (result.repeatConfig) repeatConfig = result.repeatConfig;
      }

      const toYyyyMmDd = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };
      const toHhMm = (h: number, min: number) =>
        `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Fallback: extract absolute month-name dates the NLC parser doesn't handle
      if (!selectedDate) {
        const mdMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\s*(?:am|pm)\b)(?:\s+(\d{4}))?\b/i);
        const dmMatch = !mdMatch ? text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?\b/i) : null;
        const absMatch = mdMatch || dmMatch;
        if (absMatch) {
          const monthStr = mdMatch ? absMatch[1] : absMatch[2];
          const dayStr = mdMatch ? absMatch[2] : absMatch[1];
          const yearStr = absMatch[3];
          const month = MONTH_NAME_TO_NUMBER[monthStr.toLowerCase()];
          const day = parseInt(dayStr, 10);
          if (month && day >= 1 && day <= 31) {
            const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
            selectedDate = new Date(year, month - 1, day);
          }
        }
      }

      if (!selectedDate && selectedTime) {
        selectedDate = new Date();
      }

      let schedule: import("./reminder-utils").ReminderSchedule;
      if (selectedDate) {
        schedule = {
          kind: 'scheduled',
          date: toYyyyMmDd(selectedDate),
          ...(selectedTime ? { time: toHhMm(selectedTime.hour, selectedTime.minute) } : {}),
        };
      } else {
        schedule = { kind: 'sometime' };
      }

      const repeatRule = repeatConfigToRule(repeatConfig);
      const now = new Date();
      const displayText = schedule.kind === 'scheduled'
        ? normaliseReminderText(text, schedule, repeatRule, now, { skipDateInjection: true, skipTimeInjection: true })
        : text;

      const reminder: Reminder = {
        id: crypto.randomUUID(),
        originalText: text,
        displayText,
        createdAt: Date.now(),
        schedule,
        repeatRule,
      };
      addReminder(reminder);
    };

    handleSiriAdd();
    window.addEventListener(SIRI_ADD_EVENT, handleSiriAdd);
    return () => window.removeEventListener(SIRI_ADD_EVENT, handleSiriAdd);
  }, [siriShortcutsEnabled, addReminder]);

  const addReminders = useCallback((newReminders: Reminder[]) => {
    // Cancel any pending insert timer (last-one-wins)
    if (newReminderInsertTimerRef.current !== null) {
      clearTimeout(newReminderInsertTimerRef.current);
    }
    newReminderInsertTimerRef.current = window.setTimeout(() => {
      newReminderInsertTimerRef.current = null;
      setReminders((prev) => {
        const existingTexts = new Set(prev.map((r) => r.originalText));
        const unique = newReminders.filter((r) => !existingTexts.has(r.originalText));
        if (unique.length > 0) {
          setReinsertedId(unique[unique.length - 1].id);
          setInsertHighlightId(unique[unique.length - 1].id);
          if (insertHighlightTimerRef.current !== null) {
            clearTimeout(insertHighlightTimerRef.current);
          }
          insertHighlightTimerRef.current = window.setTimeout(() => {
            insertHighlightTimerRef.current = null;
            setInsertHighlightId(null);
          }, INSERT_HIGHLIGHT_MS);
        }
        return [...prev, ...unique];
      });
    }, NEW_REMINDER_INSERT_DELAY);
  }, []);

  // Update an existing reminder in place (id unchanged)
  const updateReminder = useCallback((updated: Reminder) => {
    if (updated.isSmartReminder === true && updated.linkedListId) {
      if (updated.schedule.kind !== 'scheduled') return;
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === updated.linkedListId
            ? {
                ...list,
                smartReminders: true,
                smartReminderDueDate: updated.schedule.date,
                smartReminderTime: updated.schedule.time ?? getSmartReminderTime(list.smartReminderTime),
              }
            : list
        )
      );
      if (editingListId === updated.linkedListId) {
        setListSmartReminders(true);
        setListSmartReminderDueDate(updated.schedule.date);
        setListSmartReminderTime(updated.schedule.time ?? getSmartReminderTime(listSmartReminderTime));
      }
      return;
    }
    setReminders((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }, [editingListId, listSmartReminderTime]);

  // Convert RepeatRule → RepeatConfig for edit mode initialisation
  const repeatRuleToConfig = (rule: RepeatRule | null | undefined): RepeatConfig => {
    if (!rule) return null;
    const ABBREV_TO_DAY: Record<string, string> = {
      mo: 'Monday', tu: 'Tuesday', we: 'Wednesday', th: 'Thursday',
      fr: 'Friday', sa: 'Saturday', su: 'Sunday',
    };
    if (rule.frequency === 'weekly' && rule.byDay && rule.byDay.length > 0) {
      return {
        frequency: 'custom-days',
        interval: rule.byDay.length,
        selectedDays: rule.byDay.map(d => ABBREV_TO_DAY[d] ?? d),
      };
    }
    return {
      frequency: rule.frequency,
      interval: rule.interval,
    };
  };

  const createSmartReminderFromPanel = useCallback(({ listId, date, time }: { listId: string; date: string; time: string | null }) => {
    smartReminderCreateDidSaveRef.current = true;
    setCreatedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              smartReminders: true,
              smartReminderDueDate: date,
              smartReminderTime: time ?? getSmartReminderTime(list.smartReminderTime),
            }
          : list
      )
    );
    if (editingListId === listId) {
      setListSmartReminders(true);
      setListSmartReminderDueDate(date);
      setListSmartReminderTime(time ?? getSmartReminderTime(listSmartReminderTime));
    }
    setPendingListInfoSmartReminderListId(null);
    pendingSmartReminderCreateRef.current = null;
    setSmartReminderCreateListId(null);
  }, [editingListId, listSmartReminderTime]);
  const smartReminderCreateList = smartReminderCreateListId
    ? (createdLists.find((list) => list.id === smartReminderCreateListId) ?? null)
    : null;

  const handleOverlayClose = useCallback(() => {
    const pendingSmartReminderCreate = pendingSmartReminderCreateRef.current;
    if (pendingSmartReminderCreate && !smartReminderCreateDidSaveRef.current) {
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === pendingSmartReminderCreate.listId
            ? {
                ...list,
                smartReminders: pendingSmartReminderCreate.previousSmartReminders,
                smartReminderDueDate: pendingSmartReminderCreate.previousDueDate,
                smartReminderTime: pendingSmartReminderCreate.previousTime,
              }
            : list
        )
      );
      if (pendingSmartReminderCreate.source === 'list-settings' && editingListId === pendingSmartReminderCreate.listId) {
        setListSmartReminders(pendingSmartReminderCreate.previousSmartReminders);
        setListSmartReminderDueDate(pendingSmartReminderCreate.previousDueDate);
        setListSmartReminderTime(pendingSmartReminderCreate.previousTime);
      }
      setPendingListInfoSmartReminderListId(null);
    }
    pendingSmartReminderCreateRef.current = null;
    smartReminderCreateDidSaveRef.current = false;
    setSmartReminderCreateListId(null);
    setIsOverlayOpen(false);
    setIsReminderOverlayFocusReady(false);
    setRepeatConfig(null);
    setEditingReminder(null);
  }, [editingListId]);

  useEffect(() => {
    if (isOverlayOpen) {
      setIsReminderOverlayFocusReady(false);
    }
  }, [isOverlayOpen]);

  // Track viewport height for overlay positioning
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    _onPersistenceError = () => setPersistenceError(true);
    _onPersistenceSuccess = () => setPersistenceError(false);
    return () => { _onPersistenceError = null; _onPersistenceSuccess = null; };
  }, []);

  // Calculate overlay top position based on viewport height
  const getOverlayTopPosition = () => {
    const THRESHOLD = 570;
    const DEFAULT_TOP = 121.653; // 16px below logo: 20px + 50px + 35.653px + 16px
    const ABOVE_LOGO_TOP = 54; // 16px above logo: 20px + 50px - 16px
    
    if (viewportHeight <= THRESHOLD) {
      return ABOVE_LOGO_TOP;
    }
    return DEFAULT_TOP;
  };

  // Sliding panels stop 28px below the logo, with Lists on or off
  const getBottomSheetTopPosition = () => {
    const logoBottom = logoRef.current?.getBoundingClientRect().bottom;
    if (typeof logoBottom === "number" && Number.isFinite(logoBottom)) {
      return logoBottom + 28;
    }
    return getOverlayTopPosition();
  };

  const reminderSheetDragControls = useDragControls();
  const listsSheetDragControls = useDragControls();
  const repeatsSheetDragControls = useDragControls();
  const tutorialSheetDragControls = useDragControls();
  const remindersSettingsSheetDragControls = useDragControls();
  const listsSettingsSheetDragControls = useDragControls();
  const templatesSheetDragControls = useDragControls();

  const shouldCloseBottomSheetFromDrag = (offsetY: number, velocityY: number) => {
    return offsetY > 120 || velocityY > 600;
  };

  const handleHeaderMenuClick = useCallback(() => {
    if (isListsEnabled && activeMainTab === 'lists') {
      setIsListsSettingsPanelOpen(true);
      return;
    }
    setIsRemindersSettingsPanelOpen(true);
  }, [activeMainTab, isListsEnabled]);

  // Reminders settings panel: re-run the tutorial from its first page, then close the panel behind it
  const handleRemindersSettingsTutorialOpen = () => {
    openTutorial('reminders');
    setTimeout(() => setIsRemindersSettingsPanelOpen(false), 250);
  };

  const openSavedListEditor = (list: SavedListTemplate) => {
    setListTitle(list.title);
    setListItems(list.items.map((item) => ({ ...item, completed: false, completedAt: null })));
    setListOverlayMode('edit');
    setEditingListId(null);
    setEditingSavedListId(list.id);
    setListSortMode('alphabetical');
    setListSmartReminders(false);
    setListSmartReminderDueDate(null);
    setListSmartReminderTime(null);
    setRestoreSavedListsPanelAfterOverlayClose(savedListsPanelOpen);
    setSavedListsPanelOpen(false);
    setIsSavedListsOverlayOpen(true);
  };

  const openSavedListEditorFromTemplatesPanel = (list: SavedListTemplate) => {
    setListTitle(list.title);
    setListItems(list.items.map((item) => ({ ...item, completed: false, completedAt: null })));
    setListOverlayMode('edit');
    setEditingListId(null);
    setEditingSavedListId(list.id);
    setListSortMode('alphabetical');
    setListSmartReminders(false);
    setListSmartReminderDueDate(null);
    setListSmartReminderTime(null);
    setRestoreSavedListsPanelAfterOverlayClose(false);
    setSavedListsPanelOpen(true);
    setIsSavedListsOverlayOpen(true);
  };

  const openListEditor = (list: CreatedList) => {
    if (openListEditorTimerRef.current !== null) {
      window.clearTimeout(openListEditorTimerRef.current);
      openListEditorTimerRef.current = null;
    }
    setListInfoOverlayListId(null);
    setListTitle("");
    setListItems([]);
    setListSortMode('insertion');
    setListSmartReminders(false);
    setListSmartReminderDueDate(null);
    setListSmartReminderTime(null);
    setListOverlayMode('edit');
    setEditingListId(list.id);
    setIsListsOverlayOpen(true);
    openListEditorTimerRef.current = window.setTimeout(() => {
      openListEditorTimerRef.current = null;
      setRevealedDeleteListItemId(null);
      setListItemReinsertedId(null);
      setListItemHighlightId(null);
      setAlphabeticalPinnedListItemId(null);
      setAlphabeticalPinnedListItemIndex(0);
      setListTitle(list.title);
      setListItems(list.items.map((item) => ({ id: (item as any).id || crypto.randomUUID(), ...item })));
      setListSortMode(list.sortMode || 'insertion');
      setListSmartReminders(list.smartReminders ?? false);
      setListSmartReminderDueDate(list.smartReminderDueDate ?? null);
      setListSmartReminderTime(list.smartReminderTime ?? null);
    }, 0);
  };

  const useSavedList = (list: SavedListTemplate) => {
    const newId = crypto.randomUUID();
    setCreatedLists((prev) => [...prev, {
      id: newId,
      title: list.title,
      items: list.items.map((item) => ({ ...item, id: crypto.randomUUID(), completed: false, completedAt: null })),
      sortMode: 'insertion',
      pinnedAt: null,
      smartReminders: false,
      smartReminderDueDate: null,
      smartReminderTime: null,
      status: 'active',
      statusChangedAt: null,
    }]);
    return newId;
  };

  const createTemplateFromListData = useCallback((title: string, items: ListItem[]) => {
    const createdTemplate: SavedListTemplate = {
      id: crypto.randomUUID(),
      title,
      items: items.map((item) => ({
        id: crypto.randomUUID(),
        text: item.text,
        completed: false,
        completedAt: null,
      })),
      status: 'active',
      statusChangedAt: null,
    };
    setSavedLists((prev) => [...prev, createdTemplate]);
    return createdTemplate;
  }, []);

  const openCreatedTemplateFromFeedback = useCallback((feedback: { source: 'list-info' | 'list-settings'; createdTemplate: SavedListTemplate }) => {
    clearCreateTemplateFeedbackTimers();
    setCreateTemplateFeedback(null);

    if (feedback.source === 'list-info') {
      setListInfoOverlayListId(null);
    } else {
      closeListSettingsOverlay();
      setIsListsOverlayOpen(false);
    }

    setSavedListsPanelOpen(true);
    setActiveMainTab('lists');
    const openDelayMs = feedback.source === 'list-settings' ? 400 : 150;
    window.setTimeout(() => {
      openSavedListEditorFromTemplatesPanel(feedback.createdTemplate);
    }, openDelayMs);
  }, [clearCreateTemplateFeedbackTimers]);

  const handleCreateTemplateFromListInfoFeedback = useCallback((list: CreatedList) => {
    if (createTemplateFeedback?.source === 'list-info' && createTemplateFeedback.key === list.id && createTemplateFeedback.stage === 'go') {
      openCreatedTemplateFromFeedback(createTemplateFeedback);
      return;
    }
    if (createTemplateFeedback?.source === 'list-info' && createTemplateFeedback.key === list.id && createTemplateFeedback.stage !== 'idle') return;

    const createdTemplate = createTemplateFromListData(list.title, list.items);
    clearCreateTemplateFeedbackTimers();
    setCreateTemplateFeedback({ source: 'list-info', key: list.id, createdTemplate, stage: 'fill' });

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-info' && current.key === list.id ? { ...current, stage: 'copied' } : current
      ));
    }, 150));

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-info' && current.key === list.id ? { ...current, stage: 'blank' } : current
      ));
    }, 1300));

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-info' && current.key === list.id ? { ...current, stage: 'go' } : current
      ));
    }, 1550));
  }, [clearCreateTemplateFeedbackTimers, createTemplateFeedback, createTemplateFromListData, openCreatedTemplateFromFeedback]);

  const handleToggleListPinned = useCallback((listId: string) => {
    if (!pinnedListsFeatureEnabled) return;
    setCreatedLists((prev) => prev.map((list) => (
      list.id === listId
        ? { ...list, pinnedAt: typeof list.pinnedAt === 'number' ? null : Date.now() }
        : list
    )));
  }, [pinnedListsFeatureEnabled]);

  const handleCreateTemplateFromListSettingsFeedback = useCallback(() => {
    const key = editingListId ?? 'list-settings';

    if (createTemplateFeedback?.source === 'list-settings' && createTemplateFeedback.key === key && createTemplateFeedback.stage === 'go') {
      openCreatedTemplateFromFeedback(createTemplateFeedback);
      return;
    }
    if (createTemplateFeedback?.source === 'list-settings' && createTemplateFeedback.key === key && createTemplateFeedback.stage !== 'idle') return;

    const createdTemplate = createTemplateFromListData(listTitle, listItems);
    clearCreateTemplateFeedbackTimers();
    setCreateTemplateFeedback({ source: 'list-settings', key, createdTemplate, stage: 'fill' });

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-settings' && current.key === key ? { ...current, stage: 'copied' } : current
      ));
    }, 150));

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-settings' && current.key === key ? { ...current, stage: 'blank' } : current
      ));
    }, 1300));

    createTemplateFeedbackTimersRef.current.push(window.setTimeout(() => {
      setCreateTemplateFeedback((current) => (
        current?.source === 'list-settings' && current.key === key ? { ...current, stage: 'go' } : current
      ));
    }, 1550));
  }, [clearCreateTemplateFeedbackTimers, createTemplateFeedback, createTemplateFromListData, editingListId, listItems, listTitle, openCreatedTemplateFromFeedback]);

  const handleUseSavedListWithFeedback = useCallback((list: SavedListTemplate) => {
    if (savedListUseFeedback?.id === list.id && savedListUseFeedback.stage === 'go') {
      setSavedListMenuId(null);
      setSavedListsPanelOpen(false);
      setActiveMainTab('lists');
      window.setTimeout(() => {
        openListOverlayForListId(savedListUseFeedback.createdListId);
      }, 150);
      return;
    }
    if (savedListUseFeedback?.id === list.id && savedListUseFeedback.stage !== 'idle') return;

    const createdListId = useSavedList(list);
    clearSavedListUseFeedbackTimers();
    setSavedListUseFeedback({ id: list.id, createdListId, stage: 'fill' });

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'copied' } : current
      ));
    }, 150));

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'blank' } : current
      ));
    }, 1300));

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'go' } : current
      ));
    }, 1550));
  }, [clearSavedListUseFeedbackTimers, openListOverlayForListId, savedListUseFeedback]);

  const handleUseSavedListFromTemplateEditorFeedback = useCallback((list: SavedListTemplate) => {
    if (savedListUseFeedback?.id === list.id && savedListUseFeedback.stage === 'go') {
      setTemplateEditorMenuId(null);
      setIsSavedListsOverlayOpen(false);
      setSavedListsPanelOpen(false);
      setActiveMainTab('lists');
      window.setTimeout(() => {
        openListOverlayForListId(savedListUseFeedback.createdListId);
      }, 400);
      return;
    }
    if (savedListUseFeedback?.id === list.id && savedListUseFeedback.stage !== 'idle') return;

    const createdListId = useSavedList(list);
    clearSavedListUseFeedbackTimers();
    setSavedListUseFeedback({ id: list.id, createdListId, stage: 'fill' });

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'copied' } : current
      ));
    }, 150));

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'blank' } : current
      ));
    }, 1300));

    savedListUseFeedbackTimersRef.current.push(window.setTimeout(() => {
      setSavedListUseFeedback((current) => (
        current?.id === list.id ? { ...current, stage: 'go' } : current
      ));
    }, 1550));
  }, [clearSavedListUseFeedbackTimers, openListOverlayForListId, savedListUseFeedback]);

  const handleSavedListDeleteClick = (savedListId: string) => {
    if (deleteSavedListTimersRef.current.has(savedListId)) return;

    setPendingDeletedSavedListIds((prev) => {
      const next = new Set(prev);
      next.add(savedListId);
      return next;
    });
    setSavedListMenuId(null);

    const timer = window.setTimeout(() => {
      deleteSavedListTimersRef.current.delete(savedListId);
      setSavedLists((prev) => prev.map((list) => (
        list.id === savedListId ? { ...list, status: 'deleted', statusChangedAt: Date.now() } : list
      )));
      setPendingDeletedSavedListIds((prev) => {
        const next = new Set(prev);
        next.delete(savedListId);
        return next;
      });
    }, COMPLETION_DELAY);

    deleteSavedListTimersRef.current.set(savedListId, timer);
  };

  const handleSavedListRestoreClick = (savedListId: string) => {
    setSavedLists((prev) => prev.map((list) => (
      list.id === savedListId ? { ...list, status: 'active', statusChangedAt: null } : list
    )));
  };

  const runOverlayDeleteSequence = useCallback((closeOverlay: () => void, closePanel: () => void, deleteAction: () => void) => {
    closeOverlay();
    window.setTimeout(() => {
      closePanel();
      window.setTimeout(() => {
        deleteAction();
      }, 50);
    }, 50);
  }, []);

  const handleLogoClick = () => {
    clickCountRef.current += 1;

    if (clickCountRef.current === 3) {
      setIsDevToolsOpen(true);
      clickCountRef.current = 0;
      if (clickTimerRef.current !== null) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    } else {
      if (clickTimerRef.current !== null) {
        clearTimeout(clickTimerRef.current);
      }
      clickTimerRef.current = window.setTimeout(() => {
        clickCountRef.current = 0;
        clickTimerRef.current = null;
      }, 500);
    }
  };

  // Logo tick click: toggle between done-deleted view and "all" list view
  const handleTickClick = () => {
    if (isListsEnabled && activeMainTab === 'lists') {
      setViewMode((prev) => (prev === 'lists-done' ? 'list' : 'lists-done'));
    } else {
      setViewMode((prev) => (prev === "list" ? "done-deleted" : "list"));
    }
    setActiveFilter("all");
    setDoneDeletedFilter('all');
    setClearListStep(0);
    if (clearListTimerRef.current !== null) {
      clearTimeout(clearListTimerRef.current);
      clearListTimerRef.current = null;
    }
  };

  const getCategoryLabel = (category: ReminderCategory) => {
    const labels: Record<ReminderCategory, string> = {
      today: "Today",
      "this-week": "This week",
      later: "Later",
      sometime: "Sometime",
      other: "Later",
    };
    return labels[category];
  };

  const handleListCompleteClick = useCallback((listId: string) => {
    if (completeListTimersRef.current.has(listId)) return;
    if (deleteListTimersRef.current.has(listId)) return;

    hapticTap('markListComplete');

    setPendingDoneListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });

    const timer = window.setTimeout(() => {
      completeListTimersRef.current.delete(listId);
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) => ({ ...item, completed: true, completedAt: Date.now() })),
                status: 'done',
                statusChangedAt: Date.now(),
              }
            : list
        )
      );
      const linkedReminder = reminders.find((reminder) => reminder.isSmartReminder === true && reminder.linkedListId === listId && reminder.completedAt == null && reminder.deletedAt == null);
      if (linkedReminder) {
        handleCompleteClickRef.current?.(linkedReminder.id, { source: 'list-sync' });
      }
      setPendingDoneListIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }, COMPLETION_DELAY);

    completeListTimersRef.current.set(listId, timer);
  }, [reminders]);

  const handleListUndoClick = useCallback((listId: string) => {
    if (undoListTimersRef.current.has(listId)) return;
    if (undeleteListTimersRef.current.has(listId)) return;

    const target = createdLists.find((list) => list.id === listId);
    if (!target || target.status !== 'done') return;

    hapticTap('undoListCompletion');

    pendingUndoneListStatusChangedAtRef.current.set(listId, target.statusChangedAt ?? Date.now());
    setCreatedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => ({ ...item, completed: false, completedAt: null })),
              status: 'active',
              statusChangedAt: null,
            }
          : list
      )
    );
    const linkedReminder = reminders.find((reminder) => reminder.isSmartReminder === true && reminder.linkedListId === listId && reminder.completedAt != null && reminder.deletedAt == null);
    if (linkedReminder) {
      handleUncompleteClickRef.current?.(linkedReminder.id, { source: 'list-sync' });
    }

    setListReinsertedId(listId);
    setListInsertHighlightId(listId);
    if (listInsertHighlightTimerRef.current !== null) {
      clearTimeout(listInsertHighlightTimerRef.current);
    }
    listInsertHighlightTimerRef.current = window.setTimeout(() => {
      listInsertHighlightTimerRef.current = null;
      setListInsertHighlightId(null);
    }, INSERT_HIGHLIGHT_MS);

    setPendingUndoneListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });

    const timer = window.setTimeout(() => {
      undoListTimersRef.current.delete(listId);
      pendingUndoneListStatusChangedAtRef.current.delete(listId);
      setPendingUndoneListIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }, COMPLETION_DELAY);

    undoListTimersRef.current.set(listId, timer);
  }, [createdLists, reminders]);

  const handleListDeleteClick = useCallback((listId: string) => {
    if (deleteListTimersRef.current.has(listId)) return;
    if (completeListTimersRef.current.has(listId)) return;

    setPendingDeletedListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });

    const timer = window.setTimeout(() => {
      deleteListTimersRef.current.delete(listId);
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                status: 'deleted',
                statusChangedAt: Date.now(),
              }
            : list
        )
      );
      const linkedReminder = reminders.find((reminder) => reminder.isSmartReminder === true && reminder.linkedListId === listId && reminder.deletedAt == null);
      if (linkedReminder) {
        handleDeleteClickRef.current?.(linkedReminder.id, { source: 'list-sync' });
      }
      setPendingDeletedListIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }, COMPLETION_DELAY);

    deleteListTimersRef.current.set(listId, timer);
  }, [reminders]);

  const handleListUndeleteClick = useCallback((listId: string) => {
    if (undeleteListTimersRef.current.has(listId)) return;

    const target = createdLists.find((list) => list.id === listId);
    if (!target || target.status !== 'deleted') return;

    pendingUndeletedListStatusChangedAtRef.current.set(listId, target.statusChangedAt ?? Date.now());
    setCreatedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              status: 'active',
              statusChangedAt: null,
            }
          : list
      )
    );
    const linkedReminder = reminders.find((reminder) => reminder.isSmartReminder === true && reminder.linkedListId === listId && reminder.deletedAt != null);
    if (linkedReminder) {
      handleUncompleteClickRef.current?.(linkedReminder.id, { source: 'list-sync' });
    }

    setListReinsertedId(listId);
    setListInsertHighlightId(listId);
    if (listInsertHighlightTimerRef.current !== null) {
      clearTimeout(listInsertHighlightTimerRef.current);
    }
    listInsertHighlightTimerRef.current = window.setTimeout(() => {
      listInsertHighlightTimerRef.current = null;
      setListInsertHighlightId(null);
    }, INSERT_HIGHLIGHT_MS);

    setPendingUndeletedListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });

    const timer = window.setTimeout(() => {
      undeleteListTimersRef.current.delete(listId);
      pendingUndeletedListStatusChangedAtRef.current.delete(listId);
      setPendingUndeletedListIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }, COMPLETION_DELAY);

    undeleteListTimersRef.current.set(listId, timer);
  }, [createdLists, reminders]);

  // Cancel a pending repeat completion: clears all in-flight timers and reverts state.
  const cancelPendingRepeatCompletion = useCallback((reminderId: string) => {
    // Clear completion timer if still pending
    const completionTimer = completionTimersRef.current.get(reminderId);
    if (completionTimer != null) {
      clearTimeout(completionTimer);
      completionTimersRef.current.delete(reminderId);
    }
    // Clear reschedule timer if in-flight
    const rescheduleTimer = rescheduleTimersRef.current.get(reminderId);
    if (rescheduleTimer != null) {
      clearTimeout(rescheduleTimer);
      rescheduleTimersRef.current.delete(reminderId);
    }
    // Remove from pending repeat set
    pendingRepeatCompletionIdsRef.current.delete(reminderId);
    // Revert pending UI state
    setPendingDoneIds((prev) => {
      const next = new Set(prev);
      next.delete(reminderId);
      return next;
    });
    // Revert completedAt if already committed by the 350ms timer
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== reminderId) return r;
        if (r.completedAt == null) return r;
        return { ...r, completedAt: null };
      })
    );
  }, []);

  // Mark a reminder as done: immediate visual commit, then 350ms delayed data commit.
  // For repeating reminders, a second 500ms timer reschedules the next occurrence.
  const handleCompleteClick = useCallback((reminderId: string, opts?: { armEmptyDelay?: boolean; filterKey?: string; isRepeat?: boolean; source?: 'manual' | 'list-sync' }) => {
    const targetReminder = reminders.find((r) => r.id === reminderId);
    const linkedSmartListId = targetReminder?.isSmartReminder
      ? targetReminder.linkedListId ?? null
      : null;
    // Repeat reminder cancel: second click during in-flight window cancels pending completion
    if (pendingRepeatCompletionIdsRef.current.has(reminderId)) {
      cancelPendingRepeatCompletion(reminderId);
      return;
    }

    // Guard: no-op if already pending or already completed (non-repeat path)
    if (completionTimersRef.current.has(reminderId)) return;

    // Track repeat reminders across the full in-flight lifecycle
    if (opts?.isRepeat) {
      pendingRepeatCompletionIdsRef.current.add(reminderId);
    }

    // Arm empty-placeholder delay when this is the last visible item in the current active list
    if (opts?.armEmptyDelay && opts.filterKey != null) {
      emptyPlaceholderDelayRef.current = { untilMs: Date.now() + EMPTY_STATE_DELAY + 350, filterKey: opts.filterKey };
      setTimeout(() => setEmptyRerenderTick((c) => c + 1), EMPTY_STATE_DELAY + 350);
    }

    // Haptic feedback on complete
    hapticTap('markDone');

    // Immediate visual commit
    setPendingDoneIds((prev) => {
      const next = new Set(prev);
      next.add(reminderId);
      return next;
    });

    // Delayed data commit
    const timer = window.setTimeout(() => {
      completionTimersRef.current.delete(reminderId);

      // Set completedAt and schedule reschedule timer for repeating reminders.
      // Both read and timer-scheduling happen inside the updater to avoid stale closures.
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id !== reminderId) return r;

          // Schedule the 500ms reschedule timer for repeating reminders
          if (r.repeatRule != null && r.schedule.kind === 'scheduled' && r.schedule.date != null) {
            const capturedSchedule = r.schedule;
            const capturedRepeatRule = r.repeatRule;
            const capturedOriginalText = r.originalText;
            const capturedDisplayText = r.displayText;

            const rescheduleTimer = window.setTimeout(() => {
              rescheduleTimersRef.current.delete(reminderId);

              // Guard: if pending was cancelled by a second click, skip spawn entirely
              if (!pendingRepeatCompletionIdsRef.current.has(reminderId)) {
                pendingRepeatCompletionIdsRef.current.delete(reminderId);
                return;
              }

              // Build baseDateTime from the completed occurrence's scheduled date/time
              const [y, m, d] = capturedSchedule.date.split('-').map(Number);
              let baseDateTime: Date;
              if (capturedSchedule.time) {
                const [hh, mm] = capturedSchedule.time.split(':').map(Number);
                baseDateTime = new Date(y, m - 1, d, hh, mm, 0, 0);
              } else {
                baseDateTime = new Date(y, m - 1, d, 0, 0, 0, 0);
              }

              const nextOccurrence = getNextOccurrence(baseDateTime, capturedRepeatRule);

              // Validate next occurrence
              if (!(nextOccurrence instanceof Date) || isNaN(nextOccurrence.getTime())) {
                return;
              }

              const nextDate = formatDateToSchedule(nextOccurrence);
              // Preserve time if original had time; update from nextOccurrence for hourly
              const nextTime = capturedSchedule.time
                ? formatTimeToSchedule(nextOccurrence)
                : null;

              const nextScheduleObj: ReminderSchedule = nextTime != null
                ? { kind: 'scheduled' as const, date: nextDate, time: nextTime }
                : { kind: 'scheduled' as const, date: nextDate };

              // Insert next occurrence as a brand new reminder, leaving the completed one untouched.
              // Guard: check deletedAt at execution time — if deleted, skip reschedule entirely.
              const newReminder: Reminder = {
                id: crypto.randomUUID(),
                originalText: capturedOriginalText,
                displayText: capturedDisplayText,
                createdAt: Date.now(),
                schedule: nextScheduleObj,
                repeatRule: { ...capturedRepeatRule },
                completedAt: null,
              };
              setReminders((prev2) => {
                const source = prev2.find((r2) => r2.id === reminderId);
                if (source?.deletedAt != null) return prev2;
                return [...prev2, newReminder];
              });
              setReinsertedId(newReminder.id);
              setInsertHighlightId(newReminder.id);
              if (insertHighlightTimerRef.current !== null) {
                clearTimeout(insertHighlightTimerRef.current);
              }
              insertHighlightTimerRef.current = window.setTimeout(() => {
                insertHighlightTimerRef.current = null;
                setInsertHighlightId(null);
              }, INSERT_HIGHLIGHT_MS);
              // Clear pending repeat completion after successful spawn
              pendingRepeatCompletionIdsRef.current.delete(reminderId);
            }, RESCHEDULE_DELAY);

            rescheduleTimersRef.current.set(reminderId, rescheduleTimer);
          }

          return { ...r, completedAt: Date.now() };
        })
      );

      // Clear from pending visual set
      setPendingDoneIds((prev) => {
        const next = new Set(prev);
        next.delete(reminderId);
        return next;
      });

      if (linkedSmartListId && opts?.source !== 'list-sync') {
        setCreatedLists((prev) =>
          prev.map((list) =>
            list.id === linkedSmartListId
              ? { ...list, smartReminders: false }
              : list
          )
        );
      }
    }, COMPLETION_DELAY);

    completionTimersRef.current.set(reminderId, timer);
  }, [cancelPendingRepeatCompletion, reminders]);

  // Uncheck a done reminder: instant reinsertion (matches repeat reinsertion path).
  // Done view feedback preserved separately via pendingUncompleteIds + COMPLETION_DELAY.
  const handleUncompleteClick = useCallback((reminderId: string, opts?: { source?: 'manual' | 'list-sync' }) => {
    // Guard: no-op if already pending
    if (uncompleteTimersRef.current.has(reminderId)) return;

    const currentReminders = reminders;
    const target = currentReminders.find((r) => r.id === reminderId);
    const linkedSmartListId = target?.isSmartReminder ? (target.linkedListId ?? null) : null;

    // Undelete path: mirrors un-done cadence exactly
    if (target?.deletedAt != null) {
      // Guard: no-op if already pending undelete
      if (undeleteTimersRef.current.has(reminderId)) return;

      // Cancel any pending delete timer (defensive)
      const pendingDelTimer = pendingDeleteTimersRef.current.get(reminderId);
      if (pendingDelTimer !== undefined) {
        clearTimeout(pendingDelTimer);
        pendingDeleteTimersRef.current.delete(reminderId);
      }
      setPendingDeleteIds((prev) => {
        if (!prev.has(reminderId)) return prev;
        const next = new Set(prev);
        next.delete(reminderId);
        return next;
      });

      // Capture prior deletedAt for stable sort during pending window
      pendingUndeleteSortKeyRef.current.set(reminderId, target.deletedAt);

      // Haptic feedback on undelete
      hapticTap('undeleteReminder');

      // Immediately clear deletedAt (causes instant reinsertion to active list if completedAt is null)
      setReminders((prev) =>
        prev.map((r) => r.id === reminderId ? { ...r, deletedAt: null } : r)
      );

      // Trigger fade-in + highlight only if returning to active list (completedAt is null)
      if (target.completedAt == null) {
        setReinsertedId(reminderId);
        setInsertHighlightId(reminderId);
        if (insertHighlightTimerRef.current !== null) {
          clearTimeout(insertHighlightTimerRef.current);
        }
        insertHighlightTimerRef.current = window.setTimeout(() => {
          insertHighlightTimerRef.current = null;
          setInsertHighlightId(null);
        }, INSERT_HIGHLIGHT_MS);
      }

      if (linkedSmartListId && opts?.source !== 'list-sync') {
        setCreatedLists((prev) =>
          prev.map((list) =>
            list.id === linkedSmartListId
              ? { ...list, smartReminders: true }
              : list
          )
        );
      }

      // Done view feedback: show undelete visual for COMPLETION_DELAY, then remove
      setPendingUndeleteIds((prev) => {
        const next = new Set(prev);
        next.add(reminderId);
        return next;
      });

      const timer = window.setTimeout(() => {
        undeleteTimersRef.current.delete(reminderId);
        pendingUndeleteSortKeyRef.current.delete(reminderId);
        setPendingUndeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(reminderId);
          return next;
        });
      }, COMPLETION_DELAY);

      undeleteTimersRef.current.set(reminderId, timer);
      return;
    }

    // Existing uncomplete path: clear completedAt and handle repeat duplicate removal

    // 1. For repeating reminders: cancel any pending reschedule timer to prevent
    //    a stale callback from inserting a duplicate after undo.
    //    Then compute the expected next schedule for duplicate detection.
    let expectedNextSchedule: ReminderSchedule | null = null;
    let capturedOriginalText: string | null = null;
    let capturedDisplayText: string | null = null;
    let capturedRepeatRule: RepeatRule | null = null;

    if (target?.repeatRule != null) {
      // Cancel pending reschedule timer if present
      const pendingTimer = rescheduleTimersRef.current.get(reminderId);
      if (pendingTimer !== undefined) {
        clearTimeout(pendingTimer);
        rescheduleTimersRef.current.delete(reminderId);
      }

      // Compute expected next schedule for duplicate matching
      if (target.schedule.kind === 'scheduled' && target.schedule.date != null) {
        const [y, m, d] = target.schedule.date.split('-').map(Number);
        let baseDateTime: Date;
        if (target.schedule.time) {
          const [hh, mm] = target.schedule.time.split(':').map(Number);
          baseDateTime = new Date(y, m - 1, d, hh, mm, 0, 0);
        } else {
          baseDateTime = new Date(y, m - 1, d, 0, 0, 0, 0);
        }

        const nextOccurrence = getNextOccurrence(baseDateTime, target.repeatRule);

        if (nextOccurrence instanceof Date && !isNaN(nextOccurrence.getTime())) {
          const nextDate = formatDateToSchedule(nextOccurrence);
          const nextTime = target.schedule.time
            ? formatTimeToSchedule(nextOccurrence)
            : undefined;

          expectedNextSchedule = nextTime != null
            ? { kind: 'scheduled' as const, date: nextDate, time: nextTime }
            : { kind: 'scheduled' as const, date: nextDate };

          capturedOriginalText = target.originalText;
          capturedDisplayText = target.displayText;
          capturedRepeatRule = target.repeatRule;
        }
      }
    }

    // Haptic feedback on uncomplete
    hapticTap('uncompleteReminder');

    // 2. Store original completedAt for stable sort, then clear it for instant reinsertion.
    //    For repeating reminders with a computed next schedule, also remove the duplicate
    //    active instance if exactly one confident match exists.
    setReminders((prev) => {
      const targetInPrev = prev.find((r) => r.id === reminderId);
      if (targetInPrev?.completedAt != null) {
        pendingUncompleteCompletedAtRef.current.set(reminderId, targetInPrev.completedAt);
      }

      // Find duplicate active instance to remove (repeating reminders only)
      let duplicateIdToRemove: string | null = null;
      if (expectedNextSchedule != null && capturedRepeatRule != null) {
        const matches = prev.filter((r) => {
          if (r.id === reminderId) return false;
          if (r.completedAt != null) return false;
          if (r.originalText !== capturedOriginalText) return false;
          if (r.displayText !== capturedDisplayText) return false;
          if (!scheduleEquality.areRepeatsEqual(r.repeatRule ?? null, capturedRepeatRule)) return false;
          // Inline schedule equality
          if (r.schedule.kind !== expectedNextSchedule!.kind) return false;
          if (r.schedule.kind === 'scheduled' && expectedNextSchedule!.kind === 'scheduled') {
            if (r.schedule.date !== expectedNextSchedule!.date) return false;
            if ((r.schedule.time ?? undefined) !== (expectedNextSchedule!.time ?? undefined)) return false;
          }
          return true;
        });
        if (matches.length === 1) {
          duplicateIdToRemove = matches[0].id;
        }
      }

      return prev
        .filter((r) => r.id !== duplicateIdToRemove)
        .map((r) =>
          r.id === reminderId && r.completedAt != null
            ? { ...r, completedAt: null }
            : r
        );
    });

    // 3. Trigger fade-in + highlight (same flags as repeat reinsertion)
    setReinsertedId(reminderId);
    setInsertHighlightId(reminderId);
    if (insertHighlightTimerRef.current !== null) {
      clearTimeout(insertHighlightTimerRef.current);
    }
    insertHighlightTimerRef.current = window.setTimeout(() => {
      insertHighlightTimerRef.current = null;
      setInsertHighlightId(null);
    }, INSERT_HIGHLIGHT_MS);

    if (linkedSmartListId && opts?.source !== 'list-sync') {
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === linkedSmartListId
            ? { ...list, smartReminders: true }
            : list
        )
      );
    }

    // 3. Done view feedback: show uncomplete visual for COMPLETION_DELAY, then remove
    setPendingUncompleteIds((prev) => {
      const next = new Set(prev);
      next.add(reminderId);
      return next;
    });

    const timer = window.setTimeout(() => {
      uncompleteTimersRef.current.delete(reminderId);
      pendingUncompleteCompletedAtRef.current.delete(reminderId);
      setPendingUncompleteIds((prev) => {
        const next = new Set(prev);
        next.delete(reminderId);
        return next;
      });
    }, COMPLETION_DELAY);

    uncompleteTimersRef.current.set(reminderId, timer);
  }, [reminders]);

  // Delete a reminder: same cadence as done (350ms pending visual, then data commit).
  const handleDeleteClick = useCallback((reminderId: string, opts?: { armEmptyDelay?: boolean; filterKey?: string; source?: 'manual' | 'list-sync' }) => {
    const targetReminder = reminders.find((r) => r.id === reminderId);
    const linkedSmartListId = targetReminder?.isSmartReminder
      ? targetReminder.linkedListId ?? null
      : null;
    // Guard: no-op if already pending delete
    if (pendingDeleteTimersRef.current.has(reminderId)) return;

    // Arm empty-placeholder delay when this is the last visible item in the current active list
    if (opts?.armEmptyDelay && opts.filterKey != null) {
      emptyPlaceholderDelayRef.current = { untilMs: Date.now() + EMPTY_STATE_DELAY + 350, filterKey: opts.filterKey };
      setTimeout(() => setEmptyRerenderTick((c) => c + 1), EMPTY_STATE_DELAY + 350);
    }

    // Cancel all pending timers and clear all pending state for this id
    cancelAllTimersForId(reminderId);
    clearPendingStateForId(reminderId);

    // Haptic feedback on delete
    hapticTap('deleteReminder');

    // Immediate visual commit: add to pendingDeleteIds
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.add(reminderId);
      return next;
    });

    // Close info overlay
    setInfoReminder(null);

    // Delayed data commit (same COMPLETION_DELAY as done)
    const timer = window.setTimeout(() => {
      pendingDeleteTimersRef.current.delete(reminderId);

      // Set deletedAt
      setReminders((prev) =>
        prev.map((r) => r.id === reminderId ? { ...r, deletedAt: Date.now() } : r)
      );

      // Clear from pending visual set
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(reminderId);
        return next;
      });

      if (linkedSmartListId && opts?.source !== 'list-sync') {
        setCreatedLists((prev) =>
          prev.map((list) =>
            list.id === linkedSmartListId
              ? { ...list, smartReminders: false }
              : list
          )
        );
      }
    }, COMPLETION_DELAY);

    pendingDeleteTimersRef.current.set(reminderId, timer);
  }, [reminders]);

  const handleMoveReminderToTomorrow = useCallback((reminderId: string) => {
    const targetReminder = reminders.find((reminder) => reminder.id === reminderId);
    if (!targetReminder || targetReminder.schedule.kind !== "scheduled") return;

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDate = dateToStorageString(tomorrow);

    setReminders((prev) =>
      prev.map((reminder) => {
        if (reminder.id !== reminderId || reminder.schedule.kind !== "scheduled") return reminder;
        return {
          ...reminder,
          schedule: {
            ...reminder.schedule,
            date: nextDate,
          },
        };
      })
    );

    if (targetReminder.isSmartReminder === true && targetReminder.linkedListId) {
      setCreatedLists((prev) =>
        prev.map((list) =>
          list.id === targetReminder.linkedListId
            ? {
                ...list,
                smartReminderDueDate: nextDate,
                smartReminderTime:
                  targetReminder.schedule.kind === 'scheduled'
                    ? (targetReminder.schedule.time ?? getSmartReminderTime(list.smartReminderTime))
                    : getSmartReminderTime(list.smartReminderTime),
              }
            : list
        )
      );
    }
  }, [reminders]);

  useNotificationTapHandler({
    reminders,
    setActiveMainTab,
    setIsTutorialOpen,
    setIsOverlayOpen,
    setIsListsOverlayOpen,
    setIsRepeatsOverlayOpen,
    setViewMode,
    setActiveFilter,
    setInfoReminder,
    onMarkAsDone: handleCompleteClick,
    onMoveToTomorrow: handleMoveReminderToTomorrow,
  });

  useEffect(() => {
    handleCompleteClickRef.current = handleCompleteClick;
  }, [handleCompleteClick]);

  useEffect(() => {
    handleUncompleteClickRef.current = handleUncompleteClick;
  }, [handleUncompleteClick]);

  useEffect(() => {
    handleDeleteClickRef.current = handleDeleteClick;
  }, [handleDeleteClick]);

  const visibleDoneDeletedReminderCount = reminders
    .filter((r) => r.completedAt != null || r.deletedAt != null || pendingUncompleteIds.has(r.id) || pendingUndeleteIds.has(r.id))
    .filter((r) => {
      if (doneDeletedFilter === 'all') return true;
      if (doneDeletedFilter === 'done') return (r.completedAt != null && r.deletedAt == null) || pendingUncompleteIds.has(r.id);
      return r.deletedAt != null || pendingUndeleteIds.has(r.id);
    })
    .length;

  const visibleDoneDeletedListCount = createdLists
    .filter((list) => (
      list.status === 'done' ||
      list.status === 'deleted' ||
      pendingUndoneListIds.has(list.id) ||
      pendingUndeletedListIds.has(list.id)
    ))
    .filter((list) => {
      if (doneDeletedFilter === 'all') return true;
      if (doneDeletedFilter === 'done') return list.status === 'done' || pendingUndoneListIds.has(list.id);
      return list.status === 'deleted' || pendingUndeletedListIds.has(list.id);
    })
    .length;

  const visibleDeletedSavedListCount = savedLists
    .filter((list) => (list.status ?? 'active') === 'deleted')
    .filter((list) => doneDeletedFilter !== 'done')
    .length;

  const isClearAllDisabled =
    viewMode === 'done-deleted'
      ? visibleDoneDeletedReminderCount === 0
      : (isListsEnabled && activeMainTab === 'lists' && viewMode === 'lists-done')
        ? visibleDoneDeletedListCount + visibleDeletedSavedListCount === 0
        : false;

  // Clear list: 3-step confirmation handler
  const handleClearListClick = useCallback(() => {
    if (isClearAllDisabled) return;
    if (clearListStep === 2) return; // ignore clicks during "Cleared!" state

    if (clearListStep === 0) {
      setClearListStep(1);
      return;
    }

    // clearListStep === 1: execute clear
    hapticTap('clearAllDoneDeleted');
    setClearListStep(2);
    setDoneDeletedFilter('all');

    if (isListsEnabled && activeMainTab === 'lists' && viewMode === 'lists-done') {
      const savedListIdsToRemove = new Set(
        savedLists
          .filter((list) => (list.status ?? 'active') === 'deleted')
          .map((list) => list.id)
      );

      setCreatedLists((prev) => {
        const idsToRemove = new Set<string>();

        for (const list of prev) {
          if (list.status === 'done' || list.status === 'deleted') {
            idsToRemove.add(list.id);
          } 
        }

        for (const id of pendingUndoneListIds) idsToRemove.add(id);
        for (const id of pendingUndeletedListIds) idsToRemove.add(id);

        for (const id of idsToRemove) {
          const ct = completeListTimersRef.current.get(id);
          if (ct !== undefined) { clearTimeout(ct); completeListTimersRef.current.delete(id); }
          const ut = undoListTimersRef.current.get(id);
          if (ut !== undefined) { clearTimeout(ut); undoListTimersRef.current.delete(id); }
          const dt = deleteListTimersRef.current.get(id);
          if (dt !== undefined) { clearTimeout(dt); deleteListTimersRef.current.delete(id); }
          const udt = undeleteListTimersRef.current.get(id);
          if (udt !== undefined) { clearTimeout(udt); undeleteListTimersRef.current.delete(id); }
          pendingUndoneListStatusChangedAtRef.current.delete(id);
          pendingUndeletedListStatusChangedAtRef.current.delete(id);
        }

        setPendingDoneListIds((s) => {
          let changed = false;
          const next = new Set(s);
          for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
          return changed ? next : s;
        });
        setPendingUndoneListIds((s) => {
          let changed = false;
          const next = new Set(s);
          for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
          return changed ? next : s;
        });
        setPendingDeletedListIds((s) => {
          let changed = false;
          const next = new Set(s);
          for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
          return changed ? next : s;
        });
        setPendingUndeletedListIds((s) => {
          let changed = false;
          const next = new Set(s);
          for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
          return changed ? next : s;
        });

        return prev.filter((list) => !idsToRemove.has(list.id));
      });

      if (savedListIdsToRemove.size > 0) {
        setSavedLists((prev) => prev.filter((list) => !savedListIdsToRemove.has(list.id)));
        setPendingDeletedSavedListIds((current) => {
          let changed = false;
          const next = new Set(current);
          for (const id of savedListIdsToRemove) {
            if (next.delete(id)) changed = true;
          }
          return changed ? next : current;
        });
      }

      if (clearListTimerRef.current !== null) {
        clearTimeout(clearListTimerRef.current);
      }
      clearListTimerRef.current = window.setTimeout(() => {
        clearListTimerRef.current = null;
        setClearListStep(0);
      }, 500);
      return;
    }

    // Build set of ids to remove: everything visible in done/deleted list
    setReminders((prev) => {
      const idsToRemove = new Set<string>();
      for (const r of prev) {
        if (r.completedAt != null || r.deletedAt != null) {
          idsToRemove.add(r.id);
        }
      }
      // Also include pending restore items (visible in done/deleted view but data already cleared)
      for (const id of pendingUncompleteIds) idsToRemove.add(id);
      for (const id of pendingUndeleteIds) idsToRemove.add(id);

      // Cleanup timers and pending sets for removed ids
      for (const id of idsToRemove) {
        const ct = completionTimersRef.current.get(id);
        if (ct !== undefined) { clearTimeout(ct); completionTimersRef.current.delete(id); }
        const ut = uncompleteTimersRef.current.get(id);
        if (ut !== undefined) { clearTimeout(ut); uncompleteTimersRef.current.delete(id); }
        const rt = rescheduleTimersRef.current.get(id);
        if (rt !== undefined) { clearTimeout(rt); rescheduleTimersRef.current.delete(id); }
        const dt = pendingDeleteTimersRef.current.get(id);
        if (dt !== undefined) { clearTimeout(dt); pendingDeleteTimersRef.current.delete(id); }
        const udt = undeleteTimersRef.current.get(id);
        if (udt !== undefined) { clearTimeout(udt); undeleteTimersRef.current.delete(id); }
        pendingUncompleteCompletedAtRef.current.delete(id);
        pendingUndeleteSortKeyRef.current.delete(id);
      }

      // Clean pending id sets
      setPendingDoneIds((s) => {
        let changed = false;
        const next = new Set(s);
        for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
        return changed ? next : s;
      });
      setPendingUncompleteIds((s) => {
        let changed = false;
        const next = new Set(s);
        for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
        return changed ? next : s;
      });
      setPendingDeleteIds((s) => {
        let changed = false;
        const next = new Set(s);
        for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
        return changed ? next : s;
      });
      setPendingUndeleteIds((s) => {
        let changed = false;
        const next = new Set(s);
        for (const id of idsToRemove) { if (next.delete(id)) changed = true; }
        return changed ? next : s;
      });

      return prev.filter((r) => !idsToRemove.has(r.id));
    });

    // 500ms reset back to default
    if (clearListTimerRef.current !== null) {
      clearTimeout(clearListTimerRef.current);
    }
    clearListTimerRef.current = window.setTimeout(() => {
      clearListTimerRef.current = null;
      setClearListStep(0);
    }, 500);
  }, [activeMainTab, clearListStep, doneDeletedFilter, isClearAllDisabled, isListsEnabled, pendingUncompleteIds, pendingUndeleteIds, pendingUndoneListIds, pendingUndeletedListIds, viewMode]);

  const now = new Date();

  if (isDevToolsOpen && devToolsTopRef.current === null) {
    devToolsTopRef.current = getBottomSheetTopPosition();
  }
  if (!isDevToolsOpen) {
    devToolsTopRef.current = null;
  }

  return (
    <div className="content-stretch flex flex-col items-center h-screen w-full overflow-hidden" style={{ backgroundColor: viewMode === "done-deleted" ? (isListsEnabled ? "#4784f8" : DONE_BLUE) : (isListsEnabled && activeMainTab === 'lists') ? DONE_BLUE : "#4784f8" }} onPointerDownCapture={(e) => {
        if ((clearListStep === 1 || clearListStep === 2) && clearAllButtonRef.current && !clearAllButtonRef.current.contains(e.target as Node)) {
          setClearListStep(0);
          if (clearListTimerRef.current !== null) {
            clearTimeout(clearListTimerRef.current);
            clearListTimerRef.current = null;
          }
        }
      }}>
      {persistenceError && (
        <div style={{ backgroundColor: '#b45309', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: 500, flexShrink: 0, width: '100%' }}>
          Storage unavailable - changes may not be saved
        </div>
      )}
      {/* Header */}
      <div className="app-header relative shrink-0 w-full p-[20px]">
        <div className="content-stretch flex flex-col gap-[17px] items-start relative w-full max-w-[768px] mx-auto" style={{ backgroundColor: viewMode === "done-deleted" ? (isListsEnabled ? "#4784f8" : DONE_BLUE) : (isListsEnabled && activeMainTab === 'lists') ? DONE_BLUE : "#4784f8" }}>
          <div className="content-stretch flex items-center justify-center pb-[20px] pt-[50px] relative shrink-0 w-full">
            <div ref={logoRef} className="h-[35.653px] relative shrink-0 w-[209.653px]" style={{ top: '7px' }}>
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 209.653 35.6533">
                <g>
                  {/* Text portion */}
                  <g>
                    <path d={svgPaths.p2e09d80} fill="white" />
                    <path d={svgPaths.p3b133a00} fill="white" />
                    <path d={svgPaths.p11840600} fill="white" />
                    <path d={svgPaths.p170f9700} fill="white" />
                    <path d={svgPaths.pf876500} fill="white" />
                    <path d={svgPaths.pc9c4a00} fill="white" />
                    <path d={svgPaths.p6114100} fill="white" />
                    <path d={svgPaths.pb9f8400} fill="white" />
                    <path d={svgPaths.pe461c40} fill="white" />
                    <path d={svgPaths.p38e87300} fill="white" />
                    <path d={svgPaths.p26dc1e00} fill="white" />
                    <path d={svgPaths.p82ca600} fill="white" />
                  </g>
                  
                  {/* Circular tick icon */}
                  {viewMode !== "done-deleted" && viewMode !== 'lists-done' && (
                    <path d={svgPaths.p3babd700} fill="white" />
                  )}
                </g>
              </svg>

              {/* Done-deleted mode: overlay the dark tick icon at same size */}
              {viewMode === "done-deleted" && (
                <svg
                  className="absolute left-0 top-0"
                  style={{ width: '35.653px', height: '35.653px' }}
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 35.6533 35.6533"
                >
                  <g clipPath="url(#clip0_done_tick)">
                    <path d={doneTickPaths.p2b6e2900} fill="#FFFFFF" />
                    <g>
                      <path d={doneTickPaths.p2e09d80} fill={isListsEnabled ? '#4784f8' : DONE_BLUE} />
                      <path d={doneTickPaths.p3b133a00} fill={isListsEnabled ? '#4784f8' : DONE_BLUE} />
                    </g>
                  </g>
                  <defs>
                    <clipPath id="clip0_done_tick">
                      <rect fill="white" height="35.6533" width="35.6533" />
                    </clipPath>
                  </defs>
                </svg>
              )}

              {/* Lists-done mode: overlay tick icon with white fill and List blue tick */}
              {viewMode === 'lists-done' && (
                <svg
                  className="absolute left-0 top-0"
                  style={{ width: '35.653px', height: '35.653px' }}
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 35.6533 35.6533"
                >
                  <g clipPath="url(#clip0_lists_done_tick)">
                    <path d={doneTickPaths.p2b6e2900} fill="#FFFFFF" />
                    <g>
                      <path d={doneTickPaths.p2e09d80} fill={DONE_BLUE} />
                      <path d={doneTickPaths.p3b133a00} fill={DONE_BLUE} />
                    </g>
                  </g>
                  <defs>
                    <clipPath id="clip0_lists_done_tick">
                      <rect fill="white" height="35.6533" width="35.6533" />
                    </clipPath>
                  </defs>
                </svg>
              )}
              
              {/* Clickable area over tick circle (left segment) */}
              <button
                className="absolute top-0 bottom-0 cursor-pointer"
                style={{ left: 0, width: '22%', padding: 0, background: 'none', border: 'none' }}
                onClick={handleTickClick}
                aria-label={viewMode === "done-deleted" ? "Return to reminders" : "Show done and deleted"}
              />
              {/* Invisible clickable area over text portion only */}
              <button
                className="absolute top-0 bottom-0 left-1/4 right-0 p-0 m-0 bg-transparent border-0 text-left cursor-pointer"
                onClick={handleLogoClick}
                aria-label="Developer tools (triple tap)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reminders/Lists tab bar — Lists mode only */}
      {isListsEnabled && (
        <div ref={tabsBarRef} className="content-stretch flex gap-[10px] items-end justify-center px-[20px] relative w-full">
          <div
            className={`${activeMainTab === 'reminders' ? 'bg-white' : 'bg-[rgba(255,255,255,0.25)]'} flex-[1_0_0] min-h-px min-w-px relative rounded-tl-[12px] rounded-tr-[12px] cursor-pointer h-[52px]`}
            data-name="today-btn"
            onClick={() => {
              if (viewMode === 'lists-done') {
                setViewMode('list');
              }
              setActiveFilter('all');
              setActiveListFilter('all');
              setSavedListsPanelOpen(false);
              setActiveMainTab('reminders');
            }}
          >
            {activeMainTab === 'reminders' && (
              <div aria-hidden="true" className="absolute border-[1.5px] border-solid border-white inset-[-0.75px] pointer-events-none rounded-tl-[12.75px] rounded-tr-[12.75px]" />
            )}
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[30px] relative size-full">
                <div className={`flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] whitespace-nowrap ${activeMainTab === 'reminders' ? 'text-[#4784f8]' : 'text-white'}`}>
                  <p className="leading-[normal]">{isListsEnabled && viewMode === 'done-deleted' ? 'Done reminders' : 'Reminders'}</p>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${activeMainTab === 'lists' ? 'bg-white' : 'bg-[rgba(255,255,255,0.25)]'} flex-[1_0_0] min-h-px min-w-px relative rounded-tl-[12px] rounded-tr-[12px] h-[52px] ${isListsEnabled ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
            data-name="today-btn"
            onClick={isListsEnabled ? () => {
              if (viewMode === 'done-deleted') {
                setViewMode('list');
              }
              setActiveFilter('all');
              setActiveListFilter('all');
              setSavedListsPanelOpen(false);
              setActiveMainTab('lists');
            } : undefined}
          >
            {activeMainTab === 'lists' && (
              <div aria-hidden="true" className="absolute border-[1.5px] border-solid border-white inset-[-0.75px] pointer-events-none rounded-tl-[12.75px] rounded-tr-[12.75px]" />
            )}
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[30px] relative size-full">
                <div className={`flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] whitespace-nowrap ${activeMainTab === 'lists' ? 'text-[#4784F8]' : 'text-white'}`}>
                  <p className="leading-[normal]">{viewMode === 'lists-done' ? 'Done lists' : (savedListsPanelOpen || restoreSavedListsPanelAfterOverlayClose) ? 'List templates' : 'Lists'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder list container */}
      <div className={`bg-white content-stretch flex flex-col gap-[24px] items-center px-[20px] pt-[24px] relative rounded-tl-[15px] rounded-tr-[15px] w-full flex-1 min-h-[350px]`}>
        {isListsEnabled && activeMainTab === 'lists' ? (
          <>
          {viewMode === 'lists-done' && (
            <div className="filters-menu flex items-center justify-between relative shrink-0 w-full">
              <div className="flex items-center gap-[12px]">
                <button
                  onClick={() => setViewMode('list')}
                  className="hidden relative shrink-0 self-center cursor-pointer"
                  style={{ width: 50, height: 40 }}
                  aria-label="Back to lists"
                >
                  <svg className="block" style={{ width: 50, height: 40 }} fill="none" viewBox="0 0 50 40">
                    <rect fill="transparent" height="39" rx="19.5" width="49" x="0.5" y="0.5" />
                    <rect height="39" rx="19.5" stroke={DONE_BLUE} width="49" x="0.5" y="0.5" />
                  </svg>
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 8, height: 13 }} fill="none" viewBox="20.88 13.38 7.76 13.24">
                    <path d={laterBtnPaths.p17336800} fill={DONE_BLUE} />
                  </svg>
                </button>
                <button
                  onClick={() => setDoneDeletedFilter(doneDeletedFilter === 'done' ? 'all' : 'done')}
                  className={`${
                    doneDeletedFilter === 'done'
                      ? "bg-white"
                      : "text-[#404040]"
                  } content-stretch flex items-center justify-center px-[16px] h-[45px] relative rounded-[100px] shrink-0 cursor-pointer`}
                  style={getListArchiveFilterPillStyle('done', doneDeletedFilter)}
                >
                  <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                    Done
                  </div>
                </button>
                <button
                  onClick={() => setDoneDeletedFilter(doneDeletedFilter === 'deleted' ? 'all' : 'deleted')}
                  className={`${
                    doneDeletedFilter === 'deleted'
                      ? "bg-white"
                      : "text-[#898989]"
                  } content-stretch flex items-center justify-center px-[16px] h-[45px] relative rounded-[100px] shrink-0 cursor-pointer`}
                  style={getListArchiveFilterPillStyle('deleted', doneDeletedFilter)}
                >
                  <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                    Deleted
                  </div>
                </button>
              </div>
              {/* Clear all button */}
              <button
                ref={clearAllButtonRef}
                onClick={isClearAllDisabled ? undefined : handleClearListClick}
                disabled={isClearAllDisabled}
                className={`${
                  isClearAllDisabled
                    ? "text-[#CCCCCC]"
                    : clearListStep === 0
                    ? "text-[#4784F8]"
                    : "bg-[#4784F8] text-white"
                } content-stretch flex items-center justify-center h-[45px] w-[95px] relative rounded-[100px] shrink-0 border border-solid transition-colors ${isClearAllDisabled ? "cursor-default border-[#CCCCCC]" : "cursor-pointer border-[#4784F8]"}`}
                style={isClearAllDisabled ? { color: '#CCCCCC', borderColor: '#CCCCCC' } : undefined}
              >
                <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                  {clearListStep === 0 ? "Clear all" : clearListStep === 1 ? "Clear all?" : "Cleared!"}
                </div>
              </button>
            </div>
          )}
          {viewMode === 'lists-done' ? (
            (() => {
              const doneDeletedLists = createdLists
                .filter((list) => list.status === 'done' || list.status === 'deleted' || pendingUndoneListIds.has(list.id) || pendingUndeletedListIds.has(list.id))
                .filter((list) => {
                  if (doneDeletedFilter === 'all') return true;
                  if (doneDeletedFilter === 'done') return list.status === 'done' || pendingUndoneListIds.has(list.id);
                  return list.status === 'deleted' || pendingUndeletedListIds.has(list.id);
                })
                .map((list) => ({ kind: 'created' as const, list }))
                .sort((a, b) => {
                  const tsA =
                    pendingUndeletedListStatusChangedAtRef.current.get(a.list.id) ??
                    pendingUndoneListStatusChangedAtRef.current.get(a.list.id) ??
                    a.list.statusChangedAt ??
                    0;
                  const tsB =
                    pendingUndeletedListStatusChangedAtRef.current.get(b.list.id) ??
                    pendingUndoneListStatusChangedAtRef.current.get(b.list.id) ??
                    b.list.statusChangedAt ??
                    0;
                  return tsB - tsA;
                });

              const deletedSavedLists = savedLists
                .filter((list) => (list.status ?? 'active') === 'deleted')
                .filter((list) => doneDeletedFilter !== 'done')
                .map((list) => ({ kind: 'saved' as const, list }))
                .sort((a, b) => (b.list.statusChangedAt ?? 0) - (a.list.statusChangedAt ?? 0));

              const archivedLists = [...doneDeletedLists, ...deletedSavedLists].sort((a, b) => {
                const tsA = a.kind === 'created'
                  ? (
                    pendingUndeletedListStatusChangedAtRef.current.get(a.list.id) ??
                    pendingUndoneListStatusChangedAtRef.current.get(a.list.id) ??
                    a.list.statusChangedAt ??
                    0
                  )
                  : (a.list.statusChangedAt ?? 0);
                const tsB = b.kind === 'created'
                  ? (
                    pendingUndeletedListStatusChangedAtRef.current.get(b.list.id) ??
                    pendingUndoneListStatusChangedAtRef.current.get(b.list.id) ??
                    b.list.statusChangedAt ??
                    0
                  )
                  : (b.list.statusChangedAt ?? 0);
                return tsB - tsA;
              });

              if (archivedLists.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center flex-1 min-h-0 w-full">
                    <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                      {doneDeletedFilter === 'deleted' ? 'No deleted lists yet…' : doneDeletedFilter === 'done' ? 'No done lists yet…' : 'No done or deleted lists yet…'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-[23px] w-full flex-1 min-h-0 overflow-y-auto">
                  <AnimatePresence key={`${viewMode}-${activeMainTab}-${doneDeletedFilter}`}>
                    {archivedLists.map((entry) => {
                      const list = entry.list;
                      const isSavedList = entry.kind === 'saved';
                      const isPendingRestore = !isSavedList && (pendingUndoneListIds.has(list.id) || pendingUndeletedListIds.has(list.id));
                      const isDeletedList = isSavedList ? true : (list.status === 'deleted' && !pendingUndeletedListIds.has(list.id));
                      const doneCount = list.items.filter(i => i.completed).length;
                      const listStatusColor = isSavedList && isDeletedList ? '#898989' : (isDeletedList ? DELETED_LIST_COLOUR : DONE_LIST_COLOUR);
                      return (
                        <motion.div
                          key={`${entry.kind}-${list.id}`}
                          layout
                          exit={{ opacity: 0 }}
                          transition={{ layout: { duration: 0.25 } }}
                        >
                          <div className="content-stretch flex items-start justify-between px-px relative w-full">
                            <div className="flex-[1_0_0] min-h-px min-w-px relative">
                              <div className="flex flex-row items-start size-full">
                                <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full">
                                  {isSavedList ? (
                                    <button
                                      className="relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center"
                                      style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }}
                                      onClick={() => handleSavedListRestoreClick(list.id)}
                                      aria-label="Restore list template"
                                    >
                                      <SavedListTemplateIcon color={listStatusColor} />
                                    </button>
                                  ) : (
                                    <button
                                      className="relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center"
                                      style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }}
                                      onClick={() => isDeletedList ? handleListUndeleteClick(list.id) : handleListUndoClick(list.id)}
                                      aria-label="Mark list as not done"
                                    >
                                      {isPendingRestore ? (
                                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                                          <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke="#BABABA" strokeWidth="2" />
                                        </svg>
                                      ) : (
                                        <CompletedCircleIcon className="absolute block size-full" color={listStatusColor} />
                                      )}
                                    </button>
                                  )}
                                  <div className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative" style={{ gap: '9px', minHeight: '38px' }}>
                                    <div className={`overflow-hidden text-ellipsis whitespace-nowrap${isPendingRestore ? '' : ' line-through'}`} style={{ color: isPendingRestore ? '#BABABA' : listStatusColor, textDecorationColor: isPendingRestore ? '#BABABA' : listStatusColor, clipPath: 'inset(0 0 -4px 0)' }}>
                                      <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>{list.title}</p>
                                    </div>
                                    <div className={`flex items-center overflow-visible${isPendingRestore ? '' : ' line-through'}`} style={{ textDecorationColor: isPendingRestore ? '#BABABA' : listStatusColor }}>
                                      <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: isPendingRestore ? '#BABABA' : listStatusColor }}>
                                        {isSavedList ? `${list.items.length} ${list.items.length === 1 ? 'item' : 'items'}` : formatListProgress(doneCount, list.items.length)}
                                      </p>
                                      {!isSavedList && isSmartRemindersEnabled && (list.smartReminders ?? false) && (
                                        <div className="flex items-center gap-[8px] h-0 overflow-visible shrink-0 self-center pl-[8px]">
                                          <SmartRemindersIndicator color={isPendingRestore ? '#BABABA' : listStatusColor} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <RowMenuButton onClick={() => isSavedList ? setSavedDeletedListInfoId(list.id) : setDoneInfoTarget({ kind: 'list', id: list.id })} alignWithSettingsButton={settingsMenuFeatureEnabled} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })()
          ) : (
            <>
            <div className="relative flex flex-col gap-[24px] w-full flex-1 min-h-0">
            {/* List filter pills */}
            {(() => {
              const templatesButton = (
                <button
                  type="button"
                  onClick={() => setSavedListsPanelOpen(true)}
                  aria-label="Open templates"
                  className="flex items-center justify-center shrink-0 cursor-pointer p-0 m-0 border-none bg-transparent size-[45px]"
                >
                  <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                    <path d="M27.0977 30.8908C27.5421 30.8908 27.9023 31.251 27.9023 31.6954C27.9023 32.1398 27.5421 32.5 27.0977 32.5H24.3391C23.8947 32.5 23.5345 32.1398 23.5345 31.6954C23.5345 31.251 23.8947 30.8908 24.3391 30.8908H27.0977Z" fill="white"/>
                    <path d="M19.5833 29.0679C20.0189 28.9806 20.4423 29.2627 20.5298 29.6983C20.6147 30.1207 20.7478 30.3342 20.9474 30.4984C21.1681 30.6799 21.4932 30.8173 22.1085 30.898C22.5489 30.9558 22.8592 31.3592 22.8017 31.7996C22.7439 32.2402 22.3398 32.5506 21.8992 32.4928C21.139 32.3931 20.4749 32.1923 19.9255 31.7403C19.367 31.2809 19.0898 30.6959 18.9529 30.0144C18.8656 29.5788 19.1478 29.1554 19.5833 29.0679Z" fill="white"/>
                    <path d="M30.907 29.6983C30.9945 29.2627 31.4179 28.9806 31.8534 29.0679C32.289 29.1554 32.5711 29.5788 32.4838 30.0144C32.3469 30.6959 32.0698 31.2809 31.5113 31.7403C30.9618 32.1923 30.2978 32.3931 29.5375 32.4928C29.0969 32.5506 28.6928 32.2402 28.6351 31.7996C28.5776 31.3592 28.8879 30.9558 29.3283 30.898C29.9436 30.8173 30.2687 30.6799 30.4894 30.4984C30.689 30.3342 30.8221 30.1207 30.907 29.6983Z" fill="white"/>
                    <path d="M20.2012 12.5C21.6929 12.5 22.8825 12.4983 23.8236 12.6096C24.7825 12.7229 25.5877 12.9628 26.2635 13.5174C26.4905 13.7037 26.6986 13.9119 26.8849 14.1388C27.4104 14.7792 27.6534 15.5357 27.7739 16.4296C27.8919 17.3056 27.9012 18.3947 27.9023 19.7405C27.9023 19.9771 27.7991 20.1895 27.6365 20.3367C27.6149 20.3563 27.5928 20.3753 27.5691 20.3924C27.4784 20.4582 27.374 20.5065 27.2602 20.5298C27.208 20.5405 27.1539 20.5459 27.0986 20.546L27.0977 20.5451L24.3391 20.546C23.8947 20.546 23.5345 20.1857 23.5345 19.7414C23.5345 19.297 23.8947 18.9368 24.3391 18.9368H26.2895C26.2824 17.974 26.259 17.2386 26.1791 16.6451C26.0806 15.9141 25.907 15.4838 25.6412 15.1598C25.5218 15.0143 25.388 14.8805 25.2425 14.7611C24.901 14.481 24.4416 14.3034 23.6351 14.208C22.8103 14.1105 21.7323 14.1092 20.2012 14.1092C18.67 14.1092 17.592 14.1105 16.7672 14.208C15.9607 14.3034 15.5013 14.481 15.1598 14.7611C15.0143 14.8805 14.8805 15.0143 14.7611 15.1598C14.481 15.5013 14.3034 15.9607 14.208 16.7672C14.1105 17.592 14.1092 18.67 14.1092 20.2012C14.1092 21.7323 14.1105 22.8103 14.208 23.6351C14.3034 24.4416 14.481 24.901 14.7611 25.2425C14.8805 25.388 15.0143 25.5218 15.1598 25.6412C15.4838 25.907 15.9141 26.0806 16.6451 26.1791C17.2386 26.259 17.974 26.2815 18.9368 26.2886V24.3391C18.9368 23.8947 19.297 23.5345 19.7414 23.5345C20.1857 23.5345 20.546 23.8947 20.546 24.3391V27.0977C20.546 27.2365 20.5109 27.3672 20.449 27.4811C20.4182 27.5377 20.3796 27.5891 20.3367 27.6365C20.3123 27.6635 20.2866 27.6893 20.2586 27.7128C20.2516 27.7187 20.2443 27.7242 20.2371 27.7299C20.1003 27.8373 19.9287 27.9023 19.7414 27.9023L19.7405 27.9014C18.3947 27.9003 17.3056 27.8919 16.4296 27.7739C15.5357 27.6534 14.7792 27.4104 14.1388 26.8849C13.9119 26.6986 13.7037 26.4905 13.5174 26.2635C12.9628 25.5877 12.7229 24.7825 12.6096 23.8236C12.4983 22.8825 12.5 21.6929 12.5 20.2012C12.5 18.7094 12.4983 17.5198 12.6096 16.5787C12.7229 15.6198 12.9628 14.8146 13.5174 14.1388C13.7037 13.9119 13.9119 13.7037 14.1388 13.5174C14.8146 12.9628 15.6198 12.7229 16.5787 12.6096C17.5198 12.4983 18.7094 12.5 20.2012 12.5Z" fill="white"/>
                    <path d="M31.6954 23.5345C32.1398 23.5345 32.5 23.8947 32.5 24.3391V27.0977C32.5 27.5421 32.1398 27.9023 31.6954 27.9023C31.251 27.9023 30.8908 27.5421 30.8908 27.0977V24.3391C30.8908 23.8947 31.251 23.5345 31.6954 23.5345Z" fill="white"/>
                    <path d="M21.8992 18.944C22.3398 18.8862 22.7439 19.1966 22.8017 19.6372C22.8592 20.0776 22.5489 20.481 22.1085 20.5388C21.4932 20.6195 21.1681 20.7569 20.9474 20.9384C20.7478 21.1026 20.6147 21.3161 20.5298 21.7385C20.4423 22.1741 20.0189 22.4562 19.5833 22.3689C19.1478 22.2814 18.8656 21.858 18.9529 21.4224C19.0898 20.7408 19.367 20.1559 19.9255 19.6965C20.4749 19.2445 21.139 19.0437 21.8992 18.944Z" fill="white"/>
                    <path d="M29.5375 18.944C30.2978 19.0437 30.9618 19.2445 31.5113 19.6965C32.0698 20.1559 32.3469 20.7408 32.4838 21.4224C32.5712 21.858 32.289 22.2814 31.8534 22.3689C31.4179 22.4562 30.9945 22.1741 30.907 21.7385C30.8221 21.3161 30.689 21.1026 30.4894 20.9384C30.2687 20.7569 29.9436 20.6195 29.3283 20.5388C28.8879 20.481 28.5776 20.0776 28.6351 19.6372C28.6928 19.1966 29.0969 18.8862 29.5375 18.944Z" fill="white"/>
                  </svg>
                </button>
              );
              const listsSettingsButton = (
                <button
                  type="button"
                  onClick={handleHeaderMenuClick}
                  aria-label="Open lists settings"
                  className="flex items-center justify-center shrink-0 cursor-pointer p-0 m-0 border-none bg-transparent size-[45px]"
                >
                  <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                    <circle cx="16" cy="22.5" r="1.75" fill="white"/>
                    <circle cx="22.5" cy="22.5" r="1.75" fill="white"/>
                    <circle cx="29" cy="22.5" r="1.75" fill="white"/>
                  </svg>
                </button>
              );
              const filterPills = (savedListsFeatureEnabled
                ? (["todo", "started", "complete"] as const)
                : (["complete", "almost", "started", "todo"] as const)
              ).map((filter) => {
                const isActive = activeListFilter === filter;
                return (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveListFilter(activeListFilter === filter ? "all" : filter);
                  }}
                  className={`${
                    isActive
                      ? "bg-white"
                      : "text-[#4784F8]"
                  } content-stretch flex items-center justify-center ${savedListsFeatureEnabled ? "px-[13px] min-[390px]:px-[16px]" : !settingsMenuFeatureEnabled ? "px-[16px]" : "px-[11px] min-[375px]:px-[13px] min-[390px]:px-[16px]"} h-[45px] relative rounded-[100px] shrink-0 cursor-pointer ${
                    filter !== "started" ? "" : !savedListsFeatureEnabled ? (settingsMenuFeatureEnabled ? "max-[440px]:hidden" : "max-[389px]:hidden") : settingsMenuFeatureEnabled ? "max-[360px]:hidden" : ""
                  }`}
                  style={getListFilterPillStyle(filter, activeListFilter)}
                >
                  <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                    {savedListsFeatureEnabled
                      ? (filter === "complete" ? "Done" : filter === "started" ? "Started" : "Todo")
                      : (filter === "complete" ? "Complete" : filter === "almost" ? "Almost" : filter === "started" ? "Started" : "Todo")}
                  </div>
                </button>
                );
              });
              // Settings menu or List templates on: visible filters grouped left with 10px gaps, action buttons grouped right with 10px gaps
              if (settingsMenuFeatureEnabled || savedListsFeatureEnabled) {
                return (
                  <div className="filters-menu flex items-center justify-between gap-[10px] relative shrink-0 w-full">
                    <div className="flex items-center gap-[10px]">{filterPills}</div>
                    <div className="flex items-center gap-[10px]">
                      {savedListsFeatureEnabled && templatesButton}
                      {settingsMenuFeatureEnabled && listsSettingsButton}
                    </div>
                  </div>
                );
              }
              return (
                <div className="filters-menu flex items-center gap-[18px] min-[389px]:max-[406px]:gap-[10px] relative shrink-0 w-full">
                  {filterPills}
                </div>
              );
            })()}
            <div className="relative w-full max-w-[768px] flex-1 min-h-0">
              {/* Scrollable lists container */}
              <div className="content-stretch flex flex-col items-center justify-start overflow-x-clip w-full rounded-[10px]" style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', height: '100%' }}>
                <div className="flex flex-col gap-[23px] w-full" style={{ position: 'relative', zIndex: 1 }}>
                  {/* Dynamic list cards */}
                  <AnimatePresence key={`lists-${activeListFilter}`}>
                  {(() => {
                    const listCategoryOrder: Record<string, number> = { todo: 0, started: 1, almost: 1, complete: 2 };
                    const categoriseList = (list: typeof createdLists[number]) => {
                      const total = list.items.length;
                      const checked = list.items.filter(i => i.completed).length;
                      if (checked === total) return "complete";
                      if (checked / total >= 0.5) return "almost";
                      if (checked > 0) return "started";
                      return "todo";
                    };
                    const activeLists = createdLists.filter((list) => (list.status !== 'done' && list.status !== 'deleted') || pendingDoneListIds.has(list.id) || pendingDeletedListIds.has(list.id));
                    const isListPinned = (list: typeof createdLists[number]) => pinnedListsFeatureEnabled && typeof list.pinnedAt === 'number';
                    const unpinnedActiveLists = activeLists.filter((list) => !isListPinned(list));
                    const pinnedLists = activeLists
                      .filter((list) => isListPinned(list))
                      .sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));
                    const filteredLists = activeListFilter === "all"
                      ? unpinnedActiveLists
                      : savedListsFeatureEnabled && activeListFilter === "started"
                        ? unpinnedActiveLists.filter(l => { const c = categoriseList(l); return c === "almost" || c === "started"; })
                      : activeListFilter === "grouped-todo"
                        ? unpinnedActiveLists.filter(l => { const c = categoriseList(l); return c === "started" || c === "todo"; })
                        : unpinnedActiveLists.filter(l => categoriseList(l) === activeListFilter);
                    const sortedLists = [...(activeListFilter === "all" ? pinnedLists : []), ...[...filteredLists].sort((a, b) => {
                      const catA = listCategoryOrder[categoriseList(a)] ?? 3;
                      const catB = listCategoryOrder[categoriseList(b)] ?? 3;
                      if (catA !== catB) return catA - catB;
                      return createdLists.indexOf(a) - createdLists.indexOf(b);
                    })];
                    const listCategoryColor: Record<string, string> = {
                      complete: "#8168D5",
                      almost: "#9468D5",
                      started: "#60C1E7",
                      todo: "#939393",
                    };
                    return sortedLists.map((list) => {
                    const isReinserted = listReinsertedId === list.id;
                    const isHighlighted = listInsertHighlightId === list.id;
                    const isPendingDoneList = pendingDoneListIds.has(list.id);
                    const isPendingDeletedList = pendingDeletedListIds.has(list.id);
                    const isPendingAwayList = isPendingDoneList || isPendingDeletedList;
                    const isPinnedList = pinnedListsFeatureEnabled && typeof list.pinnedAt === 'number';
                    const pendingListColour = isPendingDeletedList ? DELETED_LIST_COLOUR : DONE_LIST_COLOUR;
                    const visibleCompletedCount = isPendingDoneList ? list.items.length : list.items.filter(i => i.completed).length;
                    const catColor = isPinnedList ? "#1C2C42" : (listCategoryColor[categoriseList(list)] || "#BABABA");
                    return (
                      <motion.div
                        key={list.id}
                        layout
                        initial={isReinserted ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={isReinserted
                          ? { opacity: { duration: 0.2 } }
                          : { layout: { duration: 0.25 } }
                        }
                        onAnimationComplete={() => {
                          if (isReinserted) {
                            setListReinsertedId(null);
                          }
                        }}
                      >
                        <div className="content-stretch flex items-start justify-between px-px relative w-full">
                          <div className="flex-[1_0_0] min-h-px min-w-px relative">
                            <div className="flex flex-row items-start size-full">
                              <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full min-w-0">
                                <button
                                  className="relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center"
                                  style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }}
                                  onClick={() => handleListCompleteClick(list.id)}
                                  aria-label="Mark list as done"
                                >
                                  {isPendingAwayList ? (
                                    <CompletedCircleIcon className="absolute block size-full" color={pendingListColour} />
                                  ) : (
                                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                                      <path d="M12.5 0C19.4036 0 25 5.59644 25 12.5C25 19.4036 19.4036 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0ZM12.5 2C6.70101 2 2 6.70101 2 12.5C2 18.299 6.70101 23 12.5 23C18.299 23 23 18.299 23 12.5C23 6.70101 18.299 2 12.5 2Z" fill={catColor} />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative" style={{ gap: '9px', minHeight: '38px' }}>
                                  <div className={`overflow-hidden whitespace-nowrap cursor-pointer${isPendingAwayList ? ' line-through' : ''}`} style={{ color: isPendingAwayList ? DELETED_GREY : (isHighlighted ? catColor : '#1C2C42'), textDecorationColor: isPendingAwayList ? DELETED_GREY : (isHighlighted ? catColor : '#1C2C42'), height: '17px', maxWidth: '100%', minWidth: 0 }} onClick={() => openListEditor(list)}>
                                    {isPinnedList ? (
                                      <div className="flex h-full items-center min-w-0" style={{ gap: '8px' }}>
                                        <div className="flex h-[13px] w-[13px] shrink-0 items-center justify-center">
                                          <PinnedListIcon color="#1C2C42" />
                                        </div>
                                        <div className="min-w-0 overflow-hidden">
                                          <p style={{ display: 'block', width: '100%', minWidth: 0, fontSize: '17px', fontWeight: 700, lineHeight: '17px', transform: 'translateY(-1px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '2px', boxSizing: 'content-box' }}>{list.title}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p style={{ display: 'block', width: '100%', minWidth: 0, fontSize: '17px', fontWeight: 700, lineHeight: '17px', transform: 'translateY(-1px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '2px', boxSizing: 'content-box' }}>{list.title}</p>
                                    )}
                                  </div>
                                  <div className={`flex items-center overflow-visible cursor-pointer${isPendingAwayList ? ' line-through' : ''} min-w-0`} style={{ textDecorationColor: isPendingAwayList ? DELETED_GREY : '#BABABA' }} onClick={() => openListEditor(list)}>
                                    <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: isPendingAwayList ? DELETED_GREY : '#BABABA', textDecorationColor: isPendingAwayList ? DELETED_GREY : '#BABABA' }}>
                                      {formatListProgress(visibleCompletedCount, list.items.length)}
                                      {isSmartRemindersEnabled && (list.smartReminders ?? false) ? (
                                        <span style={{ color: isPendingAwayList ? DELETED_GREY : '#BABABA' }}>
                                          {`. ${formatSmartReminderDueBy(list.smartReminderDueDate, list.smartReminderTime)}`}
                                        </span>
                                      ) : null}
                                    </p>
                                    {isSmartRemindersEnabled && (list.smartReminders ?? false) && (
                                      <div className="flex items-center gap-[8px] h-0 overflow-visible shrink-0 self-center pl-[8px]">
                                        <SmartRemindersIndicator />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <RowMenuButton onClick={() => setListInfoOverlayListId(list.id)} alignWithSettingsButton={settingsMenuFeatureEnabled} />
                        </div>
                      </motion.div>
                    );
                  });
                  })()}
                  </AnimatePresence>
                </div>
                {(() => {
                  const categoriseList = (list: typeof createdLists[number]) => {
                    const total = list.items.length;
                    const checked = list.items.filter(i => i.completed).length;
                    if (checked === total) return "complete";
                    if (checked / total >= 0.5) return "almost";
                    if (checked > 0) return "started";
                    return "todo";
                  };
                  const visibleActiveLists = createdLists.filter((list) => (list.status !== 'done' && list.status !== 'deleted') || pendingDoneListIds.has(list.id) || pendingDeletedListIds.has(list.id));
                  const visibleUnpinnedActiveLists = visibleActiveLists.filter((list) => !(pinnedListsFeatureEnabled && typeof list.pinnedAt === 'number'));
                  const hasVisible = activeListFilter === "all"
                    ? visibleActiveLists.length > 0
                    : savedListsFeatureEnabled && activeListFilter === "started"
                      ? visibleUnpinnedActiveLists.some(l => { const c = categoriseList(l); return c === "almost" || c === "started"; })
                    : activeListFilter === "grouped-todo"
                      ? visibleUnpinnedActiveLists.some(l => { const c = categoriseList(l); return c === "started" || c === "todo"; })
                      : visibleUnpinnedActiveLists.some(l => categoriseList(l) === activeListFilter);
                  if (!hasVisible) {
                    const emptyMessages: Record<string, string> = {
                      all: "No lists here yet.. get busy!",
                      complete: "No fully checked off lists yet",
                      almost: "Nothing close to completion yet",
                      started: "Nothing started here yet",
                      todo: "Nothing 'todo' here!",
                      "grouped-todo": "Nothing 'todo' here!",
                    };
                    return (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                        <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                          {emptyMessages[activeListFilter]}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            {/* Add new list button */}
            <div className="content-stretch flex items-center justify-center w-full max-w-[768px] pb-[24px] shrink-0">
              <button
                className="bg-[#4784F8] content-stretch flex gap-[16px] items-center justify-center px-[30px] relative rounded-[100px] w-full transition-colors"
                style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }}
                onClick={() => { setListTitle(pickDefaultListName(createdLists.map(l => l.title))); setListItems([]); setListOverlayMode('create'); setEditingListId(null); setListSortMode('insertion'); setListSmartReminders(false); setListSmartReminderDueDate(null); setListSmartReminderTime(null); setIsListsOverlayOpen(true); }}
              >
                <div className="relative shrink-0 size-[15px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                    <path d={svgPaths.p1e67ad80} fill="white" />
                  </svg>
                </div>
                <div className="font-['Lato',sans-serif] font-bold text-[20px] text-white whitespace-nowrap">
                  New list
                </div>
              </button>
            </div>
            </div>
            </>
          )}
          </>
        ) : (
        <>
        {/* Filter buttons — rendered inside the container */}
        <div className="filters-menu flex items-center justify-between relative shrink-0 w-full">
          {viewMode === "done-deleted" ? (<div
            className="flex items-center justify-between w-full"
          >
            {/* Done/deleted view filters */}
            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => setViewMode("list")}
                className="hidden relative shrink-0 self-center cursor-pointer"
                style={{ width: 50, height: 40 }}
                aria-label="Back to reminders"
              >
                <svg className="block" style={{ width: 50, height: 40 }} fill="none" viewBox="0 0 50 40">
                  <rect fill="transparent" height="39" rx="19.5" width="49" x="0.5" y="0.5" />
                  <rect height="39" rx="19.5" stroke="#4784f8" width="49" x="0.5" y="0.5" />
                </svg>
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 8, height: 13 }} fill="none" viewBox="20.88 13.38 7.76 13.24">
                  <path d={laterBtnPaths.p17336800} fill="#4784f8" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setDoneDeletedFilter(doneDeletedFilter === 'done' ? 'all' : 'done');
                }}
                className={`${
                  doneDeletedFilter === 'done'
                    ? "bg-white"
                    : "text-[#404040]"
                } content-stretch flex items-center justify-center px-[16px] h-[45px] relative rounded-[100px] shrink-0 cursor-pointer`}
                style={getArchiveFilterPillStyle('done', doneDeletedFilter)}
              >
                <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                  Done
                </div>
              </button>
              <button
                onClick={() => {
                  setDoneDeletedFilter(doneDeletedFilter === 'deleted' ? 'all' : 'deleted');
                }}
                className={`${
                  doneDeletedFilter === 'deleted'
                    ? "bg-white"
                    : "text-[#898989]"
                } content-stretch flex items-center justify-center px-[16px] h-[45px] relative rounded-[100px] shrink-0 cursor-pointer`}
                style={getArchiveFilterPillStyle('deleted', doneDeletedFilter)}
              >
                <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                  Deleted
                </div>
              </button>
            </div>
            {/* Clear all button */}
            <button
              ref={clearAllButtonRef}
              onClick={isClearAllDisabled ? undefined : handleClearListClick}
              disabled={isClearAllDisabled}
              className={`${
                isClearAllDisabled
                  ? "text-[#CCCCCC]"
                  : clearListStep === 0
                  ? "text-[#4784f8]"
                  : "bg-[#4784f8] text-white"
              } content-stretch flex items-center justify-center h-[45px] w-[95px] relative rounded-[100px] shrink-0 border border-solid transition-colors ${isClearAllDisabled ? "cursor-default border-[#CCCCCC]" : "cursor-pointer border-[#4784f8]"}`}
              style={isClearAllDisabled ? { color: '#CCCCCC', borderColor: '#CCCCCC' } : undefined}
            >
              <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                {clearListStep === 0 ? "Clear all" : clearListStep === 1 ? "Clear all?" : "Cleared!"}
              </div>
            </button>
          </div>) : (
            <>
            {(() => {
            const filterPills = ((settingsMenuFeatureEnabled ? ["today", "this-week", "other"] : ["today", "this-week", "later", "sometime"]) as ReminderCategory[]).map((filter) => {
              const isActive = activeFilter === filter;
              return (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(activeFilter === filter ? "all" : filter);
                }}
                className={`${
                  isActive
                    ? "bg-white"
                    : "text-[#4784f8]"
                } content-stretch flex items-center justify-center ${settingsMenuFeatureEnabled ? "px-[13px] min-[375px]:px-[16px]" : "px-[16px]"} h-[45px] relative rounded-[100px] shrink-0 cursor-pointer ${
                  filter === "sometime" ? "hidden min-[390px]:flex" : ""
                }`}
                style={getReminderFilterPillStyle(filter, activeFilter)}
              >
                <div className="font-['Lato',sans-serif] font-bold text-[14px] whitespace-nowrap">
                  {getCategoryLabel(filter)}
                </div>
              </button>
              );
            });
            // Settings menu on: filters grouped left with 10px gaps, Settings button pushed right by justify-between
            return settingsMenuFeatureEnabled ? <div className="flex items-center gap-[10px]">{filterPills}</div> : filterPills;
            })()}
            {settingsMenuFeatureEnabled && (
              <button
                type="button"
                onClick={handleHeaderMenuClick}
                aria-label="Open reminders settings"
                className="flex items-center justify-center shrink-0 cursor-pointer p-0 m-0 border-none bg-transparent size-[45px]"
              >
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                  <circle cx="16" cy="22.5" r="1.75" fill="white"/>
                  <circle cx="22.5" cy="22.5" r="1.75" fill="white"/>
                  <circle cx="29" cy="22.5" r="1.75" fill="white"/>
                </svg>
              </button>
            )}
            </>
          )}
        </div>
        {/* Scrollable area */}
        <div className="content-stretch flex flex-col items-center justify-start overflow-x-clip w-full max-w-[768px] rounded-[10px]" style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {(() => {
            const displayReminders = hideOverdue ? reminders.filter(r => !isOverdue(r, now)) : reminders;
            // Done / deleted view — derived from completedAt or deletedAt on reminders
            if (viewMode === "done-deleted") {
              const completedItems = displayReminders
                .filter((r) => r.completedAt != null || r.deletedAt != null || pendingUncompleteIds.has(r.id) || pendingUndeleteIds.has(r.id))
                .filter((r) => {
                  if (doneDeletedFilter === 'all') return true;
                  if (doneDeletedFilter === 'done') return (r.completedAt != null && r.deletedAt == null) || pendingUncompleteIds.has(r.id);
                  // 'deleted'
                  return r.deletedAt != null || pendingUndeleteIds.has(r.id);
                })
                .sort((a, b) => {
                  const tsA = pendingUndeleteSortKeyRef.current.get(a.id) ?? a.deletedAt ?? a.completedAt ?? pendingUncompleteCompletedAtRef.current.get(a.id) ?? 0;
                  const tsB = pendingUndeleteSortKeyRef.current.get(b.id) ?? b.deletedAt ?? b.completedAt ?? pendingUncompleteCompletedAtRef.current.get(b.id) ?? 0;
                  return tsB - tsA;
                });

              if (completedItems.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center flex-1 w-full gap-[4px]">
                    <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                      {doneDeletedFilter === 'all' ? 'No done or deleted reminders yet...' : doneDeletedFilter === 'deleted' ? 'No deleted reminders yet...' : 'No done reminders yet...'}
                    </p>
                    {doneDeletedFilter === 'done' && (
                      <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                        get busy!
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-[23px] w-full">
                  <AnimatePresence key={`${viewMode}-${activeFilter}-${doneDeletedFilter}`}>
                  {completedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      exit={{ opacity: 0 }}
                      transition={{ layout: { duration: 0.25 } }}
                    >
                      <div className="content-stretch flex items-start justify-between px-px relative w-full">
                        <div className="flex-[1_0_0] min-h-px min-w-px relative">
                          <div className="flex flex-row items-start size-full">
                            <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full">
                              {/* Done/deleted tick circle — clickable to uncomplete/undelete */}
                              <button
                                className="relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center"
                                style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }}
                                onClick={() => handleUncompleteClick(item.id)}
                                aria-label={item.deletedAt != null ? "Undelete" : "Mark as not done"}
                              >
                                {(pendingUncompleteIds.has(item.id) || pendingUndeleteIds.has(item.id)) ? (() => {
                                  const cat = categoriseReminder(item, now);
                                  const overdue = isOverdue(item, now);
                                  const circleCol = overdue ? OVERDUE_COLOUR : CATEGORY_COLOURS[getDisplayCategory(cat, settingsMenuFeatureEnabled)] ?? "#939393";
                                  return (
                                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                                      <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke={circleCol} strokeWidth="2" />
                                    </svg>
                                  );
                                })() : (() => {
                                  const checkboxFill = item.deletedAt != null ? DELETED_GREY : (isListsEnabled ? '#3F3F3F' : DONE_BLUE);
                                  return <CompletedCircleIcon className="absolute block size-full" color={checkboxFill} />;
                                })()}
                              </button>
                              {(() => {
                                const isPendingRestore = pendingUncompleteIds.has(item.id) || pendingUndeleteIds.has(item.id);
                                const isDeleted = item.deletedAt != null;
                                const overdue = isOverdue(item, now);
                                const isSmartReminder = item.isSmartReminder === true;
                                const textCol = isPendingRestore ? (overdue ? OVERDUE_COLOUR : (isListsEnabled ? '#3F3F3F' : APP_TEXT_DARK_BLUE)) : (isDeleted ? DELETED_GREY : (isListsEnabled ? '#3F3F3F' : APP_TEXT_DARK_BLUE));
                                const subtitleCol = isPendingRestore ? '#BABABA' : (isDeleted ? DELETED_GREY : (isListsEnabled ? '#3F3F3F' : DONE_BLUE));
                                return (
                                  <div className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative" style={{ color: textCol, gap: '9px', minHeight: '38px' }}>
                                    <div className={`overflow-hidden text-ellipsis whitespace-nowrap${isPendingRestore ? '' : ' line-through'}`} style={{ textDecorationColor: textCol, clipPath: 'inset(0 0 -4px 0)' }}>
                                      <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>{getDisplayTitle(item)}</p>
                                    </div>
                                      <div className={`flex items-center overflow-visible${isPendingRestore ? '' : ' line-through'}`} style={{ textDecorationColor: subtitleCol }}>
                                        <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: subtitleCol }}>{(() => {
                                          if (isSmartReminder && item.linkedListId && item.schedule.kind === 'scheduled' && item.schedule.date) {
                                            const linkedList = createdLists.find((list) => list.id === item.linkedListId);
                                            if (linkedList) {
                                              const completedCount = linkedList.items.filter((listItem) => listItem.completed).length;
                                              const itemLabel = linkedList.items.length === 1 ? 'item' : 'items';
                                              return `${formatListProgress(completedCount, linkedList.items.length)} ${itemLabel}. ${formatSmartReminderDueBy(item.schedule.date, item.schedule.time)}`;
                                            }
                                          }
                                          if (overdue && item.schedule.kind === 'scheduled' && item.schedule.date) {
                                            const [oy, om, od] = item.schedule.date.split('-').map(Number);
                                            const overdueDate = new Date(oy, om - 1, od);
                                            overdueDate.setHours(0, 0, 0, 0);
                                            const todayStart = new Date(now);
                                            todayStart.setHours(0, 0, 0, 0);
                                            const daysOverdue = Math.round((todayStart.getTime() - overdueDate.getTime()) / 86400000);
                                            if (daysOverdue >= 1) {
                                              const overdueLabel = `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`;
                                              if (item.repeatRule) {
                                                const repeatText = formatRepeatRuleText(item.repeatRule, item.schedule.date);
                                                if (repeatText) return `${overdueLabel}. ${repeatText}`;
                                              }
                                              return overdueLabel;
                                            }
                                          }
                                          if (item.repeatRule) {
                                            if (item.schedule.kind === 'scheduled' && item.schedule.date) {
                                              const nextOccurrenceLabel = formatReminderNextOccurrenceLabel(item.schedule.date, item.schedule.time, now);
                                              const repeatText = formatRepeatRuleText(item.repeatRule, item.schedule.date);
                                              if (nextOccurrenceLabel && repeatText) {
                                                return `${nextOccurrenceLabel}. ${repeatText}`;
                                              }
                                            }
                                            const label = formatRepeatLabel(item.repeatRule, item.schedule.kind === 'scheduled' ? item.schedule.time : undefined, item.schedule.kind === 'scheduled' ? item.schedule.date : undefined);
                                            if (label) return label;
                                          }
                                          if (item.schedule.kind === 'scheduled' && item.schedule.date) {
                                            const dateLabel = formatScheduledDateForRow(item.schedule.date, now);
                                            if (item.schedule.time) {
                                              return `${dateLabel} at ${formatTime12h(item.schedule.time)}`;
                                            }
                                            return dateLabel;
                                          }
                                          return 'No date / time set';
                                        })()}</p>
                                        {(isSmartReminder || item.repeatRule) && (
                                          <div className="flex items-center gap-[6px] h-0 overflow-visible shrink-0 self-center pl-[6px]">
                                            {isSmartReminder && <SmartReminderReminderIndicator color={subtitleCol} />}
                                            {item.repeatRule && <RepeatReminderIndicator color={subtitleCol} />}
                                          </div>
                                        )}
                                      </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <RowMenuButton onClick={() => setDoneInfoTarget({ kind: 'reminder', id: item.id })} alignWithSettingsButton={settingsMenuFeatureEnabled} />
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              );
            }

            // Standard reminder list view — active reminders only (not completed, not deleted),
            // plus items in pendingDeleteIds so they remain visible during the 350ms delete window.
            const activeReminders = displayReminders.filter((r) =>
              (r.completedAt == null && r.deletedAt == null) || pendingDeleteIds.has(r.id)
            );
            const filtered = activeReminders.filter((r) => {
              if (activeFilter === "all") return true;
              // Overdue reminders appear in every filter view
              if (isOverdue(r, now)) return true;
              const cat = categoriseReminder(r, now);
              if (activeFilter === "other") return cat === "later" || cat === "sometime";
              return cat === activeFilter;
            });
            const isLastVisibleInThisList = filtered.length === 1;
            const sortedFiltered = filtered.length > 0 ? sortReminders(filtered, now) : [];
            return (
              <>
              <div className="flex flex-col gap-[23px] w-full" style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence key={`${viewMode}-${activeFilter}`}>
                {sortedFiltered.map((reminder) => {
                  const isPendingDone = pendingDoneIds.has(reminder.id);
                  const isPendingDelete = pendingDeleteIds.has(reminder.id);
                  const isPendingAway = isPendingDone || isPendingDelete;
                  const pendingColour = isPendingDelete ? DELETED_GREY : (isListsEnabled ? '#3F3F3F' : DONE_BLUE);
                  const category = categoriseReminder(reminder, now);
                  const overdue = isOverdue(reminder, now);
                  const circleColour = overdue ? OVERDUE_COLOUR : CATEGORY_COLOURS[getDisplayCategory(category, settingsMenuFeatureEnabled)] ?? "#939393";
                  const isHighlighted = insertHighlightId === reminder.id;
                  const textColour = isPendingAway ? "#BABABA" : (isHighlighted ? circleColour : (overdue ? OVERDUE_COLOUR : APP_TEXT_DARK_BLUE));
                  const isReinserted = reinsertedId === reminder.id;
                  const isSmartReminder = reminder.isSmartReminder === true;
                  return (
                    <motion.div
                      key={reminder.id}
                      layout
                      initial={isReinserted ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={isReinserted
                        ? { opacity: { duration: 0.2 } }
                        : { layout: { duration: 0.25 } }
                      }
                      onAnimationComplete={() => {
                        if (isReinserted) {
                          setReinsertedId(null);
                        }
                      }}
                    >
                      <div className="content-stretch flex items-start justify-between px-px relative w-full">
                        <div className="flex-[1_0_0] min-h-px min-w-px relative">
                          <div className="flex flex-row items-start size-full">
                            <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full">
                              {/* Circle: clickable completion target */}
                              <button
                                className="relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center"
                                style={{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }}
                                onClick={() => handleCompleteClick(reminder.id, { armEmptyDelay: isLastVisibleInThisList, filterKey: activeFilter, isRepeat: reminder.repeatRule != null })}
                                aria-label="Mark as done"
                              >
                                {isPendingAway ? (
                                  <CompletedCircleIcon className="absolute block size-full" color={pendingColour} />
                                ) : (
                                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                                    <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke={circleColour} strokeWidth="2" />
                                  </svg>
                                )}
                              </button>
                              <div
                                className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative cursor-pointer`}
                                style={{ transition: 'color 300ms', gap: '9px', minHeight: '38px' }}
                                onClick={() => {
                                  setRepeatConfig(repeatRuleToConfig(reminder.repeatRule));
                                  setEditingReminder(reminder);
                                  setIsOverlayOpen(true);
                                }}
                              >
                                <div className={`overflow-hidden whitespace-nowrap${isPendingAway ? ' line-through' : ''}`} style={{ color: isPendingAway ? pendingColour : textColour, textDecorationColor: isPendingAway ? pendingColour : textColour, height: '17px', maxWidth: '100%', minWidth: 0 }}>
                                  <p style={{ display: 'block', width: '100%', minWidth: 0, fontSize: '17px', fontWeight: 700, lineHeight: '17px', transform: 'translateY(-1px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '2px', boxSizing: 'content-box' }}>{getDisplayTitle(reminder)}</p>
                                </div>
                                  <div className={`flex items-center overflow-visible${isPendingAway ? ' line-through' : ''}`} style={{ textDecorationColor: isPendingAway ? pendingColour : '#BABABA' }}>
                                    <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: isPendingAway ? pendingColour : '#BABABA' }}>{(() => {
                                      if (isSmartReminder && reminder.linkedListId && reminder.schedule.kind === 'scheduled' && reminder.schedule.date) {
                                        const linkedList = createdLists.find((list) => list.id === reminder.linkedListId);
                                        if (linkedList) {
                                          const completedCount = linkedList.items.filter((listItem) => listItem.completed).length;
                                          const itemLabel = linkedList.items.length === 1 ? 'item' : 'items';
                                          return `${formatListProgress(completedCount, linkedList.items.length)} ${itemLabel}. ${formatSmartReminderDueBy(reminder.schedule.date, reminder.schedule.time)}`;
                                        }
                                      }
                                      if (overdue && reminder.schedule.kind === 'scheduled' && reminder.schedule.date) {
                                        const [oy, om, od] = reminder.schedule.date.split('-').map(Number);
                                        const overdueDate = new Date(oy, om - 1, od);
                                        overdueDate.setHours(0, 0, 0, 0);
                                        const todayStart = new Date(now);
                                        todayStart.setHours(0, 0, 0, 0);
                                        const daysOverdue = Math.round((todayStart.getTime() - overdueDate.getTime()) / 86400000);
                                        if (daysOverdue >= 1) {
                                          const overdueLabel = `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`;
                                          if (reminder.repeatRule) {
                                            const repeatText = formatRepeatRuleText(reminder.repeatRule, reminder.schedule.date);
                                            if (repeatText) return `${overdueLabel}. ${repeatText}`;
                                          }
                                          return overdueLabel;
                                        }
                                      }
                                      if (reminder.repeatRule) {
                                        if (reminder.schedule.kind === 'scheduled' && reminder.schedule.date) {
                                          const nextOccurrenceLabel = formatReminderNextOccurrenceLabel(reminder.schedule.date, reminder.schedule.time, now);
                                          const repeatText = formatRepeatRuleText(reminder.repeatRule, reminder.schedule.date);
                                          if (nextOccurrenceLabel && repeatText) {
                                            return `${nextOccurrenceLabel}. ${repeatText}`;
                                          }
                                        }
                                        const label = formatRepeatLabel(reminder.repeatRule, reminder.schedule.kind === 'scheduled' ? reminder.schedule.time : undefined, reminder.schedule.kind === 'scheduled' ? reminder.schedule.date : undefined);
                                        if (label) return label;
                                      }
                                      if (reminder.schedule.kind === 'scheduled' && reminder.schedule.date) {
                                        const dateLabel = formatScheduledDateForRow(reminder.schedule.date, now);
                                        if (reminder.schedule.time) {
                                          return `${dateLabel} at ${formatTime12h(reminder.schedule.time)}`;
                                        }
                                        return dateLabel;
                                      }
                                      return 'No date / time set';
                                    })()}</p>
                                    {(isSmartReminder || reminder.repeatRule) && (
                                      <div className="flex items-center gap-[6px] h-0 overflow-visible shrink-0 self-center pl-[6px]">
                                        {isSmartReminder && <SmartReminderReminderIndicator />}
                                        {reminder.repeatRule && <RepeatReminderIndicator />}
                                      </div>
                                    )}
                                  </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <RowMenuButton onClick={() => setInfoReminder(reminder)} alignWithSettingsButton={settingsMenuFeatureEnabled} />
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
              {filtered.length === 0 && (() => {
                const emptyMessages: Record<ReminderCategory | "all", string> = {
                  all: "No reminders... take it easy!",
                  today: "No reminders today... take it easy!",
                  "this-week": "No reminders this week... take it easy!",
                  later: "No reminders... take it easy!",
                  sometime: "No reminders... take it easy!",
                  other: "No reminders... take it easy!",
                };
                const delay = emptyPlaceholderDelayRef.current;
                if (delay !== null && delay.filterKey === activeFilter && Date.now() < delay.untilMs) {
                  return <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
                }
                emptyPlaceholderDelayRef.current = null;
                return (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                    <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                      {emptyMessages[activeFilter]}
                    </p>
                  </div>
                );
              })()}
              {infoReminder && (
                <ReminderInfoOverlay
                  reminder={infoReminder}
                  smartReminderProgressLine={(() => {
                    if (!infoReminder.isSmartReminder || !infoReminder.linkedListId) return null;
                    const linkedList = createdLists.find((list) => list.id === infoReminder.linkedListId);
                    if (!linkedList) return null;
                    const completedCount = linkedList.items.filter((item) => item.completed).length;
                    return `${completedCount} of ${linkedList.items.length} items`;
                  })()}
                  onClose={() => setInfoReminder(null)}
                  onMarkAsDone={() => {
                    const reminderId = infoReminder.id;
                    setInfoReminder(null);
                    overlayDoneTimerRef.current = window.setTimeout(() => {
                      overlayDoneTimerRef.current = null;
                      handleCompleteClick(reminderId, { armEmptyDelay: isLastVisibleInThisList, filterKey: activeFilter, isRepeat: infoReminder?.repeatRule != null });
                    }, 200);
                  }}
                  onEdit={() => {
                    const reminderToEdit = infoReminder;
                    setInfoReminder(null);
                    if (overlayEditTimerRef.current !== null) {
                      clearTimeout(overlayEditTimerRef.current);
                    }
                    overlayEditTimerRef.current = window.setTimeout(() => {
                      overlayEditTimerRef.current = null;
                      setRepeatConfig(repeatRuleToConfig(reminderToEdit.repeatRule));
                      setEditingReminder(reminderToEdit);
                      setIsOverlayOpen(true);
                    }, 200);
                  }}
                  onGoToList={() => {
                    const linkedListId = infoReminder.linkedListId;
                    if (!linkedListId) return;
                    setInfoReminder(null);
                    openLinkedSmartReminderList(linkedListId);
                  }}
                  onMoveToTomorrow={() => {
                    const reminderId = infoReminder.id;
                    setInfoReminder(null);
                    if (overlayEditTimerRef.current !== null) {
                      clearTimeout(overlayEditTimerRef.current);
                    }
                    overlayEditTimerRef.current = window.setTimeout(() => {
                      overlayEditTimerRef.current = null;
                      handleMoveReminderToTomorrow(reminderId);
                    }, 200);
                  }}
                  onDelete={() => {
                    handleDeleteClick(infoReminder.id, { armEmptyDelay: isLastVisibleInThisList, filterKey: activeFilter });
                  }}
                />
              )}
              </>
            );
          })()}
        </div>

        {/* New reminder button - fixed at bottom */}
        {viewMode !== "done-deleted" && (
        <div className="content-stretch flex items-center justify-center w-full max-w-[768px] pb-[24px] shrink-0">
          <button
            className="bg-[#4784f8] content-stretch flex gap-[16px] items-center justify-center px-[30px] relative rounded-[100px] w-full transition-colors"
            style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }}
            onClick={() => setIsOverlayOpen(true)}
          >
            <div className="relative shrink-0 size-[15px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                <path d={svgPaths.p1e67ad80} fill="white" />
              </svg>
            </div>
            <div className="font-['Lato',sans-serif] font-bold text-[20px] text-white whitespace-nowrap">
              New reminder
            </div>
          </button>
        </div>
        )}
        </>
        )}
      </div>

      {/* New Reminder Overlay */}
      <AnimatePresence>
        {isOverlayOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleOverlayClose}
              className="fixed inset-0 bg-black/0 z-40"
            />
            
            {/* Overlay sliding from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onAnimationComplete={() => {
                if (isOverlayOpen) setIsReminderOverlayFocusReady(true);
              }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={reminderSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  handleOverlayClose();
                }}
                className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => reminderSheetDragControls.start(event)}
                />
                <NewReminderOverlay
                  onRepeatsOverlayOpen={() => setIsRepeatsOverlayOpen(true)}
                  repeatConfig={repeatConfig}
                  onRepeatConfigChange={setRepeatConfig}
                  isRepeatsOverlayOpen={isRepeatsOverlayOpen}
                  addReminder={addReminder}
                  onClose={handleOverlayClose}
                  nlcMode={nlcMode}
                  nlcEnabled={nlcEnabled}
                  nlcRecognition={nlcRecognition}
                  editReminder={editingReminder}
                  updateReminder={updateReminder}
                  smartReminderCreateList={smartReminderCreateList}
                  onCreateSmartReminder={createSmartReminderFromPanel}
                  useOneMinuteIncrements={useOneMinuteTimeIncrements}
                  autoFocusReady={isReminderOverlayFocusReady}
                />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Templates Overlay */}
      <AnimatePresence>
        {isListsEnabled && activeMainTab === 'lists' && (savedListsPanelOpen || (isSavedListsOverlayOpen && restoreSavedListsPanelAfterOverlayClose)) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSavedListsPanelOpen(false)}
              className="fixed inset-0 bg-black/0 z-40"
              style={{ pointerEvents: savedListsPanelOpen ? 'auto' : 'none' }}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0, pointerEvents: savedListsPanelOpen ? 'auto' : 'none' }}
            >
              <motion.div
                drag="y"
                dragControls={templatesSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  setSavedListsPanelOpen(false);
                }}
                className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => templatesSheetDragControls.start(event)}
                />
                <div className="relative w-full max-w-[768px] h-full flex flex-col mx-auto">
                  <div className="content-stretch flex flex-col gap-[30px] items-start pt-[24px] px-[24px] relative w-full shrink-0">
                    <div className="filters-menu flex items-center justify-between relative shrink-0 w-full h-[45px]">
                      <div className="font-['Lato',sans-serif] font-bold text-[20px] text-[#1C2C42] whitespace-nowrap">
                        Templates
                      </div>
                      <button
                        className="relative shrink-0 p-0 m-0 border-none bg-transparent flex items-center justify-center self-center cursor-pointer w-[45px] h-[45px]"
                        type="button"
                        onClick={() => setSavedListsPanelOpen(false)}
                        aria-label="Close templates"
                      >
                        <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                          <path d="M17.0199 17.0201L27.9801 27.9803M17.0199 27.9803L27.9801 17.0201" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex flex-col gap-[24px] w-full flex-1 min-h-0 px-[24px] mt-[24px]">
                    <div className="relative w-full max-w-[768px] flex-1 min-h-0">
                      <div className="content-stretch flex flex-col items-center justify-start overflow-x-clip w-full" style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: savedListsPanelOpen ? 'auto' : 'hidden', height: '100%' }}>
                        {savedLists.filter((list) => (list.status ?? 'active') !== 'deleted' || pendingDeletedSavedListIds.has(list.id)).length === 0 ? (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                            <p className="font-['Lato',sans-serif] text-[17px] text-[#CCCCCC]">
                              No list templates yet.. get busy!
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-[23px] w-full" style={{ position: 'relative', zIndex: 1 }}>
                            <AnimatePresence initial={false}>
                            {savedLists.filter((list) => (list.status ?? 'active') !== 'deleted' || pendingDeletedSavedListIds.has(list.id)).map((list) => {
                              const isPendingDeletedSavedList = pendingDeletedSavedListIds.has(list.id);
                              const deletedSavedListColor = '#898989';
                              return (
                              <motion.div
                                key={list.id}
                                layout
                                exit={{ opacity: 0 }}
                                transition={{ layout: { duration: 0.25 } }}
                              >
                              <div className="content-stretch flex items-start justify-between px-px relative w-full">
                                <div className="flex-[1_0_0] min-h-px min-w-px relative">
                                  <div className="flex flex-row items-start size-full">
                                    <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full min-w-0">
                                      <div className="relative shrink-0 size-[25px]" style={{ marginTop: '3px' }}>
                                        <SavedListTemplateIcon color={isPendingDeletedSavedList ? deletedSavedListColor : undefined} />
                                      </div>
                                      <div className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative" style={{ gap: '9px', minHeight: '38px' }}>
                                        <div
                                          className={`overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer${isPendingDeletedSavedList ? ' line-through' : ''}`}
                                          style={{ color: isPendingDeletedSavedList ? deletedSavedListColor : '#1C2C42', textDecorationColor: isPendingDeletedSavedList ? deletedSavedListColor : '#1C2C42', clipPath: 'inset(0 0 -4px 0)' }}
                                          onClick={() => openSavedListEditor(list)}
                                        >
                                          <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>
                                            {list.title}
                                          </p>
                                        </div>
                                        <div
                                          className={`flex items-center overflow-visible cursor-pointer${isPendingDeletedSavedList ? ' line-through' : ''} min-w-0`}
                                          style={{ textDecorationColor: isPendingDeletedSavedList ? deletedSavedListColor : '#BABABA' }}
                                          onClick={() => openSavedListEditor(list)}
                                        >
                                          <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: isPendingDeletedSavedList ? deletedSavedListColor : '#BABABA' }}>
                                            {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <RowMenuButton onClick={() => setSavedListMenuId(list.id)} alignWithSettingsButton={settingsMenuFeatureEnabled} />
                              </div>
                              </motion.div>
                            );
                            })}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="content-stretch flex items-center justify-center w-full max-w-[768px] pb-[24px] shrink-0">
                      <button
                        type="button"
                        className="bg-[#4784F8] content-stretch flex gap-[16px] items-center justify-center px-[30px] relative rounded-[100px] w-full"
                        style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }}
                        onClick={() => {
                          setListTitle(pickDefaultListName(createdLists.map(l => l.title)));
                          setListItems([]);
                          setListOverlayMode('create');
                          setEditingListId(null);
                          setEditingSavedListId(null);
                          setListSortMode('alphabetical');
                          setListSmartReminders(false);
                          setListSmartReminderDueDate(null);
                          setListSmartReminderTime(null);
                          setRestoreSavedListsPanelAfterOverlayClose(true);
                          setSavedListsPanelOpen(false);
                          setIsSavedListsOverlayOpen(true);
                        }}
                      >
                        <div className="relative shrink-0 size-[15px]">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                            <path d={svgPaths.p1e67ad80} fill="white" />
                          </svg>
                        </div>
                        <div className="font-['Lato',sans-serif] font-bold text-[20px] text-white whitespace-nowrap">
                          New template
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lists Overlay */}
      <AnimatePresence>
        {isListsEnabled && activeMainTab === 'lists' && (isListsOverlayOpen || isSavedListsOverlayOpen) && (() => {
          const isSavedListCreateOverlay = isSavedListsOverlayOpen && !isListsOverlayOpen;
          const isSavedListEditOverlay = isSavedListCreateOverlay && editingSavedListId !== null;
          const overlayDisplayListItems = displayListItems;
          const persistOverlayListDraft = ({ closeAfterSave = false, nextTitle, nextItems }: { closeAfterSave?: boolean; nextTitle?: string; nextItems?: typeof listItems } = {}) => {
            setIsListSettingsOpen(false);
            const title = (nextTitle ?? listTitle).trim();
            const items = (nextItems ?? listItems).map((item) => ({ ...item }));
            if (isSavedListCreateOverlay) {
              const savedItems = items.map((item) => ({ ...item, completed: false, completedAt: null }));
              if (editingSavedListId !== null) {
                setSavedLists((prev) => prev.map((list) => (
                  list.id === editingSavedListId ? { ...list, title, items: savedItems } : list
                )));
              } else if (title.length > 0 && savedItems.length > 0) {
                const newSavedListId = crypto.randomUUID();
                setSavedLists((prev) => [...prev, { id: newSavedListId, title, items: savedItems }]);
                setEditingSavedListId(newSavedListId);
              }
              if (closeAfterSave) {
                setIsSavedListsOverlayOpen(false);
                if (restoreSavedListsPanelAfterOverlayClose) {
                  setSavedListsPanelOpen(true);
                  setRestoreSavedListsPanelAfterOverlayClose(false);
                }
              }
              return;
            }
            if (listOverlayMode === 'edit' && editingListId !== null) {
              const targetId = editingListId;
              setCreatedLists((prev) => prev.map((l) => l.id === targetId ? { ...l, title, items, sortMode: listSortMode, smartReminders: listSmartReminders, smartReminderDueDate: listSmartReminderDueDate, smartReminderTime: listSmartReminderTime ?? (listSmartReminders && listSmartReminderDueDate ? '12:00' : null), status: l.status ?? 'active', statusChangedAt: l.statusChangedAt ?? null } : l));
            } else if (title.length > 0 && items.length > 0) {
              const newId = crypto.randomUUID();
              setCreatedLists((prev) => [...prev, { id: newId, title, items, sortMode: listSortMode, pinnedAt: null, smartReminders: listSmartReminders, smartReminderDueDate: listSmartReminderDueDate, smartReminderTime: listSmartReminderTime ?? (listSmartReminders && listSmartReminderDueDate ? '12:00' : null), status: 'active', statusChangedAt: null }]);
              setEditingListId(newId);
              setListOverlayMode('edit');
            }
            if (closeAfterSave) {
              setIsListsOverlayOpen(false);
            }
          };
          return (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => persistOverlayListDraft({ closeAfterSave: true })}
              className="fixed inset-0 bg-black/0 z-40"
            />
            
            {/* Overlay sliding from bottom */}
            <motion.div
              initial={{ y: "100%", top: getBottomSheetTopPosition() }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={listsSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  persistOverlayListDraft({ closeAfterSave: true });
                }}
                className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => listsSheetDragControls.start(event)}
                />
                <div className="relative w-full max-w-[768px] h-full flex flex-col mx-auto">
                  <div className="content-stretch flex flex-col gap-[26px] items-start pt-[24px] px-[24px] relative w-full shrink-0">
                    <ListsHeader
                      value={listTitle}
                      onChange={setListTitle}
                      active={listItems.length > 0}
                      isEditMode={isSavedListCreateOverlay ? (isSavedListEditOverlay || listTitle.length > 0) : (listOverlayMode === 'edit' || listTitle.length > 0)}
                      onSubmit={() => persistOverlayListDraft({ closeAfterSave: true })}
                      onClose={() => persistOverlayListDraft({ closeAfterSave: true })}
                      onGearClick={isSavedListCreateOverlay
                        ? (isSavedListEditOverlay && editingSavedListId !== null ? () => setTemplateEditorMenuId(editingSavedListId) : undefined)
                        : () => { setListSettingsSortModeDraft(listSortMode); setIsListSettingsOpen(true); }}
                      subtitleText={isSavedListCreateOverlay
                        ? `${listItems.length} ${listItems.length === 1 ? 'item' : 'items'}`
                        : listSmartReminders
                        ? `${formatListProgress(listItems.filter((item) => item.completed).length, listItems.length)}. ${formatSmartReminderDueBy(listSmartReminderDueDate, listSmartReminderTime)}`
                        : formatListProgress(listItems.filter((item) => item.completed).length, listItems.length)}
                      showSavedListSubtitleIcon={isSavedListCreateOverlay}
                      showSmartRemindersSubtitle={!isSavedListCreateOverlay && isSmartRemindersEnabled && listSmartReminders}
                      reserveSmartRemindersSubtitleSpace={!isSavedListCreateOverlay && isSmartRemindersEnabled}
                      showMenuButton={!isSavedListCreateOverlay || isSavedListEditOverlay}
                    />
                    <AddListItemInput onAdd={(text: string) => {
                      const newId = crypto.randomUUID();
                      const nextItems = [{ id: newId, text, completed: false, completedAt: null }, ...listItems];
                      setRevealedDeleteListItemId(null);
                      setListItems(nextItems);
                      if (isSavedListCreateOverlay) {
                        persistOverlayListDraft({ nextItems });
                        setListItemReinsertedId(newId);
                        setListItemHighlightId(newId);
                        if (listItemHighlightTimerRef.current !== null) {
                          clearTimeout(listItemHighlightTimerRef.current);
                        }
                        listItemHighlightTimerRef.current = window.setTimeout(() => {
                          listItemHighlightTimerRef.current = null;
                          setListItemHighlightId(null);
                        }, INSERT_HIGHLIGHT_MS);
                        return;
                      }
                      persistOverlayListDraft({ nextItems });
                      if (listSortMode === 'alphabetical') {
                        setAlphabeticalPinnedListItemId(newId);
                        setAlphabeticalPinnedListItemIndex(0);
                        if (alphabeticalListItemTimerRef.current !== null) {
                          clearTimeout(alphabeticalListItemTimerRef.current);
                        }
                        alphabeticalListItemTimerRef.current = window.setTimeout(() => {
                          alphabeticalListItemTimerRef.current = null;
                          setAlphabeticalPinnedListItemId(currentId => currentId === newId ? null : currentId);
                          setAlphabeticalPinnedListItemIndex(0);
                        }, 1500);
                      }
                      setListItemReinsertedId(newId);
                      setListItemHighlightId(newId);
                      if (listItemHighlightTimerRef.current !== null) {
                        clearTimeout(listItemHighlightTimerRef.current);
                      }
                        listItemHighlightTimerRef.current = window.setTimeout(() => {
                          listItemHighlightTimerRef.current = null;
                          setListItemHighlightId(null);
                        }, INSERT_HIGHLIGHT_MS);
                    }} isEmpty={listItems.length === 0} accentColor={isSavedListCreateOverlay ? '#4784F8' : currentListAccentColor} idleCircleColor="#D9D9D9" leadingIcon={isSavedListCreateOverlay ? <SavedListOverlayAddItemIcon /> : undefined} focusedLeadingIcon={isSavedListCreateOverlay ? <SavedListOverlayAddItemFocusedIcon /> : undefined} activeLeadingIcon={isSavedListCreateOverlay ? <SavedListOverlayAddItemFocusedIcon /> : undefined} nextPlaceholder={isSavedListCreateOverlay ? "Add your next template item..." : "Add your next item..."} />
                  </div>
                  <div className="flex flex-col gap-[23px] items-start px-[24px] pb-[24px] relative w-full flex-1 min-h-0 overflow-y-auto mt-[35px]">
                    <AnimatePresence initial={false}>
                    {overlayDisplayListItems.map((item) => {
                      const isItemReinserted = listItemReinsertedId === item.id;
                      const isItemHighlighted = listItemHighlightId === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          layout="position"
                          initial={isItemReinserted ? { opacity: 0 } : false}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={isItemReinserted
                            ? { opacity: { duration: 0.2 }, layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }
                            : { layout: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 } }
                          }
                          onAnimationComplete={() => {
                            if (isItemReinserted) {
                              setListItemReinsertedId(null);
                            }
                          }}
                          className="w-full"
                        >
                          <EditableListItem name={item.text} completed={isSavedListCreateOverlay ? false : item.completed} isHighlighted={isItemHighlighted} accentColor={isSavedListCreateOverlay ? '#4784F8' : currentListAccentColor} isDeleteRevealed={revealedDeleteListItemId === item.id} onDeleteRevealChange={(revealed) => setRevealedDeleteListItemId(revealed ? item.id : null)} onToggle={isSavedListCreateOverlay ? undefined : () => { hapticTap('toggleListItemCheckbox'); setRevealedDeleteListItemId(null); setListItems(prev => { const next = [...prev]; const idx = next.findIndex(i => i.id === item.id); if (idx !== -1) { const wasCompleted = next[idx].completed; next[idx] = { ...next[idx], completed: !wasCompleted, completedAt: wasCompleted ? null : Date.now() }; } return next; }); }} onDelete={() => { hapticTap('deleteListItem'); setRevealedDeleteListItemId(null); setListItems(prev => prev.filter((listItem) => listItem.id !== item.id)); }} editable={true} leadingIcon={isSavedListCreateOverlay ? <SavedListOverlayCheckCircle /> : undefined} onCommit={(val: string) => {
                            const currentIndex = overlayDisplayListItems.findIndex((displayItem) => displayItem.id === item.id);
                            setRevealedDeleteListItemId(null);
                            const nextItems = listItems.map((listItem) => (
                              listItem.id === item.id ? { ...listItem, text: val } : listItem
                            ));
                            setListItems(nextItems);
                            persistOverlayListDraft({ nextItems });
                            if (!isSavedListCreateOverlay && listSortMode === 'alphabetical' && currentIndex !== -1) {
                              setAlphabeticalPinnedListItemId(item.id);
                              setAlphabeticalPinnedListItemIndex(currentIndex);
                              if (alphabeticalListItemTimerRef.current !== null) {
                                clearTimeout(alphabeticalListItemTimerRef.current);
                              }
                              alphabeticalListItemTimerRef.current = window.setTimeout(() => {
                                alphabeticalListItemTimerRef.current = null;
                                setAlphabeticalPinnedListItemId(currentId => currentId === item.id ? null : currentId);
                                setAlphabeticalPinnedListItemIndex(0);
                              }, 1500);
                              setListItemHighlightId(item.id);
                              if (listItemHighlightTimerRef.current !== null) {
                                clearTimeout(listItemHighlightTimerRef.current);
                              }
                              listItemHighlightTimerRef.current = window.setTimeout(() => {
                                listItemHighlightTimerRef.current = null;
                                setListItemHighlightId(null);
                              }, INSERT_HIGHLIGHT_MS);
                            }
                          }} />
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
          );
        })()}
      </AnimatePresence>

      {isListSettingsOpen && isListsEnabled && activeMainTab === 'lists' && isListsOverlayOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={closeListSettingsOverlay}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
            <div className="pointer-events-auto w-full max-w-[400px]">
              <InfoOverlay sortMode={listSettingsSortModeDraft} onSortChange={setListSettingsSortModeDraft} listTitle={listTitle} onUncheckAll={handleListSettingsUncheckAll} onCreateTemplate={handleCreateTemplateFromListSettingsFeedback} createTemplateStage={createTemplateFeedback?.source === 'list-settings' && createTemplateFeedback.key === (editingListId ?? 'list-settings') ? createTemplateFeedback.stage : 'idle'} onDelete={() => {
                const listId = editingListId;
                if (!listId) return;
                runOverlayDeleteSequence(() => {
                  setIsListSettingsOpen(false);
                }, () => {
                  setIsListsOverlayOpen(false);
                }, () => {
                  handleListDeleteClick(listId);
                });
              }} allUnchecked={listItems.every(i => !i.completed)} smartReminders={listSmartReminders} onSmartRemindersChange={(val) => {
                if (!editingListId) return;
                if (!val) {
                  handleSmartRemindersChange(false);
                  return;
                }
                if (listSmartReminderDueDate) {
                  handleSmartRemindersChange(true);
                  setListSmartReminderTime((current) => current ?? '12:00');
                  return;
                }
                openSmartReminderAddFlow(editingListId, 'list-settings');
              }} showSmartReminders={isSmartRemindersEnabled} smartReminderDueDate={storageStringToDate(listSmartReminderDueDate)} smartReminderTime={listSmartReminderTime} onSetSmartReminderDueDate={(date) => { setListSmartReminderDueDate(dateToStorageString(date)); setListSmartReminderTime((current) => current ?? '12:00'); }} onOpenSmartReminderEditor={editingListId ? () => openSmartReminderEditFlow(editingListId, 'list-settings') : undefined} />
            </div>
          </div>
        </>
      )}

      {listInfoOverlayList && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setListInfoOverlayListId(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
            <div className="pointer-events-auto w-full max-w-[400px]">
              <ListInfoOverlay
                listTitle={listInfoOverlayList.title}
                smartReminders={(listInfoOverlayList.smartReminders ?? false) || pendingListInfoSmartReminderListId === listInfoOverlayList.id}
                onSmartRemindersChange={(val) => {
                  if (val) {
                    if (listInfoOverlayList.smartReminderDueDate) {
                      setCreatedLists((prev) => prev.map((list) => (
                        list.id === listInfoOverlayList.id
                          ? { ...list, smartReminders: true, smartReminderTime: list.smartReminderTime ?? '12:00' }
                          : list
                      )));
                      return;
                    }
                    openSmartReminderAddFlow(listInfoOverlayList.id, 'list-info');
                    return;
                  }
                  setCreatedLists((prev) => prev.map((list) => (
                    list.id === listInfoOverlayList.id ? { ...list, smartReminders: val } : list
                  )));
                }}
                showSmartReminders={isSmartRemindersEnabled}
                smartReminderDueDate={storageStringToDate(listInfoOverlayList.smartReminderDueDate)}
                smartReminderTime={listInfoOverlayList.smartReminderTime}
                onSetSmartReminderDueDate={(date) => {
                  const nextDate = dateToStorageString(date);
                  setCreatedLists((prev) => prev.map((list) => (
                    list.id === listInfoOverlayList.id ? { ...list, smartReminderDueDate: nextDate, smartReminderTime: list.smartReminderTime ?? '12:00' } : list
                  )));
                }}
                onOpenSmartReminderEditor={() => openSmartReminderEditFlow(listInfoOverlayList.id, 'list-info')}
                onMarkAsDone={() => {
                  const listId = listInfoOverlayList.id;
                  setListInfoOverlayListId(null);
                  window.setTimeout(() => {
                    handleListCompleteClick(listId);
                  }, 200);
                }}
                onEdit={() => {
                  const listToEdit = listInfoOverlayList;
                  setListInfoOverlayListId(null);
                  window.setTimeout(() => {
                    openListEditor(listToEdit);
                  }, 100);
                }}
                onTogglePinned={() => {
                  const listId = listInfoOverlayList.id;
                  setListInfoOverlayListId(null);
                  window.setTimeout(() => {
                    handleToggleListPinned(listId);
                  }, 200);
                }}
                isPinned={pinnedListsFeatureEnabled && typeof listInfoOverlayList.pinnedAt === 'number'}
                showPinnedLists={pinnedListsFeatureEnabled}
                onCreateTemplate={() => {
                  handleCreateTemplateFromListInfoFeedback(listInfoOverlayList);
                }}
                createTemplateStage={createTemplateFeedback?.source === 'list-info' && createTemplateFeedback.key === listInfoOverlayList.id ? createTemplateFeedback.stage : 'idle'}
                onDelete={() => {
                  const listId = listInfoOverlayList.id;
                  setListInfoOverlayListId(null);
                  window.setTimeout(() => {
                    handleListDeleteClick(listId);
                  }, 200);
                }}
              />
            </div>
          </div>
        </>
      )}

      {savedListMenuId && (() => {
        const savedList = savedLists.find((list) => list.id === savedListMenuId);
        if (!savedList) return null;
        const useButtonStage = savedListUseFeedback?.id === savedList.id ? savedListUseFeedback.stage : 'idle';
        return (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setSavedListMenuId(null)}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
              <div
                className="bg-white relative flex flex-col gap-[40px] items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] pointer-events-auto outline-none"
                style={{ width: 340 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                  <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>
                    {savedList.title}
                  </p>
                </div>

                <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
                  <button
                    className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                    style={{
                      backgroundColor: '#4784F8',
                      transition: 'background-color 150ms ease',
                    }}
                    onClick={() => handleUseSavedListWithFeedback(savedList)}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                        {useButtonStage === 'copied' ? (
                          <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0">
                            <svg className="block shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M14.4152 18.1609C14.854 18.1609 15.2098 18.5167 15.2098 18.9555C15.2098 19.3943 14.854 19.75 14.4152 19.75H11.6911C11.2523 19.75 10.8966 19.3943 10.8966 18.9555C10.8966 18.5167 11.2523 18.1609 11.6911 18.1609H14.4152Z" fill="white"/>
                              <path d="M6.99479 16.3608C7.42491 16.2746 7.84305 16.5532 7.92944 16.9833C8.01327 17.4004 8.14468 17.6113 8.34179 17.7734C8.55972 17.9527 8.88081 18.0883 9.48837 18.168C9.92328 18.2251 10.2297 18.6234 10.173 19.0583C10.1159 19.4934 9.71684 19.8 9.28176 19.7429C8.53098 19.6445 7.87526 19.4462 7.33265 18.9998C6.78118 18.5461 6.50747 17.9685 6.37228 17.2954C6.28606 16.8653 6.56467 16.4472 6.99479 16.3608Z" fill="white"/>
                              <path d="M18.1769 16.9833C18.2633 16.5532 18.6814 16.2746 19.1115 16.3608C19.5417 16.4472 19.8203 16.8653 19.734 17.2954C19.5989 17.9685 19.3251 18.5461 18.7737 18.9998C18.2311 19.4462 17.5753 19.6445 16.8246 19.7429C16.3895 19.8 15.9904 19.4934 15.9334 19.0583C15.8766 18.6234 16.183 18.2251 16.618 18.168C17.2255 18.0883 17.5466 17.9527 17.7645 17.7734C17.9616 17.6113 18.0931 17.4004 18.1769 16.9833Z" fill="white"/>
                              <path d="M7.60489 1.44977e-06C9.07801 1.55801e-06 10.2527 -0.00166324 11.1821 0.108187C12.129 0.220112 12.9241 0.457041 13.5914 1.0047C13.8156 1.18865 14.0211 1.3942 14.2051 1.61835C14.724 2.2507 14.964 2.99778 15.083 3.88048C15.1995 4.74551 15.2087 5.82103 15.2098 7.14998C15.2098 7.38362 15.1078 7.59341 14.9473 7.73879C14.926 7.75812 14.9041 7.77682 14.8808 7.79377C14.7912 7.85875 14.6881 7.90641 14.5757 7.92944C14.5242 7.94003 14.4708 7.94534 14.4161 7.9454L14.4152 7.94452L11.6911 7.9454C11.2523 7.9454 10.8966 7.58968 10.8966 7.15086C10.8966 6.71205 11.2523 6.35632 11.6911 6.35632H13.6171C13.6101 5.40556 13.587 4.67936 13.5081 4.0933C13.4108 3.37144 13.2394 2.94651 12.9769 2.6266C12.859 2.48291 12.7269 2.35079 12.5832 2.23287C12.246 1.9562 11.7924 1.78081 10.9959 1.68663C10.1815 1.59036 9.11694 1.58908 7.60489 1.58908C6.09283 1.58908 5.0283 1.59036 4.2139 1.68663C3.4174 1.78081 2.96381 1.9562 2.6266 2.23287C2.48291 2.35079 2.35079 2.48291 2.23287 2.6266C1.9562 2.96381 1.78081 3.4174 1.68663 4.2139C1.59036 5.0283 1.58908 6.09283 1.58908 7.60489C1.58908 9.11694 1.59036 10.1815 1.68663 10.9959C1.78081 11.7924 1.9562 12.246 2.23287 12.5832C2.35079 12.7269 2.48291 12.859 2.6266 12.9769C2.94651 13.2394 3.37144 13.4108 4.0933 13.5081C4.67936 13.587 5.40556 13.6092 6.35632 13.6163V11.6911C6.35632 11.2523 6.71205 10.8966 7.15086 10.8966C7.58968 10.8966 7.9454 11.2523 7.9454 11.6911V14.4152C7.9454 14.5523 7.91075 14.6813 7.84963 14.7939C7.81927 14.8498 7.78115 14.9005 7.73879 14.9473C7.7146 14.974 7.68922 14.9994 7.66164 15.0227C7.65471 15.0285 7.64748 15.0339 7.64036 15.0395C7.50532 15.1455 7.33587 15.2098 7.15086 15.2098L7.14998 15.2089C5.82102 15.2078 4.74552 15.1995 3.88048 15.083C2.99778 14.964 2.2507 14.724 1.61835 14.2051C1.3942 14.0211 1.18865 13.8156 1.0047 13.5914C0.457041 12.9241 0.220112 12.129 0.108187 11.1821C-0.00166323 10.2527 1.34081e-06 9.07801 1.44956e-06 7.60489C1.55651e-06 6.13177 -0.00166326 4.95703 0.108187 4.02768C0.220112 3.0808 0.457041 2.28568 1.0047 1.61835C1.18865 1.3942 1.3942 1.18865 1.61835 1.0047C2.28568 0.457041 3.0808 0.220112 4.02768 0.108187C4.95703 -0.00166331 6.13177 1.34101e-06 7.60489 1.44977e-06Z" fill="white"/>
                              <path d="M18.9555 10.8966C19.3943 10.8966 19.75 11.2523 19.75 11.6911V14.4152C19.75 14.854 19.3943 15.2098 18.9555 15.2098C18.5167 15.2098 18.1609 14.854 18.1609 14.4152V11.6911C18.1609 11.2523 18.5167 10.8966 18.9555 10.8966Z" fill="white"/>
                              <path d="M9.28176 6.36342C9.71684 6.30636 10.1159 6.61291 10.173 7.048C10.2297 7.48289 9.92328 7.88125 9.48837 7.93831C8.88081 8.01798 8.55972 8.15367 8.34179 8.33292C8.14468 8.49507 8.01327 8.7059 7.92944 9.12303C7.84305 9.55315 7.42491 9.83176 6.99479 9.74553C6.56467 9.65914 6.28606 9.241 6.37228 8.81089C6.50747 8.13783 6.78118 7.56022 7.33265 7.10653C7.87526 6.66015 8.53098 6.46187 9.28176 6.36342Z" fill="white"/>
                              <path d="M16.8246 6.36342C17.5753 6.46187 18.2311 6.66015 18.7737 7.10653C19.3251 7.56022 19.5989 8.13783 19.734 8.81089C19.8203 9.241 19.5417 9.65914 19.1115 9.74553C18.6814 9.83176 18.2633 9.55315 18.1769 9.12303C18.0931 8.7059 17.9616 8.49507 17.7645 8.33292C17.5466 8.15367 17.2255 8.01798 16.618 7.93831C16.183 7.88125 15.8766 7.48289 15.9334 7.048C15.9904 6.61291 16.3895 6.30636 16.8246 6.36342Z" fill="white"/>
                            </svg>
                            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                              <p className="leading-[normal]">Added to your lists!</p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap"
                            style={{
                              opacity: useButtonStage === 'blank' ? 0 : 1,
                              transition: `opacity ${useButtonStage === 'go' ? '250ms' : '150ms'} ease`,
                            }}
                          >
                            <p className="leading-[normal]">{useButtonStage === 'go' ? 'Go to list?' : (useButtonStage === 'blank' || useButtonStage === 'fill') ? '' : 'Use as list'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                    style={{ backgroundColor: '#4784F8' }}
                    onClick={() => {
                      setSavedListMenuId(null);
                      openSavedListEditor(savedList);
                    }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                          <p className="leading-[normal]">Edit template</p>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                    style={{ backgroundColor: '#939393' }}
                    onClick={() => {
                      handleSavedListDeleteClick(savedList.id);
                      setSavedListMenuId(null);
                    }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                          <p className="leading-[normal]">Delete template</p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {templateEditorMenuId && (() => {
        const savedList = savedLists.find((list) => list.id === templateEditorMenuId);
        if (!savedList) return null;
        const useButtonStage = savedListUseFeedback?.id === savedList.id ? savedListUseFeedback.stage : 'idle';
        return (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setTemplateEditorMenuId(null)}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
              <div
                className="bg-white relative flex flex-col gap-[40px] items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] pointer-events-auto outline-none"
                style={{ width: 340 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                  <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>
                    {savedList.title}
                  </p>
                </div>

                <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
                  <button
                    className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                    style={{
                      backgroundColor: '#4784F8',
                      transition: 'background-color 150ms ease',
                    }}
                    onClick={() => handleUseSavedListFromTemplateEditorFeedback(savedList)}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                        {useButtonStage === 'copied' ? (
                          <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0">
                            <svg className="block shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M14.4152 18.1609C14.854 18.1609 15.2098 18.5167 15.2098 18.9555C15.2098 19.3943 14.854 19.75 14.4152 19.75H11.6911C11.2523 19.75 10.8966 19.3943 10.8966 18.9555C10.8966 18.5167 11.2523 18.1609 11.6911 18.1609H14.4152Z" fill="white"/>
                              <path d="M6.99479 16.3608C7.42491 16.2746 7.84305 16.5532 7.92944 16.9833C8.01327 17.4004 8.14468 17.6113 8.34179 17.7734C8.55972 17.9527 8.88081 18.0883 9.48837 18.168C9.92328 18.2251 10.2297 18.6234 10.173 19.0583C10.1159 19.4934 9.71684 19.8 9.28176 19.7429C8.53098 19.6445 7.87526 19.4462 7.33265 18.9998C6.78118 18.5461 6.50747 17.9685 6.37228 17.2954C6.28606 16.8653 6.56467 16.4472 6.99479 16.3608Z" fill="white"/>
                              <path d="M18.1769 16.9833C18.2633 16.5532 18.6814 16.2746 19.1115 16.3608C19.5417 16.4472 19.8203 16.8653 19.734 17.2954C19.5989 17.9685 19.3251 18.5461 18.7737 18.9998C18.2311 19.4462 17.5753 19.6445 16.8246 19.7429C16.3895 19.8 15.9904 19.4934 15.9334 19.0583C15.8766 18.6234 16.183 18.2251 16.618 18.168C17.2255 18.0883 17.5466 17.9527 17.7645 17.7734C17.9616 17.6113 18.0931 17.4004 18.1769 16.9833Z" fill="white"/>
                              <path d="M7.60489 1.44977e-06C9.07801 1.55801e-06 10.2527 -0.00166324 11.1821 0.108187C12.129 0.220112 12.9241 0.457041 13.5914 1.0047C13.8156 1.18865 14.0211 1.3942 14.2051 1.61835C14.724 2.2507 14.964 2.99778 15.083 3.88048C15.1995 4.74551 15.2087 5.82103 15.2098 7.14998C15.2098 7.38362 15.1078 7.59341 14.9473 7.73879C14.926 7.75812 14.9041 7.77682 14.8808 7.79377C14.7912 7.85875 14.6881 7.90641 14.5757 7.92944C14.5242 7.94003 14.4708 7.94534 14.4161 7.9454L14.4152 7.94452L11.6911 7.9454C11.2523 7.9454 10.8966 7.58968 10.8966 7.15086C10.8966 6.71205 11.2523 6.35632 11.6911 6.35632H13.6171C13.6101 5.40556 13.587 4.67936 13.5081 4.0933C13.4108 3.37144 13.2394 2.94651 12.9769 2.6266C12.859 2.48291 12.7269 2.35079 12.5832 2.23287C12.246 1.9562 11.7924 1.78081 10.9959 1.68663C10.1815 1.59036 9.11694 1.58908 7.60489 1.58908C6.09283 1.58908 5.0283 1.59036 4.2139 1.68663C3.4174 1.78081 2.96381 1.9562 2.6266 2.23287C2.48291 2.35079 2.35079 2.48291 2.23287 2.6266C1.9562 2.96381 1.78081 3.4174 1.68663 4.2139C1.59036 5.0283 1.58908 6.09283 1.58908 7.60489C1.58908 9.11694 1.59036 10.1815 1.68663 10.9959C1.78081 11.7924 1.9562 12.246 2.23287 12.5832C2.35079 12.7269 2.48291 12.859 2.6266 12.9769C2.94651 13.2394 3.37144 13.4108 4.0933 13.5081C4.67936 13.587 5.40556 13.6092 6.35632 13.6163V11.6911C6.35632 11.2523 6.71205 10.8966 7.15086 10.8966C7.58968 10.8966 7.9454 11.2523 7.9454 11.6911V14.4152C7.9454 14.5523 7.91075 14.6813 7.84963 14.7939C7.81927 14.8498 7.78115 14.9005 7.73879 14.9473C7.7146 14.974 7.68922 14.9994 7.66164 15.0227C7.65471 15.0285 7.64748 15.0339 7.64036 15.0395C7.50532 15.1455 7.33587 15.2098 7.15086 15.2098L7.14998 15.2089C5.82102 15.2078 4.74552 15.1995 3.88048 15.083C2.99778 14.964 2.2507 14.724 1.61835 14.2051C1.3942 14.0211 1.18865 13.8156 1.0047 13.5914C0.457041 12.9241 0.220112 12.129 0.108187 11.1821C-0.00166323 10.2527 1.34081e-06 9.07801 1.44956e-06 7.60489C1.55651e-06 6.13177 -0.00166326 4.95703 0.108187 4.02768C0.220112 3.0808 0.457041 2.28568 1.0047 1.61835C1.18865 1.3942 1.3942 1.18865 1.61835 1.0047C2.28568 0.457041 3.0808 0.220112 4.02768 0.108187C4.95703 -0.00166331 6.13177 1.34101e-06 7.60489 1.44977e-06Z" fill="white"/>
                              <path d="M18.9555 10.8966C19.3943 10.8966 19.75 11.2523 19.75 11.6911V14.4152C19.75 14.854 19.3943 15.2098 18.9555 15.2098C18.5167 15.2098 18.1609 14.854 18.1609 14.4152V11.6911C18.1609 11.2523 18.5167 10.8966 18.9555 10.8966Z" fill="white"/>
                              <path d="M9.28176 6.36342C9.71684 6.30636 10.1159 6.61291 10.173 7.048C10.2297 7.48289 9.92328 7.88125 9.48837 7.93831C8.88081 8.01798 8.55972 8.15367 8.34179 8.33292C8.14468 8.49507 8.01327 8.7059 7.92944 9.12303C7.84305 9.55315 7.42491 9.83176 6.99479 9.74553C6.56467 9.65914 6.28606 9.241 6.37228 8.81089C6.50747 8.13783 6.78118 7.56022 7.33265 7.10653C7.87526 6.66015 8.53098 6.46187 9.28176 6.36342Z" fill="white"/>
                              <path d="M16.8246 6.36342C17.5753 6.46187 18.2311 6.66015 18.7737 7.10653C19.3251 7.56022 19.5989 8.13783 19.734 8.81089C19.8203 9.241 19.5417 9.65914 19.1115 9.74553C18.6814 9.83176 18.2633 9.55315 18.1769 9.12303C18.0931 8.7059 17.9616 8.49507 17.7645 8.33292C17.5466 8.15367 17.2255 8.01798 16.618 7.93831C16.183 7.88125 15.8766 7.48289 15.9334 7.048C15.9904 6.61291 16.3895 6.30636 16.8246 6.36342Z" fill="white"/>
                            </svg>
                            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                              <p className="leading-[normal]">Added to your lists!</p>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap"
                            style={{
                              opacity: useButtonStage === 'blank' ? 0 : 1,
                              transition: `opacity ${useButtonStage === 'go' ? '250ms' : '150ms'} ease`,
                            }}
                          >
                            <p className="leading-[normal]">{useButtonStage === 'go' ? 'Go to list?' : (useButtonStage === 'blank' || useButtonStage === 'fill') ? '' : 'Use as list'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                    style={{ backgroundColor: '#939393' }}
                    onClick={() => {
                      runOverlayDeleteSequence(() => {
                        setTemplateEditorMenuId(null);
                      }, () => {
                        setSavedListsPanelOpen(true);
                        setIsSavedListsOverlayOpen(false);
                      }, () => {
                        handleSavedListDeleteClick(savedList.id);
                      });
                    }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                          <p className="leading-[normal]">Delete template</p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {(doneInfoReminder || doneInfoList) && (
        <DeletedInfoOverlay
          title={doneInfoReminder ? getDisplayTitle(doneInfoReminder) : (doneInfoList?.title ?? '')}
          buttonColor={doneInfoReminder ? '#4784f8' : '#4784F8'}
          buttonLabel={
            doneInfoReminder
              ? (doneInfoReminder.deletedAt != null ? 'Mark as not deleted' : 'Mark as not done')
              : (doneInfoList?.status === 'deleted' ? 'Mark as not deleted' : 'Mark as not done')
          }
          onClose={() => setDoneInfoTarget(null)}
          onMarkAsNotDone={() => {
            const currentTarget = doneInfoTarget;
            if (!currentTarget) return;
            setDoneInfoTarget(null);
            window.setTimeout(() => {
              if (currentTarget.kind === 'reminder') {
                handleUncompleteClick(currentTarget.id);
              } else {
                const list = createdLists.find((entry) => entry.id === currentTarget.id);
                if (list?.status === 'deleted') {
                  handleListUndeleteClick(currentTarget.id);
                } else {
                  handleListUndoClick(currentTarget.id);
                }
              }
            }, 200);
          }}
        />
      )}

      {savedDeletedListInfo && (
        <DeletedInfoOverlay
          title={savedDeletedListInfo.title}
          buttonColor="#4784F8"
          buttonLabel="Mark as not deleted"
          onClose={() => setSavedDeletedListInfoId(null)}
          onMarkAsNotDone={() => {
            const listId = savedDeletedListInfo.id;
            setSavedDeletedListInfoId(null);
            window.setTimeout(() => {
              handleSavedListRestoreClick(listId);
            }, 200);
          }}
        />
      )}

      {/* Dev Tools Overlay */}
      <AnimatePresence>
        {isDevToolsOpen && (
          <>
            {/* Click-outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsDevToolsOpen(false)}
              className="fixed inset-0 z-40"
            />
            
            {/* Overlay sliding from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: devToolsTopRef.current ?? getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <DevToolsOverlay onClose={() => setIsDevToolsOpen(false)} onClearReminders={() => setReminders([])} addReminder={addReminder} addReminders={addReminders} nlcMode={nlcMode} onNlcModeChange={setNlcMode} nlcEnabled={nlcEnabled} onNlcEnabledChange={setNlcEnabled} nlcRecognition={nlcRecognition} onNlcRecognitionChange={setNlcRecognition} hideOverdue={hideOverdue} onHideOverdueChange={setHideOverdue} isOnboardingTutorialEnabled={isOnboardingTutorialEnabled} onOnboardingTutorialEnabledChange={setIsOnboardingTutorialEnabled} isListsEnabled={isListsEnabled} onListsEnabledChange={setIsListsEnabled} showTutorialOnFirstLaunch={showTutorialOnFirstLaunch} onShowTutorialOnFirstLaunchChange={setShowTutorialOnFirstLaunch} showTutorialOnEveryStart={showTutorialOnEveryStart} onShowTutorialOnEveryStartChange={setShowTutorialOnEveryStart} isDevToolsUnlocked={isDevToolsUnlocked} onDevToolsUnlock={() => setIsDevToolsUnlocked(true)} isDevToolsPasswordRequired={isDevToolsPasswordRequired} onDevToolsPasswordRequiredChange={setIsDevToolsPasswordRequired} useOneMinuteIncrements={useOneMinuteTimeIncrements} onUseOneMinuteIncrementsChange={setUseOneMinuteTimeIncrements} smartRemindersEnabled={smartRemindersFeatureEnabled} onSmartRemindersEnabledChange={setSmartRemindersFeatureEnabled} savedListsEnabled={savedListsFeatureEnabled} onSavedListsEnabledChange={handleSavedListsFeatureEnabledChange} pinnedListsEnabled={pinnedListsFeatureEnabled} onPinnedListsEnabledChange={setPinnedListsFeatureEnabled} settingsMenuEnabled={settingsMenuFeatureEnabled} onSettingsMenuEnabledChange={setSettingsMenuFeatureEnabled} showInfoIcons={showInfoIcons} onShowInfoIconsChange={setShowInfoIcons} notifReminderAlerts={notifReminderAlerts} onNotifReminderAlertsChange={setNotifReminderAlerts} notifAppBadge={notifAppBadge} onNotifAppBadgeChange={setNotifAppBadge} notifIncludeTodayInBadge={notifIncludeTodayInBadge} onNotifIncludeTodayInBadgeChange={setNotifIncludeTodayInBadge} siriShortcutsEnabled={siriShortcutsEnabled} onSiriShortcutsEnabledChange={setSiriShortcutsEnabled} useDefaultTemplatesInCleanState={useDefaultTemplatesInCleanState} onUseDefaultTemplatesInCleanStateChange={setUseDefaultTemplatesInCleanState} onClearLists={(useDefaultTemplatesInCleanState) => {
                setCreatedLists([]);
                setSavedLists(
                  useDefaultTemplatesInCleanState
                    ? DEFAULT_TEMPLATE_SEED.map((template) => ({
                        id: crypto.randomUUID(),
                        title: template.title,
                        items: template.items.map((text) => ({
                          id: crypto.randomUUID(),
                          text,
                          completed: false,
                          completedAt: null,
                        })),
                        status: 'active' as const,
                        statusChangedAt: null,
                      }))
                    : [],
                );
              }} onGenerateLists={({ lists, savedLists }) => {
                setCreatedLists(lists.map((list) => ({ ...list, status: list.status ?? 'active', statusChangedAt: list.statusChangedAt ?? null, pinnedAt: list.pinnedAt ?? null, smartReminderDueDate: list.smartReminderDueDate ?? null, smartReminderTime: list.smartReminderTime ?? null })));
                setSavedLists(savedLists.map((list) => ({
                  id: list.id,
                  title: list.title,
                  items: list.items.map((item) => ({ id: crypto.randomUUID(), text: item.text, completed: false, completedAt: null })),
                  status: list.status ?? 'active',
                  statusChangedAt: list.statusChangedAt ?? null,
                })));
                setUseDefaultTemplatesInCleanState(false);
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Repeats Overlay */}
      <AnimatePresence>
        {isRepeatsOverlayOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsRepeatsOverlayOpen(false)}
              className="fixed inset-0 bg-black/0 z-40"
            />
            
            {/* Overlay sliding from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={repeatsSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  setIsRepeatsOverlayOpen(false);
                }}
                className="relative"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => repeatsSheetDragControls.start(event)}
                />
                <RepeatsOverlay
                  onClose={(config) => {
                    if (config !== undefined) setRepeatConfig(config);
                    setIsRepeatsOverlayOpen(false);
                  }}
                  initialConfig={repeatConfig}
                />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {isRemindersSettingsPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsRemindersSettingsPanelOpen(false)}
              className="fixed inset-0 bg-black/0 z-40"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={remindersSettingsSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  setIsRemindersSettingsPanelOpen(false);
                }}
                className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => remindersSettingsSheetDragControls.start(event)}
                />
                <div className="relative w-full max-w-[768px] h-full flex flex-col mx-auto">
                  <ShowInfoIconsContext.Provider value={showInfoIcons}>
                  <RemindersSettingsContent
                    onClose={() => setIsRemindersSettingsPanelOpen(false)}
                    useOneMinuteIncrements={useOneMinuteTimeIncrements}
                    siriOn={settingsPanelSiriOn}
                    onSiriChange={setSettingsPanelSiriOn}
                    topContent={
                      isOnboardingTutorialEnabled && (
                      <button
                        type="button"
                        className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full p-0 m-0 border-none bg-transparent text-left cursor-pointer"
                        onClick={handleRemindersSettingsTutorialOpen}
                      >
                        <div className="content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative">
                          <div className="flex flex-col justify-start max-w-full min-w-0 overflow-visible relative shrink-0 text-[17px] text-[#1C2C42] w-full whitespace-nowrap">
                            <p className="block leading-[17px] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap w-full" style={{ boxSizing: 'content-box', fontSize: 17, fontWeight: 700, lineHeight: '17px', margin: 0, paddingBottom: 2, transform: 'translateY(-1px)' }}>Reminderly tutorial</p>
                          </div>
                        </div>
                        <div className="h-[19px] relative self-center shrink-0 w-[18px]" data-name="Union">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
                            <path d={tutorialIconPaths.p15f1c400} fill="#E5E5E5" />
                            <path d={tutorialIconPaths.p18a25a00} fill="#E5E5E5" />
                          </svg>
                        </div>
                      </button>
                      )
                    }
                  />
                  </ShowInfoIconsContext.Provider>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isListsSettingsPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsListsSettingsPanelOpen(false)}
              className="fixed inset-0 bg-black/0 z-40"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={listsSettingsSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  setIsListsSettingsPanelOpen(false);
                }}
                className="bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => listsSettingsSheetDragControls.start(event)}
                />
                <div className="relative w-full max-w-[768px] h-full flex flex-col mx-auto">
                  <ShowInfoIconsContext.Provider value={showInfoIcons}>
                  <ListsSettingsContent
                    onClose={() => setIsListsSettingsPanelOpen(false)}
                    siriOn={settingsPanelSiriOn}
                    onSiriChange={setSettingsPanelSiriOn}
                  />
                  </ShowInfoIconsContext.Provider>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isTutorialOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeTutorial}
              className="fixed inset-0 bg-black/0 z-40"
            />

            {/* Overlay sliding from bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0, top: getBottomSheetTopPosition() }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 right-0 z-50 mx-auto w-full"
              style={{ bottom: 0 }}
            >
              <motion.div
                drag="y"
                dragControls={tutorialSheetDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: viewportHeight }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!shouldCloseBottomSheetFromDrag(info.offset.y, info.velocity.y)) return;
                  closeTutorial();
                }}
                className="relative size-full"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y"
                  onPointerDown={(event) => tutorialSheetDragControls.start(event)}
                />
                <TutorialOverlay onClose={closeTutorial} isEnabled={isOnboardingTutorialEnabled} variant={tutorialVariant} isListsEnabled={isListsEnabled} settingsMenuEnabled={settingsMenuFeatureEnabled} smartRemindersEnabled={isSmartRemindersEnabled} savedListsEnabled={savedListsFeatureEnabled} />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
