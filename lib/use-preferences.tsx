"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { defaultPreferences, type Preferences } from "./preferences";
const Context = createContext<Preferences>(defaultPreferences);
export function PreferencesProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
}) {
  const [value, setValue] = useState<Preferences>({
    ...defaultPreferences,
    name: user?.name || "",
    email: user?.email || "",
  });
  useEffect(() => {
    let active = true;
    if (user)
      fetch("/api/me/preferences", { cache: "no-store" })
        .then(async (r) => {
          if (r.ok && active) setValue(await r.json());
        })
        .catch(() => {});
    const listener = (event: Event) =>
      setValue((event as CustomEvent<Preferences>).detail);
    window.addEventListener("foundry-preferences", listener);
    return () => {
      active = false;
      window.removeEventListener("foundry-preferences", listener);
    };
  }, [user]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePreferences() {
  return useContext(Context);
}
let saving: Promise<unknown> = Promise.resolve();
export function savePreferences(patch: Partial<Preferences>) {
  const task = saving
    .catch(() => {})
    .then(async () => {
      const r = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Не удалось сохранить");
      window.dispatchEvent(
        new CustomEvent("foundry-preferences", { detail: data }),
      );
    });
  saving = task;
  return task;
}
