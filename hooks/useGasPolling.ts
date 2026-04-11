"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Chain, GasData, GasHistory } from "@/types";
import { formatLocalTime } from "@/lib/timezone";

// ── Interval: 1 menit ──────────────────────────────────────────────────────
const INTERVAL_MS = 60_000;
const MAX_HISTORY = 20;

const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH:   { base: 18,   spread: 12   },
  MATIC: { base: 80,   spread: 40   },
  ARB:   { base: 0.08, spread: 0.06 },
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low  = Math.max(0.01, parseFloat((cfg.base + noise()).toFixed(4)));
  const avg  = parseFloat((low + cfg.spread * 0.35 + Math.random() * cfg.spread * 0.2).toFixed(4));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * cfg.spread * 0.15).toFixed(4));
  return { low, avg, high, chain, fetchedAt: new Date() };
}

// Seed 6 titik mundur tiap 1 menit supaya chart langsung terisi saat ganti chain
function seedHistory(chain: Chain, count = 6): GasHistory[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const sim = simulateGas(chain);
    const ts  = new Date(now - (count - i) * INTERVAL_MS);
    return {
      time:    formatLocalTime(ts),
      timeRaw: ts.getTime(),
      gas:     sim.avg,
      chain,
    };
  });
}

const EMPTY_GAS = (chain: Chain): GasData => ({
  low: 0, avg: 0, high: 0, chain, fetchedAt: new Date(0),
});

const gasCache: Partial<Record<Chain, { data: GasData; history: GasHistory[]; ts: number }>> = {};
const CACHE_TTL_MS = 55_000; // sedikit di bawah 1 menit

// FIX: Evict cache entries yang sudah expired agar tidak ada memory leak
// di SPA yang berjalan lama. Dipanggil setiap kali ada write ke cache.
function evictStaleGasCache() {
  const now = Date.now();
  for (const key of Object.keys(gasCache) as Chain[]) {
    if (gasCache[key] && now - gasCache[key]!.ts > CACHE_TTL_MS * 3) {
      delete gasCache[key];
    }
  }
}

export function useGasPolling(chain: Chain, initialData?: GasData) {
  const initCache = gasCache[chain];

  const [gasData, setGasData] = useState<GasData>(
    initialData ?? (initCache ? initCache.data : EMPTY_GAS(chain))
  );
  const [history, setHistory] = useState<GasHistory[]>(initCache?.history ?? []);
  const [countdown, setCountdown]       = useState(INTERVAL_MS / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef     = useRef(chain);

  const fetchGas = useCallback(async (explicitChain?: Chain) => {
    const currentChain = explicitChain ?? chainRef.current;
    setIsRefreshing(true);
    setError(null);

    const makePoint = (avg: number, c: Chain, ts: Date): GasHistory => ({
      time:    formatLocalTime(ts),
      timeRaw: ts.getTime(),
      gas:     avg,
      chain:   c,
    });

    try {
      const res = await fetch(`/api/gas?chain=${currentChain}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: GasData = await res.json();
      data.fetchedAt = new Date(data.fetchedAt);

      if (chainRef.current !== currentChain) return;

      const pt = makePoint(data.avg, currentChain, data.fetchedAt);
      setGasData(data);
      setHistory((prev) => {
        const filtered  = prev.filter((h) => h.chain === currentChain);
        const newHistory = [...filtered, pt].slice(-MAX_HISTORY);
        evictStaleGasCache();
        gasCache[currentChain] = { data, history: newHistory, ts: Date.now() };
        return newHistory;
      });
    } catch {
      const sim = simulateGas(currentChain);
      if (chainRef.current !== currentChain) return;

      const pt = makePoint(sim.avg, currentChain, sim.fetchedAt);
      setGasData(sim);
      setHistory((prev) => {
        const filtered  = prev.filter((h) => h.chain === currentChain);
        const newHistory = [...filtered, pt].slice(-MAX_HISTORY);
        evictStaleGasCache();
        gasCache[currentChain] = { data: sim, history: newHistory, ts: Date.now() };
        return newHistory;
      });
      setError("Using simulated data (API unavailable)");
    } finally {
      if (chainRef.current === currentChain) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    chainRef.current = chain;
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const now    = Date.now();
    const cached = gasCache[chain];

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setGasData(cached.data);
      setHistory(cached.history);
      setError(null);
    } else {
      // Tampilkan seed langsung supaya chart tidak kosong, fetch real di background
      const seeded = cached?.history?.length ? cached.history : seedHistory(chain);
      setGasData(cached?.data ?? EMPTY_GAS(chain));
      setHistory(seeded);
      setError(null);
      fetchGas(chain);
    }

    setCountdown(INTERVAL_MS / 1000);

    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [chain, fetchGas]);

  const manualRefresh = useCallback(() => {
    fetchGas();
    setCountdown(INTERVAL_MS / 1000);

    // FIX: Reset kedua interval (fetch + countdown) supaya countdown visual
    // selalu sinkron dengan siklus fetch setelah manual refresh.
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
  }, [fetchGas]);

  return { gasData, history, countdown, isRefreshing, error, manualRefresh };
}
