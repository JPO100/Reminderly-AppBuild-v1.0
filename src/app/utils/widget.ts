import { Capacitor, registerPlugin } from '@capacitor/core';
import type { TodayProgress } from '../reminder-utils';

// Local native plugin (ios/App/App/WidgetBridgePlugin.swift): writes the snapshot to the
// App Group the lock screen widget reads, then asks WidgetKit to reload.
const WidgetBridge = registerPlugin<{
  setSnapshot(snapshot: TodayProgress): Promise<void>;
  clearSnapshot(): Promise<void>;
  setSiriActive(options: { active: boolean }): Promise<void>;
  confirmSiriAdd(options: { id: string }): Promise<void>;
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

/** A Siri request's reminder is saved: the Siri intent waits for this before saying "Done". */
export function confirmSiriAdd(id: string) {
  if (Capacitor.getPlatform() !== 'ios' || !id) return;
  WidgetBridge.confirmSiriAdd({ id }).catch(() => {});
}
