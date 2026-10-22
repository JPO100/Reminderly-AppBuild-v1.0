// Reminders tutorial page "Add reminders with Siri" (Siri Phase 3). Shown while Siri for reminders is available,
// whatever the user's Siri setting. The phone top slice plays the Siri journey, modelled on Siri in iOS 27: a home
// screen, the dark Siri orb dropping from the Dynamic Island with its multicolour waveform, Siri's question in the
// dark panel, with the Siri glow around the screen edge while Siri is active, then Reminderly opening from its icon
// and the new reminder arriving at the top of the list. Home screen icons are simple generic drawings, not Apple
// artwork. The edge glow recreates the iOS Siri glow in code and is the one deliberate gradient in Reminderly (John).

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialPhoneShell from "./TutorialPhoneShell";
import { TutorialRemindersFilterRow } from "./TutorialReminderFilters";
import TutorialStaticReminderList, { type TutorialReminder } from "./TutorialStaticReminderList";

// Tutorial list dates are fixed (Monday 11 August 2025); 6pm today sorts above the first reminder (9:30pm)
const SIRI_REMINDER: TutorialReminder = {
  id: "tutorial-siri-reminder",
  title: "Call Mum",
  category: "today",
  circleColor: "#00AFEE",
  schedule: { kind: "scheduled", date: "2025-08-11", time: "18:00" },
};
const SIRI_QUESTION = "What would you like to be reminded about?";
const SPOKEN_REPLY = "Call Mum at 6pm today";
const SIRI_COLOURS = ["#8D9FFF", "#BC82F3", "#FF6778", "#FFBA71", "#6FD3F8"];
const SIRI_GLOW_COLOURS = "#BC82F3, #F5B9EA, #8D9FFF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3";
const SIRI_GLOW_TURN_SECONDS = 4;

type Phase = "home" | "listening" | "question" | "reply" | "closing" | "launch" | "app" | "inserted";
// Time each phase starts, from the start of a cycle
const PHASE_STARTS: [Phase, number][] = [
  ["home", 0],
  ["listening", 900],
  ["question", 2400],
  ["reply", 4300],
  ["closing", 6000],
  ["launch", 6500],
  ["app", 7000],
  ["inserted", 7500],
];
const INSERT_HIGHLIGHT_MS = 1000;
const CYCLE_MS = 7500 + INSERT_HIGHLIGHT_MS + 2000;
const PHASE_ORDER = PHASE_STARTS.map(([phase]) => phase);
// Height to width of a full iPhone screen; the app opens to this full screen, which runs on below the slice
const FULL_SCREEN_ASPECT = 2.17;

export function OnboardingSiriText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Add reminders with Siri</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Say <span className="text-[#4784F8]">&ldquo;Hey Siri, add to Reminderly app&rdquo;</span><br />then tell Siri your reminder</p>
      </div>
    </div>
  );
}

