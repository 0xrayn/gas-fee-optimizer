import { NextRequest, NextResponse } from "next/server";
import { getGasData } from "@/lib/getGas";
import type { Chain } from "@/types";

export const runtime = "edge";
export const revalidate = 10;

const VALID_CHAINS: Chain[] = ["ETH", "MATIC", "ARB"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get("chain")?.toUpperCase() as Chain;
  const chain: Chain = VALID_CHAINS.includes(chainParam) ? chainParam : "ETH";

  const data = await getGasData(chain);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=10, stale-while-revalidate=5",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
