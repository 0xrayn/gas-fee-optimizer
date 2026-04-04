"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useGasPolling } from "@/hooks/useGasPolling";
import { usePricePolling } from "@/hooks/usePricePolling";
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
import GweiExplainer from "@/components/GweiExplainer";
import type { Chain } from "@/types";

const CHAIN_SUBTITLE: Record<Chain, string> = {
  ETH: "Real-time Ethereum gas fee optimizer",
  MATIC: "Real-time Polygon gas fee optimizer",
  ARB: "Real-time Arbitrum gas fee optimizer",
};

export default function Dashboard() {
  const { theme } = useTheme();
  const [chain, setChain] = useState<Chain>("ETH");
  const [alertThreshold, setAlertThreshold] = useState(20);

  const { gasData, history, countdown, isRefreshing, error, manualRefresh } =
    useGasPolling(chain);
  const { price, priceChange, isLoading: priceLoading } = usePricePolling(chain);

  const chainCfg = CHAINS[chain];
  const tzAbbr = getUserTimezoneAbbr();
  const tzOffset = getUserUTCOffset();

  const pct = (countdown / 10) * 100;
  const circumference = 2 * Math.PI * 8;
  const isLoaded = gasData.avg > 0;
  const priceChangePositive = priceChange >= 0;

  return (
    <>
      <AnimatedBackground />

      <div className="min-h-screen px-4 py-8 sm:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <header className="flex items-start justify-between gap-4 mb-6 flex-wrap animate-[fadeInDown_0.5s_ease-out_both]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${theme === "dark" ? "text-white/30" : "text-black/30"}`}>
                  Live · {tzAbbr} {tzOffset}
                </span>
              </div>
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${theme === "dark" ? "text-white" : "text-black"}`}>
                Gas
                {/* Use a <span> with inline style only — no Tailwind dynamic color class */}
                <span
                  className="ml-2 transition-none"
                  style={{
                    background: `linear-gradient(135deg, ${chainCfg.color}, ${chainCfg.color}99)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Watch
                </span>
              </h1>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
                {CHAIN_SUBTITLE[chain]}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ChainSelector active={chain} onChange={setChain} />
              <ThemeToggle />
            </div>
          </header>

          {/* Price ticker */}
          <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border transition-colors duration-300 ${
            theme === "dark" ? "bg-white/[0.02] border-white/[0.07]" : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
          }`}>
            <span className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
              {chainCfg.nativeCurrency} Price
            </span>
            {priceLoading ? (
              <span className={`text-xs font-mono animate-pulse ${theme === "dark" ? "text-white/30" : "text-black/30"}`}>
                Fetching...
              </span>
            ) : price > 0 ? (
              <>
                <span className={`font-mono font-bold text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>
                  ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-mono font-semibold ${priceChangePositive ? "text-emerald-400" : "text-red-400"}`}>
                  {priceChangePositive ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
                </span>
                <span className={`text-[10px] ml-auto ${theme === "dark" ? "text-white/20" : "text-black/25"}`}>
                  via CoinGecko
                </span>
              </>
            ) : (
              <span className={`text-xs font-mono ${theme === "dark" ? "text-white/30" : "text-black/30"}`}>
                Unavailable
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className={`mb-4 px-4 py-2.5 rounded-xl text-xs border ${
              theme === "dark"
                ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            }`}>
              ⚠ {error}
            </div>
          )}

          {/* Gas Cards */}
          {!isLoaded ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`rounded-2xl border p-5 h-32 animate-pulse ${
                  theme === "dark" ? "bg-white/[0.03] border-white/[0.08]" : "bg-white/70 border-black/[0.08]"
                }`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              <GasCard title="Slow" value={gasData.low} subtitle="~5 min confirm" accent="#10b981" delay={0} badge="Save" />
              <GasCard title="Standard" value={gasData.avg} subtitle="~1 min confirm" accent={chainCfg.color} delay={80} />
              <GasCard title="Fast" value={gasData.high} subtitle="~15 sec confirm" accent="#ef4444" delay={160} badge="Priority" />
            </div>
          )}

          {/* Chart */}
          <div className={`rounded-2xl border p-5 mb-4 transition-colors duration-300 animate-[fadeInUp_0.6s_ease-out_0.2s_both] ${
            theme === "dark" ? "bg-white/[0.02] border-white/[0.07]" : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
                  Gas History
                </p>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/25" : "text-black/30"}`}>
                  Avg Gwei · {tzAbbr} time · last {history.length} snapshots
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                  <span className="text-[9px] font-mono font-bold z-10" style={{ color: chainCfg.color }}>
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
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
            <GasChart data={history} accent={chainCfg.color} avgValue={gasData.avg} />
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InsightBox gas={gasData} alertThreshold={alertThreshold} chain={chain} />
            <TxEstimator gas={gasData} chain={chain} nativePrice={price} />
          </div>

          {/* Alert Panel */}
          <AlertPanel
            threshold={alertThreshold}
            onThresholdChange={setAlertThreshold}
            currentGas={gasData.avg}
            chain={chain}
          />

          {/* Gwei Explainer */}
          <GweiExplainer chain={chain} />

          {/* Footer */}
          <footer className="mt-8 pb-4">
            <p className={`text-[11px] font-mono text-center ${theme === "dark" ? "text-white/20" : "text-black/25"}`}>
              {isLoaded
                ? `Last updated: ${formatLocalDateTime(new Date(gasData.fetchedAt))} ${tzAbbr}`
                : "Initializing..."
              }{" "}
              · Auto-refresh every 10s
            </p>

            <div className="mt-5 flex justify-center">
              <a
                href="https://rayn.web.id"
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  group relative inline-flex items-center gap-4 px-8 py-3.5
                  rounded-2xl border transition-all duration-300
                  hover:scale-[1.03] active:scale-[0.98]
                  ${theme === "dark"
                    ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/[0.18]"
                    : "bg-black/[0.03] border-black/10 hover:bg-black/[0.06] hover:border-black/[0.18]"
                  }
                `}
              >
                {/* Subtle glow matching current chain */}
                <span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `0 0 32px 0 ${chainCfg.color}22` }}
                />
                {/* Avatar */}
                <span
                  className="relative size-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${chainCfg.color}, ${chainCfg.color}88)` }}
                >
                  R
                </span>
                {/* Text block */}
                <span className="relative flex flex-col leading-snug">
                  <span className={`text-sm font-bold tracking-wide ${theme === "dark" ? "text-white/70 group-hover:text-white/90" : "text-black/60 group-hover:text-black/85"} transition-colors duration-200`}>
                    Built by Rayn
                  </span>
                  <span className={`text-xs tracking-wider ${theme === "dark" ? "text-white/30 group-hover:text-white/50" : "text-black/35 group-hover:text-black/55"} transition-colors duration-200`}>
                    rayn.web.id ↗
                  </span>
                </span>
              </a>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
