"use client";

import { useState, useEffect, useRef } from "react";
import type { Chain } from "@/types";

const COINGECKO_IDS: Record<Chain, string> = {
  ETH: "ethereum",
  MATIC: "matic-network",
  ARB: "arbitrum",
};

const priceCache: Partial<Record<Chain, { price: number; priceChange: number; ts: number }>> = {};

interface PriceData {
  price: number;
  priceChange: number;
}

export function usePricePolling(chain: Chain): PriceData {
  const cached = priceCache[chain];
  const [price, setPrice] = useState(cached?.price ?? 0);
  const [priceChange, setPriceChange] = useState(cached?.priceChange ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef = useRef(chain);

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
      if (entry && chainRef.current === c) {
        const p = entry.usd ?? 0;
        const pc = entry.usd_24h_change ?? 0;
        priceCache[c] = { price: p, priceChange: pc, ts: Date.now() };
        setPrice(p);
        setPriceChange(pc);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    chainRef.current = chain;

    const hit = priceCache[chain];
    if (hit) {
      setPrice(hit.price);
      setPriceChange(hit.priceChange);
    } else {
      setPrice(0);
      setPriceChange(0);
    }
    const shouldFetch = !hit || Date.now() - hit.ts > 60_000;
    let fetchTimer: ReturnType<typeof setTimeout> | null = null;
    if (shouldFetch) {
      fetchTimer = setTimeout(() => fetchPrice(chain), 50);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchPrice(chain), 60_000);

    return () => {
      if (fetchTimer) clearTimeout(fetchTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  return { price, priceChange };
}
