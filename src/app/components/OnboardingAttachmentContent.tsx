// Reminders tutorial page "Add an attachment" (docs/plans/onboarding-attachment-page.md). Shown while reminder
// attachments are available. The New reminder sheet slides up with a reminder typed, the paperclip is circled, the
// live Add an attachment overlay opens and "Choose a photo" is pressed, a simple mock photo grid (not the native
// picker) picks the holiday photo, and the photo attaches as the live thumbnail tile. Photos are flat-colour SVG
// drawings, hard edges only.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { SHEET_TOP, ThrobCircle, ThrobRing, TutorialNewReminderSheet, useRelativeRect } from "./OnboardingCreateReminderContent";
import {
  TUTORIAL_ATTENTION_SEQUENCE_DELAY,
  TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
  TUTORIAL_ATTENTION_THROB_DELAY,
  TUTORIAL_ATTENTION_THROB_DURATION,
  TUTORIAL_ATTENTION_THROB_TIMES,
  TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH,
  TutorialMiniOverlayShell,
} from "./OnboardingPage3Content";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialPhoneShell from "./TutorialPhoneShell";
import { TutorialRemindersFilterRow } from "./TutorialReminderFilters";
import TutorialStaticReminderList, { TUTORIAL_REMINDER_LIST_SCALE } from "./TutorialStaticReminderList";

const REMINDER_TEXT = "Print the holiday photo";
// Live overlays are scaled as on the other tutorial overlays (340pt card on a 393pt screen)
const OVERLAY_SCALE = TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH / 393;

type Phase = "idle" | "sheet-open" | "clip-throb" | "overlay" | "picker" | "attached";
// Time each phase starts, from the start of a cycle
const PHASE_STARTS: [Phase, number][] = [
  ["idle", 0],
  ["sheet-open", 1000],
  ["clip-throb", 1600],
  ["overlay", 1600 + TUTORIAL_ATTENTION_SEQUENCE_DELAY],
  ["picker", 1600 + TUTORIAL_ATTENTION_SEQUENCE_DELAY * 2],
  ["attached", 1600 + TUTORIAL_ATTENTION_SEQUENCE_DELAY * 3],
];
// The attached photo stays in view for 3000ms, then the cycle repeats
const CYCLE_MS = 1600 + TUTORIAL_ATTENTION_SEQUENCE_DELAY * 3 + 3000;
const PHASE_ORDER = PHASE_STARTS.map(([phase]) => phase);
// Sheet top to the text field's bottom edge (30 top padding, 45 header, 2 margin, 22 gap, 80 field), plus a 12px
// margin, in sheet units. On short phones the sheet stops higher so the paperclip and thumbnail stay in view
const SHEET_FIELD_BOTTOM = 30 + 45 + 2 + 22 + 80 + 12;

export function OnboardingAttachmentText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Add an attachment</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap the paperclip to add<br />a photo or file to your reminder</p>
      </div>
    </div>
  );
}

// Flat-colour photo drawings, cover-fitted like the live thumbnail
function Photo({ children, background }: { children: ReactNode; background: string }) {
  return (
    <svg className="block size-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" fill="none">
      <rect width="100" height="100" fill={background} />
      {children}
    </svg>
  );
}

function HolidayPhoto() {
  return (
    <Photo background="#8FD3F4">
      <circle cx="72" cy="26" r="12" fill="#FFD166" />
      <rect y="55" width="100" height="20" fill="#4784F8" />
      <rect y="75" width="100" height="25" fill="#F4D9A6" />
    </Photo>
  );
}

