import { Capacitor, registerPlugin } from '@capacitor/core';
import type { TodayProgress } from '../reminder-utils';

// Local native plugin (ios/App/App/WidgetBridgePlugin.swift): writes the snapshot to the
// App Group the lock screen widget reads, then asks WidgetKit to reload.
const WidgetBridge = registerPlugin<{
  setSnapshot(snapshot: TodayProgress): Promise<void>;
  clearSnapshot(): Promise<void>;
  setSiriActive(options: { active: boolean }): Promise<void>;
  setSiriContext(options: { json: string }): Promise<void>;
  getSiriPending(): Promise<{ items: string[] }>;
  removeSiriPending(options: { ids: string[] }): Promise<void>;
}>('WidgetBridge');

let lastSent = '';

/**
 * Lock screen widget flag on: publish today's progress. Off (null): clear any shared
 * reminder data so the widget shows its neutral empty state.
 */
export function syncWidget(snapshot: TodayProgress | null) {
  if (Capacitor.getPlatform() !== 'ios') return;
  const key = snapshot ? JSON.stringify(snapshot) : 'cleared';
  if (key === lastSent) return;
  lastSent = key;
  const call = snapshot ? WidgetBridge.setSnapshot(snapshot) : WidgetBridge.clearSnapshot();
  call.catch(() => {
    lastSent = '';
  });
}

/**
 * Siri for reminders on or off, for the Siri intent to read before it accepts a request.
 * Writes every time it is called (no skip for an unchanged value), so the foreground re-write always lands.
 */
export function syncSiriActive(active: boolean) {
  if (Capacitor.getPlatform() !== 'ios') return;
  WidgetBridge.setSiriActive({ active }).catch(() => {});
}

let lastSiriContext = '';

/** The Siri context (siri-pending.ts) for the Siri intent; sent only when it changes. */
export function syncSiriContext(context: unknown) {
  if (Capacitor.getPlatform() !== 'ios') return;
  const json = JSON.stringify(context);
  if (json === lastSiriContext) return;
  lastSiriContext = json;
  WidgetBridge.setSiriContext({ json }).catch(() => {
    lastSiriContext = '';
  });
}

/** Reminders the Siri intent saved while Reminderly was not running (JSON strings); none outside iOS or on failure. */
export async function getSiriPending(): Promise<string[]> {
  if (Capacitor.getPlatform() !== 'ios') return [];
  try {
    const { items } = await WidgetBridge.getSiriPending();
    return Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

/** Removes imported (saved) or malformed entries from the Siri pending list, by reminder id. */
export function removeSiriPending(ids: string[]) {
  if (Capacitor.getPlatform() !== 'ios' || ids.length === 0) return;
  WidgetBridge.removeSiriPending({ ids }).catch(() => {});
}
