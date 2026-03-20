"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProjectionStackedBarChart({
  data,
}: {
  data: Array<{ month: string; comprometido: number; restante: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="comprometido" stackId="a" fill="#10b981" radius={[18, 18, 0, 0]} />
        <Bar dataKey="restante" stackId="a" fill="#1f2937" radius={[0, 0, 18, 18]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
