import { NextRequest, NextResponse } from "next/server";
import type { Chain } from "@/types";

export const runtime = "edge";

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

// Binance symbols  ARB kadang delisted/unavailable di beberapa region
const BINANCE_SYMBOLS: Record<Chain, string> = {
  ETH:   "ETHUSDT",
  MATIC: "MATICUSDT",
  ARB:   "ARBUSDT",
};

// CoinGecko IDs  primary
const COINGECKO_IDS: Record<Chain, string> = {
  ETH:   "ethereum",
  MATIC: "matic-network",
  ARB:   "arbitrum",
};

// CoinGecko fallback IDs  dipakai kalau primary 404/empty
const COINGECKO_FALLBACK: Partial<Record<Chain, string>> = {
  MATIC: "polygon-ecosystem-token",
  ARB:   "arbitrum-2",
};

// CryptoCompare symbols  fallback ke-4, gratis tanpa API key
const CRYPTOCOMPARE_SYMBOLS: Record<Chain, string> = {
  ETH:   "ETH",
  MATIC: "MATIC",
  ARB:   "ARB",
};

// ── Binance ────────────────────────────────────────────────────────────────
async function fetchBinance(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const [tickerRes, statsRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        signal: AbortSignal.timeout(4000),
      }),
    ]);
    if (!tickerRes.ok || !statsRes.ok) return null;
    const [ticker, stats] = await Promise.all([tickerRes.json(), statsRes.json()]);
    const price  = parseFloat(ticker.price);
    const change = parseFloat(stats.priceChangePercent);
    if (!price || isNaN(price) || price <= 0) return null;
    return { price, change: isNaN(change) ? 0 : change };
  } catch {
    return null;
  }
}

// ── CoinGecko ─────────────────────────────────────────────────────────────
async function fetchCoinGecko(id: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[id];
    if (!entry || entry.usd === undefined || entry.usd === null) return null;
    const price = Number(entry.usd);
    if (isNaN(price) || price <= 0) return null;
    return { price, change: entry.usd_24h_change ?? 0 };
  } catch {
    return null;
  }
}

// ── CryptoCompare  fallback ke-4, gratis tanpa API key ───────────────────
async function fetchCryptoCompare(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.RAW?.[symbol]?.USD;
    if (!entry) return null;
    const price = Number(entry.PRICE);
    if (isNaN(price) || price <= 0) return null;
    return { price, change: entry.CHANGEPCT24HOUR ?? 0 };
  } catch {
    return null;
  }
}

// ── Fetch dengan multi-fallback chain ─────────────────────────────────────
async function fetchChainPrice(chain: Chain): Promise<{ price: number; change: number } | null> {
  // 1. Coba Binance
  const binance = await fetchBinance(BINANCE_SYMBOLS[chain]);
  if (binance) return binance;

  // 2. Coba CoinGecko primary
  const cg1 = await fetchCoinGecko(COINGECKO_IDS[chain]);
  if (cg1) return cg1;

  // 3. Coba CoinGecko fallback (kalau ada)
  const fallbackId = COINGECKO_FALLBACK[chain];
  if (fallbackId) {
    const cg2 = await fetchCoinGecko(fallbackId);
    if (cg2) return cg2;
  }

  // 4. CryptoCompare sebagai last resort
  const cc = await fetchCryptoCompare(CRYPTOCOMPARE_SYMBOLS[chain]);
  if (cc) return cc;

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  const isArb = chain === "ARB";

  // Fetch harga chain + ETH (untuk ARB fee estimator) secara paralel
  const [chainResult, ethResult] = await Promise.all([
    fetchChainPrice(chain),
    isArb ? fetchChainPrice("ETH") : Promise.resolve(null),
  ]);

  if (!chainResult) {
    return NextResponse.json(
      { price: 0, priceChange: 0, ethPrice: 0, chain, error: "price_unavailable" },
      { status: 200, headers: { "Cache-Control": "s-maxage=10" } }
    );
  }

  const ethPrice = isArb
    ? (ethResult?.price ?? 0)
    : chainResult.price;

  return NextResponse.json(
    {
      price:       chainResult.price,
      priceChange: chainResult.change,
      ethPrice,
      chain,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=15",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
