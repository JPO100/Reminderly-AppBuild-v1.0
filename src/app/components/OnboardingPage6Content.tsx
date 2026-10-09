import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";

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
