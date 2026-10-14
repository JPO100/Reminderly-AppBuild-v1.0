import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Reminder } from "../reminder-utils";
import { formatDueLine } from "./ReminderInfoOverlay";
import { TUTORIAL_BODY_CLASSNAME, TUTORIAL_TITLE_CLASSNAME } from "./tutorialTokens";
import TutorialStaticReminderList from "./TutorialStaticReminderList";
import infoOverlaySvgPaths from "@/imports/svg-oxn8g14l6y";
import reminderOverlaySvgPaths from "@/imports/svg-k8owpv3rm6";

export const TUTORIAL_OVERLAY_SOURCE_WIDTH = 340;
export const TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH = 280;
export const TUTORIAL_OVERLAY_SCALE = TUTORIAL_OVERLAY_PHONE_INTERIOR_WIDTH / TUTORIAL_OVERLAY_SOURCE_WIDTH;
export const TUTORIAL_OVERLAY_TOP_OFFSET = 63;
export const TUTORIAL_OVERLAY_TRANSFORM_ORIGIN = "top center";
export const TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE = 35;
export const TUTORIAL_ATTENTION_THROB_DURATION = 2.3;
export const TUTORIAL_ATTENTION_THROB_DELAY = 0.4;
export const TUTORIAL_ATTENTION_THROB_TIMES = [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1];
export const TUTORIAL_ATTENTION_SEQUENCE_DELAY = 2750;
export const TUTORIAL_ATTENTION_RECYCLE_DELAY = 2000;

export function TutorialMiniOverlayShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-[60] flex items-start justify-center bg-black/50"
      style={{ paddingTop: TUTORIAL_OVERLAY_TOP_OFFSET }}
    >
      <div
        className="pointer-events-none"
        style={{
          width: TUTORIAL_OVERLAY_SOURCE_WIDTH,
          transform: `scale(${TUTORIAL_OVERLAY_SCALE})`,
          transformOrigin: TUTORIAL_OVERLAY_TRANSFORM_ORIGIN,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const CALL_DENTIST_TUTORIAL_REMINDER: Reminder = {
  id: "today",
  originalText: "Pick up milk",
  displayText: "Pick up milk",
  createdAt: 0,
  schedule: { kind: "scheduled", date: "2025-08-11", time: "14:00" },
  completedAt: null,
};

export function TutorialOverlayCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] outline-none">
      {children}
    </div>
  );
}

