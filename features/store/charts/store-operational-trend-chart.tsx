"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function StoreOperationalTrendChart({
  data,
}: {
  data: Array<{ month: string; faturamento: number; custo: number; lucro: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="faturamento" fill="#06b6d4" radius={[14, 14, 0, 0]} />
        <Bar dataKey="custo" fill="#f59e0b" radius={[14, 14, 0, 0]} />
        <Bar dataKey="lucro" fill="#10b981" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}
