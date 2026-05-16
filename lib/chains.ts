import type { ChainConfig } from "@/types";

export const CHAINS: Record<string, ChainConfig> = {
  ETH: {
    id: "ETH",
    label: "Ethereum",
    color: "#627EEA",
    colorClass: "text-[#627EEA]",
    ringClass: "ring-[#627EEA]/30",
    bgAccent: "bg-[#627EEA]/10",
    apiSymbol: "ETH",
    // apiBase dihapus — gas fetching pakai Etherscan V2 di lib/getGas.ts
    // yang punya base URL sendiri (SCAN_V2_BASE). Field ini tidak terpakai.
    explorerName: "Etherscan",
    nativeCurrency: "ETH",
  },
  MATIC: {
    id: "MATIC",
    label: "Polygon",
    color: "#8247E5",
    colorClass: "text-[#8247E5]",
    ringClass: "ring-[#8247E5]/30",
    bgAccent: "bg-[#8247E5]/10",
    apiSymbol: "MATIC",
    explorerName: "PolygonScan",
    nativeCurrency: "MATIC",
  },
  ARB: {
    id: "ARB",
    label: "Arbitrum",
    color: "#28A0F0",
    colorClass: "text-[#28A0F0]",
    ringClass: "ring-[#28A0F0]/30",
    bgAccent: "bg-[#28A0F0]/10",
    apiSymbol: "ARB",
    explorerName: "Arbiscan",
    // ARB adalah governance token Arbitrum, bukan gas token.
    // Gas di Arbitrum One tetap dibayar menggunakan ETH (seperti semua L2 Ethereum).
    // nativeCurrency "ARB" di sini hanya untuk label di price ticker & TxEstimator.
    // Kalkulasi fee USD di TxEstimator menggunakan ethPrice (prop terpisah).
    nativeCurrency: "ARB",
  },
};

export const CHAIN_ORDER = ["ETH", "MATIC", "ARB"] as const;
