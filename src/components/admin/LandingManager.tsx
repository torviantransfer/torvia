"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

import { scoreSeo, TITLE_IDEAL_MAX, DESC_IDEAL_MAX } from "@/lib/seoScore";
import { landingSlugProblem, regionSlugForms, slugifyLanding } from "@/lib/landingSlug";
import { htmlWordCount } from "@/lib/richText";
import SerpPreview from "./seo/SerpPreview";
import SocialPreview from "./seo/SocialPreview";
import SeoScorePanel, { ScoreBadge } from "./seo/SeoScorePanel";

const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro"] as const;
type Loc = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Loc, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
  ro: "Română",
};

/**
 * The per-language columns a landing page carries.
 *
 * Every list in this file is built from LOCALES × this array rather than
 * written out. The hand-written version of the same thing in BlogManager
 * listed thirty-six assignments, stopped at `nl`, and that is how Romanian
 * shipped with a meta title but no body for months. A list that cannot be
 * half-written cannot do that.
 */
const LOCALISED_FIELDS = [
  "h1",
  "intro",
  "content",
  "meta_title",
  "meta_description",
  "focus_keyword",
  "keywords",
  "canonical_url",
  "og_title",
  "og_description",
  "twitter_title",
  "twitter_description",
] as const;

type LocalisedField = (typeof LOCALISED_FIELDS)[number];

export interface LandingRow {
  id: string;
  slug: string;
  label: string;
  is_published: boolean;
  cta_region_slug: string | null;
  image_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  nofollow: boolean | null;
  updated_at: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
}

/**
 * Written as an explicit interface rather than inferred from `emptyForm`.
 *
 * The localised columns are generated, so the shape needs an index signature
 * to address them — and inferring one from a spread of `Record<string, string>`
 * would put the two boolean flags in conflict with it. Declaring the signature
 * as `string | boolean` says what the form actually holds.
 */
interface FormState {
  slug: string;
  label: string;
  cta_region_slug: string;
  image_url: string;
  og_image_url: string;
  image_alt: string;
  noindex: boolean;
  nofollow: boolean;
  [key: string]: string | boolean;
}

const emptyForm: FormState = {
  // The generated columns go first so the named fields below cannot be widened
  // to `string` by a spread that lands on top of them.
  ...(Object.fromEntries(
    LOCALES.flatMap((l) => LOCALISED_FIELDS.map((f) => [`${f}_${l}`, ""]))
  ) as Record<string, string>),
  slug: "",
  label: "",
  cta_region_slug: "",
  image_url: "",
  og_image_url: "",
  image_alt: "",
  noindex: false,
  nofollow: false,
};

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none";

/** How complete one language is, for the dot on its tab. */
function localeStatus(form: FormState, l: Loc): "full" | "partial" | "empty" {
  const h1 = String(form[`h1_${l}`] ?? "").trim();
  const content = String(form[`content_${l}`] ?? "").trim();
  const title = String(form[`meta_title_${l}`] ?? "").trim();
  const desc = String(form[`meta_description_${l}`] ?? "").trim();
  const filled = [h1, content, title, desc].filter(Boolean).length;
  if (filled === 4) return "full";
  return filled === 0 ? "empty" : "partial";
}

