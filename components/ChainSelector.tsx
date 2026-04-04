"use client";

import { CHAINS, CHAIN_ORDER } from "@/lib/chains";
import type { Chain } from "@/types";

interface ChainSelectorProps {
  active: Chain;
  onChange: (c: Chain) => void;
}

export default function ChainSelector({ active, onChange }: ChainSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 p-1 rounded-xl border th-muted th-border-card">
      {CHAIN_ORDER.map((key) => {
        const chain = CHAINS[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key as Chain)}
            className="relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-[transform,color] duration-200 ease-out
              hover:scale-105 active:scale-95 th-text-muted hover:th-text-secondary"
            style={isActive ? { color: chain.color } : {}}
          >
            {isActive && (
              <span
                className="absolute inset-0 rounded-lg"
                style={{ background: `${chain.color}25`, border: `1px solid ${chain.color}40` }}
              />
            )}
            <span className="relative">{chain.label}</span>
          </button>
        );
      })}
    </div>
  );
}
