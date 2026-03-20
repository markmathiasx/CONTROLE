"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ConsolidatedTrendBarChart({
  data,
}: {
  data: Array<{ month: string; receita: number; operacional: number; saldo: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="receita" fill="#10b981" radius={[14, 14, 0, 0]} />
        <Bar dataKey="operacional" fill="#f59e0b" radius={[14, 14, 0, 0]} />
        <Bar dataKey="saldo" fill="#06b6d4" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
