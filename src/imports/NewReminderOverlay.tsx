import svgPaths from "./svg-k8owpv3rm6";
import { parseTokens, type ParsedToken, type TokenCategory, type NlcRecognitionConfig } from "../app/utils/nlc-parser";
import {
  parseDateTokenValue,
  parseTimeTokenValue,
  parseRepeatsTokenValue,
  computeEligibleTokens,
  computeInvalidation,
  computeAutoApplyResult,
  isCompoundTimeToken,
  getRepeatsImpliedTime,
  type NlcMode,
} from "../app/utils/nlc-interaction";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import TimePicker from "./TimePicker";
import type { RepeatConfig } from "../app/reminder-utils";
import type { Reminder, ReminderAttachment } from "../app/reminder-utils";
import type { ReminderSchedule } from "../app/reminder-utils";
import { validateAttachment, resolveMimeType, saveAttachment, deleteAttachment } from "../app/utils/attachment-storage";
import { Filesystem, Directory } from "@capacitor/filesystem";
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore — Vite ?url import returns a string asset URL
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Camera, CameraSource, CameraResultType } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { FileOpener } from "@capacitor-community/file-opener";
import type { RepeatRule } from "../app/types/reminder";
import { repeatConfigToRule } from "../app/utils/repeat-conversion";
import { formatShortMonthDay } from "../app/utils/date-display";
import { buildSmartReminderText, getSmartReminderTime, storageStringToDate, type CreatedList } from "../app/utils/list-utils";
import { normaliseReminderText } from "../app/utils/normalise-text";

// Minimal id generator (local to overlay, matches App.tsx pattern)
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Boundary conversion helpers (submit-only, local time)
function toYyyyMmDd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toHhMm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Date utility functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOffset(year: number, month: number): number {
  // Get day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDay = new Date(year, month, 1).getDay();
  // Convert to Monday-first (0=Mon, 1=Tue, ..., 6=Sun)
  return firstDay === 0 ? 6 : firstDay - 1;
}

function formatMonthYear(year: number, month: number): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[month]} ${year}`;
}

function isSameDate(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function formatSelectedDate(date: Date | null, now?: Date): string | null {
  if (!date) return null;
  
  const today = now ? new Date(now) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  
  if (compare.getTime() === today.getTime()) return 'Today';
  if (compare.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return formatShortMonthDay(compare, now ?? new Date());
}

// Time display formatting
function formatSelectedTime(time: { hour: number; minute: number } | null): string | null {
  if (!time) return null;
  const h24 = time.hour;
  const period = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  if (time.minute === 0) {
    return `${h12}${period}`;
  }
  return `${h12}:${String(time.minute).padStart(2, '0')}${period}`;
}

// Repeat display formatting
function formatRepeatConfig(config: RepeatConfig): string | null {
  if (!config) return null;
  const { frequency, interval } = config;
  if (frequency === 'custom-days' && config.selectedDays) {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortNames: Record<string, string> = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thur',
      Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
    };
    const sorted = config.selectedDays
      .slice()
      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    if (sorted.length === 7) return 'Every day';
    if (sorted.length === 5 && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].every(d => sorted.includes(d))) return 'Weekdays';
    return sorted.map(d => shortNames[d] ?? d).join(', ');
  }
  const unitMap: Record<string, [string, string]> = {
    hourly: ['hour', 'hours'],
    daily: ['day', 'days'],
    weekly: ['week', 'weeks'],
    monthly: ['month', 'months'],
    yearly: ['year', 'years'],
  };
  const [singular, plural] = unitMap[frequency] ?? ['', ''];
  if (interval === 1) return `Every ${singular}`;
  return `Every ${interval} ${plural}`;
}

// Interactive Calendar Component
function InteractiveCalendar({ selectedDate, onDateSelect }: { selectedDate: Date | null; onDateSelect: (date: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOffset(viewYear, viewMonth);
  const numDateRows = Math.ceil((firstDayOffset + daysInMonth) / 7);
  const gridRowsValue = `16px${' 42px'.repeat(numDateRows)}`;
  
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };
  
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) handlePrevMonth();
    else handleNextMonth();
  };

  const handleDayClick = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    
    // Don't allow selecting past dates
    if (date < today) return;
    
    onDateSelect(date);
  };
  
  return (
    <div className="content-stretch flex flex-col items-center pb-[20px] relative w-full" data-name="date-picker">
      <div aria-hidden="true" className="absolute border-[#EDEDED] border-solid border-t inset-0 pointer-events-none" />
      
      {/* Top - Month and Year */}
      <div className="relative shrink-0 w-full max-w-[340px] min-w-[280px] pt-[20px] pb-[16px] px-[4px]" data-name="top">
        <div className="flex flex-row items-center justify-between size-full">
          <div className="content-stretch flex gap-[3px] items-center relative shrink-0" data-name="month-year">
            <p className="font-['Lato:Bold',sans-serif] leading-[normal] relative shrink-0 text-[17px] text-[#1C2C42] tracking-[-0.2px]">
              {formatMonthYear(viewYear, viewMonth)}
            </p>
          </div>
          <div
            className="content-stretch flex items-center justify-end gap-[32px] leading-[normal] ml-auto relative shrink-0 text-[#0088fe] text-nowrap"
            data-name="arrow-btns"
          >
            <button
              onClick={handlePrevMonth}
              className="relative shrink-0 cursor-pointer select-none bg-transparent border-none p-0 flex items-center justify-center"
              style={{ width: "9px", height: "15px" }}
              type="button"
              aria-label="Previous month"
            >
              <svg width="9" height="15" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.9209 0C9.1875 0 9.43066 0.0654297 9.64941 0.195312C9.87472 0.318336 10.0528 0.489446 10.1826 0.708008C10.3123 0.926614 10.377 1.17309 10.377 1.44629C10.3768 1.84257 10.2235 2.19153 9.91602 2.49219L3.4248 8.80859L9.91602 15.1143C10.2235 15.4218 10.377 15.7775 10.377 16.1807C10.377 16.4473 10.3125 16.6904 10.1826 16.9092C10.0528 17.1277 9.87478 17.3018 9.64941 17.4316C9.43066 17.5615 9.1875 17.627 8.9209 17.627C8.51782 17.627 8.1796 17.4899 7.90625 17.2168L0.523438 9.97754C0.338867 9.7998 0.205078 9.61816 0.123047 9.43359C0.0410748 9.24233 5.91461e-05 9.03399 0 8.80859C0 8.58317 0.0411364 8.37782 0.123047 8.19336C0.205078 8.00195 0.338867 7.81738 0.523438 7.63965L7.90625 0.410156C8.17964 0.136882 8.5177 0 8.9209 0Z" fill="#0088FE"/>
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="relative shrink-0 cursor-pointer select-none bg-transparent border-none p-0 flex items-center justify-center"
              style={{ width: "9px", height: "15px" }}
              type="button"
              aria-label="Next month"
            >
              <svg width="9" height="15" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(11 0) scale(-1 1)">
                  <path d="M8.9209 0C9.1875 0 9.43066 0.0654297 9.64941 0.195312C9.87472 0.318336 10.0528 0.489446 10.1826 0.708008C10.3123 0.926614 10.377 1.17309 10.377 1.44629C10.3768 1.84257 10.2235 2.19153 9.91602 2.49219L3.4248 8.80859L9.91602 15.1143C10.2235 15.4218 10.377 15.7775 10.377 16.1807C10.377 16.4473 10.3125 16.6904 10.1826 16.9092C10.0528 17.1277 9.87478 17.3018 9.64941 17.4316C9.43066 17.5615 9.1875 17.627 8.9209 17.627C8.51782 17.627 8.1796 17.4899 7.90625 17.2168L0.523438 9.97754C0.338867 9.7998 0.205078 9.61816 0.123047 9.43359C0.0410748 9.24233 5.91461e-05 9.03399 0 8.80859C0 8.58317 0.0411364 8.37782 0.123047 8.19336C0.205078 8.00195 0.338867 7.81738 0.523438 7.63965L7.90625 0.410156C8.17964 0.136882 8.5177 0 8.9209 0Z" fill="#0088FE"/>
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Month - Calendar Grid */}
      <div className="gap-[8px] grid grid-cols-7 pt-[9px] relative shrink-0 w-full max-w-[340px] min-w-[280px]" data-name="month" style={{ gridTemplateRows: gridRowsValue, touchAction: 'pan-y' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Day headers */}
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
          <p key={day} className="font-['Lato',sans-serif] font-[600] justify-self-center leading-[normal] relative self-start shrink-0 text-[13px] text-[rgba(0,0,0,0.2)] text-center" style={{ gridColumn: i + 1, gridRow: 1 }}>
            {day}
          </p>
        ))}
        
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ gridColumn: i + 1, gridRow: 2 }} />
        ))}
        
        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const row = Math.floor((i + firstDayOffset) / 7) + 2;
          const col = ((i + firstDayOffset) % 7) + 1;
          const currentDate = new Date(viewYear, viewMonth, day);
          currentDate.setHours(0, 0, 0, 0);
          
          const isSelected = isSameDate(selectedDate, currentDate);
          const isPast = currentDate < today;
          
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={isPast}
              className={`${isSelected ? 'bg-[#08f]' : ''} content-stretch flex flex-col h-[42px] items-center justify-center justify-self-stretch relative rounded-[99px] shrink-0 ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ gridColumn: col, gridRow: row }}
              data-name="datepicker-day"
            >
              <p className={`font-['Lato:Bold',sans-serif] leading-[normal] relative shrink-0 text-[17px] text-center ${isSelected ? 'text-white' : isPast ? 'text-[#D9D9D9]' : 'text-[#1C2C42]'}`}>
                {day}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddTickBtn({ active, onSubmit }: { active: boolean; onSubmit?: () => void }) {
  return (
    <button
      className={`flex items-center justify-center relative shrink-0 size-[45px] ${active ? 'cursor-pointer' : 'cursor-default'}`}
      data-name="add-tick-btn"
      disabled={!active}
      onClick={active ? onSubmit : undefined}
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
        <g id="add-tick-btn">
          <rect fill={active ? "#4784F8" : "#D9D9D9"} height="50" rx="25" width="50" />
          <path d={svgPaths.p1635b2f0} fill={active ? "#F0FAFE" : "white"} id="tick-icon" />
        </g>
      </svg>
    </button>
  );
}

