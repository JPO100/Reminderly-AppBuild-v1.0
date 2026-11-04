import type { CreatedList, ListItem, ListItemSortMode } from "./list-utils";
import { getDisplayListItems } from "./list-utils";

// Linked lists (Reminderly lists shown in Noterly notes). Pure logic for the shared App Group data; the native
// bridge is in widget.ts. Reminderly is the source of truth. docs/features/linked-lists.md.

/** Master flag (Dev tools > Lists). Default off. Shared with Noterly through the `linked.enabled` key. */
export const LINKED_LISTS_FLAG_KEY = 'reminderly-ff-linked-lists';

/** One linked checklist block in a Noterly note, written by Noterly. A private note's title is never present. */
export type LinkEntry = {
  listId: string;
  noteId: string;
  blockId: string;
  epoch: number;
  title: string | null;
  private: boolean;
  deleted: boolean;
};

/** A tick written by Noterly: one file per list item, replaced by a later tick on the same item. */
export type LinkTick = {
  name: string;
  listId: string;
  itemId: string;
  completed: boolean;
  id: string;
};

export type PublishedList = {
  id: string;
  title: string;
  status: 'active' | 'done' | 'deleted';
  linkEpoch: number;
  linkable: boolean;
  items: { id: string; text: string; completed: boolean }[];
};

export function getLinkEpoch(list: Pick<CreatedList, 'linkEpoch'>): number {
  return typeof list.linkEpoch === 'number' ? list.linkEpoch : 0;
}

/** Ends every link to the list: Noterly turns the blocks with a lower epoch into ordinary checklists. */
export function endListLinks<T extends CreatedList>(list: T): T {
  return { ...list, linkEpoch: getLinkEpoch(list) + 1 };
}

/** Links whose epoch matches the list's, in notes that are not in Recently Deleted. Private notes count. */
export function getActiveLinks(links: LinkEntry[], list: CreatedList): LinkEntry[] {
  const epoch = getLinkEpoch(list);
  return links.filter((link) => link.listId === list.id && link.epoch === epoch && !link.deleted);
}

export function getLinkedNoteStatus(links: LinkEntry[], list: CreatedList): { count: number; text: string } {
  const active = getActiveLinks(links, list);
  if (active.length === 0) return { count: 0, text: 'No note currently linked' };
  if (active.length === 1) {
    const [link] = active;
    const title = link.private ? 'a private note' : (link.title?.trim() || 'Untitled note');
    return { count: 1, text: `Noterly: ${title}` };
  }
  return { count: active.length, text: `Noterly: linked to ${active.length} notes` };
}

/** Wording for the Unlink button, or null when no note is linked (the button is hidden). */
export function getUnlinkLabel(count: number): string | null {
  if (count === 0) return null;
  return count === 1 ? 'Unlink from Noterly' : 'Unlink all from Noterly';
}

/**
 * The lists Noterly may read: lists marked linkable, plus any list that appears in the link register (so the final
 * state and epoch of a list whose links ended still reach Noterly). Items are in the order Reminderly displays them.
 */
export function buildPublishedLists(lists: CreatedList[], links: LinkEntry[], sortMode: ListItemSortMode): PublishedList[] {
  const linkedIds = new Set(links.map((link) => link.listId));
  return lists
    .filter((list) => list.linkable === true || linkedIds.has(list.id))
    .map((list) => ({
      id: list.id,
      title: list.title,
      status: list.status ?? 'active',
      linkEpoch: getLinkEpoch(list),
      linkable: list.linkable === true,
      items: getDisplayListItems(list.items, sortMode, null, -1).map((item) => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
      })),
    }));
}

function isActive(list: CreatedList): boolean {
  return (list.status ?? 'active') === 'active';
}

/**
 * Applies Noterly's ticks (set to a value, never toggled) to active lists. A tick for a missing list, a list that is
 * not active or a missing item changes nothing. Applying the same tick twice gives the same result.
 */
export function applyLinkTicks(lists: CreatedList[], ticks: LinkTick[], now: number): { lists: CreatedList[]; changed: boolean } {
  let changed = false;
  let next = lists;
  for (const tick of ticks) {
    const index = next.findIndex((list) => list.id === tick.listId);
    if (index === -1 || !isActive(next[index])) continue;
    const list = next[index];
    const itemIndex = list.items.findIndex((item) => item.id === tick.itemId);
    if (itemIndex === -1 || list.items[itemIndex].completed === tick.completed) continue;
    const item: ListItem = { ...list.items[itemIndex], completed: tick.completed, completedAt: tick.completed ? now : null };
    const items = list.items.map((existing, i) => (i === itemIndex ? item : existing));
    next = next.map((existing, i) => (i === index ? { ...existing, items } : existing));
    changed = true;
  }
  return { lists: next, changed };
}

/**
 * Ticks that can be deleted: their list or item is gone, the list is not active, or the saved lists already hold the
 * value. Read from the persisted lists, so a tick is only removed once it is stored.
 */
export function getConsumedTicks(persistedLists: CreatedList[], ticks: LinkTick[]): LinkTick[] {
  return ticks.filter((tick) => {
    const list = persistedLists.find((candidate) => candidate.id === tick.listId);
    if (!list || !isActive(list)) return true;
    const item = list.items.find((candidate) => candidate.id === tick.itemId);
    return !item || item.completed === tick.completed;
  });
}

/** The register as saved by Noterly; anything unreadable gives no links (it only affects what Reminderly shows). */
export function parseLinkEntries(json: string | null | undefined): LinkEntry[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is LinkEntry => (
      entry != null
      && typeof entry.listId === 'string'
      && typeof entry.noteId === 'string'
      && typeof entry.blockId === 'string'
      && typeof entry.epoch === 'number'
    )).map((entry) => ({ ...entry, title: typeof entry.title === 'string' ? entry.title : null, private: entry.private === true, deleted: entry.deleted === true }));
  } catch {
    return [];
  }
}
