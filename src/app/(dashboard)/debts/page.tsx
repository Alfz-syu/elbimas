import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { listDebts } from "@/server/debt-service";
import { listWallets } from "@/server/wallet-service";
import { PageHeader } from "@/components/page-header";
import { DebtsView } from "@/components/debts/debts-view";

export const metadata: Metadata = {
  title: "Utang Piutang",
};

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [debts, wallets, currencies] = await Promise.all([
    listDebts(user.id),
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
        title="Utang Piutang"
        description="Pantau pinjaman yang kamu berikan maupun terima, beserta pembayarannya."
      />
      <DebtsView
        debts={debts}
        wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
        currencies={currencies}
        baseCurrency={user.base_currency}
      />
    </>
  );
}
