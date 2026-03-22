"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SpendByCenterBarChart({
  data,
}: {
  data: Array<{ name: string; total: number; fill: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
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
    </ResponsiveContainer>
  );
}
