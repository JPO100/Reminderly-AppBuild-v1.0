import { useEffect } from "react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";

const PAGE_5_DONE_REMINDER_IDS = ["later-2", "later", "this-week", "today-2", "today"] as const;
export const PAGE_5_HIGHLIGHT_SEQUENCE_DELAY = 2750;
export const PAGE_5_INITIAL_PAUSE_DELAY = 0;
export const PAGE_5_STATE_PAUSE_DELAY = 2000;

function Frame3() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <div className={TUTORIAL_TITLE_CLASSNAME}>
        <p className="css-ew64yg leading-[normal]">See what you’ve done</p>
      </div>
    </div>
  );
}

export function OnboardingPage5Text() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <Frame3 />
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap the Reminderly logo ‘tick’ to see<br />what you’ve already done</p>
      </div>
    </div>
  );
}

function ReminderList({ showDoneReminders, combineLaterSometime }: { showDoneReminders: boolean; combineLaterSometime: boolean }) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full" data-name="Reminder list">
      <TutorialStaticReminderList
        activeFilter={showDoneReminders ? undefined : combineLaterSometime ? "later" : "sometime"}
        combineLaterSometime={combineLaterSometime}
        doneReminderIds={showDoneReminders ? PAGE_5_DONE_REMINDER_IDS : undefined}
      />
    </div>
  );
}

export default function OnboardingPage5Content({
  onLogoHighlightChange,
  onDoneRemindersChange,
  showDoneReminders,
  combineLaterSometime = false,
}: {
  onLogoHighlightChange: (visible: boolean) => void;
  onDoneRemindersChange: (visible: boolean) => void;
  showDoneReminders: boolean;
  combineLaterSometime?: boolean;
}) {
  useEffect(() => {
    const timers: number[] = [];
    let cancelled = false;
    let isInitialCycle = true;

    const showMainList = () => {
      if (cancelled) {
        return;
      }

      onDoneRemindersChange(false);
      onLogoHighlightChange(false);

      const mainPauseTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        isInitialCycle = false;
        onLogoHighlightChange(true);

        const openDoneTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          onLogoHighlightChange(false);
          onDoneRemindersChange(true);

          const donePauseTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            onLogoHighlightChange(true);

            const closeDoneTimer = window.setTimeout(() => {
              if (cancelled) {
                return;
              }

              onLogoHighlightChange(false);
              showMainList();
            }, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY);
            timers.push(closeDoneTimer);
          }, PAGE_5_STATE_PAUSE_DELAY);
          timers.push(donePauseTimer);
        }, PAGE_5_HIGHLIGHT_SEQUENCE_DELAY);
        timers.push(openDoneTimer);
      }, isInitialCycle ? PAGE_5_INITIAL_PAUSE_DELAY : PAGE_5_STATE_PAUSE_DELAY);
      timers.push(mainPauseTimer);
    };

    showMainList();

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      onLogoHighlightChange(false);
      onDoneRemindersChange(false);
    };
  }, [onDoneRemindersChange, onLogoHighlightChange]);

  return (
    <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
      <ReminderList showDoneReminders={showDoneReminders} combineLaterSometime={combineLaterSometime} />
    </div>
  );
}
