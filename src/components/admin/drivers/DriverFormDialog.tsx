"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, useToast } from "@/components/admin/ui";

export interface DriverFormValues {
  id?: string;
  full_name: string;
  phone: string;
  email: string;
}

/** New driver, or edit one's name, phone and e-mail. */
export default function DriverFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: DriverFormValues | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<DriverFormValues>(initial ?? { full_name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const editing = !!initial?.id;

  const save = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "drivers",
        action: editing ? "update" : "create",
        id: initial?.id,
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        },
      }),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Kaydedilemedi.", "error");
      return;
    }
    toast(editing ? "Şoför güncellendi." : "Şoför eklendi.");
    onSaved();
  };

  return (
    <Dialog
      open
      title={editing ? "Şoförü düzenle" : "Yeni şoför"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!form.full_name.trim()} onClick={save}>
            {editing ? "Kaydet" : "Ekle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Ad soyad" htmlFor="driver-name">
          <Input id="driver-name" required autoFocus value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </Field>
        <Field label="Telefon" htmlFor="driver-phone">
          <Input id="driver-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+90…" />
        </Field>
        <Field label="E-posta" htmlFor="driver-email">
          <Input id="driver-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
      </div>
    </Dialog>
  );
}
