import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { listWallets } from "@/server/wallet-service";
import { PageHeader } from "@/components/page-header";
import { WalletsView } from "@/components/wallets/wallets-view";

export const metadata: Metadata = {
  title: "Dompet",
};

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallets, currencies] = await Promise.all([
    listWallets(user.id, { includeArchived: true }),
    db
      .selectFrom("currencies")
      .select(["code", "name", "symbol"])
      .orderBy("code")
      .execute(),
  ]);

  return (
    <>
      <PageHeader
        title="Dompet"
        description="Kelola rekening, e-wallet, dan uang tunaimu di sini."
      />
      <WalletsView
        wallets={wallets}
        currencies={currencies}
        baseCurrency={user.base_currency}
      />
    </>
  );
}
