"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface GasCardProps {
  title: string;
  value: number;
  subtitle: string;
  accent: string; // hex color
  delay?: number;
  badge?: string;
}

export default function GasCard({
  title,
  value,
  subtitle,
  accent,
  delay = 0,
  badge,
}: GasCardProps) {
  const { theme } = useTheme();
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(value);

  // Smooth number animation
  useEffect(() => {
    const el = displayRef.current;
    if (!el) return;
    const from = prevRef.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(current < 1 ? 3 : 2);
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = to;
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border p-5
        transition-all duration-500 ease-out cursor-default
        hover:scale-[1.02] hover:shadow-xl
        animate-[fadeInUp_0.6s_ease-out_both]
        ${theme === "dark"
          ? "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16]"
          : "bg-white/70 border-black/[0.08] hover:border-black/[0.15] backdrop-blur-sm"
        }
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}12 0%, transparent 70%)` }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${
              theme === "dark" ? "text-white/40" : "text-black/40"
            }`}
          >
            {title}
          </span>
          {badge && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${accent}20`,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span
            ref={displayRef}
            suppressHydrationWarning
            className="text-4xl font-bold tabular-nums tracking-tight font-mono"
            style={{ color: accent }}
          >
            {value.toFixed(value < 1 ? 3 : 2)}
          </span>
          <span
            className={`text-sm font-medium ${
              theme === "dark" ? "text-white/30" : "text-black/35"
            }`}
          >
            Gwei
          </span>
        </div>

        <p
          className={`text-xs mt-2 ${
            theme === "dark" ? "text-white/30" : "text-black/40"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
