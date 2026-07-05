import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { monthString } from "@/lib/validators/common";
import { listBudgetsWithActuals } from "@/server/budget-service";
import { listCategories } from "@/server/category-service";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { BudgetsView } from "@/components/budgets/budgets-view";

export const metadata: Metadata = {
  title: "Anggaran",
};

export const dynamic = "force-dynamic";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const monthParsed = monthString.safeParse(raw.month);
  const month = monthParsed.success ? monthParsed.data : currentMonth();

  const [budgets, categories] = await Promise.all([
    listBudgetsWithActuals(user, month),
    listCategories(user.id, "expense"),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Anggaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Batas belanja bulanan vs realisasi (dalam {user.base_currency}).
          </p>
        </div>
        <MonthPicker month={month} />
      </div>
      <BudgetsView
        budgets={budgets}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        month={month}
        baseCurrency={user.base_currency}
      />
    </>
  );
}
