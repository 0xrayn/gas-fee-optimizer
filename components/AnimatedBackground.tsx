"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark ? "#030712" : "#f0f4ff",
          transition: "background 250ms ease",
        }}
      />
      {/* Glow top-left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          background: isDark ? "rgba(98,126,234,0.10)" : "rgba(98,126,234,0.15)",
          transition: "background 250ms ease",
        }}
      />
      {/* Glow bottom-right */}
      <div
        className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          background: isDark ? "rgba(16,185,129,0.08)" : "rgba(52,211,153,0.12)",
          transition: "background 250ms ease",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.03 : 0.06,
          backgroundImage: `
            linear-gradient(rgba(99,126,234,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,126,234,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transition: "opacity 250ms ease",
        }}
      />
      {/* Orbs */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-[#627EEA]/40 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-[float_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-3/4 left-1/4 w-1 h-1 rounded-full bg-[#8247E5]/50 animate-[float_7s_ease-in-out_infinite_4s]" />
      <div className="absolute top-1/3 left-3/4 w-2 h-2 rounded-full bg-sky-400/30 animate-[float_9s_ease-in-out_infinite_1s]" />
    </div>
  );
}
