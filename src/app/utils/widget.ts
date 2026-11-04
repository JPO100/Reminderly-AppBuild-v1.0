import { Capacitor, registerPlugin } from '@capacitor/core';
import type { TodayProgress } from '../reminder-utils';
import { parseLinkEntries } from './linked-lists';
import type { LinkEntry, LinkTick } from './linked-lists';

// Local native plugin (ios/App/App/WidgetBridgePlugin.swift): writes the snapshot to the
// App Group the lock screen widget reads, then asks WidgetKit to reload.
const WidgetBridge = registerPlugin<{
  setSnapshot(snapshot: TodayProgress): Promise<void>;
  clearSnapshot(): Promise<void>;
  setSiriActive(options: { active: boolean }): Promise<void>;
  setSiriContext(options: { json: string }): Promise<void>;
  getSiriPending(): Promise<{ items: string[] }>;
  removeSiriPending(options: { ids: string[] }): Promise<void>;
  setLinkedEnabled(options: { enabled: boolean }): Promise<void>;
  setLinkedLists(options: { json: string }): Promise<void>;
  getLinkedLinks(): Promise<{ json?: string | null }>;
  getLinkedTicks(): Promise<{ ticks: LinkTick[] }>;
  removeLinkedTicks(options: { items: { name: string; id: string }[] }): Promise<void>;
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

// Linked lists (docs/features/linked-lists.md): the shared flag, the published lists, Noterly's register and ticks.
let lastLinkedLists = '';

/** The master flag for Noterly. Written every call, so the foreground re-write always lands. */
export function syncLinkedEnabled(enabled: boolean) {
  if (Capacitor.getPlatform() !== 'ios') return;
  WidgetBridge.setLinkedEnabled({ enabled }).catch(() => {});
}

/** Publishes the lists Noterly may read (JSON); sent only when it changes. */
export function publishLinkedLists(json: string) {
  if (Capacitor.getPlatform() !== 'ios' || json === lastLinkedLists) return;
  lastLinkedLists = json;
  WidgetBridge.setLinkedLists({ json }).catch(() => {
    lastLinkedLists = '';
  });
}

/** Noterly's link register; empty outside iOS or when unreadable. */
export async function getLinkedLinks(): Promise<LinkEntry[]> {
  if (Capacitor.getPlatform() !== 'ios') return [];
  try {
    const { json } = await WidgetBridge.getLinkedLinks();
    return parseLinkEntries(json);
  } catch {
    return [];
  }
}

/** Ticks written by Noterly and not yet consumed; none outside iOS or on failure. */
export async function getLinkedTicks(): Promise<LinkTick[]> {
  if (Capacitor.getPlatform() !== 'ios') return [];
  try {
    const { ticks } = await WidgetBridge.getLinkedTicks();
    return Array.isArray(ticks) ? ticks : [];
  } catch {
    return [];
  }
}

/** Deletes consumed tick files, each only if it still holds the applied id. */
export function removeLinkedTicks(ticks: LinkTick[]) {
  if (Capacitor.getPlatform() !== 'ios' || ticks.length === 0) return;
  WidgetBridge.removeLinkedTicks({ items: ticks.map(({ name, id }) => ({ name, id })) }).catch(() => {});
}
