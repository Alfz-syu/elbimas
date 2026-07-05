import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { transactionListQuerySchema } from "@/lib/validators/transaction";
import { listTransactions } from "@/server/transaction-service";
import { listWallets } from "@/server/wallet-service";
import { listCategories } from "@/server/category-service";
import { PageHeader } from "@/components/page-header";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata: Metadata = {
  title: "Transaksi",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value !== "") flat[key] = value;
  }
  const parsed = transactionListQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : transactionListQuerySchema.parse({});

  const [result, wallets, categories] = await Promise.all([
    listTransactions(user.id, query),
    listWallets(user.id),
    listCategories(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Semua pemasukan dan pengeluaranmu, bisa difilter dan dicari."
      />
      <TransactionsView
        transactions={result.transactions}
        total={result.total}
        page={result.page}
        perPage={result.per_page}
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
        baseCurrency={user.base_currency}
      />
    </>
  );
}
