import { beforeEach, describe, expect, it, vi } from 'vitest';

// syncWidget with a stand-in native bridge, so the flag on/off behaviour can be checked without a device.
const setSnapshot = vi.fn(() => Promise.resolve());
const clearSnapshot = vi.fn(() => Promise.resolve());
let platform = 'ios';

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => platform },
  registerPlugin: () => ({ setSnapshot, clearSnapshot }),
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
