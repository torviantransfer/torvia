"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button, Dialog, Field, Input, Select, useToast } from "@/components/admin/ui";

export interface VehicleFormValues {
  id?: string;
  category_id: string;
  plate_number: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  image_url: string;
}

export default function VehicleFormDialog({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: VehicleFormValues;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editing = !!initial.id;

  const set = <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
    if (!form.brand.trim() || !form.model.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "vehicles",
        action: editing ? "update" : "create",
        id: initial.id,
        data: {
          category_id: form.category_id || null,
          plate_number: form.plate_number.trim() || null,
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: form.year ? Number(form.year) : null,
          color: form.color.trim() || null,
          image_url: form.image_url.trim() || null,
        },
      }),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Kaydedilemedi.", "error");
      return;
    }
    toast(editing ? "Araç güncellendi." : "Araç eklendi.");
    onSaved();
  };

  return (
    <Dialog
      open
      title={editing ? "Aracı düzenle" : "Yeni araç"}
      onClose={onClose}
      width="sm:max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!form.brand.trim() || !form.model.trim()} onClick={save}>
            {editing ? "Kaydet" : "Ekle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-adm border border-adm-line bg-adm-surface-2">
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-[11px] text-adm-faint">Görsel yok</span>
            )}
          </div>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Araç tipi" htmlFor="vehicle-category">
            <Select id="vehicle-category" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plaka" htmlFor="vehicle-plate">
            <Input id="vehicle-plate" value={form.plate_number} onChange={(e) => set("plate_number", e.target.value)} />
          </Field>
          <Field label="Marka" htmlFor="vehicle-brand">
            <Input id="vehicle-brand" required value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field label="Model" htmlFor="vehicle-model">
            <Input id="vehicle-model" required value={form.model} onChange={(e) => set("model", e.target.value)} />
          </Field>
          <Field label="Yıl" htmlFor="vehicle-year">
            <Input id="vehicle-year" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} />
          </Field>
          <Field label="Renk" htmlFor="vehicle-color">
            <Input id="vehicle-color" value={form.color} onChange={(e) => set("color", e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
