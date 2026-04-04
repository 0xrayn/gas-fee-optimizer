"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ChevronDown } from "lucide-react";

export default function GweiExplainer() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const items = [
    {
      icon: "⚡",
      title: "Apa itu Gwei?",
      body: "Gwei adalah satuan terkecil dari ETH (Ether), setara dengan 0.000000001 ETH (10⁻⁹ ETH). Nama \"Gwei\" berasal dari \"Giga-wei\" — Wei adalah unit terkecil absolut di Ethereum, seperti \"satoshi\" di Bitcoin.",
    },
    {
      icon: "⛽",
      title: "Mengapa Gas Fee penting?",
      body: "Setiap transaksi di blockchain Ethereum memerlukan komputasi dari para validator. Gas fee adalah kompensasi yang kamu bayarkan atas komputasi tersebut. Semakin kompleks transaksi (transfer biasa vs deploy smart contract), semakin banyak gas yang dibutuhkan.",
    },
    {
      icon: "📈",
      title: "Mengapa Gas naik turun?",
      body: "Gas price ditentukan oleh supply & demand. Saat jaringan ramai (banyak pengguna DeFi, NFT drop, token launch), harga gas naik karena validator memprioritaskan transaksi dengan fee lebih tinggi. Dini hari (UTC) biasanya paling murah.",
    },
    {
      icon: "🎯",
      title: "Tips hemat gas",
      body: "Gunakan setting 'Slow' untuk transaksi non-urgent. Hindari jam 14.00–20.00 waktu lokal saat pasar EU dan US overlap. Pantau GasWatch ini sebelum bertransaksi untuk mendapatkan momen terbaik.",
    },
  ];

  return (
    <div className={`mt-4 rounded-2xl border transition-colors duration-300 overflow-hidden ${
      "dark" === "dark" ? "" : ""
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200 ${
          theme === "dark"
            ? "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] text-white/70"
            : "bg-white/60 border-black/[0.07] hover:bg-white/80 text-black/60"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">📚</span>
          <span className="text-sm font-semibold">Apa itu Gwei & mengapa Gas Fee penting?</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t ${
          theme === "dark"
            ? "bg-white/[0.02] border-white/[0.05]"
            : "bg-white/50 border-black/[0.05]"
        }`}>
          {items.map((item) => (
            <div
              key={item.title}
              className={`rounded-xl p-4 ${
                theme === "dark" ? "bg-white/[0.03]" : "bg-white/60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{item.icon}</span>
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
      )}
    </div>
  );
}
