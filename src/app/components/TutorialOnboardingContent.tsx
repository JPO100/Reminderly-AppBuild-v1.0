import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import svgPaths from '@/imports/svg-go2phgsyt4';
import ListsHeader from '@/imports/Header';
import OnboardingPage1Content, { OnboardingPage1Text } from '@/app/components/OnboardingPage1Content';
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
  TutorialOverlayCard,
  TutorialOverlayTitle,
  TutorialReminderInfoOverlay,
  TutorialSmartReminderSheet,
} from '@/app/components/OnboardingPage3Content';
import OnboardingPage4Content, { OnboardingPage4Text } from '@/app/components/OnboardingPage4Content';
import OnboardingPage5Content, { OnboardingPage5Text, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY, PAGE_5_INITIAL_PAUSE_DELAY, PAGE_5_STATE_PAUSE_DELAY } from '@/app/components/OnboardingPage5Content';
import OnboardingPage6Content, { OnboardingPage6Overlay, OnboardingPage6Text, type TutorialListsSettings, type TutorialRemindersSettings } from '@/app/components/OnboardingPage6Content';
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from '@/app/components/tutorialTokens';
import TutorialPhoneShell from '@/app/components/TutorialPhoneShell';
import TutorialStaticReminderList, { TUTORIAL_PAGE_2_DONE_LIST_IDS, TUTORIAL_REMINDER_LIST_SCALE, TutorialRowMenuDots } from '@/app/components/TutorialStaticReminderList';
import AddListItemInput from '@/app/components/lists/AddListItemInput';
import EditableListItem from '@/app/components/lists/EditableListItem';
import TutorialReminderFilters, {
  SAVED_LISTS_TUTORIAL_FILTER_ITEMS,
  type TutorialFilterKey,
  TutorialRemindersFilterRow,
  TutorialSettingsButton,
  UNGROUPED_TUTORIAL_LIST_FILTER_ITEMS,
} from '@/app/components/TutorialReminderFilters';
import OnboardingCreateReminderPhone, { OnboardingCreateReminderText, OnboardingTypeNaturallyText } from '@/app/components/OnboardingCreateReminderContent';
import OnboardingLockScreenWidgetPhone, { OnboardingLockScreenWidgetText } from '@/app/components/OnboardingLockScreenWidgetContent';
import OnboardingNotificationAskPhone, { OnboardingNotificationAskResult, OnboardingNotificationAskText } from '@/app/components/OnboardingNotificationAskContent';
import { isPermissionUndecided } from '@/app/notification-ask';
import OnboardingSiriPhone, { OnboardingSiriText } from '@/app/components/OnboardingSiriContent';
import OnboardingAttachmentPhone, { OnboardingAttachmentText } from '@/app/components/OnboardingAttachmentContent';
import { getTutorialPageIds, TUTORIAL_PAGE_ATTACHMENT, TUTORIAL_PAGE_LOCK_SCREEN_WIDGET, TUTORIAL_PAGE_CREATE_REMINDER, TUTORIAL_PAGE_NOTIFICATION_ASK, TUTORIAL_PAGE_SIRI, TUTORIAL_PAGE_TYPE_NATURALLY } from '@/app/utils/tutorial-pages';
import type { NlcTutorialDemo } from '@/app/utils/tutorial-nlc-demo';

interface TutorialOnboardingContentProps {
  onComplete: () => void;
  variant: 'reminders' | 'lists';
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  smartRemindersEnabled: boolean;
  savedListsEnabled: boolean;
  // Live calendar header button availability, mirrored in the Reminders filter row
  calendarEnabled?: boolean;
  // Reminders tutorial: Create a reminder and Type it naturally pages
  repeatsEnabled?: boolean;
  nlcDemo?: { demo: NlcTutorialDemo; autoMode: boolean } | null;
  // Reminders tutorial: Never miss a reminder page
  notificationAskEligible?: boolean;
  notificationPermission?: string | null;
  onNotificationAllow?: () => Promise<unknown> | void;
  onNotificationAskPageChange?: (isOnPage: boolean) => void;
  // Skip on the Never miss a reminder page: Not now, then the next page
  onNotificationSkip?: () => void;
  // Turn on while iOS has notifications turned off: open Reminderly's page in iOS Settings (stays on the page)
  onNotificationOpenSettings?: () => void;
  // Reminders tutorial: Add reminders with Siri page (Siri for reminders available)
  siriAvailable?: boolean;
  // Reminder attachments available: the Add an attachment page and the paperclip on the New reminder mock
  attachmentsAvailable?: boolean;
  // Lock screen widget available: the Reminders at a glance page
  lockScreenWidgetAvailable?: boolean;
  // Reminders tutorial: Re-run this tutorial page shows the settings rows the app shows
  remindersSettings?: TutorialRemindersSettings;
  // Lists tutorial: Re-run this tutorial page shows the Lists settings rows the app shows
  listsSettings?: TutorialListsSettings;
  // Onboarding testing mode: the pages to show, fixed when the tutorial opens (null uses the normal rules)
  testPageIds?: number[] | null;
  // Live page config: pages switched on (null keeps every page the rules allow)
  livePageIds?: number[] | null;
}

