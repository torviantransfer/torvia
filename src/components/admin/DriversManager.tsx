"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power } from "lucide-react";

interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

interface Vehicle {
  id: string;
  plate_number: string | null;
  brand: string;
  model: string;
}

interface Props {
  initialDrivers: Driver[];
  vehicles: Vehicle[];
}

export default function DriversManager({ initialDrivers, vehicles }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({ full_name: "", phone: "", email: "" });
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
          table: "drivers",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            full_name: form.full_name,
            phone: form.phone || null,
            email: form.email || null,
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (editingId) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === editingId ? result.data : d))
          );
        } else {
          setDrivers((prev) => [result.data, ...prev]);
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
      body: JSON.stringify({ table: "drivers", action: "toggle", id }),
    });
    const result = await res.json();
    if (result.data) {
      setDrivers((prev) => prev.map((d) => (d.id === id ? result.data : d)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şoförü silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "drivers", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const startEdit = (driver: Driver) => {
    setForm({
      full_name: driver.full_name,
      phone: driver.phone ?? "",
      email: driver.email ?? "",
    });
    setEditingId(driver.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{drivers.length} şoför</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Şoför Ekle
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4"
        >
          <h3 className="font-bold text-gray-900">
            {editingId ? "Şoför Düzenle" : "Yeni Şoför"}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ad Soyad *
              </label>
              <input
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Telefon
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+90..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <th className="px-5 py-3 font-medium text-gray-500">Ad</th>
              <th className="px-5 py-3 font-medium text-gray-500">Telefon</th>
              <th className="px-5 py-3 font-medium text-gray-500">E-posta</th>
              <th className="px-5 py-3 font-medium text-gray-500">Durum</th>
              <th className="px-5 py-3 font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">
                  {driver.full_name}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {driver.phone || "—"}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {driver.email || "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${driver.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {driver.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(driver)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(driver.id)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Toggle active"
                    >
                      <Power
                        size={14}
                        className={
                          driver.is_active ? "text-green-600" : "text-red-400"
                        }
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No drivers added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
