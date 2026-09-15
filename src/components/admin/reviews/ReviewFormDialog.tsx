"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Dialog, Field, Input, Select, Textarea, cx, useToast } from "@/components/admin/ui";
import { LOCALES, LOCALE_LABELS, type Loc } from "../seo/fields";
import type { AdminReview, ReviewRegion } from "./ReviewsScreen";

const SOURCES = [
  { value: "site", label: "Site (rezervasyon sonrası)" },
  { value: "google", label: "Google" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "manual", label: "Elle eklendi" },
] as const;

export interface ReviewFormValues {
  id?: string;
  rating: number;
  comment: string;
  author_name: string;
  author_country: string;
  region_id: string;
  locale: string;
  source: string;
  published_at: string;
  is_approved: boolean;
  is_featured: boolean;
}

export const emptyReviewForm: ReviewFormValues = {
  rating: 5,
  comment: "",
  author_name: "",
  author_country: "",
  region_id: "",
  locale: "",
  source: "manual",
  published_at: new Date().toISOString().slice(0, 10),
  is_approved: true,
  is_featured: false,
};

export const toReviewForm = (r: AdminReview): ReviewFormValues => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment ?? "",
  author_name: r.author_name ?? r.customers?.first_name ?? "",
  author_country: r.author_country ?? "",
  region_id: r.region_id ?? "",
  locale: r.locale ?? "",
  source: r.source ?? "site",
  published_at: (r.published_at ?? r.created_at ?? "").slice(0, 10),
  is_approved: r.is_approved,
  is_featured: Boolean(r.is_featured),
});

export default function ReviewFormDialog({
  initial,
  regions,
  onClose,
  onSaved,
}: {
  initial: ReviewFormValues;
  regions: ReviewRegion[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const editing = !!initial.id;

  const set = <K extends keyof ReviewFormValues>(key: K, value: ReviewFormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    // Empty strings are sent as NULL, not "": a review with locale "" would
    // match no page at all, and region_id "" is not a valid UUID.
    const payload = {
      rating: form.rating,
      comment: form.comment.trim() || null,
      author_name: form.author_name.trim() || null,
      author_country: form.author_country.trim() || null,
      region_id: form.region_id || null,
      locale: form.locale || null,
      source: form.source,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      is_approved: form.is_approved,
      is_featured: form.is_featured,
    };
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "reviews", action: editing ? "update" : "create", id: initial.id, data: payload }),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Kaydedilemedi.", "error");
      return;
    }
    toast(editing ? "Değerlendirme güncellendi." : "Değerlendirme eklendi.");
    onSaved();
  };

  return (
    <Dialog
      open
      title={editing ? "Değerlendirmeyi düzenle" : "Yeni değerlendirme"}
      onClose={onClose}
      width="sm:max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Puan">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => set("rating", n)} aria-label={`${n} yıldız`} className="p-0.5">
                <Star size={22} aria-hidden="true" className={n <= form.rating ? "fill-adm-amber text-adm-amber" : "text-adm-faint"} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Yorum" htmlFor="review-comment">
          <Textarea id="review-comment" rows={4} value={form.comment} onChange={(e) => set("comment", e.target.value)} placeholder="Şoför tam saatinde havalimanındaydı, araç çok temizdi…" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="İsim" htmlFor="review-name">
            <Input id="review-name" value={form.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="Anna K." />
          </Field>
          <Field label="Ülke" htmlFor="review-country">
            <Input id="review-country" value={form.author_country} onChange={(e) => set("author_country", e.target.value)} placeholder="Almanya" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bölge" htmlFor="review-region" hint="Boş bırakılırsa tüm bölge sayfalarında görünür.">
            <Select id="review-region" value={form.region_id} onChange={(e) => set("region_id", e.target.value)}>
              <option value="">Tüm bölgeler</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name_tr || r.name_en || r.slug}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dil" htmlFor="review-locale" hint="Boş bırakılırsa her dilde görünür.">
            <Select id="review-locale" value={form.locale} onChange={(e) => set("locale", e.target.value)}>
              <option value="">Tüm diller</option>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l as Loc]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kaynak" htmlFor="review-source">
            <Select id="review-source" value={form.source} onChange={(e) => set("source", e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tarih" htmlFor="review-date">
            <Input id="review-date" type="date" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} />
          </Field>
        </div>

        <div className="flex gap-4 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-adm-ink-2">
            <input type="checkbox" checked={form.is_approved} onChange={(e) => set("is_approved", e.target.checked)} className="size-4 accent-adm-green" />
            Onaylı (sitede yayında)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-adm-ink-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-4 accent-adm-violet" />
            Öne çıkar
          </label>
        </div>

        <p className={cx("border-t border-adm-line-2 pt-3 text-[11.5px] leading-relaxed text-adm-muted")}>
          Gerçekte alınmamış bir yorumu buraya yazmayın. Google uydurma değerlendirme tespit ettiğinde sitenin tüm zengin
          sonuçlarını kapatır ve bunu geri almak aylar sürer.
        </p>
      </div>
    </Dialog>
  );
}
