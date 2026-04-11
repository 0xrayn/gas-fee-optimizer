import type { Chain, GasData } from "@/types";

const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH:   { base: 18,   spread: 12    },
  MATIC: { base: 150,  spread: 60    },
  ARB:   { base: 0.02, spread: 0.015 },
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low  = Math.max(0.001, parseFloat((cfg.base + noise()).toFixed(4)));
  const avg  = parseFloat((low + cfg.spread * 0.35 + Math.random() * cfg.spread * 0.2).toFixed(4));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * cfg.spread * 0.15).toFixed(4));
  return { low, avg, high, chain, fetchedAt: new Date() };
}

// Timeout helper kompatibel Edge Runtime Vercel
function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ── Etherscan V2 API (ETH + MATIC) ───────────────────────────────────────
// V2 pakai satu base URL dengan parameter chainid, satu API key untuk semua chain.
// Docs: https://docs.etherscan.io/v2-migration
const SCAN_V2_BASE = "https://api.etherscan.io/v2/api";
const CHAIN_ID: Partial<Record<Chain, number>> = {
  ETH:   1,
  MATIC: 137,
};

async function fetchScanGas(chain: Chain): Promise<GasData | null> {
  const chainId = CHAIN_ID[chain];
  if (!chainId) return null;

  // V2: cukup satu key (ETHERSCAN_API_KEY) untuk semua chain
  const apiKey = process.env.ETHERSCAN_API_KEY ?? "";
  if (!apiKey || apiKey === "YourApiKeyToken") return null;

  try {
    const url = `${SCAN_V2_BASE}?chainid=${chainId}&module=gastracker&action=gasoracle&apikey=${apiKey}`;
    const res  = await fetchWithTimeout(url, 5000);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    if (json.status !== "1") throw new Error(json.message ?? "NOTOK");

    const r = json.result;
    const baseFee = r.suggestBaseFee ? parseFloat(r.suggestBaseFee) : undefined;

    // Sort low/avg/high — Polygon kadang return SafeGasPrice > FastGasPrice
    const [low, avg, high] = [
      parseFloat(r.SafeGasPrice),
      parseFloat(r.ProposeGasPrice),
      parseFloat(r.FastGasPrice),
    ].sort((a, b) => a - b);

    // Validasi: kalau semua 0 atau NaN, API return garbage
    if (!avg || isNaN(avg) || avg <= 0) throw new Error("Invalid gas data");

    if (low === high) {
      console.info(`[GasWatch] ${chain}: flat gas (${avg} Gwei) — network very quiet`);
    }

    return { low, avg, high, baseFee, chain, fetchedAt: new Date() };
  } catch (err) {
    console.warn(`[GasWatch] Scan API error for ${chain}:`, (err as Error).message);
    return null;
  }
}

// ── Arbitrum: pakai JSON-RPC langsung ─────────────────────────────────────
// Arbiscan tidak support gasoracle endpoint — Arbitrum One punya public RPC
// yang bisa di-hit langsung tanpa API key untuk eth_gasPrice.
const ARB_RPC = "https://arb1.arbitrum.io/rpc";

async function fetchArbGas(): Promise<GasData | null> {
  try {
    const res = await fetchWithTimeout(ARB_RPC, 5000, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    if (!json.result) throw new Error("No result");

    // eth_gasPrice returns hex wei — convert ke Gwei
    const wei  = parseInt(json.result, 16);
    const gwei = parseFloat((wei / 1e9).toFixed(4));

    if (!gwei || isNaN(gwei) || gwei <= 0) throw new Error("Invalid gas price");

    // Arbitrum tidak punya slow/fast tier seperti L1 — gunakan spread kecil
    const low  = parseFloat((gwei * 0.9).toFixed(4));
    const high = parseFloat((gwei * 1.1).toFixed(4));

    return { low, avg: gwei, high, chain: "ARB", fetchedAt: new Date() };
  } catch (err) {
    console.warn("[GasWatch] ARB RPC error:", (err as Error).message);
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────
export async function getGasData(chain: Chain = "ETH"): Promise<GasData> {
  let data: GasData | null = null;

  if (chain === "ARB") {
    data = await fetchArbGas();
  } else {
    data = await fetchScanGas(chain);
  }

  if (!data) {
    console.warn(`[GasWatch] All sources failed for ${chain}, using simulation`);
    return simulateGas(chain);
  }

  return data;
}
