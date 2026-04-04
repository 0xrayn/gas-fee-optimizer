"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function AnimatedBackground() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          theme === "dark"
            ? "bg-[#030712]"
            : "bg-[#f0f4ff]"
        }`}
      />

      {/* Radial glow top-left */}
      <div
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] transition-opacity duration-700 ${
          theme === "dark"
            ? "bg-[#627EEA]/10 opacity-100"
            : "bg-[#627EEA]/15 opacity-100"
        }`}
      />

      {/* Radial glow bottom-right */}
      <div
        className={`absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[100px] transition-opacity duration-700 ${
          theme === "dark"
            ? "bg-emerald-500/8 opacity-100"
            : "bg-emerald-400/12 opacity-100"
        }`}
      />

      {/* Grid pattern */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          theme === "dark" ? "opacity-[0.03]" : "opacity-[0.06]"
        }`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,126,234,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,126,234,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated floating orbs */}
      <div
        className={`absolute top-1/4 left-1/3 w-2 h-2 rounded-full animate-[float_6s_ease-in-out_infinite] ${
          theme === "dark" ? "bg-[#627EEA]/40" : "bg-[#627EEA]/30"
        }`}
      />
      <div
        className={`absolute top-1/2 left-2/3 w-1.5 h-1.5 rounded-full animate-[float_8s_ease-in-out_infinite_2s] ${
          theme === "dark" ? "bg-emerald-400/40" : "bg-emerald-500/30"
        }`}
      />
      <div
        className={`absolute top-3/4 left-1/4 w-1 h-1 rounded-full animate-[float_7s_ease-in-out_infinite_4s] ${
          theme === "dark" ? "bg-[#8247E5]/50" : "bg-[#8247E5]/35"
        }`}
      />
      <div
        className={`absolute top-1/3 left-3/4 w-2 h-2 rounded-full animate-[float_9s_ease-in-out_infinite_1s] ${
          theme === "dark" ? "bg-sky-400/30" : "bg-sky-500/25"
        }`}
      />

      {/* Noise texture overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          theme === "dark" ? "opacity-[0.015]" : "opacity-[0.025]"
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />
    </div>
  );
}
