"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import type { WalletItem } from "./wallets-view";

interface FormFields {
  from_wallet_id: string;
  to_wallet_id: string;
  from_amount: string;
  to_amount: string;
  fee: string;
  transfer_date: string;
  note: string;
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TransferDialog({
  open,
  onOpenChange,
  wallets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletItem[];
}) {
  const router = useRouter();
  const active = wallets.filter((w) => !w.is_archived);

  const form = useForm<FormFields>({
    defaultValues: {
      from_wallet_id: "",
      to_wallet_id: "",
      from_amount: "",
      to_amount: "",
      fee: "0",
      transfer_date: todayLocal(),
      note: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      from_wallet_id: active[0] ? String(active[0].id) : "",
      to_wallet_id: active[1] ? String(active[1].id) : "",
      from_amount: "",
      to_amount: "",
      fee: "0",
      transfer_date: todayLocal(),
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fromWallet = active.find(
    (w) => String(w.id) === form.watch("from_wallet_id")
  );
  const toWallet = active.find(
    (w) => String(w.id) === form.watch("to_wallet_id")
  );
  const crossCurrency =
    fromWallet && toWallet && fromWallet.currency !== toWallet.currency;

  async function onSubmit(values: FormFields) {
    if (!fromWallet || !toWallet) {
      toast.error("Pilih dompet asal dan tujuan.");
      return;
    }
    const toAmount = crossCurrency ? values.to_amount : values.from_amount;
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_wallet_id: Number(values.from_wallet_id),
        to_wallet_id: Number(values.to_wallet_id),
        from_amount: values.from_amount,
        to_amount: toAmount,
        fee: values.fee || "0",
        transfer_date: values.transfer_date,
        note: values.note.trim() === "" ? null : values.note.trim(),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal membuat transfer.");
      return;
    }
    toast.success("Transfer dicatat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Antar Dompet</DialogTitle>
          <DialogDescription>
            Pindahkan dana antar dompetmu, termasuk beda mata uang.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="tf-from">Dari</Label>
              <Select
                value={form.watch("from_wallet_id")}
                onValueChange={(v) => form.setValue("from_wallet_id", v)}
              >
                <SelectTrigger id="tf-from" className="h-11 w-full">
                  <SelectValue placeholder="Dompet asal" />
                </SelectTrigger>
                <SelectContent>
                  {active.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} ({w.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight
              className="mb-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="space-y-2">
              <Label htmlFor="tf-to">Ke</Label>
              <Select
                value={form.watch("to_wallet_id")}
                onValueChange={(v) => form.setValue("to_wallet_id", v)}
              >
                <SelectTrigger id="tf-to" className="h-11 w-full">
                  <SelectValue placeholder="Dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {active
                    .filter((w) => String(w.id) !== form.watch("from_wallet_id"))
                    .map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name} ({w.currency})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fromWallet && (
            <p className="text-xs text-muted-foreground">
              Saldo {fromWallet.name}:{" "}
              {formatMoney(fromWallet.balance, fromWallet.currency)}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="tf-amount">
              Jumlah keluar{fromWallet ? ` (${fromWallet.currency})` : ""}
            </Label>
            <Input
              id="tf-amount"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
              className="h-11 tabular-nums"
              aria-invalid={!!errors.from_amount}
              {...form.register("from_amount", {
                required: "Jumlah wajib diisi",
                validate: (v) =>
                  (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                  "Jumlah harus lebih dari 0",
              })}
            />
            {errors.from_amount && (
              <p role="alert" className="text-sm text-destructive">
                {errors.from_amount.message}
              </p>
            )}
          </div>

          {crossCurrency && (
            <div className="space-y-2">
              <Label htmlFor="tf-to-amount">
                Jumlah diterima ({toWallet.currency})
              </Label>
              <Input
                id="tf-to-amount"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="0"
                className="h-11 tabular-nums"
                aria-invalid={!!errors.to_amount}
                {...form.register("to_amount", {
                  validate: (v) =>
                    !crossCurrency ||
                    (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                    "Isi jumlah yang diterima di dompet tujuan",
                })}
              />
              <p className="text-xs text-muted-foreground">
                Mata uang berbeda ({fromWallet.currency} →{" "}
                {toWallet.currency}) — isi jumlah yang benar-benar diterima
                sesuai kurs yang kamu pakai.
              </p>
              {errors.to_amount && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.to_amount.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tf-fee">
                Biaya admin{fromWallet ? ` (${fromWallet.currency})` : ""}
              </Label>
              <Input
                id="tf-fee"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                className="h-11 tabular-nums"
                {...form.register("fee", {
                  validate: (v) =>
                    v === "" ||
                    (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) >= 0) ||
                    "Biaya tidak valid",
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tf-date">Tanggal</Label>
              <Input
                id="tf-date"
                type="date"
                className="h-11"
                {...form.register("transfer_date", {
                  required: "Tanggal wajib diisi",
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tf-note">Catatan (opsional)</Label>
            <Input
              id="tf-note"
              maxLength={255}
              placeholder="mis. Top up e-wallet"
              className="h-11"
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
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
