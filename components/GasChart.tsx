"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import type { GasHistory } from "@/types";

interface GasChartProps {
  data: GasHistory[];
  accent: string;
  avgValue?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  const { theme } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
        theme === "dark"
          ? "bg-[#0f1629]/90 border-white/10 text-white"
          : "bg-white/90 border-black/10 text-black"
      }`}
    >
      <p className="opacity-50 text-xs mb-1">{label}</p>
      <p className="font-bold font-mono">
        {payload[0].value.toFixed(payload[0].value < 1 ? 3 : 2)}{" "}
        <span className="font-normal opacity-60">Gwei</span>
      </p>
    </div>
  );
}

export default function GasChart({ data, accent, avgValue }: GasChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const textColor = theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: textColor, fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v < 1 ? v.toFixed(2) : Math.round(v).toString())}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgValue && (
            <ReferenceLine
              y={avgValue}
              stroke={accent}
              strokeDasharray="6 3"
              strokeOpacity={0.4}
            />
          )}
          <Area
            type="monotone"
            dataKey="gas"
            stroke={accent}
            strokeWidth={2}
            fill="url(#gasGrad)"
            dot={false}
            activeDot={{
              r: 4,
              fill: accent,
              stroke: theme === "dark" ? "#030712" : "#fff",
              strokeWidth: 2,
            }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
