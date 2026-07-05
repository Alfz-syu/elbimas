import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { listGoals } from "@/server/goal-service";
import { listWallets } from "@/server/wallet-service";
import { PageHeader } from "@/components/page-header";
import { GoalsView } from "@/components/goals/goals-view";

export const metadata: Metadata = {
  title: "Target Tabungan",
};

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [goals, wallets, currencies] = await Promise.all([
    listGoals(user.id),
    listWallets(user.id),
    db
      .selectFrom("currencies")
      .select(["code", "name", "symbol"])
      .orderBy("code")
      .execute(),
  ]);

  return (
    <>
      <PageHeader
        title="Target Tabungan"
        description="Tetapkan tujuan menabung dan isi progresnya bertahap."
      />
      <GoalsView
        goals={goals}
        wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
        currencies={currencies}
        baseCurrency={user.base_currency}
      />
    </>
  );
}
