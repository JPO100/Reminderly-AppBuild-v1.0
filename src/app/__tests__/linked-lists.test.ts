import { describe, expect, it } from 'vitest';
import type { CreatedList } from '../utils/list-utils';
import { SETTINGS_DEFAULTS } from '../settings/keys';
import {
  applyLinkTicks,
  buildPublishedLists,
  endListLinks,
  getActiveLinks,
  getConsumedTicks,
  getLinkedNoteCount,
  getLinkedNoteStatus,
  getUnlinkLabel,
  parseLinkEntries,
  parseListLink,
  LINKED_LISTS_FLAG_KEY,
} from '../utils/linked-lists';
import type { LinkEntry, LinkTick } from '../utils/linked-lists';

function makeList(overrides: Partial<CreatedList> = {}): CreatedList {
  return {
    id: 'l1',
    title: 'Recipe',
    items: [
      { id: 'a', text: 'Carrot', completed: false, completedAt: null },
      { id: 'b', text: 'Onion', completed: true, completedAt: 1 },
      { id: 'c', text: 'Celery', completed: false, completedAt: null },
    ],
    status: 'active',
    ...overrides,
  };
}

function link(overrides: Partial<LinkEntry> = {}): LinkEntry {
  return { listId: 'l1', noteId: 'n1', blockId: 'b1', epoch: 0, title: 'My London trip', private: false, deleted: false, ...overrides };
}

function tick(overrides: Partial<LinkTick> = {}): LinkTick {
  return { name: 'l1_a.json', listId: 'l1', itemId: 'a', completed: true, id: 't1', ...overrides };
}

describe('linked lists flag', () => {
  it('is off by default', () => {
    expect(SETTINGS_DEFAULTS[LINKED_LISTS_FLAG_KEY]).toBe('false');
  });
});

describe('linked note status', () => {
  it('says no note is linked, and hides Unlink', () => {
    expect(getLinkedNoteStatus([], makeList())).toEqual({ count: 0, text: 'No note currently linked' });
    expect(getUnlinkLabel(0)).toBeNull();
  });

  it('shows the note title for one note and the count for several', () => {
    expect(getLinkedNoteStatus([link()], makeList())).toEqual({ count: 1, text: 'Noterly: My London trip' });
    expect(getUnlinkLabel(1)).toBe('Unlink from Noterly');
    const many = [link(), link({ noteId: 'n2', blockId: 'b2' }), link({ noteId: 'n3', blockId: 'b3' })];
    expect(getLinkedNoteStatus(many, makeList())).toEqual({ count: 3, text: 'Noterly: linked to 3 notes' });
    expect(getUnlinkLabel(3)).toBe('Unlink all from Noterly');
  });

  it('counts distinct notes, not linked blocks (D1)', () => {
    // One note holding the list twice is one note: singular wording, the note title, "Unlink from Noterly"
    const sameNote = [link(), link({ blockId: 'b2' })];
    expect(getLinkedNoteCount(sameNote, makeList())).toBe(1);
    expect(getLinkedNoteStatus(sameNote, makeList())).toEqual({ count: 1, text: 'Noterly: My London trip' });
    expect(getUnlinkLabel(getLinkedNoteStatus(sameNote, makeList()).count)).toBe('Unlink from Noterly');
    // Two notes, three blocks: two notes
    const threeBlocks = [link(), link({ blockId: 'b2' }), link({ noteId: 'n2', blockId: 'b3' })];
    expect(getLinkedNoteCount(threeBlocks, makeList())).toBe(2);
    expect(getLinkedNoteStatus(threeBlocks, makeList())).toEqual({ count: 2, text: 'Noterly: linked to 2 notes' });
    expect(getUnlinkLabel(2)).toBe('Unlink all from Noterly');
  });

  it('Unlink all still ends every block, including several in one note', () => {
    const entries = [link(), link({ blockId: 'b2' }), link({ noteId: 'n2', blockId: 'b3' })];
    const ended = endListLinks(makeList());
    expect(getActiveLinks(entries, makeList())).toHaveLength(3);
    expect(getActiveLinks(entries, ended)).toHaveLength(0);
    expect(getLinkedNoteCount(entries, ended)).toBe(0);
  });

  it('a deleted note and a private note count once each, whatever their block counts', () => {
    const entries = [
      link({ noteId: 'n1', blockId: 'b1', title: null, private: true }),
      link({ noteId: 'n1', blockId: 'b2', title: null, private: true }),
      link({ noteId: 'n2', blockId: 'b3', deleted: true }),
    ];
    expect(getLinkedNoteCount(entries, makeList())).toBe(1);
    expect(getLinkedNoteStatus(entries, makeList()).text).toBe('Noterly: a private note');
  });

  it('never shows a private note title, and still counts it', () => {
    const entries = [link({ title: null, private: true })];
    expect(getLinkedNoteStatus(entries, makeList()).text).toBe('Noterly: a private note');
    const two = [...entries, link({ noteId: 'n2', blockId: 'b2' })];
    expect(getLinkedNoteStatus(two, makeList()).count).toBe(2);
  });

  it('leaves out Recently Deleted notes and links from before the epoch changed', () => {
    expect(getActiveLinks([link({ deleted: true })], makeList())).toHaveLength(0);
    expect(getActiveLinks([link({ epoch: 0 })], makeList({ linkEpoch: 1 }))).toHaveLength(0);
    expect(getActiveLinks([link({ epoch: 1 })], makeList({ linkEpoch: 1 }))).toHaveLength(1);
  });

  it('ignores links to other lists', () => {
    expect(getActiveLinks([link({ listId: 'other' })], makeList())).toHaveLength(0);
  });
});

