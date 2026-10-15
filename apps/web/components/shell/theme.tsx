"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "tradh.theme";
const EVENT = "tradh:theme";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: "system", setTheme: () => {} });

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** Inline script for <head>: applies the stored theme before first paint to avoid a flash. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(KEY)});if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

/** Follows prefers-color-scheme until the user chooses; the choice is a per-device convenience. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const setTheme = useCallback((t: Theme) => {
    try {
      if (t === "system") {
        localStorage.removeItem(KEY);
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem(KEY, t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
