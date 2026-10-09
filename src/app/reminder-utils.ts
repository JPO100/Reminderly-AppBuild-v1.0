import type { RepeatRule } from "./types/reminder";
import { formatTime12h } from "./utils/normalise-text";
import { formatOrdinalDay, formatShortMonthDay } from "./utils/date-display";

export type ReminderCategory = "today" | "this-week" | "later" | "sometime" | "other";

export type ReminderSchedule =
  | { kind: "scheduled"; date: string; time?: string }
  | { kind: "sometime" };

export type Reminder = {
  id: string;
  originalText: string;
  displayText: string;
  createdAt: number;
  schedule: ReminderSchedule;
  repeatRule?: RepeatRule | null;
  completedAt?: number | null;
  deletedAt?: number | null;
  linkedListId?: string | null;
  isSmartReminder?: boolean;
};

export type RepeatConfig = {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom-days';
  interval: number;
  selectedDays?: string[];
} | null;

// View mode: standard reminder list vs done/deleted archive view
export type ViewMode = "list" | "done-deleted";



export const STORAGE_KEY = "reminderly.reminders.v1";

export function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<Reminder[]>((acc, r: any) => {
      // Determine text fields: support new format (originalText/displayText) and legacy (text)
      let originalText: string | undefined;
      let displayText: string | undefined;
      if (typeof r.originalText === "string" && typeof r.displayText === "string") {
        originalText = r.originalText;
        displayText = r.displayText;
      } else if (typeof r.text === "string") {
        originalText = r.text;
        displayText = r.text;
      }

      // Skip corrupt entries missing required fields
      if (typeof r.id !== "string" || r.id.trim() === "" || originalText === undefined) return acc;

      // Legacy localStorage support — convert removed inbox schedule kind to sometime
      const schedule =
        r.schedule?.kind === "inbox"
          ? { kind: "sometime" as const }
          : r.schedule;

      // Validate schedule shape — drop records with missing or malformed schedule
      if (schedule == null || typeof schedule.kind !== "string") return acc;
      if (schedule.kind === "scheduled") {
        // date must be a yyyy-mm-dd string
        if (typeof schedule.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(schedule.date)) return acc;
        // Normalise empty time to undefined; validate non-empty time as HH:mm
        if (schedule.time === "") {
          schedule.time = undefined;
        } else if (schedule.time != null && (typeof schedule.time !== "string" || !/^\d{2}:\d{2}$/.test(schedule.time))) {
          return acc;
        }
        // Validate HH:mm range (hour 00-23, minute 00-59)
        if (typeof schedule.time === "string") {
          const h = parseInt(schedule.time.slice(0, 2), 10);
          const m = parseInt(schedule.time.slice(3, 5), 10);
          if (h > 23 || m > 59) return acc;
        }
      } else if (schedule.kind !== "sometime") {
        // Unknown schedule.kind — drop
        return acc;
      }

      // Sanitise: keep only fields in the current Reminder type
      const sanitised: Reminder = {
        id: r.id,
        originalText,
        displayText: displayText!,
        createdAt: Number.isFinite(r.createdAt) ? r.createdAt : Date.now(),
        schedule,
      };
      if (r.repeatRule != null) {
        if (typeof r.repeatRule === 'object' && typeof r.repeatRule.frequency === 'string' && typeof r.repeatRule.interval === 'number') {
          sanitised.repeatRule = r.repeatRule;
        } else {
          sanitised.repeatRule = null;
        }
      }
      if (r.completedAt != null) {
        sanitised.completedAt = r.completedAt;
      }
      if (r.deletedAt != null) {
        sanitised.deletedAt = r.deletedAt;
      }
      if (typeof r.linkedListId === "string" && r.linkedListId.trim() !== "") {
        sanitised.linkedListId = r.linkedListId;
      }
      if (r.isSmartReminder === true) {
        sanitised.isSmartReminder = true;
      }
      acc.push(sanitised);
      return acc;
    }, []);
  } catch {
    return [];
  }
}

export function computeBadgeCount(
  reminders: Reminder[],
  includeTodayInBadge: boolean,
  now: Date
): number {
  let count = 0;
  for (const r of reminders) {
    if (r.completedAt || r.deletedAt || r.schedule.kind !== 'scheduled') continue;
    if (isOverdue(r, now)) {
      count++;
    } else if (includeTodayInBadge && categoriseReminder(r, now) === 'today') {
      count++;
    }
  }
  return count;
}

