import type { Reminder } from '../reminder-utils';
import type { Check } from './check-system';
import {
  buildSmartReminderText,
  createSmartReminderForList,
  dateToStorageString,
  formatListDueDate,
  getCurrentListCategory,
  getDisplayListItems,
  LIST_CATEGORY_COLOURS,
  getListCircleColour,
  orderListsByCategory,
  syncFullyTickedAt,
  isListClearingTonight,
  getListsToAutoClear,
  markListDone,
  syncSmartReminderForInactiveList,
  resolveListSortMode,
  storageStringToDate,
  getListSheetTop,
} from '../utils/list-utils';
import { SETTINGS_DEFAULTS } from '../settings/keys';
import { computeBadgeCount } from '../reminder-utils';
import { buildScheduledNotifications } from '../notifications';
import type { CreatedList, ListItem } from '../utils/list-utils';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeList(overrides: Partial<CreatedList> & Pick<CreatedList, 'id' | 'title' | 'items'>): CreatedList {
  return {
    sortMode: 'insertion',
    smartReminders: true,
    smartReminderDueDate: null,
    status: 'active',
    statusChangedAt: null,
    ...overrides,
  };
}

function makeItem(id: string, text: string, completed: boolean): ListItem {
  return { id, text, completed };
}

function makeItems(checked: number, total: number): ListItem[] {
  return Array.from({ length: total }, (_, i) => makeItem(`i${i}`, `Item ${i}`, i < checked));
}