const LIST_BLUE = "#4784F8";
const REMINDERLY_LIGHT_BLUE = "#4784F8";
const TUTORIAL_PHONE_GAP_TOP_CLASSNAME = "mt-[35px]";
// Standard footer button height (Next, Okay got it, Turn on and Skip)
const TUTORIAL_FOOTER_BUTTON_HEIGHT = "clamp(40px, calc(20vh - 73.6px), 54px)";
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
// Menu button ring inside the scaled list panel: drawn at the same on-screen size as the 50px Templates ring
const SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE = LISTS_PAGE_3_ADD_HIGHLIGHT_CIRCLE_SIZE / TUTORIAL_REMINDER_LIST_SCALE;
const LISTS_PAGE_3_POST_INSERT_PAUSE = 2000;
const LISTS_PAGE_3_POST_CLOSE_PAUSE = 2000;
const LIST_ITEM_INSERT_HIGHLIGHT_MS = 1000;
const SMART_REMINDER_PRE_DOTS_PAUSE = 750;
const SMART_REMINDER_POST_DOTS_PAUSE = 750;
const SMART_REMINDER_POST_SETTINGS_PAUSE = 750;
const SMART_REMINDER_POST_TOGGLE_PAUSE = 750;
const SMART_REMINDER_POST_CLOSE_PAUSE = 250;
const SMART_REMINDER_SHEET_PRE_THROB_PAUSE = 750;
const SMART_REMINDER_TICK_THROB_CIRCLE_SIZE = SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE;
const NEW_REMINDER_INSERT_DELAY = 500;

type Page5Phase = "none" | "templates-throb" | "templates-open" | "template-row-throb" | "editor-open" | "typing" | "add-throb" | "item-added" | "menu-throb" | "settings-overlay";
const PAGE_5_TEMPLATES = [
  { id: "tpl-1", title: "Morning workout", itemCount: 8 },
  { id: "tpl-2", title: "Vegetarian lasagne", itemCount: 8 },
  { id: "tpl-3", title: "Films to watch", itemCount: 10 },
  { id: "tpl-4", title: "Holiday destination ideas", itemCount: 10 },
] as const;
const PAGE_5_TARGET_TEMPLATE_ID = "tpl-2";
const PAGE_5_EDITOR_ITEMS = [
  { id: "lasagne-1", text: "Lasagne sheets", completed: false },
  { id: "lasagne-2", text: "Onion", completed: false },
  { id: "lasagne-3", text: "Garlic", completed: false },
  { id: "lasagne-4", text: "Courgette", completed: false },
  { id: "lasagne-5", text: "Red pepper", completed: false },
  { id: "lasagne-6", text: "Chopped tomatoes", completed: false },
  { id: "lasagne-7", text: "White sauce", completed: false },
  { id: "lasagne-8", text: "Mozzarella", completed: false },
] as const;
const PAGE_5_DEMO_ITEM = "Parmesan";
const PAGE_5_DEMO_ITEM_ID = "lasagne-parmesan";
const PAGE_5_THROB_TOTAL_MS = (TUTORIAL_ATTENTION_THROB_DELAY + TUTORIAL_ATTENTION_THROB_DURATION) * 1000;

function TutorialSavedListTemplateIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="block size-full">
      <path d="M18.2471 22.9885C18.8026 22.9885 19.2529 23.4388 19.2529 23.9943C19.2529 24.5497 18.8026 25 18.2471 25H14.7989C14.2434 25 13.7931 24.5497 13.7931 23.9943C13.7931 23.4388 14.2434 22.9885 14.7989 22.9885H18.2471Z" fill="#1C2C42"/>
      <path d="M8.85417 20.7099C9.39861 20.6007 9.92791 20.9534 10.0373 21.4978C10.1434 22.0259 10.3097 22.2927 10.5592 22.498C10.8351 22.7249 11.2415 22.8966 12.0106 22.9975C12.5611 23.0697 12.949 23.574 12.8772 24.1245C12.8049 24.6752 12.2998 25.0632 11.7491 24.991C10.7987 24.8664 9.96869 24.6154 9.28183 24.0504C8.58377 23.4761 8.23731 22.7449 8.06618 21.893C7.95704 21.3485 8.30971 20.8192 8.85417 20.7099Z" fill="#1C2C42"/>
      <path d="M23.0087 21.4978C23.1181 20.9534 23.6474 20.6007 24.1918 20.7099C24.7363 20.8192 25.0889 21.3485 24.9798 21.893C24.8087 22.7449 24.4622 23.4761 23.7641 24.0504C23.0773 24.6154 22.2473 24.8664 21.2969 24.991C20.7462 25.0632 20.241 24.6752 20.1688 24.1245C20.0969 23.574 20.4849 23.0697 21.0354 22.9975C21.8044 22.8966 22.2109 22.7249 22.4868 22.498C22.7363 22.2927 22.9026 22.0259 23.0087 21.4978Z" fill="#1C2C42"/>
      <path d="M9.62644 1.83515e-06C11.4911 1.97217e-06 12.9782 -0.00210536 14.1545 0.136945C15.3531 0.278622 16.3596 0.578533 17.2043 1.27178C17.4881 1.50462 17.7483 1.76481 17.9811 2.04854C18.638 2.84898 18.9418 3.79466 19.0924 4.912C19.2399 6.00698 19.2515 7.36839 19.2529 9.0506C19.2529 9.34636 19.1238 9.61191 18.9206 9.79593C18.8936 9.8204 18.866 9.84408 18.8364 9.86553C18.723 9.94779 18.5925 10.0081 18.4503 10.0373C18.3851 10.0507 18.3174 10.0574 18.2482 10.0575L18.2471 10.0563L14.7989 10.0575C14.2434 10.0575 13.7931 9.60718 13.7931 9.05172C13.7931 8.49627 14.2434 8.04598 14.7989 8.04598H17.2369C17.228 6.84247 17.1988 5.92324 17.0988 5.18139C16.9757 4.26764 16.7587 3.72976 16.4265 3.3248C16.2772 3.14293 16.1099 2.97568 15.9281 2.82642C15.5012 2.4762 14.9271 2.25419 13.9188 2.13497C12.8879 2.01311 11.5404 2.0115 9.62644 2.0115C7.71245 2.0115 6.36494 2.01311 5.33405 2.13497C4.32582 2.25419 3.75166 2.4762 3.3248 2.82642C3.14293 2.97568 2.97568 3.14293 2.82642 3.3248C2.4762 3.75166 2.25419 4.32582 2.13497 5.33405C2.01311 6.36494 2.0115 7.71245 2.0115 9.62644C2.0115 11.5404 2.01312 12.8879 2.13497 13.9188C2.25419 14.9271 2.4762 15.5012 2.82642 15.9281C2.97568 16.1099 3.14293 16.2772 3.3248 16.4265C3.72976 16.7587 4.26764 16.9757 5.18139 17.0988C5.92323 17.1988 6.84248 17.2269 8.04598 17.2358V14.7989C8.04598 14.2434 8.49627 13.7931 9.05172 13.7931C9.60718 13.7931 10.0575 14.2434 10.0575 14.7989V18.2471C10.0575 18.4206 10.0136 18.584 9.93624 18.7264C9.89781 18.7972 9.84956 18.8614 9.79593 18.9206C9.76531 18.9544 9.73319 18.9866 9.69828 19.016C9.68951 19.0234 9.68036 19.0303 9.67134 19.0374C9.5004 19.1716 9.28591 19.2529 9.05172 19.2529L9.0506 19.2518C7.36838 19.2504 6.00698 19.2399 4.912 19.0924C3.79466 18.9418 2.84898 18.638 2.04854 17.9811C1.76481 17.7483 1.50462 17.4881 1.27178 17.2043C0.578533 16.3596 0.278622 15.3531 0.136945 14.1545C-0.00210535 12.9782 1.69723e-06 11.4911 1.83489e-06 9.62644C1.97026e-06 7.76173 -0.0021054 6.27471 0.136945 5.09833C0.278623 3.89974 0.578532 2.89326 1.27178 2.04854C1.50462 1.76481 1.76481 1.50462 2.04854 1.27178C2.89326 0.578533 3.89974 0.278622 5.09833 0.136945C6.27471 -0.00210546 7.76173 1.69748e-06 9.62644 1.83515e-06Z" fill="#1C2C42"/>
      <path d="M23.9943 13.7931C24.5497 13.7931 25 14.2434 25 14.7989V18.2471C25 18.8026 24.5497 19.2529 23.9943 19.2529C23.4388 19.2529 22.9885 18.8026 22.9885 18.2471V14.7989C22.9885 14.2434 23.4388 13.7931 23.9943 13.7931Z" fill="#1C2C42"/>
      <path d="M11.7491 8.05496C12.2998 7.98274 12.8049 8.37077 12.8772 8.92152C12.949 9.47202 12.5611 9.97626 12.0106 10.0485C11.2415 10.1493 10.8351 10.3211 10.5592 10.548C10.3097 10.7533 10.1434 11.0201 10.0373 11.5481C9.92791 12.0926 9.39861 12.4453 8.85417 12.3361C8.30971 12.2268 7.95704 11.6975 8.06618 11.153C8.23731 10.3011 8.58377 9.56989 9.28183 8.9956C9.96869 8.43057 10.7987 8.17958 11.7491 8.05496Z" fill="#1C2C42"/>
      <path d="M21.2969 8.05496C22.2473 8.17958 23.0773 8.43057 23.7641 8.9956C24.4622 9.5699 24.8087 10.3011 24.9798 11.153C25.0889 11.6975 24.7363 12.2268 24.1918 12.3361C23.6474 12.4453 23.1181 12.0926 23.0087 11.5481C22.9026 11.0201 22.7363 10.7533 22.4868 10.548C22.2109 10.3211 21.8044 10.1493 21.0354 10.0485C20.4849 9.97626 20.0969 9.47202 20.1688 8.92152C20.241 8.37077 20.7462 7.98274 21.2969 8.05496Z" fill="#1C2C42"/>
    </svg>
  );
}

