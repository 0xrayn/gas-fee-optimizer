"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useGasPolling } from "@/hooks/useGasPolling";
import { CHAINS } from "@/lib/chains";
import { formatLocalDateTime, getUserTimezoneAbbr, getUserUTCOffset } from "@/lib/timezone";
import AnimatedBackground from "@/components/AnimatedBackground";
import ThemeToggle from "@/components/ThemeToggle";
import ChainSelector from "@/components/ChainSelector";
import GasCard from "@/components/GasCard";
import GasChart from "@/components/GasChart";
import InsightBox from "@/components/InsightBox";
import TxEstimator from "@/components/TxEstimator";
import AlertPanel from "@/components/AlertPanel";
import type { Chain } from "@/types";

export default function Dashboard() {
  const { theme } = useTheme();
  const [chain, setChain] = useState<Chain>("ETH");
  const [alertThreshold, setAlertThreshold] = useState(20);

  const { gasData, history, countdown, isRefreshing, error, manualRefresh } =
    useGasPolling(chain);

  const chainCfg = CHAINS[chain];
  const tzAbbr = getUserTimezoneAbbr();
  const tzOffset = getUserUTCOffset();

  const pct = (countdown / 10) * 100;
  const circumference = 2 * Math.PI * 8;

  return (
    <>
      <AnimatedBackground />

      <div className="min-h-screen px-4 py-8 sm:px-8">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ─────────────────────────────────────── */}
          <header className="flex items-start justify-between gap-4 mb-8 flex-wrap animate-[fadeInDown_0.5s_ease-out_both]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {/* Live dot */}
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    theme === "dark" ? "text-white/30" : "text-black/30"
                  }`}
                >
                  Live · {tzAbbr} {tzOffset}
                </span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                Gas
                <span
                  className="ml-2"
                  style={{
                    background: `linear-gradient(135deg, ${chainCfg.color}, ${chainCfg.color}99)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Watch
                </span>
              </h1>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
                Real-time Ethereum gas fee optimizer
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ChainSelector active={chain} onChange={setChain} />
              <ThemeToggle />
            </div>
          </header>

          {/* ── Error banner ─────────────────────────────── */}
          {error && (
            <div
              className={`mb-4 px-4 py-2.5 rounded-xl text-xs border ${
                theme === "dark"
                  ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600"
              }`}
            >
              ⚠ {error}
            </div>
          )}

          {/* ── Gas Cards ───────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            <GasCard
              title="Slow"
              value={gasData.low}
              subtitle="~5 min confirm"
              accent="#10b981"
              delay={0}
              badge="Save"
            />
            <GasCard
              title="Standard"
              value={gasData.avg}
              subtitle="~1 min confirm"
              accent={chainCfg.color}
              delay={80}
            />
            <GasCard
              title="Fast"
              value={gasData.high}
              subtitle="~15 sec confirm"
              accent="#ef4444"
              delay={160}
              badge="Priority"
            />
          </div>

          {/* ── Chart ─────────────────────────────────────── */}
          <div
            className={`rounded-2xl border p-5 mb-4 transition-colors duration-300 animate-[fadeInUp_0.6s_ease-out_0.2s_both] ${
              theme === "dark"
                ? "bg-white/[0.02] border-white/[0.07]"
                : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
                  Gas History
                </p>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/25" : "text-black/30"}`}>
                  Avg Gwei · {tzAbbr} time · last {history.length} snapshots
                </p>
              </div>

              {/* Countdown + Refresh */}
              <div className="flex items-center gap-3">
                {/* SVG countdown ring */}
                <div className="relative flex items-center justify-center size-8">
                  <svg className="absolute inset-0 -rotate-90" width="32" height="32">
                    <circle cx="16" cy="16" r="8" fill="none" stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="2" />
                    <circle
                      cx="16" cy="16" r="8" fill="none"
                      stroke={chainCfg.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (pct / 100) * circumference}
                      className="transition-[stroke-dashoffset] duration-1000 linear"
                    />
                  </svg>
                  <span
                    className="text-[9px] font-mono font-bold z-10"
                    style={{ color: chainCfg.color }}
                  >
                    {countdown}
                  </span>
                </div>

                <button
                  onClick={manualRefresh}
                  disabled={isRefreshing}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                    border transition-all duration-200
                    hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${theme === "dark"
                      ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10"
                    }
                  `}
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            <GasChart
              data={history}
              accent={chainCfg.color}
              avgValue={gasData.avg}
            />
          </div>

          {/* ── Bottom grid ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InsightBox gas={gasData} alertThreshold={alertThreshold} />
            <TxEstimator gas={gasData} />
          </div>

          <AlertPanel
            threshold={alertThreshold}
            onThresholdChange={setAlertThreshold}
          />

          {/* ── Footer ────────────────────────────────────── */}
          <footer
            className={`mt-6 text-center text-[11px] font-mono ${
              theme === "dark" ? "text-white/20" : "text-black/25"
            }`}
          >
            {gasData.fetchedAt
              ? `Last updated: ${formatLocalDateTime(new Date(gasData.fetchedAt))} ${tzAbbr}`
              : "Initializing..."}{" "}
            · Auto-refresh every 10s
          </footer>
        </div>
      </div>
    </>
  );
}
