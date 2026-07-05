import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Scale,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMonthlySummary } from "@/server/report-service";
import { listTransactions } from "@/server/transaction-service";
import { formatMoney } from "@/lib/money";
import { monthString } from "@/lib/validators/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const monthParsed = monthString.safeParse(raw.month);
  const month = monthParsed.success ? monthParsed.data : currentMonth();

  const [summary, recent] = await Promise.all([
    getMonthlySummary(user, month),
    listTransactions(user.id, {
      from: `${month}-01`,
      to: undefined,
      page: 1,
      per_page: 5,
    }),
  ]);

  const net = parseFloat(summary.totals.net);
  const expenseSlices = summary.by_category
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name ?? "Tanpa kategori",
      value: parseFloat(c.total),
      color: c.color ?? "",
    }))
    .sort((a, b) => b.value - a.value);

  const stats = [
    {
      label: "Total Saldo",
      value: formatMoney(summary.total_balance_base, user.base_currency),
      icon: Wallet,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Pemasukan",
      value: formatMoney(summary.totals.income, user.base_currency),
      icon: ArrowUpRight,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Pengeluaran",
      value: formatMoney(summary.totals.expense, user.base_currency),
      icon: ArrowDownRight,
      accent: "text-destructive bg-destructive/10",
    },
    {
      label: "Selisih",
      value: formatMoney(summary.totals.net, user.base_currency, {
        signDisplay: "exceptZero",
      }),
      icon: Scale,
      accent:
        net >= 0
          ? "text-primary bg-primary/10"
          : "text-destructive bg-destructive/10",
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Halo, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan keuanganmu dalam {user.base_currency}.
          </p>
        </div>
        <MonthPicker month={month} />
      </div>

      {summary.unconverted_currencies.length > 0 && (
        <p className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning-foreground">
          Kurs {summary.unconverted_currencies.join(", ")} →{" "}
          {user.base_currency} belum tersedia, saldo dompet tersebut belum
          termasuk dalam total.{" "}
          <Link href="/settings" className="font-medium underline underline-offset-4">
            Atur kurs
          </Link>
        </p>
      )}

      {/* Kartu statistik */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-2 py-5">
            <CardContent className="flex items-center gap-3 px-5">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  stat.accent
                )}
              >
                <stat.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="truncate font-heading text-lg font-bold tabular-nums sm:text-xl">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grafik */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Arus Kas Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart
              currency={user.base_currency}
              data={summary.daily.map((d) => ({
                date: d.date,
                income: parseFloat(d.income),
                expense: parseFloat(d.expense),
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">
              Pengeluaran per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={expenseSlices} currency={user.base_currency} />
          </CardContent>
        </Card>
      </div>

      {/* Dompet + transaksi terbaru */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Dompet</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/wallets">
                Kelola
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {summary.wallets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada dompet.{" "}
                <Link href="/wallets" className="font-medium text-primary underline-offset-4 hover:underline">
                  Buat sekarang
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {summary.wallets.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 py-2.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: w.color ?? "#0E7B5D" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {w.name}
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(w.balance, w.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">
              Transaksi Terbaru
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">
                Semua
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada transaksi bulan ini.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 py-2.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          tx.category_color ??
                          (tx.type === "income" ? "#0E7B5D" : "#64748B"),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {tx.note ?? tx.category_name ?? "Transaksi"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          `${tx.transaction_date}T00:00:00`
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {tx.wallet_name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        tx.type === "income" ? "text-primary" : "text-foreground"
                      )}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatMoney(tx.amount, tx.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
