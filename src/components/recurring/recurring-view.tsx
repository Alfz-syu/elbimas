"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Loader2,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { RecurringFrequency, TransactionType } from "@/db/schema-types";
import type {
  CategoryOption,
  WalletOption,
} from "@/components/transactions/transaction-form-dialog";

export interface RecurringItem {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  interval_count: number;
  next_run_date: string;
  end_date: string | null;
  note: string | null;
  is_active: boolean;
}

const FREQUENCY_UNITS: Record<RecurringFrequency, string> = {
  daily: "hari",
  weekly: "minggu",
  monthly: "bulan",
  yearly: "tahun",
};

function frequencyLabel(frequency: RecurringFrequency, interval: number) {
  return interval === 1
    ? `Tiap ${FREQUENCY_UNITS[frequency]}`
    : `Tiap ${interval} ${FREQUENCY_UNITS[frequency]}`;
}

function formatDateId(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RecurringView({
  recurrings,
  wallets,
  categories,
}: {
  recurrings: RecurringItem[];
  wallets: WalletOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [deleting, setDeleting] = useState<RecurringItem | null>(null);
  const [running, setRunning] = useState(false);

  const hasDue = recurrings.some(
    (r) => r.is_active && r.next_run_date <= todayLocal()
  );

  async function runNow() {
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
          : "Tidak ada jadwal yang jatuh tempo."
      );
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  async function toggleActive(item: RecurringItem, active: boolean) {
    const res = await fetch(`/api/recurring/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: active }),
    });
    if (!res.ok) {
      toast.error("Gagal mengubah status.");
      return;
    }
    toast.success(active ? "Jadwal diaktifkan." : "Jadwal dijeda.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/recurring/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) toast.error("Gagal menghapus jadwal.");
    else {
      toast.success("Jadwal dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="outline"
          className="h-11"
          onClick={runNow}
          disabled={running}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
          Jalankan Sekarang
          {hasDue && (
            <span
              className="size-2 rounded-full bg-warning"
              aria-label="Ada jadwal jatuh tempo"
            />
          )}
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="h-11"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Jadwal
        </Button>
      </div>

      {recurrings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Repeat className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                Belum ada jadwal berulang
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Otomatiskan tagihan bulanan, langganan, atau gaji rutin supaya
                tidak perlu dicatat manual tiap kali.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recurrings.map((item) => (
            <Card key={item.id} className={cn(!item.is_active && "opacity-60")}>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      item.type === "income"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {item.type === "income" ? (
                      <TrendingUp className="size-5" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {item.note ?? item.category_name ?? "Tanpa catatan"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.wallet_name}
                      {item.category_name ? ` · ${item.category_name}` : ""}
                    </p>
                  </div>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => toggleActive(item, checked)}
                    aria-label={`Aktifkan jadwal ${item.note ?? item.category_name ?? item.id}`}
                  />
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "text-lg font-semibold tabular-nums",
                      item.type === "income"
                        ? "text-primary"
                        : "text-destructive"
                    )}
                  >
                    {item.type === "income" ? "+" : "−"}
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  <Badge variant="secondary" className="gap-1">
                    <Repeat className="size-3" aria-hidden="true" />
                    {frequencyLabel(item.frequency, item.interval_count)}
                  </Badge>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {item.is_active
                    ? `Jadwal berikutnya ${formatDateId(item.next_run_date)}`
                    : "Dijeda"}
                  {item.end_date &&
                    ` · berakhir ${formatDateId(item.end_date)}`}
                </p>

                <div className="flex justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label="Ubah jadwal"
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:text-destructive"
                    aria-label="Hapus jadwal"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RecurringFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        wallets={wallets}
        categories={categories}
        recurring={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jadwal ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Jadwal berulang &ldquo;
              {deleting?.note ?? deleting?.category_name ?? "tanpa catatan"}
              &rdquo; akan dihapus. Transaksi yang sudah dibuat sebelumnya
              tetap tersimpan.
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
    </>
  );
}

interface FormFields {
  amount: string;
  interval_count: string;
  next_run_date: string;
  end_date: string;
  note: string;
}

function RecurringFormDialog({
  open,
  onOpenChange,
  wallets,
  categories,
  recurring,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletOption[];
  categories: CategoryOption[];
  recurring: RecurringItem | null;
}) {
  const router = useRouter();
  const isEdit = recurring !== null;
  const [type, setType] = useState<TransactionType>("expense");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");

  const form = useForm<FormFields>({
    defaultValues: {
      amount: "",
      interval_count: "1",
      next_run_date: todayLocal(),
      end_date: "",
      note: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  const selectedWallet = wallets.find((w) => String(w.id) === walletId);
  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!open) return;
    form.reset({
      amount: recurring ? String(parseFloat(recurring.amount)) : "",
      interval_count: recurring ? String(recurring.interval_count) : "1",
      next_run_date: recurring?.next_run_date ?? todayLocal(),
      end_date: recurring?.end_date ?? "",
      note: recurring?.note ?? "",
    });
    setType(recurring?.type ?? "expense");
    setWalletId(
      recurring
        ? String(recurring.wallet_id)
        : wallets[0]
          ? String(wallets[0].id)
          : ""
    );
    setCategoryId(
      recurring?.category_id ? String(recurring.category_id) : "none"
    );
    setFrequency(recurring?.frequency ?? "monthly");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recurring]);

  async function onSubmit(values: FormFields) {
    if (!walletId) {
      toast.error("Pilih dompet dulu.");
      return;
    }
    const payload = {
      wallet_id: Number(walletId),
      category_id: categoryId === "none" ? null : Number(categoryId),
      type,
      amount: values.amount,
      frequency,
      interval_count: Number(values.interval_count) || 1,
      next_run_date: values.next_run_date,
      end_date: values.end_date === "" ? null : values.end_date,
      note: values.note.trim() === "" ? null : values.note.trim(),
    };
    const res = await fetch(
      isEdit ? `/api/recurring/${recurring.id}` : "/api/recurring",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan jadwal.");
      return;
    }
    toast.success(isEdit ? "Jadwal diperbarui." : "Jadwal dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Jadwal Berulang" : "Tambah Jadwal Berulang"}
          </DialogTitle>
          <DialogDescription>
            Transaksi akan dibuat otomatis sesuai jadwal saat runner berjalan.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div
            role="radiogroup"
            aria-label="Tipe transaksi"
            className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1"
          >
            {(
              [
                { value: "expense", label: "Pengeluaran", icon: TrendingDown },
                { value: "income", label: "Pemasukan", icon: TrendingUp },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={type === opt.value}
                onClick={() => {
                  setType(opt.value);
                  setCategoryId("none");
                }}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
                  type === opt.value
                    ? opt.value === "expense"
                      ? "bg-destructive/10 text-destructive shadow-sm"
                      : "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <opt.icon className="size-4" aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-amount">
              Jumlah{selectedWallet ? ` (${selectedWallet.currency})` : ""}
            </Label>
            <Input
              id="rec-amount"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
              className="h-11 text-lg font-semibold tabular-nums"
              aria-invalid={!!errors.amount}
              {...form.register("amount", {
                required: "Jumlah wajib diisi",
                validate: (v) =>
                  (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                  "Jumlah harus lebih dari 0",
              })}
            />
            {errors.amount && (
              <p role="alert" className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rec-wallet">Dompet</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger id="rec-wallet" className="h-11 w-full">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} ({w.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-category">Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="rec-category" className="h-11 w-full">
                  <SelectValue placeholder="Tanpa kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kategori</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rec-frequency">Frekuensi</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurringFrequency)}
              >
                <SelectTrigger id="rec-frequency" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-interval">Tiap berapa periode</Label>
              <Input
                id="rec-interval"
                type="number"
                min="1"
                max="365"
                step="1"
                className="h-11 tabular-nums"
                aria-invalid={!!errors.interval_count}
                {...form.register("interval_count", {
                  required: "Wajib diisi",
                  validate: (v) =>
                    (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 365) ||
                    "Isi angka 1-365",
                })}
              />
              {errors.interval_count && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.interval_count.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rec-next">Jadwal berikutnya</Label>
              <Input
                id="rec-next"
                type="date"
                className="h-11"
                aria-invalid={!!errors.next_run_date}
                {...form.register("next_run_date", {
                  required: "Tanggal wajib diisi",
                })}
              />
              {errors.next_run_date && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.next_run_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-end">Berakhir (opsional)</Label>
              <Input
                id="rec-end"
                type="date"
                className="h-11"
                {...form.register("end_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-note">Catatan (opsional)</Label>
            <Textarea
              id="rec-note"
              rows={2}
              maxLength={255}
              placeholder="mis. Langganan internet"
              {...form.register("note")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