function TutorialOverlayButton({ label, color }: { label: string; color: string }) {
  return (
    <div className="h-[44px] relative rounded-[88px] shrink-0 w-full" style={{ backgroundColor: color }}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[13px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[15px] text-white whitespace-nowrap">
            <p className="leading-[normal]">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialOverlayToggleRow({ title, subtitle, active, icon }: { title: string; subtitle: string; active: boolean; icon: ReactNode }) {
  const textColor = active ? "#4784F8" : "#d9d9d9";
  const toggleBg = active ? "#4784F8" : "#d9d9d9";
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full">
      {icon}
      <div className="content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative">
        <div className="flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px] text-ellipsis w-full whitespace-nowrap" style={{ color: textColor }}>
          <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>{title}</p>
        </div>
        <div className="flex flex-col justify-start relative shrink-0 text-[14px] w-full" style={{ color: active ? "#bababa" : textColor }}>
          <p className="leading-[14px]" style={{ fontWeight: 700 }}>{subtitle}</p>
        </div>
      </div>
      <div className="content-stretch flex h-[30px] items-center self-start p-[3.75px] relative rounded-[37.5px] shrink-0 w-[56px]" style={{ backgroundColor: toggleBg, justifyContent: active ? "flex-end" : "flex-start" }}>
        <div className="relative shrink-0 size-[22.5px]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
            <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TutorialListSettingsButton({ label, color }: { label: string; color: string }) {
  return (
    <div className="h-[50px] relative rounded-[100px] shrink-0 w-full" style={{ backgroundColor: color }}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
            <p className="leading-[normal]">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialReminderInfoOverlay({ reminder }: { reminder: Reminder }) {
  const dueLine = formatDueLine(reminder, new Date(2025, 7, 11, 12, 0, 0, 0));

  return (
    <TutorialMiniOverlayShell>
      <TutorialOverlayCard>
        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#4784F8] text-[18px] text-center">
          <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>{reminder.displayText}</p>
        </div>
        <div className="content-stretch flex items-center justify-center gap-[8px] min-w-full relative shrink-0">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] min-w-0 not-italic relative shrink text-[15px] text-center max-w-full" style={{ color: "#4784F8" }}>
            <p className="leading-[normal] whitespace-nowrap" style={{ fontWeight: 700 }}>{dueLine}</p>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[26px] items-start mt-[7px] relative shrink-0 w-full">
          <TutorialOverlayButton label="Mark as done" color="#4784f8" />
          <TutorialOverlayButton label="Edit reminder" color="#4784f8" />
          <TutorialOverlayButton label="Delete reminder" color="#939393" />
        </div>
      </TutorialOverlayCard>
    </TutorialMiniOverlayShell>
  );
}

export function TutorialListSettingsOverlay() {
  return (
    <TutorialMiniOverlayShell>
      <div className="bg-white relative flex flex-col gap-[33px] items-center justify-start pt-[35px] pb-[35px] px-[32px] rounded-[32px] outline-none">
        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[#1C2C42] text-[20px] text-ellipsis text-center w-full whitespace-nowrap">
          <p className="leading-[normal] overflow-hidden" style={{ fontWeight: 700 }}>Work tasks</p>
        </div>
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
          <TutorialOverlayToggleRow
            title="Set smart reminder"
            subtitle="No completion date set"
            active={false}
            icon={
              <div className="h-[21.5px] relative self-start shrink-0 w-[19.5px] top-[1px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5002 21.5002">
                  <g>
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p23b20a00} fill="#D9D9D9" fillRule="evenodd" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p15d6fbb2} fill="#D9D9D9" fillRule="evenodd" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p1797f00} fill="#D9D9D9" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
            }
          />
          <TutorialOverlayToggleRow
            title="List in order added"
            subtitle="Most recent at the top"
            active
            icon={
              <div className="h-[20.824px] relative shrink-0 w-[20.83px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.8301 20.8242">
                  <g>
                    <path d={infoOverlaySvgPaths.p1f326770} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p10221f80} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p30c3ae80} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p2dfdd480} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p390e3940} fill="#4784F8" />
                  </g>
                </svg>
              </div>
            }
          />
          <TutorialOverlayToggleRow
            title="List alphabetically"
            subtitle="Displayed A - Z"
            active={false}
            icon={
              <div className="h-[20.814px] relative shrink-0 w-[22.387px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.3867 20.8145">
                  <g>
                    <path d={infoOverlaySvgPaths.pa5a1880} fill="#D9D9D9" />
                    <path d={infoOverlaySvgPaths.p3a034e00} fill="#D9D9D9" />
                    <path d={infoOverlaySvgPaths.pbb6b280} fill="#D9D9D9" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p37945200} fill="#D9D9D9" fillRule="evenodd" />
                    <path d={infoOverlaySvgPaths.p3a58ae80} fill="#D9D9D9" />
                  </g>
                </svg>
              </div>
            }
          />
        </div>
        <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
          <TutorialListSettingsButton label="Uncheck all items" color="#4784F8" />
          <TutorialListSettingsButton label="Create template from list" color="#4784F8" />
          <TutorialListSettingsButton label="Delete list" color="#939393" />
        </div>
      </div>
    </TutorialMiniOverlayShell>
  );
}

export function TutorialListSettingsOverlayWithToggle({ smartToggleActive }: { smartToggleActive: boolean }) {
  const smartIconColor = smartToggleActive ? "#4784F8" : "#d9d9d9";
  return (
    <TutorialMiniOverlayShell>
      <div className="bg-white relative flex flex-col gap-[33px] items-center justify-start pt-[35px] pb-[35px] px-[32px] rounded-[32px] outline-none">
        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[#1C2C42] text-[20px] text-ellipsis text-center w-full whitespace-nowrap">
          <p className="leading-[normal] overflow-hidden" style={{ fontWeight: 700 }}>Work tasks</p>
        </div>
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
          <TutorialOverlayToggleRow
            title="Set smart reminder"
            subtitle="No completion date set"
            active={smartToggleActive}
            icon={
              <div className="h-[21.5px] relative self-start shrink-0 w-[19.5px] top-[1px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5002 21.5002">
                  <g>
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p23b20a00} fill={smartIconColor} fillRule="evenodd" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p15d6fbb2} fill={smartIconColor} fillRule="evenodd" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p1797f00} fill={smartIconColor} fillRule="evenodd" />
                  </g>
                </svg>
              </div>
            }
          />
          <TutorialOverlayToggleRow
            title="List in order added"
            subtitle="Most recent at the top"
            active
            icon={
              <div className="h-[20.824px] relative shrink-0 w-[20.83px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.8301 20.8242">
                  <g>
                    <path d={infoOverlaySvgPaths.p1f326770} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p10221f80} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p30c3ae80} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p2dfdd480} fill="#4784F8" />
                    <path d={infoOverlaySvgPaths.p390e3940} fill="#4784F8" />
                  </g>
                </svg>
              </div>
            }
          />
          <TutorialOverlayToggleRow
            title="List alphabetically"
            subtitle="Displayed A - Z"
            active={false}
            icon={
              <div className="h-[20.814px] relative shrink-0 w-[22.387px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.3867 20.8145">
                  <g>
                    <path d={infoOverlaySvgPaths.pa5a1880} fill="#D9D9D9" />
                    <path d={infoOverlaySvgPaths.p3a034e00} fill="#D9D9D9" />
                    <path d={infoOverlaySvgPaths.pbb6b280} fill="#D9D9D9" />
                    <path clipRule="evenodd" d={infoOverlaySvgPaths.p37945200} fill="#D9D9D9" fillRule="evenodd" />
                    <path d={infoOverlaySvgPaths.p3a58ae80} fill="#D9D9D9" />
                  </g>
                </svg>
              </div>
            }
          />
        </div>
        <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
          <TutorialListSettingsButton label="Uncheck all items" color="#4784F8" />
          <TutorialListSettingsButton label="Create template from list" color="#4784F8" />
          <TutorialListSettingsButton label="Delete list" color="#939393" />
        </div>
      </div>
    </TutorialMiniOverlayShell>
  );
}

