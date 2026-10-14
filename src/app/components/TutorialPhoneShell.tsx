import type { ReactNode } from "react";
import TutorialPhoneHeader, { type TutorialPhoneHeaderProps } from "./TutorialPhoneHeader";
import TutorialMainTabBar from "./TutorialMainTabBar";

export default function TutorialPhoneShell({
  activeMainTab,
  filterRow,
  children,
  overlay,
  blankBody = false,
  shellColor,
  bezelColor = "#4784F8",
  showHeaderMenu = true,
  showMainTabBar = true,
  headerProps,
  remindersLabel,
  listsLabel,
}: {
  activeMainTab: "reminders" | "lists";
  filterRow: ReactNode;
  children?: ReactNode;
  overlay?: ReactNode;
  blankBody?: boolean;
  shellColor?: string;
  bezelColor?: string;
  showHeaderMenu?: boolean;
  showMainTabBar?: boolean;
  headerProps?: Partial<Omit<TutorialPhoneHeaderProps, "activeMainTab" | "backgroundColor" | "showMenuIcon">>;
  remindersLabel?: string;
  listsLabel?: string;
}) {
  const resolvedShellColor = shellColor ?? (activeMainTab === "lists" ? "#4784F8" : "#4784f8");

  return (
    <div className="relative shrink-0 h-full w-full max-w-[308px] [@media(max-height:570px)]:scale-[0.7] [@media(max-height:570px)]:origin-top [@media(max-height:570px)]:-mb-[108px]">
      <div
        className="h-full w-full rounded-tl-[40px] rounded-tr-[40px]"
        style={{ backgroundColor: "#000000", paddingTop: "14px", paddingLeft: "14px", paddingRight: "14px", boxSizing: "border-box" }}
      >
        <div
          className="overflow-clip relative rounded-tl-[26px] rounded-tr-[26px] h-full w-full"
          style={{ backgroundColor: resolvedShellColor }}
        >
          <div
            className="absolute content-stretch flex flex-col h-full items-center justify-start gap-0 left-0 rounded-tl-[30px] rounded-tr-[30px] top-0 w-full"
            style={{ backgroundColor: resolvedShellColor }}
          >
            <TutorialPhoneHeader
              activeMainTab={activeMainTab}
              backgroundColor={resolvedShellColor}
              showMenuIcon={showHeaderMenu}
              {...headerProps}
            />
            {showMainTabBar && (
              <TutorialMainTabBar activeMainTab={activeMainTab} remindersLabel={remindersLabel} listsLabel={listsLabel} />
            )}
            {/* Lists off: panel sits directly under the header with the app's larger corner radius (20px at tutorial scale) */}
            <div className={`bg-white flex-[1_0_0] min-h-px min-w-px relative w-full ${showMainTabBar ? "rounded-tl-[10.769px] rounded-tr-[10.769px]" : "rounded-tl-[14.359px] rounded-tr-[14.359px]"}`}>
              <div className="flex flex-col items-center size-full">
                {filterRow}
                {blankBody ? (
                  <div className="flex-1 w-full" />
                ) : (
                  children
                )}
              </div>
            </div>
            {overlay}
          </div>
        </div>
      </div>
    </div>
  );
}
