// Reminders tutorial page "Never miss a reminder" (docs/plans/onboarding-gaps.md, section 4). The in-app
// notification ask, before the Re-run this tutorial page. Turn on and Skip sit in the tutorial footer while iOS
// has not decided (TutorialOnboardingContent); afterwards the page shows the granted or denied result instead.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isPermissionUndecided } from "../notification-ask";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";

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
        <p className="css-4hzbpn leading-[30px]">Reminderly can notify you when a reminder<br />is due and show a count on the app icon</p>
      </div>
    </div>
  );
}

// Mock iOS notification for the "Water the plants" reminder, as it appears on the lock screen
function TutorialAlertBanner() {
  return (
    <div className="rounded-[14px] bg-white/95 px-[10px] py-[8px] flex gap-[8px] items-center" style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)" }}>
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

// Illustrated version of a standard iPhone wallpaper: flat, hard-edged waves (no gradients)
function LockScreenWallpaper() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 280 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="280" height="400" fill="#1C2C42" />
      <path d="M0 40 C 80 10 170 90 280 50 L280 400 L0 400 Z" fill="#24407A" />
      <path d="M0 120 C 90 80 180 170 280 120 L280 400 L0 400 Z" fill="#2F5BB8" />
      <path d="M0 200 C 70 160 190 250 280 190 L280 400 L0 400 Z" fill="#4784F8" />
      <path d="M0 270 C 100 230 170 320 280 260 L280 400 L0 400 Z" fill="#7FA6FA" />
      <path d="M0 330 C 80 300 200 380 280 320 L280 400 L0 400 Z" fill="#B9CDFC" />
    </svg>
  );
}

function LockScreenButton({ children }: { children: ReactNode }) {
  return (
    <div className="size-[44px] rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(28, 44, 66, 0.55)" }}>
      {children}
    </div>
  );
}

// The bottom of a locked iPhone: wallpaper, torch and camera buttons, home indicator. The notification rises
// into place above the buttons, leaves and repeats.
export default function OnboardingNotificationAskPhone() {
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
    <div className="relative shrink-0 h-full w-full max-w-[308px] [@media(max-height:570px)]:scale-[0.7] [@media(max-height:570px)]:origin-bottom [@media(max-height:570px)]:-mt-[108px]" data-name="tutorial-lock-screen">
      <div className="h-full w-full rounded-bl-[40px] rounded-br-[40px]" style={{ backgroundColor: "#000000", paddingLeft: "14px", paddingRight: "14px", paddingBottom: "14px", boxSizing: "border-box" }}>
        <div className="overflow-clip relative rounded-bl-[26px] rounded-br-[26px] h-full w-full">
          <LockScreenWallpaper />
          <AnimatePresence>
            {bannerVisible && (
              <motion.div
                key="tutorial-alert-banner"
                className="absolute left-[10px] right-[10px] bottom-[84px]"
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <TutorialAlertBanner />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute left-[24px] right-[24px] bottom-[24px] flex justify-between">
            <LockScreenButton>
              <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true">
                <path d="M1 1h12v4l-3 4v12H4V9L1 5V1z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="7" cy="13" r="1.4" fill="white" />
              </svg>
            </LockScreenButton>
            <LockScreenButton>
              <svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden="true">
                <path d="M1 4.5h4.5L7.5 1.5h7l2 3H21V16H1V4.5z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="11" cy="9.8" r="3.4" stroke="white" strokeWidth="1.6" />
              </svg>
            </LockScreenButton>
          </div>
          <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2 h-[4px] w-[96px] rounded-[2px] bg-white pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

/**
 * In the page body once iOS has decided: the granted or denied result. While iOS has not decided, nothing shows
 * here; Turn on and Skip are in the footer. permission is the live iOS permission (prompt, granted or denied).
 */
export function OnboardingNotificationAskResult({ permission }: { permission: string | null }) {
  if (isPermissionUndecided(permission)) return null;
  if (permission === "granted") {
    return (
      <p className="font-['Lato',sans-serif] font-bold text-[17px] text-[#4784F8] text-center leading-[45px]">Notifications are on</p>
    );
  }
  return (
    <p className="font-['Lato',sans-serif] font-bold text-[15px] text-[#939393] text-center leading-[45px]">You can turn on notifications later in Settings</p>
  );
}
