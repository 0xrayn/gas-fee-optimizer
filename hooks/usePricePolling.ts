"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ethPrice: number;
}

interface CacheEntry {
  price: number;
  priceChange: number;
  ethPrice: number;
  ts: number;
}

const priceCache: Partial<Record<Chain, CacheEntry>> = {};
const CACHE_TTL_MS = 55_000;

// In-flight dedup: satu fetch per chain sekaligus
const inflight: Partial<Record<Chain, Promise<CacheEntry | null>>> = {};

async function doFetch(c: Chain): Promise<CacheEntry | null> {
  try {
    const res = await fetch(`/api/price?chain=${c}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const entry: CacheEntry = {
      price:       data.price       ?? 0,
      priceChange: data.priceChange ?? 0,
      ethPrice:    data.ethPrice    ?? data.price ?? 0,
      ts:          Date.now(),
    };

    // Simpan ke cache
    priceCache[c] = entry;

    // Bonus: saat fetch ARB, cache sekalian harga ETH
    if (c === "ARB" && entry.ethPrice > 0 && !priceCache["ETH"]) {
      priceCache["ETH"] = {
        price:       entry.ethPrice,
        priceChange: 0,
        ethPrice:    entry.ethPrice,
        ts:          Date.now(),
      };
    }

    return entry;
  } catch {
    return null;
  } finally {
    delete inflight[c];
  }
}

// Shared fetch dengan dedup — caller ganda tidak double-fetch
function fetchPrice(c: Chain): Promise<CacheEntry | null> {
  if (!inflight[c]) {
    inflight[c] = doFetch(c);
  }
  return inflight[c]!;
}

export function usePricePolling(chain: Chain): PriceData {
  // Seed dari cache supaya tidak flash 0 saat ganti chain
  const seed = priceCache[chain];
  const [price,       setPrice]       = useState(seed?.price       ?? 0);
  const [priceChange, setPriceChange] = useState(seed?.priceChange ?? 0);
  const [ethPrice,    setEthPrice]    = useState(seed?.ethPrice    ?? 0);
  const [isLoading,   setIsLoading]   = useState(!seed);

  const chainRef = useRef(chain);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyEntry = useCallback((entry: CacheEntry, forChain: Chain) => {
    if (chainRef.current !== forChain) return; // chain sudah ganti — buang
    setPrice(entry.price);
    setPriceChange(entry.priceChange);
    setEthPrice(entry.ethPrice);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    chainRef.current = chain;

    const cached = priceCache[chain];
    const now    = Date.now();

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      // Cache masih fresh — tampilkan langsung, tidak perlu fetch
      applyEntry(cached, chain);
    } else if (cached) {
      // Cache stale — tampilkan dulu (biar tidak flash 0), fetch di background
      applyEntry(cached, chain);
      fetchPrice(chain).then((entry) => {
        if (entry) applyEntry(entry, chain);
      });
    } else {
      // Belum ada cache — loading state, fetch sekarang
      setIsLoading(true);
      fetchPrice(chain).then((entry) => {
        if (chainRef.current !== chain) return;
        if (entry) {
          applyEntry(entry, chain);
        } else {
          // Fetch gagal total dan tidak ada cache — coba lagi stale global
          const stale = priceCache[chain];
          if (stale) applyEntry(stale, chain);
          else setIsLoading(false); // tetap 0, jangan infinite loading
        }
      });
    }

    // Polling tiap 60 detik
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const c = chainRef.current;
      fetchPrice(c).then((entry) => {
        if (entry) applyEntry(entry, c);
      });
    }, 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chain, applyEntry]);

  return { price, priceChange, isLoading, ethPrice };
}
