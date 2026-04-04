"use client";

import { useState, useEffect, useRef } from "react";
import type { Chain } from "@/types";

// CoinGecko IDs — ARB uses "arbitrum" token for price display
const COINGECKO_IDS: Record<Chain, string> = {
  ETH: "ethereum",
  MATIC: "matic-network",
  ARB: "arbitrum",  // ARB governance token
};

interface PriceData {
  price: number;
  priceChange: number;
  isLoading: boolean;
}

// Module-level cache survives chain switches without re-mounting
const priceCache: Partial<Record<Chain, { price: number; priceChange: number; ts: number }>> = {};
const CACHE_TTL_MS = 55_000;

export function usePricePolling(chain: Chain): PriceData {
  const initCache = priceCache[chain];
  const [price, setPrice] = useState(initCache?.price ?? 0);
  const [priceChange, setPriceChange] = useState(initCache?.priceChange ?? 0);
  const [isLoading, setIsLoading] = useState(!initCache);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef = useRef(chain);

  async function fetchPrice(c: Chain) {
    const id = COINGECKO_IDS[c];
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const entry = data[id];
      if (entry) {
        const p = entry.usd ?? 0;
        const pc = entry.usd_24h_change ?? 0;
        priceCache[c] = { price: p, priceChange: pc, ts: Date.now() };
        if (chainRef.current === c) {
          setPrice(p);
          setPriceChange(pc);
          setIsLoading(false);
        }
      } else {
        // ID found but no data — mark unavailable
        if (chainRef.current === c) {
          setPrice(0);
          setPriceChange(0);
          setIsLoading(false);
        }
      }
    } catch {
      if (chainRef.current === c) {
        setPrice(0);
        setPriceChange(0);
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    chainRef.current = chain;

    // Show cached value instantly (zero flicker on chain switch)
    const cached = priceCache[chain];
    const now = Date.now();

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setPrice(cached.price);
      setPriceChange(cached.priceChange);
      setIsLoading(false);
    } else {
      // Show stale cache while fetching fresh data
      if (cached) {
        setPrice(cached.price);
        setPriceChange(cached.priceChange);
        setIsLoading(false);
      } else {
        setPrice(0);
        setPriceChange(0);
        setIsLoading(true);
      }
      fetchPrice(chain);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchPrice(chain), 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  return { price, priceChange, isLoading };
}
