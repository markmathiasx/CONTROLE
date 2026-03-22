"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ResponsiveChart } from "@/components/shared/responsive-chart";

export function ReportsCategoryBarChart({
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
        <Bar dataKey="total" fill="#10b981" radius={[14, 14, 0, 0]}>
          {data.map((item) => (
            <Cell key={`${item.name}-${item.fill}`} fill={item.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsCenterBarChart({
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
        <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]}>
          {data.map((item) => (
            <Cell key={`${item.name}-${item.fill}`} fill={item.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsFutureInstallmentsBarChart({
  data,
}: {
  data: Array<{ month: string; total: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsMonthlyEvolutionLineChart({
  data,
}: {
  data: Array<{ month: string; receita: number; gasto: number; fatura: number }>;
}) {
  return (
    <ResponsiveChart>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={3} />
        <Line type="monotone" dataKey="fatura" stroke="#8b5cf6" strokeWidth={3} />
      </LineChart>
    </ResponsiveChart>
  );
}

export function ReportsMotoCostByCategoryBarChart({
  data,
}: {
  data: Array<{ name: string; total: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#f59e0b" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsMotoMonthlyTrendBarChart({
  data,
}: {
  data: Array<{ month: string; combustivel: number; manutencao: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="combustivel" fill="#06b6d4" radius={[14, 14, 0, 0]} />
        <Bar dataKey="manutencao" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsStoreMonthlyTrendLineChart({
  data,
}: {
  data: Array<{ month: string; faturamento: number; custo: number; lucro: number }>;
}) {
  return (
    <ResponsiveChart>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Line type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="custo" stroke="#06b6d4" strokeWidth={3} />
        <Line type="monotone" dataKey="lucro" stroke="#f59e0b" strokeWidth={3} />
      </LineChart>
    </ResponsiveChart>
  );
}

export function ReportsStoreCostBreakdownBarChart({
  data,
}: {
  data: Array<{ name: string; total: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}

export function ReportsConsolidatedByModuleBarChart({
  data,
}: {
  data: Array<{ month: string; pessoal: number; automovel: number; saldo: number }>;
}) {
  return (
    <ResponsiveChart>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="pessoal" stackId="a" fill="#06b6d4" radius={[14, 14, 0, 0]} />
        <Bar dataKey="automovel" stackId="a" fill="#f59e0b" radius={[14, 14, 0, 0]} />
        <Bar dataKey="saldo" stackId="a" fill="#10b981" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveChart>
  );
}
