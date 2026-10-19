import { SETTINGS_DEFAULTS } from '../settings/keys';
import { readStoredBool } from '../settings/useStoredSetting';
import type { HapticAction, HapticPanel } from './haptics';

// Click sounds play on the same actions as haptics, with their own choices saved separately.

// Each settings panel has its own on/off (remindersSounds, listsSounds), off by default.
export type SoundsConfig = {
  remindersSounds: boolean;
  listsSounds: boolean;
} & Record<HapticAction, boolean>;

const STORAGE_KEY = 'reminderly-pref-sounds';
const FLAG_KEY = 'reminderly-ff-sounds';

const DEFAULT_CONFIG: SoundsConfig = {
  remindersSounds: false,
  listsSounds: false,
  markDone: true,
  createReminder: true,
  createList: true,
  markListComplete: true,
  deleteReminder: true,
  deleteListItem: true,
  clearAllDoneDeleted: true,
  uncompleteReminder: true,
  undeleteReminder: true,
  undoListCompletion: true,
  toggleListItemCheckbox: true,
  swipeRevealDelete: true,
  createTemplate: true,
  deleteTemplate: true,
  undeleteTemplate: true,
};

/** Fills in anything missing from a saved sounds value. Saved choices always win. */
export function normaliseSoundsConfig(parsed: Partial<SoundsConfig> | null): SoundsConfig {
  return { ...DEFAULT_CONFIG, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
}

let config: SoundsConfig = loadConfig();

function loadConfig(): SoundsConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normaliseSoundsConfig(JSON.parse(stored ?? SETTINGS_DEFAULTS[STORAGE_KEY]));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Fail silently
  }
}

export function getSoundsConfig(): SoundsConfig {
  return { ...config };
}

export function setSoundsConfig(next: SoundsConfig) {
  config = { ...next };
  saveConfig();
}

// Click: about 10ms of band-passed noise with a fast fade. Built once, on first use.
const CLICK_SECONDS = 0.01;
const CLICK_GAIN = 0.15;
const CLICK_FREQUENCY = 3000;

let audioContext: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;

function getAudio(): { ctx: AudioContext; buffer: AudioBuffer } | null {
  if (!audioContext) {
    const AudioCtor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    // Ambient clicks follow the silent switch and mix with other audio (where supported)
    const session = (globalThis.navigator as { audioSession?: { type: string } } | undefined)?.audioSession;
    if (session) session.type = 'ambient';
    audioContext = new AudioCtor();
  }
  if (!clickBuffer) {
    const length = Math.ceil(audioContext.sampleRate * CLICK_SECONDS);
    clickBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = clickBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
    }
  }
  return { ctx: audioContext, buffer: clickBuffer };
}

/** Single click gated by action config */
export const playClick = (action: HapticAction) => {
  if (!readStoredBool(FLAG_KEY)) return;
  if (!config[panelMasterKey(panelForAction(action))]) return;
  if (!config[action]) return;
  try {
    const audio = getAudio();
    if (!audio) return;
    const { ctx, buffer } = audio;
    // iOS suspends audio while the app is in the background
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = CLICK_FREQUENCY;
    const gain = ctx.createGain();
    gain.gain.value = CLICK_GAIN;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  } catch {
    // Fail silently
  }
};

/**
 * Sound switches shown on each settings panel's Sounds page. Same actions and grouping as HAPTIC_GROUPS
 * (kept in step by a Self Check). Listed here, not imported, because haptics.ts calls playClick.
 */
export const SOUND_GROUPS: Record<HapticPanel, { label: string; info: string; actions: HapticAction[]; templates?: boolean }[]> = {
  reminders: [
    { label: 'Creating a reminder', info: 'A soft click when you tap New reminder or create a reminder.', actions: ['createReminder'] },
    { label: 'Completing a reminder', info: 'A soft click when you mark a reminder as done, or restore a done reminder.', actions: ['markDone', 'uncompleteReminder'] },
    { label: 'Deleting a reminder', info: 'A soft click when you delete or restore a reminder, or clear done and deleted reminders.', actions: ['deleteReminder', 'undeleteReminder', 'clearAllDoneDeleted'] },
  ],
  lists: [
    { label: 'Creating a list', info: 'A soft click when you tap New list or use a template.', actions: ['createList'] },
    { label: 'Ticking off a list item', info: 'A soft click when you tick or untick a list item.', actions: ['toggleListItemCheckbox'] },
    { label: 'Completing a list', info: 'A soft click when you mark a list as done, or restore it.', actions: ['markListComplete', 'undoListCompletion'] },
    { label: 'Deleting a list item', info: 'A soft click when you delete a list item, or swipe to reveal delete.', actions: ['deleteListItem', 'swipeRevealDelete'] },
    { label: 'Creating a template', info: 'A soft click when you tap New template or create a template from a list.', actions: ['createTemplate'], templates: true },
    { label: 'Deleting a template', info: 'A soft click when you delete or restore a template.', actions: ['deleteTemplate', 'undeleteTemplate'], templates: true },
  ],
};

export function panelMasterKey(panel: HapticPanel): 'remindersSounds' | 'listsSounds' {
  return panel === 'reminders' ? 'remindersSounds' : 'listsSounds';
}

export function panelForAction(action: HapticAction): HapticPanel {
  return SOUND_GROUPS.reminders.some((group) => group.actions.includes(action)) ? 'reminders' : 'lists';
}
