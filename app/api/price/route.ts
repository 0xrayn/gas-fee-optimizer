import { NextRequest, NextResponse } from "next/server";
import type { Chain } from "@/types";

const COINGECKO_IDS: Record<Chain, string> = {
  ETH:   "ethereum",
  MATIC: "matic-network",
  ARB:   "arbitrum",
};

// Backup IDs kalau primary gagal
const COINGECKO_FALLBACK_IDS: Partial<Record<Chain, string>> = {
  MATIC: "polygon-ecosystem-token", // POL / MATIC fallback
};

export const runtime = "edge";

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

async function fetchCoinGecko(ids: string): Promise<Record<string, { usd: number; usd_24h_change: number }> | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        signal: AbortSignal.timeout(6000),
        headers: { "Accept": "application/json" },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  const primaryId = COINGECKO_IDS[chain];
  // ARB selalu butuh ETH price untuk fee estimator (gas ARB dibayar ETH)
  const needsEth = chain === "ARB";
  const idsToFetch = needsEth ? `${primaryId},ethereum` : primaryId;

  // Coba fetch primary
  let data = await fetchCoinGecko(idsToFetch);

  let entry = data?.[primaryId];

  // Kalau primary gagal dan ada fallback ID, coba fallback
  if ((!entry || entry.usd === undefined) && COINGECKO_FALLBACK_IDS[chain]) {
    const fallbackId = COINGECKO_FALLBACK_IDS[chain]!;
    const fallbackData = await fetchCoinGecko(
      needsEth ? `${fallbackId},ethereum` : fallbackId
    );
    if (fallbackData?.[fallbackId]?.usd) {
      data = { ...fallbackData, [primaryId]: fallbackData[fallbackId] };
      entry = data[primaryId];
    }
  }

  if (!entry || entry.usd === undefined) {
    return NextResponse.json(
      { price: 0, priceChange: 0, ethPrice: 0, chain },
      { status: 200, headers: { "Cache-Control": "s-maxage=10" } }
    );
  }

  const ethEntry = data?.["ethereum"];
  const ethPrice = ethEntry?.usd ?? 0;

  return NextResponse.json(
    {
      price: entry.usd,
      priceChange: entry.usd_24h_change ?? 0,
      // ethPrice: dipakai TxEstimator untuk chain ARB (gas dibayar ETH)
      ethPrice: chain === "ARB" ? ethPrice : entry.usd,
      chain,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=55, stale-while-revalidate=10",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
