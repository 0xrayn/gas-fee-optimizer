"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
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

export default function AlertPanel({
  threshold,
  onThresholdChange,
  currentGas = 0,
  chain = "ETH",
}: AlertPanelProps) {
  const { theme } = useTheme();
  const chainCfg = CHAINS[chain];
  const [input, setInput] = useState(String(threshold));
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // permState in ref → no setState in effect, no hydration mismatch
  const permRef = useRef<PermState>("default");
  const [tick, setTick] = useState(0);

  const lastAlertedRef = useRef(0);
  const prevGasRef = useRef(currentGas);

  // Sync real browser permission once after mount
  useEffect(() => {
    const real: PermState = !("Notification" in window)
      ? "unsupported"
      : (Notification.permission as PermState);
    if (permRef.current !== real) {
      permRef.current = real;
      setTick((t) => t + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor gas and fire notification
  useEffect(() => {
    if (!enabled || permRef.current !== "granted" || currentGas <= 0) return;

    const wasAbove = prevGasRef.current > threshold;
    const isBelow = currentGas < threshold;
    const now = Date.now();
    const cooldown = 5 * 60 * 1000;

    if (isBelow && wasAbove && now - lastAlertedRef.current > cooldown) {
      try {
        new Notification(`⛽ ${chain} Gas Alert!`, {
          body: `Gas is now ${currentGas.toFixed(1)} Gwei — below your threshold of ${threshold} Gwei.`,
          icon: "/favicon.ico",
          tag: "gas-alert",
        });
        lastAlertedRef.current = now;
        setTimeout(() => {
          setStatusMsg(`Alert sent: ${currentGas.toFixed(1)} Gwei`);
          setTimeout(() => setStatusMsg(""), 4000);
        }, 0);
      } catch {
        // silently fail
      }
    }

    prevGasRef.current = currentGas;
  }, [currentGas, threshold, enabled, chain, tick]);

  const permState = permRef.current;

  async function requestPermissionAndEnable() {
    if (!("Notification" in window)) {
      setStatusMsg("This browser does not support notifications");
      return;
    }
    if (Notification.permission === "granted") {
      permRef.current = "granted";
      setEnabled(true);
      setTick((t) => t + 1);
      setStatusMsg("Gas Alert enabled ✓");
      setTimeout(() => setStatusMsg(""), 3000);
      return;
    }
    if (Notification.permission === "denied") {
      permRef.current = "denied";
      setTick((t) => t + 1);
      setStatusMsg("Permission denied. Enable it in your browser settings.");
      setTimeout(() => setStatusMsg(""), 5000);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      permRef.current = result as PermState;
      setTick((t) => t + 1);
      if (result === "granted") {
        setEnabled(true);
        setStatusMsg("Gas Alert enabled ✓");
        setTimeout(() => setStatusMsg(""), 3000);
        new Notification("⛽ GasWatch Alerts Active", {
          body: `You'll be notified when gas drops below ${threshold} Gwei.`,
          icon: "/favicon.ico",
          tag: "gas-alert-test",
        });
      } else {
        setStatusMsg("Permission denied — enable it in browser settings");
        setTimeout(() => setStatusMsg(""), 5000);
      }
    } catch {
      setStatusMsg("Failed to request notification permission");
      setTimeout(() => setStatusMsg(""), 4000);
    }
  }

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

  const isActive = enabled && permState === "granted";
  const isDenied = permState === "denied";
  const isUnsupported = permState === "unsupported";
  const gasIsBelow = currentGas > 0 && currentGas < threshold;

  return (
    <div className={`rounded-2xl border p-5 transition-colors duration-300 ${
      theme === "dark" ? "bg-white/[0.02] border-white/[0.07]" : "bg-white/60 border-black/[0.07] backdrop-blur-sm"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className={`text-xs font-semibold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
            Gas Alert
          </p>
          {isActive && gasIsBelow && (
            <span className="flex size-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <button
          onClick={toggleEnabled}
          disabled={isUnsupported}
          title={
            isUnsupported ? "Notifications not supported in this browser"
            : isDenied ? "Notification permission denied"
            : isActive ? "Disable gas alert"
            : "Enable gas alert"
          }
          className={`p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            isActive
              ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
              : isDenied
              ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
              : theme === "dark"
              ? "text-white/30 bg-white/5 hover:bg-white/10"
              : "text-black/30 bg-black/5 hover:bg-black/10"
          }`}
        >
          {isActive
            ? <BellRing size={14} className="animate-[pulse_2s_ease-in-out_infinite]" />
            : enabled
            ? <Bell size={14} />
            : <BellOff size={14} />
          }
        </button>
      </div>

      {(statusMsg || isDenied || isUnsupported) && (
        <div className={`mb-3 px-3 py-2 rounded-xl text-[11px] font-medium border ${
          isDenied || isUnsupported
            ? theme === "dark"
              ? "bg-red-400/10 border-red-400/20 text-red-400"
              : "bg-red-500/10 border-red-500/20 text-red-600"
            : theme === "dark"
            ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
        }`}>
          {isDenied
            ? "⚠ Permission denied. Go to Browser Settings → Privacy → Notifications to allow."
            : isUnsupported
            ? "ℹ This browser does not support desktop notifications."
            : statusMsg}
        </div>
      )}

      <p className={`text-sm mb-3 ${theme === "dark" ? "text-white/50" : "text-black/50"}`}>
        Notify when avg gas drops below
      </p>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max="999"
          step="0.5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className={`
            flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono font-bold
            transition-all duration-200 outline-none
            focus:ring-2 focus:border-transparent
            ${theme === "dark"
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/20"
              : "bg-black/5 border-black/10 text-black placeholder:text-black/20"
            }
          `}
          style={{ ["--tw-ring-color" as string]: `${chainCfg.color}55` }}
        />
        <span className={`flex items-center text-sm font-medium px-2 ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>
          Gwei
        </span>
        <button
          onClick={handleSave}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
            saved
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "border"
          }`}
          style={!saved ? {
            background: `${chainCfg.color}22`,
            borderColor: `${chainCfg.color}44`,
            color: chainCfg.color,
          } : undefined}
        >
          {saved ? "Saved ✓" : "Set"}
        </button>
      </div>

      <div className={`flex items-center justify-between mt-3 text-xs ${theme === "dark" ? "text-white/25" : "text-black/30"}`}>
        <span>
          Threshold: <span className="font-mono font-bold">{threshold} Gwei</span>
        </span>
        {!isActive && !isUnsupported && !isDenied && (
          <button
            onClick={requestPermissionAndEnable}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold
              border transition-all duration-200 hover:scale-105 active:scale-95
              ${theme === "dark"
                ? "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10"
                : "bg-black/5 border-black/10 text-black/45 hover:text-black/75 hover:bg-black/8"
              }
            `}
          >
            <Bell size={10} />
            Enable notifications
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
