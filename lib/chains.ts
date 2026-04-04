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
    apiBase: "https://api.etherscan.io/api",
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
    apiBase: "https://api.polygonscan.com/api",
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
    apiBase: "https://api.arbiscan.io/api",
    explorerName: "Arbiscan",
    nativeCurrency: "ETH",
  },
};

export const CHAIN_ORDER = ["ETH", "MATIC", "ARB"] as const;
