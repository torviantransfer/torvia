"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, MapPin } from "lucide-react";

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  distance_km: number | null;
  duration_minutes: number | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  initialRegions: Region[];
}

export default function RegionsManager({ initialRegions }: Props) {
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name_tr: "",
    name_en: "",
    name_de: "",
    name_pl: "",
    name_ru: "",
    distance_km: "",
    duration_minutes: "",
    sort_order: "0",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      slug: "",
      name_tr: "",
      name_en: "",
      name_de: "",
      name_pl: "",
      name_ru: "",
      distance_km: "",
      duration_minutes: "",
      sort_order: "0",
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
          table: "regions",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            slug: form.slug,
            name_tr: form.name_tr,
            name_en: form.name_en,
            name_de: form.name_de || form.name_en,
            name_pl: form.name_pl || form.name_en,
            name_ru: form.name_ru || form.name_en,
            distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
            duration_minutes: form.duration_minutes
              ? parseInt(form.duration_minutes)
              : null,
            sort_order: parseInt(form.sort_order) || 0,
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (editingId) {
          setRegions((prev) =>
            prev.map((r) => (r.id === editingId ? result.data : r))
          );
        } else {
          setRegions((prev) => [...prev, result.data]);
        }
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, field: string = "is_active") => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "regions",
        action: "toggle",
        id,
        data: { field },
      }),
    });
    const result = await res.json();
    if (result.data) {
      setRegions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: result.data[field] } : r))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu bölgeyi silmek istediğinize emin misiniz? Fiyatlandırması da silinecektir.")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "regions", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setRegions((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const startEdit = (r: Region) => {
    setForm({
      slug: r.slug,
      name_tr: r.name_tr,
      name_en: r.name_en,
      name_de: r.name_de,
      name_pl: r.name_pl,
      name_ru: r.name_ru,
      distance_km: r.distance_km?.toString() ?? "",
      duration_minutes: r.duration_minutes?.toString() ?? "",
      sort_order: r.sort_order.toString(),
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{regions.length} bölge</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Bölge Ekle
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4"
        >
          <h3 className="font-bold text-gray-900">
            {editingId ? "Bölge Düzenle" : "Yeni Bölge"}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Slug *
              </label>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. belek"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad (TR) *
              </label>
              <input
                required
                value={form.name_tr}
                onChange={(e) => setForm({ ...form, name_tr: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad (EN) *
              </label>
              <input
                required
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad (DE)
              </label>
              <input
                value={form.name_de}
                onChange={(e) => setForm({ ...form, name_de: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad (PL)
              </label>
              <input
                value={form.name_pl}
                onChange={(e) => setForm({ ...form, name_pl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad (RU)
              </label>
              <input
                value={form.name_ru}
                onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Mesafe (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.distance_km}
                onChange={(e) =>
                  setForm({ ...form, distance_km: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Süre (dk)
              </label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Sıralama
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
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
              <th className="px-5 py-3 font-medium text-gray-500">#</th>
              <th className="px-5 py-3 font-medium text-gray-500">Bölge</th>
              <th className="px-5 py-3 font-medium text-gray-500">Slug</th>
              <th className="px-5 py-3 font-medium text-gray-500">Mesafe</th>
              <th className="px-5 py-3 font-medium text-gray-500">Süre</th>
              <th className="px-5 py-3 font-medium text-gray-500">Popüler</th>
              <th className="px-5 py-3 font-medium text-gray-500">Durum</th>
              <th className="px-5 py-3 font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {regions.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{r.sort_order}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{r.name_en}</p>
                  <p className="text-xs text-gray-400">{r.name_tr}</p>
                </td>
                <td className="px-5 py-3 font-mono text-gray-600">{r.slug}</td>
                <td className="px-5 py-3 text-gray-600">
                  {r.distance_km ? `${r.distance_km} km` : "—"}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {r.duration_minutes ? `${r.duration_minutes} dk` : "—"}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleToggle(r.id, "is_popular")}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_popular ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    {r.is_popular ? "Popüler" : "Normal"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {r.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(r.id)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Power
                        size={14}
                        className={
                          r.is_active ? "text-green-600" : "text-red-400"
                        }
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
