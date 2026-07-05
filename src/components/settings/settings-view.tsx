"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import type { CategoryRow } from "@/server/category-service";
import type { RateRow } from "@/server/rate-service";
import type { CurrencyOption } from "@/components/auth/register-form";
import type { CategoryType } from "@/db/schema-types";

export function SettingsView({
  user,
  categories,
  rates,
  currencies,
}: {
  user: SessionUser;
  categories: CategoryRow[];
  rates: RateRow[];
  currencies: CurrencyOption[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard user={user} currencies={currencies} />
      <ToolsCard />
      <CategoriesCard categories={categories} />
      <RatesCard
        rates={rates}
        currencies={currencies}
        baseCurrency={user.base_currency}
      />
    </div>
  );
}

/* ---------------------------------- Profil --------------------------------- */

function ProfileCard({
  user,
  currencies,
}: {
  user: SessionUser;
  currencies: CurrencyOption[];
}) {
  const router = useRouter();
  const [baseCurrency, setBaseCurrency] = useState(user.base_currency);
  const form = useForm<{ name: string }>({
    defaultValues: { name: user.name },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: { name: string }) {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, base_currency: baseCurrency }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan profil.");
      return;
    }
    toast.success("Profil disimpan.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Nama tampilan dan mata uang utama untuk laporan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="profil-nama">Nama</Label>
            <Input
              id="profil-nama"
              className="h-11"
              aria-invalid={!!errors.name}
              {...form.register("name", {
                required: "Nama wajib diisi",
                minLength: { value: 2, message: "Nama minimal 2 karakter" },
              })}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-email">Email</Label>
            <Input
              id="profil-email"
              value={user.email}
              readOnly
              disabled
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-currency">Mata uang utama</Label>
            <Select value={baseCurrency} onValueChange={setBaseCurrency}>
              <SelectTrigger id="profil-currency" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {baseCurrency !== user.base_currency && (
              <p className="text-xs text-warning-foreground">
                Mengubah mata uang utama memengaruhi konversi di laporan.
                Pastikan kurs pasangan mata uangmu sudah diatur.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="h-11">
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Simpan Profil
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Alat & runner ------------------------------ */

function ToolsCard() {
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function runRecurring() {
    setRunning(true);
    try {
      const res = await fetch("/api/recurring/run", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error?.message ?? "Gagal menjalankan.");
        return;
      }
      const created = body?.result?.transactions_created ?? 0;
      toast.success(
        created > 0
          ? `${created} transaksi dibuat dari jadwal berulang.`
          : "Tidak ada jadwal berulang yang jatuh tempo."
      );
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  async function syncRates() {
    setSyncing(true);
    try {
      const res = await fetch("/api/rates/sync", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error?.message ?? "Gagal sinkronisasi kurs.");
        return;
      }
      const syncedCount = body?.synced?.length ?? 0;
      const cachedCount = body?.skipped_cached?.length ?? 0;
      toast.success(
        `Kurs disinkronkan (${syncedCount} diperbarui, ${cachedCount} sudah terbaru).`
      );
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alat</CardTitle>
        <CardDescription>
          Pemicu manual untuk proses otomatis Elbimas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Jalankan transaksi berulang</p>
            <p className="text-sm text-muted-foreground">
              Proses semua jadwal berulang yang jatuh tempo hari ini.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 shrink-0"
            onClick={runRecurring}
            disabled={running}
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            Jalankan
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sinkronkan kurs mata uang</p>
            <p className="text-sm text-muted-foreground">
              Ambil kurs terbaru dari sumber publik (sekali per hari).
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 shrink-0"
            onClick={syncRates}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Sinkronkan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Kategori -------------------------------- */

function CategoriesCard({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const grouped: { type: CategoryType; label: string; items: CategoryRow[] }[] =
    [
      {
        type: "expense",
        label: "Pengeluaran",
        items: categories.filter((c) => c.type === "expense"),
      },
      {
        type: "income",
        label: "Pemasukan",
        items: categories.filter((c) => c.type === "income"),
      },
    ];

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/categories/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menghapus kategori.");
    } else {
      toast.success("Kategori dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Kategori</CardTitle>
          <CardDescription>
            Kelola kategori pemasukan dan pengeluaranmu.
          </CardDescription>
        </div>
        <Button
          className="h-10 shrink-0"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {grouped.map((group) => (
          <div key={group.type}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {group.label} ({group.items.length})
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      category.type === "income"
                        ? "bg-primary"
                        : "bg-destructive/70"
                    )}
                    style={
                      category.color
                        ? { backgroundColor: category.color }
                        : undefined
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {category.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Ubah kategori ${category.name}`}
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Hapus kategori ${category.name}`}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
              {group.items.length === 0 && (
                <li className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  Belum ada kategori.
                </li>
              )}
            </ul>
          </div>
        ))}
      </CardContent>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &ldquo;{deleting?.name}&rdquo; akan dihapus. Transaksi
              yang memakai kategori ini menjadi tanpa kategori.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryRow | null;
}) {
  const router = useRouter();
  const isEdit = category !== null;
  const [type, setType] = useState<CategoryType>("expense");
  const form = useForm<{ name: string }>({ defaultValues: { name: "" } });
  const { errors, isSubmitting } = form.formState;

  // Reset saat dialog dibuka
  function handleOpenChange(next: boolean) {
    if (next) {
      form.reset({ name: category?.name ?? "" });
      setType(category?.type ?? "expense");
    }
    onOpenChange(next);
  }

  async function onSubmit(values: { name: string }) {
    const res = await fetch(
      isEdit ? `/api/categories/${category.id}` : "/api/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { name: values.name } : { name: values.name, type }
        ),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan kategori.");
      return;
    }
    toast.success(isEdit ? "Kategori diperbarui." : "Kategori dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Kategori" : "Tambah Kategori"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ganti nama kategori ini."
              : "Kategori baru untuk mengelompokkan transaksi."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {!isEdit && (
            <div
              role="radiogroup"
              aria-label="Tipe kategori"
              className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1"
            >
              {(
                [
                  { value: "expense", label: "Pengeluaran" },
                  { value: "income", label: "Pemasukan" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={type === opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors",
                    type === opt.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="kategori-nama">Nama kategori</Label>
            <Input
              id="kategori-nama"
              className="h-11"
              placeholder="mis. Pendidikan"
              aria-invalid={!!errors.name}
              {...form.register("name", { required: "Nama wajib diisi" })}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-11">
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Kurs manual ------------------------------- */

function RatesCard({
  rates,
  currencies,
  baseCurrency,
}: {
  rates: RateRow[];
  currencies: CurrencyOption[];
  baseCurrency: string;
}) {
  const router = useRouter();
  const [quote, setQuote] = useState("");
  const form = useForm<{ rate: string }>({ defaultValues: { rate: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: { rate: string }) {
    if (!quote) {
      toast.error("Pilih mata uang tujuan dulu.");
      return;
    }
    const res = await fetch("/api/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_currency: quote, rate: values.rate }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan kurs.");
      return;
    }
    toast.success("Kurs disimpan.");
    form.reset({ rate: "" });
    setQuote("");
    router.refresh();
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Kurs Manual</CardTitle>
        <CardDescription>
          1 {baseCurrency} = berapa mata uang tujuan. Dipakai untuk konversi di
          laporan bila tidak ada kurs sinkron.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-3 sm:grid-cols-[10rem_1fr_auto]"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="kurs-quote">Mata uang tujuan</Label>
            <Select value={quote} onValueChange={setQuote}>
              <SelectTrigger id="kurs-quote" className="h-11 w-full">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {currencies
                  .filter((c) => c.code !== baseCurrency)
                  .map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-rate">
              Nilai (1 {baseCurrency} = ? {quote || "…"})
            </Label>
            <Input
              id="kurs-rate"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="mis. 0.0000615"
              className="h-11 tabular-nums"
              aria-invalid={!!errors.rate}
              {...form.register("rate", {
                required: "Nilai kurs wajib diisi",
                validate: (v) =>
                  (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                  "Kurs harus lebih dari 0",
              })}
            />
            {errors.rate && (
              <p role="alert" className="text-sm text-destructive">
                {errors.rate.message}
              </p>
            )}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isSubmitting} className="h-11">
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Simpan Kurs
            </Button>
          </div>
        </form>

        {rates.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada kurs tersimpan. Tambahkan manual di atas atau pakai
            tombol Sinkronkan di bagian Alat.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {rate.base_currency} → {rate.quote_currency}
                  </p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {parseFloat(rate.rate).toLocaleString("id-ID", {
                      maximumFractionDigits: 8,
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {rate.rate_date}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
