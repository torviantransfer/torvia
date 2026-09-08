"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  X,
  ExternalLink,
  AlertTriangle,
  Search,
} from "lucide-react";

import { landingSlugProblem, regionSlugForms, slugifyLanding } from "@/lib/landingSlug";
import { htmlWordCount } from "@/lib/richText";

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
 * The per-language columns this screen owns.
 *
 * Deliberately short. Meta title, meta description, keywords, canonical, the
 * Open Graph and Twitter fields and the robots switches are *not* here: they
 * are edited on the SEO Yönetimi screen, which is the one place that answers
 * "what does this URL tell Google". Having both screens write the same column
 * is how two editors end up disagreeing about one page — the same reason a
 * blog post's H1 is editable in the blog editor and read-only in the SEO
 * panel. This screen owns what the visitor reads; that one owns what Google
 * is told.
 *
 * Every list below is built from LOCALES × this array rather than written out,
 * so a language cannot be added to the tabs without its columns coming with it.
 */
const LOCALISED_FIELDS = ["slug", "h1", "intro", "content"] as const;

type LocalisedField = (typeof LOCALISED_FIELDS)[number];

export interface LandingRow {
  id: string;
  slug: string;
  label: string;
  is_published: boolean;
  cta_region_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  updated_at: string | null;
  [key: string]: unknown;
}

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
}

/**
 * Written as an explicit interface rather than inferred from `emptyForm`: the
 * localised columns are generated, so the shape needs an index signature to
 * address them.
 */
interface FormState {
  slug: string;
  label: string;
  cta_region_slug: string;
  image_url: string;
  image_alt: string;
  [key: string]: string;
}

const emptyForm: FormState = {
  ...(Object.fromEntries(
    LOCALES.flatMap((l) => LOCALISED_FIELDS.map((f) => [`${f}_${l}`, ""]))
  ) as Record<string, string>),
  slug: "",
  label: "",
  cta_region_slug: "",
  image_url: "",
  image_alt: "",
};

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none";

/** How complete one language is, for the dot on its tab. */
function localeStatus(form: FormState, l: Loc): "full" | "partial" | "empty" {
  const filled = [form[`h1_${l}`], form[`content_${l}`]].filter((v) => String(v ?? "").trim()).length;
  if (filled === 2) return "full";
  return filled === 0 ? "empty" : "partial";
}

