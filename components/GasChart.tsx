"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
  TooltipProps,
} from "recharts";
import type { GasHistory } from "@/types";

interface GasChartProps {
  data: GasHistory[];
  accent: string;
  avgValue?: number;
}

type CustomTooltipProps = TooltipProps<number, string> & {
  payload?: { value: number }[];
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-sm shadow-2xl backdrop-blur-md"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
        color: "var(--text-primary)",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
      <p className="font-bold font-mono">
        {payload[0].value.toFixed(payload[0].value < 1 ? 3 : 2)}{" "}
        <span style={{ opacity: 0.6, fontWeight: "normal" }}>Gwei</span>
      </p>
    </div>
  );
}

export default function GasChart({ data, accent, avgValue }: GasChartProps) {
  const gridColor = "var(--chart-grid)";
  const textColor = "var(--chart-text)";

  // Tunggu sampai browser selesai layout sebelum render chart
  // Ini fix warning "width(-1) height(-1)" dari Recharts saat SSR/hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-full h-[160px] sm:h-[200px] animate-pulse rounded-xl th-muted" />;
  }

  return (
    // Explicit pixel height pada ResponsiveContainer — bukan 100% — supaya
    // Recharts tidak pernah dapat dimensi -1 dari parent yang belum selesai layout.
    <div className="w-full" style={{ minHeight: 160 }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: textColor, fontSize: 9, fontFamily: "monospace" }}
            axisLine={false} tickLine={false} interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 9, fontFamily: "monospace" }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => (v < 1 ? v.toFixed(2) : Math.round(v).toString())}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgValue && (
            <ReferenceLine y={avgValue} stroke={accent} strokeDasharray="6 3" strokeOpacity={0.4} />
          )}
          <Area
            type="monotone"
            dataKey="gas"
            stroke={accent}
            strokeWidth={2}
            fill="url(#gasGrad)"
            dot={false}
            activeDot={{ r: 4, fill: accent, stroke: "var(--chart-dot-stroke)", strokeWidth: 2 }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
