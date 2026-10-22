import { motion } from "motion/react";
import svgPaths from "@/imports/svg-tzdfx9foxi";
import page8Paths from "@/imports/svg-b2700o3wr8";
import tickPaths from "@/imports/svg-jngdeg2tc1";

const TUTORIAL_HEADER_WIDTH = 280;
const LOGO_ASSET_WIDTH = 209.653;
const LOGO_ASSET_HEIGHT = 35.653;
const LOGO_WIDTH = 146;
const LOGO_HEIGHT = 25;
const LOGO_VERTICAL_SPACING = 10;
const LOGO_ROW_HEIGHT = LOGO_HEIGHT + LOGO_VERTICAL_SPACING * 2;
const LOGO_MENU_ROW_HEIGHT = LOGO_ROW_HEIGHT + LOGO_VERTICAL_SPACING * 2;
const MENU_ICON_WIDTH = 17.6;
const MENU_ICON_HEIGHT = 16;
const MENU_WRAPPER_WIDTH = 13.6;
const MENU_WRAPPER_HEIGHT = 28.5224;
const MENU_RIGHT_OFFSET = 16;

function TutorialSensorBar({ color }: { color: string }) {
  return (
    <div className="content-stretch flex gap-[2.872px] items-center relative shrink-0">
      <div className="h-[5.026px] rounded-[7.179px] shrink-0 w-[17.231px]" style={{ backgroundColor: color }} />
      <div className="rounded-[7.179px] shrink-0 size-[5.026px]" style={{ backgroundColor: color }} />
    </div>
  );
}

function Page8SensorBar({ color }: { color: string }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="h-[7px] rounded-[10px] shrink-0 w-[24px]" style={{ backgroundColor: color }} />
      <div className="rounded-[10px] shrink-0 size-[7px]" style={{ backgroundColor: color }} />
    </div>
  );
}

function TutorialHeaderMenuIcon() {
  return (
    <svg
      className="block shrink-0"
      style={{ width: `${MENU_ICON_WIDTH}px`, height: `${MENU_ICON_HEIGHT}px` }}
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 1.5H20.5M1.5 10H20.5M1.5 18.5H20.5"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TutorialWordmark({
  showTickHighlight = false,
  tickDone = false,
}: {
  showTickHighlight?: boolean;
  tickDone?: boolean;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: `${LOGO_WIDTH}px`, height: `${LOGO_HEIGHT}px` }}
    >
      {showTickHighlight && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: "-10.5px",
            top: "-10.5px",
            width: 46,
            height: 46,
            zIndex: 1,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0, 0, 1, 0, 0, 1, 0],
          }}
          transition={{
            duration: 2.3,
            delay: 0.4,
            times: [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1],
            ease: "easeInOut",
          }}
        >
          <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
            <circle cx="23" cy="23" r="21.25" stroke="#FFFFFF" strokeWidth="3.5" />
          </svg>
        </motion.div>
      )}
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 209.653 35.6533">
        <g>
          <g>
            <path d={svgPaths.p2e09d80} fill="white" />
            <path d={svgPaths.p3b133a00} fill="white" />
            <path d={svgPaths.p11840600} fill="white" />
            <path d={svgPaths.p170f9700} fill="white" />
            <path d={svgPaths.pf876500} fill="white" />
            <path d={svgPaths.pc9c4a00} fill="white" />
            <path d={svgPaths.p6114100} fill="white" />
            <path d={svgPaths.pb9f8400} fill="white" />
            <path d={svgPaths.pe461c40} fill="white" />
            <path d={svgPaths.p38e87300} fill="white" />
            <path d={svgPaths.p26dc1e00} fill="white" />
            <path d={svgPaths.p82ca600} fill="white" />
          </g>
          <path d={svgPaths.p3babd700} fill="white" />
        </g>
      </svg>
      {tickDone && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: 25,
            height: 25,
            zIndex: 1,
          }}
        >
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.8332 24.8332">
            <g clipPath="url(#clip0_default_header_done_tick)">
              <path d={tickPaths.p9b9c500} fill="#FFFFFF" />
              <g>
                <path d={tickPaths.p1d837f80} fill="#4784F8" />
                <path d={tickPaths.p1d2e7380} fill="#4784F8" />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_default_header_done_tick">
                <rect fill="white" height="24.8332" width="24.8332" />
              </clipPath>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

