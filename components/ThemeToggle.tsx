"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        border transition-all duration-300 ease-out
        hover:scale-105 active:scale-95 cursor-pointer
        ${theme === "dark"
          ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
          : "bg-black/5 border-black/10 text-black/70 hover:bg-black/10 hover:border-black/20"
        }
      `}
    >
      <span className="relative size-4 overflow-hidden">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-300
            ${theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}
          `}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-300
            ${theme === "light" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}
          `}
        />
      </span>
      <span className="transition-all duration-300">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
