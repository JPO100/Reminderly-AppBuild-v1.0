import svgPaths from "./svg-oxn8g14l6y";
import { useEffect, useRef, useState } from "react";
import ListSmartReminderCalendar from "../app/components/ListSmartReminderCalendar";
import { formatSmartReminderDueByFromDate } from "../app/utils/list-utils";

function SmartRemindersLabel({ active, smartReminderDueDate, smartReminderTime, highlightDueDate, animateFadeOut }: { active: boolean; smartReminderDueDate: Date | null; smartReminderTime: string | null | undefined; highlightDueDate: boolean; animateFadeOut: boolean }) {
  return (
    <div className={`content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative ${active ? '' : 'text-[#d9d9d9]'}`}>
      <div className={`flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px] text-ellipsis w-full whitespace-nowrap ${active ? 'text-[#1C2C42]' : ''}`}>
        <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>Set smart reminder</p>
      </div>
      <div className={`flex flex-col justify-start relative shrink-0 text-[14px] w-full ${active ? 'text-[#bababa]' : ''}`}>
        <p className="leading-[14px]" style={{ fontWeight: 700, color: active ? (highlightDueDate ? '#1C2C42' : '#BABABA') : undefined, transition: animateFadeOut ? 'color 300ms' : 'none' }}>{formatSmartReminderDueByFromDate(smartReminderDueDate, smartReminderTime)}</p>
      </div>
    </div>
  );
}

function AlphabeticalLabel({ active }: { active: boolean }) {
  return (
    <div className={`content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative ${active ? '' : 'text-[#d9d9d9]'}`}>
      <div className={`flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px] text-ellipsis w-full whitespace-nowrap ${active ? 'text-[#1C2C42]' : ''}`}>
        <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>List alphabetically</p>
      </div>
      <div className={`flex flex-col justify-start relative shrink-0 text-[14px] w-full ${active ? 'text-[#bababa]' : ''}`}>
        <p className="leading-[14px]" style={{ fontWeight: 700 }}>Displayed A - Z</p>
      </div>
    </div>
  );
}

function InsertionLabel({ active }: { active: boolean }) {
  return (
    <div className={`content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative ${active ? '' : 'text-[#d9d9d9]'}`}>
      <div className={`flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px] text-ellipsis w-full whitespace-nowrap ${active ? 'text-[#1C2C42]' : ''}`}>
        <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>List in order added</p>
      </div>
      <div className={`flex flex-col justify-start relative shrink-0 text-[14px] w-full ${active ? 'text-[#bababa]' : ''}`}>
        <p className="leading-[14px]" style={{ fontWeight: 700 }}>Most recent at the top</p>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button className={`${active ? 'bg-[#4784F8] justify-end' : 'bg-[#d9d9d9]'} content-stretch cursor-pointer flex h-[30px] items-center self-start p-[3.75px] relative rounded-[37.5px] shrink-0 w-[56px]`} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <div className="relative shrink-0 size-[22.5px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
          <circle cx="11.25" cy="11.25" fill="var(--fill-0, white)" r="11.25" />
        </svg>
      </div>
    </button>
  );
}

