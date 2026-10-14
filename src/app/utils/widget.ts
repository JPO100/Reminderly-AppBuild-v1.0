import { Capacitor, registerPlugin } from '@capacitor/core';
import type { TodayProgress } from '../reminder-utils';

// Local native plugin (ios/App/App/WidgetBridgePlugin.swift): writes the snapshot to the
// App Group the lock screen widget reads, then asks WidgetKit to reload.
const WidgetBridge = registerPlugin<{
  setSnapshot(snapshot: TodayProgress): Promise<void>;
  clearSnapshot(): Promise<void>;
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
