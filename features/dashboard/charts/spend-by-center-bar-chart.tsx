"use client";

import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function SpendByCenterBarChart({
  data,
}: {
  data: Array<{ name: string; total: number; fill: string }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" radius={[18, 18, 4, 4]}>
          {data.map((item) => (
            <Cell key={`${item.name}-${item.fill}`} fill={item.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveChart>
  );
}
