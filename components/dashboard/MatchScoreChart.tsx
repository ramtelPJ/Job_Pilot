"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { EmptyChartState } from "@/components/dashboard/EmptyChartState";
import type { MatchScoreBucket } from "@/lib/posthog-query";

type Props = {
  data: MatchScoreBucket[];
};

export function MatchScoreChart({ data }: Props) {
  const hasData = data.some((bucket) => bucket.count > 0);

  return (
    <ChartCard title="Match Score Distribution">
      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="range"
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
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState message="No scored jobs yet — search for jobs to see your match distribution." />
      )}
    </ChartCard>
  );
}
