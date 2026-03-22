"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function TopCategoriesPieChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <ResponsiveChart>
      <PieChart>
        <Pie data={data} innerRadius={56} outerRadius={80} dataKey="value">
          {data.map((item) => (
            <Cell key={`${item.name}-${item.color}`} fill={item.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveChart>
  );
}
