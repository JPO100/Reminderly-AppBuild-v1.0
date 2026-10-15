import type { Reminder } from "../reminder-utils";
import { formatShortMonthDay } from "./date-display";

export type ListItem = {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number | null;
};

export type CreatedList = {
  id: string;
  title: string;
  items: ListItem[];
  sortMode?: 'alphabetical' | 'insertion';
  pinnedAt?: number | null;
  smartReminders?: boolean;
  smartReminderDueDate?: string | null;
  smartReminderTime?: string | null;
  status?: 'active' | 'done' | 'deleted';
  statusChangedAt?: number | null;
  // When an active list last became fully ticked (null while not fully ticked). Used by Clear done lists nightly.
  fullyTickedAt?: number | null;
};

// List buckets: Todo (nothing ticked, including empty lists), Started (some ticked), Done (all ticked).
export type ListCategory = 'complete' | 'started' | 'todo';

export const LIST_CATEGORY_COLOURS: Record<ListCategory, string> = {
  todo: '#939393',
  started: '#60C1E7',
  complete: '#8168D5',
};

export const PINNED_LIST_COLOUR = '#1C2C42';

/** Progress circle colour on a list card: navy for pinned lists, otherwise the bucket colour. */
export function getListCircleColour(list: { items: ListItem[]; pinnedAt?: number | null }, pinnedListsEnabled: boolean): string {
  if (pinnedListsEnabled && typeof list.pinnedAt === 'number') return PINNED_LIST_COLOUR;
  return LIST_CATEGORY_COLOURS[getCurrentListCategory(list.items)];
}

const LIST_CATEGORY_ORDER: Record<ListCategory, number> = { todo: 0, started: 1, complete: 2 };

/** Lists that were populated in prev and are blank (no title, no items) in next. Used by the list data loss diagnostic. */
export function getBlankedLists(prev: CreatedList[], next: CreatedList[]): { before: CreatedList; after: CreatedList }[] {
  const blanked: { before: CreatedList; after: CreatedList }[] = [];
  for (const after of next) {
    if (after.title !== '' || after.items.length > 0) continue;
    const before = prev.find((l) => l.id === after.id);
    if (before && (before.title !== '' || before.items.length > 0)) blanked.push({ before, after });
  }
  return blanked;
}

/** A list with its smart reminder turned off and its due date and time cleared, as after the smart reminder is deleted. */
export function clearListSmartReminder(list: CreatedList): CreatedList {
  return { ...list, smartReminders: false, smartReminderDueDate: null, smartReminderTime: null };
}

export function dateToStorageString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function storageStringToDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatListDueDate(value: string | null | undefined, now: Date = new Date()): string {
  const date = storageStringToDate(value);
  if (!date) return 'Jan 1st 2026';
  return formatShortMonthDay(date, now, { yearFormat: 'short' });
}

function formatTime12h(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "pm" : "am";
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  if (mm === 0) return `${h12}${suffix}`;
  return `${h12}:${String(mm).padStart(2, "0")}${suffix}`;
}

export function getSmartReminderTime(value: string | null | undefined): string {
  return value || "12:00";
}

export function formatSmartReminderDueBy(dateValue: string | null | undefined, timeValue: string | null | undefined, now: Date = new Date()): string {
  return `${formatListDueDate(dateValue, now)} at ${formatTime12h(getSmartReminderTime(timeValue))}`;
}

export function formatSmartReminderDueByFromDate(date: Date | null, timeValue: string | null | undefined, now: Date = new Date()): string {
  if (!date) return "No completion date set";
  return `Due by ${formatShortMonthDay(date, now, { yearFormat: 'short' })} at ${formatTime12h(getSmartReminderTime(timeValue))}`;
}

export function formatListProgress(doneCount: number, totalCount: number): string {
  return `${doneCount} of ${totalCount}`;
}

export function buildSmartReminderText(list: CreatedList): string {
  const total = list.items.length;
  const completed = list.items.filter((item) => item.completed).length;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  if (progress <= 0) {
    return `Complete '${list.title}' list`;
  }
  if (progress < 75) {
    return `Finish '${list.title}' list`;
  }
  return `Nearly done - '${list.title}'`;
}

export function createSmartReminderForList(
  list: CreatedList,
  options?: { idFactory?: () => string; createdAt?: number },
): Reminder | null {
  if (!list.smartReminderDueDate) return null;
  const text = buildSmartReminderText(list);
  return {
    id: options?.idFactory?.() ?? crypto.randomUUID(),
    originalText: text,
    displayText: text,
    createdAt: options?.createdAt ?? Date.now(),
    schedule: { kind: "scheduled", date: list.smartReminderDueDate, time: getSmartReminderTime(list.smartReminderTime) },
    linkedListId: list.id,
    isSmartReminder: true,
  };
}

export function getCurrentListCategory(items: ListItem[]): ListCategory {
  const total = items.length;
  const checked = items.filter((item) => item.completed).length;
  if (total > 0 && checked === total) return "complete";
  if (checked > 0) return "started";
  return "todo";
}