export default function LandingManager({ initialPages }: { initialPages: LandingRow[] }) {
  const pathname = usePathname();
  const adminLocale = pathname.split("/")[1] || "tr";

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
   * Every URL a landing page may not take, in both the bare and `-transfer`
   * forms a region occupies. The same check runs again in /api/admin/crud —
   * this copy exists so the editor can say why before a save is attempted, not
   * so the server can trust it.
   */
  const regionSlugs = useMemo(() => regions.flatMap((r) => regionSlugForms(r.slug)), [regions]);

  /** Every slug already spoken for by another landing page, in any language. */
  const takenSlugs = useMemo(
    () =>
      pages
        .filter((p) => p.id !== editingId)
        .flatMap((p) => [
          p.slug,
          ...LOCALES.map((l) => String(p[`slug_${l}`] ?? "").trim()).filter(Boolean),
        ]),
    [pages, editingId]
  );

  const slugProblem = useMemo(
    () => (form.slug ? landingSlugProblem(form.slug, regionSlugs, takenSlugs) : null),
    [form.slug, regionSlugs, takenSlugs]
  );

  /** Per-language slug overrides are optional; a blank one is not an error. */
  const localeSlugProblem = (l: Loc) => {
    const v = String(form[`slug_${l}`] ?? "").trim();
    if (!v) return null;
    return landingSlugProblem(v, regionSlugs, takenSlugs);
  };

  const firstLocaleSlugProblem = useMemo(
    () => LOCALES.map((l) => [l, localeSlugProblem(l)] as const).find(([, p]) => p) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, regionSlugs, takenSlugs]
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const localised = (f: LocalisedField, l: Loc = activeLang) => String(form[`${f}_${l}`] ?? "");

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
      ...(Object.fromEntries(
        LOCALES.flatMap((l) =>
          LOCALISED_FIELDS.map((f) => [`${f}_${l}`, (p[`${f}_${l}`] as string | null) ?? ""])
        )
      ) as Record<string, string>),
      slug: p.slug,
      label: p.label,
      cta_region_slug: p.cta_region_slug ?? "",
      image_url: p.image_url ?? "",
      image_alt: p.image_alt ?? "",
    });
    setEditingId(p.id);
    setActiveLang("tr");
    setSaveError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (slugProblem) {
      setSaveError(slugProblem);
      return;
    }
    if (firstLocaleSlugProblem) {
      const [l, problem] = firstLocaleSlugProblem;
      setSaveError(`${LOCALE_LABELS[l]} adresi: ${problem}`);
      setActiveLang(l);
      return;
    }
    if (!form.label.trim()) {
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
            slug: form.slug.trim(),
            label: form.label.trim(),
            cta_region_slug: form.cta_region_slug || null,
            image_url: form.image_url || null,
            image_alt: form.image_alt || null,
            ...Object.fromEntries(
              LOCALES.flatMap((l) =>
                LOCALISED_FIELDS.map((f) => [
                  `${f}_${l}`,
                  String(form[`${f}_${l}` as keyof FormState] ?? "").trim() || null,
                ])
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

  const handleFileSelect = async (file: File | undefined) => {
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
      set("image_url", result.url);
    } catch {
      setUploadError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------
  if (!showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Sayfa metni ve adresi bu ekranda. Meta başlık, açıklama ve diğer arama ayarları{" "}
            <Link
              href={`/${adminLocale}/admin/seo`}
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              SEO Yönetimi
            </Link>{" "}
            ekranında — tek yerde.
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
                (l) => String(p[`h1_${l}`] ?? "").trim() && String(p[`content_${l}`] ?? "").trim()
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
                    <Link
                      href={`/${adminLocale}/admin/seo`}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="SEO ayarları (SEO Yönetimi ekranı)"
                    >
                      <Search size={15} />
                    </Link>
                    {p.is_published && (
                      <a
                        href={`/tr/${String(p.slug_tr ?? "").trim() || p.slug}`}
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
  const activeSlug = localised("slug").trim() || form.slug || "sayfa-adresi";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-gray-900">
          {editingId ? "Landing sayfasını düzenle" : "Yeni landing sayfası"}
        </h2>
        <button
          type="button"
          onClick={resetForm}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Kapat"
        >
          <X size={16} />
        </button>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[13px] text-blue-900">
        <Search size={15} className="mt-0.5 shrink-0" />
        <span>
          Bu ekran sayfanın <strong>metnini ve adresini</strong> tutar. Meta başlık, meta açıklama,
          anahtar kelime, paylaşım görseli ve noindex ayarları{" "}
          <Link
            href={`/${adminLocale}/admin/seo`}
            className="underline underline-offset-2 font-medium"
          >
            SEO Yönetimi
          </Link>{" "}
          ekranındadır — orada Google önizlemesi ve puanlama ile birlikte. Kaydettikten sonra sayfa
          orada &quot;Landing&quot; grubunda listelenir.
        </span>
      </div>

      {/* ---- Identity ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel adı <span className="text-gray-400 font-normal">(sadece burada görünür)</span>
            </label>
            <input
              id="landing-label"
              value={form.label}
              onChange={(e) => {
                const label = e.target.value;
                set("label", label);
                // Only while creating, and only until the slug is touched: a
                // published page's slug is its URL, and rewriting it because
                // someone fixed a typo in the panel name would retire a URL
                // Google already has.
                if (!editingId && !form.slug.trim()) set("slug", slugifyLanding(label));
              }}
              className={inputClass}
              placeholder="Örn. Antalya Kayak Transferi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Varsayılan adres <span className="text-gray-400 font-normal">(slug)</span>
            </label>
            <input
              id="landing-slug"
              value={form.slug}
              onChange={(e) => set("slug", slugifyLanding(e.target.value))}
              className={`${inputClass} ${slugProblem ? "border-red-400" : ""}`}
              placeholder="antalya-kayak-transfer"
              required
            />
            {slugProblem ? (
              <p className="mt-1 text-xs text-red-600">{slugProblem}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Dil sekmesinde ayrı adres girmediğiniz her dil bu adresi kullanır.
              </p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rezervasyon bölgesi <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <select
              value={form.cta_region_slug}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel alt metni</label>
            <input
              id="landing-image_alt"
              value={form.image_alt}
              onChange={(e) => set("image_alt", e.target.value)}
              className={inputClass}
              placeholder="Görselde ne olduğunu yazın"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kapak görseli</label>
          <div className="flex items-center gap-2">
            <input
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              className={inputClass}
              placeholder="/images/... veya https://..."
            />
            <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              Yükle
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Sayfanın üstünde görünür. Paylaşım görseli (WhatsApp / Facebook) SEO Yönetimi
            ekranından ayarlanır.
          </p>
          {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.image_url}
              alt=""
              className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200"
            />
          )}
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
            {LOCALE_LABELS[activeLang]} adresi{" "}
            <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400 shrink-0">/{activeLang}/</span>
            <input
              id="landing-locale-slug"
              value={localised("slug")}
              onChange={(e) => set(`slug_${activeLang}`, slugifyLanding(e.target.value))}
              className={`${inputClass} ${localeSlugProblem(activeLang) ? "border-red-400" : ""}`}
              placeholder={form.slug || "antalya-kayak-transfer"}
            />
          </div>
          {localeSlugProblem(activeLang) ? (
            <p className="mt-1 text-xs text-red-600">{localeSlugProblem(activeLang)}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Bu dile özel adres. Boş bırakılırsa varsayılan adres kullanılır. Sayfa eski
              adreslerinde de açılmaya devam eder — 301 ile buraya yönlendirilir.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Yayındaki adres: <code>/{activeLang}/{activeSlug}</code>
          </p>
        </div>

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
            placeholder="Başlığın altındaki kısa açıklama."
          />
          <p className="mt-1 text-xs text-gray-500">
            SEO Yönetimi&apos;nde meta açıklama boş bırakılırsa arama sonucunda bu metin kullanılır.
          </p>
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
            rows={16}
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

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading || uploading || Boolean(slugProblem) || Boolean(firstLocaleSlugProblem)}
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
        <Link
          href={`/${adminLocale}/admin/seo`}
          className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
        >
          <Search size={14} />
          SEO ayarlarına git
        </Link>
      </div>
    </form>
  );
}
