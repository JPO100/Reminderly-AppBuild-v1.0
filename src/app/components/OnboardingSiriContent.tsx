// Reminders tutorial page "Add reminders with Siri" (Siri Phase 3). Shown while Siri for reminders is available,
// whatever the user's Siri setting. The phone top slice shows the reminder list with a Siri edge glow: a recreation
// of the iOS listening glow (not Apple artwork), the one deliberate gradient in Reminderly (John, 2026-10-22).

import { motion } from "motion/react";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialPhoneShell from "./TutorialPhoneShell";
import { TutorialRemindersFilterRow } from "./TutorialReminderFilters";
import TutorialStaticReminderList from "./TutorialStaticReminderList";

const SIRI_GLOW_COLOURS = "#BC82F3, #F5B9EA, #8D9FFF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3";
const SIRI_GLOW_TURN_SECONDS = 4;

export function OnboardingSiriText() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center relative shrink-0">
        <div className={TUTORIAL_TITLE_CLASSNAME}>
          <p className="css-ew64yg leading-[normal]">Add reminders with Siri</p>
        </div>
      </div>
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Say &ldquo;Hey Siri, add to Reminderly app&rdquo;<br />then tell Siri your reminder</p>
      </div>
    </div>
  );
}

// A band of rotating colour along the screen edges. The ring mask keeps only the edge band; the blur on the
// wrapper softens it inwards, as on iOS. The screen's own rounded clip trims the outer edge. The phone is a top
// slice, so the band runs on below the cut and only the top and sides show.
function SiriEdgeGlow({ band, blur, opacity }: { band: number; blur: number; opacity: number }) {
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

export default function OnboardingSiriPhone({
  isListsEnabled,
  settingsMenuEnabled,
  calendarEnabled,
}: {
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  calendarEnabled: boolean;
}) {
  return (
    <TutorialPhoneShell
      activeMainTab="reminders"
      showMainTabBar={isListsEnabled}
      showHeaderMenu={false}
      filterRow={<TutorialRemindersFilterRow settingsMenuEnabled={settingsMenuEnabled} calendarEnabled={calendarEnabled} />}
      overlay={
        <div className="absolute inset-0 z-50 pointer-events-none">
          <SiriEdgeGlow band={14} blur={12} opacity={0.9} />
          <SiriEdgeGlow band={4} blur={2} opacity={1} />
        </div>
      }
    >
      <div className="content-stretch flex flex-col flex-1 min-h-0 items-center pt-[10px] px-[14px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full">
          <TutorialStaticReminderList combineLaterSometime={settingsMenuEnabled} />
        </div>
      </div>
    </TutorialPhoneShell>
  );
}