function isActiveList(list: CreatedList): boolean {
  return list.status !== 'done' && list.status !== 'deleted';
}

function isPinned(list: CreatedList, pinnedListsEnabled: boolean): boolean {
  return pinnedListsEnabled && typeof list.pinnedAt === 'number';
}

/**
 * Keeps fullyTickedAt in step with each active list's items: stamped when a list becomes fully ticked,
 * cleared when it stops being fully ticked. Returns the same array when nothing changes.
 */
export function syncFullyTickedAt(lists: CreatedList[], nowMs: number): CreatedList[] {
  let changed = false;
  const next = lists.map((list) => {
    if (!isActiveList(list)) return list;
    const fullyTicked = getCurrentListCategory(list.items) === 'complete';
    if (fullyTicked && typeof list.fullyTickedAt !== 'number') {
      changed = true;
      return { ...list, fullyTickedAt: nowMs };
    }
    if (!fullyTicked && list.fullyTickedAt != null) {
      changed = true;
      return { ...list, fullyTickedAt: null };
    }
    return list;
  });
  return changed ? next : lists;
}

/**
 * The list as marked done. Manual completion ticks every item now. Clear done lists nightly (autoDoneAt)
 * keeps the items and their tick times, and dates the list from when it became fully ticked.
 */
export function markListDone(list: CreatedList, nowMs: number, autoDoneAt?: number): CreatedList {
  return {
    ...list,
    items: autoDoneAt != null ? list.items : list.items.map((item) => ({ ...item, completed: true, completedAt: nowMs })),
    status: 'done',
    statusChangedAt: autoDoneAt ?? nowMs,
  };
}

/** Fully ticked, active and unpinned: shows "Clears tonight" while Clear done lists nightly is on. */
export function isListClearingTonight(list: CreatedList, pinnedListsEnabled: boolean): boolean {
  return isActiveList(list) && !isPinned(list, pinnedListsEnabled) && getCurrentListCategory(list.items) === 'complete';
}

/** Lists Clear done lists nightly moves to Done: clearing tonight and fully ticked before the start of the local day. */
export function getListsToAutoClear(lists: CreatedList[], now: Date, pinnedListsEnabled: boolean): CreatedList[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return lists.filter((list) => (
    isListClearingTonight(list, pinnedListsEnabled)
    && typeof list.fullyTickedAt === 'number'
    && list.fullyTickedAt < startOfToday.getTime()
  ));
}

/** Todo, then Started, then Done. Lists keep their existing order (oldest first) within each bucket. */
export function orderListsByCategory<T extends { items: ListItem[] }>(lists: T[]): T[] {
  return lists
    .map((list, index) => ({ list, index, order: LIST_CATEGORY_ORDER[getCurrentListCategory(list.items)] }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ list }) => list);
}

// Lists settings > Sort items A to Z decides the order for every list. A list's own legacy
// sortMode is not read. The template editor always sorts A to Z.
export function resolveListSortMode(sortAzOn: boolean, isTemplateEditor: boolean): 'alphabetical' | 'insertion' {
  return isTemplateEditor || sortAzOn ? 'alphabetical' : 'insertion';
}

export function getDisplayListItems(
  listItems: ListItem[],
  sortMode: 'alphabetical' | 'insertion',
  alphabeticalPinnedListItemId: string | null,
  alphabeticalPinnedListItemIndex: number,
): ListItem[] {
  if (sortMode !== 'alphabetical') {
    const incompleteItems: ListItem[] = [];
    const completedItems: Array<ListItem & { originalIndex: number }> = [];

    listItems.forEach((item, index) => {
      if (item.completed) {
        completedItems.push({ ...item, originalIndex: index });
        return;
      }
      incompleteItems.push(item);
    });

    completedItems.sort((a, b) => {
      const completedAtDiff = (b.completedAt ?? 0) - (a.completedAt ?? 0);
      if (completedAtDiff !== 0) return completedAtDiff;
      return a.originalIndex - b.originalIndex;
    });

    return [
      ...incompleteItems,
      ...completedItems.map(({ originalIndex: _originalIndex, ...item }) => item),
    ];
  }

  const alphabeticalSort = (a: ListItem, b: ListItem) => a.text.localeCompare(b.text);
  const incompleteItems = listItems.filter((item) => !item.completed).sort(alphabeticalSort);
  const completedItems = listItems.filter((item) => item.completed).sort(alphabeticalSort);
  const sortedItems = [...incompleteItems, ...completedItems];

  if (!alphabeticalPinnedListItemId) {
    return sortedItems;
  }

  const pinnedItem = listItems.find((item) => item.id === alphabeticalPinnedListItemId);
  const remainingItems = sortedItems.filter((item) => item.id !== alphabeticalPinnedListItemId);
  if (!pinnedItem) return remainingItems;

  const insertIndex = Math.max(0, Math.min(alphabeticalPinnedListItemIndex, remainingItems.length));
  return [
    ...remainingItems.slice(0, insertIndex),
    pinnedItem,
    ...remainingItems.slice(insertIndex),
  ];
}
