"use client";

import { useTheme } from "@/components/ThemeProvider";
import { CHAINS, CHAIN_ORDER } from "@/lib/chains";
import type { Chain } from "@/types";

interface ChainSelectorProps {
  active: Chain;
  onChange: (c: Chain) => void;
}

export default function ChainSelector({ active, onChange }: ChainSelectorProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl border transition-colors duration-300 ${
        theme === "dark"
          ? "bg-white/[0.04] border-white/[0.08]"
          : "bg-black/[0.04] border-black/[0.08]"
      }`}
    >
      {CHAIN_ORDER.map((key) => {
        const chain = CHAINS[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key as Chain)}
            className={`
              relative px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-all duration-200 ease-out
              hover:scale-105 active:scale-95
              ${isActive ? "text-white" : theme === "dark" ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"}
            `}
          >
            {isActive && (
              <span
                className="absolute inset-0 rounded-lg"
                style={{ background: `${chain.color}25`, border: `1px solid ${chain.color}40` }}
              />
            )}
            <span className="relative" style={isActive ? { color: chain.color } : {}}>
              {chain.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
