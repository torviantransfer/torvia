"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle, XCircle, Trash2, Star, Plus, Search, Loader2, Save,
  AlertCircle, Sparkles, Globe, MapPin, X,
} from "lucide-react";
import { aggregate, MIN_REVIEWS_FOR_SCHEMA, type ReviewRow } from "@/lib/reviews";
import { LOCALES, LOCALE_LABELS, type Loc } from "./seo/fields";

export interface AdminReview extends ReviewRow {
  id: string;
  is_approved: boolean;
  created_at: string;
  region_id: string | null;
  customers: { first_name: string; last_name: string; email: string } | null;
  reservations: { reservation_code: string } | null;
}

export interface ReviewRegion {
  id: string;
  slug: string;
  name_tr: string | null;
  name_en: string | null;
}

const SOURCES = [
  { value: "site", label: "Site (rezervasyon sonrası)" },
  { value: "google", label: "Google" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "manual", label: "Elle eklendi" },
] as const;

const emptyForm = {
  rating: 5,
  comment: "",
  author_name: "",
  author_country: "",
  region_id: "",
  locale: "",
  source: "manual",
  published_at: new Date().toISOString().slice(0, 10),
  is_approved: true,
  is_featured: false,
};

type Form = typeof emptyForm;

export default function ReviewsManager({
  initialReviews,
  regions = [],
}: {
  initialReviews: AdminReview[];
  regions?: ReviewRegion[];
}) {
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "featured">("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionName = (id: string | null) => {
    if (!id) return null;
    const r = regions.find((x) => x.id === id);
    return r ? r.name_tr || r.name_en || r.slug : null;
  };

  const approved = useMemo(() => reviews.filter((r) => r.is_approved), [reviews]);
  const stats = useMemo(() => aggregate(approved), [approved]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter === "pending" && r.is_approved) return false;
      if (filter === "approved" && !r.is_approved) return false;
      if (filter === "featured" && !r.is_featured) return false;
      if (regionFilter === "none" && r.region_id) return false;
      if (regionFilter !== "all" && regionFilter !== "none" && r.region_id !== regionFilter)
        return false;
      if (!q) return true;
      const name = (r.author_name ?? r.customers?.first_name ?? "").toLowerCase();
      return name.includes(q) || (r.comment ?? "").toLowerCase().includes(q);
    });
  }, [reviews, filter, regionFilter, query]);

  const call = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "reviews", ...body }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error ?? "İşlem başarısız");
    return json.data;
  };

  const toggle = async (id: string, field: "is_approved" | "is_featured") => {
    setError(null);
    try {
      const data = await call({ action: "toggle", id, data: { field } });
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: data[field] } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem başarısız");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Bu değerlendirme kalıcı olarak silinecek. Emin misiniz?")) return;
    setError(null);
    try {
      await call({ action: "delete", id });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    }
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: AdminReview) => {
    setForm({
      rating: r.rating,
      comment: r.comment ?? "",
      author_name: r.author_name ?? r.customers?.first_name ?? "",
      author_country: r.author_country ?? "",
      region_id: r.region_id ?? "",
      locale: r.locale ?? "",
      source: r.source ?? "site",
      published_at: (r.published_at ?? r.created_at ?? "").slice(0, 10),
      is_approved: r.is_approved,
      is_featured: Boolean(r.is_featured),
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    // Empty strings are sent as NULL, not "". A review with locale "" would
    // match no page at all, and region_id "" is not a valid UUID.
    const payload = {
      rating: form.rating,
      comment: form.comment.trim() || null,
      author_name: form.author_name.trim() || null,
      author_country: form.author_country.trim() || null,
      region_id: form.region_id || null,
      locale: form.locale || null,
      source: form.source,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      is_approved: form.is_approved,
      is_featured: form.is_featured,
    };
    try {
      if (editingId) {
        const data = await call({ action: "update", id: editingId, data: payload });
        setReviews((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...data } : r)));
      } else {
        const data = await call({ action: "create", data: payload });
        setReviews((prev) => [{ ...data, customers: null, reservations: null }, ...prev]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const enoughForStars = stats.count >= MIN_REVIEWS_FOR_SCHEMA;

  return (
    <div className="space-y-5">
      {/* Rating summary — the number that decides whether Google can show
          stars at all, stated plainly rather than left to be inferred. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Ortalama puan</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[22px] font-bold text-slate-900 tabular-nums">
              {stats.value?.toFixed(1) ?? "—"}
            </span>
            <span className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    stats.value && i < Math.round(stats.value)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-300"
                  }
                />
              ))}
            </span>
          </div>
        </div>
        <Stat label="Onaylı yorum" value={String(stats.count)} />
        <Stat label="Onay bekleyen" value={String(reviews.filter((r) => !r.is_approved).length)} />
        <Stat label="Öne çıkan" value={String(reviews.filter((r) => r.is_featured).length)} />
      </div>

      <div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
        style={{
          backgroundColor: enoughForStars ? "#f0fdf4" : "#fffbeb",
          borderColor: enoughForStars ? "#bbf7d0" : "#fde68a",
        }}
      >
        {enoughForStars ? (
          <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        )}
        <p className="text-[12.5px] leading-relaxed text-slate-700">
          {enoughForStars ? (
            <>
              <b>{stats.count} onaylı yorum</b> ile Google&apos;a yıldız verisi gönderiliyor
              ({stats.value?.toFixed(1)} / 5). Google&apos;ın bunu arama sonucunda göstermesi
              birkaç hafta sürebilir ve garanti değildir.
            </>
          ) : (
            <>
              Yıldızların arama sonuçlarında çıkabilmesi için en az{" "}
              <b>{MIN_REVIEWS_FOR_SCHEMA} onaylı yorum</b> gerekiyor — şu an {stats.count} var.
              Bu sayının altında yıldız verisi hiç gönderilmiyor.
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-700">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yorum veya isim ara…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-300 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        >
          <option value="all">Tüm bölgeler</option>
          <option value="none">Bölgesiz</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name_tr || r.name_en || r.slug}
            </option>
          ))}
        </select>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
          {(
            [
              ["all", "Tümü"],
              ["pending", "Bekleyen"],
              ["approved", "Onaylı"],
              ["featured", "Öne çıkan"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: filter === id ? "#fff" : "transparent",
                color: filter === id ? "#0f172a" : "#64748b",
                boxShadow: filter === id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold transition-colors cursor-pointer"
        >
          <Plus size={15} /> Yorum ekle
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-slate-500">
            Bu filtreye uyan değerlendirme yok.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const name = r.author_name || r.customers?.first_name || "Misafir";
              const region = regionName(r.region_id);
              const date = (r.published_at ?? r.created_at ?? "").slice(0, 10);
              return (
                <li key={r.id} className="px-4 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Star
                              key={i}
                              size={13}
                              className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                            />
                          ))}
                        </span>
                        <span className="text-[13px] font-medium text-slate-900">{name}</span>
                        {r.author_country && (
                          <span className="text-[11.5px] text-slate-500">· {r.author_country}</span>
                        )}
                        {!r.is_approved && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                            onay bekliyor
                          </span>
                        )}
                        {r.is_featured && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700">
                            öne çıkan
                          </span>
                        )}
                      </div>

                      {r.comment && (
                        <p className="text-[13px] text-slate-600 leading-relaxed mt-1.5">
                          {r.comment}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span>{date}</span>
                        {region && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} /> {region}
                          </span>
                        )}
                        {r.locale && (
                          <span className="inline-flex items-center gap-1">
                            <Globe size={11} /> {r.locale.toUpperCase()}
                          </span>
                        )}
                        {r.source && r.source !== "site" && <span>kaynak: {r.source}</span>}
                        {r.reservations?.reservation_code && (
                          <span>#{r.reservations.reservation_code}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <IconBtn
                        title={r.is_featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
                        onClick={() => toggle(r.id, "is_featured")}
                        active={Boolean(r.is_featured)}
                        activeColor="#7c3aed"
                      >
                        <Sparkles size={15} />
                      </IconBtn>
                      <IconBtn
                        title={r.is_approved ? "Onayı kaldır" : "Onayla"}
                        onClick={() => toggle(r.id, "is_approved")}
                        active={r.is_approved}
                        activeColor="#16a34a"
                      >
                        {r.is_approved ? <CheckCircle size={15} /> : <XCircle size={15} />}
                      </IconBtn>
                      <button
                        onClick={() => openEdit(r)}
                        className="px-2 py-1 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Düzenle
                      </button>
                      <IconBtn title="Sil" onClick={() => remove(r.id)} danger>
                        <Trash2 size={15} />
                      </IconBtn>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {editingId ? "Değerlendirmeyi düzenle" : "Yeni değerlendirme"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Puan</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      className="p-1 cursor-pointer"
                      aria-label={`${n} yıldız`}
                    >
                      <Star
                        size={24}
                        className={n <= form.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Yorum">
                <textarea
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Şoför tam saatinde havalimanındaydı, araç çok temizdi…"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="İsim">
                  <input
                    value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                    placeholder="Anna K."
                    className={inputCls}
                  />
                </Field>
                <Field label="Ülke">
                  <input
                    value={form.author_country}
                    onChange={(e) => setForm((f) => ({ ...f, author_country: e.target.value }))}
                    placeholder="Almanya"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bölge" hint="Boş bırakılırsa tüm bölge sayfalarında görünür.">
                  <select
                    value={form.region_id}
                    onChange={(e) => setForm((f) => ({ ...f, region_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Tüm bölgeler</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name_tr || r.name_en || r.slug}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Dil" hint="Boş bırakılırsa her dilde görünür.">
                  <select
                    value={form.locale}
                    onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Tüm diller</option>
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABELS[l as Loc]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kaynak">
                  <select
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className={inputCls}
                  >
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tarih">
                  <input
                    type="date"
                    value={form.published_at}
                    onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_approved}
                    onChange={(e) => setForm((f) => ({ ...f, is_approved: e.target.checked }))}
                    className="w-4 h-4 accent-green-600 cursor-pointer"
                  />
                  Onaylı (sitede yayında)
                </label>
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600 cursor-pointer"
                  />
                  Öne çıkar
                </label>
              </div>

              <p className="text-[11.5px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                Gerçekte alınmamış bir yorumu buraya yazmayın. Google uydurma değerlendirme
                tespit ettiğinde sitenin tüm zengin sonuçlarını kapatır ve bunu geri almak
                aylar sürer.
              </p>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-white">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-[22px] font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
  activeColor,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 cursor-pointer"
      style={{ color: danger ? "#94a3b8" : active ? activeColor : "#94a3b8" }}
      onMouseEnter={(e) => {
        if (danger) e.currentTarget.style.color = "#dc2626";
      }}
      onMouseLeave={(e) => {
        if (danger) e.currentTarget.style.color = "#94a3b8";
      }}
    >
      {children}
    </button>
  );
}
