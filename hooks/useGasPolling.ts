"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Chain, GasData, GasHistory } from "@/types";
import { formatLocalTime } from "@/lib/timezone";

const INTERVAL_MS = 10_000;
const MAX_HISTORY = 20;

const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH: { base: 18, spread: 12 },
  MATIC: { base: 35, spread: 25 },
  ARB: { base: 0.08, spread: 0.12 },
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low = Math.max(0.01, parseFloat((cfg.base + noise()).toFixed(3)));
  const avg = parseFloat((low + cfg.spread * 0.35 + Math.random() * 3).toFixed(3));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * 2).toFixed(3));
  return { low, avg, high, chain, fetchedAt: new Date() };
}

const EMPTY_GAS = (chain: Chain): GasData => ({
  low: 0, avg: 0, high: 0, chain, fetchedAt: new Date(0),
});

// Module-level cache — keyed by chain, survives re-renders & chain switches
const gasCache: Partial<Record<Chain, { data: GasData; history: GasHistory[]; ts: number }>> = {};
const CACHE_TTL_MS = 8_000;

export function useGasPolling(chain: Chain, initialData?: GasData) {
  const initCache = gasCache[chain];
  const [gasData, setGasData] = useState<GasData>(
    initialData ?? (initCache ? initCache.data : EMPTY_GAS(chain))
  );
  // History is PER-CHAIN — reset when chain changes
  const [history, setHistory] = useState<GasHistory[]>(initCache?.history ?? []);
  const [countdown, setCountdown] = useState(INTERVAL_MS / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef = useRef(chain);

  const fetchGas = useCallback(async () => {
    const currentChain = chainRef.current;
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/gas?chain=${currentChain}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: GasData = await res.json();
      data.fetchedAt = new Date(data.fetchedAt);

      if (chainRef.current !== currentChain) return; // chain changed mid-flight

      setGasData(data);
      setHistory((prev) => {
        const next: GasHistory = {
          time: formatLocalTime(new Date()),
          timeRaw: Date.now(),
          gas: data.avg,
          chain: currentChain,
        };
        const newHistory = [...prev, next].slice(-MAX_HISTORY);
        gasCache[currentChain] = { data, history: newHistory, ts: Date.now() };
        return newHistory;
      });
    } catch {
      const sim = simulateGas(currentChain);
      if (chainRef.current !== currentChain) return;
      setGasData(sim);
      setHistory((prev) => {
        const next: GasHistory = {
          time: formatLocalTime(new Date()),
          timeRaw: Date.now(),
          gas: sim.avg,
          chain: currentChain,
        };
        const newHistory = [...prev, next].slice(-MAX_HISTORY);
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

    const now = Date.now();
    const cached = gasCache[chain];

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      // Fresh cache — show instantly, no fetch needed
      setGasData(cached.data);
      setHistory(cached.history);
      setError(null);
    } else if (cached) {
      // Stale cache — show immediately while fetching fresh
      setGasData(cached.data);
      setHistory(cached.history);
      fetchGas();
    } else {
      // No cache — show empty skeleton and fetch
      setGasData(EMPTY_GAS(chain));
      setHistory([]);
      fetchGas();
    }

    // Reset countdown timer on chain switch
    setCountdown(INTERVAL_MS / 1000);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [chain, fetchGas]);

  const manualRefresh = useCallback(() => {
    fetchGas();
    setCountdown(INTERVAL_MS / 1000);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);
  }, [fetchGas]);

  return { gasData, history, countdown, isRefreshing, error, manualRefresh };
}
