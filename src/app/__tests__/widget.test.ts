import { beforeEach, describe, expect, it, vi } from 'vitest';

// syncWidget with a stand-in native bridge, so the flag on/off behaviour can be checked without a device.
const setSnapshot = vi.fn(() => Promise.resolve());
const clearSnapshot = vi.fn(() => Promise.resolve());
const setSiriActive = vi.fn((_options: { active: boolean }) => Promise.resolve());
const setSiriContext = vi.fn((_options: { json: string }) => Promise.resolve());
let pendingItems: unknown = [];
const getSiriPending = vi.fn(() => Promise.resolve({ items: pendingItems }));
const removeSiriPending = vi.fn((_options: { ids: string[] }) => Promise.resolve());
let platform = 'ios';

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => platform },
  registerPlugin: () => ({ setSnapshot, clearSnapshot, setSiriActive, setSiriContext, getSiriPending, removeSiriPending }),
}));

const snapshot = { date: '2026-10-12', outstanding: 2, done: 1, dueTomorrow: 0 };

async function loadWidget() {
  vi.resetModules();
  return import('../utils/widget');
}

describe('syncWidget', () => {
  beforeEach(() => {
    setSnapshot.mockClear();
    clearSnapshot.mockClear();
    platform = 'ios';
  });

  it('publishes the snapshot when the flag is on', async () => {
    const { syncWidget } = await loadWidget();
    syncWidget(snapshot);
    expect(setSnapshot).toHaveBeenCalledWith(snapshot);
    expect(clearSnapshot).not.toHaveBeenCalled();
  });

  it('clears shared data and publishes nothing when the flag is off', async () => {
    const { syncWidget } = await loadWidget();
    syncWidget(null);
    expect(clearSnapshot).toHaveBeenCalledTimes(1);
    expect(setSnapshot).not.toHaveBeenCalled();
  });

  it('republishes current data when the flag is turned back on', async () => {
    const { syncWidget } = await loadWidget();
    syncWidget(snapshot);
    syncWidget(null);
    syncWidget(snapshot);
    expect(setSnapshot).toHaveBeenCalledTimes(2);
    expect(clearSnapshot).toHaveBeenCalledTimes(1);
  });

  it('skips unchanged snapshots', async () => {
    const { syncWidget } = await loadWidget();
    syncWidget(snapshot);
    syncWidget({ ...snapshot });
    expect(setSnapshot).toHaveBeenCalledTimes(1);
  });

  it('does nothing off iOS', async () => {
    platform = 'web';
    const { syncWidget } = await loadWidget();
    syncWidget(snapshot);
    syncWidget(null);
    expect(setSnapshot).not.toHaveBeenCalled();
    expect(clearSnapshot).not.toHaveBeenCalled();
  });
});

// The Siri intent fails closed on the stored value, so every write must reach native
describe('syncSiriActive', () => {
  beforeEach(() => {
    setSiriActive.mockClear();
    platform = 'ios';
  });

  it('stores on and off for the Siri intent', async () => {
    const { syncSiriActive } = await loadWidget();
    syncSiriActive(true);
    syncSiriActive(false);
    expect(setSiriActive.mock.calls).toEqual([[{ active: true }], [{ active: false }]]);
  });

  it('writes again for an unchanged value, so the foreground re-write is never skipped', async () => {
    const { syncSiriActive } = await loadWidget();
    syncSiriActive(false);
    syncSiriActive(false);
    expect(setSiriActive).toHaveBeenCalledTimes(2);
  });

  it('a failed write does not throw', async () => {
    setSiriActive.mockImplementationOnce(() => Promise.reject(new Error('App Group unavailable')));
    const { syncSiriActive } = await loadWidget();
    expect(() => syncSiriActive(true)).not.toThrow();
  });

  it('does nothing outside iOS', async () => {
    platform = 'web';
    const { syncSiriActive } = await loadWidget();
    syncSiriActive(true);
    expect(setSiriActive).not.toHaveBeenCalled();
  });
});

// Siri locked-device stage 2: context publishing and the pending list
describe('Siri context and pending list bridge', () => {
  beforeEach(() => {
    setSiriContext.mockClear();
    getSiriPending.mockClear();
    removeSiriPending.mockClear();
    pendingItems = [];
    platform = 'ios';
  });

  it('sends the context as JSON, once per change', async () => {
    const widget = await loadWidget();
    widget.syncSiriContext({ alerts: true });
    widget.syncSiriContext({ alerts: true });
    widget.syncSiriContext({ alerts: false });
    expect(setSiriContext.mock.calls).toEqual([[{ json: '{"alerts":true}' }], [{ json: '{"alerts":false}' }]]);
  });

  it('resends the context after a failed write', async () => {
    setSiriContext.mockImplementationOnce(() => Promise.reject(new Error('App Group unavailable')));
    const widget = await loadWidget();
    widget.syncSiriContext({ alerts: true });
    await Promise.resolve();
    await Promise.resolve();
    widget.syncSiriContext({ alerts: true });
    expect(setSiriContext).toHaveBeenCalledTimes(2);
  });

  it('reads the pending list, keeping strings only', async () => {
    pendingItems = ['{"id":"a"}', 42, null, '{"id":"b"}'];
    const widget = await loadWidget();
    expect(await widget.getSiriPending()).toEqual(['{"id":"a"}', '{"id":"b"}']);
  });

  it('reads nothing on a bridge failure or outside iOS', async () => {
    getSiriPending.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    let widget = await loadWidget();
    expect(await widget.getSiriPending()).toEqual([]);
    platform = 'web';
    widget = await loadWidget();
    expect(await widget.getSiriPending()).toEqual([]);
  });

  it('removes by id, and sends nothing for an empty list', async () => {
    const widget = await loadWidget();
    widget.removeSiriPending([]);
    widget.removeSiriPending(['a', 'b']);
    expect(removeSiriPending.mock.calls).toEqual([[{ ids: ['a', 'b'] }]]);
  });
});
