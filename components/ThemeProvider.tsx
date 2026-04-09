"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useTransition,
  memo,
} from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  isPending: boolean;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  toggle: () => {},
  isPending: false,
});

// Apply theme ke DOM langsung tanpa trigger re-render ekstra
function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem("gw-theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // SSR / private mode  ignore
  }
  return null;
}

export const ThemeProvider = memo(function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const initial = readStoredTheme() ?? "dark";
    setTheme(initial);
    applyThemeToDom(initial);
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    startTransition(() => {
      setTheme((prev) => {
        const next = prev === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("gw-theme", next);
        } catch {
          /* ignore */
        }
        // Apply ke DOM SYNC  visual langsung berubah, tidak nunggu re-render
        applyThemeToDom(next);
        return next;
      });
    });
  }, []);

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", toggle, isPending: false }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, isPending }}>
      {children}
    </ThemeContext.Provider>
  );
});

export function useTheme() {
  return useContext(ThemeContext);
}
