"use client";

import { useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { Button, Dialog, Field, Input, Textarea, cx, useToast } from "@/components/admin/ui";

export interface CategoryFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  max_passengers: string;
  max_luggage: string;
  sort_order: string;
  features: string[];
}

export const emptyCategoryForm: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  max_passengers: "5",
  max_luggage: "5",
  sort_order: "0",
  features: [],
};

/** The feature keys the booking flow knows how to render. */
const FEATURES: [key: string, label: string][] = [
  ["ac", "Klima"],
  ["wifi", "Wi-Fi"],
  ["water", "Su ikramı"],
  ["leather", "Deri döşeme"],
  ["usb", "USB şarj"],
  ["tv", "Ekran / TV"],
  ["minibar", "Minibar"],
];

function slugify(value: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u" };
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıİöşü]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: CategoryFormValues;
  onClose: () => void;
  onSaved: (notice?: string) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editing = !!initial.id;

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleFeature = (key: string) =>
    setForm((f) => ({ ...f, features: f.features.includes(key) ? f.features.filter((x) => x !== key) : [...f.features, key] }));

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "vehicles");
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    const result = await res.json();
    setUploading(false);
    if (result.url) set("image_url", result.url);
    else toast(result.error ?? "Görsel yüklenemedi.", "error");
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      max_passengers: parseInt(form.max_passengers, 10) || 1,
      max_luggage: parseInt(form.max_luggage, 10) || 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
      features: form.features,
    };

    if (editing) {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "vehicle_categories", action: "update", id: initial.id, data: payload }),
      });
      setSaving(false);
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.data) {
        toast(result?.error ?? "Kaydedilemedi.", "error");
        return;
      }
      toast("Araç tipi güncellendi.");
      onSaved();
      return;
    }

    // Creation goes through its own endpoint, which also copies a price for
    // every region from an existing vehicle so the new one is not unpriceable.
    const res = await fetch("/api/admin/vehicle-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Araç tipi eklenemedi.", "error");
      return;
    }
    onSaved(`${result.data.name} eklendi. ${result.clonedCount} bölge için fiyat "${result.clonedFrom}" aracından kopyalandı — Fiyatlandırma'dan düzenleyin.`);
  };

  return (
    <Dialog
      open
      title={editing ? "Araç tipini düzenle" : "Yeni araç tipi"}
      onClose={onClose}
      width="sm:max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!form.name.trim() || uploading} onClick={save}>
            {editing ? "Kaydet" : "Ekle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Araç adı" htmlFor="cat-name">
            <Input
              id="cat-name"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                // Only auto-fill while creating: changing an existing slug
                // would break the pricing rows that reference it.
                setForm((f) => ({ ...f, name, slug: editing ? f.slug : slugify(name) }));
              }}
              placeholder="Mercedes Sprinter VIP"
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="cat-slug"
            hint={editing ? "Değiştirilemez — fiyat kayıtları buna bağlı." : undefined}
          >
            <Input id="cat-slug" required disabled={editing} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="sprinter-vip" className="font-mono" />
          </Field>
        </div>

        <Field label="Açıklama" htmlFor="cat-desc">
          <Textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="10 kişiye kadar geniş iç hacim, yüksek tavan" />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Kişi kapasitesi" htmlFor="cat-pax">
            <Input id="cat-pax" type="number" min={1} max={40} required value={form.max_passengers} onChange={(e) => set("max_passengers", e.target.value)} />
          </Field>
          <Field label="Bagaj kapasitesi" htmlFor="cat-luggage">
            <Input id="cat-luggage" type="number" min={0} max={40} value={form.max_luggage} onChange={(e) => set("max_luggage", e.target.value)} />
          </Field>
          <Field label="Sıra" htmlFor="cat-sort">
            <Input id="cat-sort" type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
          </Field>
        </div>

        <Field label="Özellikler">
          <div className="flex flex-wrap gap-1.5">
            {FEATURES.map(([key, label]) => {
              const on = form.features.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFeature(key)}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                    on ? "border-adm-ink bg-adm-ink text-white" : "border-adm-line text-adm-ink-2 hover:border-adm-line-strong"
                  )}
                >
                  {on && <Check size={12} aria-hidden="true" />}
                  {label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Görsel">
          <div className="flex items-start gap-3">
            <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-adm border border-adm-line bg-adm-surface-2">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[11px] text-adm-faint">Görsel yok</span>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-surface px-3 py-2 text-[13px] font-semibold text-adm-ink-2 hover:bg-adm-surface-2">
                {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
                {form.image_url ? "Görseli değiştir" : "Görsel yükle"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.image_url && (
                <button type="button" onClick={() => set("image_url", "")} className="text-start text-xs font-semibold text-adm-rose hover:underline">
                  Görseli kaldır
                </button>
              )}
              <p className="max-w-xs text-[11px] text-adm-muted">Şeffaf arka planlı PNG en iyi sonucu verir. En fazla 5MB.</p>
            </div>
          </div>
        </Field>

        {!editing && (
          <p className="rounded-adm-sm border border-adm-blue-soft bg-adm-blue-soft px-3 py-2.5 text-[12px] leading-relaxed text-[#1a3f8f]">
            Yeni araç eklendiğinde her bölge için fiyat mevcut araçtan kopyalanır. Fiyatları Fiyatlandırma sayfasından düzenleyin.
          </p>
        )}
      </div>
    </Dialog>
  );
}
