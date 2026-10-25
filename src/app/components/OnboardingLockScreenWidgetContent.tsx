// Reminders tutorial page "Reminders at a glance": the Reminderly lock screen widget (ios/App/ReminderlyWidget),
// shown after Never miss a reminder. The top of a locked iPhone with the circular widget under the clock: an open
// ring that fills as reminders are done, today's outstanding count in the middle and a tick at the bottom.

import { useEffect, useState } from "react";
import { LockScreenWallpaper } from "./OnboardingNotificationAskContent";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";

const WIDGET_TOTAL = 4;
const WIDGET_STEP_MS = 1300;

export function OnboardingLockScreenWidgetText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Reminders at a glance</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Add the Reminderly widget to your lock<br />screen to see what's left to do today</p>
      </div>
    </div>
  );
}

// The circular widget as iOS draws it: translucent disc, a 270 degree track with the gap at the bottom, the
// progress arc, the outstanding count and the tick. Sizes follow the widget's 6pt stroke and 3pt inset.
function LockScreenWidget({ done }: { done: number }) {
  const outstanding = WIDGET_TOTAL - done;
  const progress = done / WIDGET_TOTAL;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const track = circumference * 0.75;
  return (
    <div className="relative size-[64px]" data-name="tutorial-lock-screen-widget">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="32" fill="rgba(255, 255, 255, 0.18)" />
        <g transform="rotate(135 32 32)">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${track} ${circumference}`} />
          {progress > 0 && (
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${track * progress} ${circumference}`}
              style={{ transition: "stroke-dasharray 0.5s ease-out" }}
            />
          )}
        </g>
        <path d="M28 52.5l2.6 2.6 5.4-5.6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center pb-[4px] font-['Lato',sans-serif] font-bold text-[24px] text-white leading-none">{outstanding}</p>
    </div>
  );
}

// The top of a locked iPhone: wallpaper, Dynamic Island, date, time and the widget. Reminders are ticked off one
// by one (4 left to none), then it starts again.
export default function OnboardingLockScreenWidgetPhone() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone((value) => (value >= WIDGET_TOTAL ? 0 : value + 1)), done >= WIDGET_TOTAL ? WIDGET_STEP_MS * 2 : WIDGET_STEP_MS);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <div className="relative shrink-0 h-full w-full max-w-[308px] [@media(max-height:570px)]:scale-[0.7] [@media(max-height:570px)]:origin-top [@media(max-height:570px)]:-mb-[108px]" data-name="tutorial-lock-screen-top">
      <div className="h-full w-full rounded-tl-[40px] rounded-tr-[40px]" style={{ backgroundColor: "#000000", paddingTop: "14px", paddingLeft: "14px", paddingRight: "14px", boxSizing: "border-box" }}>
        <div className="overflow-clip relative rounded-tl-[26px] rounded-tr-[26px] h-full w-full">
          <LockScreenWallpaper anchor="top" />
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 h-[22px] w-[78px] rounded-[11px] bg-black" />
          <div className="relative flex flex-col items-center pt-[50px] text-white font-['Lato',sans-serif]">
            <p className="text-[14px] font-bold leading-[18px]">Saturday 25 October</p>
            <p className="text-[64px] font-bold leading-[70px] tracking-[-1px]">9:41</p>
            <div className="mt-[14px]">
              <LockScreenWidget done={done} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
