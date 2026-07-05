"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  ArrowLeftRight,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { WALLET_TYPE_ICONS, WALLET_TYPE_LABELS } from "@/lib/wallet-ui";
import { cn } from "@/lib/utils";
import type { WalletType } from "@/db/schema-types";
import type { CurrencyOption } from "@/components/auth/register-form";
import {
  WalletFormDialog,
  type WalletFormValue,
} from "./wallet-form-dialog";
import { TransferDialog } from "./transfer-dialog";

export interface WalletItem {
  id: number;
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
  color: string | null;
  icon: string | null;
  is_archived: number;
  balance: string;
}

export function WalletsView({
  wallets,
  currencies,
  baseCurrency,
}: {
  wallets: WalletItem[];
  currencies: CurrencyOption[];
  baseCurrency: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<WalletFormValue | null>(null);
  const [deleting, setDeleting] = useState<WalletItem | null>(null);

  const active = wallets.filter((w) => !w.is_archived);
  const archived = wallets.filter((w) => w.is_archived);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(wallet: WalletItem) {
    setEditing({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency,
      initial_balance: wallet.initial_balance,
      color: wallet.color,
    });
    setFormOpen(true);
  }

  async function toggleArchive(wallet: WalletItem) {
    const res = await fetch(`/api/wallets/${wallet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: !wallet.is_archived }),
    });
    if (!res.ok) {
      toast.error("Gagal mengubah status arsip.");
      return;
    }
    toast.success(
      wallet.is_archived ? "Dompet diaktifkan kembali." : "Dompet diarsipkan."
    );
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/wallets/${deleting.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error?.message ?? "Gagal menghapus dompet.");
    } else {
      toast.success("Dompet dihapus.");
      router.refresh();
    }
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        {active.length >= 2 && (
          <Button
            variant="outline"
            onClick={() => setTransferOpen(true)}
            className="h-11"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Transfer
          </Button>
        )}
        <Button onClick={openCreate} className="h-11">
          <Plus className="size-4" aria-hidden="true" />
          Tambah Dompet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletIcon className="size-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-lg font-semibold">
                Belum ada dompet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Dompet adalah tempat transaksimu dicatat — rekening bank,
                e-wallet, atau uang tunai. Buat dompet pertamamu untuk mulai.
              </p>
            </div>
            <Button onClick={openCreate} className="mt-2 h-11">
              <Plus className="size-4" aria-hidden="true" />
              Buat Dompet Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={() => openEdit(wallet)}
              onArchive={() => toggleArchive(wallet)}
              onDelete={() => setDeleting(wallet)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-heading text-lg font-semibold text-muted-foreground">
            Diarsipkan
          </h2>
          <div className="grid gap-4 opacity-70 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onEdit={() => openEdit(wallet)}
                onArchive={() => toggleArchive(wallet)}
                onDelete={() => setDeleting(wallet)}
              />
            ))}
          </div>
        </section>
      )}

      <WalletFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currencies={currencies}
        baseCurrency={baseCurrency}
        wallet={editing}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        wallets={wallets}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dompet ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Dompet &ldquo;{deleting?.name}&rdquo; akan dihapus permanen.
              Dompet yang masih punya transaksi tidak bisa dihapus — arsipkan
              saja.
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

function WalletCard({
  wallet,
  onEdit,
  onArchive,
  onDelete,
}: {
  wallet: WalletItem;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const Icon = WALLET_TYPE_ICONS[wallet.type];
  const accent = wallet.color ?? "#0E7B5D";
  const negative = wallet.balance.startsWith("-");

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <CardContent className="flex items-start gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{wallet.name}</p>
            {wallet.is_archived ? (
              <Badge variant="secondary" className="shrink-0">
                Arsip
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {WALLET_TYPE_LABELS[wallet.type]} · {wallet.currency}
          </p>
          <p
            className={cn(
              "mt-2 truncate font-heading text-xl font-bold tabular-nums",
              negative && "text-destructive"
            )}
          >
            {formatMoney(wallet.balance, wallet.currency)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              aria-label={`Menu dompet ${wallet.name}`}
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive}>
              {wallet.is_archived ? (
                <>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  Aktifkan lagi
                </>
              ) : (
                <>
                  <Archive className="size-4" aria-hidden="true" />
                  Arsipkan
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