// Generic home screen icons: a coloured tile with a simple white glyph
type HomeApp = { label: string; tile: string; glyph: ReactNode };
const glyph = (children: ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const HOME_APPS: HomeApp[] = [
  { label: "Messages", tile: "#34C759", glyph: glyph(<path d="M4 11c0-3.9 3.6-7 8-7s8 3.1 8 7-3.6 7-8 7c-1 0-2-.2-2.9-.5L5 19l1.1-3.3C4.8 14.4 4 12.8 4 11z" fill="white" stroke="none" />) },
  { label: "Calendar", tile: "#FFFFFF", glyph: <div className="flex flex-col items-center leading-none font-['Lato',sans-serif]"><span className="text-[6px] font-bold text-[#FF3B30]">MON</span><span className="text-[17px] font-bold text-[#1C2C42]">11</span></div> },
  { label: "Photos", tile: "#FFFFFF", glyph: <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">{["#FF9500", "#FFCC00", "#34C759", "#5AC8FA", "#AF52DE", "#FF2D55"].map((c, i) => <ellipse key={c} cx="12" cy="7" rx="3" ry="5" fill={c} opacity="0.85" transform={`rotate(${i * 60} 12 12)`} />)}</svg> },
  { label: "Camera", tile: "#8E8E93", glyph: glyph(<><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M9 7l1.5-2h3L15 7" /></>) },
  { label: "Mail", tile: "#2F7CF6", glyph: glyph(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 7l9 6 9-6" /></>) },
  { label: "Weather", tile: "#4A90E2", glyph: glyph(<><circle cx="9" cy="10" r="3.5" fill="#FFCC00" stroke="none" /><path d="M8 18h9a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.5 1.5A2.3 2.3 0 0 0 8 18z" fill="white" stroke="none" /></>) },
  { label: "Reminderly", tile: "#FFFFFF", glyph: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="11" stroke="#4784F8" strokeWidth="2.6" /><path d="M9.5 14.3l3.1 3.1 6-6.4" stroke="#4784F8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { label: "Clock", tile: "#1C1C1E", glyph: glyph(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>) },
  { label: "Maps", tile: "#E8F0E0", glyph: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18l16-12" stroke="#FFCC00" strokeWidth="3" /><path d="M8 4v16" stroke="#9BC8F2" strokeWidth="3" /><circle cx="15" cy="11" r="3" fill="#2F7CF6" /></svg> },
  { label: "Notes", tile: "#FFD60A", glyph: glyph(<><path d="M6 9h12M6 13h12M6 17h8" stroke="#8A6D00" /></>) },
  { label: "Settings", tile: "#8E8E93", glyph: glyph(<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7.5" strokeDasharray="3 2.2" /></>) },
  { label: "Music", tile: "#FF375F", glyph: glyph(<><path d="M9 17V6l10-2v11" /><circle cx="7" cy="17" r="2" fill="white" /><circle cx="17" cy="15" r="2" fill="white" /></>) },
];
const REMINDERLY_INDEX = HOME_APPS.findIndex((app) => app.label === "Reminderly");

function StatusBar() {
  return (
    <div className="absolute left-0 right-0 top-0 h-[34px] flex items-center justify-between px-[22px] font-['Lato',sans-serif] text-[11px] font-bold text-white">
      <span>9:41</span>
      <span className="flex items-center gap-[4px]">
        <svg width="14" height="9" viewBox="0 0 14 9" fill="white" aria-hidden="true"><rect x="0" y="6" width="2.5" height="3" rx="0.6" /><rect x="3.8" y="4" width="2.5" height="5" rx="0.6" /><rect x="7.6" y="2" width="2.5" height="7" rx="0.6" /><rect x="11.4" y="0" width="2.5" height="9" rx="0.6" /></svg>
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="9" rx="2.5" stroke="white" strokeOpacity="0.5" /><rect x="2" y="2" width="13" height="6" rx="1.4" fill="white" /><rect x="18.5" y="3.5" width="1.3" height="3" rx="0.6" fill="white" fillOpacity="0.5" /></svg>
      </span>
    </div>
  );
}

// A band of rotating colour along the screen edges. The ring mask keeps only the edge band; the blur on the
// wrapper softens it inwards, as on iOS. The screen's own rounded clip trims the outer edge. The phone is a top
// slice, so the band runs on below the cut and only the top and sides show.
function SiriEdgeGlowBand({ band, blur, opacity }: { band: number; blur: number; opacity: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ filter: blur ? `blur(${blur}px)` : undefined, opacity }}>
      <div
        className="absolute left-0 right-0 top-0 bottom-[-60px] overflow-hidden rounded-tl-[26px] rounded-tr-[26px]"
        style={{
          padding: band,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <motion.div
          className="absolute left-[-50%] top-[-50%] h-[200%] w-[200%]"
          style={{ background: `conic-gradient(from 0deg, ${SIRI_GLOW_COLOURS})` }}
          animate={{ rotate: 360 }}
          transition={{ duration: SIRI_GLOW_TURN_SECONDS, ease: "linear", repeat: Infinity }}
        />
      </div>
    </div>
  );
}

function SiriEdgeGlow() {
  return (
    <motion.div
      className="absolute inset-0 z-[25] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SiriEdgeGlowBand band={14} blur={12} opacity={0.9} />
      <SiriEdgeGlowBand band={4} blur={2} opacity={1} />
    </motion.div>
  );
}

// Multicolour waveform bars
function SiriWaveform({ active, height = 16 }: { active: boolean; height?: number }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height }}>
      {SIRI_COLOURS.map((colour, index) => (
        <motion.span
          key={colour}
          className="block w-[3px] rounded-[2px]"
          style={{ backgroundColor: colour }}
          animate={active ? { height: [height * 0.3, height, height * 0.45, height * 0.85, height * 0.3] } : { height: height * 0.3 }}
          transition={active ? { duration: 0.9, repeat: Infinity, delay: index * 0.12, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}

// Dynamic Island, then the dark Siri orb that drops from it and opens into the response panel
function SiriLayer({ phase }: { phase: Phase }) {
  const showOrb = phase === "listening";
  const showPanel = phase === "question" || phase === "reply";
  const siriActive = showOrb || showPanel;
  return (
    <>
      <div className="absolute left-1/2 top-[9px] h-[22px] w-[78px] -translate-x-1/2 rounded-[11px] bg-black z-20" />
      <AnimatePresence>{siriActive && <SiriEdgeGlow key="glow" />}</AnimatePresence>
      <AnimatePresence>
        {showOrb && (
          <motion.div
            key="orb"
            className="absolute left-1/2 top-[9px] z-30 flex h-[44px] w-[44px] -translate-x-1/2 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(28, 28, 30, 0.92)", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
            initial={{ y: -6, scale: 0.5 }}
            animate={{ y: 34, scale: 1 }}
            exit={{ y: -6, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <SiriWaveform active height={18} />
          </motion.div>
        )}
        {showPanel && (
          <motion.div
            key="panel"
            className="absolute left-[12px] right-[12px] top-[40px] z-30 rounded-[22px] px-[14px] py-[12px] flex flex-col gap-[8px] origin-top"
            style={{ backgroundColor: "rgba(28, 28, 30, 0.9)", boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.12)" }}
            initial={{ scale: 0.3, y: -24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.3, y: -24 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >
            <p className="font-['Lato',sans-serif] font-bold text-[13px] leading-[17px] text-white">{SIRI_QUESTION}</p>
            <div className="flex items-center justify-between gap-[8px] min-h-[18px]">
              {phase === "reply" ? (
                <p className="font-['Lato',sans-serif] text-[12px] leading-[16px] text-[#C7C7CC]">{SPOKEN_REPLY}</p>
              ) : (
                <span />
              )}
              <SiriWaveform active={phase === "reply"} height={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HomeScreen({ iconRef }: { iconRef: (element: HTMLDivElement | null) => void }) {
  return (
    <div className="absolute inset-0 z-10" style={{ backgroundColor: "#1C2C42" }}>
      <StatusBar />
      <div className="absolute left-[16px] right-[16px] top-[52px] grid grid-cols-4 gap-x-[12px] gap-y-[12px]">
        {HOME_APPS.map((app, index) => (
          <div key={app.label} className="flex flex-col items-center gap-[4px]">
            <div
              ref={index === REMINDERLY_INDEX ? iconRef : undefined}
              className="flex size-[46px] items-center justify-center rounded-[12px]"
              style={{ backgroundColor: app.tile }}
            >
              {app.glyph}
            </div>
            <span className="font-['Lato',sans-serif] text-[8.5px] leading-[10px] text-white whitespace-nowrap">{app.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingSiriPhone({
  isListsEnabled,
  settingsMenuEnabled,
  calendarEnabled,
}: {
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  calendarEnabled: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("home");
  const [cycle, setCycle] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const [iconElement, setIconElement] = useState<HTMLDivElement | null>(null);
  const [iconRect, setIconRect] = useState<{ left: number; top: number; width: number; height: number; screenWidth: number } | null>(null);

  useEffect(() => {
    const timers = PHASE_STARTS.map(([next, at]) => window.setTimeout(() => setPhase(next), at));
    timers.push(window.setTimeout(() => setHighlighted(true), 7500));
    timers.push(window.setTimeout(() => setHighlighted(false), 7500 + INSERT_HIGHLIGHT_MS));
    timers.push(window.setTimeout(() => {
      setPhase("home");
      setCycle((value) => value + 1);
    }, CYCLE_MS));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [cycle]);

  // Where the Reminderly icon sits, so the app can open from it
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer || !iconElement) return;
    const layerBox = layer.getBoundingClientRect();
    const iconBox = iconElement.getBoundingClientRect();
    const scale = layerBox.width / layer.offsetWidth || 1;
    setIconRect({
      left: (iconBox.left - layerBox.left) / scale,
      top: (iconBox.top - layerBox.top) / scale,
      width: iconBox.width / scale,
      height: iconBox.height / scale,
      screenWidth: layer.offsetWidth,
    });
  }, [iconElement, cycle]);

  const reached = (target: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target);
  const onHomeScreen = !reached("app");

  return (
    <TutorialPhoneShell
      activeMainTab="reminders"
      showMainTabBar={isListsEnabled}
      showHeaderMenu={false}
      filterRow={<TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />}
      overlay={
        <div ref={layerRef} className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {onHomeScreen && <HomeScreen iconRef={setIconElement} />}
          {phase === "launch" && iconRect && (
            // Reminderly opens from its icon: the app's blue grows to the full iPhone screen, most of which is below the
            // slice, so its lower part and bottom corners run out of view
            <motion.div
              className="absolute z-40 bg-[#4784F8]"
              initial={{ left: iconRect.left, top: iconRect.top, width: iconRect.width, height: iconRect.height, borderRadius: 12 }}
              animate={{ left: 0, top: 0, width: iconRect.screenWidth, height: iconRect.screenWidth * FULL_SCREEN_ASPECT, borderRadius: 26 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            />
          )}
          {onHomeScreen && <SiriLayer phase={phase} />}
        </div>
      }
    >
      <div className="content-stretch flex flex-col flex-1 min-h-0 items-center pt-[10px] px-[14px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full">
          <TutorialStaticReminderList
            key={`siri-list-${cycle}`}
            combineLaterSometime={settingsMenuEnabled}
            insertedReminder={reached("inserted") ? SIRI_REMINDER : null}
            insertedReminderHighlighted={highlighted}
          />
        </div>
      </div>
    </TutorialPhoneShell>
  );
}
