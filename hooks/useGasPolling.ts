"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Chain, GasData, GasHistory } from "@/types";
import { formatLocalTime } from "@/lib/timezone";

const INTERVAL_MS = 10_000;
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

// Pre-seed history dengan beberapa titik simulasi supaya chart langsung terisi
// saat pindah ke chain baru (tidak menunggu 10 detik)
function seedHistory(chain: Chain, count = 6): GasHistory[] {
  const now = Date.now();
  const points: GasHistory[] = [];
  for (let i = count; i >= 1; i--) {
    const sim = simulateGas(chain);
    const ts  = new Date(now - i * INTERVAL_MS);
    points.push({
      time: formatLocalTime(ts),
      timeRaw: ts.getTime(),
      gas: sim.avg,
      chain,
    });
  }
  return points;
}

const EMPTY_GAS = (chain: Chain): GasData => ({
  low: 0, avg: 0, high: 0, chain, fetchedAt: new Date(0),
});

// Module-level cache — bertahan selama session browser
const gasCache: Partial<Record<Chain, { data: GasData; history: GasHistory[]; ts: number }>> = {};
const CACHE_TTL_MS = 8_000;

export function useGasPolling(chain: Chain, initialData?: GasData) {
  const initCache = gasCache[chain];

  const [gasData, setGasData] = useState<GasData>(
    initialData ?? (initCache ? initCache.data : EMPTY_GAS(chain))
  );
  const [history, setHistory] = useState<GasHistory[]>(
    initCache?.history ?? []
  );
  const [countdown, setCountdown]       = useState(INTERVAL_MS / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chainRef     = useRef(chain);

  const fetchGas = useCallback(async (explicitChain?: Chain) => {
    // Gunakan explicitChain kalau disediakan (untuk menghindari stale closure)
    const currentChain = explicitChain ?? chainRef.current;
    setIsRefreshing(true);
    setError(null);

    const makePt = (avg: number, c: Chain, ts: Date): GasHistory => ({
      time: formatLocalTime(ts),   // timestamp DARI data, bukan new Date()
      timeRaw: ts.getTime(),
      gas: avg,
      chain: c,
    });

    try {
      const res = await fetch(`/api/gas?chain=${currentChain}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: GasData = await res.json();
      data.fetchedAt = new Date(data.fetchedAt);

      if (chainRef.current !== currentChain) return;

      const pt = makePt(data.avg, currentChain, data.fetchedAt);
      setGasData(data);
      setHistory((prev) => {
        // Filter hanya titik chain ini, lalu tambah titik baru
        const filtered = prev.filter((h) => h.chain === currentChain);
        const newHistory = [...filtered, pt].slice(-MAX_HISTORY);
        gasCache[currentChain] = { data, history: newHistory, ts: Date.now() };
        return newHistory;
      });
    } catch {
      const sim = simulateGas(currentChain);
      if (chainRef.current !== currentChain) return;

      const pt = makePt(sim.avg, currentChain, sim.fetchedAt);
      setGasData(sim);
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.chain === currentChain);
        const newHistory = [...filtered, pt].slice(-MAX_HISTORY);
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

    // Clear interval lama dulu
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const now    = Date.now();
    const cached = gasCache[chain];

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      // Cache fresh — pakai langsung
      setGasData(cached.data);
      setHistory(cached.history);
      setError(null);
    } else {
      // Tidak ada cache atau expired:
      // Langsung tampilkan seed history (titik simulasi) supaya chart tidak kosong
      const seeded = cached?.history ?? seedHistory(chain);
      setGasData(cached?.data ?? EMPTY_GAS(chain));
      setHistory(seeded);
      setError(null);
      // Fetch real data sekarang — hasilnya akan append ke seed history
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchGas();
      setCountdown(INTERVAL_MS / 1000);
    }, INTERVAL_MS);
  }, [fetchGas]);

  return { gasData, history, countdown, isRefreshing, error, manualRefresh };
}
