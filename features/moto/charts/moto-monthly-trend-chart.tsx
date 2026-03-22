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

export function MotoMonthlyTrendChart({
  data,
}: {
  data: Array<{ month: string; combustivel: number; manutencao: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="combustivel" fill="#06b6d4" radius={[12, 12, 0, 0]} />
        <Bar dataKey="manutencao" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
