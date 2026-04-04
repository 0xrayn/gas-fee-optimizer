import type { Chain, GasData } from "@/types";

const API_KEY = process.env.ETHERSCAN_API_KEY ?? "";

const CHAIN_ID: Record<Chain, number> = {
  ETH: 1,
  MATIC: 137,
  ARB: 42161,
};

const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH:   { base: 18,   spread: 12   },
  MATIC: { base: 80,   spread: 40   },
  ARB:   { base: 0.08, spread: 0.06 },
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low  = Math.max(0.01, parseFloat((cfg.base + noise()).toFixed(4)));
  const avg  = parseFloat((low + cfg.spread * 0.35 + Math.random() * cfg.spread * 0.2).toFixed(4));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * cfg.spread * 0.15).toFixed(4));
  return { low, avg, high, chain, fetchedAt: new Date() };
}

export async function getGasData(chain: Chain = "ETH"): Promise<GasData> {
  if (!API_KEY || API_KEY === "YourApiKeyToken") {
    return simulateGas(chain);
  }

  try {
    const chainId = CHAIN_ID[chain];
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=gastracker&action=gasoracle&apikey=${API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    if (json.status !== "1") throw new Error(json.message ?? "API error");

    const r = json.result;
    const low     = parseFloat(r.SafeGasPrice);
    const avg     = parseFloat(r.ProposeGasPrice);
    const high    = parseFloat(r.FastGasPrice);
    const baseFee = r.suggestBaseFee ? parseFloat(r.suggestBaseFee) : undefined;

    return { low, avg, high, baseFee, chain, fetchedAt: new Date() };
  } catch (err) {
    console.warn(`[GasWatch] API error for ${chain}, falling back to simulation:`, err);
    return simulateGas(chain);
  }
}
