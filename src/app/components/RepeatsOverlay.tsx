import { useState, useRef, useEffect } from "react";
import svgPaths from "../../imports/svg-prkucc25l";
import tickSvgPaths from "../../imports/svg-k8owpv3rm6";
import repeatSvg from "../../imports/svg-upkw3rt5ea";
import checkSvg from "../../imports/svg-w98xpyjjva";
import type { RepeatConfig } from "../reminder-utils";

interface RepeatsOverlayProps {
  onClose: (config?: RepeatConfig) => void;
  initialConfig: RepeatConfig;
}

export default function RepeatsOverlay({ onClose, initialConfig }: RepeatsOverlayProps) {
  const [activeFrequency, setActiveFrequency] = useState<string | null>(initialConfig?.frequency ?? null);
  const [hourlyCount, setHourlyCount] = useState(initialConfig?.frequency === 'hourly' ? initialConfig.interval : 1);
  const [repeatCount, setRepeatCount] = useState(initialConfig?.frequency === 'daily' ? initialConfig.interval : 1);
  const [weeklyCount, setWeeklyCount] = useState(initialConfig?.frequency === 'weekly' ? initialConfig.interval : 1);
  const [monthlyCount, setMonthlyCount] = useState(initialConfig?.frequency === 'monthly' ? initialConfig.interval : 1);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(initialConfig?.frequency === 'custom-days' ? initialConfig.selectedDays ?? [] : [])
  );
  const hourlyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const weeklyRef = useRef<HTMLDivElement>(null);
  const monthlyRef = useRef<HTMLDivElement>(null);
  const customDaysRef = useRef<HTMLDivElement>(null);
  const [hourlyHeight, setHourlyHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [weeklyHeight, setWeeklyHeight] = useState(0);
  const [monthlyHeight, setMonthlyHeight] = useState(0);
  const [customDaysHeight, setCustomDaysHeight] = useState(0);

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const toggleFrequency = (freq: string) => {
    if (activeFrequency === freq) {
      setActiveFrequency(null);
    } else {
      if (freq === 'hourly') setHourlyCount(1);
      if (freq === 'daily') setRepeatCount(1);
      if (freq === 'weekly') setWeeklyCount(1);
      if (freq === 'monthly') setMonthlyCount(1);
      if (freq === 'custom-days') setSelectedDays(new Set());
      setActiveFrequency(freq);
    }
  };

  useEffect(() => {
    if (hourlyRef.current) setHourlyHeight(hourlyRef.current.scrollHeight);
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
    if (weeklyRef.current) setWeeklyHeight(weeklyRef.current.scrollHeight);
    if (monthlyRef.current) setMonthlyHeight(monthlyRef.current.scrollHeight);
    if (customDaysRef.current) setCustomDaysHeight(customDaysRef.current.scrollHeight);
  }, [activeFrequency, selectedDays]);

  const getCurrentConfig = (): RepeatConfig => {
    if (!activeFrequency) return null;
    if (activeFrequency === 'custom-days') {
      const days = Array.from(selectedDays);
      if (days.length === 0) return null;
      return {
        frequency: 'custom-days',
        interval: days.length,
        selectedDays: days,
      };
    }
    const countMap: Record<string, number> = {
      hourly: hourlyCount,
      daily: repeatCount,
      weekly: weeklyCount,
      monthly: monthlyCount,
    };
    return {
      frequency: activeFrequency as 'hourly' | 'daily' | 'weekly' | 'monthly',
      interval: countMap[activeFrequency] ?? 1,
    };
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full" data-name="repeats-overlay">
      <div className="flex flex-col h-full relative w-full max-w-[768px]" data-name="repeats-content">
        <div className="flex flex-col items-start pt-[30px] px-[24px] pb-[24px] relative w-full flex-1 min-h-0">
          <div className="bg-white w-full flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between w-full shrink-0">
              <button
                onClick={() => onClose()}
                className="flex items-center gap-[10px] cursor-pointer shrink-0 bg-transparent border-none p-0"
                data-name="cancel-button"
              >
                <svg width="18" height="33" viewBox="0 0 18 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0">
                  <path d="M6.13811 8.87479C6.6468 8.30085 7.47168 8.30085 7.98037 8.87479C8.48897 9.44872 8.48899 10.3791 7.98037 10.953L3.16754 16.3828L8.08913 21.9357C8.59774 22.5096 8.59774 23.44 8.08913 24.0139C7.58044 24.5878 6.75556 24.5878 6.24687 24.0139L0.60879 17.6526C0.528196 17.5953 0.451622 17.5273 0.381409 17.4481C-0.127153 16.8742 -0.12712 15.9438 0.381409 15.3699L6.13811 8.87479Z" fill="#1C2C42"/>
                </svg>
                <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">Reminder repeats</span>
              </button>
              <button
                onClick={getCurrentConfig() !== null ? () => onClose(getCurrentConfig()) : undefined}
                disabled={getCurrentConfig() === null}
                className={`flex items-center justify-center relative shrink-0 size-[50px] ${getCurrentConfig() !== null ? 'cursor-pointer' : 'cursor-default'}`}
                data-name="done-button"
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                  <g>
                    <rect fill={getCurrentConfig() !== null ? "#4784F8" : "#D9D9D9"} height="50" rx="25" width="50" />
                    <path d={tickSvgPaths.p1635b2f0} fill={getCurrentConfig() !== null ? "#F0FAFE" : "white"} id="tick-icon" />
                  </g>
                </svg>
              </button>
            </div>
            <div className="mt-[34px] w-full flex flex-col gap-[30px] overflow-y-auto flex-1 min-h-0 pb-[10px]">
              {/* Custom Days */}
              <div>
                <button
                  onClick={() => toggleFrequency('custom-days')}
                  className="w-full h-[50px] flex items-center justify-center px-[18px] rounded-[25px] cursor-pointer border-none"
                  style={{ backgroundColor: activeFrequency === 'custom-days' ? "#E4E4E4" : "#F5F5F5" }}
                >
                  <span
                    className="font-['Lato:Bold',sans-serif] not-italic text-[17px] whitespace-nowrap"
                    style={{ color: activeFrequency === 'custom-days' ? "#1C2C42" : "#939393" }}
                  >
                    Custom days
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: activeFrequency === 'custom-days' ? customDaysHeight : 0 }}
                >
                  <div ref={customDaysRef}>
                    <div className="content-stretch flex flex-col items-center justify-center px-[20px] relative w-full" data-name="container-frame">
                      <div className="flex flex-col gap-[25px] items-start py-[40px] w-fit mx-auto" data-name="weekdays">
                        {WEEKDAYS.map(day => {
                          const isChecked = selectedDays.has(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              className="content-stretch flex gap-[16px] items-center relative shrink-0 cursor-pointer border-none bg-transparent p-0"
                              data-name="Weekday"
                            >
                              <div className="relative shrink-0 size-[25px]" data-name="Checkbox">
                                {isChecked ? (
                                  <div className="bg-[#4784f8] flex flex-col items-start pb-[7px] pt-[8px] px-[6px] rounded-[12.5px] size-full">
                                    <div className="h-[9.58px] relative shrink-0 w-[12.491px]">
                                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.4913 9.58041">
                                        <path d={checkSvg.p30409b00} fill="#FEF6EA" />
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                                    <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke="#939393" strokeWidth="2" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-left whitespace-nowrap"
                                style={{ color: isChecked ? "#1C2C42" : "#939393" }}
                              >
                                <p className="leading-[normal]">Every {day}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-1px_0_0_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 381 1">
                            <line stroke="#EDEDED" strokeLinecap="round" x1="0.5" x2="380.5" y1="0.5" y2="0.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Hourly */}
              <div>
                <button
                  onClick={() => toggleFrequency('hourly')}
                  className="w-full h-[50px] flex items-center justify-center px-[18px] rounded-[25px] cursor-pointer border-none"
                  style={{ backgroundColor: activeFrequency === 'hourly' ? "#E4E4E4" : "#F5F5F5" }}
                >
                  <span
                    className="font-['Lato:Bold',sans-serif] not-italic text-[17px] whitespace-nowrap"
                    style={{ color: activeFrequency === 'hourly' ? "#1C2C42" : "#939393" }}
                  >
                    Hourly
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: activeFrequency === 'hourly' ? hourlyHeight : 0 }}
                >
                  <div ref={hourlyRef}>
                    <div className="content-stretch flex flex-col items-center justify-center px-[20px] relative w-full" data-name="container-frame">
                      <div className="flex items-center justify-between py-[40px] w-full" data-name="content">
                        <button
                          onClick={() => setHourlyCount(c => Math.max(1, c - 1))}
                          disabled={hourlyCount === 1}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0] disabled:cursor-not-allowed"
                          data-name="minus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill={hourlyCount === 1 ? "#F5F5F5" : "#4784F8"} height="50" rx="25" width="50" />
                            <path d={repeatSvg.p18547e00} fill="white" />
                          </svg>
                        </button>
                        <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[17px] flex-1 text-center px-[10px]">
                          {hourlyCount === 1
                            ? <>Repeats every hour</>
                            : <>Repeats every {hourlyCount} hours</>
                          }
                        </span>
                        <button
                          onClick={() => setHourlyCount(c => c + 1)}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0]"
                          data-name="plus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill="#4784F8" height="50" rx="25" width="50" />
                            <path d={repeatSvg.p1a616800} fill="white" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-1px_0_0_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 381 1">
                            <line stroke="#EDEDED" strokeLinecap="round" x1="0.5" x2="380.5" y1="0.5" y2="0.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Daily */}
              <div>
                <button
                  onClick={() => toggleFrequency('daily')}
                  className="w-full h-[50px] flex items-center justify-center px-[18px] rounded-[25px] cursor-pointer border-none"
                  style={{ backgroundColor: activeFrequency === 'daily' ? "#E4E4E4" : "#F5F5F5" }}
                >
                  <span
                    className="font-['Lato:Bold',sans-serif] not-italic text-[17px] whitespace-nowrap"
                    style={{ color: activeFrequency === 'daily' ? "#1C2C42" : "#939393" }}
                  >
                    Daily
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: activeFrequency === 'daily' ? contentHeight : 0 }}
                >
                  <div ref={contentRef}>
                    <div className="content-stretch flex flex-col items-center justify-center px-[20px] relative w-full" data-name="container-frame">
                      <div className="flex items-center justify-between py-[40px] w-full" data-name="content">
                        <button
                          onClick={() => setRepeatCount(c => Math.max(1, c - 1))}
                          disabled={repeatCount === 1}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0] disabled:cursor-not-allowed"
                          data-name="minus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill={repeatCount === 1 ? "#F5F5F5" : "#4784F8"} height="50" rx="25" width="50" />
                            <path d={repeatSvg.p18547e00} fill="white" />
                          </svg>
                        </button>
                        <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[17px] flex-1 text-center px-[10px]">
                          {repeatCount === 1
                            ? <>Repeats every day</>
                            : <>Repeats every {repeatCount} days</>
                          }
                        </span>
                        <button
                          onClick={() => setRepeatCount(c => c + 1)}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0]"
                          data-name="plus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill="#4784F8" height="50" rx="25" width="50" />
                            <path d={repeatSvg.p1a616800} fill="white" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-1px_0_0_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 381 1">
                            <line stroke="#EDEDED" strokeLinecap="round" x1="0.5" x2="380.5" y1="0.5" y2="0.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Weekly */}
              <div>
                <button
                  onClick={() => toggleFrequency('weekly')}
                  className="w-full h-[50px] flex items-center justify-center px-[18px] rounded-[25px] cursor-pointer border-none"
                  style={{ backgroundColor: activeFrequency === 'weekly' ? "#E4E4E4" : "#F5F5F5" }}
                >
                  <span
                    className="font-['Lato:Bold',sans-serif] not-italic text-[17px] whitespace-nowrap"
                    style={{ color: activeFrequency === 'weekly' ? "#1C2C42" : "#939393" }}
                  >
                    Weekly
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: activeFrequency === 'weekly' ? weeklyHeight : 0 }}
                >
                  <div ref={weeklyRef}>
                    <div className="content-stretch flex flex-col items-center justify-center px-[20px] relative w-full" data-name="container-frame">
                      <div className="flex items-center justify-between py-[40px] w-full" data-name="content">
                        <button
                          onClick={() => setWeeklyCount(c => Math.max(1, c - 1))}
                          disabled={weeklyCount === 1}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0] disabled:cursor-not-allowed"
                          data-name="minus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill={weeklyCount === 1 ? "#F5F5F5" : "#4784F8"} height="50" rx="25" width="50" />
                            <path d={repeatSvg.p18547e00} fill="white" />
                          </svg>
                        </button>
                        <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[17px] flex-1 text-center px-[10px]">
                          {weeklyCount === 1
                            ? <>Repeats every week</>
                            : <>Repeats every {weeklyCount} weeks</>
                          }
                        </span>
                        <button
                          onClick={() => setWeeklyCount(c => c + 1)}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0]"
                          data-name="plus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill="#4784F8" height="50" rx="25" width="50" />
                            <path d={repeatSvg.p1a616800} fill="white" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-1px_0_0_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 381 1">
                            <line stroke="#EDEDED" strokeLinecap="round" x1="0.5" x2="380.5" y1="0.5" y2="0.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Monthly */}
              <div>
                <button
                  onClick={() => toggleFrequency('monthly')}
                  className="w-full h-[50px] flex items-center justify-center px-[18px] rounded-[25px] cursor-pointer border-none"
                  style={{ backgroundColor: activeFrequency === 'monthly' ? "#E4E4E4" : "#F5F5F5" }}
                >
                  <span
                    className="font-['Lato:Bold',sans-serif] not-italic text-[17px] whitespace-nowrap"
                    style={{ color: activeFrequency === 'monthly' ? "#1C2C42" : "#939393" }}
                  >
                    Monthly
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: activeFrequency === 'monthly' ? monthlyHeight : 0 }}
                >
                  <div ref={monthlyRef}>
                    <div className="content-stretch flex flex-col items-center justify-center px-[20px] relative w-full" data-name="container-frame">
                      <div className="flex items-center justify-between py-[40px] w-full" data-name="content">
                        <button
                          onClick={() => setMonthlyCount(c => Math.max(1, c - 1))}
                          disabled={monthlyCount === 1}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0] disabled:cursor-not-allowed"
                          data-name="minus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill={monthlyCount === 1 ? "#F5F5F5" : "#4784F8"} height="50" rx="25" width="50" />
                            <path d={repeatSvg.p18547e00} fill="white" />
                          </svg>
                        </button>
                        <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[17px] flex-1 text-center px-[10px]">
                          {monthlyCount === 1
                            ? <>Repeats every month</>
                            : <>Repeats every {monthlyCount} months</>
                          }
                        </span>
                        <button
                          onClick={() => setMonthlyCount(c => c + 1)}
                          className="relative shrink-0 size-[50px] cursor-pointer border-none bg-transparent p-0 leading-[0]"
                          data-name="plus-btn"
                        >
                          <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                            <rect fill="#4784F8" height="50" rx="25" width="50" />
                            <path d={repeatSvg.p1a616800} fill="white" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-1px_0_0_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 381 1">
                            <line stroke="#EDEDED" strokeLinecap="round" x1="0.5" x2="380.5" y1="0.5" y2="0.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
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
