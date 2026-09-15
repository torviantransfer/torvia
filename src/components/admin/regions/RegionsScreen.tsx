"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Power, Trash2 } from "lucide-react";
import {
  Button,
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  PageHeader,
  RowActions,
  useToast,
  type GridColumn,
} from "@/components/admin/ui";
import RegionFormDialog, { emptyRegionForm, toRegionForm, type RegionFormValues } from "./RegionFormDialog";

export interface RegionRow {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  distance_km: number | null;
  duration_minutes: number | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

/** Bölgeler: docs/admin-tasarim.md, bölüm 5.12. */
export default function RegionsScreen({ regions }: { regions: RegionRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RegionFormValues | null>(null);
  const [deleting, setDeleting] = useState<RegionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => router.refresh();
  const sorted = [...regions].sort((a, b) => a.sort_order - b.sort_order);

  const toggle = async (r: RegionRow, field: "is_active" | "is_popular") => {
    setTogglingId(`${r.id}:${field}`);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "regions", action: "toggle", id: r.id, data: { field } }),
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
      body: JSON.stringify({ table: "regions", action: "delete", id: deleting.id }),
    });
    setBusy(false);
    const result = await res.json().catch(() => null);
    if (res.ok && result?.success) {
      toast(`${deleting.name_tr} silindi.`);
      setDeleting(null);
      refresh();
    } else {
      toast(result?.error ?? "Silinemedi.", "error");
    }
  };

  const columns: GridColumn<RegionRow>[] = [
    {
      key: "name",
      header: "Bölge",
      width: "minmax(160px,1.3fr)",
      area: "body",
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold">{r.name_en}</div>
          <div className="truncate text-xs text-adm-muted">{r.name_tr}</div>
        </div>
      ),
    },
    { key: "slug", header: "Slug", width: "120px", area: "top-start", cell: (r) => <span className="font-mono text-[12.5px] text-adm-ink-2">{r.slug}</span> },
    { key: "distance", header: "Mesafe", width: "90px", area: "foot-start", cell: (r) => <span className="text-[13px] text-adm-ink-2">{r.distance_km ? `${r.distance_km} km` : "—"}</span> },
    { key: "duration", header: "Süre", width: "80px", area: "foot-start", cell: (r) => <span className="text-[13px] text-adm-ink-2">{r.duration_minutes ? `${r.duration_minutes} dk` : "—"}</span> },
    { key: "sort", header: "Sıra", width: "60px", wideOnly: true, cell: (r) => <span className="tabular-nums text-[13px] text-adm-muted">{r.sort_order}</span> },
    {
      key: "popular",
      header: "Popüler",
      width: "100px",
      area: "top-end",
      cell: (r) => (
        <button type="button" onClick={() => toggle(r, "is_popular")} disabled={togglingId === `${r.id}:is_popular`}>
          <Chip tone={r.is_popular ? "amber" : "neutral"} plain>
            {r.is_popular ? "Popüler" : "Normal"}
          </Chip>
        </button>
      ),
    },
    {
      key: "status",
      header: "Durum",
      width: "100px",
      area: "foot-end",
      cell: (r) => (
        <Chip tone={r.is_active ? "green" : "neutral"} plain>
          {r.is_active ? "Aktif" : "Pasif"}
        </Chip>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "96px",
      wideOnly: true,
      cell: (r) => (
        <RowActions>
          <button type="button" onClick={() => setEditing(toRegionForm(r))} aria-label="Düzenle" title="Düzenle" className="grid size-7 place-items-center rounded-adm-sm text-adm-ink-2 hover:bg-adm-line-2">
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => toggle(r, "is_active")} disabled={togglingId === `${r.id}:is_active`} aria-label={r.is_active ? "Pasife al" : "Aktifleştir"} title={r.is_active ? "Pasife al" : "Aktifleştir"} className="grid size-7 place-items-center rounded-adm-sm text-adm-ink-2 hover:bg-adm-line-2 disabled:opacity-40">
            <Power size={14} aria-hidden="true" className={r.is_active ? "text-adm-green" : "text-adm-faint"} />
          </button>
          <button type="button" onClick={() => setDeleting(r)} aria-label="Sil" title="Sil" className="grid size-7 place-items-center rounded-adm-sm text-adm-rose hover:bg-adm-rose-soft">
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bölgeler"
        actions={
          <Button variant="primary" icon={Plus} compact onClick={() => setCreating(true)}>
            Bölge ekle
          </Button>
        }
      />

      <DataGrid
        label="Bölgeler"
        columns={columns}
        rows={sorted}
        rowKey={(r) => r.id}
        empty={<EmptyState compact icon={MapPin} title="Bölge yok" action={<Button onClick={() => setCreating(true)}>Bölge ekle</Button>} />}
      />

      {(creating || editing) && (
        <RegionFormDialog
          initial={editing ?? emptyRegionForm}
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
        title="Bölgeyi sil"
        message={deleting ? `"${deleting.name_tr}" silinecek. Bu bölgenin bütün fiyatları da silinir.` : ""}
        confirmLabel="Sil"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
