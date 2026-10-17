import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";
import {
  TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
  TUTORIAL_ATTENTION_THROB_DELAY,
  TUTORIAL_ATTENTION_THROB_DURATION,
  TUTORIAL_ATTENTION_THROB_TIMES,
  TutorialMiniOverlayShell,
} from "./OnboardingPage3Content";
import { RemindersSettingsContent } from "./SettingsPanelContent";

export function OnboardingPage6Text() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Re-run this tutorial</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">You can re-run this tutorial from<br />the blue settings button.</p>
      </div>
    </div>
  );
}

export default function OnboardingPage6Content({ combineLaterSometime = false }: { combineLaterSometime?: boolean }) {
  return (
    <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
      <TutorialStaticReminderList combineLaterSometime={combineLaterSometime} />
    </div>
  );
}

type Page6Phase = "none" | "settings-throb" | "settings-overlay" | "tutorial-throb";

const PAGE_6_PAUSE_MS = 750;
const PAGE_6_THROB_TOTAL_MS = (TUTORIAL_ATTENTION_THROB_DELAY + TUTORIAL_ATTENTION_THROB_DURATION) * 1000;
// Large ring for 45px header buttons, standard ring for rows and small controls
const PAGE_6_LARGE_CIRCLE_SIZE = 50;
const noop = () => {};

function Page6Ring({ rect, size }: { rect: { x: number; y: number }; size: number }) {
  return (
    <motion.div
      className="absolute z-[70] pointer-events-none"
      style={{ left: rect.x - size / 2, top: rect.y - size / 2, width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
      transition={{ duration: TUTORIAL_ATTENTION_THROB_DURATION, delay: TUTORIAL_ATTENTION_THROB_DELAY, times: TUTORIAL_ATTENTION_THROB_TIMES, ease: "easeInOut" }}
    >
      <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
        <circle cx="25" cy="25" r="23.5" stroke="#4784F8" strokeWidth="3" />
      </svg>
    </motion.div>
  );
}

// Re-run page: highlight the Settings button, open Reminders settings, highlight the tutorial option, then stop.
// Settings shows three rows so the tutorial option sits inside the phone frame.
export function OnboardingPage6Overlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Page6Phase>("none");
  const [ringCentre, setRingCentre] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const t1 = PAGE_6_PAUSE_MS;
    const t2 = t1 + PAGE_6_THROB_TOTAL_MS + PAGE_6_PAUSE_MS;
    const t3 = t2 + PAGE_6_PAUSE_MS;
    const timers = [
      window.setTimeout(() => setPhase("settings-throb"), t1),
      window.setTimeout(() => setPhase("settings-overlay"), t2),
      window.setTimeout(() => setPhase("tutorial-throb"), t3),
    ];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || (phase !== "settings-throb" && phase !== "tutorial-throb")) {
      setRingCentre(null);
      return;
    }
    const target = phase === "settings-throb"
      ? root.parentElement?.querySelector('svg[width="32.308"]')
      : [...root.querySelectorAll("button")].find((button) => button.textContent === "Reminders tutorial")?.querySelector("svg");
    if (!target) return;
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setRingCentre({ x: targetRect.left - rootRect.left + targetRect.width / 2, y: targetRect.top - rootRect.top + targetRect.height / 2 });
  }, [phase]);

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none">
      {(phase === "settings-overlay" || phase === "tutorial-throb") && (
        <TutorialMiniOverlayShell>
          <div className="bg-white relative flex flex-col items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] outline-none" style={{ width: 340, height: 450, overflowY: "hidden" }}>
            <RemindersSettingsContent
              onOpenTutorial={noop}
              notificationsAvailable
              notifPrefs={{ alerts: true, sound: true, badge: true, includeToday: false }}
              notifPermissionDenied={false}
              onNotifChange={noop}
              calendarAvailable={false}
              calendarOn={false}
              onCalendarChange={noop}
              datePresetsAvailable={false}
              datePresetsOn={false}
              onDatePresetsChange={noop}
              soundsAvailable
              nlcAvailable={false}
              nlcPrefs={{ on: true, date: true, time: true, repeats: true, autoParsing: true }}
              onNlcChange={noop}
              repeatsAvailable={false}
              hapticsAvailable={false}
              oneMinuteAvailable={false}
              oneMinuteOn={false}
              onOneMinuteChange={noop}
              siriAvailable={false}
              siriOn={false}
              onSiriChange={noop}
            />
          </div>
        </TutorialMiniOverlayShell>
      )}
      {ringCentre && (
        <Page6Ring
          key={phase}
          rect={ringCentre}
          size={phase === "settings-throb" ? PAGE_6_LARGE_CIRCLE_SIZE : TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE}
        />
      )}
    </div>
  );
}
