// Reminders tutorial pages "Create a reminder" and "Type it naturally" (docs/plans/onboarding-gaps.md, section 3).
// Both animate the New reminder sheet inside the tutorial phone: manual mode highlights the in-situ New reminder button,
// then turns on the Date and Time toggles (today at 9pm); NLC mode types a phrase the live parser recognises, so the demo matches the user's settings.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { formatSelectedDate, formatSelectedTime } from "@/imports/NewReminderOverlay";
import reminderOverlaySvgPaths from "@/imports/svg-k8owpv3rm6";
import buttonSvgPaths from "@/imports/svg-b2700o3wr8";
import type { NlcTutorialDemo } from "../utils/tutorial-nlc-demo";
import {
  TUTORIAL_ATTENTION_SEQUENCE_DELAY,
  TUTORIAL_ATTENTION_THROB_DELAY,
  TUTORIAL_ATTENTION_THROB_DURATION,
  TUTORIAL_ATTENTION_THROB_TIMES,
} from "./OnboardingPage3Content";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialPhoneShell from "./TutorialPhoneShell";
import { TutorialRemindersFilterRow } from "./TutorialReminderFilters";
import TutorialStaticReminderList, { TUTORIAL_REMINDER_LIST_SCALE, type TutorialReminder } from "./TutorialStaticReminderList";

const SHEET_TOP = 11 + 5.026 + 65 - 2;
const SHEET_OPEN_DELAY = 1000;
const TYPING_START_DELAY = 600;
const TYPING_STEP_DELAY = 80;
const STEP_PAUSE = 750;
const NLC_AUTO_APPLY_DELAY = 900;
const TOGGLE_TAP_DURATION = 0.8;
const INSERT_DELAY = 500;
const INSERT_HIGHLIGHT_MS = 1000;
const RECYCLE_DELAY = 2000;
const NEW_REMINDER_ID = "tutorial-new-reminder";

const MANUAL_TEXT = "Take the bins out";
// Tutorial list dates are fixed (Monday 11 August 2025, as in TutorialStaticReminderList); the reminder is set for
// today at 9pm (as "tonight" on the Type it naturally page) and inserted at the top of the list so it is easy to spot
const MANUAL_REMINDER: TutorialReminder = {
  id: NEW_REMINDER_ID,
  title: MANUAL_TEXT,
  category: "today",
  circleColor: "#00AFEE",
  schedule: { kind: "scheduled", date: "2025-08-11", time: "21:00" },
};
const MANUAL_DATE_LABEL = "Today";
const MANUAL_TIME_LABEL = formatSelectedTime({ hour: 21, minute: 0 });
// Tick highlight: a ring with a clear gap around the 45px tick, so it reads against the blue button
const TICK_RING_PADDING = 10;
// Page 2 opens on the bottom of a full mini iPhone (the in-situ New reminder button), then pans up to the usual slice
const FULL_PHONE_ASPECT = 2.05;
const PAN_DURATION = 0.9;
const FIRST_BUTTON_THROB_DELAY = 400;
const SHEET_OPEN_AFTER_PAN = 200;

type Phase =
  | "idle"
  | "button-throb"
  | "sheet-open"
  | "typing"
  | "date-tap"
  | "date-on"
  | "time-tap"
  | "time-on"
  | "token-tap"
  | "tick-throb"
  | "closing"
  | "inserted";

type Rect = { left: number; top: number; width: number; height: number };

export type CreateReminderMode = { kind: "manual" } | { kind: "nlc"; demo: NlcTutorialDemo; autoMode: boolean };

export function OnboardingCreateReminderText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Create a reminder</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap New reminder, type it in<br />and set when it&apos;s due</p>
      </div>
    </div>
  );
}

export function OnboardingTypeNaturallyText({ autoMode }: { autoMode: boolean }) {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Type it naturally</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">
          When Reminderly spots a time or date, it<br />
          {autoMode
            ? <>turns the text <span className="text-[#4784F8]">blue</span> and sets it for you</>
            : <>turns the text <span className="text-[#4784F8]">blue</span> - just tap it to set it</>}
        </p>
      </div>
    </div>
  );
}

