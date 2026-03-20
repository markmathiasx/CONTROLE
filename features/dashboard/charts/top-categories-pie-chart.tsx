"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function TopCategoriesPieChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} innerRadius={56} outerRadius={80} dataKey="value">
          {data.map((item) => (
            <Cell key={`${item.name}-${item.color}`} fill={item.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
