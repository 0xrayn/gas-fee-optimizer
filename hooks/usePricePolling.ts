"use client";

import { useState, useEffect, useRef } from "react";
import type { Chain } from "@/types";

const COINGECKO_IDS: Record<Chain, string> = {
  ETH: "ethereum",
  MATIC: "matic-network",
  ARB: "arbitrum",
};

interface PriceData {
  price: number;
  priceChange: number; // 24h %
}

export function usePricePolling(chain: Chain): PriceData {
  const [price, setPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchPrice(c: Chain) {
    const id = COINGECKO_IDS[c];
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const entry = data[id];
      if (entry) {
        setPrice(entry.usd ?? 0);
        setPriceChange(entry.usd_24h_change ?? 0);
      }
    } catch {
      // silently fail, keep last value
    }
  }

  useEffect(() => {
    setPrice(0);
    setPriceChange(0);
    fetchPrice(chain);

    timerRef.current = setInterval(() => fetchPrice(chain), 60_000); // refresh setiap 1 menit
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chain]);

  return { price, priceChange };
}
