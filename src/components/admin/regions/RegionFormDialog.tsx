"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, useToast } from "@/components/admin/ui";

/**
 * A new region: only what the row cannot exist without. Everything else —
 * languages, page content, hotels, image — is written in the region editor,
 * which opens as soon as the region is created.
 */
export default function RegionFormDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const toast = useToast();
  const [slug, setSlug] = useState("");
  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  const ready = slug.trim() && nameTr.trim() && nameEn.trim();

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    const data: Record<string, unknown> = {
      slug: slug.trim(),
      distance_km: distance ? parseFloat(distance) : null,
      duration_minutes: duration ? parseInt(duration, 10) : null,
      // Inactive until the page has been filled in and checked in the editor.
      is_active: false,
      name_tr: nameTr.trim(),
      name_en: nameEn.trim(),
    };
    // Other languages start on the English name, as they always have.
    for (const l of ["de", "pl", "ru", "nl", "ro", "ar"]) data[`name_${l}`] = nameEn.trim();

    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "regions", action: "create", data }),
    });
    const result = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok || !result?.data?.id) {
      toast(result?.error ?? "Eklenemedi.", "error");
      return;
    }
    toast("Bölge eklendi. Şimdi sayfasını doldurun.");
    onCreated(String(result.data.id));
  };

  return (
    <Dialog
      open
      title="Yeni bölge"
      subtitle="Diller, sayfa içeriği ve görseller bir sonraki ekranda."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!ready} onClick={save}>
            Ekle ve düzenle
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Türkçe ad" htmlFor="new-region-tr">
            <Input id="new-region-tr" value={nameTr} onChange={(e) => setNameTr(e.target.value)} placeholder="Belek" autoFocus />
          </Field>
          <Field label="İngilizce ad" htmlFor="new-region-en">
            <Input id="new-region-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Belek" />
          </Field>
        </div>
        <Field label="Slug" htmlFor="new-region-slug" hint="Sayfa adresi: /tr/{slug}-transfer">
          <Input id="new-region-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="belek" className="font-mono" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mesafe (km)" htmlFor="new-region-distance">
            <Input id="new-region-distance" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} />
          </Field>
          <Field label="Süre (dk)" htmlFor="new-region-duration">
            <Input id="new-region-duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
