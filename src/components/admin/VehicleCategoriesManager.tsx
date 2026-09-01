"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Upload, Loader2, Users, Luggage } from "lucide-react";

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  max_passengers: number;
  max_luggage: number;
  features: string[];
  sort_order: number;
  is_active: boolean;
}

/**
 * The feature keys the booking flow knows how to render. Anything outside
 * this list falls back to a generic tick and the raw key as its label, which
 * looks like a bug on the customer's screen — so the admin offers exactly
 * these and nothing else.
 */
const FEATURES: [key: string, label: string][] = [
  ["ac", "Klima"],
  ["wifi", "Wi-Fi"],
  ["water", "Su ikramı"],
  ["leather", "Deri döşeme"],
  ["usb", "USB şarj"],
  ["tv", "Ekran / TV"],
  ["minibar", "Minibar"],
];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  max_passengers: "5",
  max_luggage: "5",
  sort_order: "0",
  features: [] as string[],
};

function slugify(value: string) {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  };
  return value
    .toLowerCase()
    .replace(/[çğıİöşü]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function VehicleCategoriesManager({
  initialCategories,
}: {
  initialCategories: VehicleCategory[];
}) {
  const [categories, setCategories] = useState<VehicleCategory[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (c: VehicleCategory) => {
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      max_passengers: String(c.max_passengers),
      max_luggage: String(c.max_luggage),
      sort_order: String(c.sort_order),
      features: c.features ?? [],
    });
    setEditingId(c.id);
    setShowForm(true);
    setError(null);
    setNotice(null);
  };

  const toggleFeature = (key: string) =>
    setForm((f) => ({
      ...f,
      features: f.features.includes(key)
        ? f.features.filter((x) => x !== key)
        : [...f.features, key],
    }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "vehicles");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (result.url) {
        setForm((f) => ({ ...f, image_url: result.url }));
      } else {
        setError(result.error ?? "Görsel yüklenemedi");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      max_passengers: parseInt(form.max_passengers) || 1,
      max_luggage: parseInt(form.max_luggage) || 0,
      sort_order: parseInt(form.sort_order) || 0,
      features: form.features,
    };

    try {
      if (editingId) {
        const res = await fetch("/api/admin/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: "vehicle_categories",
            action: "update",
            id: editingId,
            data: payload,
          }),
        });
        const result = await res.json();
        if (!result.data) {
          setError(result.error ?? "Kaydedilemedi");
          return;
        }
        setCategories((prev) => prev.map((c) => (c.id === editingId ? result.data : c)));
        resetForm();
      } else {
        // Creation goes through its own endpoint, which also copies a price
        // for every region from an existing vehicle — /admin/pricing can only
        // edit rows that already exist, so without that the new vehicle would
        // be unpriceable from the panel.
        const res = await fetch("/api/admin/vehicle-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!result.data) {
          setError(result.error ?? "Araç eklenemedi");
          return;
        }
        setCategories((prev) => [...prev, result.data]);
        setNotice(
          `${result.data.name} eklendi. ${result.clonedCount} bölge için fiyatları "${result.clonedFrom}" aracından kopyalandı — /admin/pricing üzerinden düzenleyin.`,
        );
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
      body: JSON.stringify({ table: "vehicle_categories", action: "toggle", id }),
    });
    const result = await res.json();
    if (result.data) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: result.data.is_active } : c)),
      );
    }
  };

  const handleDelete = async (c: VehicleCategory) => {
    if (
      !confirm(
        `"${c.name}" aracını silmek istediğinize emin misiniz?\n\nBu aracın tüm bölgelerdeki fiyatları da silinecek. Aracı geçici olarak kaldırmak istiyorsanız silmek yerine pasife alın.`,
      )
    )
      return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "vehicle_categories", action: "delete", id: c.id }),
    });
    const result = await res.json();
    if (result.success) setCategories((prev) => prev.filter((x) => x.id !== c.id));
    else setError(result.error ?? "Silinemedi");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{categories.length} araç</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={16} />
          Araç Ekle
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Kapat"><X size={14} /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-bold text-gray-900">
            {editingId ? "Aracı Düzenle" : "Yeni Araç"}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Araç adı *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  // Only auto-fill the slug while creating: changing an
                  // existing slug would break the pricing rows and the saved
                  // booking drafts that reference it.
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }));
                }}
                placeholder="Mercedes Sprinter VIP"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!editingId}
                placeholder="sprinter-vip"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
              />
              {editingId && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Slug değiştirilemez — fiyat kayıtları ve yarım kalmış rezervasyonlar buna bağlı.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="10 kişiye kadar geniş iç hacim, yüksek tavan"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kişi kapasitesi *</label>
              <input
                type="number"
                min={1}
                max={40}
                required
                value={form.max_passengers}
                onChange={(e) => setForm({ ...form, max_passengers: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bagaj kapasitesi</label>
              <input
                type="number"
                min={0}
                max={40}
                value={form.max_luggage}
                onChange={(e) => setForm({ ...form, max_luggage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sıra</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Özellikler</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(([key, label]) => {
                const on = form.features.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      on
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {on && <Check size={12} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Görsel</label>
            <div className="flex items-start gap-4">
              <div className="w-40 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[11px] text-gray-400">Görsel yok</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {form.image_url ? "Görseli değiştir" : "Görsel yükle"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="block text-xs text-red-600 hover:underline"
                  >
                    Görseli kaldır
                  </button>
                )}
                <p className="text-[11px] text-gray-400 max-w-xs">
                  Şeffaf arka planlı PNG en iyi sonucu verir — kart içinde görsel
                  kırpılmadan, olduğu gibi yerleştiriliyor. En fazla 5MB.
                </p>
              </div>
            </div>
          </div>

          {!editingId && (
            <p className="rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-2.5 text-[12px] leading-relaxed text-blue-800">
              Yeni araç eklendiğinde her bölge için fiyatı mevcut araçtan kopyalanır.
              Bölge sayfalarında araç bazlı fiyat gösterilmez, orada her zaman en
              düşük fiyat yazar. Fiyatları <strong>/admin/pricing</strong> üzerinden
              düzenleyin.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Kaydet" : "Ekle"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Araç</th>
                <th className="px-5 py-3 font-medium">Kapasite</th>
                <th className="px-5 py-3 font-medium">Özellikler</th>
                <th className="px-5 py-3 font-medium">Durum</th>
                <th className="px-5 py-3 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-md border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-gray-300">yok</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                    <span className="inline-flex items-center gap-1 mr-3">
                      <Users size={13} className="text-gray-400" />{c.max_passengers}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Luggage size={13} className="text-gray-400" />{c.max_luggage}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(c.features ?? []).length === 0 ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        (c.features ?? []).map((f) => (
                          <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                            {FEATURES.find(([k]) => k === f)?.[1] ?? f}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggle(c.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.is_active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        aria-label="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        aria-label="Sil"
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
    </div>
  );
}