function Header({ isSubmitActive, onSubmit, title }: { isSubmitActive: boolean; onSubmit?: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between w-full" data-name="header">
      <span className="font-['Lato:Bold',sans-serif] not-italic text-[#1C2C42] text-[20px] whitespace-nowrap">{title}</span>
      <AddTickBtn active={isSubmitActive} onSubmit={onSubmit} />
    </div>
  );
}

function IconDetails({ isOn, selectedDate, onLabelClick }: { isOn: boolean; selectedDate: Date | null; onLabelClick?: () => void }) {
  const color = isOn ? "#1C2C42" : "#B7B7B7";
  const dateLabel = isOn ? formatSelectedDate(selectedDate) : null;
  return (
    <div className="content-stretch flex gap-[16px] items-center relative min-w-0 flex-1" data-name="icon-details">
      <div className="relative shrink-0 size-[25px]" data-name="icon-schedule-set">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
          <g id="icon-schedule-set">
            <mask fill="white" id="path-1-inside-1_11_868_date">
              <path d={svgPaths.p37c4f500} />
            </mask>
            <path d={svgPaths.pde59c80} fill={color} mask="url(#path-1-inside-1_11_868_date)" />
          </g>
        </svg>
      </div>
      <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[17px] min-w-[68px]" style={{ color }}>Date</p>
      {dateLabel && (
        <p className="font-['Lato',sans-serif] font-[600] leading-[23px] not-italic relative text-[17px] text-[#4784F8] ml-[4px] cursor-pointer truncate" onClick={onLabelClick}>{dateLabel}</p>
      )}
    </div>
  );
}

function IconDetails1({ isOn, selectedTime, onLabelClick }: { isOn: boolean; selectedTime: { hour: number; minute: number } | null; onLabelClick?: () => void }) {
  const color = isOn ? "#1C2C42" : "#B7B7B7";
  const timeLabel = isOn ? formatSelectedTime(selectedTime) : null;
  return (
    <div className="content-stretch flex gap-[16px] items-center relative min-w-0 flex-1" data-name="icon-details">
      <div className="relative shrink-0 size-[25px]" data-name="icon-schedule-set">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
          <g id="icon-schedule-set">
            <mask fill="white" id="path-1-inside-1_11_868_time">
              <path d={svgPaths.p37c4f500} />
            </mask>
            <path d={svgPaths.pde59c80} fill={color} mask="url(#path-1-inside-1_11_868_time)" />
          </g>
        </svg>
      </div>
      <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[17px] min-w-[68px]" style={{ color }}>Time</p>
      {timeLabel && (
        <p className="font-['Lato',sans-serif] font-[600] leading-[23px] not-italic relative text-[17px] text-[#4784F8] ml-[4px] cursor-pointer truncate" onClick={onLabelClick}>{timeLabel}</p>
      )}
    </div>
  );
}

function IconDetails2({ isOn, repeatConfig, onLabelClick, inactiveColor = "#B7B7B7" }: { isOn: boolean; repeatConfig: RepeatConfig; onLabelClick?: () => void; inactiveColor?: string }) {
  const color = isOn ? "#1C2C42" : inactiveColor;
  const repeatLabel = isOn ? formatRepeatConfig(repeatConfig) : null;
  return (
    <div className="content-stretch flex gap-[16px] items-center relative min-w-0 flex-1" data-name="icon-details">
      <div className="h-[25.071px] relative shrink-0 w-[25px]" data-name="icon-repeats">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0003 25.0708">
          <g id="icon-repeats">
            <path d={svgPaths.p19a7b000} fill={color} />
            <path d={svgPaths.p9f3c880} fill={color} />
            <path d={svgPaths.pf2d2300} fill={color} />
          </g>
        </svg>
      </div>
      <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[17px] min-w-[68px]" style={{ color }}>Repeats</p>
      {repeatLabel && (
        <p className="font-['Lato',sans-serif] font-[600] leading-[23px] not-italic relative text-[17px] text-[#4784F8] ml-[4px] cursor-pointer truncate" onClick={onLabelClick}>{repeatLabel}</p>
      )}
    </div>
  );
}