function Frame3({ sortMode, onSortChange, smartReminders, onSmartRemindersChange, showSmartReminders, displaySmartReminderDate, smartReminderTime, selectedSmartReminderDate, isDatePickerOpen, onDateSelect, onSetDate, onCloseDatePicker, onOpenDatePicker, onOpenSmartReminderEditor, highlightDueDate, animateFadeOut }: { sortMode: 'alphabetical' | 'insertion'; onSortChange: (mode: 'alphabetical' | 'insertion') => void; smartReminders: boolean; onSmartRemindersChange: (val: boolean) => void; showSmartReminders: boolean; displaySmartReminderDate: Date | null; smartReminderTime: string | null | undefined; selectedSmartReminderDate: Date; isDatePickerOpen: boolean; onDateSelect: (date: Date) => void; onSetDate: () => void; onCloseDatePicker: () => void; onOpenDatePicker: () => void; onOpenSmartReminderEditor?: () => void; highlightDueDate: boolean; animateFadeOut: boolean }) {
  const isAlpha = sortMode === 'alphabetical';
  const isInsertion = sortMode === 'insertion';
  const smartRemindersActive = showSmartReminders && smartReminders;
  const showSortRows = !smartRemindersActive || !isDatePickerOpen;

  const handleSmartRemindersRowClick = () => {
    if (!showSmartReminders || !smartRemindersActive) return;
    if (onOpenSmartReminderEditor) {
      onOpenSmartReminderEditor();
      return;
    }
    if (!isDatePickerOpen) {
      onOpenDatePicker();
    }
  };

  const handleSmartRemindersToggleClick = () => {
    if (smartRemindersActive) {
      onSmartRemindersChange(false);
      return;
    }
    onSmartRemindersChange(true);
  };

  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
      {showSmartReminders && (
        <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full cursor-pointer" onClick={handleSmartRemindersRowClick}>
            <div className="h-[21.5px] relative self-start shrink-0 w-[19.5px] top-[1px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5002 21.5002">
                <g id="Union">
                  <path clipRule="evenodd" d={svgPaths.p23b20a00} fill={smartRemindersActive ? '#1C2C42' : '#D9D9D9'} fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths.p15d6fbb2} fill={smartRemindersActive ? '#1C2C42' : '#D9D9D9'} fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths.p1797f00} fill={smartRemindersActive ? '#1C2C42' : '#D9D9D9'} fillRule="evenodd" />
                </g>
              </svg>
            </div>
            <SmartRemindersLabel active={smartRemindersActive} smartReminderDueDate={displaySmartReminderDate} smartReminderTime={smartReminderTime} highlightDueDate={highlightDueDate} animateFadeOut={animateFadeOut} />
            <ToggleButton active={smartRemindersActive} onClick={handleSmartRemindersToggleClick} />
          </div>
      {smartRemindersActive && isDatePickerOpen && (
        <div className="content-stretch flex flex-col gap-[30px] items-start w-full">
          <ListSmartReminderCalendar selectedDate={selectedSmartReminderDate} onDateSelect={(date) => date && onDateSelect(date)} />
          <DatePickerButtons onSetDate={onSetDate} />
        </div>
      )}
        </div>
      )}
      {showSortRows && (
        <div className="content-stretch flex flex-col gap-[30px] items-start w-full">
          <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full cursor-pointer" onClick={() => onSortChange(isInsertion ? 'alphabetical' : 'insertion')}>
            <div className="h-[20.824px] relative shrink-0 w-[20.83px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.8301 20.8242">
                <g id="Union">
                  <path d={svgPaths.p1f326770} fill={`var(--fill-0, ${isInsertion ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.p10221f80} fill={`var(--fill-0, ${isInsertion ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.p30c3ae80} fill={`var(--fill-0, ${isInsertion ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.p2dfdd480} fill={`var(--fill-0, ${isInsertion ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.p390e3940} fill={`var(--fill-0, ${isInsertion ? '#1C2C42' : '#D9D9D9'})`} />
                </g>
              </svg>
            </div>
            <InsertionLabel active={isInsertion} />
            <ToggleButton active={isInsertion} onClick={() => onSortChange(isInsertion ? 'alphabetical' : 'insertion')} />
          </div>
          <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full cursor-pointer" onClick={() => onSortChange(isAlpha ? 'insertion' : 'alphabetical')}>
            <div className="h-[20.814px] relative shrink-0 w-[22.387px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.3867 20.8145">
                <g id="Union">
                  <path d={svgPaths.pa5a1880} fill={`var(--fill-0, ${isAlpha ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.p3a034e00} fill={`var(--fill-0, ${isAlpha ? '#1C2C42' : '#D9D9D9'})`} />
                  <path d={svgPaths.pbb6b280} fill={`var(--fill-0, ${isAlpha ? '#1C2C42' : '#D9D9D9'})`} />
                  <path clipRule="evenodd" d={svgPaths.p37945200} fill={`var(--fill-0, ${isAlpha ? '#1C2C42' : '#D9D9D9'})`} fillRule="evenodd" />
                  <path d={svgPaths.p3a58ae80} fill={`var(--fill-0, ${isAlpha ? '#1C2C42' : '#D9D9D9'})`} />
                </g>
              </svg>
            </div>
            <AlphabeticalLabel active={isAlpha} />
            <ToggleButton active={isAlpha} onClick={() => onSortChange(isAlpha ? 'insertion' : 'alphabetical')} />
          </div>
        </div>
      )}
    </div>
  );
}

function UncheckAllBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <div className={`${disabled ? 'bg-[#d9d9d9]' : 'bg-[#4784F8] cursor-pointer'} h-[50px] relative rounded-[100px] shrink-0 w-full`} data-name="uncheck-all-btn" onClick={disabled ? undefined : onClick}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
            <p className="leading-[normal]">Uncheck all items</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTemplateBtn({ onClick, stage }: { onClick: () => void; stage: 'idle' | 'fill' | 'copied' | 'blank' | 'go' }) {
  return (
    <button className="bg-[#4784F8] h-[50px] relative rounded-[100px] shrink-0 w-full border-none p-0 cursor-pointer" data-name="create-template-btn" onClick={onClick}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          {stage === 'copied' ? (
            <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0">
              <svg className="block shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14.4152 18.1609C14.854 18.1609 15.2098 18.5167 15.2098 18.9555C15.2098 19.3943 14.854 19.75 14.4152 19.75H11.6911C11.2523 19.75 10.8966 19.3943 10.8966 18.9555C10.8966 18.5167 11.2523 18.1609 11.6911 18.1609H14.4152Z" fill="white"/>
                <path d="M6.99479 16.3608C7.42491 16.2746 7.84305 16.5532 7.92944 16.9833C8.01327 17.4004 8.14468 17.6113 8.34179 17.7734C8.55972 17.9527 8.88081 18.0883 9.48837 18.168C9.92328 18.2251 10.2297 18.6234 10.173 19.0583C10.1159 19.4934 9.71684 19.8 9.28176 19.7429C8.53098 19.6445 7.87526 19.4462 7.33265 18.9998C6.78118 18.5461 6.50747 17.9685 6.37229 17.2954C6.28606 16.8653 6.56467 16.4472 6.99479 16.3608Z" fill="white"/>
                <path d="M18.1769 16.9833C18.2633 16.5532 18.6814 16.2746 19.1115 16.3608C19.5417 16.4472 19.8203 16.8653 19.734 17.2954C19.5989 17.9685 19.3251 18.5461 18.7737 18.9998C18.2311 19.4462 17.5753 19.6445 16.8246 19.7429C16.3895 19.8 15.9904 19.4934 15.9334 19.0583C15.8766 18.6234 16.183 18.2251 16.618 18.168C17.2255 18.0883 17.5466 17.9527 17.7645 17.7734C17.9616 17.6113 18.0931 17.4004 18.1769 16.9833Z" fill="white"/>
                <path d="M7.60489 1.44977e-06C9.07801 1.55801e-06 10.2527 -0.00166324 11.1821 0.108187C12.129 0.220112 12.9241 0.457041 13.5914 1.0047C13.8156 1.18865 14.0211 1.3942 14.2051 1.61835C14.724 2.2507 14.964 2.99778 15.083 3.88048C15.1995 4.74551 15.2087 5.82103 15.2098 7.14998C15.2098 7.38362 15.1078 7.59341 14.9473 7.73879C14.926 7.75812 14.9041 7.77682 14.8808 7.79377C14.7912 7.85875 14.6881 7.90641 14.5757 7.92944C14.5242 7.94003 14.4708 7.94534 14.4161 7.9454L14.4152 7.94452L11.6911 7.9454C11.2523 7.9454 10.8966 7.58968 10.8966 7.15086C10.8966 6.71205 11.2523 6.35632 11.6911 6.35632H13.6171C13.6101 5.40556 13.587 4.67936 13.5081 4.0933C13.4108 3.37144 13.2394 2.94651 12.9769 2.6266C12.859 2.48291 12.7269 2.35079 12.5832 2.23287C12.246 1.9562 11.7924 1.78081 10.9959 1.68663C10.1815 1.59036 9.11694 1.58908 7.60489 1.58908C6.09283 1.58908 5.0283 1.59036 4.2139 1.68663C3.4174 1.78081 2.96381 1.9562 2.6266 2.23287C2.48291 2.35079 2.35079 2.48291 2.23287 2.6266C1.9562 2.96381 1.78081 3.4174 1.68663 4.2139C1.59036 5.0283 1.58908 6.09283 1.58908 7.60489C1.58908 9.11694 1.59036 10.1815 1.68663 10.9959C1.78081 11.7924 1.9562 12.246 2.23287 12.5832C2.35079 12.7269 2.48291 12.859 2.6266 12.9769C2.94651 13.2394 3.37144 13.4108 4.0933 13.5081C4.67936 13.587 5.40556 13.6092 6.35632 13.6163V11.6911C6.35632 11.2523 6.71205 10.8966 7.15086 10.8966C7.58968 10.8966 7.9454 11.2523 7.9454 11.6911V14.4152C7.9454 14.5523 7.91075 14.6813 7.84963 14.7939C7.81927 14.8498 7.78115 14.9005 7.73879 14.9473C7.7146 14.974 7.68922 14.9994 7.66164 15.0227C7.65471 15.0285 7.64748 15.0339 7.64036 15.0395C7.50532 15.1455 7.33587 15.2098 7.15086 15.2098L7.14998 15.2089C5.82102 15.2078 4.74552 15.1995 3.88048 15.083C2.99778 14.964 2.2507 14.724 1.61835 14.2051C1.3942 14.0211 1.18865 13.8156 1.0047 13.5914C0.457041 12.9241 0.220112 12.129 0.108187 11.1821C-0.00166323 10.2527 1.34081e-06 9.07801 1.44956e-06 7.60489C1.55651e-06 6.13177 -0.00166326 4.95703 0.108187 4.02768C0.220112 3.0808 0.457041 2.28568 1.0047 1.61835C1.18865 1.3942 1.3942 1.18865 1.61835 1.0047C2.28568 0.457041 3.0808 0.220112 4.02768 0.108187C4.95703 -0.00166331 6.13177 1.34101e-06 7.60489 1.44977e-06Z" fill="white"/>
                <path d="M18.9555 10.8966C19.3943 10.8966 19.75 11.2523 19.75 11.6911V14.4152C19.75 14.854 19.3943 15.2098 18.9555 15.2098C18.5167 15.2098 18.1609 14.854 18.1609 14.4152V11.6911C18.1609 11.2523 18.5167 10.8966 18.9555 10.8966Z" fill="white"/>
                <path d="M9.28176 6.36342C9.71684 6.30636 10.1159 6.61291 10.173 7.048C10.2297 7.48289 9.92328 7.88125 9.48837 7.93831C8.88081 8.01798 8.55973 8.15367 8.34179 8.33292C8.14468 8.49507 8.01327 8.7059 7.92944 9.12303C7.84305 9.55315 7.42491 9.83176 6.99479 9.74553C6.56467 9.65914 6.28606 9.241 6.37229 8.81089C6.50747 8.13783 6.78118 7.56022 7.33265 7.10653C7.87526 6.66015 8.53099 6.46187 9.28176 6.36342Z" fill="white"/>
                <path d="M16.8246 6.36342C17.5753 6.46187 18.2311 6.66015 18.7737 7.10653C19.3251 7.56022 19.5989 8.13783 19.734 8.81089C19.8203 9.241 19.5417 9.65914 19.1115 9.74553C18.6814 9.83176 18.2633 9.55315 18.1769 9.12303C18.0931 8.7059 17.9616 8.49507 17.7645 8.33292C17.5466 8.15367 17.2255 8.01798 16.618 7.93831C16.183 7.88125 15.8766 7.48289 15.9334 7.048C15.9904 6.61291 16.3895 6.30636 16.8246 6.36342Z" fill="white"/>
              </svg>
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                <p className="leading-[normal]">Added to your templates!</p>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap"
              style={{ opacity: stage === 'blank' ? 0 : 1, transition: `opacity ${stage === 'go' ? '250ms' : '150ms'} ease` }}
            >
              <p className="leading-[normal]">{stage === 'go' ? 'Go to template?' : (stage === 'blank' || stage === 'fill') ? '' : 'Create template from list'}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SetDateBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="bg-[#4784F8] h-[50px] relative rounded-[100px] shrink-0 w-full border-none p-0 cursor-pointer" data-name="set-date-btn" onClick={onClick}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
            <p className="leading-[normal]">Set date</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function DatePickerButtons({ onSetDate }: { onSetDate: () => void }) {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <SetDateBtn onClick={onSetDate} />
    </div>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="bg-[#939393] h-[50px] relative rounded-[100px] shrink-0 w-full border-none p-0 cursor-pointer" data-name="delete-btn" onClick={onClick}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
            <p className="leading-[normal]">Delete list</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function Buttons({ onUncheckAll, onCreateTemplate, createTemplateStage, onDelete, allUnchecked, showUncheckAll }: { onUncheckAll: () => void; onCreateTemplate: () => void; createTemplateStage: 'idle' | 'fill' | 'copied' | 'blank' | 'go'; onDelete: () => void; allUnchecked: boolean; showUncheckAll: boolean }) {
  if (!showUncheckAll) return null;
  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full" data-name="buttons">
      <UncheckAllBtn onClick={onUncheckAll} disabled={allUnchecked} />
      <CreateTemplateBtn onClick={onCreateTemplate} stage={createTemplateStage} />
      <DeleteBtn onClick={onDelete} />
    </div>
  );
}

export default function InfoOverlay({ sortMode, onSortChange, listTitle, onUncheckAll, onCreateTemplate, createTemplateStage, onDelete, allUnchecked, smartReminders, onSmartRemindersChange, showSmartReminders, smartReminderDueDate, smartReminderTime, onSetSmartReminderDueDate, onOpenSmartReminderEditor }: { sortMode: 'alphabetical' | 'insertion'; onSortChange: (mode: 'alphabetical' | 'insertion') => void; listTitle: string; onUncheckAll: () => void; onCreateTemplate: () => void; createTemplateStage: 'idle' | 'fill' | 'copied' | 'blank' | 'go'; onDelete: () => void; allUnchecked: boolean; smartReminders: boolean; onSmartRemindersChange: (val: boolean) => void; showSmartReminders: boolean; smartReminderDueDate: Date | null; smartReminderTime: string | null | undefined; onSetSmartReminderDueDate: (date: Date) => void; onOpenSmartReminderEditor?: () => void }) {
  const smartRemindersActive = showSmartReminders && smartReminders;
  const [draftSmartReminderDate, setDraftSmartReminderDate] = useState<Date>(smartReminderDueDate ?? new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(smartRemindersActive && smartReminderDueDate == null);
  const [dueDateHighlightPhase, setDueDateHighlightPhase] = useState<'idle' | 'immediate' | 'fade'>('idle');
  const [pendingDisplaySmartReminderDate, setPendingDisplaySmartReminderDate] = useState<Date | null>(null);
  const previousDueDateRef = useRef<number | null>(smartReminderDueDate?.getTime() ?? null);
  const dueDateHighlightTimerRef = useRef<number | null>(null);
  const displaySmartReminderDate = smartRemindersActive
    ? (isDatePickerOpen ? draftSmartReminderDate : (pendingDisplaySmartReminderDate ?? smartReminderDueDate))
    : smartReminderDueDate;
  const smartReminderDueDateTime = smartReminderDueDate?.getTime() ?? null;

  const startDueDateHighlight = () => {
    setDueDateHighlightPhase('immediate');
    if (dueDateHighlightTimerRef.current !== null) {
      clearTimeout(dueDateHighlightTimerRef.current);
    }
  };

  useEffect(() => {
    const prevTime = previousDueDateRef.current;
    const nextTime = smartReminderDueDateTime;
    previousDueDateRef.current = nextTime;
    if (prevTime === nextTime || nextTime == null) return;
    setPendingDisplaySmartReminderDate(null);
  }, [smartReminderDueDateTime]);

  useEffect(() => {
    if (dueDateHighlightPhase !== 'immediate' || isDatePickerOpen) return;
    const frameId = window.requestAnimationFrame(() => {
      setDueDateHighlightPhase('fade');
      dueDateHighlightTimerRef.current = window.setTimeout(() => {
        dueDateHighlightTimerRef.current = null;
        setDueDateHighlightPhase('idle');
      }, 1500);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [dueDateHighlightPhase, isDatePickerOpen]);

  useEffect(() => {
    return () => {
      if (dueDateHighlightTimerRef.current !== null) {
        clearTimeout(dueDateHighlightTimerRef.current);
      }
    };
  }, [smartReminderDueDateTime]);

  const handleSmartRemindersChange = (nextValue: boolean) => {
    if (nextValue) {
      setDraftSmartReminderDate(smartReminderDueDate ?? new Date());
    } else {
      setIsDatePickerOpen(false);
    }
    onSmartRemindersChange(nextValue);
  };

  const handleOpenDatePicker = () => {
    setDraftSmartReminderDate(smartReminderDueDate ?? new Date());
    setIsDatePickerOpen(true);
  };

  const handleCloseDatePicker = () => {
    setDraftSmartReminderDate(smartReminderDueDate ?? new Date());
    setPendingDisplaySmartReminderDate(null);
    setIsDatePickerOpen(false);
    if (smartReminderDueDate == null) {
      onSmartRemindersChange(false);
    }
  };

  const handleSetDate = () => {
    setPendingDisplaySmartReminderDate(draftSmartReminderDate);
    startDueDateHighlight();
    onSetSmartReminderDueDate(draftSmartReminderDate);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="bg-white content-stretch flex flex-col gap-[40px] items-center justify-start px-[30px] py-[40px] relative rounded-[32px] mx-auto" style={{ width: 340 }} data-name="info-overlay">
      <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center w-full">
        <p className="leading-[normal] whitespace-pre-wrap break-words" style={{ fontWeight: 700 }}>{listTitle}</p>
      </div>
      <Frame3 sortMode={sortMode} onSortChange={onSortChange} smartReminders={smartReminders} onSmartRemindersChange={handleSmartRemindersChange} showSmartReminders={showSmartReminders} displaySmartReminderDate={displaySmartReminderDate} smartReminderTime={smartReminderTime} selectedSmartReminderDate={draftSmartReminderDate} isDatePickerOpen={isDatePickerOpen} onDateSelect={setDraftSmartReminderDate} onSetDate={handleSetDate} onCloseDatePicker={handleCloseDatePicker} onOpenDatePicker={handleOpenDatePicker} onOpenSmartReminderEditor={onOpenSmartReminderEditor} highlightDueDate={dueDateHighlightPhase !== 'idle'} animateFadeOut={dueDateHighlightPhase === 'fade'} />
      <Buttons onUncheckAll={onUncheckAll} onCreateTemplate={onCreateTemplate} createTemplateStage={createTemplateStage} onDelete={onDelete} allUnchecked={allUnchecked} showUncheckAll={!smartRemindersActive || !isDatePickerOpen} />
    </div>
  );
}
