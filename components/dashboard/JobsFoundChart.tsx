"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyChartState } from "@/components/dashboard/EmptyChartState";
import type { DaySeriesPoint } from "@/lib/posthog-query";

type Props = {
  data: DaySeriesPoint[];
};

function formatDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function JobsFoundChart({ data }: Props) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <ChartCard title="Jobs Found Over Time">
      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-accent)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--color-surface)", stroke: "var(--color-accent)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState message="No jobs found yet — run a search to see this fill in." />
      )}
    </ChartCard>
  );
}
