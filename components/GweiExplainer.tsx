"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ChevronDown } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/types";

interface GweiExplainerProps {
  chain?: Chain;
}

export default function GweiExplainer({ chain = "ETH" }: GweiExplainerProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const chainCfg = CHAINS[chain];

  const items = [
    {
      icon: "⚡",
      title: "What is Gwei?",
      body: "Gwei is the smallest denomination of ETH used for gas pricing. 1 Gwei = 0.000000001 ETH (10⁻⁹ ETH). The name comes from \"Giga-wei\" — Wei being the absolute smallest unit, like \"satoshi\" in Bitcoin.",
    },
    {
      icon: "⛽",
      title: "Why do gas fees exist?",
      body: "Every transaction requires computation from validators. Gas fees compensate them for that work. The more complex the transaction — a simple transfer vs. deploying a smart contract — the more gas it consumes.",
    },
    {
      icon: "📈",
      title: "Why do fees fluctuate?",
      body: "Gas price is determined by supply and demand. When the network is busy (DeFi activity, NFT drops, token launches), fees spike because validators prioritize higher-paying transactions. Early mornings UTC are typically cheapest.",
    },
    {
      icon: "🎯",
      title: "Tips to save on gas",
      body: "Use the 'Slow' setting for non-urgent transactions. Avoid 14:00–20:00 local time when EU and US markets overlap. Monitor GasWatch before transacting to catch the lowest windows.",
    },
  ];

  return (
    <div className={`mt-4 rounded-2xl border overflow-hidden transition-colors duration-300 ${
      theme === "dark" ? "border-white/[0.07]" : "border-black/[0.07]"
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200 ${
          theme === "dark"
            ? "bg-white/[0.02] hover:bg-white/[0.04] text-white/70"
            : "bg-white/60 hover:bg-white/80 text-black/60"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className="size-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: `${chainCfg.color}22` }}
          >
            📚
          </span>
          <span className={`text-sm font-semibold ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            What is Gwei & why do gas fees matter?
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""} ${
            theme === "dark" ? "text-white/30" : "text-black/30"
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t ${
            theme === "dark"
              ? "bg-white/[0.02] border-white/[0.05]"
              : "bg-white/50 border-black/[0.05]"
          }`}>
            {items.map((item) => (
              <div
                key={item.title}
                className={`rounded-xl p-4 border transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]"
                    : "bg-white/70 border-black/[0.05] hover:bg-white/90"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className="size-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${chainCfg.color}18` }}
                  >
                    {item.icon}
                  </span>
                  <p className={`text-sm font-semibold ${theme === "dark" ? "text-white/80" : "text-black/80"}`}>
                    {item.title}
                  </p>
                </div>
                <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-white/50" : "text-black/55"}`}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
