import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SETTINGS_DEFAULTS } from '../settings/keys';
import { readStoredBool } from '../settings/useStoredSetting';

export type HapticAction =
  | 'markDone'
  | 'createReminder'
  | 'markListComplete'
  | 'deleteReminder'
  | 'deleteListItem'
  | 'clearAllDoneDeleted'
  | 'uncompleteReminder'
  | 'undeleteReminder'
  | 'undoListCompletion'
  | 'toggleListItemCheckbox'
  | 'swipeRevealDelete';

export type HapticsConfig = {
  allHaptics: boolean;
} & Record<HapticAction, boolean>;

// Authoritative key since the settings migration (migrated from reminderly-haptics-config)
const STORAGE_KEY = 'reminderly-pref-haptics';
const FLAG_KEY = 'reminderly-ff-haptics';

const DEFAULT_CONFIG: HapticsConfig = {
  allHaptics: true,
  markDone: true,
  createReminder: true,
  markListComplete: true,
  deleteReminder: true,
  deleteListItem: true,
  clearAllDoneDeleted: true,
  uncompleteReminder: true,
  undeleteReminder: true,
  undoListCompletion: true,
  toggleListItemCheckbox: true,
  swipeRevealDelete: true,
};

let config: HapticsConfig = loadConfig();

function loadConfig(): HapticsConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Never saved: development default (master off, actions on)
    if (stored == null) return { ...DEFAULT_CONFIG, ...JSON.parse(SETTINGS_DEFAULTS[STORAGE_KEY]) };
    const parsed = JSON.parse(stored);
    // Merge with defaults so new keys are always present
    return { ...DEFAULT_CONFIG, ...parsed };
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

export function getHapticsConfig(): HapticsConfig {
  return { ...config };
}

export function setHapticsConfig(next: HapticsConfig) {
  config = { ...next };
  saveConfig();
}

/** Single tap feedback gated by action config */
export const hapticTap = (action: HapticAction) => {
  if (!readStoredBool(FLAG_KEY)) return;
  if (!config.allHaptics) return;
  if (!config[action]) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

/** Haptic actions shown on the Haptic feedback settings page. */
export const HAPTIC_ACTION_LABELS: { action: HapticAction; label: string; info: string }[] = [
  { action: 'markDone', label: 'Mark reminder done', info: 'A small vibration when you mark a reminder as done.' },
  { action: 'createReminder', label: 'Create new reminder', info: 'A small vibration when you create a reminder.' },
  { action: 'markListComplete', label: 'Mark list complete', info: 'A small vibration when you complete a list.' },
  { action: 'deleteReminder', label: 'Delete reminder', info: 'A small vibration when you delete a reminder.' },
  { action: 'deleteListItem', label: 'Delete list item', info: 'A small vibration when you delete a list item.' },
  { action: 'clearAllDoneDeleted', label: 'Clear all done/deleted', info: 'A small vibration when you clear all done or deleted items.' },
  { action: 'uncompleteReminder', label: 'Uncomplete reminder', info: 'A small vibration when you restore a done reminder.' },
  { action: 'undeleteReminder', label: 'Undelete reminder', info: 'A small vibration when you restore a deleted reminder.' },
  { action: 'undoListCompletion', label: 'Undo list completion', info: 'A small vibration when you restore a completed list.' },
  { action: 'toggleListItemCheckbox', label: 'Toggle list item checkbox', info: 'A small vibration when you tick or untick a list item.' },
  { action: 'swipeRevealDelete', label: 'Swipe to reveal delete', info: 'A small vibration when a swipe reveals the delete button.' },
];
