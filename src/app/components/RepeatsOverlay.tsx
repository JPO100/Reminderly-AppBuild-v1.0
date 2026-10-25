import { useState, useRef, useEffect } from "react";
import svgPaths from "../../imports/svg-prkucc25l";
import repeatSvg from "../../imports/svg-upkw3rt5ea";
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
        <div className="flex flex-col items-start pt-[24px] px-[24px] pb-[24px] relative w-full flex-1 min-h-0">
          <div className="bg-white w-full flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between w-full h-[45px] shrink-0">
              <button
                onClick={() => onClose()}
                className="flex items-center justify-center cursor-pointer shrink-0 bg-transparent border-none p-0 size-[45px]"
                data-name="cancel-button"
              >
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0">
                  <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
                  <path d="M24.1677 15.8766C24.6128 15.3745 25.3346 15.3745 25.7797 15.8766C26.2247 16.3788 26.2247 17.1929 25.7797 17.6951L21.5685 22.4462L25.8749 27.3049C26.3199 27.8071 26.3199 28.6212 25.8749 29.1234C25.4298 29.6256 24.708 29.6256 24.2629 29.1234L19.3296 23.5572C19.259 23.5071 19.192 23.4476 19.1306 23.3783C18.6856 22.8761 18.6856 22.062 19.1306 21.5599L24.1677 15.8766Z" fill="white"/>
                </svg>
              </button>
              <span className="flex-1 min-w-0 text-center font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">Reminder repeats</span>
              <button
                onClick={getCurrentConfig() !== null ? () => onClose(getCurrentConfig()) : undefined}
                disabled={getCurrentConfig() === null}
                className={`flex items-center justify-center relative shrink-0 size-[45px] bg-transparent border-none p-0 ${getCurrentConfig() !== null ? 'cursor-pointer' : 'cursor-default'}`}
                data-name="done-button"
              >
                <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0">
                  <rect x="0.9" y="0.9" width="43.2" height="43.2" rx="21.6" fill={getCurrentConfig() !== null ? "#4784F8" : "#D9D9D9"}/>
                  <rect x="0.9" y="0.9" width="43.2" height="43.2" rx="21.6" stroke={getCurrentConfig() !== null ? "#4784F8" : "#D9D9D9"} strokeWidth="1.8"/>
                  <path d="M27.7861 16.7139C28.4568 16.0291 29.5439 16.0285 30.2148 16.7129C30.8857 17.3979 30.8857 18.5093 30.2148 19.1943L21.3105 28.2871C20.9726 28.632 20.5288 28.8024 20.0859 28.7998C19.6441 28.8114 19.1982 28.6501 18.8535 28.3135L14.8203 24.375C14.1345 23.7052 14.1095 22.5943 14.7646 21.8945C15.4201 21.195 16.5075 21.171 17.1934 21.8408L20.041 24.6221L27.7861 16.7139Z" fill="white" id="tick-icon"/>
                </svg>
              </button>
            </div>
            <div className="mt-[24px] w-full flex flex-col gap-[30px] overflow-y-auto flex-1 min-h-0">
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
                    <div className="content-stretch flex flex-col items-center justify-center relative w-full" data-name="container-frame">
                      <div className="flex items-center justify-between gap-[2px] py-[40px] w-full" data-name="weekdays">
                        {WEEKDAYS.map(day => {
                          const isChecked = selectedDays.has(day);
                          // 45px circles; below 375pt wide they shrink so all seven fit with 2px gaps
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              aria-label={day}
                              aria-pressed={isChecked}
                              className="flex items-center justify-center shrink-0 aspect-square rounded-full cursor-pointer border-none p-0"
                              style={{ width: "min(45px, calc((100% - 12px) / 7))", backgroundColor: isChecked ? "#4784F8" : "#D9D9D9" }}
                              data-name="Weekday"
                            >
                              <span className="font-['Lato:Bold',sans-serif] not-italic text-[17px] text-white leading-[normal]">{day[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-0 relative shrink-0 w-[calc(100%-40px)]">
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
