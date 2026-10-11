// Boolean settings saved under their authoritative key (docs/settings-flags-spec.md, Phase 1.1).
// Read once on mount, written only when the setter is called. Never written because the app started.

import { useCallback, useState } from 'react';
import { SETTINGS_DEFAULTS, TRANSITIONAL_FALLBACKS } from './keys';
import type { SettingsStorage } from './keys';

/** 'true' or 'false' as saved, otherwise the fallback. Never writes, so a malformed value is left as it is. */
/** The value used when a key has never been saved. */
export function defaultFor(key: string): boolean {
  return TRANSITIONAL_FALLBACKS[key] ?? SETTINGS_DEFAULTS[key] === 'true';
}

export function readStoredBool(
  key: string,
  fallback: boolean = defaultFor(key),
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

// Called when a settings write fails, so the app can show its existing storage error.
// Successful writes are not reported, so they never clear an error raised by reminder or list saves.
let writeFailureListener: (() => void) | null = null;

/** Sets the write failure listener and returns the previous one. */
export function setSettingsWriteFailureListener(listener: (() => void) | null) {
  const previous = writeFailureListener;
  writeFailureListener = listener;
  return previous;
}

/** Returns false when the value could not be saved. */
export function writeStoredBool(key: string, value: boolean, storage: SettingsStorage = localStorage): boolean {
  try {
    storage.setItem(key, String(value));
    return true;
  } catch {
    writeFailureListener?.();
    return false;
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
