import { NextRequest, NextResponse } from "next/server";
import { getGasData } from "@/lib/getGas";
import type { Chain } from "@/types";

export const runtime = "edge";
// FIX: Naikkan revalidate ke 30 detik untuk kurangi tekanan rate limit
// pada free tier Etherscan/PolygonScan (5 req/detik, 100k req/hari).
// Client-side polling tetap 60 detik, jadi edge cache selalu fresh.
export const revalidate = 30;

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  const data = await getGasData(chain);

  return NextResponse.json(data, {
    headers: {
      // stale-while-revalidate: sajikan cache lama sambil fetch baru di background
      // Ini mencegah user melihat loading saat revalidate terjadi
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
