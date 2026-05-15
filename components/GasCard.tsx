"use client";

import { useEffect, useRef } from "react";

interface GasCardProps {
  title: string;
  value: number;
  subtitle: string;
  accent: string;
  delay?: number;
  badge?: string;
}

export default function GasCard({ title, value, subtitle, accent, delay = 0, badge }: GasCardProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(value);

  // Reset prevRef jika value berubah sangat drastis (ganti chain),
  // supaya animasi tidak berjalan dari nilai chain sebelumnya.
  // Harus dijalankan SEBELUM effect animasi agar `from` sudah benar.
  // Gunakan ref terpisah untuk flag "sudah reset" supaya effect animasi
  // bisa langsung pakai nilai baru tanpa melewati animasi dari nilai lama.
  const skipAnimRef = useRef(false);
  useEffect(() => {
    const ratio = prevRef.current > 0 ? Math.max(value, prevRef.current) / Math.min(value, prevRef.current) : 0;
    if (ratio > 10 || prevRef.current === 0) {
      prevRef.current = value;
      skipAnimRef.current = true;
    } else {
      skipAnimRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    const el = displayRef.current;
    if (!el) return;

    // Jika sebelumnya 0 (empty/initial state) atau chain baru dengan nilai
    // sangat berbeda, langsung tampilkan nilai real tanpa animasi
    // agar tidak terlihat "turun ke 0.00" atau animasi cross-chain
    if (skipAnimRef.current || value === 0) {
      el.textContent = value.toFixed(value < 1 ? 3 : 2);
      prevRef.current = value;
      skipAnimRef.current = false;
      return;
    }

    const from = prevRef.current;
    const to = value;

    const duration = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
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
      className="group relative overflow-hidden rounded-2xl border p-3 sm:p-5 th-card-solid
        transition-[transform,box-shadow] duration-300 ease-out cursor-default
        hover:scale-[1.02] hover:shadow-xl
        animate-[fadeInUp_0.6s_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}12 0%, transparent 70%)` }}
      />
      <div
        className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest th-text-muted">
            {title}
          </span>
          {badge && (
            <span
              className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full"
              style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span
            ref={displayRef}
            suppressHydrationWarning
            className="text-2xl sm:text-4xl font-bold tabular-nums tracking-tight font-mono"
            style={{ color: accent }}
          >
            {value.toFixed(value < 1 ? 3 : 2)}
          </span>
          <span className="text-[10px] sm:text-sm font-medium th-text-faint">Gwei</span>
        </div>
        <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 th-text-faint">{subtitle}</p>
      </div>
    </div>
  );
}
