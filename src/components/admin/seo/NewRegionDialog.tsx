"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button, Dialog, Field, Input } from "@/components/admin/ui";
import { LOCALES, type Loc } from "./fields";

// name_tr … name_ru are NOT NULL in the schema; Dutch and Romanian came later.
const REQUIRED: Loc[] = ["tr", "en", "de", "pl", "ru"];

/** Adds a region row so its SEO can be written before it goes live. */
export default function NewRegionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: Record<string, unknown>) => void;
}) {
  const [slug, setSlug] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bare = slug
    .toLowerCase()
    .replace(/-transfer$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const missing = REQUIRED.filter((l) => !(names[l] ?? "").trim());
  const canSave = bare.length > 1 && missing.length === 0 && !saving;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "regions",
          action: "create",
          data: {
            slug: bare,
            name_tr: names.tr.trim(),
            name_en: names.en.trim(),
            name_de: names.de.trim(),
            name_pl: names.pl.trim(),
            name_ru: names.ru.trim(),
            name_nl: (names.nl ?? "").trim() || null,
            // Left out when Romanian was added, so a region created here had a
            // NULL name_ro and every Romanian page fell back to the English
            // name -- silently, because `name_ro || name_en` never complains.
            name_ro: (names.ro ?? "").trim() || null,
            distance_km: distance ? parseFloat(distance) : null,
            duration_minutes: duration ? parseInt(duration, 10) : null,
            // Inactive on purpose: a region with no copy, no photo and no price
            // should not enter the sitemap. Activate it from Bölgeler once its
            // SEO is filled in.
            is_active: false,
            is_popular: false,
            sort_order: 999,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Bölge eklenemedi");
      onCreated(json.data as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bölge eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      title="Yeni bölge"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            icon={saving ? Loader2 : Plus}
            disabled={!canSave}
            onClick={submit}
          >
            {saving ? "Ekleniyor…" : "Ekle ve SEO'yu düzenle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field
          label="URL adresi"
          htmlFor="new-region-slug"
          hint={
            <>
              Sayfa adresi:{" "}
              <span className="font-medium text-adm-ink-2">
                torviantransfer.com/tr/{bare || "…"}-transfer
              </span>
              <br />
              Yayına girdikten sonra bu adresi değiştirmek sıralamayı sıfırlar.
            </>
          }
        >
          <Input
            id="new-region-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="belek"
          />
        </Field>

        <Field
          label="Bölge adı — her dilde"
          error={
            missing.length > 0
              ? `Zorunlu diller eksik: ${missing.map((l) => l.toUpperCase()).join(", ")}`
              : undefined
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map((l) => (
              <Input
                key={l}
                value={names[l] ?? ""}
                onChange={(e) => setNames((n) => ({ ...n, [l]: e.target.value }))}
                placeholder={`${l.toUpperCase()}${REQUIRED.includes(l) ? " *" : ""}`}
                aria-label={`Bölge adı (${l.toUpperCase()})`}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mesafe (km)" htmlFor="new-region-distance">
            <Input
              id="new-region-distance"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="35"
            />
          </Field>
          <Field label="Süre (dakika)" htmlFor="new-region-duration">
            <Input
              id="new-region-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="40"
            />
          </Field>
        </div>

        <p className="border-t border-adm-line-2 pt-3 text-[11.5px] leading-relaxed text-adm-muted">
          Bölge <b>pasif</b> olarak oluşturulur — sitemap&apos;e ve site menüsüne girmez.
          Kaydettikten sonra SEO paneli açılır.
        </p>

        {error && (
          <p className="flex items-center gap-2 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[12.5px] text-adm-rose">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
