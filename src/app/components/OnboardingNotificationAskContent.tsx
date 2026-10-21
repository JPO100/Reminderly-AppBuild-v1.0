// Reminders tutorial page "Never miss a reminder" (docs/plans/onboarding-gaps.md, section 4). The in-app
// notification ask as the last tutorial page. Allow is only offered while iOS has not decided, because only
// then can it show the iOS prompt; afterwards the page shows the granted or denied result instead.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { isPermissionUndecided } from "../notification-ask";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialPhoneShell from "./TutorialPhoneShell";
import { TutorialRemindersFilterRow } from "./TutorialReminderFilters";
import TutorialStaticReminderList from "./TutorialStaticReminderList";

const BANNER_SHOW_DELAY = 800;
const BANNER_VISIBLE_MS = 2500;
const BANNER_RECYCLE_MS = 1500;

export function OnboardingNotificationAskText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Never miss a reminder</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Reminderly can alert you when a reminder<br />is due and show a count on the app icon</p>
      </div>
    </div>
  );
}

// Mock iOS notification banner for the "Water the plants" reminder in the tutorial list
function TutorialAlertBanner() {
  return (
    <div className="mx-[10px] rounded-[14px] bg-white/95 px-[10px] py-[8px] flex gap-[8px] items-center" style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)" }}>
      <div className="size-[26px] shrink-0 rounded-[6px] bg-[#4784F8] flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.6" />
          <path d="M4.3 7.2l1.8 1.8 3.6-3.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1 font-['Lato',sans-serif]">
        <div className="flex justify-between items-baseline">
          <p className="text-[9px] font-bold tracking-[0.3px] text-[#6B6B6B]">REMINDERLY</p>
          <p className="text-[8px] text-[#939393]">now</p>
        </div>
        <p className="text-[11px] font-bold text-[#1C2C42] leading-[14px] truncate">Water the plants</p>
        <p className="text-[10px] text-[#6B6B6B] leading-[13px] truncate">Today at 9:30 PM</p>
      </div>
    </div>
  );
}

export default function OnboardingNotificationAskPhone({
  isListsEnabled,
  settingsMenuEnabled,
  calendarEnabled,
}: {
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  calendarEnabled: boolean;
}) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setBannerVisible(true), BANNER_SHOW_DELAY);
    const hideTimer = window.setTimeout(() => setBannerVisible(false), BANNER_SHOW_DELAY + BANNER_VISIBLE_MS);
    const recycleTimer = window.setTimeout(() => setCycle((value) => value + 1), BANNER_SHOW_DELAY + BANNER_VISIBLE_MS + BANNER_RECYCLE_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(recycleTimer);
    };
  }, [cycle]);

  return (
    <TutorialPhoneShell
      activeMainTab="reminders"
      showMainTabBar={isListsEnabled}
      showHeaderMenu={false}
      filterRow={<TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />}
      overlay={
        <AnimatePresence>
          {bannerVisible && (
            <motion.div
              key="tutorial-alert-banner"
              className="absolute left-0 right-0 top-[8px] z-50"
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <TutorialAlertBanner />
            </motion.div>
          )}
        </AnimatePresence>
      }
    >
      <div className="content-stretch flex flex-col flex-1 min-h-0 items-center pt-[10px] px-[14px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full">
          <TutorialStaticReminderList combineLaterSometime={settingsMenuEnabled} />
        </div>
      </div>
    </TutorialPhoneShell>
  );
}

/**
 * Below the phone: Allow alerts while iOS has not decided, then the result. permission is the live iOS
 * permission (prompt, granted or denied); onAllow runs the app's existing Allow handler.
 */
export function OnboardingNotificationAskAction({
  permission,
  onAllow,
}: {
  permission: string | null;
  onAllow: () => Promise<unknown> | void;
}) {
  const [requesting, setRequesting] = useState(false);

  if (permission === "granted") {
    return (
      <p className="font-['Lato',sans-serif] font-bold text-[17px] text-[#4784F8] text-center leading-[45px]">Alerts are on</p>
    );
  }
  if (!isPermissionUndecided(permission)) {
    return (
      <p className="font-['Lato',sans-serif] font-bold text-[15px] text-[#939393] text-center leading-[45px]">You can turn alerts on later in Settings</p>
    );
  }
  return (
    <button
      type="button"
      disabled={requesting}
      className="h-[45px] w-[180px] rounded-[100px] cursor-pointer bg-white"
      style={{ boxShadow: "inset 0 0 0 2px #4784F8", opacity: requesting ? 0.5 : 1 }}
      onClick={() => {
        setRequesting(true);
        void Promise.resolve(onAllow()).finally(() => setRequesting(false));
      }}
    >
      <span className="font-['Lato',sans-serif] font-bold text-[17px] text-[#4784F8] leading-[normal]">Allow alerts</span>
    </button>
  );
}
