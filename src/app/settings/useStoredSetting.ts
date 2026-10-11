// Boolean settings saved under their authoritative key (docs/settings-flags-spec.md, Phase 1.1).
// Read once on mount, written only when the setter is called. Never written because the app started.

import { useCallback, useState } from 'react';
import { TRANSITIONAL_FALLBACKS } from './keys';
import type { SettingsStorage } from './keys';

/** 'true' or 'false' as saved, otherwise the fallback. Never writes, so a malformed value is left as it is. */
export function readStoredBool(
  key: string,
  fallback: boolean = TRANSITIONAL_FALLBACKS[key] ?? false,
  storage: SettingsStorage = localStorage,
): boolean {
  try {
    const stored = storage.getItem(key);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Fall through to the fallback
  }
  return fallback;
}

export function writeStoredBool(key: string, value: boolean, storage: SettingsStorage = localStorage) {
  try {
    storage.setItem(key, String(value));
  } catch {
    // Fail silently
  }
}

export function useStoredSetting(key: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => readStoredBool(key));
  const update = useCallback((next: boolean) => {
    setValue(next);
    writeStoredBool(key, next);
  }, [key]);
  return [value, update];
}
