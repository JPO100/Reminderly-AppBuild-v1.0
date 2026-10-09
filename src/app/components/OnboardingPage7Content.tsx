import svgPaths from "@/imports/svg-b2700o3wr8";
import ImportedReminderListAll from "@/imports/ReminderList-1196-227";
import ImportedReminderListToday from "@/imports/ReminderList-1196-287";
import ImportedReminderListThisWeek from "@/imports/ReminderList-1196-373";
import ImportedReminderListLater from "@/imports/ReminderList-1196-456";
import ImportedReminderListSometime from "@/imports/ReminderList-1196-515";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";

export type OnboardingPage7ActiveFilter = 'today' | 'thisWeek' | 'later' | 'sometime' | undefined;

export function OnboardingPage7Text() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Filter your reminders</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap a filter to narrow things down,<br />then de-select it to bring them all back</p>
      </div>
    </div>
  );
}

export function useOnboardingPage7ActiveFilter() {
  const [activeFilter, setActiveFilter] = useState<OnboardingPage7ActiveFilter>(undefined);

  useEffect(() => {
    const filters: OnboardingPage7ActiveFilter[] = [
      undefined,
      'today',
      'thisWeek',
      'later',
      'sometime',
    ];

    let currentIndex = 0;
    let interval: NodeJS.Timeout | null = null;

    const initialTimer = setTimeout(() => {
      currentIndex = 1;
      setActiveFilter(filters[1]);

      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % filters.length;
        setActiveFilter(filters[currentIndex]);
      }, 1200);
    }, 1200);

    return () => {
      clearTimeout(initialTimer);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return activeFilter;
}

function ReminderList({
  activeFilter,
}: {
  activeFilter?: OnboardingPage7ActiveFilter;
}) {
  return (
    <div className="relative w-full flex-1 min-h-0">
      <AnimatePresence mode="wait">
        {!activeFilter ? (
          <motion.div
            key="all"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ImportedReminderListAll />
          </motion.div>
        ) : activeFilter === 'today' ? (
          <motion.div
            key="today"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ImportedReminderListToday />
          </motion.div>
        ) : activeFilter === 'thisWeek' ? (
          <motion.div
            key="thisWeek"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ImportedReminderListThisWeek />
          </motion.div>
        ) : activeFilter === 'sometime' ? (
          <motion.div
            key="sometime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ImportedReminderListSometime />
          </motion.div>
        ) : (
          <motion.div
            key="later"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ImportedReminderListLater />
          </motion.div>
        )}
      </AnimatePresence>
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

export default function OnboardingPage7Content({
  activeFilter,
}: {
  activeFilter?: OnboardingPage7ActiveFilter;
}) {
  return (
    <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
      <TutorialStaticReminderList />
    </div>
  );
}
