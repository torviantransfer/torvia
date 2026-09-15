"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Select, useToast } from "@/components/admin/ui";

export interface CouponFormValues {
  id?: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order: string;
  max_uses: string;
  valid_until: string;
}

export const emptyCouponForm: CouponFormValues = {
  code: "",
  discount_type: "percent",
  discount_value: "10",
  min_order: "0",
  max_uses: "100",
  valid_until: "",
};

export default function CouponFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: CouponFormValues;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const editing = !!initial.id;

  const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "coupons",
        action: editing ? "update" : "create",
        id: initial.id,
        data: {
          code: form.code.trim().toUpperCase(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value) || 0,
          min_order: parseFloat(form.min_order) || 0,
          max_uses: parseInt(form.max_uses, 10) || 999,
          valid_until: form.valid_until || null,
        },
      }),
    });
    setSaving(false);
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.data) {
      toast(result?.error ?? "Kaydedilemedi.", "error");
      return;
    }
    toast(editing ? "Kupon güncellendi." : "Kupon eklendi.");
    onSaved();
  };

  return (
    <Dialog
      open
      title={editing ? "Kuponu düzenle" : "Yeni kupon"}
      onClose={onClose}
      width="sm:max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} disabled={!form.code.trim()} onClick={save}>
            {editing ? "Kaydet" : "Ekle"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Kod" htmlFor="coupon-code">
          <Input id="coupon-code" required autoFocus value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="örn. SUMMER20" className="font-mono" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tür" htmlFor="coupon-type">
            <Select id="coupon-type" value={form.discount_type} onChange={(e) => set("discount_type", e.target.value === "fixed" ? "fixed" : "percent")}>
              <option value="percent">Yüzde (%)</option>
              <option value="fixed">Sabit ($)</option>
            </Select>
          </Field>
          <Field label="Değer" htmlFor="coupon-value">
            <Input id="coupon-value" type="number" step="0.01" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
          </Field>
          <Field label="Min. sipariş ($)" htmlFor="coupon-min">
            <Input id="coupon-min" type="number" step="0.01" value={form.min_order} onChange={(e) => set("min_order", e.target.value)} />
          </Field>
          <Field label="Maks. kullanım" htmlFor="coupon-max">
            <Input id="coupon-max" type="number" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} />
          </Field>
        </div>
        <Field label="Geçerlilik tarihi" htmlFor="coupon-until" hint="Boş bırakılırsa süresi olmaz">
          <Input id="coupon-until" type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
