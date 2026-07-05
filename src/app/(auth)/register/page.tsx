import type { Metadata } from "next";
import { db } from "@/db/client";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const currencies = await db
    .selectFrom("currencies")
    .select(["code", "name", "symbol"])
    .orderBy("code")
    .execute();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Buat akun gratis
        </h1>
        <p className="text-sm text-muted-foreground">
          Mulai catat dan rapikan keuanganmu dalam hitungan menit.
        </p>
      </div>
      <RegisterForm currencies={currencies} />
    </div>
  );
}
