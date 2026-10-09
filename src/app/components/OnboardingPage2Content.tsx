import svgPaths from "@/imports/svg-b2700o3wr8";
import doneSvgPaths from "@/imports/svg-d69hgq55o6";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";
import { TUTORIAL_FILTER_RECYCLE_DELAY, TUTORIAL_FILTER_STEP_DELAY, type TutorialFilterKey } from "./TutorialReminderFilters";

function Frame3() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <div className={TUTORIAL_TITLE_CLASSNAME}>
        <p className="css-ew64yg leading-[normal]">Filter your reminders</p>
      </div>
    </div>
  );
}

export function OnboardingPage2Text() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <Frame3 />
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap a filter to narrow things down.<br />De-select it to bring them all back</p>
      </div>
    </div>
  );
}

const PAGE_2_FILTER_LOOP_SEQUENCE: Array<TutorialFilterKey | undefined> = [
  undefined,
  "today",
  "thisWeek",
  "later",
  "sometime",
  undefined,
];
export function useOnboardingPage2ActiveFilter(enabled: boolean, skipSometime = false) {
  const [activeFilter, setActiveFilter] = useState<TutorialFilterKey | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setActiveFilter(undefined);
      return;
    }

    let timeoutId: number | null = null;
    let sequenceIndex = 0;
    // Settings menu on: no Sometime filter to illustrate
    const sequence = skipSometime ? PAGE_2_FILTER_LOOP_SEQUENCE.filter((key) => key !== "sometime") : PAGE_2_FILTER_LOOP_SEQUENCE;

    setActiveFilter(sequence[0]);

    const scheduleNext = () => {
      const isRecycleDelay = sequenceIndex === sequence.length - 1;
      timeoutId = window.setTimeout(() => {
        sequenceIndex = isRecycleDelay ? 1 : sequenceIndex + 1;
        setActiveFilter(sequence[sequenceIndex]);
        scheduleNext();
      }, isRecycleDelay ? TUTORIAL_FILTER_RECYCLE_DELAY : TUTORIAL_FILTER_STEP_DELAY);
    };

    scheduleNext();

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, skipSometime]);

  return activeFilter;
}

function UndoneTickBlue() {
  return (
    <div className="relative shrink-0 size-[17.403px]" data-name="Tick box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4033 17.4033">
        <circle cx="8.70166" cy="8.70166" fill="var(--fill-0, white)" r="8.00552" stroke="var(--stroke-0, #00AFEE)" strokeWidth="1.39227" />
      </svg>
    </div>
  );
}

function UndoneTickPink() {
  return (
    <div className="relative shrink-0 size-[17.403px]" data-name="Tick box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4033 17.4033">
        <circle cx="8.70166" cy="8.70166" fill="var(--fill-0, white)" r="8.00552" stroke="var(--stroke-0, #DF4DFC)" strokeWidth="1.39227" />
      </svg>
    </div>
  );
}

function UndoneTickOrange() {
  return (
    <div className="relative shrink-0 size-[17.403px]" data-name="Tick box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4033 17.4033">
        <circle cx="8.70166" cy="8.70166" fill="var(--fill-0, white)" r="8.00552" stroke="var(--stroke-0, #FAA429)" strokeWidth="1.39227" />
      </svg>
    </div>
  );
}

function UndoneTickGrey() {
  return (
    <div className="relative shrink-0 size-[17.403px]" data-name="Tick box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4033 17.4033">
        <circle cx="8.70166" cy="8.70166" fill="var(--fill-0, white)" r="8.00552" stroke="var(--stroke-0, #939393)" strokeWidth="1.39227" />
      </svg>
    </div>
  );
}

