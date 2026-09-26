"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parsePreferences, type Preferences } from "@/lib/preferences";
const key = "foundry:preferences:v1";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("foundry-preferences", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("foundry-preferences", callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) || "{}";
  } catch {
    return "{}";
  }
}
export function usePreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  return useMemo(() => parsePreferences(raw), [raw]);
}
export function savePreferences(patch: Partial<Preferences>) {
  const next = parsePreferences(
    JSON.stringify({ ...parsePreferences(snapshot()), ...patch }),
  );
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new Event("foundry-preferences"));
}
