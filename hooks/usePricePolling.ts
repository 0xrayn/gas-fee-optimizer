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
  /** true = sedang fetch pertama kali (belum ada data sama sekali) */
  isLoading: boolean;
  ethPrice: number;
}

interface CacheEntry {
  price: number;
  priceChange: number;
  ethPrice: number;
  ts: number;
}

// Module-level cache & in-flight map  persist across renders
const priceCache: Partial<Record<Chain, CacheEntry>> = {};
const CACHE_TTL_MS = 55_000;
const inflight: Partial<Record<Chain, Promise<CacheEntry | null>>> = {};

async function doFetch(c: Chain): Promise<CacheEntry | null> {
  try {
    const res = await fetch(`/api/price?chain=${c}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Harga 0 dari API = API gagal ambil data, jangan cache
    if (!data.price || data.price <= 0) return null;

    const entry: CacheEntry = {
      price:       data.price,
      priceChange: data.priceChange ?? 0,
      ethPrice:    data.ethPrice > 0 ? data.ethPrice : data.price,
      ts:          Date.now(),
    };

    priceCache[c] = entry;

    // Saat fetch ARB, ETH price ikut di-return  cache sekalian
    if (c === "ARB" && entry.ethPrice > 0) {
      priceCache["ETH"] = {
        price:       entry.ethPrice,
        priceChange: priceCache["ETH"]?.priceChange ?? 0,
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

function fetchPrice(c: Chain): Promise<CacheEntry | null> {
  if (!inflight[c]) inflight[c] = doFetch(c);
  return inflight[c]!;
}

// Retry dengan exponential backoff  max 3x
async function fetchWithRetry(c: Chain, retries = 3): Promise<CacheEntry | null> {
  for (let i = 0; i < retries; i++) {
    const result = await fetchPrice(c);
    if (result) return result;
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  return null;
}

export function usePricePolling(chain: Chain): PriceData {
  const chainRef    = useRef<Chain>(chain);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  // Inisialisasi state dari cache  cegah flash ke 0 saat ganti chain
  const getInitialState = () => {
    const seed = priceCache[chain];
    return {
      price:       seed?.price       ?? 0,
      priceChange: seed?.priceChange ?? 0,
      ethPrice:    seed?.ethPrice    ?? 0,
      isLoading:   !seed,
    };
  };

  const [state, setState] = useState(getInitialState);

  const applyEntry = useCallback((entry: CacheEntry, forChain: Chain) => {
    if (chainRef.current !== forChain) return;
    setState({
      price:       entry.price,
      priceChange: entry.priceChange,
      ethPrice:    entry.ethPrice,
      isLoading:   false,
    });
  }, []);

  const runFetch = useCallback(async (c: Chain) => {
    if (fetchingRef.current && chainRef.current === c) return;
    fetchingRef.current = true;
    try {
      const entry = await fetchWithRetry(c);
      if (entry) {
        applyEntry(entry, c);
      } else {
        // Fetch + retry semua gagal  pakai stale cache kalau ada
        const stale = priceCache[c];
        if (stale && chainRef.current === c) {
          applyEntry(stale, c);
        } else if (chainRef.current === c) {
          // Benar-benar tidak ada data  stop loading, tampilkan unavailable
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [applyEntry]);

  // FIX: visibilitychange  re-fetch saat tab aktif kembali dari background
  // Browser throttle timer saat tab di-minimize, jadi polling bisa mati lama.
  // Listener ini mastiin data langsung direfresh begitu user balik ke tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const cached = priceCache[chainRef.current];
        const isStale = !cached || Date.now() - cached.ts >= CACHE_TTL_MS;
        if (isStale) runFetch(chainRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [runFetch]);

  useEffect(() => {
    chainRef.current    = chain;
    fetchingRef.current = false;

    const cached = priceCache[chain];
    const now    = Date.now();

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      // Cache masih fresh  langsung tampil, tidak perlu fetch
      setState({
        price:       cached.price,
        priceChange: cached.priceChange,
        ethPrice:    cached.ethPrice,
        isLoading:   false,
      });
    } else if (cached) {
      // Stale cache  tampilkan dulu, fetch baru di background
      setState({
        price:       cached.price,
        priceChange: cached.priceChange,
        ethPrice:    cached.ethPrice,
        isLoading:   false, // jangan loading, data stale masih valid ditampilkan
      });
      runFetch(chain);
    } else {
      // Tidak ada cache sama sekali
      setState({ price: 0, priceChange: 0, ethPrice: 0, isLoading: true });
      runFetch(chain);
    }

    // Polling tiap 60 detik
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      runFetch(chainRef.current);
    }, 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chain, runFetch]);

  return state;
}
