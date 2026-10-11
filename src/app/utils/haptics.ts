import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
    if (stored == null) return { ...DEFAULT_CONFIG };
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
  if (!config.allHaptics) return;
  if (!config[action]) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};
