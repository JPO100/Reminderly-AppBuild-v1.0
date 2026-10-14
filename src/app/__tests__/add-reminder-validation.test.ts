import { describe, it, expect } from 'vitest';
import { canSubmitReminder } from '../../imports/NewReminderOverlay';

const noon = { hour: 12, minute: 0 };
const today = new Date(2026, 9, 9);

// Create mode defaults: Date and Time OFF, nothing selected
function create(overrides: Partial<Parameters<typeof canSubmitReminder>[0]> = {}) {
  return canSubmitReminder({
    text: 'Buy milk',
    requiresScheduledReminder: true,
    isDateOn: false,
    selectedDate: null,
    isTimeOn: false,
    selectedTime: null,
    ...overrides,
  });
}

describe('add reminder validation', () => {
  it('empty text is disabled with Date OFF', () => {
    expect(create({ text: '' })).toBe(false);
  });

  it('empty text is disabled with Date and Time ON', () => {
    expect(create({ text: '', isDateOn: true, selectedDate: today, isTimeOn: true, selectedTime: noon })).toBe(false);
  });

  it('whitespace-only text is disabled with Date OFF or ON', () => {
    expect(create({ text: '   \n\t' })).toBe(false);
    expect(create({ text: '   ', isDateOn: true, selectedDate: today, isTimeOn: true, selectedTime: noon })).toBe(false);
  });

  it('valid text with Date OFF is enabled (saves as Sometime)', () => {
    expect(create()).toBe(true);
  });

  it('valid text with Date and Time ON and selected is enabled', () => {
    expect(create({ isDateOn: true, selectedDate: today, isTimeOn: true, selectedTime: noon })).toBe(true);
  });

  it('Date ON with Time OFF is disabled (no date-only reminders)', () => {
    expect(create({ isDateOn: true, selectedDate: today, isTimeOn: false, selectedTime: null })).toBe(false);
  });

  it('Date ON without a selected date is disabled', () => {
    expect(create({ isDateOn: true, selectedDate: null, isTimeOn: true, selectedTime: noon })).toBe(false);
  });

  it('Time ON without a selected time is disabled', () => {
    expect(create({ isDateOn: true, selectedDate: today, isTimeOn: true, selectedTime: null })).toBe(false);
  });

  it('edit and smart reminder modes keep text-only validation', () => {
    expect(create({ requiresScheduledReminder: false, isDateOn: true, selectedDate: today })).toBe(true);
    expect(create({ requiresScheduledReminder: false, text: ' ' })).toBe(false);
  });
});