// Templates button scaled to match TutorialSettingsButton (45px in the app)
function TemplatesTutorialButton() {
  return (
    <svg className="block shrink-0" width="32.308" height="32.308" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
      <path d="M27.0977 30.8908C27.5421 30.8908 27.9023 31.251 27.9023 31.6954C27.9023 32.1398 27.5421 32.5 27.0977 32.5H24.3391C23.8947 32.5 23.5345 32.1398 23.5345 31.6954C23.5345 31.251 23.8947 30.8908 24.3391 30.8908H27.0977Z" fill="white"/>
      <path d="M19.5833 29.0679C20.0189 28.9806 20.4423 29.2627 20.5298 29.6983C20.6147 30.1207 20.7478 30.3342 20.9474 30.4984C21.1681 30.6799 21.4932 30.8173 22.1085 30.898C22.5489 30.9558 22.8592 31.3592 22.8017 31.7996C22.7439 32.2402 22.3398 32.5506 21.8992 32.4928C21.139 32.3931 20.4749 32.1923 19.9255 31.7403C19.367 31.2809 19.0898 30.6959 18.9529 30.0144C18.8656 29.5788 19.1478 29.1554 19.5833 29.0679Z" fill="white"/>
      <path d="M30.907 29.6983C30.9945 29.2627 31.4179 28.9806 31.8534 29.0679C32.289 29.1554 32.5711 29.5788 32.4838 30.0144C32.3469 30.6959 32.0698 31.2809 31.5113 31.7403C30.9618 32.1923 30.2978 32.3931 29.5375 32.4928C29.0969 32.5506 28.6928 32.2402 28.6351 31.7996C28.5776 31.3592 28.8879 30.9558 29.3283 30.898C29.9436 30.8173 30.2687 30.6799 30.4894 30.4984C30.689 30.3342 30.8221 30.1207 30.907 29.6983Z" fill="white"/>
      <path d="M20.2012 12.5C21.6929 12.5 22.8825 12.4983 23.8236 12.6096C24.7825 12.7229 25.5877 12.9628 26.2635 13.5174C26.4905 13.7037 26.6986 13.9119 26.8849 14.1388C27.4104 14.7792 27.6534 15.5357 27.7739 16.4296C27.8919 17.3056 27.9012 18.3947 27.9023 19.7405C27.9023 19.9771 27.7991 20.1895 27.6365 20.3367C27.6149 20.3563 27.5928 20.3753 27.5691 20.3924C27.4784 20.4582 27.374 20.5065 27.2602 20.5298C27.208 20.5405 27.1539 20.5459 27.0986 20.546L27.0977 20.5451L24.3391 20.546C23.8947 20.546 23.5345 20.1857 23.5345 19.7414C23.5345 19.297 23.8947 18.9368 24.3391 18.9368H26.2895C26.2824 17.974 26.259 17.2386 26.1791 16.6451C26.0806 15.9141 25.907 15.4838 25.6412 15.1598C25.5218 15.0143 25.388 14.8805 25.2425 14.7611C24.901 14.481 24.4416 14.3034 23.6351 14.208C22.8103 14.1105 21.7323 14.1092 20.2012 14.1092C18.67 14.1092 17.592 14.1105 16.7672 14.208C15.9607 14.3034 15.5013 14.481 15.1598 14.7611C15.0143 14.8805 14.8805 15.0143 14.7611 15.1598C14.481 15.5013 14.3034 15.9607 14.208 16.7672C14.1105 17.592 14.1092 18.67 14.1092 20.2012C14.1092 21.7323 14.1105 22.8103 14.208 23.6351C14.3034 24.4416 14.481 24.901 14.7611 25.2425C14.8805 25.388 15.0143 25.5218 15.1598 25.6412C15.4838 25.907 15.9141 26.0806 16.6451 26.1791C17.2386 26.259 17.974 26.2815 18.9368 26.2886V24.3391C18.9368 23.8947 19.297 23.5345 19.7414 23.5345C20.1857 23.5345 20.546 23.8947 20.546 24.3391V27.0977C20.546 27.2365 20.5109 27.3672 20.449 27.4811C20.4182 27.5377 20.3796 27.5891 20.3367 27.6365C20.3123 27.6635 20.2866 27.6893 20.2586 27.7128C20.2516 27.7187 20.2443 27.7242 20.2371 27.7299C20.1003 27.8373 19.9287 27.9023 19.7414 27.9023L19.7405 27.9014C18.3947 27.9003 17.3056 27.8919 16.4296 27.7739C15.5357 27.6534 14.7792 27.4104 14.1388 26.8849C13.9119 26.6986 13.7037 26.4905 13.5174 26.2635C12.9628 25.5877 12.7229 24.7825 12.6096 23.8236C12.4983 22.8825 12.5 21.6929 12.5 20.2012C12.5 18.7094 12.4983 17.5198 12.6096 16.5787C12.7229 15.6198 12.9628 14.8146 13.5174 14.1388C13.7037 13.9119 13.9119 13.7037 14.1388 13.5174C14.8146 12.9628 15.6198 12.7229 16.5787 12.6096C17.5198 12.4983 18.7094 12.5 20.2012 12.5Z" fill="white"/>
      <path d="M31.6954 23.5345C32.1398 23.5345 32.5 23.8947 32.5 24.3391V27.0977C32.5 27.5421 32.1398 27.9023 31.6954 27.9023C31.251 27.9023 30.8908 27.5421 30.8908 27.0977V24.3391C30.8908 23.8947 31.251 23.5345 31.6954 23.5345Z" fill="white"/>
      <path d="M21.8992 18.944C22.3398 18.8862 22.7439 19.1966 22.8017 19.6372C22.8592 20.0776 22.5489 20.481 22.1085 20.5388C21.4932 20.6195 21.1681 20.7569 20.9474 20.9384C20.7478 21.1026 20.6147 21.3161 20.5298 21.7385C20.4423 22.1741 20.0189 22.4562 19.5833 22.3689C19.1478 22.2814 18.8656 21.858 18.9529 21.4224C19.0898 20.7408 19.367 20.1559 19.9255 19.6965C20.4749 19.2445 21.139 19.0437 21.8992 18.944Z" fill="white"/>
      <path d="M29.5375 18.944C30.2978 19.0437 30.9618 19.2445 31.5113 19.6965C32.0698 20.1559 32.3469 20.7408 32.4838 21.4224C32.5712 21.858 32.289 22.2814 31.8534 22.3689C31.4179 22.4562 30.9945 22.1741 30.907 21.7385C30.8221 21.3161 30.689 21.1026 30.4894 20.9384C30.2687 20.7569 29.9436 20.6195 29.3283 20.5388C28.8879 20.481 28.5776 20.0776 28.6351 19.6372C28.6928 19.1966 29.0969 18.8862 29.5375 18.944Z" fill="white"/>
    </svg>
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
        <div className="flex items-center gap-[5.572px]">
          <div
            className="bg-white content-stretch flex items-center justify-center px-[9.751px] h-[31.5px] relative rounded-[69.652px] shrink-0"
            style={{ boxShadow: "inset 0 0 0 1.392px #4784F8", color: "#4784F8" }}
          >
            <div className="font-['Lato',sans-serif] font-bold text-[9.751px] whitespace-nowrap">
              Done
            </div>
          </div>
          <div
            className="content-stretch flex items-center justify-center px-[9.751px] h-[31.5px] relative rounded-[69.652px] shrink-0"
            style={{ boxShadow: "inset 0 0 0 0.696px #898989", color: "#898989" }}
          >
            <div className="font-['Lato',sans-serif] font-bold text-[9.751px] whitespace-nowrap">
              Deleted
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-center h-[31.5px] w-[61.3px] relative rounded-[69.652px] shrink-0 border border-solid border-[#4784F8] bg-[#4784F8] text-white">
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
  const [showSmartToggleHighlight, setShowSmartToggleHighlight] = useState(false);
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
      setShowSmartToggleHighlight(false);
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
    setShowSmartToggleHighlight(false);
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
      // Throb the toggle as the press, then switch it on
      const t3Active = t3 + TUTORIAL_ATTENTION_SEQUENCE_DELAY;
      const t4 = t3Active + SMART_REMINDER_POST_TOGGLE_PAUSE;

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

      const smartToggleHighlightTimer = window.setTimeout(() => {
        if (cancelled) return;
        setShowSmartToggleHighlight(true);
      }, t3);
      timers.push(smartToggleHighlightTimer);

      const smartToggleActivateTimer = window.setTimeout(() => {
        if (cancelled) return;
        setShowSmartToggleHighlight(false);
        setSmartToggleActive(true);
        onSmartFlowPhaseChange?.("toggle-active");
      }, t3Active);
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
                        left: addButtonRect.left + (addButtonRect.width / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                        top: addButtonRect.top + (addButtonRect.height / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                        width: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
                        height: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
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
                      <svg width={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} height={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} viewBox="0 0 50 50" fill="none">
                        <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
                      </svg>
                    </motion.div>
                  )}
                  {showMenuDotsHighlight && menuDotsRect && (
                    <motion.div
                      className="absolute z-10 pointer-events-none"
                      style={{
                        left: menuDotsRect.left + (menuDotsRect.width / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                        top: menuDotsRect.top + (menuDotsRect.height / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                        width: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
                        height: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
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
                      <svg width={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} height={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} viewBox="0 0 50 50" fill="none">
                        <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
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
            <TutorialListSettingsOverlayWithToggle smartToggleActive={smartToggleActive} showToggleHighlight={showSmartToggleHighlight} />
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
                  <svg width={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE} height={SMART_REMINDER_TICK_THROB_CIRCLE_SIZE} viewBox="0 0 50 50" fill="none">
                    <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
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
  calendarEnabled,
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
  calendarEnabled: boolean;
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
      // Measure against the container the ring is drawn in
      const parent = page3TargetElement.closest("[data-tutorial-ring-host]");
      if (!(parent instanceof HTMLElement)) {
        setPage3TargetRect(null);
        return;
      }

      // Ring sits over the list name text, not the whole row
      const title = page3TargetElement.querySelector("[data-tutorial-row-title]");
      const range = document.createRange();
      if (title) range.selectNodeContents(title);
      const targetRect = title ? range.getBoundingClientRect() : page3TargetElement.getBoundingClientRect();
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
            <p className="css-4hzbpn leading-[30px]">Quickly add, update, and organise<br />your lists in one place</p>
          ) : currentPage === 3 ? (
            <p className="css-4hzbpn leading-[30px]">Add a reminder that tracks<br />your list&apos;s progress</p>
          ) : (
            <p className="css-4hzbpn leading-[30px]">Create lists from ready-made<br />templates to get started fast</p>
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
            <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
          ) : page5ShowTemplatesPanel ? (
            // List templates header in the filter row slot, so its buttons keep the Lists row positions (as in the app)
            <TutorialReminderFilters
              items={[]}
              leading={<div className="font-['Lato',sans-serif] font-bold text-[14.359px] text-[#1C2C42] whitespace-nowrap">List templates</div>}
              trailing={
                <div className="flex items-center gap-[5.744px]">
                  <svg className="block shrink-0" width="32.308" height="32.308" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                    <path d="M17.0199 17.0201L27.9801 27.9803M17.0199 27.9803L27.9801 17.0201" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  {settingsMenuEnabled && <TutorialSettingsButton />}
                </div>
              }
              layout="between"
              rowGapClassName="gap-[10px]"
              groupGapClassName="gap-[5.744px]"
            />
          ) : (
            <TutorialReminderFilters
              items={listFilterItems}
              trailing={savedListsEnabled || settingsMenuEnabled ? (
                <div className="flex items-center gap-[5.744px]">
                  {savedListsEnabled && (
                    <div ref={currentPage === 4 ? setPage5TemplatesButtonElement : undefined} className="shrink-0">
                      <TemplatesTutorialButton />
                    </div>
                  )}
                  {settingsMenuEnabled && <TutorialSettingsButton />}
                </div>
              ) : undefined}
              layout="between"
              rowGapClassName="gap-[10px]"
              groupGapClassName={savedListsEnabled || settingsMenuEnabled ? "gap-[5.744px]" : "gap-[8.615px]"}
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
                      <div className="content-stretch flex flex-col gap-[26px] items-start pt-[24px] px-[24px] relative w-full shrink-0">
                        <ListsHeader
                          value="Vegetarian lasagne"
                          onChange={() => {}}
                          active
                          isEditMode
                          onSubmit={() => {}}
                          onClose={() => {}}
                          subtitleText={`${page5EditorItems.length} items`}
                          showMenuButton
                          leadingIcon={<TutorialSavedListTemplateIcon />}
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
                              left: page5AddButtonRect.left + (page5AddButtonRect.width / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                              top: page5AddButtonRect.top + (page5AddButtonRect.height / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                              width: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
                              height: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
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
                            <svg width={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} height={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} viewBox="0 0 50 50" fill="none">
                              <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
                            </svg>
                          </motion.div>
                        )}
                        {page5Phase === "menu-throb" && page5MenuDotsRect && (
                          <motion.div
                            key="page5-menu-throb"
                            className="absolute z-10 pointer-events-none"
                            style={{
                              left: page5MenuDotsRect.left + (page5MenuDotsRect.width / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                              top: page5MenuDotsRect.top + (page5MenuDotsRect.height / 2) - (SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE / 2),
                              width: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
                              height: SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE,
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
                            <svg width={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} height={SCALED_PANEL_BUTTON_HIGHLIGHT_CIRCLE_SIZE} viewBox="0 0 50 50" fill="none">
                              <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
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
                  <TutorialOverlayCard>
                    <TutorialOverlayTitle>Vegetarian lasagne</TutorialOverlayTitle>
                    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
                      <div className="h-[50px] relative rounded-[100px] shrink-0 w-full" style={{ backgroundColor: '#4784F8' }}>
                        <div className="flex flex-row items-center justify-center size-full">
                          <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                              <p className="leading-[normal]">Use as list</p>
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
                  </TutorialOverlayCard>
                </TutorialMiniOverlayShell>
              )}
              </>
            ) : undefined
          }
        >
          <div ref={currentPage === 4 ? setPage5ChildrenElement : undefined} data-tutorial-ring-host className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
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
                  left: page3TargetRect.left + (page3TargetRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
                  top: page3TargetRect.top + (page3TargetRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
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
                  <div className="bg-white content-stretch flex flex-col gap-[24px] items-center px-[20px] pt-[14.368px] relative w-full h-full min-h-[350px]">
                    {/* Mirrors production App.tsx line 3647: active lists wrapper */}
                    <div className="relative flex flex-col gap-[24px] w-full flex-1 min-h-0">
                      {/* Mirrors production App.tsx line 3749: list content area */}
                      <div className="relative w-full max-w-[768px] flex-1 min-h-0">
                        {/* Mirrors production App.tsx lines 3934-3936: templates panel overlay */}
                        <div className="absolute inset-0 bg-white" style={{ zIndex: 2 }}>
                          {/* Mirrors production App.tsx line 3938: templates inner column */}
                          <div className="relative flex flex-col gap-[24px] w-full h-full min-h-0 pt-[0px]">
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
                                      {/* Mirrors production App.tsx lines 3975-4004: row structure with static RowMenuButton dots */}
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
                                                  style={{ color: '#1C2C42', textDecorationColor: '#1C2C42', clipPath: 'inset(0 0 -4px 0)' }}
                                                >
                                                  <p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>
                                                    {tpl.title}
                                                  </p>
                                                </div>
                                                <div
                                                  className="flex items-center overflow-visible min-w-0"
                                                  style={{ textDecorationColor: '#BABABA' }}
                                                >
                                                  <p className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, paddingBottom: '4px', marginBottom: '-4px', color: '#BABABA' }}>
                                                    {tpl.itemCount} {tpl.itemCount === 1 ? 'item' : 'items'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <TutorialRowMenuDots alignWithSettingsButton={settingsMenuEnabled} />
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

// Onboarding testing mode is on for this tutorial: the Dev tools icon, top right of the tutorial card
function TutorialTestingModeIcon() {
  return (
    <div className="absolute top-[20px] right-[20px] z-10 pointer-events-none" role="img" aria-label="Onboarding testing mode" data-name="tutorial-testing-mode-icon">
      <svg width="27" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true">
        <path d="M22.1875 15.9375V18.4375C22.1875 21.973 22.1875 23.7408 21.0892 24.8392C19.9908 25.9375 18.223 25.9375 14.6875 25.9375H12.1875C8.65197 25.9375 6.8842 25.9375 5.78585 24.8392C4.6875 23.7408 4.6875 21.973 4.6875 18.4375V15.9375C4.6875 12.402 4.6875 10.6342 5.78585 9.53585C6.8842 8.4375 8.65197 8.4375 12.1875 8.4375H14.6875C18.223 8.4375 19.9908 8.4375 21.0892 9.53585C22.1875 10.6342 22.1875 12.402 22.1875 15.9375Z" strokeWidth="1.875" strokeLinejoin="round" stroke="#141B34" />
        <path d="M22.1875 20.9375C23.9553 20.9375 24.8392 20.9375 25.3883 20.3883C25.9375 19.8392 25.9375 18.9553 25.9375 17.1875C25.9375 15.4197 25.9375 14.5358 25.3883 13.9867C24.8392 13.4375 23.9553 13.4375 22.1875 13.4375" strokeWidth="1.875" strokeLinejoin="round" stroke="#141B34" />
        <path d="M4.6875 20.9375C2.91973 20.9375 2.03585 20.9375 1.48667 20.3883C0.9375 19.8392 0.9375 18.9553 0.9375 17.1875C0.9375 15.4197 0.9375 14.5358 1.48667 13.9867C2.03585 13.4375 2.91973 13.4375 4.6875 13.4375" strokeWidth="1.875" strokeLinejoin="round" stroke="#141B34" />
        <path d="M15.3125 2.8125C15.3125 3.84803 14.473 4.6875 13.4375 4.6875C12.402 4.6875 11.5625 3.84803 11.5625 2.8125C11.5625 1.77697 12.402 0.9375 13.4375 0.9375C14.473 0.9375 15.3125 1.77697 15.3125 2.8125Z" strokeWidth="1.875" stroke="#141B34" />
        <path d="M13.4375 4.6875V8.4375" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round" stroke="#141B34" />
        <path d="M9.6875 14.6875V15.9375" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round" stroke="#141B34" />
        <path d="M17.1875 14.6875V15.9375" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round" stroke="#141B34" />
        <path d="M10.9375 20.3125C10.9375 20.3125 11.7708 20.9375 13.4375 20.9375C15.1042 20.9375 15.9375 20.3125 15.9375 20.3125" strokeWidth="1.875" strokeLinecap="round" stroke="#141B34" />
      </svg>
    </div>
  );
}

export default function TutorialOnboardingContent({
  onComplete,
  variant,
  isListsEnabled,
  settingsMenuEnabled,
  smartRemindersEnabled,
  savedListsEnabled,
  calendarEnabled = false,
  repeatsEnabled = false,
  nlcDemo = null,
  notificationAskEligible = false,
  notificationPermission = null,
  onNotificationAllow,
  onNotificationAskPageChange,
  onNotificationSkip,
  onNotificationOpenSettings,
  siriAvailable = false,
  attachmentsAvailable = false,
  lockScreenWidgetAvailable = false,
  remindersSettings,
  listsSettings,
  testPageIds = null,
  livePageIds = null,
}: TutorialOnboardingContentProps) {
  // currentStep is the position in the visible sequence; currentPage is the page id being shown
  const [currentStep, setCurrentStep] = useState(0);
  const nlcDemoAvailable = nlcDemo != null;
  const pageIds = useMemo(
    () => getTutorialPageIds({ variant, settingsMenuEnabled, smartRemindersEnabled, savedListsEnabled, nlcDemoAvailable, notificationAskEligible, siriAvailable, attachmentsAvailable, lockScreenWidgetAvailable, testPageIds, livePageIds }),
    [variant, settingsMenuEnabled, smartRemindersEnabled, savedListsEnabled, nlcDemoAvailable, notificationAskEligible, siriAvailable, attachmentsAvailable, lockScreenWidgetAvailable, testPageIds, livePageIds],
  );
  const totalPages = pageIds.length;
  const currentPage = pageIds[Math.min(currentStep, totalPages - 1)];
  const isListsTutorial = variant === 'lists';
  const isNotificationAskPage = !isListsTutorial && currentPage === TUTORIAL_PAGE_NOTIFICATION_ASK;

  useEffect(() => {
    onNotificationAskPageChange?.(isNotificationAskPage);
  }, [isNotificationAskPage, onNotificationAskPageChange]);

  const [remindersTourActiveFilter, setRemindersTourActiveFilter] = useState<TutorialFilterKey | undefined>(undefined);
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
    if (isListsTutorial || currentPage !== 0) {
      setRemindersTourActiveFilter(undefined);
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

  const [notificationRequesting, setNotificationRequesting] = useState(false);

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
  // Turn on and Skip unless notifications are already on: undecided asks iOS, turned off opens iOS Settings
  const showNotificationAskButtons = isNotificationAskPage && notificationPermission !== 'granted';

  // Close (x) on every page but the last; on the Never miss a reminder page it counts as Skip
  const handleClose = () => {
    if (showNotificationAskButtons) onNotificationSkip?.();
    onComplete();
  };
  const activePaginationColor = isListsTutorial ? LIST_BLUE : REMINDERLY_LIGHT_BLUE;
  const nextButtonColor = isListsTutorial ? LIST_BLUE : "#4784f8";
  // Pagination dots: 10px apart, closing up only when they would not fit the navigation row's width
  const paginationDotSize = 7.935;
  const paginationGap = totalPages > 1 ? `min(10px, calc((100% - ${totalPages * paginationDotSize}px) / ${totalPages - 1}))` : '0px';

  return (
    <div
      data-testid="onboarding-root"
      className="bg-white flex flex-col h-full relative [@media(max-height:570px)]:!h-full [@media(max-height:570px)]:!pb-0"
      style={{
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        paddingLeft: 'clamp(16px, 5vw, 40px)',
        paddingRight: 'clamp(16px, 5vw, 40px)',
        paddingTop: '34px',
        paddingBottom: '34px',
      }}
    >
      {testPageIds && <TutorialTestingModeIcon />}
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
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} activeKey={remindersTourActiveFilter} />
                }
              >
                <OnboardingPage1Content
                  combineLaterSometime={settingsMenuEnabled}
                  activeFilter={remindersTourActiveFilter}
                  onActiveFilterChange={setRemindersTourActiveFilter}
                />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {!isListsTutorial && currentPage === TUTORIAL_PAGE_CREATE_REMINDER && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingCreateReminderText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <OnboardingCreateReminderPhone
                mode={{ kind: "manual" }}
                isListsEnabled={isListsEnabled}
                settingsMenuEnabled={settingsMenuEnabled}
                calendarEnabled={calendarEnabled}
                showRepeats={repeatsEnabled}
                attachmentsAvailable={attachmentsAvailable}
              />
            </div>
          </div>
        )}

        {!isListsTutorial && currentPage === TUTORIAL_PAGE_ATTACHMENT && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingAttachmentText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <OnboardingAttachmentPhone
                isListsEnabled={isListsEnabled}
                settingsMenuEnabled={settingsMenuEnabled}
                calendarEnabled={calendarEnabled}
                showRepeats={repeatsEnabled}
              />
            </div>
          </div>
        )}

        {!isListsTutorial && currentPage === TUTORIAL_PAGE_SIRI && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingSiriText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <OnboardingSiriPhone isListsEnabled={isListsEnabled} settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
            </div>
          </div>
        )}

        {!isListsTutorial && currentPage === TUTORIAL_PAGE_TYPE_NATURALLY && nlcDemo && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingTypeNaturallyText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <OnboardingCreateReminderPhone
                mode={{ kind: "nlc", demo: nlcDemo.demo, autoMode: nlcDemo.autoMode }}
                isListsEnabled={isListsEnabled}
                settingsMenuEnabled={settingsMenuEnabled}
                calendarEnabled={calendarEnabled}
                showRepeats={repeatsEnabled}
                attachmentsAvailable={attachmentsAvailable}
              />
            </div>
          </div>
        )}

        {isNotificationAskPage && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingNotificationAskText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${notificationPermission !== 'granted' ? TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME : "pb-[16px]"}`}>
              <OnboardingNotificationAskPhone />
            </div>
            {notificationPermission === 'granted' && (
              <div className="shrink-0 flex items-center justify-center h-[45px] mb-[16px]">
                <OnboardingNotificationAskResult permission={notificationPermission} />
              </div>
            )}
          </div>
        )}

        {!isListsTutorial && currentPage === TUTORIAL_PAGE_LOCK_SCREEN_WIDGET && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingLockScreenWidgetText />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <OnboardingLockScreenWidgetPhone />
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
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
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
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
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
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
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
                overlay={<OnboardingPage6Overlay settings={remindersSettings} />}
                filterRow={
                  <TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />
                }
              >
                <OnboardingPage6Content combineLaterSometime={settingsMenuEnabled} />
              </TutorialPhoneShell>
            </div>
          </div>
        )}
        
        {isListsTutorial && settingsMenuEnabled && currentPage === 5 && (
          <div className="content-stretch flex flex-col items-center relative w-full h-full min-h-0">
            <OnboardingPage6Text />
            <div className={`flex min-h-0 flex-1 items-center justify-center w-full ${TUTORIAL_PHONE_GAP_TOP_CLASSNAME} ${TUTORIAL_PHONE_GAP_BOTTOM_CLASSNAME}`}>
              <TutorialPhoneShell
                activeMainTab="lists"
                showHeaderMenu={false}
                overlay={<OnboardingPage6Overlay variant="lists" listsSettings={listsSettings} />}
                filterRow={
                  <TutorialReminderFilters
                    items={savedListsEnabled ? SAVED_LISTS_TUTORIAL_FILTER_ITEMS : UNGROUPED_TUTORIAL_LIST_FILTER_ITEMS}
                    trailing={
                      <div className="flex items-center gap-[5.744px]">
                        {savedListsEnabled && <TemplatesTutorialButton />}
                        <TutorialSettingsButton />
                      </div>
                    }
                    layout="between"
                    rowGapClassName="gap-[10px]"
                    groupGapClassName="gap-[5.744px]"
                  />
                }
              >
                <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
                  <TutorialStaticReminderList mode="lists" combineLaterSometime={settingsMenuEnabled} />
                </div>
              </TutorialPhoneShell>
            </div>
          </div>
        )}

        {isListsTutorial && currentPage !== 5 && (
          <ListsTutorialPlaceholderPage
            currentPage={currentPage}
            settingsMenuEnabled={settingsMenuEnabled}
            calendarEnabled={calendarEnabled}
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
        <div className="flex justify-center w-full max-w-[322px] h-[7.935px] [@media(max-height:570px)]:hidden" style={{ columnGap: paginationGap }} data-name="tutorial-pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <div
              key={index}
              className="shrink-0 rounded-full"
              style={{ width: paginationDotSize, height: paginationDotSize, backgroundColor: currentStep === index ? activePaginationColor : "#D9D9D9" }}
            />
          ))}
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
          
          {showNotificationAskButtons ? (
            // Never miss a reminder while iOS has not decided: Turn on and Skip, both moving on to the next page
            <div className="flex items-center gap-[16px]" data-name="tutorial-notification-ask-buttons">
              <button
                type="button"
                disabled={notificationRequesting}
                className="rounded-[100px] flex items-center justify-center px-[20px] cursor-pointer"
                onClick={() => {
                  if (!isPermissionUndecided(notificationPermission)) {
                    onNotificationOpenSettings?.();
                    return;
                  }
                  setNotificationRequesting(true);
                  void Promise.resolve(onNotificationAllow?.()).finally(() => {
                    setNotificationRequesting(false);
                    handleNext();
                  });
                }}
                style={{ height: TUTORIAL_FOOTER_BUTTON_HEIGHT, backgroundColor: nextButtonColor, opacity: notificationRequesting ? 0.5 : 1 }}
              >
                <span className="font-['Lato',sans-serif] font-bold text-[17px] text-white leading-[normal] whitespace-nowrap">Turn on</span>
              </button>
              <button
                type="button"
                disabled={notificationRequesting}
                className="rounded-[100px] flex items-center justify-center px-[20px] cursor-pointer"
                onClick={() => {
                  onNotificationSkip?.();
                  handleNext();
                }}
                style={{ height: TUTORIAL_FOOTER_BUTTON_HEIGHT, backgroundColor: "#D9D9D9" }}
              >
                <span className="font-['Lato',sans-serif] font-bold text-[17px] text-white leading-[normal] whitespace-nowrap">Skip</span>
              </button>
            </div>
          ) : (
          <button 
            className="w-[180px] rounded-[100px] flex items-center justify-center cursor-pointer"
            onClick={handleNext}
            style={{ height: TUTORIAL_FOOTER_BUTTON_HEIGHT, backgroundColor: nextButtonColor }}
          >
            <span className="font-['Lato',sans-serif] font-bold text-[17px] text-white leading-[normal]">
              {isLastPage ? (isListsTutorial ? 'Okay, got it!' : 'Okay, got it') : 'Next'}
            </span>
          </button>
          )}
          
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
            <div className="absolute right-0 flex h-[45px] w-[35px] items-center justify-center">
              <button
                type="button"
                aria-label="Close tutorial"
                data-name="tutorial-close-button"
                disabled={notificationRequesting}
                className="flex size-full items-center justify-center cursor-pointer"
                onClick={handleClose}
              >
                <svg className="block h-[23px] w-[23px]" fill="none" viewBox="0 0 21 20">
                  <path d="M16.8887 0.537952C17.6093 -0.179383 18.7782 -0.179251 19.4989 0.537952C20.2194 1.25536 20.2194 2.41898 19.4989 3.13637L12.6809 9.92305L19.6528 16.8644C20.3733 17.5818 20.3733 18.7446 19.6528 19.4621C18.9322 20.1793 17.764 20.1793 17.0434 19.4621L10.0966 12.5465L3.14976 19.4621C2.42914 20.1793 1.26101 20.1793 0.540397 19.4621C-0.18013 18.7446 -0.180135 17.5818 0.540397 16.8644L7.51223 9.92305L0.694302 3.13637C-0.02624 2.41898 -0.0262144 1.25536 0.694302 0.537952C1.41496 -0.179251 2.58387 -0.179383 3.30444 0.537952L10.0966 7.30041L16.8887 0.537952Z" fill="#D9D9D9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