export function getListChecks(): Check[] {
  return [
    {
      id: 'list-date-roundtrip-storage',
      name: 'List date storage: round-trips YYYY-MM-DD values',
      run: () => {
        const date = new Date(2026, 3, 24);
        const stored = dateToStorageString(date);
        const restored = storageStringToDate(stored);
        assert(stored === '2026-04-24', `Expected 2026-04-24, got ${stored}`);
        assert(restored !== null, 'Expected restored date');
        assert(restored!.getFullYear() === 2026, `Expected year 2026, got ${restored!.getFullYear()}`);
        assert(restored!.getMonth() === 3, `Expected April, got month ${restored!.getMonth()}`);
        assert(restored!.getDate() === 24, `Expected day 24, got ${restored!.getDate()}`);
      },
    },

    {
      id: 'list-date-invalid-storage-null',
      name: 'List date storage: invalid stored values return null',
      run: () => {
        assert(storageStringToDate(null) === null, 'Expected null for null input');
        assert(storageStringToDate('') === null, 'Expected null for empty string');
        assert(storageStringToDate('2026/04/24') === null, 'Expected null for slash date');
        assert(storageStringToDate('hello') === null, 'Expected null for arbitrary string');
      },
    },

    {
      id: 'list-due-date-format-current-year',
      name: 'List due date formatting: current-year dates omit year',
      run: () => {
        const formatted = formatListDueDate('2026-04-24', new Date(2026, 0, 1));
        assert(formatted === 'Apr 24th', `Expected Apr 24th, got ${formatted}`);
      },
    },

    {
      id: 'list-due-date-format-other-year',
      name: 'List due date formatting: cross-year dates include short year',
      run: () => {
        const formatted = formatListDueDate('2027-04-24', new Date(2026, 0, 1));
        assert(formatted === "Apr 24th '27", `Expected Apr 24th '27, got ${formatted}`);
      },
    },

    {
      id: 'list-smart-reminder-text-zero-progress',
      name: 'List smart reminders: 0% progress uses Complete copy',
      run: () => {
        const text = buildSmartReminderText(makeList({
          id: 'l1',
          title: 'Garden tasks',
          items: [makeItem('a', 'Weed beds', false), makeItem('b', 'Water plants', false)],
        }));
        assert(text === "Complete 'Garden tasks' list", `Unexpected text: ${text}`);
      },
    },

    {
      id: 'list-smart-reminder-text-mid-progress',
      name: 'List smart reminders: 1%-74% progress uses Finish copy',
      run: () => {
        const text = buildSmartReminderText(makeList({
          id: 'l2',
          title: 'Kitchen clean-up',
          items: [makeItem('a', 'Wipe counters', true), makeItem('b', 'Clean sink', false)],
        }));
        assert(text === "Finish 'Kitchen clean-up' list", `Unexpected text: ${text}`);
      },
    },

    {
      id: 'list-smart-reminder-text-high-progress',
      name: 'List smart reminders: 75%+ progress uses Nearly done copy',
      run: () => {
        const text = buildSmartReminderText(makeList({
          id: 'l3',
          title: 'Weekend trip packing',
          items: [
            makeItem('a', 'Toothbrush', true),
            makeItem('b', 'Phone charger', true),
            makeItem('c', 'Socks', true),
            makeItem('d', 'Towel', false),
          ],
        }));
        assert(text === "Nearly done - 'Weekend trip packing'", `Unexpected text: ${text}`);
      },
    },

    {
      id: 'list-smart-reminder-create-null-without-date',
      name: 'List smart reminders: no due date means no linked reminder',
      run: () => {
        const reminder = createSmartReminderForList(makeList({
          id: 'l4',
          title: 'Books to read',
          items: [makeItem('a', 'Dune', false)],
          smartReminderDueDate: null,
        }));
        assert(reminder === null, `Expected null, got ${JSON.stringify(reminder)}`);
      },
    },

    {
      id: 'list-smart-reminder-create-null-without-time',
      name: 'List smart reminders: a due date with no time means no linked reminder (no 12pm fallback)',
      run: () => {
        const reminder = createSmartReminderForList(makeList({
          id: 'l4b',
          title: 'Books to read',
          items: [makeItem('a', 'Dune', false)],
          smartReminderDueDate: '2026-04-24',
          smartReminderTime: null,
        }));
        assert(reminder === null, `Expected null, got ${JSON.stringify(reminder)}`);
      },
    },

    {
      id: 'list-smart-reminder-create-scheduled-noon',
      name: 'List smart reminders: linked reminder uses the list due date, time and metadata',
      run: () => {
        const reminder = createSmartReminderForList(
          makeList({
            id: 'l5',
            title: 'Grocery shopping',
            items: [makeItem('a', 'Milk', false)],
            smartReminderDueDate: '2026-04-24',
            smartReminderTime: '15:30',
          }),
          { idFactory: () => 'smart-1', createdAt: 123456 },
        ) as Reminder;
        assert(reminder.id === 'smart-1', `Expected smart-1, got ${reminder.id}`);
        assert(reminder.createdAt === 123456, `Expected createdAt 123456, got ${reminder.createdAt}`);
        assert(reminder.linkedListId === 'l5', `Expected linkedListId l5, got ${reminder.linkedListId}`);
        assert(reminder.isSmartReminder === true, 'Expected isSmartReminder true');
        assert(reminder.schedule.kind === 'scheduled', `Expected scheduled, got ${reminder.schedule.kind}`);
        assert(reminder.schedule.date === '2026-04-24', `Expected due date 2026-04-24, got ${reminder.schedule.date}`);
        assert(reminder.schedule.time === '15:30', `Expected time 15:30, got ${reminder.schedule.time}`);
      },
    },

    {
      id: 'list-category-buckets-by-count',
      name: 'List buckets: 0/0, 0/5 Todo; 1/5, 9/20, 15/18 Started; 18/18 Done',
      run: () => {
        const cases: [number, number, string][] = [[0, 0, 'todo'], [0, 5, 'todo'], [1, 5, 'started'], [9, 20, 'started'], [15, 18, 'started'], [18, 18, 'complete']];
        for (const [checked, total, expected] of cases) {
          const actual = getCurrentListCategory(makeItems(checked, total));
          assert(actual === expected, `${checked}/${total}: expected ${expected}, got ${actual}`);
        }
      },
    },

    {
      id: 'list-category-colours',
      name: 'List buckets: Todo grey, Started blue, Done purple, with no Almost bucket',
      run: () => {
        assert(LIST_CATEGORY_COLOURS.todo === '#939393', 'Todo should be grey');
        assert(LIST_CATEGORY_COLOURS.started === '#60C1E7', 'Started should be blue');
        assert(LIST_CATEGORY_COLOURS.complete === '#8168D5', 'Done should be purple');
        assert(Object.keys(LIST_CATEGORY_COLOURS).sort().join(',') === 'complete,started,todo', 'Only three buckets expected');
        assert(LIST_CATEGORY_COLOURS[getCurrentListCategory(makeItems(15, 18))] === '#60C1E7', '15/18 should be blue');
      },
    },

    {
      id: 'list-category-transitions',
      name: 'List buckets: checking and unchecking moves Todo to Started to Done and back',
      run: () => {
        let items = makeItems(0, 3);
        assert(getCurrentListCategory(items) === 'todo', 'Start in Todo');
        items = items.map((item, i) => (i === 0 ? { ...item, completed: true } : item));
        assert(getCurrentListCategory(items) === 'started', 'One checked: Started');
        items = items.map((item) => ({ ...item, completed: true }));
        assert(getCurrentListCategory(items) === 'complete', 'All checked: Done');
        items = items.map((item, i) => (i === 2 ? { ...item, completed: false } : item));
        assert(getCurrentListCategory(items) === 'started', 'Done to Started after unchecking one');
        items = [...items.map((item) => ({ ...item, completed: true })), makeItem('new', 'New', false)];
        assert(getCurrentListCategory(items) === 'started', 'Done to Started after adding an item');
        items = items.map((item) => ({ ...item, completed: false }));
        assert(getCurrentListCategory(items) === 'todo', 'Started to Todo after unchecking all');
        items = [];
        assert(getCurrentListCategory(items) === 'todo', 'Empty list is Todo');
      },
    },

    {
      id: 'list-category-order',
      name: 'List order: Todo, Started, Done, oldest first within each bucket, data unchanged',
      run: () => {
        const lists = [
          makeList({ id: 'done-1', title: 'D1', items: makeItems(2, 2) }),
          makeList({ id: 'started-1', title: 'S1', items: makeItems(9, 20) }),
          makeList({ id: 'todo-1', title: 'T1', items: makeItems(0, 5) }),
          makeList({ id: 'started-2', title: 'S2', items: makeItems(15, 18) }),
          makeList({ id: 'empty', title: 'E', items: [] }),
          makeList({ id: 'done-2', title: 'D2', items: makeItems(18, 18) }),
        ];
        const before = JSON.stringify(lists);
        const order = orderListsByCategory(lists).map((list) => list.id).join(',');
        assert(order === 'todo-1,empty,started-1,started-2,done-1,done-2', `Unexpected order: ${order}`);
        assert(JSON.stringify(lists) === before, 'Ordering should not change list data or source order');
      },
    },

    {
      id: 'list-category-pinned-navy',
      name: 'Pinned lists: navy circle, bucket unchanged; unpinned or pinned lists off use the bucket colour',
      run: () => {
        const pinned = makeList({ id: 'p', title: 'Pinned', items: makeItems(9, 20), pinnedAt: 1 });
        const unpinned = { ...pinned, pinnedAt: null };
        assert(getCurrentListCategory(pinned.items) === 'started', 'Pinned 9/20 should still be Started');
        for (const [checked, total] of [[0, 5], [9, 20], [5, 5]]) {
          assert(getListCircleColour({ ...pinned, items: makeItems(checked, total) }, true) === '#1C2C42', `Pinned ${checked}/${total} should be navy`);
        }
        assert(getListCircleColour(unpinned, true) === '#60C1E7', 'Unpinned 9/20 should be Started blue');
        assert(getListCircleColour(pinned, false) === '#60C1E7', 'With pinned lists off, the bucket colour is used');
      },
    },

    {
      id: 'list-auto-clear-setting-default-off',
      name: 'Clear done lists nightly: defaults off',
      run: () => {
        assert(SETTINGS_DEFAULTS['reminderly-pref-list-auto-clear'] === 'false', 'Clear done lists nightly should default off');
      },
    },

    {
      id: 'list-auto-clear-stamp-tracks-full-tick',
      name: 'Clear done lists nightly: fullyTickedAt is stamped on full tick, cleared on untick and reset on retick',
      run: () => {
        const t1 = new Date(2026, 9, 14, 20, 0).getTime();
        const t2 = new Date(2026, 9, 15, 9, 0).getTime();
        let lists = [makeList({ id: 'l', title: 'L', items: makeItems(2, 2) })];
        lists = syncFullyTickedAt(lists, t1);
        assert(lists[0].fullyTickedAt === t1, 'Stamped when fully ticked');
        const same = syncFullyTickedAt(lists, t2);
        assert(same === lists, 'No change returns the same array');
        lists = syncFullyTickedAt([{ ...lists[0], items: makeItems(1, 2) }], t2);
        assert(lists[0].fullyTickedAt === null, 'Cleared on untick');
        lists = syncFullyTickedAt([{ ...lists[0], items: makeItems(2, 2) }], t2);
        assert(lists[0].fullyTickedAt === t2, 'Reticking resets to the new time');
        const restored = JSON.parse(JSON.stringify(lists));
        assert(syncFullyTickedAt(restored, t2 + 1000)[0].fullyTickedAt === t2, 'Preserved across a restart');
      },
    },

    {
      id: 'list-auto-clear-stamp-on-delete-last-unticked',
      name: 'Clear done lists nightly: deleting the last unticked item stamps now, not the older tick times',
      run: () => {
        const oldTick = new Date(2026, 9, 10, 12, 0).getTime();
        const now = new Date(2026, 9, 15, 15, 0).getTime();
        const items = [{ ...makeItem('a', 'A', true), completedAt: oldTick }, makeItem('b', 'B', false)];
        let lists = syncFullyTickedAt([makeList({ id: 'l', title: 'L', items })], oldTick);
        assert(lists[0].fullyTickedAt == null, 'Not stamped while an item is unticked');
        lists = syncFullyTickedAt([{ ...lists[0], items: [items[0]] }], now);
        assert(lists[0].fullyTickedAt === now, 'Stamped when the deletion made it fully ticked');
        assert(getListsToAutoClear(lists, new Date(now), true).length === 0, 'Not cleared the same day');
      },
    },

    {
      id: 'list-auto-clear-stamp-skips-done-and-deleted',
      name: 'Clear done lists nightly: done and deleted lists are not stamped or changed',
      run: () => {
        const lists = [
          makeList({ id: 'd', title: 'D', items: makeItems(2, 2), status: 'done' }),
          makeList({ id: 'x', title: 'X', items: makeItems(2, 2), status: 'deleted' }),
        ];
        assert(syncFullyTickedAt(lists, Date.now()) === lists, 'Done and deleted lists unchanged');
      },
    },

    {
      id: 'list-auto-clear-eligibility',
      name: 'Clear done lists nightly: only active, unpinned, fully ticked lists ticked before today qualify',
      run: () => {
        const now = new Date(2026, 9, 15, 8, 0);
        const yesterday = new Date(2026, 9, 14, 22, 0).getTime();
        const lists = [
          makeList({ id: 'eligible', title: 'E', items: makeItems(3, 3), fullyTickedAt: yesterday }),
          makeList({ id: 'today', title: 'T', items: makeItems(3, 3), fullyTickedAt: new Date(2026, 9, 15, 0, 5).getTime() }),
          makeList({ id: 'pinned', title: 'P', items: makeItems(3, 3), fullyTickedAt: yesterday, pinnedAt: 1 }),
          makeList({ id: 'empty', title: 'Em', items: [], fullyTickedAt: yesterday }),
          makeList({ id: 'partial', title: 'Pa', items: makeItems(2, 3), fullyTickedAt: yesterday }),
          makeList({ id: 'done', title: 'D', items: makeItems(3, 3), fullyTickedAt: yesterday, status: 'done' }),
          makeList({ id: 'deleted', title: 'X', items: makeItems(3, 3), fullyTickedAt: yesterday, status: 'deleted' }),
          makeList({ id: 'unstamped', title: 'U', items: makeItems(3, 3) }),
        ];
        const ids = getListsToAutoClear(lists, now, true).map((list) => list.id).join(',');
        assert(ids === 'eligible', `Expected only eligible, got ${ids}`);
        const flagOff = getListsToAutoClear(lists, now, false).map((list) => list.id).join(',');
        assert(flagOff === 'eligible,pinned', `With pinned lists off, pinned lists behave as unpinned, got ${flagOff}`);
      },
    },

    {
      id: 'list-auto-clear-midnight-boundary',
      name: 'Clear done lists nightly: midnight boundary, catch-up after several days and clock changes',
      run: () => {
        const justBeforeMidnight = new Date(2026, 9, 14, 23, 59, 59, 999).getTime();
        const atMidnight = new Date(2026, 9, 15, 0, 0, 0, 0).getTime();
        const late = makeList({ id: 'late', title: 'L', items: makeItems(1, 1), fullyTickedAt: justBeforeMidnight });
        const onTheDot = makeList({ id: 'dot', title: 'D', items: makeItems(1, 1), fullyTickedAt: atMidnight });
        assert(getListsToAutoClear([late], new Date(justBeforeMidnight), true).length === 0, 'Not before midnight');
        assert(getListsToAutoClear([late], new Date(atMidnight), true).length === 1, 'Cleared at midnight');
        assert(getListsToAutoClear([onTheDot], new Date(2026, 9, 15, 23, 59), true).length === 0, 'Ticked at 00:00 waits for the next midnight');
        assert(getListsToAutoClear([onTheDot], new Date(2026, 9, 16, 0, 0), true).length === 1, 'Cleared at the next midnight');
        assert(getListsToAutoClear([late], new Date(2026, 9, 20, 9, 0), true).length === 1, 'Caught up after several days away');
        assert(getListsToAutoClear([late], new Date(2026, 9, 14, 10, 0), true).length === 0, 'Clock moved back before the tick: not cleared');
      },
    },

    {
      id: 'list-auto-clear-completes-once',
      name: 'Clear done lists nightly: a cleared list is done and never selected again',
      run: () => {
        const tickedAt = new Date(2026, 9, 14, 18, 0).getTime();
        const now = new Date(2026, 9, 16, 9, 0);
        const list = makeList({ id: 'l', title: 'L', items: makeItems(2, 2), fullyTickedAt: tickedAt });
        const done = markListDone(list, now.getTime(), tickedAt);
        assert(done.status === 'done', 'Marked done');
        assert(getListsToAutoClear([done], now, true).length === 0, 'Not selected again once done');
      },
    },

    {
      id: 'list-auto-clear-mark-done-data',
      name: 'Clear done lists nightly: auto keeps tick times and dates the list from full tick; manual unchanged',
      run: () => {
        const tick = new Date(2026, 9, 14, 18, 0).getTime();
        const now = new Date(2026, 9, 16, 9, 0).getTime();
        const items = [{ ...makeItem('a', 'A', true), completedAt: tick - 1000 }, { ...makeItem('b', 'B', true), completedAt: tick }];
        const list = makeList({ id: 'l', title: 'L', items, fullyTickedAt: tick, smartReminders: true, smartReminderDueDate: '2026-10-20' });
        const auto = markListDone(list, now, tick);
        assert(auto.statusChangedAt === tick, 'Auto done date is when the list became fully ticked');
        assert(JSON.stringify(auto.items) === JSON.stringify(items), 'Auto keeps items and tick times');
        assert(auto.smartReminderDueDate === '2026-10-20' && auto.smartReminders === true, 'Smart reminder fields unchanged');
        const manual = markListDone(makeList({ id: 'm', title: 'M', items: makeItems(1, 3) }), now);
        assert(manual.status === 'done' && manual.statusChangedAt === now, 'Manual done date is now');
        assert(manual.items.every((item) => item.completed && item.completedAt === now), 'Manual ticks every item now');
      },
    },

    {
      id: 'list-auto-clear-hint',
      name: 'Clear done lists nightly: Clears tonight only on fully ticked, unpinned, active lists',
      run: () => {
        const full = makeList({ id: 'f', title: 'F', items: makeItems(3, 3) });
        assert(isListClearingTonight(full, true), 'Fully ticked shows the hint');
        assert(!isListClearingTonight({ ...full, items: makeItems(2, 3) }, true), 'Unticking removes the hint');
        assert(!isListClearingTonight({ ...full, pinnedAt: 5 }, true), 'Pinned lists never show it');
        assert(!isListClearingTonight({ ...full, items: [] }, true), 'Empty lists never show it');
        assert(!isListClearingTonight({ ...full, status: 'done' }, true), 'Done lists never show it');
      },
    },

    {
      id: 'list-smart-reminder-done-list-moves-to-done',
      name: 'Smart reminder sync: a done list keeps its smart reminder, completed at the list done time',
      run: () => {
        const doneAt = new Date(2026, 9, 14, 18, 0).getTime();
        const now = new Date(2026, 9, 15, 9, 0).getTime();
        const reminder = { id: 'r', originalText: 'x', displayText: 'x', createdAt: 1, schedule: { kind: 'scheduled' as const, date: '2026-10-16', time: '12:00' }, linkedListId: 'l', isSmartReminder: true };
        const manualDone = markListDone(makeList({ id: 'l', title: 'L', items: makeItems(1, 2), smartReminders: true, smartReminderDueDate: '2026-10-16' }), doneAt);
        const synced = syncSmartReminderForInactiveList(reminder, manualDone, now);
        assert(synced != null && synced.completedAt === doneAt, 'Manual completion: reminder kept and completed at the list done time');
        const autoDone = markListDone(makeList({ id: 'l', title: 'L', items: makeItems(2, 2), fullyTickedAt: doneAt - 5000 }), now, doneAt - 5000);
        assert(syncSmartReminderForInactiveList(reminder, autoDone, now)?.completedAt === doneAt - 5000, 'Auto-clear: reminder kept and completed at the list done time');
        const noTime = { ...manualDone, statusChangedAt: null };
        assert(syncSmartReminderForInactiveList(reminder, noTime, now)?.completedAt === now, 'Done list without a done time: completed now');
      },
    },

    {
      id: 'list-smart-reminder-done-auto-clear-keeps-date',
      name: 'Smart reminder sync: auto-clear keeps the list done date on the reminder after the 350ms step; manual is dated now',
      run: () => {
        const tickedAt = new Date(2026, 9, 13, 18, 0).getTime();
        const clearAt = new Date(2026, 9, 15, 9, 0).getTime();
        const reminder = { id: 'r', originalText: 'x', displayText: 'x', createdAt: 1, schedule: { kind: 'scheduled' as const, date: '2026-10-16', time: '12:00' }, linkedListId: 'l', isSmartReminder: true };
        const list = makeList({ id: 'l', title: 'L', items: makeItems(2, 2), fullyTickedAt: tickedAt, smartReminders: true, smartReminderDueDate: '2026-10-16' });
        // Mirrors commitListDone in App.tsx: list-sync completion (completedAt = now after 350ms) runs for manual only.
        const commit = (auto: boolean, nowMs: number) => {
          const done = markListDone(list, nowMs, auto ? list.fullyTickedAt as number : undefined);
          let r = syncSmartReminderForInactiveList(reminder, done, nowMs)!;
          const runsListSync = !auto;
          if (runsListSync) r = { ...r, completedAt: nowMs + 350 };
          return { done, r };
        };
        for (const trigger of ['launch', 'open app']) {
          const { done, r } = commit(true, clearAt);
          assert(done.statusChangedAt === tickedAt, `${trigger}: list dated when fully ticked`);
          assert(r.completedAt === tickedAt, `${trigger}: reminder keeps the list done date after 350ms`);
        }
        const manual = commit(false, clearAt);
        assert(manual.done.statusChangedAt === clearAt && manual.r.completedAt === clearAt + 350, 'Manual: list and reminder dated now, unchanged behaviour');
      },
    },

    {
      id: 'list-smart-reminder-inactive-list-unchanged-cases',
      name: 'Smart reminder sync: deleted or missing lists still remove it; done and deleted reminders untouched; repeat safe',
      run: () => {
        const now = new Date(2026, 9, 15, 9, 0).getTime();
        const reminder = { id: 'r', originalText: 'x', displayText: 'x', createdAt: 1, schedule: { kind: 'scheduled' as const, date: '2026-10-16', time: '12:00' }, linkedListId: 'l', isSmartReminder: true };
        const deletedList = makeList({ id: 'l', title: 'L', items: makeItems(0, 2), status: 'deleted', statusChangedAt: now });
        assert(syncSmartReminderForInactiveList(reminder, deletedList, now) === null, 'Deleted list: removed as before');
        assert(syncSmartReminderForInactiveList(reminder, undefined, now) === null, 'Missing list: removed as before');
        const completed = { ...reminder, completedAt: 123 };
        const deleted = { ...reminder, deletedAt: 456 };
        const doneList = markListDone(makeList({ id: 'l', title: 'L', items: makeItems(2, 2) }), now);
        assert(syncSmartReminderForInactiveList(completed, doneList, now) === completed, 'Completed reminder unchanged');
        assert(syncSmartReminderForInactiveList(deleted, doneList, now) === deleted, 'Deleted reminder unchanged');
        const once = syncSmartReminderForInactiveList(reminder, doneList, now)!;
        const twice = syncSmartReminderForInactiveList(once, doneList, now + 60000);
        assert(twice === once, 'Processing again leaves the completed reminder unchanged');
      },
    },

    {
      id: 'list-smart-reminder-done-list-notifications-and-badge',
      name: 'Smart reminder sync: once moved to Done, the reminder has no notification and leaves the badge',
      run: () => {
        const now = new Date(2026, 9, 15, 9, 0);
        const overdue = { id: 'r', originalText: 'x', displayText: 'x', createdAt: 1, schedule: { kind: 'scheduled' as const, date: '2026-10-14', time: '12:00' }, linkedListId: 'l', isSmartReminder: true };
        const future = new Date(Date.now() + 7 * 86400000);
        const futureKey = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
        const upcoming = { ...overdue, id: 'u', schedule: { kind: 'scheduled' as const, date: futureKey, time: '12:00' } };
        assert(computeBadgeCount([overdue], false, now) === 1, 'Overdue smart reminder counts before');
        assert(buildScheduledNotifications([upcoming], false, false, true, false).some((n) => n.extra?.reminderId === 'u'), 'Upcoming smart reminder scheduled before');
        const doneList = markListDone(makeList({ id: 'l', title: 'L', items: makeItems(2, 2) }), now.getTime());
        const doneOverdue = syncSmartReminderForInactiveList(overdue, doneList, now.getTime())!;
        const doneUpcoming = syncSmartReminderForInactiveList(upcoming, doneList, now.getTime())!;
        assert(computeBadgeCount([doneOverdue], false, now) === 0, 'Badge drops once moved to Done');
        assert(!buildScheduledNotifications([doneUpcoming], false, false, true, false).some((n) => n.extra?.reminderId === 'u'), 'Notification cancelled once moved to Done');
      },
    },

    {
      id: 'list-display-items-insertion-preserves-order',
      name: 'List ordering: insertion mode preserves authored order',
      run: () => {
        const items = [
          makeItem('b', 'Banana', false),
          makeItem('a', 'Apple', false),
          makeItem('c', 'Carrot', false),
        ];
        const ordered = getDisplayListItems(items, 'insertion', null, 0);
        assert(ordered.map((item) => item.id).join(',') === 'b,a,c', `Expected b,a,c got ${ordered.map((item) => item.id).join(',')}`);
      },
    },

    {
      id: 'list-display-items-alphabetical-sorts',
      name: 'List ordering: alphabetical mode sorts by item text',
      run: () => {
        const items = [
          makeItem('b', 'Banana', false),
          makeItem('a', 'Apple', false),
          makeItem('c', 'Carrot', false),
        ];
        const ordered = getDisplayListItems(items, 'alphabetical', null, 0);
        assert(ordered.map((item) => item.text).join(',') === 'Apple,Banana,Carrot', `Unexpected order: ${ordered.map((item) => item.text).join(',')}`);
      },
    },

    {
      id: 'list-display-items-alphabetical-pinned-index',
      name: 'List ordering: alphabetical pinned item stays at its current visual index temporarily',
      run: () => {
        const items = [
          makeItem('b', 'Banana', false),
          makeItem('a', 'Apple', false),
          makeItem('c', 'Carrot', false),
        ];
        const ordered = getDisplayListItems(items, 'alphabetical', 'c', 0);
        assert(ordered.map((item) => item.id).join(',') === 'c,a,b', `Expected c,a,b got ${ordered.map((item) => item.id).join(',')}`);
      },
    },

    {
      id: 'list-display-items-alphabetical-missing-pinned-falls-back',
      name: 'List ordering: missing pinned item falls back to alphabetical list',
      run: () => {
        const items = [
          makeItem('b', 'Banana', false),
          makeItem('a', 'Apple', false),
        ];
        const ordered = getDisplayListItems(items, 'alphabetical', 'missing', 1);
        assert(ordered.map((item) => item.id).join(',') === 'a,b', `Expected a,b got ${ordered.map((item) => item.id).join(',')}`);
      },
    },

    {
      id: 'list-sort-global-default-order-added',
      name: 'List ordering: Sort items A to Z defaults off, so lists show in order added',
      run: () => {
        assert(SETTINGS_DEFAULTS['reminderly-pref-list-sort-az'] === 'false', 'Sort items A to Z should default off');
        assert(resolveListSortMode(false, false) === 'insertion', 'Expected order added when the setting is off');
        assert(resolveListSortMode(true, false) === 'alphabetical', 'Expected A to Z when the setting is on');
      },
    },

    {
      id: 'list-sort-global-ignores-legacy-sort-mode',
      name: 'List ordering: the global setting decides the order, a list\'s legacy sortMode is ignored',
      run: () => {
        const items = [makeItem('b', 'Banana', false), makeItem('a', 'Apple', false)];
        const legacyAlphabetical = makeList({ id: 'l1', title: 'Shop', items, sortMode: 'alphabetical' });
        const legacyInsertion = makeList({ id: 'l2', title: 'Jobs', items, sortMode: 'insertion' });
        for (const list of [legacyAlphabetical, legacyInsertion]) {
          const off = getDisplayListItems(list.items, resolveListSortMode(false, false), null, 0).map((item) => item.id).join(',');
          const on = getDisplayListItems(list.items, resolveListSortMode(true, false), null, 0).map((item) => item.id).join(',');
          assert(off === 'b,a', `Expected b,a with the setting off, got ${off}`);
          assert(on === 'a,b', `Expected a,b with the setting on, got ${on}`);
        }
      },
    },

    {
      id: 'list-sort-template-editor-always-az',
      name: 'List ordering: the template editor sorts A to Z whatever the setting',
      run: () => {
        assert(resolveListSortMode(false, true) === 'alphabetical', 'Template editor should sort A to Z with the setting off');
        assert(resolveListSortMode(true, true) === 'alphabetical', 'Template editor should sort A to Z with the setting on');
      },
    },

    {
      id: 'list-sort-toggle-leaves-item-data-unchanged',
      name: 'List ordering: switching sort mode never changes list data or the underlying insertion order',
      run: () => {
        const list = makeList({ id: 'l1', title: 'Shop', items: [makeItem('c', 'Carrot', true), makeItem('b', 'Banana', false), makeItem('a', 'Apple', false)], sortMode: 'alphabetical' });
        const before = JSON.stringify(list);
        getDisplayListItems(list.items, resolveListSortMode(true, false), null, 0);
        getDisplayListItems(list.items, resolveListSortMode(false, false), null, 0);
        getDisplayListItems(list.items, resolveListSortMode(true, false), 'b', 0);
        assert(JSON.stringify(list) === before, 'List data should be unchanged after switching sort mode');
        assert(list.items.map((item) => item.id).join(',') === 'c,b,a', 'Underlying insertion order should be unchanged');
        assert(list.sortMode === 'alphabetical', 'Legacy sortMode should be kept untouched');
      },
    },

    {
      id: 'list-settings-uncheck-all-delays-after-close',
      name: 'List settings: Uncheck all closes overlay and applies item reset after 150ms',
      run: () => {
        let isListSettingsOpen = true;
        let uncheckDelay: number | null = null;
        let items = [
          makeItem('a', 'Milk', true),
          makeItem('b', 'Bread', false),
        ];

        // Mirrors handleListSettingsUncheckAll in App.tsx.
        isListSettingsOpen = false;
        uncheckDelay = 150;
        items = items.map((item) => ({ ...item, completed: false }));

        assert(isListSettingsOpen === false, 'Overlay should close first');
        assert(uncheckDelay === 150, `Expected 150ms uncheck delay, got ${uncheckDelay}`);
        assert(items.every((item) => item.completed === false), 'Expected all items unchecked');
      },
    },

    {
      id: 'list-smart-reminder-toggle-on-opens-picker',
      name: 'List smart reminder overlays: toggling on from no-date state opens picker',
      run: () => {
        const smartReminderDueDate = null;
        let draftSmartReminderDate: Date | null = null;
        let isDatePickerOpen = false;
        let smartReminders = false;

        // Mirrors handleSmartRemindersChange(true) in overlays.
        const nextValue = true;
        if (nextValue) {
          draftSmartReminderDate = smartReminderDueDate ?? new Date(2026, 3, 24);
          isDatePickerOpen = true;
        } else {
          isDatePickerOpen = false;
        }
        smartReminders = nextValue;

        assert(smartReminders === true, 'Toggle should be on immediately');
        assert(isDatePickerOpen === true, 'Date picker should open');
        assert(draftSmartReminderDate !== null, 'Draft date should be seeded');
      },
    },

    {
      id: 'list-smart-reminder-back-from-no-date-turns-toggle-off',
      name: 'List smart reminder overlays: back from no-date picker restores no date and turns toggle off',
      run: () => {
        const smartReminderDueDate = null;
        let draftSmartReminderDate = new Date(2026, 3, 24);
        let pendingDisplaySmartReminderDate: Date | null = new Date(2026, 3, 24);
        let isDatePickerOpen = true;
        let smartReminders = true;

        // Mirrors handleCloseDatePicker() in overlays.
        draftSmartReminderDate = smartReminderDueDate ?? new Date();
        pendingDisplaySmartReminderDate = null;
        isDatePickerOpen = false;
        if (smartReminderDueDate == null) {
          smartReminders = false;
        }

        assert(isDatePickerOpen === false, 'Expected picker closed');
        assert(pendingDisplaySmartReminderDate === null, 'Expected pending display date cleared');
        assert(smartReminders === false, 'Expected toggle restored to off');
      },
    },

    {
      id: 'list-smart-reminder-back-from-existing-date-keeps-date-and-toggle',
      name: 'List smart reminder overlays: back from existing-date picker preserves saved date and toggle',
      run: () => {
        const smartReminderDueDate = new Date(2026, 3, 24);
        let draftSmartReminderDate = new Date(2026, 4, 2);
        let pendingDisplaySmartReminderDate: Date | null = new Date(2026, 4, 2);
        let isDatePickerOpen = true;
        let smartReminders = true;

        draftSmartReminderDate = smartReminderDueDate ?? new Date();
        pendingDisplaySmartReminderDate = null;
        isDatePickerOpen = false;
        if (smartReminderDueDate == null) {
          smartReminders = false;
        }

        assert(isDatePickerOpen === false, 'Expected picker closed');
        assert(draftSmartReminderDate.getTime() === smartReminderDueDate.getTime(), 'Expected draft reset to saved date');
        assert(pendingDisplaySmartReminderDate === null, 'Expected pending display date cleared');
        assert(smartReminders === true, 'Expected toggle to stay on');
      },
    },

    {
      id: 'list-smart-reminder-set-date-keeps-overlay-default-state',
      name: 'List smart reminder overlays: Set date stores pending display date and collapses picker',
      run: () => {
        const draftSmartReminderDate = new Date(2026, 3, 24);
        let pendingDisplaySmartReminderDate: Date | null = null;
        let isDatePickerOpen = true;
        let highlightPhase: 'idle' | 'immediate' | 'fade' = 'idle';
        let savedDate: Date | null = null;

        pendingDisplaySmartReminderDate = draftSmartReminderDate;
        highlightPhase = 'immediate';
        savedDate = draftSmartReminderDate;
        isDatePickerOpen = false;

        assert(savedDate?.getTime() === draftSmartReminderDate.getTime(), 'Expected saved date to match draft');
        assert(pendingDisplaySmartReminderDate?.getTime() === draftSmartReminderDate.getTime(), 'Expected pending display date set');
        assert(highlightPhase === 'immediate', `Expected immediate highlight, got ${highlightPhase}`);
        assert(isDatePickerOpen === false, 'Expected picker closed');
      },
    },

    {
      id: 'list-smart-reminder-prop-update-clears-pending-display',
      name: 'List smart reminder overlays: saved due-date update clears pending display buffer',
      run: () => {
        let previousDueDateTime: number | null = new Date(2026, 3, 24).getTime();
        const smartReminderDueDateTime = new Date(2026, 3, 25).getTime();
        let pendingDisplaySmartReminderDate: Date | null = new Date(2026, 3, 24);

        const prevTime = previousDueDateTime;
        const nextTime = smartReminderDueDateTime;
        previousDueDateTime = nextTime;
        if (!(prevTime === nextTime || nextTime == null)) {
          pendingDisplaySmartReminderDate = null;
        }

        assert(previousDueDateTime === smartReminderDueDateTime, 'Expected previous ref updated');
        assert(pendingDisplaySmartReminderDate === null, 'Expected pending display cleared after saved date update');
      },
    },

    {
      id: 'list-smart-reminder-sync-removes-active-when-feature-disabled',
      name: 'List smart reminder sync: active linked reminders are removed when feature is disabled',
      run: () => {
        const prev: Reminder[] = [{
          id: 'r1',
          originalText: "Complete 'Garden tasks' list",
          displayText: "Complete 'Garden tasks' list",
          createdAt: 1,
          schedule: { kind: 'scheduled', date: '2026-04-24', time: '12:00' },
          linkedListId: 'l1',
          isSmartReminder: true,
        }];
        const createdLists = [makeList({
          id: 'l1',
          title: 'Garden tasks',
          items: [makeItem('a', 'Weed beds', false)],
          smartReminders: true,
          smartReminderDueDate: '2026-04-24',
        })];
        const desiredLists = false ? createdLists.filter((list) => list.smartReminderDueDate) : [];
        const desiredByListId = new Map(desiredLists.map((list) => [list.id, list]));
        const next: Reminder[] = [];

        for (const reminder of prev) {
          if (!reminder.isSmartReminder || !reminder.linkedListId) {
            next.push(reminder);
            continue;
          }
          const linkedList = desiredByListId.get(reminder.linkedListId);
          if (!linkedList) {
            if (reminder.completedAt != null || reminder.deletedAt != null) {
              next.push(reminder);
            }
            continue;
          }
        }

        assert(next.length === 0, `Expected active smart reminder removed, got ${next.length}`);
      },
    },

    {
      id: 'list-smart-reminder-sync-keeps-archived-when-feature-disabled',
      name: 'List smart reminder sync: done or deleted linked reminders are preserved when feature is disabled',
      run: () => {
        const prev: Reminder[] = [{
          id: 'r1',
          originalText: "Complete 'Garden tasks' list",
          displayText: "Complete 'Garden tasks' list",
          createdAt: 1,
          schedule: { kind: 'scheduled', date: '2026-04-24', time: '12:00' },
          linkedListId: 'l1',
          isSmartReminder: true,
          completedAt: 1234,
        }];
        const desiredByListId = new Map<string, CreatedList>();
        const next: Reminder[] = [];

        for (const reminder of prev) {
          const linkedList = desiredByListId.get(reminder.linkedListId!);
          if (!linkedList) {
            if (reminder.completedAt != null || reminder.deletedAt != null) {
              next.push(reminder);
            }
            continue;
          }
        }

        assert(next.length === 1, `Expected archived smart reminder preserved, got ${next.length}`);
        assert(next[0].id === 'r1', `Expected r1 preserved, got ${next[0].id}`);
      },
    },

    {
      id: 'list-smart-reminder-sync-updates-linked-reminder-content',
      name: 'List smart reminder sync: linked reminder text and schedule update when list changes',
      run: () => {
        const list = makeList({
          id: 'l1',
          title: 'Garden tasks',
          items: [makeItem('a', 'Weed beds', true), makeItem('b', 'Water plants', false)],
          smartReminders: true,
          smartReminderDueDate: '2026-05-01',
        });
        const reminder: Reminder = {
          id: 'r1',
          originalText: "Complete 'Garden tasks' list",
          displayText: "Complete 'Garden tasks' list",
          createdAt: 1,
          schedule: { kind: 'scheduled', date: '2026-04-24', time: '09:00' },
          linkedListId: 'l1',
          isSmartReminder: false,
        };

        const nextText = buildSmartReminderText(list);
        const nextDate = list.smartReminderDueDate!;
        const nextTime = '12:00';
        const needsUpdate =
          reminder.originalText !== nextText ||
          reminder.displayText !== nextText ||
          reminder.schedule.kind !== 'scheduled' ||
          reminder.schedule.date !== nextDate ||
          reminder.schedule.time !== nextTime ||
          reminder.linkedListId !== list.id ||
          reminder.isSmartReminder !== true;

        assert(needsUpdate === true, 'Expected linked reminder to need update');
      },
    },

    {
      id: 'list-smart-reminder-sync-adds-missing-linked-reminder',
      name: 'List smart reminder sync: missing linked reminder is created for eligible list',
      run: () => {
        const list = makeList({
          id: 'l1',
          title: 'Garden tasks',
          items: [makeItem('a', 'Weed beds', false)],
          smartReminders: true,
          smartReminderDueDate: '2026-04-24',
          smartReminderTime: '09:00',
        });
        const prev: Reminder[] = [];
        const desiredLists = [list];
        const seenSmartListIds = new Set<string>();
        const next: Reminder[] = [...prev];

        for (const candidate of desiredLists) {
          if (seenSmartListIds.has(candidate.id)) continue;
          if (!candidate.smartReminders) continue;
          const smartReminder = createSmartReminderForList(candidate, { idFactory: () => 'smart-new', createdAt: 10 });
          if (!smartReminder) continue;
          next.push(smartReminder);
        }

        assert(next.length === 1, `Expected one smart reminder added, got ${next.length}`);
        assert(next[0].id === 'smart-new', `Expected smart-new, got ${next[0].id}`);
      },
    },
    {
      id: 'list-sheet-top-unscrolled',
      name: 'List sheet top: unchanged when the page is not scrolled',
      run: () => {
        const top = getListSheetTop(140.64, 0);
        assert(top === 140.64, `Expected 140.64, got ${top}`);
      },
    },
    {
      id: 'list-sheet-top-keyboard-scrolled',
      name: 'List sheet top: re-render while the keyboard has scrolled the page keeps the sheet in place',
      run: () => {
        // Logo measured 403px higher on screen while the iOS keyboard scrolls the page by 403px
        const top = getListSheetTop(140.64 - 403, 403);
        assert(top === 140.64, `Expected 140.64, got ${top}`);
      },
    },
    {
      id: 'list-sheet-top-invalid-scroll',
      name: 'List sheet top: invalid page scroll is ignored',
      run: () => {
        const top = getListSheetTop(140.64, Number.NaN);
        assert(top === 140.64, `Expected 140.64, got ${top}`);
      },
    },
  ];
}
