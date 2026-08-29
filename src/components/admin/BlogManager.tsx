"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Edit2, Trash2, Power, Eye, EyeOff, Upload, Image as ImageIcon,
  Loader2, X, Search, Globe,
} from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title_tr: string | null;
  title_en: string | null;
  title_de: string | null;
  title_pl: string | null;
  title_ru: string | null;
  title_nl: string | null;
  content_tr: string | null;
  content_en: string | null;
  content_de: string | null;
  content_pl: string | null;
  content_ru: string | null;
  content_nl: string | null;
  excerpt_tr: string | null;
  excerpt_en: string | null;
  excerpt_de: string | null;
  excerpt_pl: string | null;
  excerpt_ru: string | null;
  excerpt_nl: string | null;
  slug_tr: string | null;
  slug_en: string | null;
  slug_de: string | null;
  slug_pl: string | null;
  slug_ru: string | null;
  slug_nl: string | null;
  image_url: string | null;
  primary_region_slug: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
}

interface Props {
  initialPosts: BlogPost[];
}

const LOCALES = ["en", "tr", "de", "pl", "ru", "nl"] as const;
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
};

const SITE_URL = "torviantransfer.com";

const emptyForm = {
  slug: "",
  image_url: "",
  primary_region_slug: "",
  title_en: "", title_tr: "", title_de: "", title_pl: "", title_ru: "", title_nl: "",
  content_en: "", content_tr: "", content_de: "", content_pl: "", content_ru: "", content_nl: "",
  excerpt_en: "", excerpt_tr: "", excerpt_de: "", excerpt_pl: "", excerpt_ru: "", excerpt_nl: "",
  slug_en: "", slug_tr: "", slug_de: "", slug_pl: "", slug_ru: "", slug_nl: "",
};

type FormState = typeof emptyForm;

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

