"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type GasHistory = {
  time: string;
  gas: number;
};

type Props = {
  data: GasHistory[];
};

export default function GasChart({ data }: Props) {
  return (
    <div className="glass p-4 rounded-2xl h-[300px]">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line dataKey="gas" stroke="#22c55e" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}