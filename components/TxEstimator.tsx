"use client";

import { useState } from "react";
import { CHAINS } from "@/lib/chains";
import type { GasData, Chain } from "@/types";

interface TxEstimatorProps {
  gas: GasData;
  chain: Chain;
  nativePrice?: number;
}

const TX_TYPES_BY_CHAIN: Record<Chain, { name: string; gasUnits: number; icon: string }[]> = {
  ETH: [
    { name: "ETH Transfer",    gasUnits: 21_000,  icon: "⟠" },
    { name: "ERC-20 Transfer", gasUnits: 65_000,  icon: "🪙" },
    { name: "Uniswap Swap",    gasUnits: 150_000, icon: "🔄" },
    { name: "NFT Mint",        gasUnits: 200_000, icon: "🎨" },
    { name: "Contract Deploy", gasUnits: 600_000, icon: "📦" },
  ],
  MATIC: [
    { name: "MATIC Transfer",   gasUnits: 21_000,  icon: "🟣" },
    { name: "ERC-20 Transfer",  gasUnits: 65_000,  icon: "🪙" },
    { name: "QuickSwap / UniV3",gasUnits: 130_000, icon: "🔄" },
    { name: "NFT Mint",         gasUnits: 185_000, icon: "🎨" },
    { name: "Contract Deploy",  gasUnits: 550_000, icon: "📦" },
  ],
  ARB: [
    { name: "ETH Transfer",    gasUnits: 21_000,  icon: "🔵" },
    { name: "ERC-20 Transfer", gasUnits: 55_000,  icon: "🪙" },
    { name: "Uniswap V3 Swap", gasUnits: 120_000, icon: "🔄" },
    { name: "NFT Mint",        gasUnits: 160_000, icon: "🎨" },
    { name: "Contract Deploy", gasUnits: 500_000, icon: "📦" },
  ],
};

type GasMode = "low" | "avg" | "high";

function calcFeeNative(gwei: number, gasUnits: number): number {
  return (gwei * gasUnits) / 1e9;
}

function feeLevel(gwei: number, chain: Chain): { cls: string; label: string } {
  // Threshold berbeda tiap chain
  const thresholds: Record<Chain, [number, number]> = {
    ETH:   [20,  60],
    MATIC: [60,  120],
    ARB:   [0.05, 0.2],
  };
  const [low, high] = thresholds[chain];
  if (gwei <= low)  return { cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Best" };
  if (gwei <= high) return { cls: "text-amber-400 bg-amber-400/10 border-amber-400/20",    label: "OK"   };
  return                   { cls: "text-red-400 bg-red-400/10 border-red-400/20",           label: "High" };
}

const MODE_LABELS: Record<GasMode, string> = { low: "Slow", avg: "Standard", high: "Fast" };

export default function TxEstimator({ gas, chain, nativePrice = 0 }: TxEstimatorProps) {
  const [mode, setMode] = useState<GasMode>("avg");

  const chainCfg  = CHAINS[chain];
  const currency  = chainCfg.nativeCurrency;
  const txTypes   = TX_TYPES_BY_CHAIN[chain];
  const gweiPrice = gas[mode];          // low / avg / high
  const level     = feeLevel(gweiPrice, chain);

  return (
    <div className="rounded-2xl border p-5 th-card th-border-card backdrop-blur-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest th-text-muted">
          Fee Estimator
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${level.cls}`}>
          {level.label} Conditions
        </span>
      </div>

      {/* Mode toggle — Slow / Standard / Fast */}
      <div className="flex gap-1 mb-3 p-1 rounded-xl th-muted">
        {(["low", "avg", "high"] as GasMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
              mode === m
                ? "text-white"
                : "th-text-faint hover:th-text-muted"
            }`}
            style={mode === m ? { background: chainCfg.color } : {}}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Gas price indicator */}
      <p className="text-[11px] th-text-faint mb-3 font-mono">
        @ {gweiPrice > 0
          ? `${gweiPrice.toFixed(gweiPrice < 1 ? 4 : 2)} Gwei`
          : "—"}
        {nativePrice > 0 && gweiPrice > 0 && (
          <span className="ml-1 th-text-ultrafaint">
            · {currency} = ${nativePrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        )}
      </p>

      {/* Tx rows */}
      <div className="space-y-1.5">
        {txTypes.map((tx) => {
          const feeNative = gweiPrice > 0 ? calcFeeNative(gweiPrice, tx.gasUnits) : 0;
          const feeUsd    = nativePrice > 0 && feeNative > 0 ? feeNative * nativePrice : null;
          return (
            <div
              key={tx.name}
              className="flex items-center justify-between py-2 px-3 rounded-xl th-muted th-muted-hover"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{tx.icon}</span>
                <span className="text-sm font-medium th-text-secondary">{tx.name}</span>
              </div>
              <div className="text-right">
                {feeUsd !== null ? (
                  <p className="text-xs font-mono font-bold th-text-primary">
                    ${feeUsd < 0.01 ? feeUsd.toFixed(4) : feeUsd.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs font-mono th-text-faint">—</p>
                )}
                {feeNative > 0 && (
                  <p className="text-[10px] font-mono th-text-faint">
                    {feeNative < 0.0001 ? feeNative.toFixed(6) : feeNative.toFixed(5)} {currency}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