const PICKER_PHOTOS: { id: string; photo: ReactNode }[] = [
  { id: "holiday", photo: <HolidayPhoto /> },
  {
    id: "mountains",
    photo: (
      <Photo background="#DCEBFA">
        <polygon points="0,100 35,35 70,100" fill="#6C7A89" />
        <polygon points="35,100 70,25 100,70 100,100" fill="#1C2C42" />
        <polygon points="62,42 70,25 78,37" fill="#FFFFFF" />
      </Photo>
    ),
  },
  {
    id: "flower",
    photo: (
      <Photo background="#C8E6C9">
        <rect x="48" y="50" width="4" height="50" fill="#4CAF50" />
        <circle cx="50" cy="30" r="10" fill="#FF8A80" />
        <circle cx="38" cy="42" r="10" fill="#FF8A80" />
        <circle cx="62" cy="42" r="10" fill="#FF8A80" />
        <circle cx="44" cy="55" r="10" fill="#FF8A80" />
        <circle cx="56" cy="55" r="10" fill="#FF8A80" />
        <circle cx="50" cy="44" r="8" fill="#FFD166" />
      </Photo>
    ),
  },
  {
    id: "city",
    photo: (
      <Photo background="#FFB38A">
        <rect x="8" y="50" width="18" height="50" fill="#1C2C42" />
        <rect x="30" y="30" width="20" height="70" fill="#2E4A6B" />
        <rect x="54" y="45" width="16" height="55" fill="#1C2C42" />
        <rect x="74" y="25" width="20" height="75" fill="#2E4A6B" />
      </Photo>
    ),
  },
  {
    id: "hills",
    photo: (
      <Photo background="#BDE3FF">
        <circle cx="25" cy="110" r="50" fill="#7BC67E" />
        <circle cx="85" cy="115" r="55" fill="#5AA65E" />
      </Photo>
    ),
  },
  {
    id: "lake",
    photo: (
      <Photo background="#1C2C42">
        <circle cx="30" cy="28" r="10" fill="#F7F7F7" />
        <rect y="65" width="100" height="35" fill="#2E4A6B" />
      </Photo>
    ),
  },
];

