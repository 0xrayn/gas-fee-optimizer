import { NextRequest, NextResponse } from "next/server";
import type { Chain } from "@/types";

// FIX: Fetch harga dari server (API route), bukan langsung dari browser.
// Ini menghindari CORS block dan rate limit CoinGecko di sisi client.
const COINGECKO_IDS: Record<Chain, string> = {
  ETH:  "ethereum",
  MATIC: "matic-network",
  ARB:  "ethereum", // Gas Arbitrum dibayar pakai ETH
};

export const runtime = "edge";
// Cache 55 detik di edge — CoinGecko free tier rate limit 30 req/menit
export const revalidate = 55;

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  const id = COINGECKO_IDS[chain];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { "Accept": "application/json" },
      }
    );

    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const data = await res.json();
    const entry = data[id];

    if (!entry) {
      return NextResponse.json({ price: 0, priceChange: 0, chain }, {
        headers: { "Cache-Control": "s-maxage=30" },
      });
    }

    return NextResponse.json(
      {
        price: entry.usd ?? 0,
        priceChange: entry.usd_24h_change ?? 0,
        chain,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=55, stale-while-revalidate=10",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.warn("[GasWatch] Price fetch error:", err);
    return NextResponse.json({ price: 0, priceChange: 0, chain }, {
      status: 200, // Jangan return 5xx — client tetap bisa handle gracefully
      headers: { "Cache-Control": "s-maxage=10" },
    });
  }
}
