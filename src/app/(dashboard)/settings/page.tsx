import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/server/category-service";
import { listRates } from "@/server/rate-service";
import { PageHeader } from "@/components/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [categories, rates, currencies] = await Promise.all([
    listCategories(user.id),
    listRates(user.id),
    db
      .selectFrom("currencies")
      .select(["code", "name", "symbol"])
      .orderBy("code")
      .execute(),
  ]);

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Profil, kategori, kurs mata uang, dan preferensi lainnya."
      />
      <SettingsView
        user={user}
        categories={categories}
        rates={rates}
        currencies={currencies}
      />
    </>
  );
}
