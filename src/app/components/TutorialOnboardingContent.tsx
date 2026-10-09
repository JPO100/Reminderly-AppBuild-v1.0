import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import svgPaths from '@/imports/svg-go2phgsyt4';
import ListsHeader from '@/imports/Header';
import OnboardingPage1Content, { OnboardingPage1Text } from '@/app/components/OnboardingPage1Content';
import OnboardingPage2Content, { OnboardingPage2Text } from '@/app/components/OnboardingPage2Content';
import { useOnboardingPage2ActiveFilter } from '@/app/components/OnboardingPage2Content';
import OnboardingPage3Content, {
  CALL_DENTIST_TUTORIAL_REMINDER,
  OnboardingPage3Text,
  TUTORIAL_ATTENTION_SEQUENCE_DELAY,
  TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
  TUTORIAL_ATTENTION_THROB_DELAY,
  TUTORIAL_ATTENTION_THROB_DURATION,
  TUTORIAL_ATTENTION_THROB_TIMES,
  TutorialListSettingsOverlay,
  TutorialListSettingsOverlayWithToggle,
  TutorialMiniOverlayShell,
  TutorialReminderInfoOverlay,
  TutorialSmartReminderSheet,
} from '@/app/components/OnboardingPage3Content';
import OnboardingPage4Content, { OnboardingPage4Text } from '@/app/components/OnboardingPage4Content';
import OnboardingPage5Content, { OnboardingPage5Text, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY, PAGE_5_INITIAL_PAUSE_DELAY, PAGE_5_STATE_PAUSE_DELAY } from '@/app/components/OnboardingPage5Content';
import OnboardingPage6Content, { OnboardingPage6Text } from '@/app/components/OnboardingPage6Content';
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from '@/app/components/tutorialTokens';
import TutorialPhoneShell from '@/app/components/TutorialPhoneShell';
import TutorialStaticReminderList, { TUTORIAL_PAGE_2_DONE_LIST_IDS, TUTORIAL_REMINDER_LIST_SCALE } from '@/app/components/TutorialStaticReminderList';
import AddListItemInput from '@/app/components/lists/AddListItemInput';
import EditableListItem from '@/app/components/lists/EditableListItem';
import TutorialReminderFilters, {
  SAVED_LISTS_TUTORIAL_FILTER_ITEMS,
  type TutorialFilterKey,
  TutorialRemindersFilterRow,
  UNGROUPED_TUTORIAL_LIST_FILTER_ITEMS,
} from '@/app/components/TutorialReminderFilters';
import { getTutorialPageIds } from '@/app/utils/tutorial-pages';

interface TutorialOnboardingContentProps {
  onComplete: () => void;
  variant: 'reminders' | 'lists';
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  smartRemindersEnabled: boolean;
  savedListsEnabled: boolean;
}

const LIST_BLUE = "#4784F8";
const REMINDERLY_LIGHT_BLUE = "#4784F8";
const TUTORIAL_PHONE_GAP_TOP_CLASSNAME = "mt-[35px]";
const TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME = "pb-[45px]";
const TUTORIAL_LIST_OVERLAY_TOP = 11 + 5.026 + 65 - 2;
const LISTS_PAGE_3_TARGET_LIST_ID = "list-2";
const LISTS_PAGE_3_OPEN_ITEMS = [
  { id: "work-1", text: "Send invoice", completed: false },
  { id: "work-2", text: "Review notes", completed: false },
  { id: "work-3", text: "Book meeting", completed: false },
  { id: "work-4", text: "Update roadmap", completed: false },
  { id: "work-5", text: "Reply to Alex", completed: false },
] as const;
const LISTS_PAGE_3_DEMO_ITEM = "Prepare update";
const LISTS_PAGE_3_DEMO_ITEM_ID = "work-prepare-update";
const LISTS_PAGE_3_ADD_INPUT_DELAY = 750;
const LISTS_PAGE_3_TYPING_STEP_DELAY = 80;
const LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE = 50;
const LISTS_PAGE_3_POST_INSERT_PAUSE = 2000;
const LISTS_PAGE_3_POST_CLOSE_PAUSE = 2000;
const LIST_ITEM_INSERT_HIGHLIGHT_MS = 1000;
const SMART_REMINDER_PRE_DOTS_PAUSE = 750;
const SMART_REMINDER_POST_DOTS_PAUSE = 750;
const SMART_REMINDER_POST_SETTINGS_PAUSE = 750;
const SMART_REMINDER_POST_TOGGLE_PAUSE = 750;
const SMART_REMINDER_POST_CLOSE_PAUSE = 250;
const SMART_REMINDER_SHEET_PRE_THROB_PAUSE = 750;
const SMART_REMINDER_TICK_THROB_CIRCLE_SIZE = 62;
const NEW_REMINDER_INSERT_DELAY = 500;

type Page5Phase = "none" | "templates-throb" | "templates-open" | "template-row-throb" | "editor-open" | "typing" | "add-throb" | "item-added" | "menu-throb" | "settings-overlay";
const PAGE_5_TEMPLATES = [
  { id: "tpl-1", title: "Weekly food shop", itemCount: 8 },
  { id: "tpl-2", title: "Morning routine", itemCount: 6 },
  { id: "tpl-3", title: "Weekend tasks", itemCount: 5 },
  { id: "tpl-4", title: "Packing list (weekend away)", itemCount: 6 },
  { id: "tpl-5", title: "Spaghetti bolognese", itemCount: 6 },
  { id: "tpl-6", title: "Pancakes (classic)", itemCount: 6 },
] as const;
const PAGE_5_TARGET_TEMPLATE_ID = "tpl-1";
const PAGE_5_EDITOR_ITEMS = [
  { id: "shop-1", text: "Milk", completed: false },
  { id: "shop-2", text: "Bread", completed: false },
  { id: "shop-3", text: "Eggs", completed: false },
  { id: "shop-4", text: "Chicken", completed: false },
  { id: "shop-5", text: "Rice", completed: false },
  { id: "shop-6", text: "Bananas", completed: false },
  { id: "shop-7", text: "Pasta", completed: false },
  { id: "shop-8", text: "Butter", completed: false },
] as const;
const PAGE_5_DEMO_ITEM = "Olive oil";
const PAGE_5_DEMO_ITEM_ID = "shop-olive-oil";
const PAGE_5_THROB_TOTAL_MS = (TUTORIAL_ATTENTION_THROB_DELAY + TUTORIAL_ATTENTION_THROB_DURATION) * 1000;

function TutorialSavedListTemplateIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block size-full">
      <path d="M18.2471 22.9885C18.8026 22.9885 19.2529 23.4388 19.2529 23.9943C19.2529 24.5497 18.8026 25 18.2471 25H14.7989C14.2434 25 13.7931 24.5497 13.7931 23.9943C13.7931 23.4388 14.2434 22.9885 14.7989 22.9885H18.2471Z" fill="#4784F8"/>
      <path d="M8.85417 20.7099C9.39861 20.6007 9.92791 20.9534 10.0373 21.4978C10.1434 22.0259 10.3097 22.2927 10.5592 22.498C10.8351 22.7249 11.2415 22.8966 12.0106 22.9975C12.5611 23.0697 12.949 23.574 12.8772 24.1245C12.8049 24.6752 12.2998 25.0632 11.7491 24.991C10.7987 24.8664 9.96869 24.6154 9.28183 24.0504C8.58377 23.4761 8.23731 22.7449 8.06618 21.893C7.95704 21.3485 8.30971 20.8192 8.85417 20.7099Z" fill="#4784F8"/>
      <path d="M23.0087 21.4978C23.1181 20.9534 23.6474 20.6007 24.1918 20.7099C24.7363 20.8192 25.0889 21.3485 24.9798 21.893C24.8087 22.7449 24.4622 23.4761 23.7641 24.0504C23.0773 24.6154 22.2473 24.8664 21.2969 24.991C20.7462 25.0632 20.241 24.6752 20.1688 24.1245C20.0969 23.574 20.4849 23.0697 21.0354 22.9975C21.8044 22.8966 22.2109 22.7249 22.4868 22.498C22.7363 22.2927 22.9026 22.0259 23.0087 21.4978Z" fill="#4784F8"/>
      <path d="M9.62644 1.83515e-06C11.4911 1.97217e-06 12.9782 -0.00210536 14.1545 0.136945C15.3531 0.278622 16.3596 0.578533 17.2043 1.27178C17.4881 1.50462 17.7483 1.76481 17.9811 2.04854C18.638 2.84898 18.9418 3.79466 19.0924 4.912C19.2399 6.00698 19.2515 7.36839 19.2529 9.0506C19.2529 9.34636 19.1238 9.61191 18.9206 9.79593C18.8936 9.8204 18.866 9.84408 18.8364 9.86553C18.723 9.94779 18.5925 10.0081 18.4503 10.0373C18.3851 10.0507 18.3174 10.0574 18.2482 10.0575L18.2471 10.0563L14.7989 10.0575C14.2434 10.0575 13.7931 9.60718 13.7931 9.05172C13.7931 8.49627 14.2434 8.04598 14.7989 8.04598H17.2369C17.228 6.84247 17.1988 5.92324 17.0988 5.18139C16.9757 4.26764 16.7587 3.72976 16.4265 3.3248C16.2772 3.14293 16.1099 2.97568 15.9281 2.82642C15.5012 2.4762 14.9271 2.25419 13.9188 2.13497C12.8879 2.01311 11.5404 2.0115 9.62644 2.0115C7.71245 2.0115 6.36494 2.01311 5.33405 2.13497C4.32582 2.25419 3.75166 2.4762 3.3248 2.82642C3.14293 2.97568 2.97568 3.14293 2.82642 3.3248C2.4762 3.75166 2.25419 4.32582 2.13497 5.33405C2.01311 6.36494 2.0115 7.71245 2.0115 9.62644C2.0115 11.5404 2.01312 12.8879 2.13497 13.9188C2.25419 14.9271 2.4762 15.5012 2.82642 15.9281C2.97568 16.1099 3.14293 16.2772 3.3248 16.4265C3.72976 16.7587 4.26764 16.9757 5.18139 17.0988C5.92323 17.1988 6.84248 17.2269 8.04598 17.2358V14.7989C8.04598 14.2434 8.49627 13.7931 9.05172 13.7931C9.60718 13.7931 10.0575 14.2434 10.0575 14.7989V18.2471C10.0575 18.4206 10.0136 18.584 9.93624 18.7264C9.89781 18.7972 9.84956 18.8614 9.79593 18.9206C9.76531 18.9544 9.73319 18.9866 9.69828 19.016C9.68951 19.0234 9.68036 19.0303 9.67134 19.0374C9.5004 19.1716 9.28591 19.2529 9.05172 19.2529L9.0506 19.2518C7.36838 19.2504 6.00698 19.2399 4.912 19.0924C3.79466 18.9418 2.84898 18.638 2.04854 17.9811C1.76481 17.7483 1.50462 17.4881 1.27178 17.2043C0.578533 16.3596 0.278622 15.3531 0.136945 14.1545C-0.00210535 12.9782 1.69723e-06 11.4911 1.83489e-06 9.62644C1.97026e-06 7.76173 -0.0021054 6.27471 0.136945 5.09833C0.278623 3.89974 0.578532 2.89326 1.27178 2.04854C1.50462 1.76481 1.76481 1.50462 2.04854 1.27178C2.89326 0.578533 3.89974 0.278622 5.09833 0.136945C6.27471 -0.00210546 7.76173 1.69748e-06 9.62644 1.83515e-06Z" fill="#4784F8"/>
      <path d="M23.9943 13.7931C24.5497 13.7931 25 14.2434 25 14.7989V18.2471C25 18.8026 24.5497 19.2529 23.9943 19.2529C23.4388 19.2529 22.9885 18.8026 22.9885 18.2471V14.7989C22.9885 14.2434 23.4388 13.7931 23.9943 13.7931Z" fill="#4784F8"/>
      <path d="M11.7491 8.05496C12.2998 7.98274 12.8049 8.37077 12.8772 8.92152C12.949 9.47202 12.5611 9.97626 12.0106 10.0485C11.2415 10.1493 10.8351 10.3211 10.5592 10.548C10.3097 10.7533 10.1434 11.0201 10.0373 11.5481C9.92791 12.0926 9.39861 12.4453 8.85417 12.3361C8.30971 12.2268 7.95704 11.6975 8.06618 11.153C8.23731 10.3011 8.58377 9.56989 9.28183 8.9956C9.96869 8.43057 10.7987 8.17958 11.7491 8.05496Z" fill="#4784F8"/>
      <path d="M21.2969 8.05496C22.2473 8.17958 23.0773 8.43057 23.7641 8.9956C24.4622 9.5699 24.8087 10.3011 24.9798 11.153C25.0889 11.6975 24.7363 12.2268 24.1918 12.3361C23.6474 12.4453 23.1181 12.0926 23.0087 11.5481C22.9026 11.0201 22.7363 10.7533 22.4868 10.548C22.2109 10.3211 21.8044 10.1493 21.0354 10.0485C20.4849 9.97626 20.0969 9.47202 20.1688 8.92152C20.241 8.37077 20.7462 7.98274 21.2969 8.05496Z" fill="#4784F8"/>
    </svg>
  );
}

function TemplatesTutorialButton() {
  return (
    <div className="bg-[#4784F8] content-stretch flex items-center justify-center px-[11.487px] h-[32.308px] relative rounded-[71.795px] shrink-0">
      <div className="content-stretch flex items-center justify-center gap-[5.744px] relative">
        <div className="font-['Lato',sans-serif] font-bold text-[10.051px] text-white whitespace-nowrap">
          Templates
        </div>
        <svg className="block shrink-0" width="5" height="7" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M1.72101 0.269035C1.34568 -0.0896783 0.737045 -0.0896783 0.361708 0.269035C-0.0135638 0.627741 -0.0135771 1.20921 0.361708 1.56791L3.91284 4.96154L0.281458 8.43209C-0.0938212 8.79079 -0.0938182 9.37226 0.281458 9.73096C0.656796 10.0897 1.26543 10.0897 1.64076 9.73096L5.80081 5.75517C5.86027 5.71933 5.91677 5.67686 5.96858 5.62735C6.34382 5.26866 6.3438 4.68717 5.96858 4.32847L1.72101 0.269035Z" fill="white"/>
        </svg>
      </div>
    </div>
  );
}

