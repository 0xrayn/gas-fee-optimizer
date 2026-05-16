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
    color: string;         // hex accent color, e.g. "#627EEA"
    colorClass: string;    // tailwind text color class
    ringClass: string;     // tailwind ring color class
    bgAccent: string;      // dark bg variant
    apiSymbol: string;     // symbol for price API (Binance/CoinGecko)
    // apiBase dihapus — gas fetching pakai Etherscan V2 di lib/getGas.ts
    // dengan base URL hardcoded sendiri. Field ini dead code.
    explorerName: string;
    nativeCurrency: string; // token untuk label UI. Catatan: ARB pakai "ARB"
                            // tapi fee gas-nya tetap dibayar ETH (L2 di atas Ethereum).
}
