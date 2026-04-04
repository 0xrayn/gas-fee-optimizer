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

export function useGasPolling(chain: Chain, initialData?: GasData) {
  const [gasData, setGasData] = useState<GasData>(
    initialData ?? simulateGas(chain)
  );
  const [history, setHistory] = useState<GasHistory[]>(() =>
    buildInitialHistory(chain)
  );
  const [countdown, setCountdown] = useState(INTERVAL_MS / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGas = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/gas?chain=${chain}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: GasData = await res.json();
      data.fetchedAt = new Date(data.fetchedAt);
      setGasData(data);
      setHistory((prev) => {
        const next: GasHistory = {
          time: formatLocalTime(new Date()),
          timeRaw: Date.now(),
          gas: data.avg,
          chain,
        };
        const updated = [...prev, next];
        return updated.slice(-MAX_HISTORY);
      });
    } catch {
      // fallback to simulation on client
      const sim = simulateGas(chain);
      setGasData(sim);
      setHistory((prev) => {
        const next: GasHistory = {
          time: formatLocalTime(new Date()),
          timeRaw: Date.now(),
          gas: sim.avg,
          chain,
        };
        return [...prev, next].slice(-MAX_HISTORY);
      });
      setError("Using simulated data (API unavailable)");
    } finally {
      setIsRefreshing(false);
    }
  }, [chain]);

  // Reset history when chain changes
  useEffect(() => {
    setHistory(buildInitialHistory(chain));
    fetchGas();
  }, [chain, fetchGas]);

  // Auto-refresh every 10s
  useEffect(() => {
    setCountdown(INTERVAL_MS / 1000);

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
    // Reset interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);
  }, [fetchGas]);

  return { gasData, history, countdown, isRefreshing, error, manualRefresh };
}

function buildInitialHistory(chain: Chain): GasHistory[] {
  const cfg = SIM_BASE[chain];
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now - (11 - i) * 5 * 60_000);
    const noise = () => (Math.random() - 0.5) * cfg.spread;
    const gas = parseFloat(Math.max(0.01, cfg.base + noise()).toFixed(3));
    return { time: formatLocalTime(t), timeRaw: t.getTime(), gas, chain };
  });
}
