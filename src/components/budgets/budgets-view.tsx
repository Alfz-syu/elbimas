"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  PieChart,
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
import { cn } from "@/lib/utils";

export interface BudgetItem {
  id: number;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  amount: string;
  currency: string;
  period_month: string;
  spent: string;
  remaining: string;
  percentage: number;
  is_over: boolean;
}

export interface ExpenseCategoryOption {
  id: number;
  name: string;
}

export function BudgetsView({
  budgets,
  categories,
  month,
  baseCurrency,
}: {
  budgets: BudgetItem[];
  categories: ExpenseCategoryOption[];
  month: string;
  baseCurrency: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleting, setDeleting] = useState<BudgetItem | null>(null);

  const usedCategoryIds = new Set(
    budgets.filter((b) => b.category_id !== null).map((b) => b.category_id)
  );
  const availableCategories = categories.filter(
    (c) => !usedCategoryIds.has(c.id)
  );
  const hasTotalBudget = budgets.some((b) => b.category_id === null);

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/budgets/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) toast.error("Gagal menghapus budget.");
    else {
      toast.success("Budget dihapus.");
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
          Tambah Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PieChart className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                Belum ada budget bulan ini
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Tetapkan batas pengeluaran per kategori supaya belanjamu
                terkendali. Realisasi dihitung otomatis dari transaksimu.
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
              Buat Budget Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => {
                setEditing(budget);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(budget)}
            />
          ))}
        </div>
      )}

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={availableCategories}
        canCreateTotal={!hasTotalBudget}
        month={month}
        baseCurrency={baseCurrency}
        budget={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus budget ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Budget {deleting?.category_name ?? "Total"} untuk bulan ini akan
              dihapus. Transaksimu tidak terpengaruh.
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

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isTotal = budget.category_id === null;
  const accent = budget.category_color ?? "#0E7B5D";

  return (
    <Card className={cn(budget.is_over && "border-destructive/50")}>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: isTotal ? "#0E7B5D" : accent }}
          />
          <p className="min-w-0 flex-1 truncate font-medium">
            {isTotal ? "Total Pengeluaran" : budget.category_name}
          </p>
          {budget.is_over && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3" aria-hidden="true" />
              Over
            </Badge>
          )}
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Ubah budget"
              onClick={onEdit}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              aria-label="Hapus budget"
              onClick={onDelete}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <Progress
          value={Math.min(100, budget.percentage)}
          aria-label={`Terpakai ${budget.percentage}%`}
          className={cn(
            budget.is_over && "[&>[data-slot=progress-indicator]]:bg-destructive"
          )}
        />

        <div className="flex items-baseline justify-between text-sm">
          <p className="tabular-nums">
            <span
              className={cn(
                "font-semibold",
                budget.is_over && "text-destructive"
              )}
            >
              {formatMoney(budget.spent, budget.currency)}
            </span>{" "}
            <span className="text-muted-foreground">
              / {formatMoney(budget.amount, budget.currency)}
            </span>
          </p>
          <p
            className={cn(
              "text-xs tabular-nums",
              budget.is_over ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {budget.is_over
              ? `Lebih ${formatMoney(budget.remaining.replace("-", ""), budget.currency)}`
              : `Sisa ${formatMoney(budget.remaining, budget.currency)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetFormDialog({
  open,
  onOpenChange,
  categories,
  canCreateTotal,
  month,
  baseCurrency,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategoryOption[];
  canCreateTotal: boolean;
  month: string;
  baseCurrency: string;
  budget: BudgetItem | null;
}) {
  const router = useRouter();
  const isEdit = budget !== null;
  const [categoryId, setCategoryId] = useState<string>("total");

  const form = useForm<{ amount: string }>({
    defaultValues: { amount: "" },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      amount: budget ? String(parseFloat(budget.amount)) : "",
    });
    setCategoryId(
      budget
        ? budget.category_id === null
          ? "total"
          : String(budget.category_id)
        : canCreateTotal
          ? "total"
          : categories[0]
            ? String(categories[0].id)
            : "total"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget]);

  async function onSubmit(values: { amount: string }) {
    const res = isEdit
      ? await fetch(`/api/budgets/${budget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: values.amount }),
        })
      : await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: categoryId === "total" ? null : Number(categoryId),
            amount: values.amount,
            period_month: month,
          }),
        });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menyimpan budget.");
      return;
    }
    toast.success(isEdit ? "Budget diperbarui." : "Budget dibuat.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Budget" : "Tambah Budget"}</DialogTitle>
          <DialogDescription>
            Batas pengeluaran dalam {baseCurrency} untuk bulan{" "}
            {new Date(`${month}-01T00:00:00`).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
            .
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="budget-category">Kategori</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isEdit}
            >
              <SelectTrigger id="budget-category" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(canCreateTotal || (isEdit && budget?.category_id === null)) && (
                  <SelectItem value="total">
                    Total pengeluaran (semua kategori)
                  </SelectItem>
                )}
                {isEdit && budget?.category_id !== null && (
                  <SelectItem value={String(budget?.category_id)}>
                    {budget?.category_name}
                  </SelectItem>
                )}
                {!isEdit &&
                  categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Kategori tidak bisa diubah — hapus dan buat baru bila perlu.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount">Nominal ({baseCurrency})</Label>
            <Input
              id="budget-amount"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="0"
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