function ToggleBtn({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <div className="h-[30px] relative shrink-0 w-[56px]" data-name="toggle-btn" onClick={onToggle} style={{ cursor: 'pointer' }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
        <g id="toggle-btn">
          <rect fill={isOn ? "#4784F8" : "#D9D9D9"} height="30" rx="15" width="56" />
          <circle cx={isOn ? "41" : "15"} cy="15" fill="white" id="btn" r="11.25" style={{ transition: 'cx 0.2s ease' }} />
        </g>
      </svg>
    </div>
  );
}

function SetDateFrame({ isDateOn, onDateToggle, selectedDate, onLabelClick }: { isDateOn: boolean; onDateToggle: () => void; selectedDate: Date | null; onLabelClick?: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full" data-name="set-date-frame">
      <IconDetails isOn={isDateOn} selectedDate={selectedDate} onLabelClick={onLabelClick} />
      <ToggleBtn isOn={isDateOn} onToggle={onDateToggle} />
    </div>
  );
}

function SetDate({ 
  isDateOn, 
  onDateToggle, 
  selectedDate, 
  onDateSelect,
  isDrawerOpen,
  onLabelClick 
}: { 
  isDateOn: boolean; 
  onDateToggle: () => void; 
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isDrawerOpen: boolean;
  onLabelClick: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="set-date">
      <SetDateFrame isDateOn={isDateOn} onDateToggle={onDateToggle} selectedDate={selectedDate} onLabelClick={onLabelClick} />
      
      {/* Animated Calendar Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <div className="pt-[20px]">
              <InteractiveCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
            </div>
            <div
              aria-hidden="true"
              className="border-[#EDEDED] border-solid border-b w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SetTimeFrame({ isTimeOn, onTimeToggle, selectedTime, onLabelClick }: { isTimeOn: boolean; onTimeToggle: () => void; selectedTime: { hour: number; minute: number } | null; onLabelClick?: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full" data-name="set-time-frame">
      <IconDetails1 isOn={isTimeOn} selectedTime={selectedTime} onLabelClick={onLabelClick} />
      <ToggleBtn isOn={isTimeOn} onToggle={onTimeToggle} />
    </div>
  );
}

function SetTime({ 
  isTimeOn, 
  onTimeToggle, 
  selectedTime,
  onTimeSelect,
  isDrawerOpen,
  onLabelClick,
  useOneMinuteIncrements = false,
}: { 
  isTimeOn: boolean; 
  onTimeToggle: () => void; 
  selectedTime: { hour: number; minute: number } | null;
  onTimeSelect: (time: { hour: number; minute: number }) => void;
  isDrawerOpen: boolean;
  onLabelClick: () => void;
  useOneMinuteIncrements?: boolean;
}) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="set-time">
      <SetTimeFrame isTimeOn={isTimeOn} onTimeToggle={onTimeToggle} selectedTime={selectedTime} onLabelClick={onLabelClick} />
      
      {/* Animated Time Picker Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <div className="pt-[20px]">
              <TimePicker selectedTime={selectedTime} onTimeSelect={onTimeSelect} useOneMinuteIncrements={useOneMinuteIncrements} />
            </div>
            <div
              aria-hidden="true"
              className="border-[#EDEDED] border-solid border-b w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SetRepeatsFrame({ isRepeatsOn, onRepeatsToggle, repeatConfig, onLabelClick, inactiveColor }: { isRepeatsOn: boolean; onRepeatsToggle: () => void; repeatConfig: RepeatConfig; onLabelClick?: () => void; inactiveColor?: string }) {
  return (
    <div className="content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full" data-name="set-repeats-frame">
      <IconDetails2 isOn={isRepeatsOn} repeatConfig={repeatConfig} onLabelClick={onLabelClick} inactiveColor={inactiveColor} />
      <ToggleBtn isOn={isRepeatsOn} onToggle={onRepeatsToggle} />
    </div>
  );
}

function SetRepeats({ isRepeatsOn, onRepeatsToggle, repeatConfig, onLabelClick, disabled, keepFullOpacityWhenDisabled = false, inactiveColor }: { isRepeatsOn: boolean; onRepeatsToggle: () => void; repeatConfig: RepeatConfig; onLabelClick?: () => void; disabled?: boolean; keepFullOpacityWhenDisabled?: boolean; inactiveColor?: string }) {
  return (
    <div className={`content-stretch flex flex-col items-start relative shrink-0 w-full transition-opacity duration-200 ${disabled ? `${keepFullOpacityWhenDisabled ? '' : 'opacity-30 '}pointer-events-none` : ''}`} data-name="set-repeats">
      <SetRepeatsFrame isRepeatsOn={isRepeatsOn} onRepeatsToggle={onRepeatsToggle} repeatConfig={repeatConfig} onLabelClick={onLabelClick} inactiveColor={inactiveColor} />
    </div>
  );
}

function ReminderOptions({ 
  isDateOn, 
  onDateToggle, 
  selectedDate,
  onDateSelect,
  isTimeOn, 
  onTimeToggle,
  selectedTime,
  onTimeSelect,
  isRepeatsOn, 
  onRepeatsToggle,
  repeatConfig,
  openDrawer,
  onDateLabelClick,
  onTimeLabelClick,
  onRepeatsLabelClick,
  useOneMinuteIncrements = false,
  disableRepeats = false,
  repeatInactiveColor,
}: { 
  isDateOn: boolean; 
  onDateToggle: () => void; 
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isTimeOn: boolean; 
  onTimeToggle: () => void;
  selectedTime: { hour: number; minute: number } | null;
  onTimeSelect: (time: { hour: number; minute: number }) => void;
  isRepeatsOn: boolean; 
  onRepeatsToggle: () => void;
  repeatConfig: RepeatConfig;
  openDrawer: 'date' | 'time' | 'repeats' | null;
  onDateLabelClick: () => void;
  onTimeLabelClick: () => void;
  onRepeatsLabelClick: () => void;
  useOneMinuteIncrements?: boolean;
  disableRepeats?: boolean;
  repeatInactiveColor?: string;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full flex-1 min-h-0 overflow-y-auto" data-name="reminder-options">
      <SetDate 
        isDateOn={isDateOn} 
        onDateToggle={onDateToggle} 
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        isDrawerOpen={openDrawer === 'date'}
        onLabelClick={onDateLabelClick}
      />
      <SetTime isTimeOn={isTimeOn} onTimeToggle={onTimeToggle} selectedTime={selectedTime} onTimeSelect={onTimeSelect} isDrawerOpen={openDrawer === 'time'} onLabelClick={onTimeLabelClick} useOneMinuteIncrements={useOneMinuteIncrements} />
      <SetRepeats isRepeatsOn={isRepeatsOn} onRepeatsToggle={onRepeatsToggle} repeatConfig={repeatConfig} onLabelClick={onRepeatsLabelClick} disabled={disableRepeats || (!isDateOn && !isTimeOn)} keepFullOpacityWhenDisabled={disableRepeats} inactiveColor={repeatInactiveColor} />
    </div>
  );
}

function NewReminderElements({ onRepeatsOverlayOpen, repeatConfig, onRepeatConfigChange, isRepeatsOverlayOpen, addReminder, onClose, nlcMode, nlcEnabled, nlcRecognition, editReminder, updateReminder, smartReminderCreateList, onCreateSmartReminder, useOneMinuteIncrements = false, autoFocusReady = false, isReminderAttachmentsEnabled = false }: { onRepeatsOverlayOpen?: () => void; repeatConfig: RepeatConfig; onRepeatConfigChange: (config: RepeatConfig) => void; isRepeatsOverlayOpen: boolean; addReminder: (reminder: Reminder) => void; onClose: () => void; nlcMode: NlcMode; nlcEnabled: boolean; nlcRecognition?: NlcRecognitionConfig; editReminder?: Reminder | null; updateReminder?: (reminder: Reminder) => void; smartReminderCreateList?: CreatedList | null; onCreateSmartReminder?: (payload: { listId: string; date: string; time: string }) => void; useOneMinuteIncrements?: boolean; autoFocusReady?: boolean; isReminderAttachmentsEnabled?: boolean }) {
  const isEditMode = !!editReminder;
  const isSmartReminderCreate = !!smartReminderCreateList;
  const isSmartReminderEdit = editReminder?.isSmartReminder === true;
  const isSmartReminderMode = isSmartReminderEdit || isSmartReminderCreate;

  const [isDateOn, setIsDateOn] = useState(() => {
    if (smartReminderCreateList) return true;
    if (editReminder?.schedule.kind === 'scheduled') return true;
    return false;
  });
  const [isTimeOn, setIsTimeOn] = useState(() => {
    if (smartReminderCreateList) return true;
    if (editReminder?.schedule.kind === 'scheduled' && editReminder.schedule.time) return true;
    return false;
  });
  const [isRepeatsOn, setIsRepeatsOn] = useState(() => {
    if (editReminder?.repeatRule != null) return true;
    return false;
  });
  const [openDrawer, setOpenDrawer] = useState<'date' | 'time' | 'repeats' | null>(() => {
    if (isSmartReminderMode) return 'date';
    return null;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (smartReminderCreateList) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    if (editReminder?.schedule.kind === 'scheduled') {
      const [y, m, d] = editReminder.schedule.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    return null;
  });
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(() => {
    if (smartReminderCreateList) {
      return { hour: 12, minute: 0 };
    }
    if (editReminder?.schedule.kind === 'scheduled' && editReminder.schedule.time) {
      const [hh, mm] = editReminder.schedule.time.split(':').map(Number);
      return { hour: hh, minute: mm };
    }
    return null;
  });
  const [reminderText, setReminderText] = useState(() => {
    if (smartReminderCreateList) return buildSmartReminderText(smartReminderCreateList);
    if (editReminder) return editReminder.originalText;
    return '';
  });
  const [showAttachmentOverlay, setShowAttachmentOverlay] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ fileName: string; mimeType: string; dataBase64: string; previewDataUrl?: string } | null>(null);
  const [attachmentError, setAttachmentError] = useState<{ title: string; message: string } | null>(null);
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] = useState(false);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  useEffect(() => { setImagePreviewFailed(false); }, [pendingAttachment]);
  const attachmentDeletedRef = useRef(false);

  // Load existing attachment when editing a reminder that has one
  useEffect(() => {
    if (!editReminder?.attachment) return;
    const { fileName, mimeType, storagePath } = editReminder.attachment;
    let cancelled = false;
    (async () => {
      try {
        const result = await Filesystem.readFile({
          path: storagePath,
          directory: Directory.Data,
        });
        if (cancelled) return;
        const dataBase64 = typeof result.data === 'string' ? result.data : '';

        // Generate PDF preview if applicable
        let previewDataUrl: string | undefined;
        if (mimeType === 'application/pdf') {
          try {
            const binaryString = atob(dataBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const pdf = await pdfjsLib.getDocument({ data: bytes.buffer }).promise;
            const page = await pdf.getPage(1);
            const vp = page.getViewport({ scale: 1 });
            const scale = 90 / vp.width;
            const scaled = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = scaled.width;
            canvas.height = scaled.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: scaled }).promise;
              previewDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            }
            pdf.destroy();
          } catch {
            // PDF preview generation failed — Generic File fallback
          }
        }

        if (cancelled) return;
        setPendingAttachment({ fileName, mimeType, dataBase64, previewDataUrl });
      } catch {
        // File read failed — attachment may have been deleted externally
      }
    })();
    return () => { cancelled = true; };
  }, [editReminder]);

  const prevRepeatsOverlayOpenRef = useRef(isRepeatsOverlayOpen);
  const repeatsDrawerTimerRef = useRef<number | null>(null);
  const repeatsOverlayTimerRef = useRef<number | null>(null);

  // NLC: refs for textarea/mirror/hit-layer scroll sync
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const hitLayerRef = useRef<HTMLDivElement>(null);

  // NLC auto-apply: refs to read current toggle state inside debounced callback
  // without adding toggle state to the effect dependency array (which would cause loops)
  const isDateOnRef = useRef(isDateOn);
  const isTimeOnRef = useRef(isTimeOn);
  const isRepeatsOnRef = useRef(isRepeatsOn);
  isDateOnRef.current = isDateOn;
  isTimeOnRef.current = isTimeOn;
  isRepeatsOnRef.current = isRepeatsOn;

  // Edit mode: suppress auto-apply on mount so prepopulated values are not overwritten.
  // Starts true when editing, false otherwise. Set to false after the first auto-apply
  // cycle is skipped, so subsequent edits by the user trigger normal auto-apply.
  const suppressAutoApplyRef = useRef(isEditMode);

  // Edit mode: track which token texts existed in the original reminder text.
  // Used by auto-apply to detect genuinely new tokens typed by the user, so
  // those can override prepopulated toggle states without re-applying unchanged tokens.
  const editInitialTokenTextsRef = useRef<Set<string>>(
    isEditMode
      ? new Set(parseTokens(editReminder?.originalText ?? '', nlcRecognition).map(t => `${t.category}:${t.text.toLowerCase()}`))
      : new Set()
  );

  // NLC: parse tokens from current text (recomputes on every text change)
  // Gated by nlcEnabled — when off, parseTokens is not called.
  const parsedTokens = useMemo(() => nlcEnabled ? parseTokens(reminderText, nlcRecognition) : [], [reminderText, nlcEnabled, nlcRecognition]);

  // NLC: track which token per category the user has applied (clicked)
  const [appliedTokens, setAppliedTokens] = useState<Record<TokenCategory, ParsedToken | null>>({
    date: null,
    time: null,
    repeats: null,
  });

  // Ref mirror of appliedTokens — allows synchronous reads inside useEffect
  // without adding appliedTokens to the dependency array (which would loop).
  const appliedTokensRef = useRef(appliedTokens);
  appliedTokensRef.current = appliedTokens;

  // NLC: determine which tokens are eligible for display/click
  const eligibleTokens = useMemo(() => {
    return computeEligibleTokens(parsedTokens, appliedTokens);
  }, [parsedTokens, appliedTokens]);

  // NLC: invalidation — deterministic applied-token validation on every re-parse.
  // Uses the shared pure function computeInvalidation() for the decision logic,
  // then applies UI side effects (toggle off, clear values) for invalidated categories.
  // Drawer open state is NOT touched (spec: drawer state is user-controlled only).
  //
  // IMPORTANT: Side effects (applyToggleStateSilently, onRepeatConfigChange, etc.)
  // must NOT be called from inside a setState updater function — React executes
  // updaters during the render phase, and calling setState on other components
  // (including parent App via onRepeatConfigChange) during render is illegal.
  // Instead, we read the current applied tokens via ref and perform all mutations
  // at the top level of the effect callback.
  useEffect(() => {
    const prev = appliedTokensRef.current;
    const { newApplied, invalidated } = computeInvalidation(prev, parsedTokens);

    // Check if anything actually changed (invalidation or range update)
    const changed = (['date', 'time', 'repeats'] as TokenCategory[]).some(
      c => prev[c] !== newApplied[c],
    );
    if (!changed) return;

    // Update applied tokens state
    setAppliedTokens(newApplied);

    // Apply UI side effects for invalidated categories
    for (const category of invalidated) {
      if (category === 'date') {
        applyToggleStateSilently('date', false);
        setSelectedDate(null);
      } else if (category === 'time') {
        applyToggleStateSilently('time', false);
        setSelectedTime(null);
        // Time implied date (via invariant or compound) — cascade to date
        // unless an independent date token is still applied
        if (!newApplied.date) {
          applyToggleStateSilently('date', false);
          setSelectedDate(null);
        }
      } else if (category === 'repeats') {
        applyToggleStateSilently('repeats', false);
        onRepeatConfigChange(null);
        // Repeats implied date — also toggle off date unless an independent date token is still applied
        if (!newApplied.date) {
          applyToggleStateSilently('date', false);
          setSelectedDate(null);
        }
        // Repeats with implied time (every morning/afternoon/evening/night) —
        // cascade to time unless an independent time token is still applied
        const invalidatedRepeatsToken = prev.repeats;
        if (invalidatedRepeatsToken && getRepeatsImpliedTime(invalidatedRepeatsToken.text)) {
          if (!newApplied.time) {
            applyToggleStateSilently('time', false);
            setSelectedTime(null);
          }
        }
      }
    }

    // ── Implied time reactivation ──
    // If time was invalidated (explicit clock time deleted) but a surviving
    // repeats token has implied time (every morning/afternoon/evening/night),
    // reactivate the implied time. This preserves "every morning" semantics
    // when the user deletes an explicit override like "6am".
    if (invalidated.includes('time') && !invalidated.includes('repeats') && newApplied.repeats) {
      const impliedTime = getRepeatsImpliedTime(newApplied.repeats.text);
      if (impliedTime) {
        applyToggleStateSilently('time', true);
        setSelectedTime(impliedTime);
      }
    }
  }, [parsedTokens]); // eslint-disable-line react-hooks/exhaustive-deps

  // NLC auto-apply: debounced effect that runs 200ms after parsedTokens or nlcMode changes.
  // Gated behind nlcMode === 'auto'. Reads current toggle state via refs to avoid
  // feedback loops. Applies actions like synthetic clicks (sets applied tokens + values).
  // Does NOT open drawers. Invalidation runs synchronously before this fires.
  useEffect(() => {
    if (nlcMode !== 'auto') return;

    // Edit mode: suppress auto-apply on first mount cycle so prepopulated values
    // are not overwritten by token parsing of the initial text.
    if (suppressAutoApplyRef.current) {
      suppressAutoApplyRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      // In edit mode, allow auto-apply for categories where the user has typed
      // a genuinely new token (not present in the original text). This lets
      // typed tokens like "3pm" override prepopulated values without
      // re-applying unchanged tokens from the original text.
      const effectiveToggles = {
        date: isDateOnRef.current,
        time: isTimeOnRef.current,
        repeats: isRepeatsOnRef.current,
      };
      if (isEditMode) {
        for (const token of parsedTokens) {
          const key = `${token.category}:${token.text.toLowerCase()}`;
          if (!editInitialTokenTextsRef.current.has(key)) {
            effectiveToggles[token.category] = false;
          }
        }
      }

      const actions = computeAutoApplyResult(parsedTokens, effectiveToggles);

      // Pre-compute the repeats anchor date before applying actions.
      // The time action in applyToken can overwrite selectedDate (stale ref race),
      // so we re-apply the correct anchor after the loop.
      const repeatsAction = actions.find(a => a.category === 'repeats');
      let repeatsAnchorDate: Date | null = null;
      if (repeatsAction) {
        const result = parseRepeatsTokenValue(repeatsAction.token.text);
        if (result) {
          repeatsAnchorDate = result.anchorDate;
        }
      }

      for (const action of actions) {
        applyToken(action.token);
      }

      // Re-apply repeats anchor date after all actions to prevent
      // time-token date interference (time action may set date=today
      // via stale isDateOnRef before React re-renders).
      if (repeatsAnchorDate) {
        setSelectedDate(repeatsAnchorDate);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [parsedTokens, nlcMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // NLC: scroll sync between textarea, mirror, and hit layer
  const handleTextareaScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      if (mirrorRef.current) mirrorRef.current.scrollTop = scrollTop;
      if (hitLayerRef.current) hitLayerRef.current.scrollTop = scrollTop;
    }
  };

  // NLC: handle click in textarea — detect if it landed on a token
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const pos = e.currentTarget.selectionStart;
    if (pos === null || pos === undefined) return;

    for (const token of eligibleTokens) {
      if (pos >= token.start && pos < token.end) {
        handleTokenClick(token);
        return;
      }
    }
  };

  const handleTextareaPointerDown = (e: React.PointerEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    if (document.activeElement === textareaRef.current) return;

    e.preventDefault();
    textareaRef.current.focus({ preventScroll: true });
  };

  // NLC: apply structured state for a token — shared by click and auto-apply.
  // Updates appliedTokens, toggles on relevant toggle(s), sets values.
  // Does NOT open drawers or assume any UI event context.
  const applyToken = (token: ParsedToken) => {
    setAppliedTokens(prev => ({ ...prev, [token.category]: token }));

    switch (token.category) {
      case 'date': {
        const date = parseDateTokenValue(token.text);
        if (date) {
          applyToggleStateSilently('date', true);
          setSelectedDate(date);
          if (!isTimeOnRef.current) {
            applyToggleStateSilently('time', true);
            setSelectedTime({ hour: 12, minute: 0 });
          }
        }
        break;
      }
      case 'time': {
        const time = parseTimeTokenValue(token.text);
        if (time) {
          // Compound tokens (this morning, tonight, etc.) and standalone time tokens
          // can imply date = today — BUT only when no explicit date token exists in
          // the parsed text. Explicit date tokens (tomorrow, next Monday, etc.) take
          // precedence; time-of-day must never override them.
          const hasExplicitDateToken = parsedTokens.some(t => t.category === 'date');
          if (!hasExplicitDateToken && (isCompoundTimeToken(token.text) || !isDateOnRef.current)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            applyToggleStateSilently('date', true);
            setSelectedDate(today);
          }
          applyToggleStateSilently('time', true);
          setSelectedTime(time);
        }
        break;
      }
      case 'repeats': {
        const result = parseRepeatsTokenValue(token.text);
        if (result) {
          applyToggleStateSilently('repeats', true);
          applyToggleStateSilently('date', true);
          onRepeatConfigChange(result.config);
          setSelectedDate(result.anchorDate);

          // If the repeat token has an implied time (every morning/afternoon/evening/night),
          // apply it — unless an explicit clock time token exists in the parsed text.
          if (result.impliedTime) {
            const hasExplicitClockTime = parsedTokens.some(
              t => t.category === 'time' && !/^(this\s+)?(morning|lunchtime|noon|afternoon|evening|night)$/i.test(t.text.trim())
            );
            if (!hasExplicitClockTime) {
              applyToggleStateSilently('time', true);
              setSelectedTime(result.impliedTime);
            }
          } else if (!isTimeOnRef.current) {
            applyToggleStateSilently('time', true);
            setSelectedTime({ hour: 12, minute: 0 });
          }
        }
        break;
      }
    }
  };

  // NLC: handle user clicking a recognised token (delegates to applyToken)
  const handleTokenClick = (token: ParsedToken) => {
    applyToken(token);
  };

  // NLC: shared renderer for mirror and hit layers.
  // mode "mirror": token spans render in #4784F8, pointer-events none (visual only).
  // mode "hit": token spans render transparent + pointer-events auto + cursor pointer (click targets).
  // Non-token segments render identically in both modes. Text segmentation and whitespace
  // handling are shared — no drift risk between the two layers.
  const renderLayerContent = (mode: 'mirror' | 'hit') => {
    const keyPrefix = mode === 'mirror' ? 't' : 'h';
    const tokenKeyPrefix = mode === 'mirror' ? 'tok' : 'htok';

    if (eligibleTokens.length === 0) {
      return <span>{reminderText}</span>;
    }

    const sorted = [...eligibleTokens].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const token of sorted) {
      if (token.start > cursor) {
        parts.push(<span key={`${keyPrefix}-${cursor}`}>{reminderText.slice(cursor, token.start)}</span>);
      }

      if (mode === 'mirror') {
        parts.push(
          <span key={`${tokenKeyPrefix}-${token.start}`} style={{ color: '#4784F8' }}>
            {reminderText.slice(token.start, token.end)}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`${tokenKeyPrefix}-${token.start}`}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTokenClick(token);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
          >
            {reminderText.slice(token.start, token.end)}
          </span>
        );
      }
      cursor = token.end;
    }

    if (cursor < reminderText.length) {
      parts.push(<span key={`${keyPrefix}-${cursor}`}>{reminderText.slice(cursor)}</span>);
    }

    return <>{parts}</>;
  };

  // Set a toggle on/off without modifying drawer state, defaults, or cascades.
  // Used by NLC token clicks and invalidation to change toggle state
  // without opening drawers or triggering manual-toggle side effects.
  const applyToggleStateSilently = (section: 'date' | 'time' | 'repeats', isOn: boolean) => {
    switch (section) {
      case 'date': setIsDateOn(isOn); break;
      case 'time': setIsTimeOn(isOn); break;
      case 'repeats': setIsRepeatsOn(isOn); break;
    }
  };

  // Clear pending repeats toggle timers
  useEffect(() => {
    if (!autoFocusReady) return;
    textareaRef.current?.focus({ preventScroll: true });
  }, [autoFocusReady]);

  // Clear pending repeats toggle timers
  useEffect(() => {
    return () => {
      if (repeatsDrawerTimerRef.current !== null) clearTimeout(repeatsDrawerTimerRef.current);
      if (repeatsOverlayTimerRef.current !== null) clearTimeout(repeatsOverlayTimerRef.current);
    };
  }, []);

  // Detect repeats overlay closing with no config → auto-toggle off after 200ms
  useEffect(() => {
    const wasOpen = prevRepeatsOverlayOpenRef.current;
    prevRepeatsOverlayOpenRef.current = isRepeatsOverlayOpen;

    if (wasOpen && !isRepeatsOverlayOpen && !repeatConfig) {
      const timer = setTimeout(() => {
        setIsRepeatsOn(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isRepeatsOverlayOpen, repeatConfig]);

  const handleDateToggle = () => {
    if (isDateOn) {
      if (isSmartReminderMode) {
        setOpenDrawer(openDrawer === 'date' ? null : 'date');
        return;
      }
      // Turning OFF: clear toggle, clear date value, close drawer if open
      setIsDateOn(false);
      setSelectedDate(null);
      if (openDrawer === 'date') setOpenDrawer(null);
      // Time requires date — turn time off and clear its value
      if (isTimeOn) {
        setIsTimeOn(false);
        setSelectedTime(null);
        if (openDrawer === 'time') setOpenDrawer(null);
      }
    } else {
      // Turning ON: date requires a companion time, so enable both.
      setIsDateOn(true);
      setOpenDrawer('date');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);
      if (!isTimeOn) {
        setIsTimeOn(true);
        setSelectedTime({ hour: 12, minute: 0 });
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeToggle = () => {
    if (isTimeOn) {
      if (isSmartReminderMode) {
        setOpenDrawer(openDrawer === 'time' ? null : 'time');
        return;
      }
      // Turning OFF: clear toggle, clear time value, close drawer if open
      setIsTimeOn(false);
      setSelectedTime(null);
      if (openDrawer === 'time') setOpenDrawer(null);
    } else {
      // Turning ON: set toggle, open drawer, reset to 12:00
      setIsTimeOn(true);
      setOpenDrawer('time');
      setSelectedTime({ hour: 12, minute: 0 });
      // Auto-enable date if not already on (time needs a date)
      if (!isDateOn) {
        setIsDateOn(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
      }
    }
  };

  const handleTimeSelect = (time: { hour: number; minute: number }) => {
    setSelectedTime(time);
  };

  const handleRepeatsToggle = () => {
    if (isRepeatsOn) {
      // Turning OFF: clear toggle, clear config, close drawer if open
      setIsRepeatsOn(false);
      onRepeatConfigChange(null);
      if (openDrawer === 'repeats') setOpenDrawer(null);
      // Clear any pending timers from a previous toggle-on
      if (repeatsDrawerTimerRef.current !== null) { clearTimeout(repeatsDrawerTimerRef.current); repeatsDrawerTimerRef.current = null; }
      if (repeatsOverlayTimerRef.current !== null) { clearTimeout(repeatsOverlayTimerRef.current); repeatsOverlayTimerRef.current = null; }
    } else {
      // Turning ON: set toggle, keep current drawer open briefly for smooth UX
      setIsRepeatsOn(true);
      // Clear any pending timers before rescheduling
      if (repeatsDrawerTimerRef.current !== null) { clearTimeout(repeatsDrawerTimerRef.current); repeatsDrawerTimerRef.current = null; }
      if (repeatsOverlayTimerRef.current !== null) { clearTimeout(repeatsOverlayTimerRef.current); repeatsOverlayTimerRef.current = null; }
      // Delay closing any open date/time drawer by 1000ms so the repeats
      // overlay slides in over the top before they collapse
      repeatsDrawerTimerRef.current = setTimeout(() => {
        setOpenDrawer('repeats');
      }, 1000);
      // Open repeats overlay after 200ms delay
      if (onRepeatsOverlayOpen) {
        repeatsOverlayTimerRef.current = setTimeout(() => {
          onRepeatsOverlayOpen();
        }, 200);
      }
    }
  };

  const handleDateLabelClick = () => {
    // Toggle date drawer open/closed (item stays ON)
    setOpenDrawer(openDrawer === 'date' ? null : 'date');
  };

  const handleTimeLabelClick = () => {
    // Toggle time drawer open/closed (item stays ON)
    setOpenDrawer(openDrawer === 'time' ? null : 'time');
  };

  const handleRepeatsLabelClick = () => {
    // Reopen the repeats overlay when indicator text is clicked
    if (onRepeatsOverlayOpen) {
      onRepeatsOverlayOpen();
    }
  };

  const handleChooseFile = async () => {
    setShowAttachmentOverlay(false);

    try {
      // Pick file with metadata only — do not read data yet
      const result = await FilePicker.pickFiles({
        limit: 1,
        readData: false,
      });

      const picked = result.files[0];
      if (!picked) return;

      // Validate type and size before reading any file data
      const validation = validateAttachment(picked.name, picked.mimeType, picked.size);
      if (!validation.valid) {
        if (validation.reason === 'too-large') {
          setAttachmentError({ title: 'This file is too big', message: 'Choose a file under 25 MB.' });
        } else {
          setAttachmentError({ title: 'This file isn\'t supported', message: 'Try a different file.' });
        }
        return;
      }

      // Read file data only after validation passes
      if (!picked.path) {
        setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
        return;
      }

      const resolvedMime = resolveMimeType(picked.name, picked.mimeType);
      const response = await fetch(Capacitor.convertFileSrc(picked.path));
      const blob = await response.blob();
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      // Generate PDF first-page thumbnail for preview
      let previewDataUrl: string | undefined;
      if (resolvedMime === 'application/pdf') {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1);
          const vp = page.getViewport({ scale: 1 });
          const scale = 90 / vp.width;
          const scaled = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = scaled.width;
          canvas.height = scaled.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport: scaled }).promise;
            previewDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          }
          pdf.destroy();
        } catch {
          // PDF thumbnail generation failed — fall back to Generic File
        }
      }

      setPendingAttachment({
        fileName: picked.name,
        mimeType: resolvedMime,
        dataBase64,
        previewDataUrl,
      });
    } catch (err: unknown) {
      // Picker cancellation rejects with "pickFiles canceled."
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('canceled')) return;
      setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
    }
  };

  const handleChoosePhoto = async () => {
    setShowAttachmentOverlay(false);

    try {
      // Open standard iOS Photos picker with album navigation
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Uri,
        quality: 100,
        presentationStyle: 'fullscreen',
      });

      // Plugin returns a temp JPEG file — read it and validate size
      const path = photo.path;
      if (!path) {
        setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
        return;
      }

      const response = await fetch(Capacitor.convertFileSrc(path));
      const blob = await response.blob();

      // Validate the JPEG size against 25 MB limit
      const fileName = 'photo.jpeg';
      const mimeType = 'image/jpeg';
      const validation = validateAttachment(fileName, mimeType, blob.size);
      if (!validation.valid) {
        if (validation.reason === 'too-large') {
          setAttachmentError({ title: 'This file is too big', message: 'Choose a file under 25 MB.' });
        } else {
          setAttachmentError({ title: 'This file isn\'t supported', message: 'Try a different file.' });
        }
        return;
      }

      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      setPendingAttachment({
        fileName,
        mimeType,
        dataBase64,
      });
    } catch (err: unknown) {
      // Cancellation — silently ignore
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancel')) return;
      setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachmentOverlay(false);

    try {
      // Open native iOS camera directly
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 100,
      });

      const path = photo.path;
      if (!path) {
        setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
        return;
      }

      const response = await fetch(Capacitor.convertFileSrc(path));
      const blob = await response.blob();

      const fileName = 'photo.jpeg';
      const mimeType = 'image/jpeg';
      const validation = validateAttachment(fileName, mimeType, blob.size);
      if (!validation.valid) {
        if (validation.reason === 'too-large') {
          setAttachmentError({ title: 'This file is too big', message: 'Choose a file under 25 MB.' });
        } else {
          setAttachmentError({ title: 'This file isn\'t supported', message: 'Try a different file.' });
        }
        return;
      }

      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      setPendingAttachment({
        fileName,
        mimeType,
        dataBase64,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancel')) return;
      setAttachmentError({ title: 'Oh no!', message: 'We couldn\'t attach this file. Try again or choose a different one.' });
    }
  };

  const handleAttachmentTap = async () => {
    if (!pendingAttachment) return;
    handleOpenAttachment();
  };

  const handleOpenAttachment = async () => {
    if (!pendingAttachment) return;
    try {
      const ext = pendingAttachment.fileName.includes('.')
        ? pendingAttachment.fileName.split('.').pop()
        : 'dat';
      const tempPath = `reminderly-temp-preview.${ext}`;
      await Filesystem.writeFile({
        path: tempPath,
        data: pendingAttachment.dataBase64,
        directory: Directory.Cache,
      });
      const uriResult = await Filesystem.getUri({
        path: tempPath,
        directory: Directory.Cache,
      });
      await FileOpener.open({
        filePath: uriResult.uri,
        contentType: pendingAttachment.mimeType,
        openWithDefault: true,
      });
    } catch {
      // Native preview failed — fall back to share sheet
      handleShareAttachment();
    }
  };

  const handleShareAttachment = async () => {
    if (!pendingAttachment) return;
    try {
      const ext = pendingAttachment.fileName.includes('.')
        ? pendingAttachment.fileName.split('.').pop()
        : 'dat';
      const tempPath = `reminderly-temp-share.${ext}`;
      await Filesystem.writeFile({
        path: tempPath,
        data: pendingAttachment.dataBase64,
        directory: Directory.Cache,
      });
      const uriResult = await Filesystem.getUri({
        path: tempPath,
        directory: Directory.Cache,
      });
      await Share.share({
        files: [uriResult.uri],
      });
    } catch {
      // Share cancelled or failed — no action needed
    }
  };

  const handleSubmit = async () => {
    const text = reminderText.trim();
    if (!text) return;
    const requiresScheduledReminder = !isEditMode && !isSmartReminderMode;
    if (requiresScheduledReminder && (!isDateOn || !selectedDate)) return;
    if (requiresScheduledReminder && (!isTimeOn || !selectedTime)) return;

    // Build schedule
    let schedule: Reminder['schedule'];
    if (isDateOn && selectedDate && isTimeOn && selectedTime) {
      schedule = {
        kind: 'scheduled',
        date: toYyyyMmDd(selectedDate),
        time: toHhMm(selectedTime.hour, selectedTime.minute),
      };
    } else {
      schedule = { kind: 'sometime' };
    }

    const repeatRule = isRepeatsOn ? repeatConfigToRule(repeatConfig) : null;

    const now = new Date();

    // Determine if the date was set from a typed token (NLC) or manually via the date picker.
    // If no date token was parsed from the text, skip injecting a date label into displayText.
    const hasDateToken = parsedTokens.some(t => t.category === 'date');
    const normaliseOptions = hasDateToken ? undefined : { skipDateInjection: true };
    const displayText = schedule.kind === 'scheduled' && nlcEnabled
      ? normaliseReminderText(text, schedule, repeatRule, now, normaliseOptions)
      : text;

    if (isSmartReminderCreate && smartReminderCreateList && onCreateSmartReminder) {
      if (schedule.kind !== 'scheduled' || !schedule.time) return;
      onCreateSmartReminder({
        listId: smartReminderCreateList.id,
        date: schedule.date,
        time: schedule.time,
      });
    } else if (isEditMode && editReminder && updateReminder) {
      // Edit mode: update existing reminder in place (id unchanged)
      let attachment: ReminderAttachment | undefined | null;
      if (pendingAttachment) {
        try {
          attachment = await saveAttachment(
            editReminder.id,
            pendingAttachment.fileName,
            pendingAttachment.mimeType,
            pendingAttachment.dataBase64,
          );
        } catch {
          // Attachment save failed - keep existing attachment
        }
      } else if (attachmentDeletedRef.current && editReminder.attachment) {
        // User deleted the existing attachment
        attachment = null;
        await deleteAttachment(editReminder.attachment.storagePath);
      }
      const updated: Reminder = {
        ...editReminder,
        originalText: text,
        displayText,
        schedule,
        repeatRule,
        ...(attachment !== undefined ? { attachment } : {}),
      };
      updateReminder(updated);
    } else {
      // Create mode: add new reminder
      const reminderId = generateId();
      let attachment: ReminderAttachment | undefined;
      if (pendingAttachment) {
        try {
          attachment = await saveAttachment(
            reminderId,
            pendingAttachment.fileName,
            pendingAttachment.mimeType,
            pendingAttachment.dataBase64,
          );
        } catch {
          // Attachment save failed - proceed without attachment
        }
      }
      const reminder: Reminder = {
        id: reminderId,
        originalText: text,
        displayText,
        createdAt: Date.now(),
        schedule,
        repeatRule,
        ...(attachment ? { attachment } : {}),
      };
      addReminder(reminder);
    }

    // Reset draft state explicitly
    setReminderText('');
    setIsDateOn(false);
    setIsTimeOn(false);
    setIsRepeatsOn(false);
    setOpenDrawer(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAppliedTokens({ date: null, time: null, repeats: null });
    setPendingAttachment(null);
    setAttachmentError(null);
    setShowDeleteAttachmentConfirm(false);

    onClose();
  };

  // Keep the text field height stable when the keyboard is manually reopened.
  const getTextareaHeight = () => {
    const DEFAULT_HEIGHT = 80;
    return DEFAULT_HEIGHT;
  };

  const requiresScheduledReminder = !isEditMode && !isSmartReminderMode;
  const isSubmitActive = reminderText.trim().length > 0 && (!requiresScheduledReminder || (isDateOn && selectedDate !== null && isTimeOn && selectedTime !== null));

  return (
    <>
    <div className="relative shrink-0 w-full max-w-[768px] h-full flex flex-col" data-name="new-reminder-elements">
      <div className="content-stretch flex flex-col gap-[22px] items-start pt-[30px] px-[24px] relative w-full shrink-0">
        <Header isSubmitActive={isSubmitActive} onSubmit={handleSubmit} title={isSmartReminderCreate ? 'Add smart reminder' : isEditMode ? (isSmartReminderEdit ? 'Edit smart reminder' : 'Edit reminder') : 'New reminder'} />
        {/* NLC: Container wraps mirror layer + textarea for alignment */}
        {/* Mirror and hit layer must stay identical in text metrics (font, size, line-height, padding, whitespace). Any styling change must be applied to both. */}
        <motion.div
          animate={{ height: getTextareaHeight() }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative bg-[#f7f7f7] rounded-[10px] shrink-0 w-full"
          data-name="text-field-container"
        >
          {/* NLC layers: mirror (coloured text) + hit (click targets) — only render when NLC is enabled */}
          {nlcEnabled && !isSmartReminderMode && (
            <>
              {/* Mirror layer: renders coloured text behind the transparent textarea */}
              <div
                ref={mirrorRef}
                className="absolute inset-0 p-[12px] pointer-events-none overflow-hidden"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '17px',
                  lineHeight: 'normal',
                  color: '#1C2C42',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  ...(pendingAttachment ? { paddingRight: 73 } : {}),
                }}
                aria-hidden="true"
              >
                {renderLayerContent('mirror')}
              </div>
              {/* Hit layer: renders invisible click targets for tokens */}
              <div
                ref={hitLayerRef}
                className="absolute inset-0 p-[12px] pointer-events-none overflow-hidden z-20"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '17px',
                  lineHeight: 'normal',
                  color: 'transparent',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  ...(pendingAttachment ? { paddingRight: 73 } : {}),
                }}
                aria-hidden="true"
              >
                {renderLayerContent('hit')}
              </div>
            </>
          )}
          {/* Real textarea: handles editing, caret, selection */}
          <textarea
            ref={textareaRef}
            className="w-full h-full p-[12px] font-['Lato',sans-serif] text-[17px] resize-none border-none outline-none bg-transparent relative z-10 placeholder:font-medium placeholder:text-[#bababa]"
            style={{ color: isSmartReminderMode ? '#BABABA' : (nlcEnabled ? 'transparent' : '#1C2C42'), caretColor: isSmartReminderMode ? '#BABABA' : '#1C2C42', lineHeight: 'normal', ...(pendingAttachment ? { paddingRight: 73 } : {}) }}
            placeholder="Don't forget..."
            autoCapitalize="sentences"
            autoComplete="off"
            autoCorrect="on"
            spellCheck={true}
            data-name="text-field"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            onScroll={handleTextareaScroll}
            onPointerDown={handleTextareaPointerDown}
            onClick={handleTextareaClick}
            readOnly={isSmartReminderMode}
          />
          {isReminderAttachmentsEnabled && !pendingAttachment && (isSmartReminderMode ? (
            <div
              className="absolute z-20 select-none"
              style={{ width: 44, height: 44, right: 0, bottom: 0 }}
              aria-hidden="true"
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute" style={{ right: 8, bottom: 8 }}>
                <rect width="25" height="25" rx="12.5" fill="#E4E4E4" fillOpacity="0.5"/>
                <path d="M7.73806 12.1933L9.43037 9.26215C10.5987 7.23861 13.2044 6.55581 15.2504 7.73709C17.2964 8.91836 18.008 11.5164 16.8397 13.5399L14.5128 17.5703C13.9286 18.5821 12.6258 18.9234 11.6027 18.3328C10.5797 17.7422 10.224 16.4432 10.8081 15.4314L13.135 11.401" stroke="#D9D9D9" strokeWidth="1.45833" strokeLinecap="round"/>
              </svg>
            </div>
          ) : (
            <button
              type="button"
              className="absolute z-20 bg-transparent border-none p-0 cursor-pointer select-none"
              style={{ width: 44, height: 44, right: 0, bottom: 0 }}
              onClick={() => setShowAttachmentOverlay(true)}
              aria-label="Add an attachment"
            >
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute" style={{ right: 8, bottom: 8 }}>
                <rect width="25" height="25" rx="12.5" fill="#E4E4E4"/>
                <path d="M7.73806 12.1933L9.43037 9.26215C10.5987 7.23861 13.2044 6.55581 15.2504 7.73709C17.2964 8.91836 18.008 11.5164 16.8397 13.5399L14.5128 17.5703C13.9286 18.5821 12.6258 18.9234 11.6027 18.3328C10.5797 17.7422 10.224 16.4432 10.8081 15.4314L13.135 11.401" stroke="#939393" strokeWidth="1.45833" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
          {isReminderAttachmentsEnabled && !isSmartReminderMode && pendingAttachment && (
            <div
              className="absolute z-20 cursor-pointer"
              onClick={handleAttachmentTap}
              style={{
                /* Position the 45×58 tile: vertically centred in 80px container, right edge 12px from textarea right.
                   SVG canvas is 51×63. Tile sits at x=0..45, y=5..63 within the canvas.
                   So SVG right offset = 12 - (51-45) = 6px from container right.
                   SVG top offset = (80-58)/2 - 5 = 6px from container top. */
                right: 6,
                top: 6,
                width: 51,
                height: 63,
              }}
            >
              {pendingAttachment.mimeType.startsWith('image/') && !imagePreviewFailed ? (
                /* Actual image preview */
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 5,
                    width: 45,
                    height: 58,
                    borderRadius: 7,
                    border: '3px solid #ECECEC',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '3px solid white',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    <img
                      src={`data:${pendingAttachment.mimeType};base64,${pendingAttachment.dataBase64}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={() => setImagePreviewFailed(true)}
                    />
                  </div>
                </div>
              ) : pendingAttachment.mimeType.startsWith('image/') ? (
                /* Generic Image fallback — camera pictogram */
                <svg width="51" height="63" viewBox="0 0 51 63" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="8" width="39" height="52" rx="4" fill="white" stroke="white" strokeWidth="6"/>
                  <rect x="1.5" y="6.5" width="42" height="55" rx="5.5" stroke="#ECECEC" strokeWidth="3"/>
                  <rect x="30" width="20.3008" height="20.3008" rx="10.1504" fill="#BABABA"/>
                  <path d="M42.5238 6.94045C42.7551 6.70935 43.1299 6.70926 43.3611 6.94045C43.5923 7.17164 43.5922 7.5465 43.3611 7.77776L40.988 10.1501L43.3611 12.5233C43.5923 12.7545 43.5922 13.1293 43.3611 13.3606C43.1299 13.5918 42.7551 13.5918 42.5238 13.3606L40.1507 10.9874L37.7783 13.3606C37.5471 13.5918 37.1722 13.5918 36.941 13.3606C36.7098 13.1294 36.7098 12.7545 36.941 12.5233L39.3134 10.1501L36.941 7.77776C36.7099 7.5465 36.7098 7.17163 36.941 6.94045C37.1722 6.70941 37.5471 6.70943 37.7783 6.94045L40.1507 9.31282L42.5238 6.94045Z" fill="#F7F7F7"/>
                  <path d="M18 28.0005C16.7794 28.0041 16.1038 28.0333 15.5487 28.2663C14.7712 28.5927 14.138 29.1955 13.7681 29.9616C13.4662 30.5869 13.4168 31.388 13.318 32.9902L13.1631 35.5009C12.9174 39.4853 12.7945 41.4775 13.9637 42.7388C15.1328 44 17.1025 44 21.0419 44H24.9581C28.8975 44 30.8672 44 32.0363 42.7388C33.2055 41.4775 33.0826 39.4853 32.8369 35.5009L32.682 32.9902C32.5832 31.388 32.5338 30.5869 32.2319 29.9616C31.862 29.1955 31.2288 28.5927 30.4513 28.2663C29.8962 28.0333 29.2206 28.0041 28 28.0005" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M28 29L27.1142 26.7854C26.732 25.83 26.3994 24.7461 25.4166 24.2596C24.8924 24 24.2616 24 23 24C21.7384 24 21.1076 24 20.5834 24.2596C19.6006 24.7461 19.268 25.83 18.8858 26.7854L18 29" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M26.5 36C26.5 37.933 24.933 39.5 23 39.5C21.067 39.5 19.5 37.933 19.5 36C19.5 34.067 21.067 32.5 23 32.5C24.933 32.5 26.5 34.067 26.5 36Z" stroke="#BABABA" strokeWidth="1.5"/>
                  <path d="M22.9998 28H23.0088" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : pendingAttachment.previewDataUrl ? (
                /* PDF first-page thumbnail */
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 5,
                    width: 45,
                    height: 58,
                    borderRadius: 7,
                    border: '3px solid #ECECEC',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '3px solid white',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    <img
                      src={pendingAttachment.previewDataUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>
              ) : (
                /* Generic File — document pictogram (unchanged) */
                <svg width="51" height="63" viewBox="0 0 51 63" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="8" width="39" height="52" rx="4" fill="white" stroke="white" strokeWidth="6"/>
                  <rect x="1.5" y="6.5" width="42" height="55" rx="5.5" stroke="#ECECEC" strokeWidth="3"/>
                  <rect x="30" width="20.3008" height="20.3008" rx="10.1504" fill="#BABABA"/>
                  <path d="M42.5238 6.94045C42.7551 6.70935 43.1299 6.70926 43.3611 6.94045C43.5923 7.17164 43.5922 7.5465 43.3611 7.77776L40.988 10.1501L43.3611 12.5233C43.5923 12.7545 43.5922 13.1293 43.3611 13.3606C43.1299 13.5918 42.7551 13.5918 42.5238 13.3606L40.1507 10.9874L37.7783 13.3606C37.5471 13.5918 37.1722 13.5918 36.941 13.3606C36.7098 13.1294 36.7098 12.7545 36.941 12.5233L39.3134 10.1501L36.941 7.77776C36.7099 7.5465 36.7098 7.17163 36.941 6.94045C37.1722 6.70941 37.5471 6.70943 37.7783 6.94045L40.1507 9.31282L42.5238 6.94045Z" fill="#F7F7F7"/>
                  <path d="M14 32C14 28.2288 14 26.3431 15.2448 25.1716C16.4896 24 18.4931 24 22.5 24H23.2727C26.5339 24 28.1645 24 29.2969 24.7978C29.6214 25.0264 29.9094 25.2975 30.1523 25.6029C31 26.6687 31 28.2034 31 31.2727V33.8182C31 36.7814 31 38.2629 30.5311 39.4462C29.7772 41.3486 28.1829 42.8491 26.1616 43.5586C24.9044 44 23.3302 44 20.1818 44C18.3827 44 17.4832 44 16.7648 43.7478C15.6098 43.3424 14.6988 42.4849 14.268 41.3979C14 40.7217 14 39.8751 14 38.1818V32Z" stroke="#BABABA" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M31 34C31 35.8409 29.5076 37.3333 27.6667 37.3333C27.0009 37.3333 26.216 37.2167 25.5686 37.3901C24.9935 37.5442 24.5442 37.9935 24.3901 38.5686C24.2167 39.216 24.3333 40.0009 24.3333 40.6667C24.3333 42.5076 22.8409 44 21 44" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 29H25.5" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 33H21.5" stroke="#BABABA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {/* X remove button — 44×44 invisible tap target centred on the 20px visible circle */}
              <button
                type="button"
                className="absolute bg-transparent border-none p-0 cursor-pointer select-none"
                style={{ width: 44, height: 44, top: -12, right: -9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(e) => { e.stopPropagation(); setShowDeleteAttachmentConfirm(true); }}
                aria-label="Remove attachment"
              >
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20.3008" height="20.3008" rx="10.1504" fill="#BABABA"/>
                  <path d="M12.5238 6.94045C12.7551 6.70935 13.1299 6.70926 13.3611 6.94045C13.5923 7.17164 13.5922 7.5465 13.3611 7.77776L10.988 10.1501L13.3611 12.5233C13.5923 12.7545 13.5922 13.1293 13.3611 13.3606C13.1299 13.5918 12.7551 13.5918 12.5238 13.3606L10.1507 10.9874L7.7783 13.3606C7.54706 13.5918 7.17223 13.5918 6.94099 13.3606C6.70976 13.1294 6.70978 12.7545 6.94099 12.5233L9.31337 10.1501L6.94099 7.77776C6.70993 7.5465 6.70981 7.17163 6.94099 6.94045C7.17219 6.70941 7.5471 6.70943 7.7783 6.94045L10.1507 9.31282L12.5238 6.94045Z" fill="#F7F7F7"/>
                </svg>
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col px-[24px] pt-[24px] pb-[24px]">
        <ReminderOptions 
          isDateOn={isDateOn}
          onDateToggle={handleDateToggle}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          isTimeOn={isTimeOn}
          onTimeToggle={handleTimeToggle}
          selectedTime={selectedTime}
          onTimeSelect={handleTimeSelect}
          isRepeatsOn={isRepeatsOn}
          onRepeatsToggle={handleRepeatsToggle}
        repeatConfig={repeatConfig}
        openDrawer={openDrawer}
        onDateLabelClick={handleDateLabelClick}
        onTimeLabelClick={handleTimeLabelClick}
        onRepeatsLabelClick={handleRepeatsLabelClick}
        useOneMinuteIncrements={useOneMinuteIncrements}
        disableRepeats={isSmartReminderMode}
        repeatInactiveColor={isSmartReminderMode ? '#D9D9D9' : undefined}
      />
      </div>
    </div>

    {showAttachmentOverlay && (
      <>
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowAttachmentOverlay(false)} />
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div
            className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] pointer-events-auto outline-none"
            style={{ width: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
              <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>Add an attachment</p>
            </div>

            <div className="content-stretch flex flex-col gap-[30px] items-start mt-[7px] relative shrink-0 w-full">
              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                onClick={handleChoosePhoto}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Choose a photo</p>
                    </div>
                  </div>
                </div>
              </button>

              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                onClick={handleTakePhoto}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Take a photo</p>
                    </div>
                  </div>
                </div>
              </button>

              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                onClick={handleChooseFile}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Choose a file</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {attachmentError && (
      <>
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setAttachmentError(null)} />
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div
            className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] pointer-events-auto outline-none"
            style={{ width: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
              <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>{attachmentError.title}</p>
            </div>
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center not-italic relative shrink-0 text-[#BABABA] text-[17px] text-center">
              <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700, lineHeight: '24px' }}>{attachmentError.message}</p>
            </div>
            <div className="content-stretch flex flex-col gap-[30px] items-start mt-[7px] relative shrink-0 w-full">
              <button
                className="bg-[#4784f8] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                onClick={() => setAttachmentError(null)}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">OK</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {showDeleteAttachmentConfirm && (
      <>
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDeleteAttachmentConfirm(false)} />
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div
            className="bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] pointer-events-auto outline-none"
            style={{ width: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
              <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>Delete attachment</p>
            </div>
            <div className="content-stretch flex flex-col gap-[30px] items-start mt-[7px] relative shrink-0 w-full">
              <button
                className="bg-[#EC0F0F] cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
                onClick={() => {
                  setPendingAttachment(null);
                  attachmentDeletedRef.current = true;
                  setShowDeleteAttachmentConfirm(false);
                }}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Delete</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    </>
  );
}

export default function NewReminderOverlay({ onRepeatsOverlayOpen, repeatConfig, onRepeatConfigChange, isRepeatsOverlayOpen, addReminder, onClose, nlcMode, nlcEnabled, nlcRecognition, editReminder, updateReminder, smartReminderCreateList, onCreateSmartReminder, useOneMinuteIncrements = false, autoFocusReady = false, isReminderAttachmentsEnabled = false }: { onRepeatsOverlayOpen?: () => void; repeatConfig: RepeatConfig; onRepeatConfigChange: (config: RepeatConfig) => void; isRepeatsOverlayOpen: boolean; addReminder: (reminder: Reminder) => void; onClose: () => void; nlcMode: NlcMode; nlcEnabled: boolean; nlcRecognition?: NlcRecognitionConfig; editReminder?: Reminder | null; updateReminder?: (reminder: Reminder) => void; smartReminderCreateList?: CreatedList | null; onCreateSmartReminder?: (payload: { listId: string; date: string; time: string }) => void; useOneMinuteIncrements?: boolean; autoFocusReady?: boolean; isReminderAttachmentsEnabled?: boolean }) {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full" data-name="new-reminder-overlay">
      <NewReminderElements onRepeatsOverlayOpen={onRepeatsOverlayOpen} repeatConfig={repeatConfig} onRepeatConfigChange={onRepeatConfigChange} isRepeatsOverlayOpen={isRepeatsOverlayOpen} addReminder={addReminder} onClose={onClose} nlcMode={nlcMode} nlcEnabled={nlcEnabled} nlcRecognition={nlcRecognition} editReminder={editReminder} updateReminder={updateReminder} smartReminderCreateList={smartReminderCreateList} onCreateSmartReminder={onCreateSmartReminder} useOneMinuteIncrements={useOneMinuteIncrements} autoFocusReady={autoFocusReady} isReminderAttachmentsEnabled={isReminderAttachmentsEnabled} />
    </div>
  );
}
