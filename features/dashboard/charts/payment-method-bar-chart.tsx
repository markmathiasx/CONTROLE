"use client";

import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function PaymentMethodBarChart({
  data,
}: {
  data: Array<{ name: string; total: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <XAxis type="number" stroke="#71717a" />
        <YAxis type="category" dataKey="name" stroke="#71717a" width={72} />
        <Tooltip />
        <Bar dataKey="total" fill="#10b981" radius={[0, 14, 14, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}
