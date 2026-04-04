import type { Chain, GasData } from "@/types";

const CHAIN_API: Record<Chain, { base: string; key: string }> = {
  ETH: {
    base: "https://api.etherscan.io/api",
    key: process.env.ETHERSCAN_API_KEY ?? "YourApiKeyToken",
  },
  MATIC: {
    base: "https://api.polygonscan.com/api",
    key: process.env.POLYGONSCAN_API_KEY ?? "YourApiKeyToken",
  },
  ARB: {
    base: "https://api.arbiscan.io/api",
    key: process.env.ARBISCAN_API_KEY ?? "YourApiKeyToken",
  },
};

// Fallback simulated data when API keys are not set
const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH:  { base: 18,  spread: 12 },
  MATIC: { base: 35, spread: 25 },
  ARB:  { base: 0.08, spread: 0.12 },
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low  = Math.max(0.01, parseFloat((cfg.base + noise()).toFixed(3)));
  const avg  = parseFloat((low + cfg.spread * 0.35 + Math.random() * 3).toFixed(3));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * 2).toFixed(3));
  return { low, avg, high, chain, fetchedAt: new Date() };
}

export async function getGasData(chain: Chain = "ETH"): Promise<GasData> {
  const cfg = CHAIN_API[chain];

  // If no real API key, use simulation
  if (!cfg.key || cfg.key === "YourApiKeyToken") {
    return simulateGas(chain);
  }

  try {
    const url = `${cfg.base}?module=gastracker&action=gasoracle&apikey=${cfg.key}`;
    const res = await fetch(url, { next: { revalidate: 10 }, signal: AbortSignal.timeout(5000) }); // ISR every 10s
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    if (json.status !== "1") throw new Error(json.message);

    const r = json.result;
    const low  = parseFloat(r.SafeGasPrice);
    const avg  = parseFloat(r.ProposeGasPrice);
    const high = parseFloat(r.FastGasPrice);
    const baseFee = r.suggestBaseFee ? parseFloat(r.suggestBaseFee) : undefined;

    return { low, avg, high, baseFee, chain, fetchedAt: new Date() };
  } catch (err) {
    console.warn(`[GasWatch] API error for ${chain}, falling back to simulation:`, err);
    return simulateGas(chain);
  }
}
