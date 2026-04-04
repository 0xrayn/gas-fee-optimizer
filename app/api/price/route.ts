import { NextRequest, NextResponse } from "next/server";
import type { Chain } from "@/types";

export const runtime = "edge";

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

// Symbol Binance untuk setiap chain
const BINANCE_SYMBOLS: Record<Chain, string> = {
  ETH:   "ETHUSDT",
  MATIC: "MATICUSDT",
  ARB:   "ARBUSDT",
};

// CoinGecko ID sebagai fallback
const COINGECKO_IDS: Record<Chain, string> = {
  ETH:   "ethereum",
  MATIC: "matic-network",
  ARB:   "arbitrum",
};
const COINGECKO_FALLBACK: Partial<Record<Chain, string>> = {
  MATIC: "polygon-ecosystem-token",
};

// ── Binance (no API key, rate limit sangat longgar) ────────────────────────
async function fetchBinance(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const [tickerRes, statsRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    if (!tickerRes.ok || !statsRes.ok) return null;
    const [ticker, stats] = await Promise.all([tickerRes.json(), statsRes.json()]);
    const price  = parseFloat(ticker.price);
    const change = parseFloat(stats.priceChangePercent);
    if (!price || isNaN(price)) return null;
    return { price, change };
  } catch {
    return null;
  }
}

// ── CoinGecko (fallback, free tier bisa rate-limit) ───────────────────────
async function fetchCoinGecko(id: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[id];
    if (!entry?.usd) return null;
    return { price: entry.usd, change: entry.usd_24h_change ?? 0 };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  // Untuk ARB kita butuh harga ETH juga (fee estimator ARB pakai ETH)
  // Fetch keduanya sekaligus supaya efisien
  const isArb = chain === "ARB";

  const [chainResult, ethResult] = await Promise.all([
    // 1. Coba Binance dulu (reliable, no rate limit)
    fetchBinance(BINANCE_SYMBOLS[chain]).then(
      (r) => r ?? fetchCoinGecko(COINGECKO_IDS[chain]).then(
        (r2) => r2 ?? (COINGECKO_FALLBACK[chain]
          ? fetchCoinGecko(COINGECKO_FALLBACK[chain]!)
          : null)
      )
    ),
    // 2. Kalau ARB, ambil ETH price juga (paralel)
    isArb
      ? fetchBinance("ETHUSDT").then((r) => r ?? fetchCoinGecko("ethereum"))
      : Promise.resolve(null),
  ]);

  if (!chainResult) {
    return NextResponse.json(
      { price: 0, priceChange: 0, ethPrice: 0, chain },
      { status: 200, headers: { "Cache-Control": "s-maxage=15" } }
    );
  }

  const ethPrice = isArb
    ? (ethResult?.price ?? 0)
    : chainResult.price; // untuk non-ARB, ethPrice = price chain itu sendiri (ETH) atau tidak dipakai

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
