"use client";

import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function ProjectionStackedBarChart({
  data,
}: {
  data: Array<{ month: string; comprometido: number; restante: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="comprometido" stackId="a" fill="#10b981" radius={[18, 18, 0, 0]} />
        <Bar dataKey="restante" stackId="a" fill="#1f2937" radius={[0, 0, 18, 18]} />
      </BarChart>
    </ResponsiveChart>
  );
}
