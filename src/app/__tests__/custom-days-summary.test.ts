import { describe, expect, it } from 'vitest';
import { formatCustomDaysSummary } from '../reminder-utils';

describe('formatCustomDaysSummary', () => {
  it('returns null when no days are selected', () => {
    expect(formatCustomDaysSummary([])).toBeNull();
  });

  it('uses the full name for one day', () => {
    expect(formatCustomDaysSummary(['Monday'])).toBe('Every Monday');
  });

  it('uses full names joined by "and" for two days, in week order', () => {
    expect(formatCustomDaysSummary(['Tuesday', 'Monday'])).toBe('Every Monday and Tuesday');
  });

  it('uses short names with "and" for three or more days when it fits', () => {
    expect(formatCustomDaysSummary(['Wednesday', 'Monday', 'Tuesday'])).toBe('Every Mon, Tue and Wed');
  });

  it('drops "and" for three or more days when that line would not fit', () => {
    const fits = (text: string) => !text.includes(' and ');
    expect(formatCustomDaysSummary(['Saturday', 'Friday', 'Tuesday', 'Monday'], fits)).toBe('Every Mon, Tue, Fri, Sat');
  });

  it('says "Every weekday" for exactly Monday to Friday', () => {
    expect(formatCustomDaysSummary(['Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday'])).toBe('Every weekday');
  });

  it('does not say weekday for five days that include the weekend', () => {
    expect(formatCustomDaysSummary(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'])).toBe('Every Mon, Tue, Wed, Thu and Sat');
  });

  it('says "Every day" for all seven days', () => {
    expect(formatCustomDaysSummary(['Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday'])).toBe('Every day');
  });
});
