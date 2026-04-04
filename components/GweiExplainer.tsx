"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    icon: "⚡",
    title: "What is Gwei?",
    body: "Gwei is a denomination of ETH — 1 Gwei equals 0.000000001 ETH (10⁻⁹ ETH). The name comes from \"Giga-wei\". Wei is the smallest absolute unit of Ether, similar to how a Satoshi relates to Bitcoin.",
    color: "#627EEA",
  },
  {
    icon: "⛽",
    title: "Why do Gas Fees exist?",
    body: "Every transaction on Ethereum requires computation from validators. Gas fees are your payment for that computation. Simple transfers cost ~21,000 gas units; complex DeFi interactions or contract deployments can exceed 500,000 units.",
    color: "#10b981",
  },
  {
    icon: "📈",
    title: "Why do Gas prices fluctuate?",
    body: "Gas price is driven by supply & demand. When the network is congested — DeFi surges, NFT drops, token launches — validators prioritize higher-fee transactions. Late night UTC hours (00:00–06:00) are typically cheapest globally.",
    color: "#f59e0b",
  },
  {
    icon: "🎯",
    title: "Tips to save on Gas",
    body: "Use the 'Slow' tier for non-urgent transactions. Avoid the 14:00–20:00 local window when EU and US markets overlap. Set a GasWatch alert at your target Gwei threshold and transact only when conditions are favorable.",
    color: "#8247E5",
  },
];

export default function GweiExplainer() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={`mt-4 rounded-2xl border overflow-hidden transition-all duration-300 ${
      theme === "dark" ? "border-white/[0.07]" : "border-black/[0.07]"
    }`}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200 ${
          theme === "dark"
            ? "bg-white/[0.02] hover:bg-white/[0.05] text-white/70"
            : "bg-white/60 hover:bg-white/80 text-black/60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-7 rounded-lg bg-[#627EEA]/15 text-sm">📚</div>
          <div>
            <p className="text-sm font-semibold">What is Gwei & why do Gas Fees matter?</p>
            <p className={`text-[11px] mt-0.5 ${theme === "dark" ? "text-white/30" : "text-black/35"}`}>
              Understanding Ethereum transaction costs
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""} ${
            theme === "dark" ? "text-white/30" : "text-black/30"
          }`}
        />
      </button>

      {/* Content — animated */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-5 pb-5 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 ${
          theme === "dark" ? "border-white/[0.05] bg-white/[0.01]" : "border-black/[0.05] bg-white/40"
        }`}>
          {ITEMS.map((item, i) => (
            <div
              key={item.title}
              className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.01] ${
                theme === "dark"
                  ? "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]"
                  : "bg-white/70 border-black/[0.06] hover:border-black/[0.12]"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Card top accent line */}
              <div
                className="h-[2px] w-10 rounded-full mb-3"
                style={{ background: item.color }}
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{item.icon}</span>
                <p className={`text-sm font-bold ${theme === "dark" ? "text-white/90" : "text-black/90"}`}>
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
  );
}