export default function LandingManager({
  initialPages,
}: {
  initialPages: LandingRow[];
}) {
  const [pages, setPages] = useState<LandingRow[]>(initialPages);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [activeLang, setActiveLang] = useState<Loc>("tr");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRegions(d);
      })
      .catch(() => {});
  }, []);

  /**
   * Every URL a landing page is not allowed to take, in both the bare and
   * `-transfer` forms a region occupies. The same check runs again in
   * /api/admin/crud — this copy exists so the editor can say why before a save
   * is attempted, not so the server can trust it.
   */
  const regionSlugs = useMemo(
    () => regions.flatMap((r) => regionSlugForms(r.slug)),
    [regions]
  );
  const takenSlugs = useMemo(
    () => pages.filter((p) => p.id !== editingId).map((p) => p.slug),
    [pages, editingId]
  );
  const slugProblem = useMemo(
    () => (form.slug ? landingSlugProblem(String(form.slug), regionSlugs, takenSlugs) : null),
    [form.slug, regionSlugs, takenSlugs]
  );

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const localised = (f: LocalisedField, l: Loc = activeLang) =>
    String(form[`${f}_${l}`] ?? "");

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setActiveLang("tr");
    setSaveError(null);
    setUploadError(null);
  };

  const startCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setActiveLang("tr");
    setSaveError(null);
    setShowForm(true);
  };

  const startEdit = (p: LandingRow) => {
    setForm({
      ...emptyForm,
      // Built from LOCALES x LOCALISED_FIELDS, so a language added to the list
      // is loaded into the form by the same line that displays it.
      ...(Object.fromEntries(
        LOCALES.flatMap((l) =>
          LOCALISED_FIELDS.map((f) => [`${f}_${l}`, (p[`${f}_${l}`] as string | null) ?? ""])
        )
      ) as Record<string, string>),
      slug: p.slug,
      label: p.label,
      cta_region_slug: p.cta_region_slug ?? "",
      image_url: p.image_url ?? "",
      og_image_url: p.og_image_url ?? "",
      image_alt: p.image_alt ?? "",
      noindex: p.noindex === true,
      nofollow: p.nofollow === true,
    });
    setEditingId(p.id);
    setActiveLang("tr");
    setSaveError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Refused here as well as on the server, because the server's message
    // arrives after a round trip and this one arrives while the field is still
    // focused.
    if (slugProblem) {
      setSaveError(slugProblem);
      return;
    }
    if (!String(form.label).trim()) {
      setSaveError("Panel adı boş olamaz — listede sayfayı bu isimle bulacaksınız.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "landing_pages",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            slug: String(form.slug).trim(),
            label: String(form.label).trim(),
            cta_region_slug: form.cta_region_slug || null,
            image_url: form.image_url || null,
            og_image_url: form.og_image_url || null,
            image_alt: form.image_alt || null,
            // Tri-state on the column: false is written as null so an unticked
            // box means "leave the page's own directive alone" rather than
            // "force index", which is what the rest of the panel's noindex
            // switches mean.
            noindex: form.noindex ? true : null,
            nofollow: form.nofollow ? true : null,
            ...Object.fromEntries(
              LOCALES.flatMap((l) =>
                LOCALISED_FIELDS.map((f) => [`${f}_${l}`, String(form[`${f}_${l}`] ?? "") || null])
              )
            ),
          },
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setSaveError(result.error || "Kaydedilemedi.");
        return;
      }
      if (result.data) {
        setPages((prev) =>
          editingId
            ? prev.map((p) => (p.id === editingId ? (result.data as LandingRow) : p))
            : [result.data as LandingRow, ...prev]
        );
        resetForm();
      }
    } catch {
      setSaveError("Kaydedilemedi — bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "landing_pages",
        action: "toggle",
        id,
        data: { field: "is_published" },
      }),
    });
    const result = await res.json();
    if (result.data) {
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_published: result.data.is_published } : p))
      );
    }
  };

  const handleDelete = async (p: LandingRow) => {
    if (
      !confirm(
        `"${p.label}" sayfası silinsin mi?\n\n/${p.slug} adresi 404 vermeye başlar. Sayfa Google'da yer alıyorsa silmek yerine yayından kaldırmayı düşünün.`
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "landing_pages", action: "delete", id: p.id }),
    });
    const result = await res.json();
    if (result.success) setPages((prev) => prev.filter((x) => x.id !== p.id));
  };

  const handleFileSelect = async (file: File | undefined, field: "image_url" | "og_image_url") => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "landing");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        setUploadError(result.error || "Yükleme başarısız oldu");
        return;
      }
      set(field, result.url);
    } catch {
      setUploadError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // The same scorer the SEO screen and the blog editor use, so one page is
  // never judged by two rule sets that have drifted apart.
  const score = useMemo(
    () =>
      scoreSeo({
        title: localised("meta_title") || localised("h1"),
        description: localised("meta_description") || localised("intro"),
        focusKeyword: localised("focus_keyword"),
        keywords: localised("keywords"),
        slug: String(form.slug) || "sayfa-adresi",
        content: localised("content"),
        contentWordCount: htmlWordCount(localised("content")),
        h1: localised("h1"),
        imageUrl: String(form.image_url),
        ogImageUrl: String(form.og_image_url) || String(form.image_url),
        imageAlt: String(form.image_alt) || localised("h1"),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, activeLang]
  );

  const focusField = (field: string) => {
    const el = document.getElementById(`landing-${field}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus();
  };

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------
  if (!showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Panelden oluşturulan landing sayfaları. Adres{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100 text-[12px]">/dil/slug</code> biçiminde,
            kod sayfalarıyla aynı seviyede yayınlanır.
          </p>
          <button
            onClick={startCreate}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={15} /> Yeni landing sayfası
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">
              Henüz landing sayfası yok. Yeni bir sayfa oluşturduğunuzda burada listelenir.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {pages.map((p) => {
              const filled = LOCALES.filter(
                (l) =>
                  String(p[`h1_${l}`] ?? "").trim() && String(p[`content_${l}`] ?? "").trim()
              );
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">{p.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.is_published
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.is_published ? "Yayında" : "Taslak"}
                      </span>
                      {p.noindex === true && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                          noindex
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-gray-500">
                      <code>/{p.slug}</code>
                      <span aria-hidden>·</span>
                      <span
                        className={filled.length === LOCALES.length ? "" : "text-amber-600"}
                        title="Kendi H1 ve içeriği olan diller. Eksik diller noindex yayınlanır ve site haritasına girmez."
                      >
                        {filled.length}/{LOCALES.length} dil
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {p.is_published && (
                      <a
                        href={`/tr/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Sayfayı aç"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => handleToggle(p.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title={p.is_published ? "Yayından kaldır" : "Yayınla"}
                    >
                      {p.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------
  const previewTitle = localised("meta_title") || localised("h1") || String(form.label);
  const previewDesc = localised("meta_description") || localised("intro");

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-gray-900">
          {editingId ? "Landing sayfasını düzenle" : "Yeni landing sayfası"}
        </h2>
        <div className="flex items-center gap-2">
          <ScoreBadge percent={score.percent} />
          <button
            type="button"
            onClick={resetForm}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Kapat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ---- Identity: the fields that are the same in every language ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel adı <span className="text-gray-400 font-normal">(sadece burada görünür)</span>
            </label>
            <input
              id="landing-label"
              value={String(form.label)}
              onChange={(e) => {
                const label = e.target.value;
                set("label", label);
                // Only while creating, and only until the slug is touched: a
                // published page's slug is its URL, and rewriting it because
                // someone fixed a typo in the panel name would retire a URL
                // Google already has.
                if (!editingId && !String(form.slug).trim()) {
                  set("slug", slugifyLanding(label));
                }
              }}
              className={inputClass}
              placeholder="Örn. Antalya Kayak Transferi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL adresi <span className="text-gray-400 font-normal">(slug)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-400 shrink-0">/tr/</span>
              <input
                id="landing-slug"
                value={String(form.slug)}
                onChange={(e) => set("slug", slugifyLanding(e.target.value))}
                className={`${inputClass} ${slugProblem ? "border-red-400" : ""}`}
                placeholder="antalya-kayak-transfer"
                required
              />
            </div>
            {slugProblem ? (
              <p className="mt-1 text-xs text-red-600">{slugProblem}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Tüm dillerde aynı adres kullanılır. Yayındaki bir sayfanın adresini değiştirmek
                eski URL&apos;yi 404 yapar.
              </p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rezervasyon bölgesi{" "}
              <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <select
              value={String(form.cta_region_slug)}
              onChange={(e) => set("cta_region_slug", e.target.value)}
              className={inputClass}
            >
              <option value="">Seçilmedi — genel rezervasyon formu</option>
              {regions.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name_tr || r.name_en}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Seçilirse sayfanın altındaki butona bu bölgenin fiyatı ve rezervasyon bağlantısı
              gelir, ayrıca bölge sayfasına iç link verilir.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görsel alt metni
            </label>
            <input
              id="landing-image_alt"
              value={String(form.image_alt)}
              onChange={(e) => set("image_alt", e.target.value)}
              className={inputClass}
              placeholder="Görselde ne olduğunu yazın"
            />
          </div>
        </div>

        {/* Images */}
        <div className="grid sm:grid-cols-2 gap-4">
          {(
            [
              {
                field: "image_url" as const,
                label: "Kapak görseli",
                hint: "Sayfanın üstünde görünür.",
              },
              {
                field: "og_image_url" as const,
                label: "Paylaşım görseli (1200×630)",
                hint: "WhatsApp ve Facebook önizlemesi. Boşsa kapak görseli kullanılır.",
              },
            ]
          ).map(({ field, label, hint }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  value={String(form[field])}
                  onChange={(e) => set(field, e.target.value)}
                  className={inputClass}
                  placeholder="/images/... veya https://..."
                />
                <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <input
                    ref={field === "image_url" ? fileInputRef : undefined}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0], field)}
                  />
                  Yükle
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">{hint}</p>
              {String(form[field]) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(form[field])}
                  alt=""
                  className="mt-2 h-20 w-full object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>
          ))}
        </div>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

        {/* Robots */}
        <div className="flex flex-wrap gap-5 pt-1">
          {(
            [
              {
                key: "noindex" as const,
                label: "Arama motorlarına kapat (noindex)",
                hint: "Sayfa yayında kalır ama Google dizinine girmez.",
              },
              {
                key: "nofollow" as const,
                label: "Bağlantıları takip etme (nofollow)",
                hint: "Sayfadaki linkler için.",
              },
            ]
          ).map(({ key, label, hint }) => (
            <label key={key} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="mt-0.5 accent-orange-500"
              />
              <span>
                {label}
                <span className="block text-xs text-gray-500">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ---- Language tabs ---- */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-gray-100">
        {LOCALES.map((l) => {
          const status = localeStatus(form, l);
          const dot = { full: "#16a34a", partial: "#d97706", empty: "#cbd5e1" }[status];
          const on = activeLang === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setActiveLang(l)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                on ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
              {LOCALE_LABELS[l]}
            </button>
          );
        })}
      </div>

      {localeStatus(form, activeLang) !== "full" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Bu dilde H1 ve içerik dolu değilse sayfa o dilde <strong>noindex</strong> yayınlanır,
            site haritasına girmez ve İngilizce metni gösterir. Bu kasıtlı: çevrilmemiş bir sayfayı
            Google&apos;a ayrı bir dil gibi sunmak kopya içerik sayılır.
          </span>
        </div>
      )}

      {/* ---- Per-language copy ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sayfa başlığı — H1 ({LOCALE_LABELS[activeLang]})
          </label>
          <input
            id="landing-h1"
            value={localised("h1")}
            onChange={(e) => set(`h1_${activeLang}`, e.target.value)}
            className={inputClass}
            placeholder="Sayfanın en üstünde görünen başlık"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giriş paragrafı ({LOCALE_LABELS[activeLang]})
          </label>
          <textarea
            id="landing-intro"
            value={localised("intro")}
            onChange={(e) => set(`intro_${activeLang}`, e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
            placeholder="Başlığın altındaki kısa açıklama. Meta açıklama boşsa bu metin kullanılır."
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              İçerik — HTML ({LOCALE_LABELS[activeLang]})
            </label>
            <span className="text-xs text-gray-400">
              {htmlWordCount(localised("content"))} kelime
            </span>
          </div>
          <textarea
            id="landing-content"
            value={localised("content")}
            onChange={(e) => set(`content_${activeLang}`, e.target.value)}
            rows={14}
            className={`${inputClass} font-mono resize-y`}
            placeholder={"<h2>Alt başlık</h2>\n<p>Paragraf...</p>\n<ul><li>Madde</li></ul>"}
          />
          <p className="mt-1 text-xs text-gray-500">
            <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>,{" "}
            <code>&lt;table&gt;</code>, <code>&lt;img&gt;</code>, <code>&lt;a&gt;</code> ve YouTube
            gömme desteklenir. Yayınlanırken temizlenir; <code>&lt;h1&gt;</code> yazarsanız{" "}
            <code>&lt;h2&gt;</code>&apos;ye çevrilir — sayfanın H1&apos;i yukarıdaki alandır.
          </p>
        </div>
      </div>

      {/* ---- Per-language SEO ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <h3 className="text-[13px] font-semibold text-gray-900">
          SEO — {LOCALE_LABELS[activeLang]}
        </h3>

        <div>
          <div className="flex items-end justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Meta başlık{" "}
              <span className="text-gray-400 font-normal">(Google sonucundaki mavi başlık)</span>
            </label>
            <span
              className={`text-xs ${
                localised("meta_title").length > TITLE_IDEAL_MAX ? "text-amber-600" : "text-gray-400"
              }`}
            >
              {localised("meta_title").length}/{TITLE_IDEAL_MAX}
            </span>
          </div>
          <input
            id="landing-meta_title"
            value={localised("meta_title")}
            onChange={(e) => set(`meta_title_${activeLang}`, e.target.value)}
            className={inputClass}
            placeholder="Boş bırakılırsa H1 kullanılır"
          />
          <p className="mt-1 text-xs text-gray-500">
            &quot;| TORVIAN Transfer&quot; otomatik eklenir — kendiniz yazarsanız iki kez
            görünmemesi için tekrarı temizlenir.
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Meta açıklama</label>
            <span
              className={`text-xs ${
                localised("meta_description").length > DESC_IDEAL_MAX
                  ? "text-amber-600"
                  : "text-gray-400"
              }`}
            >
              {localised("meta_description").length}/{DESC_IDEAL_MAX}
            </span>
          </div>
          <textarea
            id="landing-meta_description"
            value={localised("meta_description")}
            onChange={(e) => set(`meta_description_${activeLang}`, e.target.value)}
            rows={2}
            className={`${inputClass} resize-y`}
            placeholder="Boş bırakılırsa giriş paragrafı kullanılır"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odak anahtar kelime
            </label>
            <input
              id="landing-focus_keyword"
              value={localised("focus_keyword")}
              onChange={(e) => set(`focus_keyword_${activeLang}`, e.target.value)}
              className={inputClass}
              placeholder="antalya kayak transfer"
            />
            <p className="mt-1 text-xs text-gray-500">
              Sayfanın sıralanmasını istediğiniz tek terim. Puanlama başlık, açıklama ve metni buna
              göre denetler.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yardımcı kelimeler
            </label>
            <input
              id="landing-keywords"
              value={localised("keywords")}
              onChange={(e) => set(`keywords_${activeLang}`, e.target.value)}
              className={inputClass}
              placeholder="virgülle ayırın"
            />
            <p className="mt-1 text-xs text-gray-500">
              Sayfaya meta keywords etiketi olarak basılmaz — Google bunu yok sayar; yalnızca
              denetim için kullanılır.
            </p>
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900">
            Gelişmiş: canonical, Open Graph, Twitter
          </summary>
          <div className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
              <input
                id="landing-canonical_url"
                value={localised("canonical_url")}
                onChange={(e) => set(`canonical_url_${activeLang}`, e.target.value)}
                className={inputClass}
                placeholder="Boş bırakın — sayfa kendi adresini kullanır"
              />
              <p className="mt-1 text-xs text-gray-500">
                Yalnızca bu sayfanın başka bir sayfanın kopyası olduğunu söylemek için doldurun.
                Site dışı bir adres yazılırsa yok sayılır.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {(
                [
                  ["og_title", "Open Graph başlık"],
                  ["og_description", "Open Graph açıklama"],
                  ["twitter_title", "Twitter başlık"],
                  ["twitter_description", "Twitter açıklama"],
                ] as const
              ).map(([f, label]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    id={`landing-${f}`}
                    value={localised(f)}
                    onChange={(e) => set(`${f}_${activeLang}`, e.target.value)}
                    className={inputClass}
                    placeholder="Boşsa meta değeri kullanılır"
                  />
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>

      {/* ---- Previews and score ---- */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <SerpPreview
            title={previewTitle}
            description={previewDesc}
            path={String(form.slug)}
            locale={activeLang}
            keywords={localised("keywords")
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean)}
          />
          <SocialPreview
            title={localised("og_title") || previewTitle}
            description={localised("og_description") || previewDesc}
            imageUrl={String(form.og_image_url) || String(form.image_url)}
            path={String(form.slug)}
            locale={activeLang}
          />
        </div>
        <SeoScorePanel score={score} onFieldClick={focusField} />
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading || uploading || Boolean(slugProblem)}
          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Vazgeç
        </button>
        {editingId && (
          <span className="self-center text-xs text-gray-500 inline-flex items-center gap-1.5">
            <ImageIcon size={13} />
            Kaydettikten sonra sayfa birkaç saniye içinde yayına yansır.
          </span>
        )}
      </div>
    </form>
  );
}