function SmartReminderOptionRow({ label, valueLabel, isOn, iconContent, inactiveColor = "#B7B7B7" }: { label: string; valueLabel?: string; isOn: boolean; iconContent: ReactNode; inactiveColor?: string }) {
  const color = isOn ? "#4784F8" : inactiveColor;
  return (
    <div className="content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full">
      <div className="content-stretch flex gap-[16px] items-center relative min-w-0 flex-1">
        {iconContent}
        <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[17px] min-w-[68px]" style={{ color }}>{label}</p>
        {valueLabel && (
          <p className="font-['Lato',sans-serif] font-[600] leading-[23px] not-italic relative text-[17px] text-[#4784F8] ml-[4px] truncate">{valueLabel}</p>
        )}
      </div>
      <div className="h-[30px] relative shrink-0 w-[56px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
          <rect fill={isOn ? "#4784F8" : "#D9D9D9"} height="30" rx="15" width="56" />
          <circle cx={isOn ? "41" : "15"} cy="15" fill="white" r="11.25" />
        </svg>
      </div>
    </div>
  );
}

export function TutorialSmartReminderSheet({ onTickButtonElementChange }: { onTickButtonElementChange?: (element: HTMLDivElement | null) => void } = {}) {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full">
      <div className="relative shrink-0 w-full max-w-[768px] h-full flex flex-col">
        <div className="content-stretch flex flex-col gap-[22px] items-start pt-[30px] px-[24px] relative w-full shrink-0">
          <div className="flex items-center justify-between w-full">
            <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">Add smart reminder</span>
            <div ref={onTickButtonElementChange} className="flex items-center justify-center relative shrink-0 size-[50px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                <rect fill="#4784F8" height="50" rx="25" width="50" />
                <path d={reminderOverlaySvgPaths.p1635b2f0} fill="#F0FAFE" />
              </svg>
            </div>
          </div>
          <div className="relative bg-[#f7f7f7] rounded-[10px] shrink-0 w-full" style={{ height: 80 }}>
            <div className="w-full h-full p-[12px] font-['Lato',sans-serif] text-[17px] text-[#BABABA]" style={{ lineHeight: 'normal' }}>
              Complete &apos;Work tasks&apos; list
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col px-[24px] pt-[24px] pb-[24px]">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
            <SmartReminderOptionRow
              label="Date"
              valueLabel="Today"
              isOn
              iconContent={
                <div className="relative shrink-0 size-[25px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                    <mask fill="white" id="tut-smart-date-mask">
                      <path d={reminderOverlaySvgPaths.p37c4f500} />
                    </mask>
                    <path d={reminderOverlaySvgPaths.pde59c80} fill="#4784F8" mask="url(#tut-smart-date-mask)" />
                  </svg>
                </div>
              }
            />
            <SmartReminderOptionRow
              label="Time"
              valueLabel="12pm"
              isOn
              iconContent={
                <div className="relative shrink-0 size-[25px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                    <mask fill="white" id="tut-smart-time-mask">
                      <path d={reminderOverlaySvgPaths.p37c4f500} />
                    </mask>
                    <path d={reminderOverlaySvgPaths.pde59c80} fill="#4784F8" mask="url(#tut-smart-time-mask)" />
                  </svg>
                </div>
              }
            />
            <SmartReminderOptionRow
              label="Repeats"
              isOn={false}
              inactiveColor="#D9D9D9"
              iconContent={
                <div className="h-[25.071px] relative shrink-0 w-[25px]">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0003 25.0708">
                    <path d={reminderOverlaySvgPaths.p19a7b000} fill="#D9D9D9" />
                    <path d={reminderOverlaySvgPaths.p9f3c880} fill="#D9D9D9" />
                    <path d={reminderOverlaySvgPaths.pf2d2300} fill="#D9D9D9" />
                  </svg>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <div className={TUTORIAL_TITLE_CLASSNAME}>
        <p className="css-ew64yg leading-[normal]">Manage your reminders</p>
      </div>
    </div>
  );
}