export default function BlogManager({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [activeLang, setActiveLang] = useState<string>("en");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRegions(d); })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setActiveLang("en");
    setUploadError(null);
    setImageBroken(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "blog_posts",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            slug: form.slug,
            image_url: form.image_url || null,
            primary_region_slug: form.primary_region_slug || null,
            ...Object.fromEntries(
              LOCALES.flatMap((l) => [
                [`title_${l}`, form[`title_${l}` as keyof FormState] || null],
                [`content_${l}`, form[`content_${l}` as keyof FormState] || null],
                [`excerpt_${l}`, form[`excerpt_${l}` as keyof FormState] || null],
                [`slug_${l}`, form[`slug_${l}` as keyof FormState] || null],
              ])
            ),
            ...(!editingId && { published_at: new Date().toISOString() }),
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (editingId) {
          setPosts((prev) => prev.map((p) => (p.id === editingId ? result.data : p)));
        } else {
          setPosts((prev) => [result.data, ...prev]);
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
      body: JSON.stringify({ table: "blog_posts", action: "toggle", id, data: { field: "is_published" } }),
    });
    const result = await res.json();
    if (result.data) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: result.data.is_published } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "blog_posts", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const startEdit = (p: BlogPost) => {
    setForm({
      slug: p.slug,
      image_url: p.image_url ?? "",
      primary_region_slug: p.primary_region_slug ?? "",
      title_en: p.title_en ?? "", title_tr: p.title_tr ?? "", title_de: p.title_de ?? "",
      title_pl: p.title_pl ?? "", title_ru: p.title_ru ?? "", title_nl: p.title_nl ?? "",
      content_en: p.content_en ?? "", content_tr: p.content_tr ?? "", content_de: p.content_de ?? "",
      content_pl: p.content_pl ?? "", content_ru: p.content_ru ?? "", content_nl: p.content_nl ?? "",
      excerpt_en: p.excerpt_en ?? "", excerpt_tr: p.excerpt_tr ?? "", excerpt_de: p.excerpt_de ?? "",
      excerpt_pl: p.excerpt_pl ?? "", excerpt_ru: p.excerpt_ru ?? "", excerpt_nl: p.excerpt_nl ?? "",
      slug_en: p.slug_en ?? "", slug_tr: p.slug_tr ?? "", slug_de: p.slug_de ?? "",
      slug_pl: p.slug_pl ?? "", slug_ru: p.slug_ru ?? "", slug_nl: p.slug_nl ?? "",
    });
    setEditingId(p.id);
    setShowForm(true);
    setImageBroken(false);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        setUploadError(result.error || "Yükleme başarısız oldu");
        return;
      }
      updateField("image_url", result.url);
      setImageBroken(false);
    } catch {
      setUploadError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeTitle = form[`title_${activeLang}` as keyof FormState];
  const activeExcerpt = form[`excerpt_${activeLang}` as keyof FormState];
  const activeSlugOverride = form[`slug_${activeLang}` as keyof FormState];
  const previewSlug = activeSlugOverride || form.slug || "yazi-basligi";
  const previewUrl = `${SITE_URL} › ${activeLang} › blog › ${previewSlug}`;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">{posts.length} yazı</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          Yeni Yazı
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 space-y-6">
          {/* ── General section ── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Genel</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (genel / yedek)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", slugify(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="my-blog-post"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bağlantılı Bölge <span className="text-gray-400 font-normal">(opsiyonel — CTA fiyatı için)</span>
                </label>
                <select
                  value={form.primary_region_slug}
                  onChange={(e) => updateField("primary_region_slug", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="">— Yok —</option>
                  {regions.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.name_tr || r.name_en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image upload + URL + preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Görseli</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="relative w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                  {form.image_url && !imageBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setImageBroken(true)}
                      onLoad={() => setImageBroken(false)}
                    />
                  ) : (
                    <ImageIcon size={22} className="text-gray-300" />
                  )}
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => { updateField("image_url", ""); setImageBroken(false); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                      aria-label="Görseli kaldır"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                      id="blog-image-upload"
                    />
                    <label
                      htmlFor="blog-image-upload"
                      className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploading ? "Yükleniyor..." : "Bilgisayardan Yükle"}
                    </label>
                  </div>
                  {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                  <div>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => { updateField("image_url", e.target.value); setImageBroken(false); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="veya bir görsel URL'si yapıştırın"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">JPG, PNG, WEBP veya GIF · en fazla 5MB · önerilen oran 16:9</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Language tabs ── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dil İçeriği</h3>
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
              {LOCALES.map((lang) => {
                const hasContent = !!form[`title_${lang}` as keyof FormState];
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeLang === lang ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {LOCALE_LABELS[lang]}
                    {hasContent && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Başlık <span className="text-gray-400 font-normal">(sayfa H1 + Google başlığı)</span>
              </label>
              <span className={`text-xs ${activeTitle.length > 60 ? "text-amber-600" : "text-gray-400"}`}>{activeTitle.length}/60</span>
            </div>
            <input
              type="text"
              value={activeTitle}
              onChange={(e) => updateField(`title_${activeLang}`, e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder={`${LOCALE_LABELS[activeLang]} başlığı`}
            />
          </div>

          {/* Meta description / excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Meta Açıklama <span className="text-gray-400 font-normal">(Google&apos;da başlığın altında görünür)</span>
              </label>
              <span className={`text-xs ${activeExcerpt.length > 160 ? "text-amber-600" : "text-gray-400"}`}>{activeExcerpt.length}/160</span>
            </div>
            <textarea
              value={activeExcerpt}
              onChange={(e) => updateField(`excerpt_${activeLang}`, e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-y"
              placeholder="Arama sonuçlarında görünecek kısa açıklama (~150-160 karakter)"
            />
            <p className="mt-1 text-xs text-gray-500">Boş bırakılırsa içerikten otomatik kısaltılır — ama tıklanma oranı için elle yazmanız önerilir.</p>
          </div>

          {/* Google SERP preview */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              <Search size={12} /> Google&apos;da Böyle Görünecek
            </p>
            <div className="bg-white rounded-lg p-3.5 border border-gray-100">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-700 mb-0.5">
                <Globe size={12} className="text-gray-400" />
                <span className="truncate">{previewUrl}</span>
              </div>
              <p className="text-[19px] leading-snug text-blue-700 truncate" style={{ fontFamily: "arial, sans-serif" }}>
                {(activeTitle || "Blog yazısı başlığı").slice(0, 65)}
              </p>
              <p className="text-[13px] leading-snug text-gray-600 line-clamp-2" style={{ fontFamily: "arial, sans-serif" }}>
                {(activeExcerpt || "Bu yazı için meta açıklama girilmedi — Google, içerikten otomatik bir özet gösterecek.").slice(0, 160)}
              </p>
            </div>
          </div>

          {/* URL slug for this language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL slug ({LOCALE_LABELS[activeLang]})</label>
            <input
              type="text"
              value={activeSlugOverride}
              onChange={(e) => updateField(`slug_${activeLang}`, slugify(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Boş bırakılırsa üstteki genel slug kullanılır"
            />
            <p className="mt-1 text-xs text-gray-500">
              Bu dilin URL&apos;si. Okuyucunun dilinde yazın — Google sonuçlarında başlığın altında görünür ve tıklanma oranını etkiler.
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İçerik ({LOCALE_LABELS[activeLang]})</label>
            <textarea
              value={form[`content_${activeLang}` as keyof FormState]}
              onChange={(e) => updateField(`content_${activeLang}`, e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-orange-500 outline-none resize-y"
              placeholder={`${LOCALE_LABELS[activeLang]} içeriği (HTML destekler: <h2>, <p>, <img>, <a>...)`}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Yazı</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Slug</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Durum</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Tarih</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                        {post.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-gray-300" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 line-clamp-2">
                        {post.title_en || post.title_tr || "Başlıksız"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{post.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.is_published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {post.is_published ? "Yayında" : "Taslak"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(post.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title={post.is_published ? "Yayından Kaldır" : "Yayınla"}
                      >
                        <Power size={14} className={post.is_published ? "text-green-600" : "text-gray-400"} />
                      </button>
                      <button onClick={() => startEdit(post)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Edit2 size={14} className="text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Henüz blog yazısı yok. İlk yazınızı oluşturun!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
