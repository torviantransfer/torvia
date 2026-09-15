"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Segmented, Textarea, useToast } from "@/components/admin/ui";
import { LOCALES, LOCALE_LABELS, type Loc } from "../seo/fields";
import type { RegionRow } from "./RegionsScreen";

export interface RegionFormValues {
  id?: string;
  slug: string;
  distance_km: string;
  duration_minutes: string;
  sort_order: string;
  names: Record<Loc, string>;
  descriptions: Record<Loc, string>;
}

const blankLocaleMap = () => Object.fromEntries(LOCALES.map((l) => [l, ""])) as Record<Loc, string>;

export const emptyRegionForm: RegionFormValues = {
  slug: "",
  distance_km: "",
  duration_minutes: "",
  sort_order: "0",
  names: blankLocaleMap(),
  descriptions: blankLocaleMap(),
};

export function toRegionForm(r: RegionRow): RegionFormValues {
  const names = blankLocaleMap();
  const descriptions = blankLocaleMap();
  for (const l of LOCALES) {
    names[l] = (r as unknown as Record<string, string | null>)[`name_${l}`] ?? "";
    descriptions[l] = (r as unknown as Record<string, string | null>)[`description_${l}`] ?? "";
  }
  return {
    id: r.id,
    slug: r.slug,
    distance_km: r.distance_km != null ? String(r.distance_km) : "",
    duration_minutes: r.duration_minutes != null ? String(r.duration_minutes) : "",
    sort_order: String(r.sort_order),
    names,
    descriptions,
  };
}

/**
 * Genel bilgiler + her dil için ad ve açıklama. Meta başlık, meta açıklama ve
 * anahtar kelimeler SEO Yönetimi'nde düzenlenir — burada tekrarlanmaz.
 */
export default function RegionFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: RegionFormValues;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [locale, setLocale] = useState<Loc>("tr");
  const [saving, setSaving] = useState(false);
  const editing = !!initial.id;

  const missing = LOCALES.filter((l) => !form.names[l].trim()).length;

  const save = async () => {
    if (!form.slug.trim() || !form.names.tr.trim() || !form.names.en.trim()) return;
    setSaving(true);
    const data: Record<string, unknown> = {
      slug: form.slug.trim(),
      distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    for (const l of LOCALES) {
      // A blank name falls back to English, so a missing translation still shows something.
      data[`name_${l}`] = form.names[l].trim() || form.names.en.trim();
      data[`description_${l}`] = form.descriptions[l].trim() || null;
    }

    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "regions", action: editing ? "update" : "create", id: initial.id, data }),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Kaydedilemedi.", "error");
      return;
    }
    toast(editing ? "Bölge güncellendi." : "Bölge eklendi.");
    onSaved();
  };

  return (
    <Dialog
      open
      title={editing ? "Bölgeyi düzenle" : "Yeni bölge"}
      onClose={onClose}
      width="sm:max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!form.slug.trim() || !form.names.tr.trim() || !form.names.en.trim()} onClick={save}>
            {editing ? "Kaydet" : "Ekle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Slug" htmlFor="region-slug">
            <Input id="region-slug" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="belek" className="font-mono" />
          </Field>
          <Field label="Mesafe (km)" htmlFor="region-distance">
            <Input id="region-distance" type="number" step="0.1" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))} />
          </Field>
          <Field label="Süre (dk)" htmlFor="region-duration">
            <Input id="region-duration" type="number" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
          </Field>
        </div>
        <Field label="Sıra" htmlFor="region-sort" hint="Site menülerinde ve listelerde sıralama.">
          <Input id="region-sort" type="number" className="w-28" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
        </Field>

        <div className="border-t border-adm-line-2 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] font-semibold uppercase tracking-[.06em] text-adm-muted">Ad ve açıklama</p>
            {missing > 0 && <span className="text-[11.5px] font-medium text-adm-amber">{missing} dilde ad eksik</span>}
          </div>
          <Segmented
            label="Dil"
            value={locale}
            onChange={setLocale}
            className="mb-3 flex-wrap"
            options={LOCALES.map((l) => ({
              value: l,
              label: (
                <span className="inline-flex items-center gap-1">
                  {LOCALE_LABELS[l]}
                  {!form.names[l].trim() && <span aria-hidden="true" className="size-1.5 rounded-full bg-adm-amber" />}
                </span>
              ),
            }))}
          />
          <div className="grid gap-3">
            <Field label={`Ad (${LOCALE_LABELS[locale]})`} htmlFor={`region-name-${locale}`}>
              <Input
                id={`region-name-${locale}`}
                required={locale === "tr" || locale === "en"}
                value={form.names[locale]}
                onChange={(e) => setForm((f) => ({ ...f, names: { ...f.names, [locale]: e.target.value } }))}
                placeholder={locale !== "en" ? form.names.en || undefined : undefined}
              />
            </Field>
            <Field label={`Açıklama (${LOCALE_LABELS[locale]})`} htmlFor={`region-desc-${locale}`}>
              <Textarea
                id={`region-desc-${locale}`}
                rows={3}
                value={form.descriptions[locale]}
                onChange={(e) => setForm((f) => ({ ...f, descriptions: { ...f.descriptions, [locale]: e.target.value } }))}
              />
            </Field>
          </div>
        </div>

        <p className="text-[11.5px] text-adm-muted">Meta başlık, meta açıklama ve anahtar kelimeler SEO Yönetimi&apos;nden düzenlenir.</p>
      </div>
    </Dialog>
  );
}