function Page8HeaderWordmark() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[2.786px] pt-0 px-0 relative shrink-0">
      <div className="css-g0mm18 flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[23.682px] text-white">
        <p className="css-ew64yg leading-[normal]">reminderly</p>
      </div>
    </div>
  );
}

function Page8DefaultTick({ tickFlash }: { tickFlash?: boolean }) {
  return (
    <div className="relative shrink-0 size-[24.833px]" style={{ opacity: tickFlash ? 0 : 1 }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.8332 24.8332">
        <g id="Group 14">
          <path d={page8Paths.p3bc9a000} fill="white" id="Ellipse 74 (Stroke)" />
          <g id="Group 11">
            <path d={page8Paths.p8e6bc00} fill="white" id="Line 39 (Stroke)" />
            <path d={page8Paths.p2b1f0800} fill="white" id="Line 40 (Stroke)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Page8DoneTick() {
  return (
    <div className="relative shrink-0 size-[24.833px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.8332 24.8332">
        <g clipPath="url(#clip0_page8_header)" id="Group 14">
          <path d={tickPaths.p9b9c500} fill="#FFFFFF" id="Ellipse 74 (Stroke)" />
          <g id="Group 11">
            <path d={tickPaths.p1d837f80} fill="#4784F8" id="Line 39 (Stroke)" />
            <path d={tickPaths.p1d2e7380} fill="#4784F8" id="Line 40 (Stroke)" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_page8_header">
            <rect fill="white" height="24.8332" width="24.8332" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Page8HeaderLogo({
  showDone,
  tickDone,
  tickFlash,
}: {
  showDone?: boolean;
  tickDone?: boolean;
  tickFlash?: boolean;
}) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[146.027px]">
      {tickDone ? <Page8DoneTick /> : <Page8DefaultTick tickFlash={tickFlash} />}
      <Page8HeaderWordmark />
    </div>
  );
}

export interface TutorialPhoneHeaderProps {
  activeMainTab: "reminders" | "lists";
  backgroundColor?: string;
  showMenuIcon?: boolean;
  variant?: "default" | "page8";
  indicatorColor?: string;
  tickDone?: boolean;
  tickFlash?: boolean;
  showDone?: boolean;
  logoTickHighlight?: boolean;
  logoTickDone?: boolean;
}

export default function TutorialPhoneHeader({
  activeMainTab,
  backgroundColor,
  showMenuIcon = true,
  variant = "default",
  indicatorColor = "#1C2C42",
  tickDone = false,
  tickFlash = false,
  showDone = false,
  logoTickHighlight = false,
  logoTickDone = false,
}: TutorialPhoneHeaderProps) {
  const resolvedBackgroundColor = backgroundColor ?? (activeMainTab === "lists" ? "#4784F8" : "#4784f8");
  // Dynamic Island and camera: dark blue on the Reminders header (a colour rename once made it the header's own blue, hiding it)
  const defaultSensorColor = activeMainTab === "lists" ? "#000000" : "#1C2C42";

  if (variant === "page8") {
    return (
      <div
        className="content-stretch flex flex-col items-center relative shrink-0 w-full pb-[9.93px] pt-[16px]"
        style={{ backgroundColor: resolvedBackgroundColor }}
      >
        <div className="content-stretch flex flex-col gap-[22px] items-center relative shrink-0">
          <Page8SensorBar color={indicatorColor} />
          <Page8HeaderLogo showDone={showDone} tickDone={tickDone} tickFlash={tickFlash} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="content-stretch flex flex-col items-center relative shrink-0 w-full pt-[11px]"
      style={{ backgroundColor: resolvedBackgroundColor }}
    >
      <TutorialSensorBar color={defaultSensorColor} />
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${TUTORIAL_HEADER_WIDTH}px`,
          height: `${LOGO_MENU_ROW_HEIGHT}px`,
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ height: `${LOGO_ROW_HEIGHT}px` }}
        >
          <TutorialWordmark showTickHighlight={logoTickHighlight} tickDone={logoTickDone} />
        </div>
        {showMenuIcon && (
          <div
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              right: `${MENU_RIGHT_OFFSET}px`,
              width: `${MENU_WRAPPER_WIDTH}px`,
              height: `${MENU_WRAPPER_HEIGHT}px`,
            }}
          >
            <TutorialHeaderMenuIcon />
          </div>
        )}
      </div>
    </div>
  );
}
