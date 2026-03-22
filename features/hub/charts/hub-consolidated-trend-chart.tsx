"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function HubConsolidatedTrendChart({
  data,
}: {
  data: Array<{
    month: string;
    receita: number;
    operacional: number;
    saldo: number;
  }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
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
