"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power } from "lucide-react";

interface Vehicle {
  id: string;
  category_id: string | null;
  plate_number: string | null;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  is_active: boolean;
  vehicle_categories: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialVehicles: Vehicle[];
  categories: Category[];
}

export default function VehiclesManager({
  initialVehicles,
  categories,
}: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: categories[0]?.id ?? "",
    plate_number: "",
    brand: "Mercedes-Benz",
    model: "Vito Tourer",
    year: new Date().getFullYear(),
    color: "Black",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      category_id: categories[0]?.id ?? "",
      plate_number: "",
      brand: "Mercedes-Benz",
      model: "Vito Tourer",
      year: new Date().getFullYear(),
      color: "Black",
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
          table: "vehicles",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            category_id: form.category_id,
            plate_number: form.plate_number || null,
            brand: form.brand,
            model: form.model,
            year: form.year,
            color: form.color || null,
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        // Refresh page to get joined data
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "vehicles", action: "toggle", id }),
    });
    const result = await res.json();
    if (result.data) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, is_active: result.data.is_active } : v
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "vehicles", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const startEdit = (v: Vehicle) => {
    setForm({
      category_id: v.category_id ?? categories[0]?.id ?? "",
      plate_number: v.plate_number ?? "",
      brand: v.brand,
      model: v.model,
      year: v.year ?? new Date().getFullYear(),
      color: v.color ?? "",
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{vehicles.length} araç</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Araç Ekle
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4"
        >
          <h3 className="font-bold text-gray-900">
            {editingId ? "Araç Düzenle" : "Yeni Araç"}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Kategori
              </label>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Plaka
              </label>
              <input
                value={form.plate_number}
                onChange={(e) =>
                  setForm({ ...form, plate_number: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Marka *
              </label>
              <input
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Model *
              </label>
              <input
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Yıl
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: parseInt(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Renk
              </label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 font-medium text-gray-500">Araç</th>
              <th className="px-5 py-3 font-medium text-gray-500">Plaka</th>
              <th className="px-5 py-3 font-medium text-gray-500">Kategori</th>
              <th className="px-5 py-3 font-medium text-gray-500">Yıl</th>
              <th className="px-5 py-3 font-medium text-gray-500">Durum</th>
              <th className="px-5 py-3 font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">
                    {v.brand} {v.model}
                  </p>
                  {v.color && (
                    <p className="text-xs text-gray-400">{v.color}</p>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-gray-600">
                  {v.plate_number || "—"}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {v.vehicle_categories?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-gray-600">{v.year ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${v.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {v.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(v)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(v.id)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Power
                        size={14}
                        className={
                          v.is_active ? "text-green-600" : "text-red-400"
                        }
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  Henüz araç eklenmedi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
