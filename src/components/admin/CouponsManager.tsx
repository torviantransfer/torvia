"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

interface Props {
  initialCoupons: Coupon[];
}

export default function CouponsManager({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "10",
    min_order: "0",
    max_uses: "100",
    valid_until: "",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      code: "",
      discount_type: "percent",
      discount_value: "10",
      min_order: "0",
      max_uses: "100",
      valid_until: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "coupons",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            code: form.code.toUpperCase(),
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            min_order: parseFloat(form.min_order) || 0,
            max_uses: parseInt(form.max_uses) || 999,
            valid_until: form.valid_until || null,
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (editingId) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === editingId ? result.data : c))
          );
        } else {
          setCoupons((prev) => [result.data, ...prev]);
        }
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "coupons", action: "toggle", id }),
    });
    const result = await res.json();
    if (result.data) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: result.data.is_active } : c))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "coupons", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const startEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value.toString(),
      min_order: c.min_order.toString(),
      max_uses: c.max_uses.toString(),
      valid_until: c.valid_until?.split("T")[0] ?? "",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-adm-muted">{coupons.length} kupon</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-adm-ink text-white rounded-adm-sm text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Kupon Ekle
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-adm-surface rounded-adm border border-adm-line-2 p-5 mb-6 space-y-4"
        >
          <h3 className="font-bold text-adm-ink">
            {editingId ? "Kupon Düzenle" : "Yeni Kupon"}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Kod *
              </label>
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="örn. SUMMER20"
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Tür
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value })
                }
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm"
              >
                <option value="percent">Yüzde (%)</option>
                <option value="fixed">Sabit ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Değer
              </label>
              <input
                type="number"
                step="0.01"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({ ...form, discount_value: e.target.value })
                }
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Min Sipariş ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.min_order}
                onChange={(e) =>
                  setForm({ ...form, min_order: e.target.value })
                }
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Max Kullanım
              </label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm({ ...form, max_uses: e.target.value })
                }
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-adm-muted mb-1">
                Geçerlilik Tarihi
              </label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) =>
                  setForm({ ...form, valid_until: e.target.value })
                }
                className="w-full border border-adm-line rounded-adm-sm px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-adm-ink text-white rounded-adm-sm text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-adm-line rounded-adm-sm text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="bg-adm-surface rounded-adm border border-adm-line-2 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-adm-surface-2 text-start">
              <th className="px-5 py-3 font-medium text-adm-muted">Kod</th>
              <th className="px-5 py-3 font-medium text-adm-muted">İndirim</th>
              <th className="px-5 py-3 font-medium text-adm-muted">Kullanım</th>
              <th className="px-5 py-3 font-medium text-adm-muted">Geçerlilik</th>
              <th className="px-5 py-3 font-medium text-adm-muted">Durum</th>
              <th className="px-5 py-3 font-medium text-adm-muted">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-adm-line-2">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-adm-surface-2">
                <td className="px-5 py-3 font-mono font-bold text-adm-ink">
                  {c.code}
                </td>
                <td className="px-5 py-3 text-adm-ink-2">
                  {c.discount_type === "percent"
                    ? `${c.discount_value}%`
                    : `$${c.discount_value.toFixed(2)}`}
                </td>
                <td className="px-5 py-3 text-adm-ink-2">
                  {c.used_count} / {c.max_uses}
                </td>
                <td className="px-5 py-3 text-adm-ink-2">
                  {c.valid_until
                    ? new Date(c.valid_until).toLocaleDateString("tr-TR")
                    : "Süresi yok"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? "bg-adm-green-soft text-adm-green" : "bg-adm-rose-soft text-adm-rose"}`}
                  >
                    {c.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 rounded hover:bg-adm-line-2"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(c.id)}
                      className="p-1.5 rounded hover:bg-adm-line-2"
                    >
                      <Power
                        size={14}
                        className={
                          c.is_active ? "text-adm-green" : "text-adm-rose"
                        }
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded hover:bg-adm-rose-soft text-adm-rose"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-adm-muted">
                  Henüz kupon yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
