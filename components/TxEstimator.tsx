"use client";

import { useTheme } from "@/components/ThemeProvider";
import { CHAINS } from "@/lib/chains";
import type { GasData, Chain } from "@/types";

interface TxEstimatorProps {
  gas: GasData;
  chain: Chain;
  nativePrice?: number;
}

// TX types yang berbeda per chain
const TX_TYPES_BY_CHAIN: Record<Chain, { name: string; gasUnits: number; icon: string }[]> = {
  ETH: [
    { name: "ETH Transfer", gasUnits: 21_000, icon: "⟠" },
    { name: "ERC-20 Transfer", gasUnits: 65_000, icon: "🪙" },
    { name: "Uniswap Swap", gasUnits: 150_000, icon: "🔄" },
    { name: "NFT Mint", gasUnits: 200_000, icon: "🎨" },
    { name: "Contract Deploy", gasUnits: 600_000, icon: "📦" },
  ],
  MATIC: [
    { name: "MATIC Transfer", gasUnits: 21_000, icon: "🟣" },
    { name: "ERC-20 Transfer", gasUnits: 65_000, icon: "🪙" },
    { name: "QuickSwap / UniV3", gasUnits: 130_000, icon: "🔄" },
    { name: "NFT Mint", gasUnits: 185_000, icon: "🎨" },
    { name: "Contract Deploy", gasUnits: 550_000, icon: "📦" },
  ],
  ARB: [
    { name: "ETH Transfer", gasUnits: 21_000, icon: "🔵" },
    { name: "ERC-20 Transfer", gasUnits: 55_000, icon: "🪙" },
    { name: "Uniswap V3 Swap", gasUnits: 120_000, icon: "🔄" },
    { name: "NFT Mint", gasUnits: 160_000, icon: "🎨" },
    { name: "Contract Deploy", gasUnits: 500_000, icon: "📦" },
  ],
};

function calcFeeNative(gwei: number, gasUnits: number): number {
  return (gwei * gasUnits) / 1e9;
}

function feeLevel(gwei: number): { cls: string; label: string } {
  if (gwei < 20) return { cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Best" };
  if (gwei < 50) return { cls: "text-amber-400 bg-amber-400/10 border-amber-400/20", label: "OK" };
  return { cls: "text-red-400 bg-red-400/10 border-red-400/20", label: "High" };
}

export default function TxEstimator({ gas, chain, nativePrice = 0 }: TxEstimatorProps) {
  const { theme } = useTheme();
  const level = feeLevel(gas.avg);
  const chainCfg = CHAINS[chain];
  const currency = chainCfg.nativeCurrency;
  const txTypes = TX_TYPES_BY_CHAIN[chain];

  return (
    <div className={`rounded-2xl border p-5 transition-colors duration-300 ${
      theme === "dark" ? "bg-white/[0.02] border-white/[0.07]" : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
          Fee Estimator
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${level.cls}`}>
          {level.label} Conditions
        </span>
      </div>

      <div className="space-y-2">
        {txTypes.map((tx) => {
          const feeNative = calcFeeNative(gas.avg, tx.gasUnits);
          const feeUsd = nativePrice > 0 ? feeNative * nativePrice : null;
          return (
            <div
              key={tx.name}
              className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors duration-150 ${
                theme === "dark" ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-black/[0.03] hover:bg-black/[0.05]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{tx.icon}</span>
                <span className={`text-sm font-medium ${theme === "dark" ? "text-white/80" : "text-black/80"}`}>
                  {tx.name}
                </span>
              </div>
              <div className="text-right">
                {feeUsd !== null ? (
                  <p className={`text-xs font-mono font-bold ${theme === "dark" ? "text-white/90" : "text-black/90"}`}>
                    ${feeUsd < 0.01 ? feeUsd.toFixed(4) : feeUsd.toFixed(2)}
                  </p>
                ) : (
                  <p className={`text-xs font-mono ${theme === "dark" ? "text-white/30" : "text-black/30"}`}>—</p>
                )}
                <p className={`text-[10px] font-mono ${theme === "dark" ? "text-white/30" : "text-black/35"}`}>
                  {feeNative < 0.0001 ? feeNative.toFixed(6) : feeNative.toFixed(5)} {currency}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
