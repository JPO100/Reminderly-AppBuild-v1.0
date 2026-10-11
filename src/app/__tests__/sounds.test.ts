import { beforeEach, describe, expect, it, vi } from 'vitest';

// playClick with a stand-in AudioContext, so the gating and the audio graph can be checked without a device.
const started = vi.fn();

class FakeAudioContext {
  sampleRate = 44100;
  state = 'running';
  destination = {};
  resume = vi.fn(() => Promise.resolve());
  createBuffer = (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) });
  createBufferSource = () => ({ buffer: null, connect: (node: unknown) => node, start: started });
  createBiquadFilter = () => ({ type: '', frequency: { value: 0 }, connect: (node: unknown) => node });
  createGain = () => ({ gain: { value: 0 }, connect: (node: unknown) => node });
}

function memoryStorage(initial: Record<string, string>) {
  const map = new Map(Object.entries(initial));
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => void map.set(key, value) };
}

async function loadSounds(saved: Record<string, string>) {
  vi.resetModules();
  vi.stubGlobal('localStorage', memoryStorage(saved));
  vi.stubGlobal('AudioContext', FakeAudioContext);
  return import('../utils/sounds');
}

describe('playClick', () => {
  beforeEach(() => started.mockClear());

  it('plays when the flag, panel and action are on', async () => {
    const { playClick } = await loadSounds({ 'reminderly-ff-sounds': 'true', 'reminderly-pref-sounds': '{"remindersSounds":true}' });
    playClick('markDone');
    expect(started).toHaveBeenCalledTimes(1);
  });

  it('is silent when the availability flag is off', async () => {
    const { playClick } = await loadSounds({ 'reminderly-ff-sounds': 'false', 'reminderly-pref-sounds': '{"remindersSounds":true}' });
    playClick('markDone');
    expect(started).not.toHaveBeenCalled();
  });

  it('is silent by default and for the other panel', async () => {
    const { playClick } = await loadSounds({ 'reminderly-ff-sounds': 'true', 'reminderly-pref-sounds': '{"remindersSounds":true}' });
    playClick('toggleListItemCheckbox');
    expect(started).not.toHaveBeenCalled();
    const fresh = await loadSounds({ 'reminderly-ff-sounds': 'true' });
    fresh.playClick('markDone');
    expect(started).not.toHaveBeenCalled();
  });

  it('is silent when the action is off', async () => {
    const { playClick } = await loadSounds({ 'reminderly-ff-sounds': 'true', 'reminderly-pref-sounds': '{"remindersSounds":true,"markDone":false}' });
    playClick('markDone');
    expect(started).not.toHaveBeenCalled();
  });

  it('fails silently when audio is unavailable', async () => {
    const { playClick } = await loadSounds({ 'reminderly-ff-sounds': 'true', 'reminderly-pref-sounds': '{"remindersSounds":true}' });
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playClick('markDone')).not.toThrow();
  });

  it('saves sound choices without touching haptics', async () => {
    const { getSoundsConfig, setSoundsConfig } = await loadSounds({ 'reminderly-pref-haptics': '{"allHaptics":true}' });
    setSoundsConfig({ ...getSoundsConfig(), listsSounds: true });
    expect(localStorage.getItem('reminderly-pref-haptics')).toBe('{"allHaptics":true}');
    expect(JSON.parse(localStorage.getItem('reminderly-pref-sounds')!).listsSounds).toBe(true);
  });
});

// hapticTap plays the click first, so sounds and haptics each follow only their own settings.
const impact = vi.fn(() => Promise.resolve());
vi.mock('@capacitor/haptics', () => ({ Haptics: { impact }, ImpactStyle: { Light: 'LIGHT' } }));

async function loadHaptics(saved: Record<string, string>) {
  await loadSounds(saved);
  return import('../utils/haptics');
}

describe('hapticTap with sounds', () => {
  beforeEach(() => {
    started.mockClear();
    impact.mockClear();
  });

  it('plays the click with haptics off', async () => {
    const { hapticTap } = await loadHaptics({ 'reminderly-ff-sounds': 'true', 'reminderly-pref-sounds': '{"remindersSounds":true}', 'reminderly-pref-haptics': '{"allHaptics":false}' });
    hapticTap('createReminder');
    expect(started).toHaveBeenCalledTimes(1);
    expect(impact).not.toHaveBeenCalled();
  });

  it('fires haptics with sounds off', async () => {
    const { hapticTap } = await loadHaptics({ 'reminderly-ff-sounds': 'true', 'reminderly-ff-haptics': 'true', 'reminderly-pref-haptics': '{"allHaptics":true}' });
    hapticTap('createReminder');
    expect(impact).toHaveBeenCalledTimes(1);
    expect(started).not.toHaveBeenCalled();
  });

  it('fires both when both are on, and neither when both are off', async () => {
    const both = await loadHaptics({ 'reminderly-ff-sounds': 'true', 'reminderly-ff-haptics': 'true', 'reminderly-pref-sounds': '{"listsSounds":true}', 'reminderly-pref-haptics': '{"allHaptics":true}' });
    both.hapticTap('toggleListItemCheckbox');
    expect(impact).toHaveBeenCalledTimes(1);
    expect(started).toHaveBeenCalledTimes(1);
    const neither = await loadHaptics({ 'reminderly-pref-haptics': '{"allHaptics":false}' });
    neither.hapticTap('toggleListItemCheckbox');
    expect(impact).toHaveBeenCalledTimes(1);
    expect(started).toHaveBeenCalledTimes(1);
  });
});
