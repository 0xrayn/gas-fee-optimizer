"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useGasPolling } from "@/hooks/useGasPolling";
import { usePricePolling, PRICE_DISPLAY_LABEL } from "@/hooks/usePricePolling";
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

export const DEFAULT_THRESHOLD: Record<Chain, number> = {
  ETH:   20,
  MATIC: 80,
  ARB:   0.5,
};

const CHAIN_SUBTITLE: Record<Chain, string> = {
  ETH:   "Real-time Ethereum gas fee optimizer",
  MATIC: "Real-time Polygon gas fee optimizer",
  ARB:   "Real-time Arbitrum gas fee optimizer",
};

export default function Dashboard() {
  const [chain, setChain] = useState<Chain>("ETH");
  const [alertThreshold, setAlertThreshold] = useState(DEFAULT_THRESHOLD["ETH"]);

  const { gasData, history, countdown, isRefreshing, error, manualRefresh } = useGasPolling(chain);
  const { price, priceChange, isLoading: priceLoading, ethPrice } = usePricePolling(chain);
  const priceLabel = PRICE_DISPLAY_LABEL[chain];

  useEffect(() => {
    setAlertThreshold(DEFAULT_THRESHOLD[chain]);
  }, [chain]);

  const chainCfg       = CHAINS[chain];
  const tzAbbr         = getUserTimezoneAbbr();
  const tzOffset       = getUserUTCOffset();
  const pct            = (countdown / 60) * 100;
  const circumference  = 2 * Math.PI * 8;
  const isLoaded       = gasData.avg > 0;
  const priceChangePos = priceChange >= 0;

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen px-3 py-5 sm:px-6 sm:py-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <header className="mb-5 animate-[fadeInDown_0.5s_ease-out_both]">
            {/* Row 1: live dot + timezone */}
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] th-text-faint">
                Live · {tzAbbr} {tzOffset}
              </span>
            </div>

            {/* Row 2: title + controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-mono th-text-primary leading-tight">
                  Gas
                  <span
                    className="ml-2"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${chainCfg.color}, ${chainCfg.color}99)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Watch
                  </span>
                </h1>
                <p className="text-xs sm:text-sm mt-0.5 th-text-faint">{CHAIN_SUBTITLE[chain]}</p>
              </div>
              <div className="flex items-center gap-2">
                <ChainSelector active={chain} onChange={setChain} />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Price ticker */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 px-3 sm:px-4 py-2.5 rounded-xl border th-card th-border-card backdrop-blur-sm overflow-hidden">
            <span className="text-xs font-semibold uppercase tracking-widest th-text-faint shrink-0">
              {priceLabel}
            </span>
            {priceLoading ? (
              <span className="text-xs font-mono animate-pulse th-text-faint">Fetching...</span>
            ) : price > 0 ? (
              <>
                <span className="font-mono font-bold text-sm th-text-primary">
                  ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-mono font-semibold shrink-0 ${priceChangePos ? "text-emerald-400" : "text-red-400"}`}>
                  {priceChangePos ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
                </span>
                <span className="text-[10px] ml-auto th-text-ultrafaint hidden sm:inline">via Binance / CoinGecko</span>
              </>
            ) : (
              <span className="text-xs font-mono th-text-faint">Unavailable</span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl text-xs border bg-amber-400/10 border-amber-400/20 text-amber-400">
              ⚠ {error}
            </div>
          )}

          {/* Gas Cards  3 kolom di semua ukuran, font dikecilkan di mobile */}
          {!isLoaded ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border p-4 h-28 sm:h-32 animate-pulse th-card-solid th-border-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
              <GasCard title="Slow"     value={gasData.low}  subtitle="~5 min"         accent="#10b981"       delay={0}   badge="Save" />
              <GasCard title="Standard" value={gasData.avg}  subtitle="~1 min"         accent={chainCfg.color} delay={80} />
              <GasCard title="Fast"     value={gasData.high} subtitle="~15 sec"        accent="#ef4444"       delay={160} badge="Priority" />
            </div>
          )}

          {/* Chart */}
          <div className="rounded-2xl border p-4 sm:p-5 mb-4 animate-[fadeInUp_0.6s_ease-out_0.2s_both] th-card th-border-card backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest th-text-muted">Gas History</p>
                <p className="text-xs mt-0.5 th-text-faint truncate">
                  Avg Gwei · {tzAbbr} · last {history.length} snapshots
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center justify-center size-8">
                  <svg className="absolute inset-0 -rotate-90" width="32" height="32">
                    <circle cx="16" cy="16" r="8" fill="none" stroke="var(--border-card)" strokeWidth="2" />
                    <circle
                      cx="16" cy="16" r="8" fill="none"
                      stroke={chainCfg.color} strokeWidth="2" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (pct / 100) * circumference}
                      className="transition-[stroke-dashoffset] duration-1000 linear"
                    />
                  </svg>
                  <span className="text-[9px] font-mono font-bold z-10" style={{ color: chainCfg.color }}>
                    {countdown}s
                  </span>
                </div>
                <button
                  onClick={manualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold
                    border th-muted th-border-muted th-text-secondary th-muted-hover
                    transition-[transform] duration-150 hover:scale-105 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  <span className="hidden xs:inline">Refresh</span>
                </button>
              </div>
            </div>
            <GasChart key={chain} data={history} accent={chainCfg.color} avgValue={gasData.avg} />
          </div>

          {/* Bottom grid  stack di mobile, 2 kolom di sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InsightBox gas={gasData} alertThreshold={alertThreshold} chain={chain} />
            <TxEstimator gas={gasData} chain={chain} nativePrice={ethPrice} />
          </div>

          {/* Alert Panel */}
          <AlertPanel
            threshold={alertThreshold}
            onThresholdChange={setAlertThreshold}
            currentGas={gasData.avg}
            chain={chain}
          />

          <GweiExplainer chain={chain} />

          {/* Footer */}
          <footer className="mt-8 pb-4">
            <p className="text-[11px] font-mono text-center th-text-ultrafaint px-2">
              {isLoaded
                ? `Last updated: ${formatLocalDateTime(new Date(gasData.fetchedAt))} ${tzAbbr}`
                : "Initializing..."
              }{" "}
              · Auto-refresh every 1 min
            </p>
            <div className="mt-4 flex justify-center">
              <a
                href="https://rayn.web.id"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border th-border-muted
                  transition-[transform,border-color,background] duration-200
                  hover:scale-[1.04] active:scale-[0.97] th-muted hover:th-muted-hover"
              >
                <span
                  className="size-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${chainCfg.color}, ${chainCfg.color}77)` }}
                >
                  R
                </span>
                <span className="text-[11px] font-medium th-text-faint group-hover:th-text-muted transition-colors duration-200">
                  built by{" "}
                  <span className="font-semibold" style={{ color: chainCfg.color }}>rayn.web.id</span>
                  {" "}↗
                </span>
              </a>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
