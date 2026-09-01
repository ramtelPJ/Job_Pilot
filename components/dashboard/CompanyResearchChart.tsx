"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyChartState } from "@/components/dashboard/EmptyChartState";
import type { DaySeriesPoint } from "@/lib/posthog-query";

type Props = {
  data: DaySeriesPoint[];
};

function formatDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function CompanyResearchChart({ data }: Props) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <ChartCard title="Company Research Activity">
      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayLabel}
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip labelFormatter={(label) => formatDayLabel(String(label))} />
            <Bar dataKey="count" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState message="No research yet — research a company to see it here." />
      )}
    </ChartCard>
  );
}