function TutorialSavedListCheckCircle() {
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

function TutorialSavedListAddItemIcon() {
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

function TutorialSavedListAddItemFocusedIcon() {
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

function Page5DoneDeletedFilters() {
  return (
    <div className="relative shrink-0 w-full px-[14px] pt-[14px] pb-[8px]">
      <div className="flex items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <div
            className="bg-white content-stretch flex items-center justify-center px-[11.144px] h-[31.5px] relative rounded-[69.652px] shrink-0"
            style={{ boxShadow: "inset 0 0 0 1.392px #4784F8", color: "#4784F8" }}
          >
            <div className="font-['Lato',sans-serif] font-bold text-[9.751px] whitespace-nowrap">
              Done
            </div>
          </div>
          <div
            className="content-stretch flex items-center justify-center px-[11.144px] h-[31.5px] relative rounded-[69.652px] shrink-0"
            style={{ boxShadow: "inset 0 0 0 0.696px #898989", color: "#898989" }}
          >
            <div className="font-['Lato',sans-serif] font-bold text-[9.751px] whitespace-nowrap">
              Deleted
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-center h-[31.5px] w-[66px] relative rounded-[69.652px] shrink-0 border border-solid border-[#4784F8] text-[#4784F8]">
          <div className="font-['Lato',sans-serif] font-bold text-[9.751px] whitespace-nowrap">
            Clear all
          </div>
        </div>
      </div>
    </div>
  );
}

function ListsTutorialOpenListOverlay({ open, mode, onSmartFlowPhaseChange, onAddItemSequenceComplete }: { open: boolean; mode: "add-item" | "settings"; onSmartFlowPhaseChange?: (phase: "none" | "settings-with-toggle" | "toggle-active" | "closing" | "smart-sheet" | "sheet-closing" | "reminder-visible") => void; onAddItemSequenceComplete?: () => void }) {
  const [items, setItems] = useState(LISTS_PAGE_3_OPEN_ITEMS.map((item) => ({ ...item })));
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [addButtonElement, setAddButtonElement] = useState<HTMLButtonElement | null>(null);
  const [addHighlightHostElement, setAddHighlightHostElement] = useState<HTMLDivElement | null>(null);
  const [addButtonRect, setAddButtonRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [openPanelElement, setOpenPanelElement] = useState<HTMLDivElement | null>(null);
  const [menuDotsRect, setMenuDotsRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [showMenuDotsHighlight, setShowMenuDotsHighlight] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [smartToggleActive, setSmartToggleActive] = useState(false);
  const [reinsertedItemId, setReinsertedItemId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const completedCount = items.filter((item) => item.completed).length;

  useEffect(() => {
    if (!open) {
      setItems(LISTS_PAGE_3_OPEN_ITEMS.map((item) => ({ ...item })));
      setInputValue("");
      setInputFocused(false);
      setShowAddHighlight(false);
      setShowMenuDotsHighlight(false);
      setShowSettingsOverlay(false);
      setSmartToggleActive(false);
      setReinsertedItemId(null);
      setHighlightedItemId(null);
      onSmartFlowPhaseChange?.("none");
      return;
    }

    const timers: number[] = [];
    let cancelled = false;

    setInputValue("");
    setInputFocused(false);
    setShowAddHighlight(false);
    setShowMenuDotsHighlight(false);
    setShowSettingsOverlay(false);
    setSmartToggleActive(false);
    setReinsertedItemId(null);
    setHighlightedItemId(null);
    onSmartFlowPhaseChange?.("none");

    if (mode === "settings") {
      setItems([
        { id: LISTS_PAGE_3_DEMO_ITEM_ID, text: LISTS_PAGE_3_DEMO_ITEM, completed: false },
        ...LISTS_PAGE_3_OPEN_ITEMS.map((item) => ({ ...item })),
      ]);

      const t1 = SMART_REMINDER_PRE_DOTS_PAUSE;
      const t2 = t1 + TUTORIAL_ATTENTION_THROB_DURATION * 1000 + SMART_REMINDER_POST_DOTS_PAUSE;
      const t3 = t2 + SMART_REMINDER_POST_SETTINGS_PAUSE;
      const t4 = t3 + SMART_REMINDER_POST_TOGGLE_PAUSE;

      const menuHighlightTimer = window.setTimeout(() => {
        if (cancelled) return;
        setShowMenuDotsHighlight(true);
      }, t1);
      timers.push(menuHighlightTimer);

      const settingsOverlayTimer = window.setTimeout(() => {
        if (cancelled) return;
        setShowMenuDotsHighlight(false);
        setShowSettingsOverlay(true);
        onSmartFlowPhaseChange?.("settings-with-toggle");
      }, t2);
      timers.push(settingsOverlayTimer);

      const smartToggleActivateTimer = window.setTimeout(() => {
        if (cancelled) return;
        setSmartToggleActive(true);
        onSmartFlowPhaseChange?.("toggle-active");
      }, t3);
      timers.push(smartToggleActivateTimer);

      const closeTimer = window.setTimeout(() => {
        if (cancelled) return;
        setShowSettingsOverlay(false);
        onSmartFlowPhaseChange?.("closing");
      }, t4);
      timers.push(closeTimer);
    } else {
      const startAddItemCycle = () => {
        if (cancelled) {
          return;
        }

        setItems(LISTS_PAGE_3_OPEN_ITEMS.map((item) => ({ ...item })));
        setInputValue("");
        setInputFocused(false);
        setShowAddHighlight(false);
        setReinsertedItemId(null);
        setHighlightedItemId(null);

        const inputTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          setInputFocused(true);
          LISTS_PAGE_3_DEMO_ITEM.split("").forEach((_, index) => {
            const typingTimer = window.setTimeout(() => {
              if (cancelled) {
                return;
              }

              setInputValue(LISTS_PAGE_3_DEMO_ITEM.slice(0, index + 1));
            }, index * LISTS_PAGE_3_TYPING_STEP_DELAY);
            timers.push(typingTimer);
          });

          const highlightTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            setShowAddHighlight(true);
          }, LISTS_PAGE_3_DEMO_ITEM.length * LISTS_PAGE_3_TYPING_STEP_DELAY);
          timers.push(highlightTimer);

          const addTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            setShowAddHighlight(false);
            setInputFocused(false);
            setInputValue("");
            setItems((currentItems) => [
              { id: LISTS_PAGE_3_DEMO_ITEM_ID, text: LISTS_PAGE_3_DEMO_ITEM, completed: false },
              ...currentItems.filter((item) => item.id !== LISTS_PAGE_3_DEMO_ITEM_ID),
            ]);
            setReinsertedItemId(LISTS_PAGE_3_DEMO_ITEM_ID);
            setHighlightedItemId(LISTS_PAGE_3_DEMO_ITEM_ID);

            const clearHighlightTimer = window.setTimeout(() => {
              if (cancelled) {
                return;
              }
              setHighlightedItemId(null);
            }, LIST_ITEM_INSERT_HIGHLIGHT_MS);
            timers.push(clearHighlightTimer);

            const completeTimer = window.setTimeout(() => {
              if (cancelled) return;
              onAddItemSequenceComplete?.();
            }, LIST_ITEM_INSERT_HIGHLIGHT_MS + LISTS_PAGE_3_POST_INSERT_PAUSE);
            timers.push(completeTimer);
          }, LISTS_PAGE_3_DEMO_ITEM.length * LISTS_PAGE_3_TYPING_STEP_DELAY + TUTORIAL_ATTENTION_SEQUENCE_DELAY);
          timers.push(addTimer);
        }, LISTS_PAGE_3_ADD_INPUT_DELAY);
        timers.push(inputTimer);
      };

      startAddItemCycle();
    }

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [open, mode]);

  useEffect(() => {
    if (!addButtonElement || !addHighlightHostElement) {
      setAddButtonRect(null);
      return;
    }

    const updateRect = () => {
      const targetRect = addButtonElement.getBoundingClientRect();
      const parentRect = addHighlightHostElement.getBoundingClientRect();
      setAddButtonRect({
        left: (targetRect.left - parentRect.left) / TUTORIAL_REMINDER_LIST_SCALE,
        top: (targetRect.top - parentRect.top) / TUTORIAL_REMINDER_LIST_SCALE,
        width: targetRect.width / TUTORIAL_REMINDER_LIST_SCALE,
        height: targetRect.height / TUTORIAL_REMINDER_LIST_SCALE,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
    };
  }, [addButtonElement, addHighlightHostElement]);

  useEffect(() => {
    if (!openPanelElement || !addHighlightHostElement) {
      setMenuDotsRect(null);
      return;
    }

    const updateRect = () => {
      const menuButton = openPanelElement.querySelector('[data-name="menu-dots-btn"]');
      if (!(menuButton instanceof HTMLElement)) {
        setMenuDotsRect(null);
        return;
      }

      const targetRect = menuButton.getBoundingClientRect();
      const parentRect = addHighlightHostElement.getBoundingClientRect();
      setMenuDotsRect({
        left: (targetRect.left - parentRect.left) / TUTORIAL_REMINDER_LIST_SCALE,
        top: (targetRect.top - parentRect.top) / TUTORIAL_REMINDER_LIST_SCALE,
        width: targetRect.width / TUTORIAL_REMINDER_LIST_SCALE,
        height: targetRect.height / TUTORIAL_REMINDER_LIST_SCALE,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
    };
  }, [openPanelElement, addHighlightHostElement]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-40 bg-black/0"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, top: TUTORIAL_LIST_OVERLAY_TOP }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute left-0 right-0 z-50 mx-auto w-full"
            style={{ bottom: 0 }}
          >
            <motion.div
              className="bg-white relative rounded-tl-[15px] rounded-tr-[15px]"
              style={{
                width: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                height: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                transform: `scale(${TUTORIAL_REMINDER_LIST_SCALE})`,
                transformOrigin: "top center",
                left: "50%",
                translate: "-50% 0",
              }}
            >
              <div ref={setOpenPanelElement} className="relative w-full h-full flex flex-col mx-auto">
                <div
                  ref={setAddHighlightHostElement}
                  className="content-stretch flex flex-col gap-[30px] items-start pt-[30px] px-[24px] relative w-full shrink-0"
                >
                  <ListsHeader
                    value="Work tasks"
                    onChange={() => {}}
                    active
                    isEditMode
                    onSubmit={() => {}}
                    onClose={() => {}}
                    subtitleText={`${completedCount} of ${items.length}`}
                    showMenuButton
                  />
                  <AddListItemInput
                    isEmpty={false}
                    accentColor="#9468D5"
                    idleCircleColor="#D9D9D9"
                    nextPlaceholder="Add your next item..."
                    demoValue={inputValue}
                    demoFocused={inputFocused}
                    onAddButtonElementChange={setAddButtonElement}
                  />
                  {showAddHighlight && addButtonRect && (
                    <motion.div
                      className="absolute z-10 pointer-events-none"
                      style={{
                        left: addButtonRect.left + (addButtonRect.width / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                        top: addButtonRect.top + (addButtonRect.height / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                        width: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                        height: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
                      }}
                      transition={{
                        duration: TUTORIAL_ATTENTION_THROB_DURATION,
                        delay: TUTORIAL_ATTENTION_THROB_DELAY,
                        times: TUTORIAL_ATTENTION_THROB_TIMES,
                        ease: "easeInOut",
                      }}
                    >
                      <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                        <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
                      </svg>
                    </motion.div>
                  )}
                  {showMenuDotsHighlight && menuDotsRect && (
                    <motion.div
                      className="absolute z-10 pointer-events-none"
                      style={{
                        left: menuDotsRect.left + (menuDotsRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2) + 7,
                        top: menuDotsRect.top + (menuDotsRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
                        width: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                        height: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
                      }}
                      transition={{
                        duration: TUTORIAL_ATTENTION_THROB_DURATION,
                        delay: TUTORIAL_ATTENTION_THROB_DELAY,
                        times: TUTORIAL_ATTENTION_THROB_TIMES,
                        ease: "easeInOut",
                      }}
                    >
                      <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                        <circle cx="17.5" cy="17.5" r="16" stroke="#4784F8" strokeWidth="3" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <div className="flex flex-col gap-[23px] items-start px-[24px] pb-[24px] relative w-full flex-1 min-h-0 overflow-y-auto mt-[35px]">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const isItemReinserted = reinsertedItemId === item.id;
                      const isItemHighlighted = highlightedItemId === item.id;
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
                              setReinsertedItemId(null);
                            }
                          }}
                          className="w-full"
                        >
                          <EditableListItem
                            name={item.text}
                            completed={item.completed}
                            isHighlighted={isItemHighlighted}
                            accentColor="#9468D5"
                            editable
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
          {showSettingsOverlay && (mode === "settings" ? (
            <TutorialListSettingsOverlayWithToggle smartToggleActive={smartToggleActive} />
          ) : (
            <TutorialListSettingsOverlay />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

function SmartReminderSheetOverlay({ visible, showTickThrob, onExitComplete }: { visible: boolean; showTickThrob?: boolean; onExitComplete?: () => void }) {
  const [tickButtonElement, setTickButtonElement] = useState<HTMLDivElement | null>(null);
  const [tickButtonRect, setTickButtonRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const scaledContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tickButtonElement || !scaledContainerRef.current) {
      setTickButtonRect(null);
      return;
    }
    const parentRect = scaledContainerRef.current.getBoundingClientRect();
    const targetRect = tickButtonElement.getBoundingClientRect();
    const scale = TUTORIAL_REMINDER_LIST_SCALE;
    setTickButtonRect({
      left: (targetRect.left - parentRect.left) / scale,
      top: (targetRect.top - parentRect.top) / scale,
      width: targetRect.width / scale,
      height: targetRect.height / scale,
    });
  }, [tickButtonElement]);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && (
        <>
          <motion.div
            key="smart-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-40 bg-black/0"
          />
          <motion.div
            key="smart-sheet-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0, top: TUTORIAL_LIST_OVERLAY_TOP }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute left-0 right-0 z-50 mx-auto w-full"
            style={{ bottom: 0 }}
          >
            <motion.div
              ref={scaledContainerRef}
              className="bg-white relative rounded-tl-[15px] rounded-tr-[15px]"
              style={{
                width: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                height: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                transform: `scale(${TUTORIAL_REMINDER_LIST_SCALE})`,
                transformOrigin: "top center",
                left: "50%",
                translate: "-50% 0",
              }}
            >
              <TutorialSmartReminderSheet onTickButtonElementChange={setTickButtonElement} />
              {showTickThrob && tickButtonRect && (
                <motion.div
                  className="absolute z-10 pointer-events-none"
                  style={{
                    left: tickButtonRect.left + (tickButtonRect.width / 2) - (SMART_REMINDER_TICK_THROB_CIRCLE_SIZE / 2),
                    top: tickButtonRect.top + (tickButtonRect.height / 2) - (SMART_REMINDER_TICK_THROB_CIRCLE_SIZE / 2),
                    width: SMART_REMINDER_TICK_THROB_CIRCLE_SIZE,
                    height: SMART_REMINDER_TICK_THROB_CIRCLE_SIZE,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
                  }}
                  transition={{
                    duration: TUTORIAL_ATTENTION_THROB_DURATION,
                    delay: TUTORIAL_ATTENTION_THROB_DELAY,
                    times: TUTORIAL_ATTENTION_THROB_TIMES,
                    ease: "easeInOut",
                  }}
                >
                  <svg width={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE} height={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE} viewBox={`0 0 ${SMART_REMINDER_TICK_THROB_CIRCLE_SIZE} ${SMART_REMINDER_TICK_THROB_CIRCLE_SIZE}`} fill="none">
                    <circle cx={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE / 2} cy={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE / 2} r={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE / 2 - 1.5} stroke="#4784F8" strokeWidth="3" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ListsTutorialPlaceholderPage({
  currentPage,
  settingsMenuEnabled,
  savedListsEnabled,
  activeFilter,
  onActiveFilterChange,
  page2CycleKey,
  page2Phase,
  page2ShowLogoHighlight,
  page2ShowDoneLists,
  onPage2DoneSequenceComplete,
}: {
  currentPage: number;
  settingsMenuEnabled: boolean;
  savedListsEnabled: boolean;
  activeFilter?: TutorialFilterKey;
  onActiveFilterChange?: (activeFilter: TutorialFilterKey | undefined) => void;
  page2CycleKey: number;
  page2Phase: "marking" | "done-list";
  page2ShowLogoHighlight: boolean;
  page2ShowDoneLists: boolean;
  onPage2DoneSequenceComplete: () => void;
}) {
  const [page3TargetElement, setPage3TargetElement] = useState<HTMLDivElement | null>(null);
  const [page3TargetRect, setPage3TargetRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [page3ShowHighlight, setPage3ShowHighlight] = useState(false);
  const [page3ListOpen, setPage3ListOpen] = useState(false);
  const [smartFlowPhase, setSmartFlowPhase] = useState<"none" | "settings-with-toggle" | "toggle-active" | "closing" | "smart-sheet" | "sheet-throb" | "sheet-closing" | "insert-delay" | "reminder-visible">("none");
  const page4ShowSmartSheet = smartFlowPhase === "smart-sheet" || smartFlowPhase === "sheet-throb" || smartFlowPhase === "sheet-closing";
  const page4ActiveTab: "reminders" | "lists" = (smartFlowPhase === "closing" || smartFlowPhase === "smart-sheet" || smartFlowPhase === "sheet-throb" || smartFlowPhase === "sheet-closing" || smartFlowPhase === "insert-delay" || smartFlowPhase === "reminder-visible") ? "reminders" : "lists";
  const listFilterItems =
    savedListsEnabled
      ? SAVED_LISTS_TUTORIAL_FILTER_ITEMS
      : UNGROUPED_TUTORIAL_LIST_FILTER_ITEMS;
  const displayActiveFilter: TutorialFilterKey | undefined = activeFilter;

  const [page5Phase, setPage5Phase] = useState<Page5Phase>("none");
  const [page5TemplatesButtonElement, setPage5TemplatesButtonElement] = useState<HTMLDivElement | null>(null);
  const [page5TemplatesButtonRect, setPage5TemplatesButtonRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [page5EditorItems, setPage5EditorItems] = useState(PAGE_5_EDITOR_ITEMS.map((item) => ({ ...item })));
  const [page5InputValue, setPage5InputValue] = useState("");
  const [page5InputFocused, setPage5InputFocused] = useState(false);
  const [page5ShowAddHighlight, setPage5ShowAddHighlight] = useState(false);
  const [page5AddButtonElement, setPage5AddButtonElement] = useState<HTMLButtonElement | null>(null);
  const [page5AddButtonRect, setPage5AddButtonRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [page5EditorHostElement, setPage5EditorHostElement] = useState<HTMLDivElement | null>(null);
  const [page5MenuDotsRect, setPage5MenuDotsRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [page5ReinsertedItemId, setPage5ReinsertedItemId] = useState<string | null>(null);
  const [page5HighlightedItemId, setPage5HighlightedItemId] = useState<string | null>(null);
  const [page5TargetTemplateElement, setPage5TargetTemplateElement] = useState<HTMLDivElement | null>(null);
  const [page5TargetTemplateRect, setPage5TargetTemplateRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [page5ChildrenElement, setPage5ChildrenElement] = useState<HTMLDivElement | null>(null);

  const page3CycleRef = useRef<{ timers: number[]; cancelled: boolean; startCycle: () => void }>({ timers: [], cancelled: true, startCycle: () => {} });

  useEffect(() => {
    if (currentPage !== 2 && currentPage !== 3 && currentPage !== 4) {
      setPage3ShowHighlight(false);
      setPage3ListOpen(false);
      setSmartFlowPhase("none");
      setPage5Phase("none");
      return;
    }

    if (currentPage === 4) {
      setPage3ShowHighlight(false);
      setPage3ListOpen(false);
      setSmartFlowPhase("none");
      return;
    }

    if (currentPage !== 2 && currentPage !== 3) {
      setPage3ShowHighlight(false);
      setPage3ListOpen(false);
      setSmartFlowPhase("none");
      return;
    }

    if (currentPage === 3) {
      setPage3ShowHighlight(false);
      setPage3ListOpen(true);
      setSmartFlowPhase("none");
      return;
    }

    const state = { timers: [] as number[], cancelled: false, startCycle: () => {} };
    page3CycleRef.current = state;

    state.startCycle = () => {
      if (state.cancelled) return;

      setPage3ListOpen(false);
      setPage3ShowHighlight(true);

      const openTimer = window.setTimeout(() => {
        if (state.cancelled) return;
        setPage3ShowHighlight(false);
        setPage3ListOpen(true);
      }, TUTORIAL_ATTENTION_SEQUENCE_DELAY);
      state.timers.push(openTimer);
    };

    state.startCycle();

    return () => {
      state.cancelled = true;
      state.timers.forEach((timer) => clearTimeout(timer));
      setPage3ShowHighlight(false);
      setPage3ListOpen(false);
    };
  }, [currentPage]);

  const handleAddItemSequenceComplete = useCallback(() => {
    const state = page3CycleRef.current;
    if (state.cancelled) return;

    setPage3ListOpen(false);

    const restartTimer = window.setTimeout(() => {
      if (state.cancelled) return;
      state.startCycle();
    }, LISTS_PAGE_3_POST_CLOSE_PAUSE);
    state.timers.push(restartTimer);
  }, []);

  useEffect(() => {
    if (!page3TargetElement) {
      setPage3TargetRect(null);
      return;
    }

    const updateRect = () => {
      const parent = page3TargetElement.offsetParent;
      if (!(parent instanceof HTMLElement)) {
        setPage3TargetRect(null);
        return;
      }

      const targetRect = page3TargetElement.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setPage3TargetRect({
        left: targetRect.left - parentRect.left,
        top: targetRect.top - parentRect.top,
        width: targetRect.width,
        height: targetRect.height,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
    };
  }, [page3TargetElement]);

  useEffect(() => {
    if (smartFlowPhase !== "closing") return;

    const sheetTimer = window.setTimeout(() => {
      setSmartFlowPhase("smart-sheet");
    }, SMART_REMINDER_POST_CLOSE_PAUSE);

    return () => {
      clearTimeout(sheetTimer);
    };
  }, [smartFlowPhase]);

  useEffect(() => {
    if (smartFlowPhase !== "smart-sheet") return;

    const throbTimer = window.setTimeout(() => {
      setSmartFlowPhase("sheet-throb");
    }, SMART_REMINDER_SHEET_PRE_THROB_PAUSE);

    return () => {
      clearTimeout(throbTimer);
    };
  }, [smartFlowPhase]);

  useEffect(() => {
    if (smartFlowPhase !== "sheet-throb") return;

    const closeTimer = window.setTimeout(() => {
      setSmartFlowPhase("sheet-closing");
    }, (TUTORIAL_ATTENTION_THROB_DELAY + TUTORIAL_ATTENTION_THROB_DURATION) * 1000);

    return () => {
      clearTimeout(closeTimer);
    };
  }, [smartFlowPhase]);

  const handleSheetExitComplete = useCallback(() => {
    setSmartFlowPhase("insert-delay");
  }, []);

  useEffect(() => {
    if (smartFlowPhase !== "insert-delay") return;
    const insertTimer = window.setTimeout(() => {
      setSmartFlowPhase("reminder-visible");
    }, NEW_REMINDER_INSERT_DELAY);
    return () => { clearTimeout(insertTimer); };
  }, [smartFlowPhase]);

  // Page 5 templates flow
  useEffect(() => {
    if (currentPage !== 4) {
      setPage5Phase("none");
      setPage5EditorItems(PAGE_5_EDITOR_ITEMS.map((item) => ({ ...item })));
      setPage5InputValue("");
      setPage5InputFocused(false);
      setPage5ShowAddHighlight(false);
      setPage5ReinsertedItemId(null);
      setPage5HighlightedItemId(null);
      return;
    }

    const timers: number[] = [];
    let cancelled = false;

    const t1 = SMART_REMINDER_PRE_DOTS_PAUSE;
    const t2 = t1 + PAGE_5_THROB_TOTAL_MS + SMART_REMINDER_PRE_DOTS_PAUSE;
    const t3 = t2 + SMART_REMINDER_PRE_DOTS_PAUSE;
    const t4 = t3 + PAGE_5_THROB_TOTAL_MS + SMART_REMINDER_PRE_DOTS_PAUSE;
    const t5 = t4 + SMART_REMINDER_PRE_DOTS_PAUSE;
    const t6 = t5 + PAGE_5_THROB_TOTAL_MS;

    const throbTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("templates-throb");
    }, t1);
    timers.push(throbTimer);

    const openTemplatesTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("templates-open");
    }, t2);
    timers.push(openTemplatesTimer);

    const rowThrobTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("template-row-throb");
    }, t3);
    timers.push(rowThrobTimer);

    const editorOpenTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("editor-open");
    }, t4);
    timers.push(editorOpenTimer);

    const menuThrobTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("menu-throb");
    }, t5);
    timers.push(menuThrobTimer);

    const settingsOverlayTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPage5Phase("settings-overlay");
    }, t6);
    timers.push(settingsOverlayTimer);

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      setPage5Phase("none");
      setPage5EditorItems(PAGE_5_EDITOR_ITEMS.map((item) => ({ ...item })));
      setPage5InputValue("");
      setPage5InputFocused(false);
      setPage5ShowAddHighlight(false);
      setPage5ReinsertedItemId(null);
      setPage5HighlightedItemId(null);
    };
  }, [currentPage]);

  // Page 5 Templates button rect measurement
  useEffect(() => {
    if (!page5TemplatesButtonElement || !page5ChildrenElement) {
      setPage5TemplatesButtonRect(null);
      return;
    }
    const updateRect = () => {
      const targetRect = page5TemplatesButtonElement.getBoundingClientRect();
      const parentRect = page5ChildrenElement.getBoundingClientRect();
      setPage5TemplatesButtonRect({
        left: targetRect.left - parentRect.left,
        top: targetRect.top - parentRect.top,
        width: targetRect.width,
        height: targetRect.height,
      });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [page5TemplatesButtonElement, page5ChildrenElement]);

  // Page 5 target template row rect measurement
  useEffect(() => {
    if (!page5TargetTemplateElement || !page5ChildrenElement) {
      setPage5TargetTemplateRect(null);
      return;
    }
    const updateRect = () => {
      const targetRect = page5TargetTemplateElement.getBoundingClientRect();
      const parentRect = page5ChildrenElement.getBoundingClientRect();
      setPage5TargetTemplateRect({
        left: targetRect.left - parentRect.left,
        top: targetRect.top - parentRect.top,
        width: targetRect.width,
        height: targetRect.height,
      });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [page5TargetTemplateElement, page5ChildrenElement]);

  // Page 5 add button rect measurement
  useEffect(() => {
    if (!page5AddButtonElement || !page5EditorHostElement) {
      setPage5AddButtonRect(null);
      return;
    }
    const updateRect = () => {
      const targetRect = page5AddButtonElement.getBoundingClientRect();
      const parentRect = page5EditorHostElement!.getBoundingClientRect();
      setPage5AddButtonRect({
        left: (targetRect.left - parentRect.left) / TUTORIAL_REMINDER_LIST_SCALE,
        top: (targetRect.top - parentRect.top) / TUTORIAL_REMINDER_LIST_SCALE,
        width: targetRect.width / TUTORIAL_REMINDER_LIST_SCALE,
        height: targetRect.height / TUTORIAL_REMINDER_LIST_SCALE,
      });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [page5AddButtonElement, page5EditorHostElement]);

  // Page 5 menu dots rect measurement
  useEffect(() => {
    if (!page5EditorHostElement) {
      setPage5MenuDotsRect(null);
      return;
    }
    const updateRect = () => {
      const menuButton = page5EditorHostElement!.querySelector('[data-name="menu-dots-btn"]');
      if (!(menuButton instanceof HTMLElement)) {
        setPage5MenuDotsRect(null);
        return;
      }
      const targetRect = menuButton.getBoundingClientRect();
      const parentRect = page5EditorHostElement!.getBoundingClientRect();
      setPage5MenuDotsRect({
        left: (targetRect.left - parentRect.left) / TUTORIAL_REMINDER_LIST_SCALE,
        top: (targetRect.top - parentRect.top) / TUTORIAL_REMINDER_LIST_SCALE,
        width: targetRect.width / TUTORIAL_REMINDER_LIST_SCALE,
        height: targetRect.height / TUTORIAL_REMINDER_LIST_SCALE,
      });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [page5EditorHostElement, page5Phase]);

  const page5ShowTemplatesPanel = currentPage === 4 && page5Phase !== "none" && page5Phase !== "templates-throb";
  const page5ShowEditor = currentPage === 4 && (page5Phase === "editor-open" || page5Phase === "typing" || page5Phase === "add-throb" || page5Phase === "item-added" || page5Phase === "menu-throb" || page5Phase === "settings-overlay");

  return (
    <div className="content-stretch flex h-full w-full flex-col items-center min-h-0">
      <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] [@media(max-height:570px)]:!min-h-0 items-center relative shrink-0">
        <div className="content-stretch flex flex-col items-center relative shrink-0">
          <div className={TUTORIAL_TITLE_CLASSNAME}>
            <p className="css-ew64yg leading-[normal]">
              {currentPage === 0 ? "A tour of lists" : currentPage === 1 ? "Manage completed lists" : currentPage === 2 ? "View and edit lists" : currentPage === 3 ? "Create smart reminders" : "Use list templates"}
            </p>
          </div>
        </div>
        <div className={TUTORIAL_BODY_CLASSNAME}>
          {currentPage === 0 ? (
            <p className="css-4hzbpn leading-[30px]">Lists are grouped by colour and<br />filtered in the same way as reminders</p>
          ) : currentPage === 1 ? (
            <p className="css-4hzbpn leading-[30px]">Move finished lists to done<br />and view completed lists</p>
          ) : currentPage === 2 ? (
            <p className="css-4hzbpn leading-[30px]">Quickly add, update, and organise<br />your lists in one place.</p>
          ) : currentPage === 3 ? (
            <p className="css-4hzbpn leading-[30px]">Link lists to reminders so you<br />never miss important tasks.</p>
          ) : (
            <p className="css-4hzbpn leading-[30px]">Create lists from ready-made<br />templates to get started fast.</p>
          )}
        </div>
      </div>
      <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
        <TutorialPhoneShell
          activeMainTab={currentPage === 3 ? page4ActiveTab : "lists"}
          showHeaderMenu={false}
          headerProps={{
            logoTickHighlight: currentPage === 1 && page2ShowLogoHighlight,
            logoTickDone: currentPage === 1 && page2ShowDoneLists,
          }}
          listsLabel={currentPage === 1 && page2ShowDoneLists ? "Done lists" : undefined}
          filterRow={currentPage === 1 && page2ShowDoneLists ? (
            <Page5DoneDeletedFilters />
          ) : currentPage === 3 && page4ActiveTab === "reminders" ? (
            <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
          ) : page5ShowTemplatesPanel || page5ShowEditor ? null : (
            <TutorialReminderFilters
              items={listFilterItems}
              trailing={savedListsEnabled ? <TemplatesTutorialButton /> : undefined}
              onTrailingElementChange={currentPage === 4 ? setPage5TemplatesButtonElement : undefined}
              layout={savedListsEnabled ? 'inline' : 'between'}
              rowGapClassName={savedListsEnabled ? 'gap-[12.923px]' : 'gap-[10px]'}
              groupGapClassName="gap-[8.615px]"
              activeKey={currentPage === 0 ? displayActiveFilter : undefined}
            />
          )}
          overlay={
            currentPage === 3 && page4ShowSmartSheet ? (
              <SmartReminderSheetOverlay visible={smartFlowPhase === "smart-sheet" || smartFlowPhase === "sheet-throb"} showTickThrob={smartFlowPhase === "sheet-throb"} onExitComplete={handleSheetExitComplete} />
            ) : (currentPage === 2 || (currentPage === 3 && smartFlowPhase !== "closing" && smartFlowPhase !== "smart-sheet" && smartFlowPhase !== "sheet-throb" && smartFlowPhase !== "sheet-closing" && smartFlowPhase !== "insert-delay" && smartFlowPhase !== "reminder-visible")) ? (
              <ListsTutorialOpenListOverlay open={page3ListOpen} mode={currentPage === 2 ? "add-item" : "settings"} onSmartFlowPhaseChange={currentPage === 3 ? setSmartFlowPhase : undefined} onAddItemSequenceComplete={currentPage === 2 ? handleAddItemSequenceComplete : undefined} />
            ) : currentPage === 4 ? (
              <>
              <AnimatePresence>
                {page5ShowEditor && (
                <>
                <motion.div
                  key="page5-editor-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-40 bg-black/0"
                />
                <motion.div
                  key="page5-editor-panel"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute left-0 right-0 z-50 mx-auto w-full"
                  style={{ bottom: 0, top: TUTORIAL_LIST_OVERLAY_TOP }}
                >
                  <motion.div
                    className="bg-white relative rounded-tl-[15px] rounded-tr-[15px]"
                    style={{
                      width: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                      height: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                      transform: `scale(${TUTORIAL_REMINDER_LIST_SCALE})`,
                      transformOrigin: "top center",
                      left: "50%",
                      translate: "-50% 0",
                    }}
                  >
                    <div ref={setPage5EditorHostElement} className="relative w-full h-full flex flex-col mx-auto">
                      <div className="content-stretch flex flex-col gap-[26px] items-start pt-[30px] px-[24px] relative w-full shrink-0">
                        <ListsHeader
                          value="Weekly food shop"
                          onChange={() => {}}
                          active
                          isEditMode
                          onSubmit={() => {}}
                          onClose={() => {}}
                          subtitleText={`${page5EditorItems.length} items`}
                          showMenuButton
                          showSavedListSubtitleIcon
                        />
                        <AddListItemInput
                          isEmpty={false}
                          accentColor="#4784F8"
                          idleCircleColor="#D9D9D9"
                          nextPlaceholder="Add your next template item..."
                          demoValue={page5InputValue}
                          demoFocused={page5InputFocused}
                          onAddButtonElementChange={setPage5AddButtonElement}
                          leadingIcon={<TutorialSavedListAddItemIcon />}
                          focusedLeadingIcon={<TutorialSavedListAddItemFocusedIcon />}
                          activeLeadingIcon={<TutorialSavedListAddItemFocusedIcon />}
                        />
                        {(page5Phase === "add-throb") && page5AddButtonRect && (
                          <motion.div
                            key="page5-add-throb"
                            className="absolute z-10 pointer-events-none"
                            style={{
                              left: page5AddButtonRect.left + (page5AddButtonRect.width / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                              top: page5AddButtonRect.top + (page5AddButtonRect.height / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                              width: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                              height: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
                            transition={{
                              duration: TUTORIAL_ATTENTION_THROB_DURATION,
                              delay: TUTORIAL_ATTENTION_THROB_DELAY,
                              times: TUTORIAL_ATTENTION_THROB_TIMES,
                              ease: "easeInOut",
                            }}
                          >
                            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                              <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
                            </svg>
                          </motion.div>
                        )}
                        {page5Phase === "menu-throb" && page5MenuDotsRect && (
                          <motion.div
                            key="page5-menu-throb"
                            className="absolute z-10 pointer-events-none"
                            style={{
                              left: page5MenuDotsRect.left + (page5MenuDotsRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2) + 7,
                              top: page5MenuDotsRect.top + (page5MenuDotsRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
                              width: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                              height: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
                            transition={{
                              duration: TUTORIAL_ATTENTION_THROB_DURATION,
                              delay: TUTORIAL_ATTENTION_THROB_DELAY,
                              times: TUTORIAL_ATTENTION_THROB_TIMES,
                              ease: "easeInOut",
                            }}
                          >
                            <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                              <circle cx="17.5" cy="17.5" r="16" stroke="#4784F8" strokeWidth="3" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex flex-col gap-[23px] items-start px-[24px] pb-[24px] relative w-full flex-1 min-h-0 overflow-y-auto mt-[35px]">
                        <AnimatePresence initial={false}>
                          {page5EditorItems.map((item) => {
                            const isReinserted = page5ReinsertedItemId === item.id;
                            const isHighlighted = page5HighlightedItemId === item.id;
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={isReinserted ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                transition={isReinserted ? { opacity: { duration: 0.2 } } : { layout: { duration: 0.25 } }}
                                onAnimationComplete={() => {
                                  if (isReinserted) setPage5ReinsertedItemId(null);
                                }}
                                className="w-full"
                              >
                                <EditableListItem
                                  name={item.text}
                                  completed={false}
                                  accentColor="#4784F8"
                                  isHighlighted={isHighlighted}
                                  leadingIcon={<TutorialSavedListCheckCircle />}
                                />
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
                </>
                )}
              </AnimatePresence>
              {page5Phase === "settings-overlay" && (
                <TutorialMiniOverlayShell>
                  <div className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] outline-none">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                      <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>Weekly food shop</p>
                    </div>
                    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
                      <div className="h-[50px] relative rounded-[100px] shrink-0 w-full" style={{ backgroundColor: '#4784F8' }}>
                        <div className="flex flex-row items-center justify-center size-full">
                          <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                              <p className="leading-[normal]">Use a list</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-[50px] relative rounded-[100px] shrink-0 w-full" style={{ backgroundColor: '#939393' }}>
                        <div className="flex flex-row items-center justify-center size-full">
                          <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                              <p className="leading-[normal]">Delete template</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TutorialMiniOverlayShell>
              )}
              </>
            ) : undefined
          }
        >
          <div ref={currentPage === 4 ? setPage5ChildrenElement : undefined} className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
            <TutorialStaticReminderList
              key={currentPage === 3 && (smartFlowPhase === "sheet-throb" || smartFlowPhase === "sheet-closing" || smartFlowPhase === "insert-delay" || smartFlowPhase === "reminder-visible") ? "lists-page-4-reminders" : currentPage === 1 ? `lists-page-2-${page2CycleKey}` : "lists-static"}
              mode={currentPage === 3 && (smartFlowPhase === "sheet-throb" || smartFlowPhase === "sheet-closing" || smartFlowPhase === "insert-delay" || smartFlowPhase === "reminder-visible") ? "reminders" : "lists"}
              page1BuildSequence={currentPage === 0}
              page3DoneSequence={currentPage === 1 && page2Phase === "marking"}
              page3DoneSequenceCycle={currentPage !== 1}
              doneReminderIds={currentPage === 1 && page2ShowDoneLists ? TUTORIAL_PAGE_2_DONE_LIST_IDS : undefined}
              activeFilter={currentPage === 0 ? activeFilter : undefined}
              onListFilterChange={currentPage === 0 ? onActiveFilterChange : undefined}
              onPage3DoneSequenceComplete={currentPage === 1 ? onPage2DoneSequenceComplete : undefined}
              rowTargetListId={currentPage === 2 ? LISTS_PAGE_3_TARGET_LIST_ID : undefined}
              combineLaterSometime={settingsMenuEnabled}
              onRowTargetElementChange={currentPage === 2 ? setPage3TargetElement : undefined}
              prependSmartReminder={currentPage === 3 && smartFlowPhase === "reminder-visible"}
            />
            {currentPage === 2 && page3ShowHighlight && page3TargetRect && (
              <motion.div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: page3TargetRect.left + (page3TargetRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2) - 40,
                  top: page3TargetRect.top + (page3TargetRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2) + 10,
                  width: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                  height: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
                }}
                transition={{
                  duration: TUTORIAL_ATTENTION_THROB_DURATION,
                  delay: TUTORIAL_ATTENTION_THROB_DELAY,
                  times: TUTORIAL_ATTENTION_THROB_TIMES,
                  ease: "easeInOut",
                }}
              >
                <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                  <circle cx="17.5" cy="17.5" r="16" stroke="#4784F8" strokeWidth="3" />
                </svg>
              </motion.div>
            )}
            {page5ShowTemplatesPanel && (
              <div className="absolute inset-0 z-30 overflow-hidden flex items-start justify-center">
                <div
                  className="shrink-0"
                  style={{
                    width: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                    height: `${100 / TUTORIAL_REMINDER_LIST_SCALE}%`,
                    transform: `scale(${TUTORIAL_REMINDER_LIST_SCALE})`,
                    transformOrigin: "top center",
                  }}
                >
                  {/* Mirrors production App.tsx line 3445: padding parent */}
                  <div className="bg-white content-stretch flex flex-col gap-[24px] items-center px-[20px] pt-[24px] relative rounded-tl-[15px] rounded-tr-[15px] w-full h-full min-h-[350px]">
                    {/* Mirrors production App.tsx line 3647: active lists wrapper */}
                    <div className="relative flex flex-col gap-[24px] w-full flex-1 min-h-0">
                      {/* Mirrors production App.tsx line 3749: list content area */}
                      <div className="relative w-full max-w-[768px] flex-1 min-h-0">
                        {/* Mirrors production App.tsx lines 3934-3936: templates panel overlay */}
                        <div className="absolute inset-0 bg-white" style={{ zIndex: 2 }}>
                          {/* Mirrors production App.tsx line 3938: templates inner column */}
                          <div className="relative flex flex-col gap-[24px] w-full h-full min-h-0 pt-[0px]">
                            {/* Mirrors production App.tsx line 3939: title row */}
                            <div className="filters-menu flex items-center justify-between relative shrink-0 w-full h-[40px]">
                              <div className="font-['Lato',sans-serif] font-bold text-[20px] text-[#1C2C42] whitespace-nowrap">
                                List templates
                              </div>
                              <div className="relative shrink-0 p-0 m-0 border-none bg-transparent flex items-center justify-center self-center w-[30px] h-[30px]">
                                <svg className="block shrink-0" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M11.7528 0.439116C12.3385 -0.146356 13.2882 -0.146389 13.8739 0.439116C14.4596 1.02493 14.4596 1.97537 13.8739 2.56119L9.27819 7.15787L13.8739 11.7536C14.4596 12.3394 14.4596 13.2898 13.8739 13.8756C13.2882 14.4612 12.3385 14.4611 11.7528 13.8756L7.15709 9.27896L2.56041 13.8756C1.97466 14.461 1.02496 14.4612 0.439319 13.8756C-0.14644 13.2898 -0.146439 12.3394 0.439319 11.7536L5.03502 7.15787L0.439319 2.56119C-0.146439 1.97537 -0.14644 1.02493 0.439319 0.439116C1.02496 -0.146462 1.97466 -0.146282 2.56041 0.439116L7.15709 5.0358L11.7528 0.439116Z" fill="#BABABA"/>
                                </svg>
                              </div>
                            </div>
                            {/* Mirrors production App.tsx line 3954: inner scroll container */}
                            <div className="relative w-full max-w-[768px] flex-1 min-h-0">
                              <div className="content-stretch flex flex-col items-center justify-start overflow-x-clip w-full" style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'hidden', height: '100%' }}>
                                {/* Mirrors production App.tsx line 3963: rows wrapper */}
                                <div className="flex flex-col gap-[23px] w-full" style={{ position: 'relative', zIndex: 1 }}>
                                  {PAGE_5_TEMPLATES.map((tpl) => (
                                    <div
                                      key={tpl.id}
                                      ref={tpl.id === PAGE_5_TARGET_TEMPLATE_ID ? setPage5TargetTemplateElement : undefined}
                                    >
                                      {/* Mirrors production App.tsx lines 3975-4004: row structure (RowMenuButton stripped) */}
                                      <div className="content-stretch flex items-start justify-between px-px relative w-full">
                                        <div className="flex-[1_0_0] min-h-px min-w-px relative">
                                          <div className="flex flex-row items-start size-full">
                                            <div className="content-stretch flex gap-[16px] items-start pr-[16px] relative w-full min-w-0">
                                              <div className="relative shrink-0 size-[25px]" style={{ marginTop: '3px' }}>
                                                <TutorialSavedListTemplateIcon />
                                              </div>
                                              <div className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative" style={{ gap: '9px', minHeight: '38px' }}>
                                                <div
                                                  className="overflow-hidden text-ellipsis whitespace-nowrap"
                                                  style={{ color: '#4784F8', textDecorationColor: '#4784F8', clipPath: 'inset(0 0 -4px 0)' }}
                                                >
                                                  <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>
                                                    {tpl.title}
                                                  </p>
                                                </div>
                                                <div
                                                  className="flex items-center overflow-visible min-w-0"
                                                  style={{ textDecorationColor: '#BABABA' }}
                                                >
                                                  <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: '#BABABA' }}>
                                                    {tpl.itemCount} {tpl.itemCount === 1 ? 'item' : 'items'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {page5Phase === "templates-throb" && page5TemplatesButtonRect && (
              <motion.div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: page5TemplatesButtonRect.left + (page5TemplatesButtonRect.width / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                  top: page5TemplatesButtonRect.top + (page5TemplatesButtonRect.height / 2) - (LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / 2),
                  width: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                  height: LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
                transition={{
                  duration: TUTORIAL_ATTENTION_THROB_DURATION,
                  delay: TUTORIAL_ATTENTION_THROB_DELAY,
                  times: TUTORIAL_ATTENTION_THROB_TIMES,
                  ease: "easeInOut",
                }}
              >
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
                </svg>
              </motion.div>
            )}
            {page5Phase === "template-row-throb" && page5TargetTemplateRect && (
              <motion.div
                className="absolute z-[31] pointer-events-none"
                style={{
                  left: page5TargetTemplateRect.left + (page5TargetTemplateRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
                  top: page5TargetTemplateRect.top + (page5TargetTemplateRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
                  width: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                  height: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
                transition={{
                  duration: TUTORIAL_ATTENTION_THROB_DURATION,
                  delay: TUTORIAL_ATTENTION_THROB_DELAY,
                  times: TUTORIAL_ATTENTION_THROB_TIMES,
                  ease: "easeInOut",
                }}
              >
                <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                  <circle cx="17.5" cy="17.5" r="16" stroke="#4784F8" strokeWidth="3" />
                </svg>
              </motion.div>
            )}
          </div>
        </TutorialPhoneShell>
      </div>
    </div>
  );
}

export default function TutorialOnboardingContent({ onComplete, variant, isListsEnabled, settingsMenuEnabled, smartRemindersEnabled, savedListsEnabled }: TutorialOnboardingContentProps) {
  // currentStep is the position in the visible sequence; currentPage is the page id being shown
  const [currentStep, setCurrentStep] = useState(0);
  const pageIds = useMemo(
    () => getTutorialPageIds({ variant, settingsMenuEnabled, smartRemindersEnabled, savedListsEnabled }),
    [variant, settingsMenuEnabled, smartRemindersEnabled, savedListsEnabled],
  );
  const totalPages = pageIds.length;
  const currentPage = pageIds[Math.min(currentStep, totalPages - 1)];
  const isListsTutorial = variant === 'lists';
  const page2ActiveFilter = useOnboardingPage2ActiveFilter(!isListsTutorial && currentPage === 1, settingsMenuEnabled);
  const [listsTutorialActiveFilter, setListsTutorialActiveFilter] = useState<TutorialFilterKey | undefined>(undefined);
  const [listsPage2CycleKey, setListsPage2CycleKey] = useState(0);
  const [listsPage2Phase, setListsPage2Phase] = useState<"marking" | "done-list">("marking");
  const [listsPage2ShowLogoHighlight, setListsPage2ShowLogoHighlight] = useState(false);
  const [listsPage2ShowDoneLists, setListsPage2ShowDoneLists] = useState(false);
  const [page3ShowOverlay, setPage3ShowOverlay] = useState(false);
  const [page5ShowLogoHighlight, setPage5ShowLogoHighlight] = useState(false);
  const [page5ShowDoneReminders, setPage5ShowDoneReminders] = useState(false);

  useEffect(() => {
    if (isListsTutorial || currentPage !== 2) {
      setPage3ShowOverlay(false);
    }
  }, [currentPage, isListsTutorial]);

  useEffect(() => {
    if (isListsTutorial || currentPage !== 4) {
      setPage5ShowLogoHighlight(false);
      setPage5ShowDoneReminders(false);
    }
  }, [currentPage, isListsTutorial]);

  useEffect(() => {
    if (!isListsTutorial || currentPage !== 0) {
      setListsTutorialActiveFilter(undefined);
    }
  }, [currentPage, isListsTutorial]);

  useEffect(() => {
    if (!isListsTutorial || currentPage !== 1) {
      setListsPage2Phase("marking");
      setListsPage2ShowLogoHighlight(false);
      setListsPage2ShowDoneLists(false);
    }
  }, [currentPage, isListsTutorial]);

  useEffect(() => {
    if (!isListsTutorial || currentPage !== 1 || listsPage2Phase !== "done-list") {
      return;
    }

    const timers: number[] = [];
    let cancelled = false;

    setListsPage2ShowLogoHighlight(false);
    setListsPage2ShowDoneLists(false);

    const mainPauseTimer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setListsPage2ShowLogoHighlight(true);

      const openDoneTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setListsPage2ShowLogoHighlight(false);
        setListsPage2ShowDoneLists(true);

        const donePauseTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          setListsPage2ShowLogoHighlight(true);

          const closeDoneTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            setListsPage2ShowLogoHighlight(false);
            setListsPage2ShowDoneLists(false);

            const restartTimer = window.setTimeout(() => {
              if (cancelled) {
                return;
              }

              setListsPage2Phase("marking");
              setListsPage2CycleKey((value) => value + 1);
            }, PAGE_5_STATE_PAUSE_DELAY);
            timers.push(restartTimer);
          }, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY);
          timers.push(closeDoneTimer);
        }, PAGE_5_STATE_PAUSE_DELAY);
        timers.push(donePauseTimer);
      }, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY);
      timers.push(openDoneTimer);
    }, PAGE_5_INITIAL_PAUSE_DELAY);
    timers.push(mainPauseTimer);

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      setListsPage2ShowLogoHighlight(false);
      setListsPage2ShowDoneLists(false);
    };
  }, [currentPage, isListsTutorial, listsPage2Phase]);

  useEffect(() => {
    if (currentStep >= totalPages) {
      setCurrentStep(totalPages - 1);
    }
  }, [currentStep, totalPages]);

  const handleNext = () => {
    if (currentStep < totalPages - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
  };

  const handleListsPage2DoneSequenceComplete = useCallback(() => {
    setListsPage2Phase("done-list");
  }, []);

  const isFirstPage = currentStep === 0;
  const isLastPage = currentStep === totalPages - 1;
  const activePaginationColor = isListsTutorial ? LIST_BLUE : REMINDERLY_LIGHT_BLUE;
  const nextButtonColor = isListsTutorial ? LIST_BLUE : "#4784f8";
  const paginationWidth = 115.542;
  const paginationDotRadius = 3.96729;
  const paginationDotSpacing = totalPages <= 7 ? 17.93461 : (paginationWidth - paginationDotRadius * 2) / (totalPages - 1);
  const paginationDotsWidth = (totalPages - 1) * paginationDotSpacing + paginationDotRadius * 2;
  const paginationStartX = (paginationWidth - paginationDotsWidth) / 2 + paginationDotRadius;

  return (
    <div
      data-testid="onboarding-root"
      className="bg-white flex flex-col h-full [@media(max-height:570px)]:!h-full [@media(max-height:570px)]:!pb-0"
      style={{
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        paddingLeft: 'clamp(16px, 5vw, 40px)',
        paddingRight: 'clamp(16px, 5vw, 40px)',
        paddingTop: '34px',
        paddingBottom: '34px',
      }}
    >
      <div className="flex-1 [@media(max-height:570px)]:flex-none relative overflow-hidden">
        {!isListsTutorial && currentPage === 0 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage1Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
                }
              >
                <OnboardingPage1Content combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {!isListsTutorial && currentPage === 1 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage2Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} activeKey={page2ActiveFilter} />
                }
              >
                <OnboardingPage2Content activeFilter={page2ActiveFilter} combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {!isListsTutorial && currentPage === 2 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage3Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                overlay={page3ShowOverlay ? <TutorialReminderInfoOverlay reminder={CALL_DENTIST_TUTORIAL_REMINDER} /> : undefined}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
                }
              >
                <OnboardingPage3Content onOverlayOpenChange={setPage3ShowOverlay} combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}

        {!isListsTutorial && currentPage === 3 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage4Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
                }
              >
                <OnboardingPage4Content combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {!isListsTutorial && currentPage === 4 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage5Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                headerProps={{
                  logoTickHighlight: page5ShowLogoHighlight,
                  logoTickDone: page5ShowDoneReminders,
                }}
                remindersLabel={page5ShowDoneReminders ? "Done reminders" : undefined}
                filterRow={page5ShowDoneReminders ? (
                  <Page5DoneDeletedFilters />
                ) : (
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
                )}
              >
                <OnboardingPage5Content
                  onLogoHighlightChange={setPage5ShowLogoHighlight}
                  onDoneRemindersChange={setPage5ShowDoneReminders}
                  showDoneReminders={page5ShowDoneReminders}
                  combineLaterSometime={settingsMenuEnabled}
                />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {!isListsTutorial && settingsMenuEnabled && currentPage === 5 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage6Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="reminders"
                showMainTabBar={isListsEnabled}
                showHeaderMenu={false}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} />
                }
              >
                <OnboardingPage6Content combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {isListsTutorial && (
          <ListsTutorialPlaceholderPage
            currentPage={currentPage}
            settingsMenuEnabled={settingsMenuEnabled}
            savedListsEnabled={savedListsEnabled}
            activeFilter={listsTutorialActiveFilter}
            onActiveFilterChange={setListsTutorialActiveFilter}
            page2CycleKey={listsPage2CycleKey}
            page2Phase={listsPage2Phase}
            page2ShowLogoHighlight={listsPage2ShowLogoHighlight}
            page2ShowDoneLists={listsPage2ShowDoneLists}
            onPage2DoneSequenceComplete={handleListsPage2DoneSequenceComplete}
          />
        )}
      </div>
      
      <div className="shrink-0 flex flex-col items-center gap-[36px] [@media(max-height:570px)]:pt-[30px] [@media(max-height:570px)]:pb-[30px]">
        <div className="h-[7.935px] w-[115.542px] [@media(max-height:570px)]:hidden">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 115.542 7.93457">
            <g>
              {Array.from({ length: totalPages }, (_, index) => (
                <circle
                  key={index}
                  cx={paginationStartX + index * paginationDotSpacing}
                  cy="3.96729"
                  fill={currentStep === index ? activePaginationColor : "#D9D9D9"}
                  r={paginationDotRadius}
                />
              ))}
            </g>
          </svg>
        </div>
        
        <div className="relative flex items-center justify-center w-full max-w-[322px] h-[45px]">
          {!isFirstPage ? (
            <button 
              className="absolute left-0 h-[45px] w-[35px] cursor-pointer"
              onClick={handleBack}
            >
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35 45">
                <g>
                  <path d={svgPaths.p72c8800} fill="#D9D9D9" />
                </g>
              </svg>
            </button>
          ) : (
            <div className="absolute left-0 h-[45px] w-[35px]" />
          )}
          
          <button 
            className="w-[180px] rounded-[100px] flex items-center justify-center cursor-pointer"
            onClick={handleNext}
            style={{ height: 'clamp(40px, calc(20vh - 73.6px), 54px)', backgroundColor: nextButtonColor }}
          >
            <span className="font-['Lato',sans-serif] font-bold text-[17px] text-white leading-[normal]">
              {isLastPage ? (isListsTutorial ? 'Okay, got it!' : 'Okay, got it') : 'Next'}
            </span>
          </button>
          
          {isLastPage ? (
            <div className="absolute right-0 flex h-[45px] w-[35px] items-center justify-center">
              <button 
                className="h-[28.321px] w-[34.741px] cursor-pointer"
                onClick={handleRestart}
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.4912 29.8213">
                  <g>
                    <path d={svgPaths.p171ed6b0} fill="#D9D9D9" stroke="#D9D9D9" strokeWidth="1.5" />
                  </g>
                </svg>
              </button>
            </div>
          ) : (
            <div className="absolute right-0 h-[45px] w-[35px]" />
          )}
        </div>
      </div>
    </div>
  );
}
