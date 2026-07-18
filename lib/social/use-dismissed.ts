"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(key: string, onStoreChange: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === key || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(`morris:dismiss:${key}`, onStoreChange as EventListener);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(`morris:dismiss:${key}`, onStoreChange as EventListener);
  };
}

function getSnapshot(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** SSR-safe dismissed flag backed by localStorage. */
export function useDismissed(key: string) {
  const dismissed = useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    () => getSnapshot(key),
    () => true
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(`morris:dismiss:${key}`));
  }, [key]);

  return { dismissed, dismiss };
}
