// Reminders tutorial page "Never miss a reminder" (docs/plans/onboarding-gaps.md, section 4). The in-app
// notification ask, before the Re-run this tutorial page. Turn on and Skip sit in the tutorial footer
// (TutorialOnboardingContent) until notifications are on; then the page shows "Notifications are on".

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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

// Illustrated version of a standard iPhone wallpaper (sky blue, a rounded blue shape, a white sliver and a deep
// navy sweep), drawn as flat, hard-edged shapes: no gradients or fades. Centred, so the phone shows the middle.
function LockScreenWallpaper() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 376 749" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="376" height="749" fill="#8DD1F8" />
      <path d="M0 0 H376 V120 C 280 90 140 150 0 130 Z" fill="#A9DDFA" />
      <path d="M0 450 C 30 470 58 510 72 560 C 50 610 24 650 0 680 Z" fill="#F4D8CF" />
      <path d="M186 360 C 182 230 196 140 248 86 C 286 50 334 36 376 32 V 340 Z" fill="#2E86EE" />
      <path d="M60 545 C 92 455 136 382 190 326 C 188 402 168 470 130 532 C 108 548 82 552 60 545 Z" fill="#EEF4FB" />
      <path d="M0 700 C 64 646 108 604 136 540 C 166 470 178 390 190 326 C 250 290 320 250 376 196 V 749 H 0 Z" fill="#123B8F" />
      <path d="M190 326 C 250 290 320 250 376 196 V 300 C 312 332 252 352 188 366 Z" fill="#1F5FD6" />
      <path d="M40 749 C 130 640 190 560 250 500 C 300 450 340 420 376 400 V 749 Z" fill="#0A1F55" />
      <path d="M150 749 C 220 680 290 620 376 570 V 749 Z" fill="#050D2E" />
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
 * In the page body once notifications are on. Otherwise Turn on and Skip are in the footer: Turn on asks iOS while
 * it has not decided, and opens Reminderly's page in iOS Settings once notifications are turned off.
 */
export function OnboardingNotificationAskResult({ permission }: { permission: string | null }) {
  if (permission !== "granted") return null;
  return (
    <p className="font-['Lato',sans-serif] font-bold text-[17px] text-[#4784F8] text-center leading-[45px]">Notifications are on</p>
  );
}