function DoneTickBlue() {
  return (
    <div className="relative shrink-0 size-[17.4px]" data-name="Done tick">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4 17.4">
        <g id="Done tick">
          <rect fill="var(--fill-0, #4784F8)" height="17.4" rx="8.7" width="17.4" />
          <path d={doneSvgPaths.p33bb1d80} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function DoneTickPink() {
  return (
    <div className="relative shrink-0 size-[17.4px]" data-name="Done tick">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4 17.4">
        <g id="Done tick">
          <rect fill="var(--fill-0, #4784F8)" height="17.4" rx="8.7" width="17.4" />
          <path d={doneSvgPaths.p33bb1d80} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function DoneTickOrange() {
  return (
    <div className="relative shrink-0 size-[17.4px]" data-name="Done tick">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4 17.4">
        <g id="Done tick">
          <rect fill="var(--fill-0, #4784F8)" height="17.4" rx="8.7" width="17.4" />
          <path d={doneSvgPaths.p33bb1d80} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function DoneTickGrey() {
  return (
    <div className="relative shrink-0 size-[17.4px]" data-name="Done tick">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.4 17.4">
        <g id="Done tick">
          <rect fill="var(--fill-0, #4784F8)" height="17.4" rx="8.7" width="17.4" />
          <path d={doneSvgPaths.p33bb1d80} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function ReminderList({ animationKey }: { animationKey: number }) {
  const [doneStates, setDoneStates] = useState([false, false, false, false]);
  const [showDoneText, setShowDoneText] = useState([false, false, false, false]);

  useEffect(() => {
    setDoneStates([false, false, false, false]);
    setShowDoneText([false, false, false, false]);

    const timers = [
      setTimeout(() => setDoneStates([true, false, false, false]), 700),
      setTimeout(() => setDoneStates([true, true, false, false]), 1100),
      setTimeout(() => setDoneStates([true, true, true, false]), 1500),
      setTimeout(() => setDoneStates([true, true, true, true]), 1900),
      setTimeout(() => setShowDoneText([true, false, false, false]), 2500),
      setTimeout(() => setShowDoneText([true, true, false, false]), 2900),
      setTimeout(() => setShowDoneText([true, true, true, false]), 3300),
      setTimeout(() => setShowDoneText([true, true, true, true]), 3700),
      setTimeout(() => {
        setDoneStates([false, false, false, false]);
        setShowDoneText([false, false, false, false]);
      }, 5700),
      setTimeout(() => setDoneStates([true, false, false, false]), 6400),
      setTimeout(() => setDoneStates([true, true, false, false]), 6800),
      setTimeout(() => setDoneStates([true, true, true, false]), 7200),
      setTimeout(() => setDoneStates([true, true, true, true]), 7600),
      setTimeout(() => setShowDoneText([true, false, false, false]), 8000),
      setTimeout(() => setShowDoneText([true, true, false, false]), 8400),
      setTimeout(() => setShowDoneText([true, true, true, false]), 8800),
      setTimeout(() => setShowDoneText([true, true, true, true]), 9200),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [animationKey]);

  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full" data-name="Reminder list">
      <div className="content-stretch flex flex-col gap-[17.5px] items-start overflow-clip relative rounded-[6.961px] size-full">
        <div className="relative rounded-[69.613px] shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[0.696px] py-0 relative w-full">
              <div className="flex-[1_0_0] min-h-px min-w-px relative">
                <div className="flex flex-row items-start size-full">
                  <div className="content-stretch flex gap-[11.138px] items-start pl-0 pr-[11.138px] py-0 relative w-full">
                    <div style={{ marginTop: '2px' }}>{doneStates[0] ? <DoneTickBlue /> : <UndoneTickBlue />}</div>
                    <div
                      className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-center min-h-px min-w-px not-italic overflow-hidden relative text-[#4784F8] text-[11.834px] ${doneStates[0] ? 'line-through' : ''}`}
                      style={{ gap: '2px' }}
                    >
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap">Pick the milk up</p>
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '9.4px', fontWeight: 600, fontFamily: "'Lato', sans-serif", color: doneStates[0] ? '#4784F8' : '#BABABA' }}>Today at 2:00 PM</p>
                    </div>
                    {showDoneText[0] && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="css-g0mm18 flex flex-col font-['Lato'] font-bold justify-center leading-[0] italic overflow-hidden relative shrink-0 text-[#4784F8] text-[11.834px] text-ellipsis text-right"
                      >
                        <p className="css-ew64yg leading-[normal] overflow-hidden">(done)</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-[69.613px] shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[0.696px] py-0 relative w-full">
              <div className="flex-[1_0_0] min-h-px min-w-px relative">
                <div className="flex flex-row items-start size-full">
                  <div className="content-stretch flex gap-[11.138px] items-start pl-0 pr-[11.138px] py-0 relative w-full">
                    <div style={{ marginTop: '2px' }}>{doneStates[1] ? <DoneTickPink /> : <UndoneTickPink />}</div>
                    <div
                      className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-center min-h-px min-w-px not-italic overflow-hidden relative text-[#4784F8] text-[11.834px] ${doneStates[1] ? 'line-through' : ''}`}
                      style={{ gap: '2px' }}
                    >
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap">Put the bins out</p>
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '9.4px', fontWeight: 600, fontFamily: "'Lato', sans-serif", color: doneStates[1] ? '#4784F8' : '#BABABA' }}>Thursday</p>
                    </div>
                    {showDoneText[1] && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="css-g0mm18 flex flex-col font-['Lato'] font-bold justify-center leading-[0] italic overflow-hidden relative shrink-0 text-[#4784F8] text-[11.834px] text-ellipsis text-right"
                      >
                        <p className="css-ew64yg leading-[normal] overflow-hidden">(done)</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-[69.613px] shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[0.696px] py-0 relative w-full">
              <div className="flex-[1_0_0] min-h-px min-w-px relative">
                <div className="flex flex-row items-start size-full">
                  <div className="content-stretch flex gap-[11.138px] items-start pl-0 pr-[11.138px] py-0 relative w-full">
                    <div style={{ marginTop: '2px' }}>{doneStates[2] ? <DoneTickOrange /> : <UndoneTickOrange />}</div>
                    <div
                      className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-center min-h-px min-w-px not-italic overflow-hidden relative text-[#4784F8] text-[11.834px] ${doneStates[2] ? 'line-through' : ''}`}
                      style={{ gap: '2px' }}
                    >
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap">Water house plants</p>
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '9.4px', fontWeight: 600, fontFamily: "'Lato', sans-serif", color: doneStates[2] ? '#4784F8' : '#BABABA' }}>25th March</p>
                    </div>
                    {showDoneText[2] && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="css-g0mm18 flex flex-col font-['Lato'] font-bold justify-center leading-[0] italic overflow-hidden relative shrink-0 text-[#4784F8] text-[11.834px] text-ellipsis text-right"
                      >
                        <p className="css-ew64yg leading-[normal] overflow-hidden">(done)</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-[69.613px] shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[0.696px] py-0 relative w-full">
              <div className="flex-[1_0_0] min-h-px min-w-px relative">
                <div className="flex flex-row items-start size-full">
                  <div className="content-stretch flex gap-[11.138px] items-start pl-0 pr-[11.138px] py-0 relative w-full">
                    <div style={{ marginTop: '2px' }}>{doneStates[3] ? <DoneTickGrey /> : <UndoneTickGrey />}</div>
                    <div
                      className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-center min-h-px min-w-px not-italic overflow-hidden relative text-[#4784F8] text-[11.834px] ${doneStates[3] ? 'line-through' : ''}`}
                      style={{ gap: '2px' }}
                    >
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap">Organise family photos</p>
                      <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '9.4px', fontWeight: 600, fontFamily: "'Lato', sans-serif", color: doneStates[3] ? '#4784F8' : '#BABABA' }}>No date / time set</p>
                    </div>
                    {showDoneText[3] && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="css-g0mm18 flex flex-col font-['Lato'] font-bold justify-center leading-[0] italic overflow-hidden relative shrink-0 text-[#4784F8] text-[11.834px] text-ellipsis text-right"
                      >
                        <p className="css-ew64yg leading-[normal] overflow-hidden">(done)</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewReminderBtn() {
  return (
    <div className="bg-[#4784f8] content-stretch flex gap-[11.167px] h-[41.876px] items-center justify-center px-[20.938px] py-[15.355px] relative rounded-[69.794px] shrink-0 w-[252.654px]" data-name="New reminder btn">
      <div className="relative shrink-0 size-[10.469px]" data-name="Union">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.4688 10.4688">
          <path d={svgPaths.paece300} fill="var(--fill-0, white)" id="Union" />
        </svg>
      </div>
      <div className="css-g0mm18 flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[13.959px] text-white">
        <p className="css-ew64yg leading-[normal]">New reminder</p>
      </div>
    </div>
  );
}

export default function OnboardingPage2Content({ activeFilter, combineLaterSometime = false }: { activeFilter?: TutorialFilterKey; combineLaterSometime?: boolean }) {
  return (
    <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
      <TutorialStaticReminderList activeFilter={activeFilter} combineLaterSometime={combineLaterSometime} />
    </div>
  );
}
