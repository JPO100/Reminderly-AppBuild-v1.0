import { useCallback, useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import type { CreatedList, ListItemSortMode } from "./list-utils";
import { readStoredBool } from "../settings/useStoredSetting";
import { applyLinkTicks, buildPublishedLists, getConsumedTicks, LINKED_LISTS_FLAG_KEY } from "./linked-lists";
import type { LinkEntry, LinkTick } from "./linked-lists";
import { getLinkedLinks, getLinkedTicks, publishLinkedLists, removeLinkedTicks, syncLinkedEnabled } from "./widget";

const LISTS_KEY = 'reminderly-created-lists';

/**
 * Linked lists (docs/features/linked-lists.md). With the master flag on, on launch and each return to the foreground:
 * read Noterly's register and ticks, apply the ticks through the normal list state, and once the lists are saved
 * publish them from the saved copy and delete the consumed tick files. `ready` is true once the first read is done, so
 * the app can stay hidden for that moment on a cold launch. With the flag off nothing is read, published or consumed.
 *
 * Call after the effect that saves the lists, so the saved copy is current when the publish effect runs.
 */
export function useLinkedLists(enabled: boolean, createdLists: CreatedList[], setCreatedLists: (update: (lists: CreatedList[]) => CreatedList[]) => void, sortMode: ListItemSortMode, onApply: (ticks: LinkTick[]) => void) {
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [ready, setReady] = useState(() => !readStoredBool(LINKED_LISTS_FLAG_KEY));
  const appliedRef = useRef<LinkTick[]>([]);
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const consume = useCallback(async () => {
    try {
      const [nextLinks, ticks] = await Promise.all([getLinkedLinks(), getLinkedTicks()]);
      setLinks(nextLinks);
      if (ticks.length > 0) {
        appliedRef.current = [...appliedRef.current, ...ticks];
        onApplyRef.current(ticks);
        setCreatedLists((lists) => {
          const result = applyLinkTicks(lists, ticks, Date.now());
          return result.changed ? result.lists : lists;
        });
      }
    } finally {
      setReady(true);
    }
  }, [setCreatedLists]);

  useEffect(() => {
    syncLinkedEnabled(enabled);
    if (!enabled) {
      setReady(true);
      return;
    }
    void consume();
    const listener = CapacitorApp.addListener('appStateChange', (state) => {
      if (!state.isActive) return;
      syncLinkedEnabled(true);
      void consume();
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, [enabled, consume]);

  // After each save: publish what is stored, then delete the ticks whose value is stored
  useEffect(() => {
    if (!enabled || !ready) return;
    let stored: CreatedList[];
    try {
      const parsed = JSON.parse(localStorage.getItem(LISTS_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return;
      stored = parsed;
    } catch {
      return;
    }
    publishLinkedLists(JSON.stringify(buildPublishedLists(stored, links, sortMode)));
    if (appliedRef.current.length > 0) {
      const consumed = getConsumedTicks(stored, appliedRef.current);
      if (consumed.length > 0) {
        removeLinkedTicks(consumed);
        appliedRef.current = appliedRef.current.filter((tick) => !consumed.includes(tick));
      }
    }
  }, [enabled, ready, createdLists, links, sortMode]);

  return { links, ready };
}
