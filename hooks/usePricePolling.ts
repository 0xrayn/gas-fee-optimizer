"use client";

import { useState, useEffect, useRef } from "react";
import type { Chain } from "@/types";

export const PRICE_DISPLAY_LABEL: Record<Chain, string> = {
  ETH:   "ETH",
  MATIC: "MATIC",
  ARB:   "ARB",
};

interface PriceData {
  price: number;
  priceChange: number;
  isLoading: boolean;
  // Untuk ARB: kita juga butuh harga ETH supaya TxEstimator bisa hitung USD fee dengan benar
  ethPrice: number;
}

const priceCache: Partial<Record<Chain, { price: number; priceChange: number; ethPrice: number; ts: number }>> = {};
const CACHE_TTL_MS = 55_000;

export function usePricePolling(chain: Chain): PriceData {
  const initCache = priceCache[chain];
  const [price, setPrice]           = useState(initCache?.price ?? 0);
  const [priceChange, setPriceChange] = useState(initCache?.priceChange ?? 0);
  const [ethPrice, setEthPrice]     = useState(initCache?.ethPrice ?? 0);
  const [isLoading, setIsLoading]   = useState(!initCache);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef = useRef(chain);

  async function fetchPrice(c: Chain) {
    try {
      const res = await fetch(`/api/price?chain=${c}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (chainRef.current !== c) return;

      priceCache[c] = {
        price: data.price,
        priceChange: data.priceChange,
        ethPrice: data.ethPrice ?? data.price,
        ts: Date.now(),
      };

      setPrice(data.price);
      setPriceChange(data.priceChange);
      setEthPrice(data.ethPrice ?? data.price);
      setIsLoading(false);
    } catch {
      if (chainRef.current === c) {
        setPrice(0);
        setPriceChange(0);
        setEthPrice(0);
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    chainRef.current = chain;

    const cached = priceCache[chain];
    const now    = Date.now();

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setPrice(cached.price);
      setPriceChange(cached.priceChange);
      setEthPrice(cached.ethPrice);
      setIsLoading(false);
    } else {
      if (cached) {
        setPrice(cached.price);
        setPriceChange(cached.priceChange);
        setEthPrice(cached.ethPrice);
        setIsLoading(false);
      } else {
        setPrice(0);
        setPriceChange(0);
        setEthPrice(0);
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

  return { price, priceChange, isLoading, ethPrice };
}
