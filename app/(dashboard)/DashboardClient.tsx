"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ChartDataPoint {
  month: string;
  ingresos: number;
}

interface DashboardClientProps {
  chartData: ChartDataPoint[];
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CO")}`;
}

export default function DashboardClient({ chartData }: DashboardClientProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: any) => `$${(Number(v) / 1000).toFixed(0)}k`}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--card-foreground))",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 }}
          formatter={(value: any) => [formatCurrency(Number(value) || 0), "Ingresos"]}
        />
        <Bar
          dataKey="ingresos"
          fill="hsl(var(--primary))"
          radius={[6, 6, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
