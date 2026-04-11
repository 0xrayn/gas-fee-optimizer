"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/types";

interface AlertPanelProps {
  threshold: number;
  onThresholdChange: (v: number) => void;
  currentGas?: number;
  chain?: Chain;
}

type PermState = "default" | "granted" | "denied" | "unsupported";

// FIX: Baca permission langsung dari browser API, bukan dari ref,
// supaya state selalu sinkron dengan kondisi real browser.
function readPermState(): PermState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

export default function AlertPanel({
  threshold, onThresholdChange, currentGas = 0, chain = "ETH",
}: AlertPanelProps) {
  const chainCfg = CHAINS[chain];

  const [input,     setInput]     = useState(String(threshold));
  const [saved,     setSaved]     = useState(false);
  const [enabled,   setEnabled]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // FIX: Ganti permRef + tick pattern menjadi useState biasa agar reactive
  // dan tidak ada celah stale state saat permission berubah dari luar komponen.
  const [permState, setPermState] = useState<PermState>("default");

  const lastAlertedRef = useRef(0);
  const prevGasRef     = useRef<number | null>(null); // FIX: null = belum ada data, bukan 0

  // Sync permState dari browser saat mount
  useEffect(() => {
    setPermState(readPermState());
  }, []);

  // Reset saat chain / threshold berubah
  // FIX: prevGasRef di-set ke null (bukan 0) supaya first-tick tidak salah evaluasi wasAbove
  useEffect(() => {
    setInput(String(threshold));
    setSaved(false);
    setStatusMsg("");
    prevGasRef.current     = null;
    lastAlertedRef.current = 0;
  }, [chain, threshold]);

  // Cek & kirim notifikasi
  useEffect(() => {
    if (!enabled || permState !== "granted" || currentGas <= 0) return;

    // FIX: Jika ini data pertama setelah reset (prevGasRef masih null),
    // simpan nilai saat ini sebagai baseline dan skip trigger.
    // Notifikasi baru dievaluasi pada update berikutnya.
    if (prevGasRef.current === null) {
      prevGasRef.current = currentGas;
      return;
    }

    const wasAbove = prevGasRef.current > threshold;
    const isBelow  = currentGas < threshold;
    const now      = Date.now();
    const cooldown = 5 * 60 * 1000;

    if (isBelow && wasAbove && now - lastAlertedRef.current > cooldown) {
      try {
        new Notification(`⛽ ${chain} Gas Alert!`, {
          body: `Gas is now ${currentGas.toFixed(2)} Gwei — below your threshold of ${threshold} Gwei.`,
          icon: "/favicon.ico",
          tag: `gas-alert-${chain}`,
        });
        lastAlertedRef.current = now;
        setTimeout(() => {
          setStatusMsg(`Alert sent: ${currentGas.toFixed(2)} Gwei`);
          setTimeout(() => setStatusMsg(""), 4000);
        }, 0);
      } catch (err) {
        // FIX: Jangan silent fail — log dan tampilkan feedback ke user
        console.warn("[GasWatch] Failed to send notification:", err);
        setStatusMsg("Gagal mengirim notifikasi. Cek izin browser.");
        setTimeout(() => setStatusMsg(""), 4000);
      }
    }

    prevGasRef.current = currentGas;
  }, [currentGas, threshold, enabled, chain, permState]);

  const isActive      = enabled && permState === "granted";
  const isDenied      = permState === "denied";
  const isUnsupported = permState === "unsupported";
  const gasIsBelow    = currentGas > 0 && currentGas < threshold;

  const requestPermissionAndEnable = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermState("unsupported");
      setStatusMsg("Browser ini tidak mendukung notifikasi");
      return;
    }

    // FIX: Selalu baca permission terbaru dari browser sebelum memutuskan langkah
    const current = Notification.permission as PermState;
    setPermState(current);

    if (current === "granted") {
      setEnabled(true);
      setStatusMsg("Gas Alert enabled ✓");
      setTimeout(() => setStatusMsg(""), 3000);
      return;
    }
    if (current === "denied") {
      setStatusMsg("Permission denied. Enable it in your browser settings.");
      setTimeout(() => setStatusMsg(""), 5000);
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermState(result as PermState);
      if (result === "granted") {
        setEnabled(true);
        setStatusMsg("Gas Alert enabled ✓");
        setTimeout(() => setStatusMsg(""), 3000);
        new Notification("⛽ GasWatch Alerts Active", {
          body: `You'll be notified when ${chain} gas drops below ${threshold} Gwei.`,
          icon: "/favicon.ico",
          tag: "gas-alert-test",
        });
      } else {
        setStatusMsg("Permission denied — enable it in browser settings");
        setTimeout(() => setStatusMsg(""), 5000);
      }
    } catch (err) {
      console.warn("[GasWatch] requestPermission error:", err);
      setStatusMsg("Failed to request notification permission");
      setTimeout(() => setStatusMsg(""), 4000);
    }
  }, [chain, threshold]);

  function toggleEnabled() {
    if (!enabled) {
      requestPermissionAndEnable();
    } else {
      setEnabled(false);
      setStatusMsg("Gas Alert disabled");
      setTimeout(() => setStatusMsg(""), 2000);
    }
  }

  function handleSave() {
    const v = parseFloat(input);
    if (!isNaN(v) && v > 0) {
      onThresholdChange(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (enabled) {
        setStatusMsg(`Threshold updated: ${v} Gwei`);
        setTimeout(() => setStatusMsg(""), 3000);
      }
    }
  }

  return (
    <div className="rounded-2xl border p-4 sm:p-5 th-card th-border-card backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest th-text-muted truncate">
            Gas Alert · {chainCfg.label}
          </p>
          {isActive && gasIsBelow && <span className="flex size-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />}
        </div>
        <button
          onClick={toggleEnabled} disabled={isUnsupported}
          title={isUnsupported ? "Notifications not supported" : isDenied ? "Permission denied" : isActive ? "Disable" : "Enable gas alert"}
          className={`p-1.5 rounded-lg transition-[background] duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
            isActive   ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
            : isDenied ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
            : "th-text-faint th-muted th-muted-hover"
          }`}
        >
          {isActive ? <BellRing size={14} className="animate-[pulse_2s_ease-in-out_infinite]" /> : enabled ? <Bell size={14} /> : <BellOff size={14} />}
        </button>
      </div>

      {(statusMsg || isDenied || isUnsupported) && (
        <div className={`mb-3 px-3 py-2 rounded-xl text-[11px] font-medium border ${
          isDenied || isUnsupported
            ? "bg-red-400/10 border-red-400/20 text-red-400"
            : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
        }`}>
          {isDenied ? "⚠ Permission denied. Go to Browser Settings → Privacy → Notifications to allow."
           : isUnsupported ? "ℹ This browser does not support desktop notifications."
           : statusMsg}
        </div>
      )}

      <p className="text-sm mb-3 th-text-secondary">Notify when avg gas drops below</p>

      <div className="flex gap-2">
        <input
          type="number" min="0.01" max="9999" step={chain === "ARB" ? "0.01" : "1"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 text-sm font-mono font-bold
            transition-[border-color] duration-200 outline-none focus:ring-2 focus:border-transparent
            th-input th-text-primary placeholder:th-text-faint"
          style={{ ["--tw-ring-color" as string]: `${chainCfg.color}55` }}
        />
        <span className="flex items-center text-sm font-medium px-1 sm:px-2 th-text-muted shrink-0">Gwei</span>
        <button
          onClick={handleSave}
          className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-[transform] duration-150 hover:scale-105 active:scale-95 shrink-0 ${
            saved ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "border"
          }`}
          style={!saved ? { background: `${chainCfg.color}22`, borderColor: `${chainCfg.color}44`, color: chainCfg.color } : undefined}
        >
          {saved ? "Saved ✓" : "Set"}
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs th-text-faint flex-wrap gap-2">
        <span>Threshold: <span className="font-mono font-bold">{threshold} Gwei</span></span>
        {!isActive && !isUnsupported && !isDenied && (
          <button
            onClick={requestPermissionAndEnable}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold
              border th-muted th-border-muted th-text-faint th-muted-hover
              transition-[transform,color] duration-150 hover:scale-105 active:scale-95 hover:th-text-secondary"
          >
            <Bell size={10} /> Enable notifications
          </button>
        )}
        {isActive && (
          <span className="text-emerald-400 font-semibold text-[11px]">
            {gasIsBelow ? "⚡ Gas is below threshold!" : "✓ Monitoring..."}
          </span>
        )}
      </div>
    </div>
  );
}