// Live Add an attachment overlay (NewReminderOverlay), value for value: 340 wide, 32px corners, 35px top and
// bottom, 32px sides, 25px gap, title 20px dark blue bold, then three 50px blue pills 30px apart, 7px lower
function TutorialAttachmentOverlay({ highlightChoosePhoto }: { highlightChoosePhoto: boolean }) {
  const labels = ["Choose a photo", "Take a photo", "Choose a file"];
  return (
    <TutorialMiniOverlayShell>
      <div className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] outline-none">
        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
          <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>Add an attachment</p>
        </div>
        <div className="content-stretch flex flex-col gap-[30px] items-start mt-[7px] relative shrink-0 w-full">
          {labels.map((label, index) => (
            <div key={label} className="bg-[#4784f8] h-[50px] relative rounded-[100px] shrink-0 w-full">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                    <p className="leading-[normal]">{label}</p>
                  </div>
                </div>
              </div>
              {index === 0 && highlightChoosePhoto && (
                // Same on-screen ring as the New reminder button ring (4px gap, 3px stroke), drawn in card units
                <motion.div
                  className="absolute z-10 pointer-events-none"
                  style={{
                    inset: -4 / OVERLAY_SCALE,
                    borderRadius: 100,
                    border: `${3 / OVERLAY_SCALE}px solid #4784F8`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0] }}
                  transition={{ duration: TUTORIAL_ATTENTION_THROB_DURATION, delay: TUTORIAL_ATTENTION_THROB_DELAY, times: TUTORIAL_ATTENTION_THROB_TIMES, ease: "easeInOut" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </TutorialMiniOverlayShell>
  );
}

// Simple mock photo grid, not the native picker: a sheet with a title and a 3-column grid of photos
function TutorialPhotoGrid({ setChosenElement }: { setChosenElement: (element: HTMLDivElement | null) => void }) {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full">
      <div className="flex flex-col gap-[22px] pt-[30px] px-[24px] w-full">
        <div className="flex items-center justify-center w-full h-[45px] mb-[2px]">
          <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">Photos</span>
        </div>
        <div className="grid grid-cols-3 gap-[6px] w-full">
          {PICKER_PHOTOS.map(({ id, photo }) => (
            <div key={id} ref={id === "holiday" ? setChosenElement : undefined} className="aspect-square rounded-[6px] overflow-hidden">
              {photo}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Scaled sheet slot, as the New reminder sheet sits in the tutorial phone
function ScaledSheet({ motionKey, zIndex, top, setContainer, children }: { motionKey: string; zIndex: number; top: number; setContainer: (element: HTMLDivElement | null) => void; children: ReactNode }) {
  const scale = TUTORIAL_REMINDER_LIST_SCALE;
  return (
    <motion.div
      key={motionKey}
      initial={{ y: "100%" }}
      animate={{ y: 0, top }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="absolute left-0 right-0 mx-auto w-full"
      style={{ bottom: 0, zIndex }}
    >
      <div
        ref={setContainer}
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
        {children}
      </div>
    </motion.div>
  );
}

export default function OnboardingAttachmentPhone({
  isListsEnabled,
  settingsMenuEnabled,
  calendarEnabled,
  showRepeats,
}: {
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  calendarEnabled: boolean;
  showRepeats: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycle, setCycle] = useState(0);

  // Phase sequence; every timer is cleared when the page changes or the cycle restarts
  useEffect(() => {
    const timers = PHASE_STARTS.map(([nextPhase, start]) => window.setTimeout(() => setPhase(nextPhase), start));
    timers.push(window.setTimeout(() => setCycle((value) => value + 1), CYCLE_MS));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [cycle]);

  const reached = (target: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target);
  const scale = TUTORIAL_REMINDER_LIST_SCALE;

  const [screenElement, setScreenElement] = useState<HTMLDivElement | null>(null);
  const [sheetTop, setSheetTop] = useState(SHEET_TOP);
  useLayoutEffect(() => {
    if (!screenElement) return;
    const update = () => setSheetTop(Math.max(0, Math.min(SHEET_TOP, screenElement.clientHeight - SHEET_FIELD_BOTTOM * scale)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(screenElement);
    return () => observer.disconnect();
  }, [screenElement, scale]);

  const [sheetContainer, setSheetContainer] = useState<HTMLDivElement | null>(null);
  const [clipElement, setClipElement] = useState<HTMLDivElement | null>(null);
  const clipRect = useRelativeRect(clipElement, sheetContainer, scale, phase);
  const [pickerContainer, setPickerContainer] = useState<HTMLDivElement | null>(null);
  const [chosenElement, setChosenElement] = useState<HTMLDivElement | null>(null);
  const chosenRect = useRelativeRect(chosenElement, pickerContainer, scale, phase);

  const overlay = (
    <>
      <div ref={setScreenElement} className="absolute inset-0 pointer-events-none" />
      <AnimatePresence>
        {reached("sheet-open") && (
          <ScaledSheet motionKey={`attachment-sheet-${cycle}`} zIndex={50} top={sheetTop} setContainer={setSheetContainer}>
            <TutorialNewReminderSheet
              text={REMINDER_TEXT}
              tokenRange={null}
              dateLabel={null}
              timeLabel={null}
              showRepeats={showRepeats}
              setTickElement={() => {}}
              setTokenElement={() => {}}
              setDateToggleElement={() => {}}
              setTimeToggleElement={() => {}}
              showAttachButton
              setAttachButtonElement={setClipElement}
              attachedImage={reached("attached") ? <HolidayPhoto /> : null}
              submitActive={false}
            />
            {phase === "clip-throb" && <ThrobCircle rect={clipRect} size={TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / scale} strokeWidth={3 / scale} />}
          </ScaledSheet>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {phase === "picker" && (
          <ScaledSheet motionKey={`attachment-picker-${cycle}`} zIndex={55} top={sheetTop} setContainer={setPickerContainer}>
            <TutorialPhotoGrid setChosenElement={setChosenElement} />
            <ThrobRing rect={chosenRect} padding={6} radius={10} strokeWidth={3 / scale} />
          </ScaledSheet>
        )}
      </AnimatePresence>
      {phase === "overlay" && <TutorialAttachmentOverlay highlightChoosePhoto />}
    </>
  );

  return (
    <TutorialPhoneShell
      activeMainTab="reminders"
      showMainTabBar={isListsEnabled}
      showHeaderMenu={false}
      overlay={overlay}
      filterRow={<TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />}
    >
      <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[14px] items-center pt-[10px] px-[14px] pb-[14px] relative w-full">
        <div className="flex-[1_0_0] min-h-px min-w-px w-full relative overflow-hidden">
          <TutorialStaticReminderList combineLaterSometime={settingsMenuEnabled} />
        </div>
      </div>
    </TutorialPhoneShell>
  );
}
