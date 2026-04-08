"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, Eye, EyeOff } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title_tr: string | null;
  title_en: string | null;
  title_de: string | null;
  title_pl: string | null;
  title_ru: string | null;
  content_tr: string | null;
  content_en: string | null;
  content_de: string | null;
  content_pl: string | null;
  content_ru: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

interface Props {
  initialPosts: BlogPost[];
}

const LOCALES = ["en", "tr", "de", "pl", "ru"] as const;
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
};

const emptyForm = {
  slug: "",
  title_en: "",
  title_tr: "",
  title_de: "",
  title_pl: "",
  title_ru: "",
  content_en: "",
  content_tr: "",
  content_de: "",
  content_pl: "",
  content_ru: "",
  image_url: "",
};

export default function BlogManager({ initialPosts }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [activeLang, setActiveLang] = useState<string>("en");

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setActiveLang("en");
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
            title_en: form.title_en || null,
            title_tr: form.title_tr || null,
            title_de: form.title_de || null,
            title_pl: form.title_pl || null,
            title_ru: form.title_ru || null,
            content_en: form.content_en || null,
            content_tr: form.content_tr || null,
            content_de: form.content_de || null,
            content_pl: form.content_pl || null,
            content_ru: form.content_ru || null,
            image_url: form.image_url || null,
            ...(!editingId && { published_at: new Date().toISOString() }),
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (editingId) {
          setPosts((prev) =>
            prev.map((p) => (p.id === editingId ? result.data : p))
          );
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
      body: JSON.stringify({
        table: "blog_posts",
        action: "toggle",
        id,
        data: { field: "is_published" },
      }),
    });
    const result = await res.json();
    if (result.data) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_published: result.data.is_published } : p
        )
      );
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
      title_en: p.title_en ?? "",
      title_tr: p.title_tr ?? "",
      title_de: p.title_de ?? "",
      title_pl: p.title_pl ?? "",
      title_ru: p.title_ru ?? "",
      content_en: p.content_en ?? "",
      content_tr: p.content_tr ?? "",
      content_de: p.content_de ?? "",
      content_pl: p.content_pl ?? "",
      content_ru: p.content_ru ?? "",
      image_url: p.image_url ?? "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">{posts.length} yazı</p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          Yeni Yazı
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  updateField(
                    "slug",
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                  )
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="my-blog-post"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resim URL
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {LOCALES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeLang === lang
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {LOCALE_LABELS[lang]}
              </button>
            ))}
          </div>

          {/* Title & content for active language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık ({LOCALE_LABELS[activeLang]})
            </label>
            <input
              type="text"
              value={form[`title_${activeLang}` as keyof typeof form]}
              onChange={(e) => updateField(`title_${activeLang}`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder={`${LOCALE_LABELS[activeLang]} başlığı`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İçerik ({LOCALE_LABELS[activeLang]})
            </label>
            <textarea
              value={form[`content_${activeLang}` as keyof typeof form]}
              onChange={(e) =>
                updateField(`content_${activeLang}`, e.target.value)
              }
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-y"
              placeholder={`${LOCALE_LABELS[activeLang]} içeriği (HTML destekler)`}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Başlık
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Slug
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">
                Durum
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">
                Tarih
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {post.title_en || post.title_tr || "Başlıksız"}
                </td>
                <td className="px-4 py-3 text-gray-500">{post.slug}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.is_published ? (
                      <Eye size={12} />
                    ) : (
                      <EyeOff size={12} />
                    )}
                    {post.is_published ? "Yayında" : "Taslak"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(post.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title={
                        post.is_published ? "Yayından Kaldır" : "Yayınla"
                      }
                    >
                      <Power
                        size={14}
                        className={
                          post.is_published
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      />
                    </button>
                    <button
                      onClick={() => startEdit(post)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Henüz blog yazısı yok. İlk yazınızı oluşturun!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