describe('ending links', () => {
  it('raises the epoch by one, from none', () => {
    expect(endListLinks(makeList()).linkEpoch).toBe(1);
    expect(endListLinks(makeList({ linkEpoch: 4 })).linkEpoch).toBe(5);
  });

  it('hides the status at once (epochs no longer match)', () => {
    const list = makeList();
    const ended = endListLinks(list);
    expect(getLinkedNoteStatus([link()], ended).count).toBe(0);
  });
});

describe('published lists', () => {
  it('publishes linkable lists and lists in the register, and no others', () => {
    const lists = [
      makeList({ id: 'shared', linkable: true }),
      makeList({ id: 'linked' }),
      makeList({ id: 'private-list' }),
    ];
    const published = buildPublishedLists(lists, [link({ listId: 'linked' })], 'insertion');
    expect(published.map((list) => list.id).sort()).toEqual(['linked', 'shared']);
  });

  it('keeps a list published after sharing is turned off while it is linked', () => {
    const published = buildPublishedLists([makeList({ linkable: false })], [link()], 'insertion');
    expect(published).toHaveLength(1);
    expect(published[0].linkable).toBe(false);
  });

  it('carries status, epoch and the items in the displayed order (ticked below unticked)', () => {
    const [published] = buildPublishedLists([makeList({ linkable: true, linkEpoch: 2, status: 'deleted' })], [], 'insertion');
    expect(published.status).toBe('deleted');
    expect(published.linkEpoch).toBe(2);
    expect(published.items.map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(published.items[2]).toEqual({ id: 'b', text: 'Onion', completed: true });
  });
});

describe('applying Noterly ticks', () => {
  it('sets the value and the tick time, and unticking clears the time', () => {
    const result = applyLinkTicks([makeList()], [tick(), tick({ itemId: 'b', completed: false, id: 't2', name: 'l1_b.json' })], 500);
    expect(result.changed).toBe(true);
    const items = result.lists[0].items;
    expect(items.find((item) => item.id === 'a')).toMatchObject({ completed: true, completedAt: 500 });
    expect(items.find((item) => item.id === 'b')).toMatchObject({ completed: false, completedAt: null });
  });

  it('gives the same result when applied twice (replay after a crash)', () => {
    const once = applyLinkTicks([makeList()], [tick()], 500);
    const twice = applyLinkTicks(once.lists, [tick()], 900);
    expect(twice.changed).toBe(false);
    expect(twice.lists).toBe(once.lists);
  });

  it('skips missing lists, missing items and lists that are not active', () => {
    const lists = [makeList(), makeList({ id: 'done', status: 'done' })];
    const result = applyLinkTicks(lists, [tick({ listId: 'gone' }), tick({ itemId: 'gone' }), tick({ listId: 'done' })], 1);
    expect(result.changed).toBe(false);
    expect(result.lists).toBe(lists);
  });

  it('leaves other lists and items untouched', () => {
    const other = makeList({ id: 'l2' });
    const result = applyLinkTicks([makeList(), other], [tick()], 1);
    expect(result.lists[1]).toBe(other);
    expect(result.lists[0].items.find((item) => item.id === 'c')?.completed).toBe(false);
  });
});

describe('consuming ticks after saving', () => {
  it('removes a tick once the saved lists hold its value', () => {
    const saved = [makeList({ items: [{ id: 'a', text: 'Carrot', completed: true, completedAt: 5 }] })];
    expect(getConsumedTicks(saved, [tick()])).toHaveLength(1);
  });

  it('keeps a tick whose value is not saved yet', () => {
    expect(getConsumedTicks([makeList()], [tick()])).toHaveLength(0);
  });

  it('removes ticks for missing or inactive lists and missing items', () => {
    const saved = [makeList({ id: 'done', status: 'done' }), makeList()];
    const ticks = [tick({ listId: 'gone' }), tick({ listId: 'done' }), tick({ itemId: 'gone' })];
    expect(getConsumedTicks(saved, ticks)).toHaveLength(3);
  });
});

describe('reading the register', () => {
  it('gives no links for absent, malformed or unreadable data', () => {
    expect(parseLinkEntries(null)).toEqual([]);
    expect(parseLinkEntries('')).toEqual([]);
    expect(parseLinkEntries('not json')).toEqual([]);
    expect(parseLinkEntries('{"a":1}')).toEqual([]);
  });

  it('keeps well-formed entries and drops broken ones', () => {
    const json = JSON.stringify([link(), { listId: 'x' }, { ...link({ blockId: 'b9' }), title: 5 }]);
    const entries = parseLinkEntries(json);
    expect(entries).toHaveLength(2);
    expect(entries[1].title).toBeNull();
  });
});

describe('links from Noterly (Open in Reminderly)', () => {
  it('reads the list id from reminderly://list/<id>', () => {
    expect(parseListLink('reminderly://list/d4275dea-0cf6-4326-b993-9b82a7cb9310')).toBe('d4275dea-0cf6-4326-b993-9b82a7cb9310');
    expect(parseListLink('reminderly://list/a%20b')).toBe('a b');
  });

  it('ignores every other address', () => {
    for (const url of [undefined, null, '', 'reminderly://', 'reminderly://list/', 'reminderly://list/a/b', 'reminderly://other/x', 'https://list/x', 'noterly://list/x', 'reminderly://list/%E0%A4%A']) {
      expect(parseListLink(url)).toBeNull();
    }
  });
});
