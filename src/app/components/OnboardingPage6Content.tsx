import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { motion } from "motion/react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";
import {
  TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
  TUTORIAL_ATTENTION_THROB_DELAY,
  TUTORIAL_ATTENTION_THROB_DURATION,
  TUTORIAL_ATTENTION_THROB_TIMES,
  TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH,
} from "./OnboardingPage3Content";
import { RemindersSettingsContent } from "./SettingsPanelContent";
import { ShowInfoIconsContext } from "./DevToolsOverlay";

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

type Page6Phase = "none" | "settings-throb" | "settings-overlay" | "settings-scroll" | "tutorial-throb";

// Reminders settings rows as the live overlay shows them (App passes its own availability and values)
export type TutorialRemindersSettings = Pick<ComponentProps<typeof RemindersSettingsContent>,
  "notificationsAvailable" | "datePresetsAvailable" | "datePresetsOn" | "soundsAvailable" | "nlcAvailable" | "hapticsAvailable"
  | "oneMinuteAvailable" | "oneMinuteOn" | "siriAvailable" | "siriOn"> & { showInfoIcons: boolean };

const PAGE_6_PAUSE_MS = 750;
const PAGE_6_THROB_TOTAL_MS = (TUTORIAL_ATTENTION_THROB_DELAY + TUTORIAL_ATTENTION_THROB_DURATION) * 1000;
const PAGE_6_SCROLL_MS = 900;
// Large ring for 45px header buttons, standard ring for rows and small controls
const PAGE_6_LARGE_CIRCLE_SIZE = 50;
// The live card is 340pt wide on a 393pt screen; the tutorial scales it as the phone scales the app
const PAGE_6_APP_WIDTH = 393;
const PAGE_6_CARD_SCALE = TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH / PAGE_6_APP_WIDTH;
const PAGE_6_CARD_MARGIN = 16;
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

// Re-run page: highlight the Settings button, open Reminders settings with the rows the app shows, scroll them to the
// bottom, highlight the tutorial option, then stop. The card is the live overlay scaled to the phone, centred, its
// height capped to the phone so the rows scroll as they do on shorter screens.
export function OnboardingPage6Overlay({ settings }: { settings?: TutorialRemindersSettings }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Page6Phase>("none");
  const [ringCentre, setRingCentre] = useState<{ x: number; y: number } | null>(null);
  const [cardMaxHeight, setCardMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const t1 = PAGE_6_PAUSE_MS;
    const t2 = t1 + PAGE_6_THROB_TOTAL_MS + PAGE_6_PAUSE_MS;
    const t3 = t2 + PAGE_6_PAUSE_MS;
    const t4 = t3 + PAGE_6_SCROLL_MS + PAGE_6_PAUSE_MS / 2;
    const timers = [
      window.setTimeout(() => setPhase("settings-throb"), t1),
      window.setTimeout(() => setPhase("settings-overlay"), t2),
      window.setTimeout(() => setPhase("settings-scroll"), t3),
      window.setTimeout(() => setPhase("tutorial-throb"), t4),
    ];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  // Card height in unscaled points: the visible phone less a margin top and bottom
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setCardMaxHeight((root.clientHeight - PAGE_6_CARD_MARGIN * 2) / PAGE_6_CARD_SCALE);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "settings-scroll") return;
    const scroll = cardRef.current?.querySelector<HTMLElement>(".overflow-y-auto");
    scroll?.scrollTo({ top: scroll.scrollHeight, behavior: "smooth" });
  }, [phase]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || (phase !== "settings-throb" && phase !== "tutorial-throb")) {
      setRingCentre(null);
      return;
    }
    const target = phase === "settings-throb"
      ? root.parentElement?.querySelector('svg[data-tutorial-settings-button]')
      : [...root.querySelectorAll("button")].find((button) => button.textContent === "Reminders tutorial")?.querySelector("svg");
    if (!target) return;
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setRingCentre({ x: targetRect.left - rootRect.left + targetRect.width / 2, y: targetRect.top - rootRect.top + targetRect.height / 2 });
  }, [phase]);

  const overlayOpen = phase === "settings-overlay" || phase === "settings-scroll" || phase === "tutorial-throb";

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none">
      {overlayOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div
            ref={cardRef}
            className="bg-white relative flex flex-col items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] outline-none shrink-0"
            style={{ width: 340, maxHeight: cardMaxHeight, overflowY: "hidden", transform: `scale(${PAGE_6_CARD_SCALE})`, transformOrigin: "center" }}
          >
            <ShowInfoIconsContext.Provider value={settings?.showInfoIcons ?? true}>
              <RemindersSettingsContent
                onOpenTutorial={noop}
                notificationsAvailable={settings?.notificationsAvailable ?? true}
                notifPrefs={{ alerts: true, sound: true, badge: true, includeToday: false }}
                notifPermissionDenied={false}
                onNotifChange={noop}
                datePresetsAvailable={settings?.datePresetsAvailable ?? false}
                datePresetsOn={settings?.datePresetsOn ?? false}
                onDatePresetsChange={noop}
                soundsAvailable={settings?.soundsAvailable ?? true}
                nlcAvailable={settings?.nlcAvailable ?? false}
                nlcPrefs={{ on: true, date: true, time: true, repeats: true, autoParsing: true }}
                onNlcChange={noop}
                repeatsAvailable={false}
                hapticsAvailable={settings?.hapticsAvailable ?? false}
                oneMinuteAvailable={settings?.oneMinuteAvailable ?? false}
                oneMinuteOn={settings?.oneMinuteOn ?? false}
                onOneMinuteChange={noop}
                siriAvailable={settings?.siriAvailable ?? false}
                siriOn={settings?.siriOn ?? false}
                onSiriChange={noop}
              />
            </ShowInfoIconsContext.Provider>
          </div>
        </div>
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
