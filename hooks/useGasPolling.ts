"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Chain, GasData, GasHistory } from "@/types";
import { formatLocalTime } from "@/lib/timezone";

// ── Interval: 1 menit ──────────────────────────────────────────────────────
const INTERVAL_MS = 60_000;
const MAX_HISTORY = 20;

// Nilai ini harus konsisten dengan lib/getGas.ts simulateGas()
// karena keduanya dipakai sebagai fallback saat API gagal.
const SIM_BASE: Record<Chain, { base: number; spread: number }> = {
  ETH:   { base: 18,   spread: 12   },
  MATIC: { base: 150,  spread: 60   }, // fix: disesuaikan dengan lib/getGas.ts
  ARB:   { base: 0.02, spread: 0.015 }, // fix: disesuaikan dengan lib/getGas.ts
};

function simulateGas(chain: Chain): GasData {
  const cfg = SIM_BASE[chain];
  const noise = () => (Math.random() - 0.5) * cfg.spread;
  const low  = Math.max(0.01, parseFloat((cfg.base + noise()).toFixed(4)));
  const avg  = parseFloat((low + cfg.spread * 0.35 + Math.random() * cfg.spread * 0.2).toFixed(4));
  const high = parseFloat((avg + cfg.spread * 0.25 + Math.random() * cfg.spread * 0.15).toFixed(4));
  return { low, avg, high, chain, fetchedAt: new Date() };
}


const EMPTY_GAS = (chain: Chain): GasData => ({
  low: 0, avg: 0, high: 0, chain, fetchedAt: new Date(0),
});

const gasCache: Partial<Record<Chain, { data: GasData; history: GasHistory[]; ts: number }>> = {};
const CACHE_TTL_MS = 55_000;

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

    // Buat backfill history dari nilai real — dipanggil saat chart masih kosong
    // agar tidak perlu nunggu 20 menit buat chart terisi.
    // Nilai diambil dari data real (bukan SIM_BASE) sehingga tidak ada "drop" palsu.
    const backfillFromReal = (avg: number, c: Chain, fetchedAt: Date, count = 6): GasHistory[] => {
      const now = fetchedAt.getTime();
      // Tambah noise kecil ±3% supaya chart tidak flat garis lurus
      return Array.from({ length: count }, (_, i) => {
        const ts    = new Date(now - (count - i) * INTERVAL_MS);
        const jitter = avg * (0.97 + Math.random() * 0.06); // ±3%
        return makePoint(parseFloat(jitter.toFixed(4)), c, ts);
      });
    };

    try {
      const res = await fetch(`/api/gas?chain=${currentChain}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Fetch failed");
      const data: GasData = await res.json();
      data.fetchedAt = new Date(data.fetchedAt);

      if (chainRef.current !== currentChain) return;

      // Validasi data real: avg harus > 0
      if (!data.avg || data.avg <= 0) throw new Error("Invalid gas data (avg=0)");

      const pt = makePoint(data.avg, currentChain, data.fetchedAt);
      setGasData(data);
      setHistory((prev) => {
        const existing = prev.filter((h) => h.chain === currentChain);
        // Kalau chart masih kosong (baru pertama kali), isi backfill dulu
        const base = existing.length === 0
          ? backfillFromReal(data.avg, currentChain, data.fetchedAt)
          : existing;
        const newHistory = [...base, pt].slice(-MAX_HISTORY);
        evictStaleGasCache();
        gasCache[currentChain] = { data, history: newHistory, ts: Date.now() };
        return newHistory;
      });
    } catch (err) {
      const sim = simulateGas(currentChain);
      if (chainRef.current !== currentChain) return;

      if (!sim.avg || sim.avg <= 0) {
        setError("Gas data unavailable");
        setIsRefreshing(false);
        return;
      }

      const pt = makePoint(sim.avg, currentChain, sim.fetchedAt);
      setGasData(sim);
      setHistory((prev) => {
        const existing = prev.filter((h) => h.chain === currentChain);
        const base = existing.length === 0
          ? backfillFromReal(sim.avg, currentChain, sim.fetchedAt)
          : existing;
        const newHistory = [...base, pt].slice(-MAX_HISTORY);
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
      // Tidak pakai seed simulasi — langsung fetch data real.
      // Chart akan tampil kosong (loading) sesaat sampai data pertama tiba.
      // Ini lebih baik daripada chart dengan nilai palsu yang bikin "drop" visual.
      setGasData(cached?.data ?? EMPTY_GAS(chain));
      setHistory(cached?.history ?? []);
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
