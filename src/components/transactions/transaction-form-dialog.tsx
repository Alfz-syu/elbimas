"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/db/schema-types";

export interface WalletOption {
  id: number;
  name: string;
  currency: string;
}

export interface CategoryOption {
  id: number;
  name: string;
  type: TransactionType;
}

export interface TransactionFormValue {
  id?: number;
  wallet_id: number;
  category_id: number | null;
  type: TransactionType;
  amount: string;
  note: string | null;
  transaction_date: string;
}

interface FormFields {
  type: TransactionType;
  wallet_id: string;
  category_id: string; // "none" = tanpa kategori
  amount: string;
  transaction_date: string;
  note: string;
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  wallets,
  categories,
  baseCurrency,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletOption[];
  categories: CategoryOption[];
  baseCurrency: string;
  transaction: TransactionFormValue | null; // null = tambah
}) {
  const router = useRouter();
  const isEdit = transaction !== null;

  const form = useForm<FormFields>({
    defaultValues: {
      type: "expense",
      wallet_id: "",
      category_id: "none",
      amount: "",
      transaction_date: todayLocal(),
      note: "",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const type = form.watch("type");
  const walletId = form.watch("wallet_id");
  const selectedWallet = wallets.find((w) => String(w.id) === walletId);

  useEffect(() => {
    if (!open) return;
    form.reset({
      type: transaction?.type ?? "expense",
      wallet_id: transaction
        ? String(transaction.wallet_id)
        : wallets[0]
          ? String(wallets[0].id)
          : "",
      category_id: transaction?.category_id
        ? String(transaction.category_id)
        : "none",
      amount: transaction ? String(parseFloat(transaction.amount)) : "",
      transaction_date: transaction?.transaction_date ?? todayLocal(),
      note: transaction?.note ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function onSubmit(values: FormFields) {
    if (!values.wallet_id) {
      toast.error("Pilih dompet dulu.");
      return;
    }
    const payload = {
      wallet_id: Number(values.wallet_id),
      category_id:
        values.category_id === "none" ? null : Number(values.category_id),
      type: values.type,
      amount: values.amount,
      transaction_date: values.transaction_date,
      note: values.note.trim() === "" ? null : values.note.trim(),
    };
    const res = await fetch(
      isEdit ? `/api/transactions/${transaction.id}` : "/api/transactions",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan transaksi.");
      return;
    }
    toast.success(isEdit ? "Transaksi diperbarui." : "Transaksi dicatat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah Transaksi" : "Catat Transaksi"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail transaksi ini."
              : "Catat pemasukan atau pengeluaran baru."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Toggle tipe */}
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
                  form.setValue("type", opt.value);
                  form.setValue("category_id", "none");
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
            <Label htmlFor="tx-amount">
              Jumlah{selectedWallet ? ` (${selectedWallet.currency})` : ""}
            </Label>
            <Input
              id="tx-amount"
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
            {selectedWallet && selectedWallet.currency !== baseCurrency && (
              <p className="text-xs text-muted-foreground">
                Dicatat dalam {selectedWallet.currency}; dikonversi ke{" "}
                {baseCurrency} di laporan memakai kurs tersimpan.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tx-wallet">Dompet</Label>
              <Select
                value={walletId}
                onValueChange={(v) => form.setValue("wallet_id", v)}
              >
                <SelectTrigger id="tx-wallet" className="h-11 w-full">
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
              <Label htmlFor="tx-category">Kategori</Label>
              <Select
                value={form.watch("category_id")}
                onValueChange={(v) => form.setValue("category_id", v)}
              >
                <SelectTrigger id="tx-category" className="h-11 w-full">
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

          <div className="space-y-2">
            <Label htmlFor="tx-date">Tanggal</Label>
            <Input
              id="tx-date"
              type="date"
              className="h-11"
              aria-invalid={!!errors.transaction_date}
              {...form.register("transaction_date", {
                required: "Tanggal wajib diisi",
              })}
            />
            {errors.transaction_date && (
              <p role="alert" className="text-sm text-destructive">
                {errors.transaction_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-note">Catatan (opsional)</Label>
            <Textarea
              id="tx-note"
              rows={2}
              maxLength={255}
              placeholder="mis. Belanja mingguan"
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
              {isEdit ? "Simpan" : "Catat"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
