"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Bell, BellOff } from "lucide-react";

interface AlertPanelProps {
  threshold: number;
  onThresholdChange: (v: number) => void;
}

export default function AlertPanel({ threshold, onThresholdChange }: AlertPanelProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState(String(threshold));
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(true);

  function handleSave() {
    const v = parseFloat(input);
    if (!isNaN(v) && v > 0) {
      onThresholdChange(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-white/[0.02] border-white/[0.07]"
          : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
          Gas Alert
        </p>
        <button
          onClick={() => setEnabled((e) => !e)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            enabled
              ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
              : theme === "dark"
              ? "text-white/30 bg-white/5 hover:bg-white/10"
              : "text-black/30 bg-black/5 hover:bg-black/10"
          }`}
        >
          {enabled ? <Bell size={14} /> : <BellOff size={14} />}
        </button>
      </div>

      <p className={`text-sm mb-3 ${theme === "dark" ? "text-white/50" : "text-black/50"}`}>
        Notify when avg gas drops below
      </p>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max="999"
          step="0.5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          disabled={!enabled}
          className={`
            flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono font-bold
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-[#627EEA]/30 focus:border-[#627EEA]/50
            disabled:opacity-40
            ${theme === "dark"
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20"
              : "bg-black/5 border-black/10 text-black placeholder:text-black/20"
            }
          `}
        />
        <span className={`flex items-center text-sm font-medium px-2 ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
          Gwei
        </span>
        <button
          onClick={handleSave}
          disabled={!enabled}
          className={`
            px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            ${saved
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "bg-[#627EEA]/20 border border-[#627EEA]/30 text-[#627EEA] hover:bg-[#627EEA]/30"
            }
          `}
        >
          {saved ? "Saved ✓" : "Set"}
        </button>
      </div>

      <p className={`text-xs mt-3 ${theme === "dark" ? "text-white/25" : "text-black/30"}`}>
        Current threshold: <span className="font-mono font-bold">{threshold} Gwei</span>
      </p>
    </div>
  );
}
