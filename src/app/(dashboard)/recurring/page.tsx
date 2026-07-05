import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listRecurrings } from "@/server/recurring-service";
import { listWallets } from "@/server/wallet-service";
import { listCategories } from "@/server/category-service";
import { PageHeader } from "@/components/page-header";
import { RecurringView } from "@/components/recurring/recurring-view";

export const metadata: Metadata = {
  title: "Transaksi Berulang",
};

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recurrings, wallets, categories] = await Promise.all([
    listRecurrings(user.id),
    listWallets(user.id),
    listCategories(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Transaksi Berulang"
        description="Tagihan dan pemasukan rutin yang dicatat otomatis sesuai jadwal."
      />
      <RecurringView
        recurrings={recurrings}
        wallets={wallets.map((w) => ({
          id: w.id,
          name: w.name,
          currency: w.currency,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        }))}
      />
    </>
  );
}
