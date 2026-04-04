"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        border th-muted th-border-card th-text-secondary
        transition-[transform] duration-150 ease-out
        hover:scale-105 active:scale-95 cursor-pointer"
    >
      <span className="relative size-4 overflow-hidden">
        <Sun
          size={16}
          className={`absolute inset-0 transition-[opacity,transform] duration-300
            ${theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-[opacity,transform] duration-300
            ${theme === "light" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
        />
      </span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
