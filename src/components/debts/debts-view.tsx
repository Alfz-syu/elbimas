"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  HandCoins,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { DebtStatus, DebtType } from "@/db/schema-types";
import type { CurrencyOption } from "@/components/auth/register-form";
import type { WalletBasicOption } from "@/components/goals/goals-view";

export interface DebtItem {
  id: number;
  type: DebtType;
  counterparty: string;
  principal_amount: string;
  currency: string;
  due_date: string | null;
  status: DebtStatus;
  note: string | null;
  paid_total: string;
  remaining: string;
  percentage: number;
}

interface PaymentItem {
  id: number;
  amount: string;
  wallet_name: string | null;
  payment_date: string;
  note: string | null;
}

const STATUS_LABELS: Record<DebtStatus, string> = {
  open: "Belum dibayar",
  partial: "Sebagian",
  settled: "Lunas",
};

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DebtsView({
  debts,
  wallets,
  currencies,
  baseCurrency,
}: {
  debts: DebtItem[];
  wallets: WalletBasicOption[];
  currencies: CurrencyOption[];
  baseCurrency: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<DebtType>("payable");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DebtItem | null>(null);
  const [paying, setPaying] = useState<DebtItem | null>(null);
  const [detail, setDetail] = useState<DebtItem | null>(null);
  const [deleting, setDeleting] = useState<DebtItem | null>(null);

  const filtered = debts.filter((d) => d.type === tab);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/debts/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Gagal menghapus catatan.");
    else {
      toast.success("Catatan dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as DebtType)}>
          <TabsList className="h-11">
            <TabsTrigger value="payable" className="px-4">
              Utang Saya
            </TabsTrigger>
            <TabsTrigger value="receivable" className="px-4">
              Piutang
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="h-11"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Catatan
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HandCoins className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                {tab === "payable" ? "Tidak ada utang" : "Tidak ada piutang"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {tab === "payable"
                  ? "Catat utangmu ke orang lain supaya tidak ada yang terlewat jatuh tempo."
                  : "Catat uang yang dipinjam orang lain darimu beserta pembayarannya."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((debt) => (
            <Card
              key={debt.id}
              className={cn(debt.status === "settled" && "opacity-70")}
            >
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{debt.counterparty}</p>
                    {debt.due_date && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        Jatuh tempo{" "}
                        {new Date(
                          `${debt.due_date}T00:00:00`
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      debt.status === "settled"
                        ? "default"
                        : debt.status === "partial"
                          ? "secondary"
                          : "outline"
                    }
                    className={cn(
                      debt.status === "settled" && "bg-primary/15 text-primary"
                    )}
                  >
                    {STATUS_LABELS[debt.status]}
                  </Badge>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Ubah catatan ${debt.counterparty}`}
                      onClick={() => {
                        setEditing(debt);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      aria-label={`Hapus catatan ${debt.counterparty}`}
                      onClick={() => setDeleting(debt)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <Progress
                  value={debt.percentage}
                  aria-label={`Terbayar ${debt.percentage}%`}
                />

                <div className="flex items-baseline justify-between text-sm">
                  <p className="tabular-nums">
                    <span className="font-semibold">
                      {formatMoney(debt.paid_total, debt.currency)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      / {formatMoney(debt.principal_amount, debt.currency)}
                    </span>
                  </p>
                  {debt.status !== "settled" && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Sisa {formatMoney(debt.remaining, debt.currency)}
                    </p>
                  )}
                </div>

                {debt.note && (
                  <p className="truncate text-xs text-muted-foreground">
                    {debt.note}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => setDetail(debt)}
                  >
                    Riwayat
                  </Button>
                  {debt.status !== "settled" && (
                    <Button
                      className="h-10 flex-1"
                      onClick={() => setPaying(debt)}
                    >
                      {debt.type === "payable" ? "Bayar" : "Terima Bayaran"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DebtFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currencies={currencies}
        baseCurrency={baseCurrency}
        defaultType={tab}
        debt={editing}
      />

      <PaymentDialog
        debt={paying}
        wallets={wallets}
        onOpenChange={(open) => !open && setPaying(null)}
      />

      <PaymentHistoryDialog
        debt={detail}
        onOpenChange={(open) => !open && setDetail(null)}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan {deleting?.type === "payable" ? "utang ke" : "piutang dari"}{" "}
              &ldquo;{deleting?.counterparty}&rdquo; beserta seluruh riwayat
              pembayarannya akan dihapus permanen.
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

function DebtFormDialog({
  open,
  onOpenChange,
  currencies,
  baseCurrency,
  defaultType,
  debt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: CurrencyOption[];
  baseCurrency: string;
  defaultType: DebtType;
  debt: DebtItem | null;
}) {
  const router = useRouter();
  const isEdit = debt !== null;
  const [type, setType] = useState<DebtType>(defaultType);
  const [currency, setCurrency] = useState(baseCurrency);

  const form = useForm<{
    counterparty: string;
    principal_amount: string;
    due_date: string;
    note: string;
  }>({
    defaultValues: {
      counterparty: "",
      principal_amount: "",
      due_date: "",
      note: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      counterparty: debt?.counterparty ?? "",
      principal_amount: debt ? String(parseFloat(debt.principal_amount)) : "",
      due_date: debt?.due_date ?? "",
      note: debt?.note ?? "",
    });
    setType(debt?.type ?? defaultType);
    setCurrency(debt?.currency ?? baseCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debt]);

  async function onSubmit(values: {
    counterparty: string;
    principal_amount: string;
    due_date: string;
    note: string;
  }) {
    const payload: Record<string, unknown> = {
      counterparty: values.counterparty,
      principal_amount: values.principal_amount,
      due_date: values.due_date === "" ? null : values.due_date,
      note: values.note.trim() === "" ? null : values.note.trim(),
    };
    if (!isEdit) {
      payload.type = type;
      payload.currency = currency;
    }
    const res = await fetch(isEdit ? `/api/debts/${debt.id}` : "/api/debts", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan catatan.");
      return;
    }
    toast.success(isEdit ? "Catatan diperbarui." : "Catatan dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Catatan" : "Tambah Utang/Piutang"}
          </DialogTitle>
          <DialogDescription>
            Utang = kamu meminjam; piutang = orang lain meminjam darimu.
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
              aria-label="Jenis catatan"
              className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1"
            >
              {(
                [
                  { value: "payable", label: "Utang Saya" },
                  { value: "receivable", label: "Piutang" },
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
            <Label htmlFor="debt-party">
              {type === "payable" ? "Pemberi pinjaman" : "Peminjam"}
            </Label>
            <Input
              id="debt-party"
              placeholder="Nama orang/pihak"
              className="h-11"
              aria-invalid={!!errors.counterparty}
              {...form.register("counterparty", {
                required: "Nama pihak wajib diisi",
              })}
            />
            {errors.counterparty && (
              <p role="alert" className="text-sm text-destructive">
                {errors.counterparty.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-amount">Nominal pokok</Label>
              <Input
                id="debt-amount"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="0"
                className="h-11 tabular-nums"
                aria-invalid={!!errors.principal_amount}
                {...form.register("principal_amount", {
                  required: "Nominal wajib diisi",
                  validate: (v) =>
                    (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                    "Nominal harus lebih dari 0",
                })}
              />
              {errors.principal_amount && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.principal_amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-currency">Mata uang</Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isEdit}
              >
                <SelectTrigger id="debt-currency" className="h-11 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-due">Jatuh tempo (opsional)</Label>
            <Input
              id="debt-due"
              type="date"
              className="h-11"
              {...form.register("due_date")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-note">Catatan (opsional)</Label>
            <Textarea
              id="debt-note"
              rows={2}
              maxLength={255}
              placeholder="mis. Pinjaman modal usaha"
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

function PaymentDialog({
  debt,
  wallets,
  onOpenChange,
}: {
  debt: DebtItem | null;
  wallets: WalletBasicOption[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [walletId, setWalletId] = useState<string>("none");
  const form = useForm<{ amount: string; payment_date: string; note: string }>({
    defaultValues: { amount: "", payment_date: todayLocal(), note: "" },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (debt) {
      form.reset({
        amount: String(parseFloat(debt.remaining)),
        payment_date: todayLocal(),
        note: "",
      });
      setWalletId("none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debt]);

  async function onSubmit(values: {
    amount: string;
    payment_date: string;
    note: string;
  }) {
    if (!debt) return;
    const res = await fetch(`/api/debts/${debt.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: values.amount,
        payment_date: values.payment_date,
        wallet_id: walletId === "none" ? null : Number(walletId),
        note: values.note.trim() === "" ? null : values.note.trim(),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal mencatat pembayaran.");
      return;
    }
    const data = await res.json();
    toast.success(
      data.debt?.status === "settled"
        ? "Pembayaran dicatat — lunas! 🎉"
        : "Pembayaran dicatat."
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={debt !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
          <DialogDescription>
            {debt
              ? `Sisa ${formatMoney(debt.remaining, debt.currency)} untuk ${debt.counterparty}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="pay-amount">
              Nominal{debt ? ` (${debt.currency})` : ""}
            </Label>
            <Input
              id="pay-amount"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              className="h-11 tabular-nums"
              aria-invalid={!!errors.amount}
              {...form.register("amount", {
                required: "Nominal wajib diisi",
                validate: (v) =>
                  (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                  "Nominal harus lebih dari 0",
              })}
            />
            {errors.amount && (
              <p role="alert" className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Tanggal</Label>
            <Input
              id="pay-date"
              type="date"
              className="h-11"
              {...form.register("payment_date", {
                required: "Tanggal wajib diisi",
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-wallet">Dompet (opsional)</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger id="pay-wallet" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak dicatat</SelectItem>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-note">Catatan (opsional)</Label>
            <Input
              id="pay-note"
              maxLength={255}
              className="h-11"
              {...form.register("note")}
            />
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
              Catat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentHistoryDialog({
  debt,
  onOpenChange,
}: {
  debt: DebtItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<PaymentItem[] | null>(null);

  useEffect(() => {
    if (!debt) {
      setPayments(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/debts/${debt.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPayments(data?.debt?.payments ?? []);
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debt]);

  return (
    <Dialog open={debt !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Riwayat Pembayaran</DialogTitle>
          <DialogDescription>
            {debt
              ? `${debt.counterparty} — terbayar ${formatMoney(debt.paid_total, debt.currency)} dari ${formatMoney(debt.principal_amount, debt.currency)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {payments === null ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="size-5 animate-spin text-muted-foreground"
              aria-label="Memuat"
            />
          </div>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pembayaran tercatat.
          </p>
        ) : (
          <ul className="divide-y">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium tabular-nums">
                    {debt ? formatMoney(p.amount, debt.currency) : p.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${p.payment_date}T00:00:00`).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                {p.wallet_name && (
                  <Badge variant="outline" className="gap-1">
                    <WalletIcon className="size-3" aria-hidden="true" />
                    {p.wallet_name}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