export function getNextTimeRefreshBoundary(reminders: Reminder[], now: Date): number | null {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const msToMidnight = tomorrowStart.getTime() - now.getTime();

  let earliest = msToMidnight;

  for (const r of reminders) {
    if (r.completedAt || r.deletedAt) continue;
    if (r.schedule.kind !== 'scheduled' || !r.schedule.time) continue;

    const [y, m, d] = r.schedule.date.split('-').map(Number);
    const reminderDate = new Date(y, m - 1, d);
    reminderDate.setHours(0, 0, 0, 0);

    if (reminderDate.getTime() !== todayStart.getTime()) continue;

    const [hh, mm] = r.schedule.time.split(':').map(Number);
    const scheduledMoment = new Date(y, m - 1, d, hh, mm, 0, 0);
    const msUntil = scheduledMoment.getTime() - now.getTime();

    if (msUntil > 0 && msUntil < earliest) {
      earliest = msUntil;
    }
  }

  if (earliest <= 0) return null;
  return earliest;
}

// Pure helper: is a scheduled reminder overdue relative to `now`?
// Only applies to kind === "scheduled". Sometime is never overdue.
// Date-only: overdue when date < today (today is not overdue).
// Date+time: overdue when the combined datetime < now.
export function isOverdue(reminder: Reminder, now: Date): boolean {
  if (reminder.schedule.kind !== "scheduled") return false;

  const [y, m, d] = reminder.schedule.date.split("-").map(Number);

  if (reminder.schedule.time) {
    // Has time - compare full datetime
    const [hh, mm] = reminder.schedule.time.split(":").map(Number);
    const scheduledMoment = new Date(y, m - 1, d, hh, mm, 0, 0);
    return scheduledMoment.getTime() < now.getTime();
  }

  // Date-only - overdue if date is strictly before today
  const reminderDate = new Date(y, m - 1, d);
  reminderDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return reminderDate.getTime() < today.getTime();
}

// Derive category from schedule - not persisted
export function categoriseReminder(reminder: Reminder, now: Date): ReminderCategory {
  if (reminder.schedule.kind === "sometime") return "sometime";
  // scheduled - parse date
  const [y, m, d] = reminder.schedule.date.split("-").map(Number);
  const reminderDate = new Date(y, m - 1, d);
  reminderDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (reminderDate.getTime() === today.getTime()) return "today";

  // Monday-Sunday week boundary (UK)
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (reminderDate >= monday && reminderDate <= sunday) return "this-week";

  return "later";
}

// Sort: overdue pinned to the absolute top of every view,
// then group by category (today → this-week → later → sometime),
// then sort within each group (scheduled by date/time ascending, rest by createdAt).
export function sortReminders(list: Reminder[], now: Date): Reminder[] {
  const categoryOrder: Record<string, number> = {
    today: 0,
    'this-week': 1,
    later: 2,
    sometime: 3,
  };

  const withMeta = list.map((r) => ({
    reminder: r,
    category: categoriseReminder(r, now),
    overdue: isOverdue(r, now),
  }));

  withMeta.sort((a, b) => {
    // Primary key: overdue items always come first
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;

    // Secondary key: category ordering
    const catA = categoryOrder[a.category] ?? 5;
    const catB = categoryOrder[b.category] ?? 5;
    if (catA !== catB) return catA - catB;

    // Tertiary: scheduled by date/time ascending, rest by createdAt
    if (a.reminder.schedule.kind === 'scheduled' && b.reminder.schedule.kind === 'scheduled') {
      const sa = a.reminder.schedule as { kind: 'scheduled'; date: string; time?: string };
      const sb = b.reminder.schedule as { kind: 'scheduled'; date: string; time?: string };
      const dc = sa.date.localeCompare(sb.date);
      if (dc !== 0) return dc;
      if (sa.time && sb.time) return sa.time.localeCompare(sb.time);
      if (sa.time) return -1;
      if (sb.time) return 1;
      return 0;
    }

    return a.reminder.createdAt - b.reminder.createdAt;
  });

  return withMeta.map((w) => w.reminder);
}

