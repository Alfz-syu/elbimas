"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { TransactionType } from "@/db/schema-types";
import {
  TransactionFormDialog,
  type CategoryOption,
  type TransactionFormValue,
  type WalletOption,
} from "./transaction-form-dialog";

export interface TransactionItem {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  fx_rate_to_base: string;
  note: string | null;
  transaction_date: string;
}

export function TransactionsView({
  transactions,
  total,
  page,
  perPage,
  wallets,
  categories,
  baseCurrency,
}: {
  transactions: TransactionItem[];
  total: number;
  page: number;
  perPage: number;
  wallets: WalletOption[];
  categories: CategoryOption[];
  baseCurrency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionFormValue | null>(null);
  const [deleting, setDeleting] = useState<TransactionItem | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function setParam(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam({ q: search || null });
  }

  const hasFilter = ["q", "type", "wallet_id", "category_id", "from", "to"].some(
    (k) => searchParams.get(k)
  );

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/transactions/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Gagal menghapus transaksi.");
    } else {
      toast.success("Transaksi dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  // Kelompokkan per tanggal
  const groups = new Map<string, TransactionItem[]>();
  for (const tx of transactions) {
    const list = groups.get(tx.transaction_date) ?? [];
    list.push(tx);
    groups.set(tx.transaction_date, list);
  }

  return (
    <>
      {/* Bar filter */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan transaksi…"
              aria-label="Cari catatan transaksi"
              className="h-11 pl-9"
            />
          </form>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11">
            <Plus className="size-4" aria-hidden="true" />
            Catat Transaksi
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.get("type") ?? "all"}
            onValueChange={(v) => setParam({ type: v === "all" ? null : v })}
          >
            <SelectTrigger className="h-10 w-36" aria-label="Filter tipe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua tipe</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("wallet_id") ?? "all"}
            onValueChange={(v) =>
              setParam({ wallet_id: v === "all" ? null : v })
            }
          >
            <SelectTrigger className="h-10 w-40" aria-label="Filter dompet">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua dompet</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("category_id") ?? "all"}
            onValueChange={(v) =>
              setParam({ category_id: v === "all" ? null : v })
            }
          >
            <SelectTrigger className="h-10 w-44" aria-label="Filter kategori">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="sr-only sm:not-sr-only">Dari</span>
            <Input
              type="date"
              aria-label="Tanggal mulai"
              className="h-10 w-36"
              value={searchParams.get("from") ?? ""}
              onChange={(e) => setParam({ from: e.target.value || null })}
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="sr-only sm:not-sr-only">s.d.</span>
            <Input
              type="date"
              aria-label="Tanggal akhir"
              className="h-10 w-36"
              value={searchParams.get("to") ?? ""}
              onChange={(e) => setParam({ to: e.target.value || null })}
            />
          </label>

          {hasFilter && (
            <Button
              variant="ghost"
              className="h-10"
              onClick={() => {
                setSearch("");
                startTransition(() => router.push(pathname));
              }}
            >
              <X className="size-4" aria-hidden="true" />
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      {/* Daftar transaksi */}
      {transactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptText className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                {hasFilter ? "Tidak ada hasil" : "Belum ada transaksi"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {hasFilter
                  ? "Coba ubah atau bersihkan filter pencarianmu."
                  : "Mulai catat pemasukan dan pengeluaranmu untuk melihat ke mana uangmu pergi."}
              </p>
            </div>
            {!hasFilter && (
              <Button
                onClick={() => { setEditing(null); setFormOpen(true); }}
                className="mt-2 h-11"
              >
                <Plus className="size-4" aria-hidden="true" />
                Catat Transaksi Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date} aria-label={date}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {format(parseISO(date), "EEEE, d MMMM yyyy", {
                  locale: localeId,
                })}
              </h2>
              <Card className="py-0">
                <CardContent className="divide-y p-0">
                  {items.map((tx) => (
                    <TransactionRowItem
                      key={tx.id}
                      tx={tx}
                      onEdit={() => {
                        setEditing({
                          id: tx.id,
                          wallet_id: tx.wallet_id,
                          category_id: tx.category_id,
                          type: tx.type,
                          amount: tx.amount,
                          note: tx.note,
                          transaction_date: tx.transaction_date,
                        });
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(tx)}
                    />
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Navigasi halaman"
          className="mt-6 flex items-center justify-between"
        >
          <p className="text-sm text-muted-foreground">
            {total} transaksi · Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page <= 1}
              aria-label="Halaman sebelumnya"
              onClick={() => setParam({ page: String(page - 1) })}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page >= totalPages}
              aria-label="Halaman berikutnya"
              onClick={() => setParam({ page: String(page + 1) })}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        wallets={wallets}
        categories={categories}
        baseCurrency={baseCurrency}
        transaction={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi{" "}
              {deleting
                ? `${formatMoney(deleting.amount, deleting.currency)} (${
                    deleting.note ?? deleting.category_name ?? "tanpa catatan"
                  })`
                : ""}{" "}
              akan dihapus permanen dan saldo dompet ikut terkoreksi.
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

function TransactionRowItem({
  tx,
  onEdit,
  onDelete,
}: {
  tx: TransactionItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const income = tx.type === "income";
  const accent = tx.category_color ?? (income ? "#0E7B5D" : "#64748B");

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {tx.note ?? tx.category_name ?? (income ? "Pemasukan" : "Pengeluaran")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {tx.category_name ?? "Tanpa kategori"} · {tx.wallet_name}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            income ? "text-primary" : "text-foreground"
          )}
        >
          {income ? "+" : "−"}
          {formatMoney(tx.amount, tx.currency)}
        </p>
        {tx.currency !== "IDR" && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            {tx.currency}
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Ubah transaksi"
          onClick={onEdit}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-destructive"
          aria-label="Hapus transaksi"
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