export function OnboardingPage3Text() {
  return (
    <div className="content-stretch flex flex-col gap-[27px] [@media(max-height:570px)]:gap-[10px] [@media(max-height:570px)]:!min-h-0 items-center relative shrink-0">
      <Frame3 />
      <div className={TUTORIAL_BODY_CLASSNAME}>
        <p className="css-4hzbpn leading-[30px]">Tap the three dot menu<br />to view more reminder options</p>
      </div>
    </div>
  );
}

function ReminderList({
  setMenuTargetElement,
  onOverlayOpenChange,
  combineLaterSometime = false,
}: {
  setMenuTargetElement: (element: HTMLDivElement | null) => void;
  onOverlayOpenChange?: (open: boolean) => void;
  combineLaterSometime?: boolean;
}) {
  const [menuTargetElement, setLocalMenuTargetElement] = useState<HTMLDivElement | null>(null);
  const [menuTargetRect, setMenuTargetRect] = useState<{ left: number; top: number } | null>(null);
  const [showCircle, setShowCircle] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    let cancelled = false;

    const startCycle = () => {
      if (cancelled) {
        return;
      }

      onOverlayOpenChange?.(false);
      setShowCircle(true);

      const overlayTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setShowCircle(false);
        onOverlayOpenChange?.(true);

        const recycleTimer = window.setTimeout(() => {
          startCycle();
        }, TUTORIAL_ATTENTION_RECYCLE_DELAY);
        timers.push(recycleTimer);
      }, TUTORIAL_ATTENTION_SEQUENCE_DELAY);
      timers.push(overlayTimer);
    };

    startCycle();

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      onOverlayOpenChange?.(false);
    };
  }, [onOverlayOpenChange]);

  useEffect(() => {
    if (!menuTargetElement) {
      setMenuTargetRect(null);
      return;
    }

    const updateRect = () => {
      const parent = menuTargetElement.offsetParent;
      if (!(parent instanceof HTMLElement)) {
        setMenuTargetRect(null);
        return;
      }

      const targetRect = menuTargetElement.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setMenuTargetRect({
        left: targetRect.left - parentRect.left + (targetRect.width / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
        top: targetRect.top - parentRect.top + (targetRect.height / 2) - (TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE / 2),
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
    };
  }, [menuTargetElement]);

  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px w-full relative" data-name="Reminder list">
      <TutorialStaticReminderList
        menuTargetReminderId="today"
        combineLaterSometime={combineLaterSometime}
        onMenuTargetElementChange={(element) => {
          setLocalMenuTargetElement(element);
          setMenuTargetElement(element);
        }}
      />
      {showCircle && menuTargetRect && (
        <motion.div
          className="absolute z-10 pointer-events-none"
          style={{
            left: menuTargetRect.left,
            top: menuTargetRect.top,
            width: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
            height: TUTORIAL_ATTENTION_TARGET_CIRCLE_SIZE,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
          }}
          transition={{
            duration: TUTORIAL_ATTENTION_THROB_DURATION,
            delay: TUTORIAL_ATTENTION_THROB_DELAY,
            times: TUTORIAL_ATTENTION_THROB_TIMES,
            ease: "easeInOut",
          }}
        >
          <svg width="35" height="35" viewBox="0 0 35 35" fill="none">
            <circle cx="17.5" cy="17.5" r="16" stroke="#4784F8" strokeWidth="3" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}

export default function OnboardingPage3Content({
  onOverlayOpenChange,
  combineLaterSometime = false,
}: {
  onOverlayOpenChange?: (open: boolean) => void;
  combineLaterSometime?: boolean;
}) {
  return (
    <div className="content-stretch flex flex-col flex-1 min-h-0 gap-[22.334px] items-center pt-[10px] px-[14px] relative w-full">
      <ReminderList
        setMenuTargetElement={() => {}}
        onOverlayOpenChange={onOverlayOpenChange}
        combineLaterSometime={combineLaterSometime}
      />
    </div>
  );
}