// Format a human-readable repeat label from a RepeatRule
const DAY_ABBREV_TO_SHORT: Record<string, string> = {
  mo: 'Mon', tu: 'Tue', we: 'Wed', th: 'Thu', fr: 'Fri', sa: 'Sat', su: 'Sun',
};
const DAY_ABBREV_ORDER: Record<string, number> = {
  mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6,
};

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatScheduledDateForRow(date: string, now: Date): string {
  const [y, m, d] = date.split('-').map(Number);
  const scheduledDate = new Date(y, m - 1, d);
  scheduledDate.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((scheduledDate.getTime() - today.getTime()) / 86400000);

  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays >= 2 && diffDays <= 5) return WEEKDAY_LONG[scheduledDate.getDay()];

  return formatShortMonthDay(scheduledDate, today);
}

export function formatReminderNextOccurrenceLabel(date: string | null | undefined, time?: string | null, now: Date = new Date()): string | null {
  if (!date) return null;
  const dateLabel = formatScheduledDateForRow(date, now);
  if (time) return `${dateLabel} at ${formatTime12h(time)}`;
  return dateLabel;
}

export function formatRepeatRuleText(repeatRule: RepeatRule | null | undefined, scheduleDate?: string | null): string | null {
  if (repeatRule == null) return null;

  const { frequency, interval, byDay } = repeatRule;

  const units: Record<string, { singular: string; plural: string }> = {
    hourly: { singular: 'hour', plural: 'hours' },
    daily: { singular: 'day', plural: 'days' },
    weekly: { singular: 'week', plural: 'weeks' },
    monthly: { singular: 'month', plural: 'months' },
    yearly: { singular: 'year', plural: 'years' },
  };

  const unit = units[frequency];
  if (!unit) return null;

  let base: string;
  if (frequency === 'daily' && interval === 2) {
    base = 'Every other day';
  } else if (frequency === 'weekly' && interval === 2 && byDay && byDay.length === 1) {
    const onlyDay = DAY_ABBREV_TO_SHORT[byDay[0]] ?? byDay[0];
    base = `Every other ${onlyDay}`;
  } else if (frequency === 'weekly' && interval === 2) {
    base = 'Every other week';
  } else if (frequency === 'monthly' && interval === 2) {
    base = 'Every other month';
  } else if (frequency === 'yearly' && interval === 2) {
    base = 'Every other year';
  } else if (interval === 1) {
    base = `Every ${unit.singular}`;
  } else {
    base = `Every ${interval} ${unit.plural}`;
  }

  if (frequency === 'weekly' && byDay && byDay.length > 0) {
    const days = [...byDay]
      .sort((a, b) => (DAY_ABBREV_ORDER[a] ?? Number.MAX_SAFE_INTEGER) - (DAY_ABBREV_ORDER[b] ?? Number.MAX_SAFE_INTEGER))
      .map((d) => DAY_ABBREV_TO_SHORT[d] ?? d)
      .join(', ');
    if (interval === 2 && byDay.length === 1) {
      return base;
    }
    return `${base} (${days})`;
  }

  if (frequency === 'monthly' && scheduleDate) {
    const dayNum = parseInt(scheduleDate.split('-')[2], 10);
    return `${base} on ${formatOrdinalDay(dayNum)}`;
  }

  return base;
}

export function formatRepeatLabel(repeatRule: RepeatRule | null | undefined, time?: string | null, scheduleDate?: string | null): string | null {
  if (repeatRule == null) return null;

  const { frequency, interval, byDay } = repeatRule;

  const units: Record<string, { singular: string; plural: string }> = {
    hourly: { singular: 'hour', plural: 'hours' },
    daily: { singular: 'day', plural: 'days' },
    weekly: { singular: 'week', plural: 'weeks' },
    monthly: { singular: 'month', plural: 'months' },
    yearly: { singular: 'year', plural: 'years' },
  };

  const unit = units[frequency];
  if (!unit) return null;

  let label = interval === 1
    ? `Repeats every ${unit.singular}`
    : `Repeats every ${interval} ${unit.plural}`;

  if (frequency === 'weekly' && byDay && byDay.length > 0) {
    const days = [...byDay]
      .sort((a, b) => (DAY_ABBREV_ORDER[a] ?? Number.MAX_SAFE_INTEGER) - (DAY_ABBREV_ORDER[b] ?? Number.MAX_SAFE_INTEGER))
      .map((d) => DAY_ABBREV_TO_SHORT[d] ?? d)
      .join(', ');
    label = `${label} (${days})`;
  }

  if (frequency === 'monthly' && scheduleDate) {
    const dayNum = parseInt(scheduleDate.split('-')[2], 10);
    label = `${label} on ${formatOrdinalDay(dayNum)}`;
  }

  if (time) {
    label = `${label} at ${formatTime12h(time)}`;
  }

  return label;
}