// Measures target relative to container, in the container's unscaled units
function useRelativeRect(target: HTMLElement | null, container: HTMLElement | null, scale: number, key: unknown): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!target || !container) {
      setRect(null);
      return;
    }
    const update = () => {
      const parentRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setRect({
        left: (targetRect.left - parentRect.left) / scale,
        top: (targetRect.top - parentRect.top) / scale,
        width: targetRect.width / scale,
        height: targetRect.height / scale,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [target, container, scale, key]);
  return rect;
}

// Attention ring, same pulses as the other tutorial pages; quick is a single tap pulse for toggles
function ThrobRing({ rect, padding, radius, strokeWidth = 3, quick = false }: { rect: Rect | null; padding: number; radius: number; strokeWidth?: number; quick?: boolean }) {
  if (!rect) return null;
  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      style={{
        left: rect.left - padding,
        top: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: radius,
        border: `${strokeWidth}px solid #4784F8`,
      }}
      initial={{ opacity: 0 }}
      animate={quick ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
      transition={quick
        ? { duration: TOGGLE_TAP_DURATION, ease: "easeInOut" }
        : { duration: TUTORIAL_ATTENTION_THROB_DURATION, delay: TUTORIAL_ATTENTION_THROB_DELAY, times: TUTORIAL_ATTENTION_THROB_TIMES, ease: "easeInOut" }}
    />
  );
}

function ScheduleIcon({ color, maskId }: { color: string; maskId: string }) {
  return (
    <div className="relative shrink-0 size-[25px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
        <mask fill="white" id={maskId}>
          <path d={reminderOverlaySvgPaths.p37c4f500} />
        </mask>
        <path d={reminderOverlaySvgPaths.pde59c80} fill={color} mask={`url(#${maskId})`} />
      </svg>
    </div>
  );
}

// Mirrors the live New reminder option row: dark label when on, grey when off, blue value
function OptionRow({ label, value, isOn, icon, toggleRef }: { label: string; value: string | null; isOn: boolean; icon: (color: string) => React.ReactNode; toggleRef?: (element: HTMLDivElement | null) => void }) {
  const color = isOn ? "#1C2C42" : "#B7B7B7";
  return (
    <div className="content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full">
      <div className="content-stretch flex gap-[16px] items-center relative min-w-0 flex-1">
        {icon(color)}
        <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[17px] min-w-[68px]" style={{ color }}>{label}</p>
        {isOn && value && (
          <p className="font-['Lato',sans-serif] font-[600] leading-[23px] not-italic relative text-[17px] text-[#4784F8] ml-[4px] truncate">{value}</p>
        )}
      </div>
      <div ref={toggleRef} className="h-[30px] relative shrink-0 w-[56px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
          <rect fill={isOn ? "#4784F8" : "#D9D9D9"} height="30" rx="15" width="56" />
          <circle cx={isOn ? "41" : "15"} cy="15" fill="white" r="11.25" style={{ transition: "cx 0.2s ease" }} />
        </svg>
      </div>
    </div>
  );
}

function TutorialNewReminderSheet({
  text,
  tokenRange,
  dateLabel,
  timeLabel,
  showRepeats,
  setTickElement,
  setTokenElement,
  setDateToggleElement,
  setTimeToggleElement,
}: {
  text: string;
  tokenRange: { start: number; end: number } | null;
  dateLabel: string | null;
  timeLabel: string | null;
  showRepeats: boolean;
  setTickElement: (element: HTMLDivElement | null) => void;
  setTokenElement: (element: HTMLSpanElement | null) => void;
  setDateToggleElement: (element: HTMLDivElement | null) => void;
  setTimeToggleElement: (element: HTMLDivElement | null) => void;
}) {
  const tickActive = text.trim().length > 0;
  const repeatsColor = "#D9D9D9";
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full">
      <div className="relative shrink-0 w-full h-full flex flex-col">
        <div className="content-stretch flex flex-col gap-[22px] items-start pt-[30px] px-[24px] relative w-full shrink-0">
          <div className="flex items-center justify-between w-full h-[45px] mb-[2px]">
            <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">New reminder</span>
            <div ref={setTickElement} className="flex items-center justify-center relative shrink-0 size-[45px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="2.5 2.5 45 45">
                <rect fill={tickActive ? "#4784F8" : "#D9D9D9"} x="2.5" y="2.5" height="45" rx="22.5" width="45" />
                <path d={reminderOverlaySvgPaths.p1635b2f0} fill={tickActive ? "#F0FAFE" : "white"} />
              </svg>
            </div>
          </div>
          <div className="relative bg-[#f7f7f7] rounded-[10px] shrink-0 w-full" style={{ height: 80 }}>
            <div className="w-full h-full p-[12px] font-['Lato',sans-serif] text-[17px]" style={{ lineHeight: "normal", whiteSpace: "pre-wrap" }}>
              {text.length === 0 ? (
                <span className="font-medium text-[#BABABA]">Don&apos;t forget...</span>
              ) : tokenRange ? (
                <span className="text-[#1C2C42]">
                  {text.slice(0, tokenRange.start)}
                  <span ref={setTokenElement} style={{ color: "#4784F8" }}>{text.slice(tokenRange.start, tokenRange.end)}</span>
                  {text.slice(tokenRange.end)}
                </span>
              ) : (
                <span className="text-[#1C2C42]">{text}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col px-[24px] pt-[24px] pb-[24px]">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
            <OptionRow label="Date" value={dateLabel} isOn={dateLabel != null} toggleRef={setDateToggleElement} icon={(color) => <ScheduleIcon color={color} maskId="tut-new-date-mask" />} />
            <OptionRow label="Time" value={timeLabel} isOn={timeLabel != null} toggleRef={setTimeToggleElement} icon={(color) => <ScheduleIcon color={color} maskId="tut-new-time-mask" />} />
            {showRepeats && (
              <OptionRow
                label="Repeats"
                value={null}
                isOn={false}
                icon={() => (
                  <div className="h-[25.071px] relative shrink-0 w-[25px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0003 25.0708">
                      <path d={reminderOverlaySvgPaths.p19a7b000} fill={repeatsColor} />
                      <path d={reminderOverlaySvgPaths.p9f3c880} fill={repeatsColor} />
                      <path d={reminderOverlaySvgPaths.pf2d2300} fill={repeatsColor} />
                    </svg>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Scaled copy of the app's New reminder button (the other tutorial pages leave it out)
function TutorialNewReminderButton({ buttonRef }: { buttonRef?: (element: HTMLDivElement | null) => void }) {
  return (
    <div ref={buttonRef} className="bg-[#4784f8] content-stretch flex gap-[11.167px] h-[41.876px] items-center justify-center px-[20.938px] relative rounded-[69.794px] shrink-0 w-full">
      <div className="relative shrink-0 size-[10.469px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.4688 10.4688">
          <path d={buttonSvgPaths.paece300} fill="white" />
        </svg>
      </div>
      <p className="font-['Lato',sans-serif] font-bold leading-[normal] text-[13.959px] text-white whitespace-nowrap">New reminder</p>
    </div>
  );
}

/** Insert position and row data for the reminder saved in NLC mode, using the tutorial's fixed dates.
 * A timed reminder ("tonight", 9pm) goes to the top: the list's Today reminders are at 9:30pm and 10pm. */
function getNlcInsertedReminder(demo: NlcTutorialDemo): { reminder: TutorialReminder; afterId: string | undefined } {
  const title = demo.text.slice(0, demo.token.start).trim();
  if (demo.time) {
    const time = `${String(demo.time.hour).padStart(2, "0")}:${String(demo.time.minute).padStart(2, "0")}`;
    return {
      reminder: { id: NEW_REMINDER_ID, title, category: "today", circleColor: "#00AFEE", schedule: { kind: "scheduled", date: "2025-08-11", time } },
      afterId: undefined,
    };
  }
  return {
    reminder: { id: NEW_REMINDER_ID, title, category: "thisWeek", circleColor: "#E466FD", schedule: { kind: "scheduled", date: "2025-08-12" } },
    afterId: "this-week",
  };
}

export default function OnboardingCreateReminderPhone({
  mode,
  isListsEnabled,
  settingsMenuEnabled,
  calendarEnabled,
  showRepeats,
}: {
  mode: CreateReminderMode;
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  calendarEnabled: boolean;
  showRepeats: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedCount, setTypedCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [showPhoneBottom, setShowPhoneBottom] = useState(true);
  const isNlc = mode.kind === "nlc";
  const nlcDemo = mode.kind === "nlc" ? mode.demo : null;
  const autoMode = mode.kind === "nlc" ? mode.autoMode : true;
  const fullText = nlcDemo ? nlcDemo.text : MANUAL_TEXT;

  // Phase sequence; every timer is cleared when the page changes or the cycle restarts
  useEffect(() => {
    const timers: number[] = [];
    let elapsed = 0;
    const at = (delay: number, action: () => void) => {
      elapsed += delay;
      timers.push(window.setTimeout(action, elapsed));
    };

    setPhase("idle");
    setTypedCount(0);
    if (isNlc) {
      at(SHEET_OPEN_DELAY, () => setPhase("sheet-open"));
    } else {
      // Pan down to the phone's bottom (instant on the first cycle) and pulse the button, then pan up to the
      // usual slice and open the sheet
      setShowPhoneBottom(true);
      at(cycle === 0 ? FIRST_BUTTON_THROB_DELAY : PAN_DURATION * 1000 + 300, () => setPhase("button-throb"));
      at(TUTORIAL_ATTENTION_SEQUENCE_DELAY, () => setShowPhoneBottom(false));
      at(PAN_DURATION * 1000 + SHEET_OPEN_AFTER_PAN, () => setPhase("sheet-open"));
    }
    at(TYPING_START_DELAY, () => setPhase("typing"));
    for (let i = 1; i <= fullText.length; i += 1) {
      at(TYPING_STEP_DELAY, () => setTypedCount(i));
    }
    if (nlcDemo) {
      // The recognised word is highlighted, then Date and Time turn on one after the other. Tap mode waits for the
      // highlight (the tap); Apply as you type sets them while it shows, as the app does
      at(STEP_PAUSE, () => setPhase("token-tap"));
      at(autoMode ? NLC_AUTO_APPLY_DELAY : TUTORIAL_ATTENTION_SEQUENCE_DELAY, () => setPhase("date-on"));
      if (nlcDemo.time) at(STEP_PAUSE, () => setPhase("time-on"));
    } else {
      at(STEP_PAUSE, () => setPhase("date-tap"));
      at(TOGGLE_TAP_DURATION * 1000, () => setPhase("date-on"));
      at(STEP_PAUSE, () => setPhase("time-tap"));
      at(TOGGLE_TAP_DURATION * 1000, () => setPhase("time-on"));
    }
    at(STEP_PAUSE, () => setPhase("tick-throb"));
    at(TUTORIAL_ATTENTION_SEQUENCE_DELAY, () => setPhase("closing"));
    at(INSERT_DELAY, () => setPhase("inserted"));
    at(INSERT_HIGHLIGHT_MS + RECYCLE_DELAY, () => setCycle((value) => value + 1));

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [cycle, isNlc, nlcDemo, autoMode, fullText]);

  const phaseOrder: Phase[] = ["idle", "button-throb", "sheet-open", "typing", "token-tap", "date-tap", "date-on", "time-tap", "time-on", "tick-throb", "closing", "inserted"];
  const reached = (target: Phase) => phaseOrder.indexOf(phase) >= phaseOrder.indexOf(target);
  const sheetVisible = reached("sheet-open") && !reached("closing");
  const text = fullText.slice(0, typedCount);
  const tokenRange = nlcDemo && typedCount >= nlcDemo.token.end ? { start: nlcDemo.token.start, end: nlcDemo.token.end } : null;
  const dateLabel = reached("date-on") ? (nlcDemo ? formatSelectedDate(nlcDemo.date) : MANUAL_DATE_LABEL) : null;
  const timeLabel = reached("time-on") ? (nlcDemo ? formatSelectedTime(nlcDemo.time) : MANUAL_TIME_LABEL) : null;
  const inserted = nlcDemo ? getNlcInsertedReminder(nlcDemo) : { reminder: MANUAL_REMINDER, afterId: undefined };

  const [insertHighlighted, setInsertHighlighted] = useState(false);

  useEffect(() => {
    if (phase !== "inserted") {
      setInsertHighlighted(false);
      return;
    }
    setInsertHighlighted(true);
    const timer = window.setTimeout(() => setInsertHighlighted(false), INSERT_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // The mini list shows only the first rows: scroll it up so the saved reminder is visible
  const [listViewport, setListViewport] = useState<HTMLDivElement | null>(null);
  const [listOffset, setListOffset] = useState(0);
  const isInserted = reached("inserted");
  useLayoutEffect(() => {
    if (!isInserted || !listViewport) {
      setListOffset(0);
      return;
    }
    const row = listViewport.querySelector('[data-tutorial-inserted="true"]');
    if (!(row instanceof HTMLElement)) return;
    const overflow = row.getBoundingClientRect().bottom - listViewport.getBoundingClientRect().bottom + 8;
    setListOffset(overflow > 0 ? -overflow : 0);
  }, [isInserted, listViewport]);

  // Full phone height for the pan: the slot shows the top slice, the extra height holds the bottom with the button
  const [phoneSlot, setPhoneSlot] = useState<HTMLDivElement | null>(null);
  const [phoneExtraHeight, setPhoneExtraHeight] = useState(0);
  useLayoutEffect(() => {
    if (isNlc || !phoneSlot) return;
    const update = () => setPhoneExtraHeight(Math.max(0, Math.round(phoneSlot.clientWidth * FULL_PHONE_ASPECT - phoneSlot.clientHeight)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(phoneSlot);
    return () => observer.disconnect();
  }, [isNlc, phoneSlot]);

  // Throb targets
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const [buttonElement, setButtonElement] = useState<HTMLDivElement | null>(null);
  const buttonRect = useRelativeRect(buttonElement, bodyElement, 1, phase);
  const [sheetContainer, setSheetContainer] = useState<HTMLDivElement | null>(null);
  const [tickElement, setTickElement] = useState<HTMLDivElement | null>(null);
  const [tokenElement, setTokenElement] = useState<HTMLSpanElement | null>(null);
  const [dateToggleElement, setDateToggleElement] = useState<HTMLDivElement | null>(null);
  const [timeToggleElement, setTimeToggleElement] = useState<HTMLDivElement | null>(null);
  const scale = TUTORIAL_REMINDER_LIST_SCALE;
  const tickRect = useRelativeRect(tickElement, sheetContainer, scale, phase);
  const tokenRect = useRelativeRect(tokenElement, sheetContainer, scale, phase);
  const dateToggleRect = useRelativeRect(dateToggleElement, sheetContainer, scale, phase);
  const timeToggleRect = useRelativeRect(timeToggleElement, sheetContainer, scale, phase);

  const overlay = (
    <AnimatePresence>
      {sheetVisible && (
        <motion.div
          key={`new-reminder-sheet-${cycle}`}
          initial={{ y: "100%" }}
          animate={{ y: 0, top: SHEET_TOP }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute left-0 right-0 z-50 mx-auto w-full"
          style={{ bottom: 0 }}
        >
          <div
            ref={setSheetContainer}
            className="bg-white relative rounded-tl-[15px] rounded-tr-[15px]"
            style={{
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              left: "50%",
              translate: "-50% 0",
            }}
          >
            <TutorialNewReminderSheet
              text={text}
              tokenRange={tokenRange}
              dateLabel={dateLabel}
              timeLabel={timeLabel}
              showRepeats={showRepeats}
              setTickElement={setTickElement}
              setTokenElement={setTokenElement}
              setDateToggleElement={setDateToggleElement}
              setTimeToggleElement={setTimeToggleElement}
            />
            {isNlc && reached("token-tap") && !reached("tick-throb") && <ThrobRing key="token" rect={tokenRect} padding={6} radius={10} strokeWidth={3 / scale} />}
            {phase === "date-tap" && <ThrobRing key="date" rect={dateToggleRect} padding={6} radius={21} quick />}
            {phase === "time-tap" && <ThrobRing key="time" rect={timeToggleRect} padding={6} radius={21} quick />}
            {phase === "tick-throb" && <ThrobRing key="tick" rect={tickRect} padding={TICK_RING_PADDING} radius={99} strokeWidth={3 / scale} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const phone = (
    <TutorialPhoneShell
      activeMainTab="reminders"
      showMainTabBar={isListsEnabled}
      showHeaderMenu={false}
      overlay={overlay}
      showBottomBezel={!isNlc}
      filterRow={<TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />}
    >
    <div ref={setBodyElement} className={`content-stretch flex flex-col flex-1 min-h-0 gap-[14px] items-center pt-[10px] px-[14px] relative w-full ${isNlc ? "pb-[14px]" : "pb-[22px]"}`}>
      <div ref={setListViewport} className="flex-[1_0_0] min-h-px min-w-px w-full relative overflow-hidden">
        <motion.div animate={{ y: listOffset }} transition={{ duration: 0.3, ease: "easeInOut" }}>
          <TutorialStaticReminderList
            key={`create-reminder-list-${cycle}`}
            combineLaterSometime={settingsMenuEnabled}
            insertedReminder={reached("inserted") ? inserted.reminder : null}
            insertedReminderAfterId={inserted.afterId}
            insertedReminderHighlighted={insertHighlighted}
          />
        </motion.div>
      </div>
      {!isNlc && <TutorialNewReminderButton buttonRef={setButtonElement} />}
      {phase === "button-throb" && <ThrobRing rect={buttonRect} padding={4} radius={30} />}
    </div>
    </TutorialPhoneShell>
  );

  if (isNlc) return phone;

  return (
    <div ref={setPhoneSlot} className="relative shrink-0 h-full w-full max-w-[308px] overflow-hidden">
      <motion.div
        className="w-full"
        style={{ height: `calc(100% + ${phoneExtraHeight}px)` }}
        initial={false}
        animate={{ y: showPhoneBottom ? -phoneExtraHeight : 0 }}
        transition={cycle === 0 && phase === "idle" ? { duration: 0 } : { duration: PAN_DURATION, ease: "easeInOut" }}
      >
        {phone}
      </motion.div>
    </div>
  );
}
