"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { formatMoney } from "@/lib/money";
import type { CurrencyOption } from "@/components/auth/register-form";

export interface GoalItem {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  wallet_id: number | null;
  wallet_name: string | null;
  target_date: string | null;
  is_achieved: number;
  percentage: number;
}

export interface WalletBasicOption {
  id: number;
  name: string;
}

export function GoalsView({
  goals,
  wallets,
  currencies,
  baseCurrency,
}: {
  goals: GoalItem[];
  wallets: WalletBasicOption[];
  currencies: CurrencyOption[];
  baseCurrency: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalItem | null>(null);
  const [contributing, setContributing] = useState<GoalItem | null>(null);
  const [deleting, setDeleting] = useState<GoalItem | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/goals/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Gagal menghapus target.");
    else {
      toast.success("Target dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="h-11"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Target
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PiggyBank className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                Belum ada target tabungan
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Mau liburan, dana darurat, atau gadget baru? Buat target dan
                pantau progres menabungmu di sini.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="mt-2 h-11"
            >
              <Plus className="size-4" aria-hidden="true" />
              Buat Target Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{goal.name}</p>
                    {goal.target_date && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        Target{" "}
                        {new Date(
                          `${goal.target_date}T00:00:00`
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  {goal.is_achieved ? (
                    <Badge className="gap-1 bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Tercapai
                    </Badge>
                  ) : null}
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label={`Ubah target ${goal.name}`}
                      onClick={() => {
                        setEditing(goal);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      aria-label={`Hapus target ${goal.name}`}
                      onClick={() => setDeleting(goal)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <Progress
                  value={goal.percentage}
                  aria-label={`Progres ${goal.percentage}%`}
                />

                <div className="flex items-baseline justify-between">
                  <p className="text-sm tabular-nums">
                    <span className="font-semibold">
                      {formatMoney(goal.current_amount, goal.currency)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      / {formatMoney(goal.target_amount, goal.currency)}
                    </span>
                  </p>
                  <p className="text-xs font-medium text-muted-foreground tabular-nums">
                    {goal.percentage}%
                  </p>
                </div>

                {!goal.is_achieved && (
                  <Button
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => setContributing(goal)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Tambah Kontribusi
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        wallets={wallets}
        currencies={currencies}
        baseCurrency={baseCurrency}
        goal={editing}
      />

      <ContributeDialog
        goal={contributing}
        onOpenChange={(open) => !open && setContributing(null)}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus target ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Target &ldquo;{deleting?.name}&rdquo; beserta catatan progresnya
              akan dihapus permanen.
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

function GoalFormDialog({
  open,
  onOpenChange,
  wallets,
  currencies,
  baseCurrency,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: WalletBasicOption[];
  currencies: CurrencyOption[];
  baseCurrency: string;
  goal: GoalItem | null;
}) {
  const router = useRouter();
  const isEdit = goal !== null;
  const [currency, setCurrency] = useState(baseCurrency);
  const [walletId, setWalletId] = useState<string>("none");

  const form = useForm<{ name: string; target_amount: string; target_date: string }>(
    { defaultValues: { name: "", target_amount: "", target_date: "" } }
  );
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: goal?.name ?? "",
      target_amount: goal ? String(parseFloat(goal.target_amount)) : "",
      target_date: goal?.target_date ?? "",
    });
    setCurrency(goal?.currency ?? baseCurrency);
    setWalletId(goal?.wallet_id ? String(goal.wallet_id) : "none");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  async function onSubmit(values: {
    name: string;
    target_amount: string;
    target_date: string;
  }) {
    const payload: Record<string, unknown> = {
      name: values.name,
      target_amount: values.target_amount,
      wallet_id: walletId === "none" ? null : Number(walletId),
      target_date: values.target_date === "" ? null : values.target_date,
    };
    if (!isEdit) payload.currency = currency;

    const res = await fetch(isEdit ? `/api/goals/${goal.id}` : "/api/goals", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan target.");
      return;
    }
    toast.success(isEdit ? "Target diperbarui." : "Target dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Target" : "Tambah Target"}</DialogTitle>
          <DialogDescription>
            Target tabungan dengan progres yang bisa kamu isi bertahap.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nama target</Label>
            <Input
              id="goal-name"
              placeholder="mis. Dana darurat, Liburan"
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

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Nominal target</Label>
              <Input
                id="goal-amount"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder="0"
                className="h-11 tabular-nums"
                aria-invalid={!!errors.target_amount}
                {...form.register("target_amount", {
                  required: "Nominal wajib diisi",
                  validate: (v) =>
                    (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0) ||
                    "Nominal harus lebih dari 0",
                })}
              />
              {errors.target_amount && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.target_amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-currency">Mata uang</Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isEdit}
              >
                <SelectTrigger id="goal-currency" className="h-11 w-24">
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
            <Label htmlFor="goal-wallet">Dompet penampung (opsional)</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger id="goal-wallet" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ditautkan</SelectItem>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-date">Tanggal target (opsional)</Label>
            <Input
              id="goal-date"
              type="date"
              className="h-11"
              {...form.register("target_date")}
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

function ContributeDialog({
  goal,
  onOpenChange,
}: {
  goal: GoalItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const form = useForm<{ amount: string }>({ defaultValues: { amount: "" } });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (goal) form.reset({ amount: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  async function onSubmit(values: { amount: string }) {
    if (!goal) return;
    const res = await fetch(`/api/goals/${goal.id}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: values.amount }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menambah kontribusi.");
      return;
    }
    const data = await res.json();
    toast.success(
      data.goal?.is_achieved
        ? "Selamat! Target tercapai 🎉"
        : "Kontribusi ditambahkan."
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={goal !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Kontribusi</DialogTitle>
          <DialogDescription>
            {goal
              ? `Terkumpul ${formatMoney(goal.current_amount, goal.currency)} dari ${formatMoney(goal.target_amount, goal.currency)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="contrib-amount">
              Nominal{goal ? ` (${goal.currency})` : ""}
            </Label>
            <Input
              id="contrib-amount"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
              className="h-11 tabular-nums"
              aria-invalid={!!errors.amount}
              autoFocus
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
              Tambahkan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
