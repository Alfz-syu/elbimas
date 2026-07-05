"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/money";

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryDonut({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Belum ada pengeluaran bulan ini.
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const top = data.slice(0, 5);
  const restTotal = data.slice(5).reduce((acc, d) => acc + d.value, 0);
  const slices =
    restTotal > 0
      ? [...top, { name: "Lainnya", value: restTotal, color: "#94A3B8" }]
      : top;

  return (
    <div>
      <div
        className="h-44 w-full"
        role="img"
        aria-label="Grafik proporsi pengeluaran per kategori"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || FALLBACK_COLORS[index % 5]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), currency),
                String(name),
              ]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-2">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color || "#94A3B8" }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="font-medium tabular-nums">
              {formatMoney(slice.value, currency)}
            </span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
