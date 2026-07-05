"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { WALLET_COLORS, WALLET_TYPE_LABELS } from "@/lib/wallet-ui";
import { cn } from "@/lib/utils";
import type { WalletType } from "@/db/schema-types";
import type { CurrencyOption } from "@/components/auth/register-form";

export interface WalletFormValue {
  id?: number;
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
  color: string | null;
}

interface FormFields {
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
}

export function WalletFormDialog({
  open,
  onOpenChange,
  currencies,
  baseCurrency,
  wallet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: CurrencyOption[];
  baseCurrency: string;
  wallet: WalletFormValue | null; // null = mode tambah
}) {
  const router = useRouter();
  const isEdit = wallet !== null;
  const [color, setColor] = useState<string | null>(null);

  const form = useForm<FormFields>({
    defaultValues: {
      name: "",
      type: "cash",
      currency: baseCurrency,
      initial_balance: "0",
    },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: wallet?.name ?? "",
      type: wallet?.type ?? "cash",
      currency: wallet?.currency ?? baseCurrency,
      initial_balance: wallet
        ? String(parseFloat(wallet.initial_balance))
        : "0",
    });
    setColor(wallet?.color ?? WALLET_COLORS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallet]);

  async function onSubmit(values: FormFields) {
    const payload = {
      name: values.name,
      type: values.type,
      initial_balance: values.initial_balance || "0",
      color,
      ...(isEdit ? {} : { currency: values.currency }),
    };
    const res = await fetch(
      isEdit ? `/api/wallets/${wallet.id}` : "/api/wallets",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan dompet.");
      return;
    }
    toast.success(isEdit ? "Dompet diperbarui." : "Dompet baru dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Dompet" : "Tambah Dompet"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail dompet ini."
              : "Buat dompet/rekening baru untuk mencatat transaksi."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="wallet-name">Nama dompet</Label>
            <Input
              id="wallet-name"
              placeholder="mis. BCA, GoPay, Dompet Tunai"
              className="h-11"
              aria-invalid={!!errors.name}
              {...form.register("name", { required: "Nama wajib diisi" })}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wallet-type">Jenis</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as WalletType)}
              >
                <SelectTrigger id="wallet-type" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WALLET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-currency">Mata uang</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(v) => form.setValue("currency", v)}
                disabled={isEdit}
              >
                <SelectTrigger id="wallet-currency" className="h-11 w-full">
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
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Mata uang tidak bisa diubah.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet-balance">Saldo awal</Label>
            <Input
              id="wallet-balance"
              type="number"
              step="any"
              inputMode="decimal"
              className="h-11"
              aria-invalid={!!errors.initial_balance}
              {...form.register("initial_balance", {
                validate: (v) =>
                  v === "" || /^-?\d+(\.\d+)?$/.test(v) || "Nominal tidak valid",
              })}
            />
            {errors.initial_balance && (
              <p role="alert" className="text-sm text-destructive">
                {errors.initial_balance.message}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Warna</legend>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Pilih warna ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    "size-8 rounded-full transition-transform hover:scale-110",
                    color === c &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </fieldset>

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
