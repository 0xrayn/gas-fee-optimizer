"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("gw-theme") : null;
    if (stored === "dark" || stored === "light") return stored;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.style.colorScheme = t;
  }

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((prev: Theme) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("gw-theme", next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}