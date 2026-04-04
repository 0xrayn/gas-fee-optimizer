"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getBestWindowHint, getHourLocal, getUserTimezoneAbbr } from "@/lib/timezone";
import { CHAINS } from "@/lib/chains";
import type { GasData, Chain } from "@/types";

interface InsightBoxProps {
  gas: GasData;
  alertThreshold: number;
  chain: Chain;
}

// Threshold berbeda per chain — MATIC normal 50-150, ARB normal 0.05-0.2
const GAS_LEVELS: Record<Chain, { veryLow: number; low: number; moderate: number; high: number }> = {
  ETH:   { veryLow: 10,   low: 20,   moderate: 50,   high: 90   },
  MATIC: { veryLow: 30,   low: 60,   moderate: 100,  high: 150  },
  ARB:   { veryLow: 0.03, low: 0.08, moderate: 0.15, high: 0.25 },
};

function getGasLevel(avg: number, chain: Chain) {
  const t = GAS_LEVELS[chain];
  if (avg < t.veryLow)  return { label: "Very Low",  color: "#10b981", dot: "bg-emerald-400", advice: "Excellent — transact now with any speed setting." };
  if (avg < t.low)      return { label: "Low",       color: "#22c55e", dot: "bg-green-400",   advice: "Good conditions. Use 'Slow' to save even more." };
  if (avg < t.moderate) return { label: "Moderate",  color: "#f59e0b", dot: "bg-amber-400",   advice: "Acceptable for urgent txns. Consider waiting for cheaper gas." };
  if (avg < t.high)     return { label: "High",      color: "#f97316", dot: "bg-orange-400",  advice: "Elevated fees. Delay non-urgent transactions." };
  return                         { label: "Very High", color: "#ef4444", dot: "bg-red-400",    advice: "Network congested. Wait unless urgent." };
}

export default function InsightBox({ gas, alertThreshold, chain }: InsightBoxProps) {
  const { theme } = useTheme();
  const level    = getGasLevel(gas.avg, chain);
  const hourHint = getBestWindowHint(getHourLocal(new Date()));
  const tzAbbr   = getUserTimezoneAbbr();
  const chainCfg = CHAINS[chain];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isUnderAlert = mounted && gas.avg > 0 && gas.avg <= alertThreshold;
  const spread = gas.high - gas.low;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-colors duration-300 ${
      theme === "dark" ? "bg-white/[0.02] border-white/[0.07]" : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
    }`}>
      {/* Status row */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center size-9 rounded-full" style={{ background: `${level.color}18` }}>
          <span className={`size-2.5 rounded-full ${level.dot} relative`}>
            <span className={`absolute inset-0 rounded-full ${level.dot} animate-ping opacity-60`} />
          </span>
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
            {chainCfg.label} Network Status
          </p>
          <p suppressHydrationWarning className="text-base font-bold" style={{ color: level.color }}>
            {gas.avg > 0
              ? `${level.label} — ${gas.avg.toFixed(gas.avg < 1 ? 4 : 2)} Gwei avg`
              : "Loading..."}
          </p>
        </div>
      </div>

      {/* Alert triggered */}
      {isUnderAlert && (
        <div className="flex items-start gap-3 rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-400 text-lg">🔔</span>
          <p className="text-sm text-emerald-400 font-medium">
            Gas is below your {alertThreshold} Gwei alert threshold!
          </p>
        </div>
      )}

      {/* Insights */}
      {gas.avg > 0 && (
        <div suppressHydrationWarning className="space-y-2.5">
          {[
            { icon: "💡", text: level.advice },
            { icon: "🕐", text: `${hourHint} (${tzAbbr})` },
            {
              icon: "📊",
              text: `Spread: ${spread.toFixed(spread < 1 ? 4 : 2)} Gwei — ${spread > (GAS_LEVELS[chain].moderate * 0.5) ? "high volatility" : "stable network"}`,
            },
            ...(gas.baseFee ? [{ icon: "⛽", text: `Base fee: ${gas.baseFee.toFixed(2)} Gwei` }] : []),
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-2.5 text-sm ${theme === "dark" ? "text-white/60" : "text-black/60"}`}>
              <span className="text-base leading-5 flex-shrink-0">{item.icon}</span>
              <span className="leading-5">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
