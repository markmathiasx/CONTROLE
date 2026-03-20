"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsCategoryBarChart({
  data,
}: {
  data: Array<{ name: string; total: number; fill: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
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
    </ResponsiveContainer>
  );
}

export function ReportsCenterBarChart({
  data,
}: {
  data: Array<{ name: string; total: number; fill: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
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
    </ResponsiveContainer>
  );
}

export function ReportsFutureInstallmentsBarChart({
  data,
}: {
  data: Array<{ month: string; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsMonthlyEvolutionLineChart({
  data,
}: {
  data: Array<{ month: string; receita: number; gasto: number; fatura: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={3} />
        <Line type="monotone" dataKey="fatura" stroke="#8b5cf6" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReportsMotoCostByCategoryBarChart({
  data,
}: {
  data: Array<{ name: string; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#f59e0b" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsMotoMonthlyTrendBarChart({
  data,
}: {
  data: Array<{ month: string; combustivel: number; manutencao: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="combustivel" fill="#06b6d4" radius={[14, 14, 0, 0]} />
        <Bar dataKey="manutencao" fill="#8b5cf6" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsStoreMonthlyTrendLineChart({
  data,
}: {
  data: Array<{ month: string; faturamento: number; custo: number; lucro: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Line type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="custo" stroke="#06b6d4" strokeWidth={3} />
        <Line type="monotone" dataKey="lucro" stroke="#f59e0b" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReportsStoreCostBreakdownBarChart({
  data,
}: {
  data: Array<{ name: string; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="total" fill="#06b6d4" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsConsolidatedByModuleBarChart({
  data,
}: {
  data: Array<{ month: string; pessoal: number; moto: number; loja: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#71717a" />
        <YAxis stroke="#71717a" />
        <Tooltip />
        <Bar dataKey="pessoal" stackId="a" fill="#06b6d4" radius={[14, 14, 0, 0]} />
        <Bar dataKey="moto" stackId="a" fill="#f59e0b" radius={[14, 14, 0, 0]} />
        <Bar dataKey="loja" stackId="a" fill="#10b981" radius={[14, 14, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
