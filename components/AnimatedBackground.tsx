"use client";

import { memo } from "react";

// Komponen ini TIDAK subscribe ke useTheme()  zero re-render saat toggle theme.
// Transisi warna ditangani pure CSS via data-theme attribute di <html>.
export default memo(function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base  dark/light via CSS */}
      <div className="animated-bg-base absolute inset-0" />
      {/* Glow top-left */}
      <div className="animated-bg-glow-tl absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px]" />
      {/* Glow bottom-right */}
      <div className="animated-bg-glow-br absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[100px]" />
      {/* Grid overlay */}
      <div className="animated-bg-grid absolute inset-0" />
      {/* Floating orbs  warna static, tidak perlu theme */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-[#627EEA]/40 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-[float_8s_ease-in-out_infinite_2s]" />
      <div className="absolute top-3/4 left-1/4 w-1 h-1 rounded-full bg-[#8247E5]/50 animate-[float_7s_ease-in-out_infinite_4s]" />
      <div className="absolute top-1/3 left-3/4 w-2 h-2 rounded-full bg-sky-400/30 animate-[float_9s_ease-in-out_infinite_1s]" />
    </div>
  );
});
