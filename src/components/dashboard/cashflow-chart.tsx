"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export interface CashflowPoint {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function CashflowChart({
  data,
  currency,
}: {
  data: CashflowPoint[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Belum ada transaksi bulan ini.
      </div>
    );
  }

  return (
    <div className="h-64 w-full" role="img" aria-label="Grafik arus kas harian">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-1)"
                stopOpacity={0.35}
              />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--chart-4)"
                stopOpacity={0.35}
              />
              <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => String(Number(v.slice(8)))}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={compactNumber}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0), currency),
              name === "income" ? "Pemasukan" : "Pengeluaran",
            ]}
            labelFormatter={(label) =>
              typeof label === "string"
                ? new Date(`${label}T00:00:00`).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : label
            }
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#fillIncome)"
            name="income"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="var(--chart-4)"
            strokeWidth={2}
            fill="url(#fillExpense)"
            name="expense"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
