"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Luggage, Pencil, Plus, Tags, Trash2, Users } from "lucide-react";
import {
  Button,
  ButtonLink,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  cx,
  useToast,
} from "@/components/admin/ui";
import CategoryFormDialog, { emptyCategoryForm, type CategoryFormValues } from "./CategoryFormDialog";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  max_passengers: number;
  max_luggage: number;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

const FEATURE_LABEL: Record<string, string> = {
  ac: "Klima",
  wifi: "Wi-Fi",
  water: "Su ikramı",
  leather: "Deri döşeme",
  usb: "USB şarj",
  tv: "Ekran / TV",
  minibar: "Minibar",
};

const toForm = (c: CategoryRow): CategoryFormValues => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description ?? "",
  image_url: c.image_url ?? "",
  max_passengers: String(c.max_passengers),
  max_luggage: String(c.max_luggage),
  sort_order: String(c.sort_order),
  features: c.features ?? [],
});

/** Araç Tipleri: the vehicle classes offered in booking. docs/admin-tasarim.md, bölüm 5.7. */
export default function VehicleCategoriesScreen({ categories, adminBase }: { categories: CategoryRow[]; adminBase: string }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CategoryFormValues | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const toggle = async (c: CategoryRow) => {
    setTogglingId(c.id);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "vehicle_categories", action: "toggle", id: c.id }),
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
      body: JSON.stringify({ table: "vehicle_categories", action: "delete", id: deleting.id }),
    });
    setBusy(false);
    const result = await res.json().catch(() => null);
    if (res.ok && result?.success) {
      toast(`${deleting.name} silindi.`);
      setDeleting(null);
      refresh();
    } else {
      toast(result?.error ?? "Silinemedi.", "error");
    }
  };

  return (
    <>
      <div className="mb-1 mt-3 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">Araç Tipleri</h1>
          <p className="mt-1 text-[13px] text-adm-muted">
            Rezervasyon ekranında müşterinin seçtiği araçlar. Fiyatlar{" "}
            <a href={`${adminBase}/pricing`} className="font-semibold text-adm-brand-ink hover:underline">
              Fiyatlandırma
            </a>{" "}
            sayfasından yönetilir.
          </p>
        </div>
        <Button variant="primary" icon={Plus} compact className="ms-auto" onClick={() => setCreating(true)}>
          Araç ekle
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="Henüz araç tipi yok" action={<Button onClick={() => setCreating(true)}>Araç ekle</Button>} />
      ) : (
        <div className="mt-5 grid gap-4 min-[600px]:grid-cols-2 min-[1181px]:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className={cx("overflow-hidden rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm", !c.is_active && "opacity-60")}>
              <div className="grid h-32 place-items-center border-b border-adm-line-2 bg-adm-surface-2">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-full max-w-full object-contain p-3" />
                ) : (
                  <Car size={28} aria-hidden="true" className="text-adm-faint" />
                )}
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold">{c.name}</p>
                    <p className="truncate font-mono text-[11px] text-adm-faint">{c.slug}</p>
                  </div>
                  <button type="button" onClick={() => toggle(c)} disabled={togglingId === c.id} className="shrink-0">
                    <Chip tone={c.is_active ? "green" : "neutral"} plain>
                      {c.is_active ? "Aktif" : "Pasif"}
                    </Chip>
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-3 text-[12.5px] text-adm-ink-2">
                  <span className="flex items-center gap-1">
                    <Users size={13} aria-hidden="true" className="text-adm-faint" />
                    {c.max_passengers}
                  </span>
                  <span className="flex items-center gap-1">
                    <Luggage size={13} aria-hidden="true" className="text-adm-faint" />
                    {c.max_luggage}
                  </span>
                </div>

                {c.features?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.features.map((f) => (
                      <Chip key={f} plain>
                        {FEATURE_LABEL[f] ?? f}
                      </Chip>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5">
                  <ButtonLink href={`${adminBase}/pricing`} size="sm" variant="ghost">
                    Fiyatlandır
                  </ButtonLink>
                  <div className="ms-auto flex gap-0.5">
                    <IconButton icon={Pencil} label="Düzenle" size="sm" onClick={() => setEditing(toForm(c))} />
                    <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => setDeleting(c)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryFormDialog
          initial={editing ?? emptyCategoryForm}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(notice) => {
            setCreating(false);
            setEditing(null);
            if (notice) toast(notice);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Araç tipini sil"
        message={deleting ? `"${deleting.name}" silinecek. Bu aracın bütün bölgelerdeki fiyatları da silinir. Geçici olarak kaldırmak için pasife alabilirsiniz.` : ""}
        confirmLabel="Sil"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
