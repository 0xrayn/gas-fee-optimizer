"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/types";

interface GweiExplainerProps {
  chain?: Chain;
}

const ITEMS = [
  { icon: "⚡", title: "What is Gwei?", body: "Gwei is the smallest denomination of ETH used for gas pricing. 1 Gwei = 0.000000001 ETH (10⁻⁹ ETH). The name comes from \"Giga-wei\" — Wei being the absolute smallest unit, like \"satoshi\" in Bitcoin." },
  { icon: "⛽", title: "Why do gas fees exist?", body: "Every transaction requires computation from validators. Gas fees compensate them for that work. The more complex the transaction — a simple transfer vs. deploying a smart contract — the more gas it consumes." },
  { icon: "📈", title: "Why do fees fluctuate?", body: "Gas price is determined by supply and demand. When the network is busy (DeFi activity, NFT drops, token launches), fees spike because validators prioritize higher-paying transactions. Early mornings UTC are typically cheapest." },
  { icon: "🎯", title: "Tips to save on gas", body: "Use the 'Slow' setting for non-urgent transactions. Avoid 14:00–20:00 local time when EU and US markets overlap. Monitor GasWatch before transacting to catch the lowest windows." },
];

export default function GweiExplainer({ chain = "ETH" }: GweiExplainerProps) {
  const [open, setOpen] = useState(false);
  const chainCfg = CHAINS[chain];

  return (
    <div className="mt-4 rounded-2xl border overflow-hidden th-border-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left
          th-card th-muted-hover th-text-secondary"
      >
        <div className="flex items-center gap-3">
          <span className="size-7 rounded-lg flex items-center justify-center text-sm" style={{ background: `${chainCfg.color}22` }}>
            📚
          </span>
          <span className="text-sm font-semibold th-text-secondary">
            What is Gwei & why do gas fees matter?
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 th-text-faint ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t th-card th-border-card">
            {ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-4 border th-card-solid th-border-card th-muted-hover"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="size-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${chainCfg.color}18` }}>
                    {item.icon}
                  </span>
                  <p className="text-sm font-semibold th-text-secondary">{item.title}</p>
                </div>
                <p className="text-xs leading-relaxed th-text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
