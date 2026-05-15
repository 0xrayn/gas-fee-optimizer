export type Chain = "ETH" | "MATIC" | "ARB";

export interface GasData {
    low: number;
    avg: number;
    high: number;
    baseFee?: number;
    chain: Chain;
    fetchedAt: Date;
}

export interface GasHistory {
    time: string; // For Local user timezone :)
    timeRaw: number; // Unix ms
    gas: number;
    chain: Chain;
}

export interface ChainConfig {
    id: Chain;
    label: string;
    color: string; // hex accent like #4555...
    colorClass: string; // tailwind text color
    ringClass: string; // tailwind ring color
    bgAccent: string; // dark bg variant.
    apiSymbol: string; // for etherscan API
    apiBase: string;
    explorerName: string;
    nativeCurrency: string;
}
