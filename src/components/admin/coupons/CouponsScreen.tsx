"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Ticket, Trash2 } from "lucide-react";
import {
  Button,
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  PageHeader,
  RowActions,
  Tabs,
  useToast,
  type GridColumn,
} from "@/components/admin/ui";
import CouponFormDialog, { emptyCouponForm, type CouponFormValues } from "./CouponFormDialog";

export interface CouponRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

type Tab = "active" | "expired" | "all";

const isExpired = (c: CouponRow) => !!c.valid_until && new Date(c.valid_until).getTime() < Date.now();
const discountText = (c: CouponRow) => (c.discount_type === "percent" ? `%${c.discount_value}` : `$${c.discount_value.toFixed(2)}`);

const toForm = (c: CouponRow): CouponFormValues => ({
  id: c.id,
  code: c.code,
  discount_type: c.discount_type === "fixed" ? "fixed" : "percent",
  discount_value: String(c.discount_value),
  min_order: String(c.min_order),
  max_uses: String(c.max_uses),
  valid_until: c.valid_until?.slice(0, 10) ?? "",
});

/** Kuponlar: docs/admin-tasarim.md, bölüm 5.11. */
export default function CouponsScreen({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CouponFormValues | null>(null);
  const [deleting, setDeleting] = useState<CouponRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const counts = useMemo(
    () => ({
      active: coupons.filter((c) => c.is_active && !isExpired(c)).length,
      expired: coupons.filter((c) => isExpired(c)).length,
      all: coupons.length,
    }),
    [coupons]
  );

  const rows = useMemo(
    () =>
      coupons
        .filter((c) => (tab === "active" ? c.is_active && !isExpired(c) : tab === "expired" ? isExpired(c) : true))
        .sort((a, b) => (b.valid_from ?? "").localeCompare(a.valid_from ?? "")),
    [coupons, tab]
  );

  const toggle = async (c: CouponRow) => {
    setTogglingId(c.id);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "coupons", action: "toggle", id: c.id }),
    });
    setTogglingId(null);
    if (res.ok) refresh();
    else toast("İşlem yapılamadı.", "error");
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "coupons", action: "delete", id: deleting.id }),
    });
    setBusy(false);
    const result = await res.json().catch(() => null);
    if (res.ok && result?.success) {
      toast(`${deleting.code} silindi.`);
      setDeleting(null);
      refresh();
    } else {
      toast(result?.error ?? "Silinemedi.", "error");
    }
  };

  const columns: GridColumn<CouponRow>[] = [
    { key: "code", header: "Kod", width: "minmax(120px,1fr)", area: "body", cell: (c) => <span className="font-mono text-[13.5px] font-bold">{c.code}</span> },
    { key: "discount", header: "İndirim", width: "100px", area: "top-start", cell: (c) => <span className="text-[13px] font-semibold">{discountText(c)}</span> },
    { key: "usage", header: "Kullanım", width: "110px", area: "foot-start", cell: (c) => <span className="tabular-nums text-[13px] text-adm-ink-2">{c.used_count} / {c.max_uses}</span> },
    {
      key: "validity",
      header: "Geçerlilik",
      width: "140px",
      area: "top-end",
      cell: (c) => <span className="text-[13px] text-adm-ink-2">{c.valid_until ? new Date(c.valid_until).toLocaleDateString("tr-TR") : "Süresi yok"}</span>,
    },
    {
      key: "status",
      header: "Durum",
      width: "110px",
      area: "foot-end",
      cell: (c) => (
        <Chip tone={isExpired(c) ? "neutral" : c.is_active ? "green" : "neutral"} plain>
          {isExpired(c) ? "Süresi doldu" : c.is_active ? "Aktif" : "Pasif"}
        </Chip>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "96px",
      wideOnly: true,
      cell: (c) => (
        <RowActions>
          <button type="button" onClick={() => setEditing(toForm(c))} aria-label="Düzenle" title="Düzenle" className="grid size-7 place-items-center rounded-adm-sm text-adm-ink-2 hover:bg-adm-line-2">
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => toggle(c)} disabled={togglingId === c.id} aria-label={c.is_active ? "Pasife al" : "Aktifleştir"} title={c.is_active ? "Pasife al" : "Aktifleştir"} className="grid size-7 place-items-center rounded-adm-sm text-adm-ink-2 hover:bg-adm-line-2 disabled:opacity-40">
            <Power size={14} aria-hidden="true" className={c.is_active ? "text-adm-green" : "text-adm-faint"} />
          </button>
          <button type="button" onClick={() => setDeleting(c)} aria-label="Sil" title="Sil" className="grid size-7 place-items-center rounded-adm-sm text-adm-rose hover:bg-adm-rose-soft">
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Kuponlar"
        actions={
          <Button variant="primary" icon={Plus} compact onClick={() => setCreating(true)}>
            Kupon ekle
          </Button>
        }
      />

      <Tabs
        label="Kupon listesi"
        value={tab}
        onChange={setTab}
        items={[
          { key: "active", label: "Aktif", count: counts.active },
          { key: "expired", label: "Süresi dolan", count: counts.expired },
          { key: "all", label: "Tümü" },
        ]}
      />

      <DataGrid
        label="Kuponlar"
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        empty={<EmptyState compact icon={Ticket} title="Kupon bulunamadı" action={<Button onClick={() => setCreating(true)}>Kupon ekle</Button>} />}
      />

      {(creating || editing) && (
        <CouponFormDialog
          initial={editing ?? emptyCouponForm}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Kuponu sil"
        message={deleting ? `"${deleting.code}" kalıcı olarak silinecek.` : ""}
        confirmLabel="Sil"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
