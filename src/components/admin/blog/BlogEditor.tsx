"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, ChevronDown, ExternalLink, Image as ImageIcon, Info, Loader2, Upload, X,
} from "lucide-react";
import { scoreSeo, parseKeywords, DESC_IDEAL_MAX, TITLE_IDEAL_MAX } from "@/lib/seoScore";
import { outlineArticle, TOC_MIN_WORDS, INLINE_CARD_MIN_WORDS } from "@/lib/articleOutline";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import SerpPreview from "../seo/SerpPreview";
import SeoScorePanel, { ScoreBadge } from "../seo/SeoScorePanel";
import { Button, Chip, ConfirmDialog, Field, IconButton, Input, Segmented, Select, Textarea, cx, useToast } from "@/components/admin/ui";

// The editor touches `window` on load; it has nothing to render on the server.
const RichEditor = dynamic(() => import("./RichEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[560px] items-center justify-center rounded-adm-lg border border-adm-line bg-adm-surface text-adm-muted">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
    </div>
  ),
});

export type BlogPostRow = Record<string, unknown> & {
  id: string;
  slug: string;
  is_published: boolean;
  created_at: string;
};

export const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"] as const;
export const LOCALE_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
  ro: "Română",
  ar: "العربية",
};

/** Columns written once per language. */
const LOCALISED = ["title", "content", "excerpt", "slug", "focus_keyword", "secondary_keywords", "image_alt", "author_role"] as const;
/** Columns shared by every language. */
const SHARED = ["slug", "image_url", "primary_region_slug", "category", "author_name"] as const;

type Form = Record<string, string>;

function toForm(post: BlogPostRow | null): Form {
  const form: Form = {};
  for (const key of SHARED) form[key] = String(post?.[key] ?? "");
  for (const l of LOCALES) for (const f of LOCALISED) form[`${f}_${l}`] = String(post?.[`${f}_${l}`] ?? "");
  return form;
}

function slugify(v: string) {
  return v
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-");
}

const dateOnly = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

/** Maps a score check's field to the control that fixes it. */
const FIELD_TARGET: Record<string, string> = {
  meta_title: "blog-title",
  meta_description: "blog-excerpt",
  focus_keyword: "blog-focus",
  keywords: "blog-keywords",
  content: "blog-content",
  slug: "blog-slug",
  image_alt: "blog-image-alt",
  og_image_url: "blog-cover",
};

interface Region {
  slug: string;
  name_tr: string;
  name_en: string;
}

export default function BlogEditor({
  post,
  onSaved,
  onClose,
}: {
  /** Null for a new post. */
  post: BlogPostRow | null;
  onSaved: (row: BlogPostRow, created: boolean) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const pathname = usePathname();
  const adminLocale = pathname.split("/")[1] || "tr";

  const [form, setForm] = useState<Form>(() => toForm(post));
  const [saved, setSaved] = useState<Form>(() => toForm(post));
  const [published, setPublished] = useState<boolean>(post?.is_published ?? false);
  const [publishedAt, setPublishedAt] = useState<string>(dateOnly((post?.published_at as string | null) ?? null));
  const [touchUpdated, setTouchUpdated] = useState(false);
  const [lang, setLang] = useState<string>(() =>
    LOCALES.find((l) => String(post?.[`title_${l}`] ?? "").trim()) ?? "tr"
  );
  const [regions, setRegions] = useState<Region[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRegions(d); })
      .catch(() => {});
  }, []);

  const initialPublished = post?.is_published ?? false;
  const initialDate = dateOnly((post?.published_at as string | null) ?? null);
  const dirty =
    JSON.stringify(form) !== JSON.stringify(saved) ||
    published !== initialPublished ||
    publishedAt !== initialDate ||
    touchUpdated;

  // A closed tab with unsaved writing is the one loss the panel cannot undo.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const v = (field: string) => form[`${field}_${lang}`] ?? "";

  const title = v("title");
  const excerpt = v("excerpt");
  const content = v("content");
  const langSlug = v("slug") || form.slug;
  const metaTitle = String(post?.[`meta_title_${lang}`] ?? "").trim();
  const metaDescription = String(post?.[`meta_description_${lang}`] ?? "").trim();
  const serpTitle = metaTitle || title;
  const serpDescription = metaDescription || excerpt;

  const score = scoreSeo({
    title: serpTitle,
    description: serpDescription,
    focusKeyword: v("focus_keyword"),
    keywords: v("secondary_keywords"),
    slug: langSlug,
    content,
    h1: title,
    imageUrl: form.image_url,
    ogImageUrl: form.image_url,
    imageAlt: v("image_alt"),
  });

  // What the public page will build from this body (lib/articleOutline).
  const outline = useMemo(() => outlineArticle(content), [content]);
  const readingMinutes = Math.max(1, Math.round(outline.wordCount / 200));

  const focusControl = (field: string) => {
    const el = document.getElementById(FIELD_TARGET[field] ?? `blog-${field}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement | null)?.focus?.();
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) setUploadError(result.error || "Yükleme başarısız oldu");
      else {
        set("image_url", result.url);
        setImageBroken(false);
      }
    } catch {
      setUploadError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.slug.trim()) {
      toast("Genel slug boş olamaz (Yazı ayarları)", "error");
      focusControl("base-slug");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      for (const key of SHARED) data[key] = form[key].trim() || null;
      data.slug = form.slug.trim();
      for (const l of LOCALES) for (const f of LOCALISED) data[`${f}_${l}`] = form[`${f}_${l}`].trim() ? form[`${f}_${l}`] : null;
      data.is_published = published;
      if (publishedAt !== initialDate || !post) {
        // Noon UTC, so the date reads the same in every timezone the site serves.
        data.published_at = publishedAt ? `${publishedAt}T12:00:00.000Z` : new Date().toISOString();
      }
      if (touchUpdated) data.updated_at = new Date().toISOString();

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "blog_posts", action: post ? "update" : "create", id: post?.id, data }),
      });
      const result = await res.json();
      if (!res.ok || !result.data) {
        toast(result.error || "Kaydedilemedi", "error");
        return;
      }
      const row = result.data as BlogPostRow;
      setSaved(toForm(row));
      setForm(toForm(row));
      setTouchUpdated(false);
      toast(post ? "Yazı güncellendi" : "Yazı oluşturuldu");
      onSaved(row, !post);
    } catch {
      toast("Kaydedilemedi, bağlantıyı kontrol edin", "error");
    } finally {
      setSaving(false);
    }
  };

  const publicHref = `/${lang}/blog/${langSlug}`;
  const livePost = post && initialPublished && String(post[`title_${lang}`] ?? "").trim();

  return (
    <form onSubmit={save} className="pb-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <IconButton
          icon={ArrowLeft}
          label="Listeye dön"
          onClick={() => (dirty ? setLeaving(true) : onClose())}
          className="rtl:rotate-180"
        />
        <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">
          {post ? "Yazıyı düzenle" : "Yeni yazı"}
        </h1>
        <Chip tone={published ? "green" : "neutral"} plain>
          {published ? "Yayında" : "Taslak"}
        </Chip>
        <div className="ms-auto flex items-center gap-2">
          {livePost && (
            <a
              href={publicHref}
              target="_blank"
              rel="noopener"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold text-adm-ink-2 hover:bg-adm-line-2"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="max-[520px]:hidden">Sitede gör</span>
            </a>
          )}
          <Button type="submit" variant="primary" loading={saving} disabled={uploading}>
            {post ? "Kaydet" : "Oluştur"}
          </Button>
        </div>
      </div>

      {/* ── Language ───────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-semibold text-adm-muted">Dil</span>
        <div role="tablist" aria-label="Yazı dili" className="flex gap-1.5">
          {LOCALES.map((l) => {
            const filled = !!form[`title_${l}`].trim() && !!form[`content_${l}`].trim();
            const on = l === lang;
            return (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setLang(l)}
                className={cx(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-semibold transition-colors",
                  on ? "bg-adm-ink text-white" : "bg-adm-surface text-adm-ink-2 ring-1 ring-inset ring-adm-line hover:ring-adm-line-strong"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx("size-1.5 rounded-full", filled ? "bg-adm-green" : on ? "bg-white/40" : "bg-adm-line")}
                />
                {LOCALE_LABELS[l]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* ── Writing column ───────────────────────────────────────── */}
        <div className="grid min-w-0 gap-4">
          <section className="rounded-adm-lg border border-adm-line bg-adm-surface px-5 py-4 shadow-adm-sm sm:px-8 sm:py-6">
            <label htmlFor="blog-title" className="sr-only">Başlık</label>
            <textarea
              id="blog-title"
              rows={1}
              value={title}
              onChange={(e) => set(`title_${lang}`, e.target.value.replace(/\n/g, " "))}
              placeholder="Yazı başlığı"
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="w-full resize-none bg-transparent text-[24px] font-bold leading-tight tracking-[-0.02em] text-adm-ink outline-none [field-sizing:content] placeholder:text-adm-faint sm:text-[28px]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <Counter value={title.length} min={30} max={TITLE_IDEAL_MAX} label="Sayfa başlığı (H1)" />
              {metaTitle && <span className="text-adm-muted">· Google&apos;da SEO Yönetimi&apos;ndeki meta başlık görünür</span>}
            </div>

            <div className="mt-4 flex min-w-0 items-center rounded-[9px] border border-adm-line bg-adm-surface-2 ps-3 text-[12.5px] focus-within:border-[#c9c8c2]">
              <span className="shrink-0 truncate text-adm-muted max-[520px]:max-w-[42%]" dir="ltr">
                torviantransfer.com/{lang}/blog/
              </span>
              <label htmlFor="blog-slug" className="sr-only">URL</label>
              <input
                id="blog-slug"
                value={v("slug")}
                onChange={(e) => set(`slug_${lang}`, slugify(e.target.value))}
                placeholder={form.slug || "yazi-adresi"}
                dir="ltr"
                className="h-8 min-w-0 flex-1 bg-transparent pe-3 font-mono text-adm-ink outline-none placeholder:text-adm-faint"
              />
            </div>
            {post && initialPublished && v("slug") !== saved[`slug_${lang}`] && saved[`slug_${lang}`] && (
              <p className="mt-1.5 text-[12px] text-adm-amber">
                Yayındaki yazının adresini değiştiriyorsunuz. Eski adres yeni adrese yönlendirilir ama Google&apos;ın yeni adresi tanıması zaman alır.
              </p>
            )}
          </section>

          <section className="rounded-adm-lg border border-adm-line bg-adm-surface px-5 py-4 shadow-adm-sm sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="blog-excerpt" className="text-[13px] font-semibold text-adm-ink">Kısa cevap</label>
              <Counter value={excerpt.length} min={110} max={DESC_IDEAL_MAX} />
            </div>
            <p className="mt-0.5 text-[12px] text-adm-muted">
              Yazının en üstünde &quot;Kısa cevap&quot; kutusunda görünür; Google açıklaması da budur
              {metaDescription ? " (bu dilde SEO Yönetimi'nde ayrı bir meta açıklama yazılmış, Google'da o görünür)" : ""}.
              Okuyucunun sorusunu 1–2 cümlede cevaplayın.
            </p>
            <Textarea
              id="blog-excerpt"
              value={excerpt}
              onChange={(e) => set(`excerpt_${lang}`, e.target.value)}
              rows={3}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="mt-2.5 text-[14px] leading-relaxed"
              placeholder="ör. Uber Antalya'da çalışmıyor. Havalimanından otelinize en kolay yol, önceden rezerve edilen sabit fiyatlı özel transferdir."
            />
          </section>

          <div>
            <RichEditor
              key={`${post?.id ?? "new"}-${lang}`}
              id="blog-content"
              value={content}
              onChange={(html) => set(`content_${lang}`, html)}
              locale={lang}
            />
            {/* What the public page will do with this body. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[12px] text-adm-muted">
              <span>
                <b className="font-semibold text-adm-ink-2">{outline.wordCount.toLocaleString("tr-TR")}</b> kelime · {readingMinutes} dk okuma
              </span>
              <Feature on={outline.showToc} label="İçindekiler" off={`${TOC_MIN_WORDS}+ kelime ve 3+ başlıkta`} />
              <Feature on={!!outline.after} label="Ara rezervasyon kartı" off={`${INLINE_CARD_MIN_WORDS}+ kelime ve 4+ başlıkta`} />
              <Feature
                on={outline.faqSeparated && outline.faq.length > 0}
                label={outline.faq.length ? `SSS · ${outline.faq.length} soru` : "SSS"}
                off="son bölüme SSS ekleyin"
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="grid min-w-0 gap-4">
          <Panel title="Yayın">
            <div className="grid gap-3.5">
              <Segmented
                label="Durum"
                value={published ? "on" : "off"}
                onChange={(x) => setPublished(x === "on")}
                options={[
                  { value: "off", label: "Taslak" },
                  { value: "on", label: "Yayında" },
                ]}
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
              />
              <Field label="Yayın tarihi" htmlFor="blog-published-at">
                <Input id="blog-published-at" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
              </Field>
              {post && (
                <label className="flex items-start gap-2.5 rounded-adm-sm bg-adm-surface-2 p-2.5 text-[12.5px] text-adm-ink-2">
                  <input type="checkbox" className="mt-0.5" checked={touchUpdated} onChange={(e) => setTouchUpdated(e.target.checked)} />
                  <span>
                    <span className="font-semibold">Önemli güncelleme</span>
                    <span className="block text-[11.5px] text-adm-muted">
                      Sayfada &quot;Güncellendi: bugün&quot; yazar. Yalnızca içerik gerçekten yenilendiyse işaretleyin, yazım düzeltmelerinde değil.
                      {post.updated_at ? ` Son: ${new Date(String(post.updated_at)).toLocaleDateString("tr-TR")}` : ""}
                    </span>
                  </span>
                </label>
              )}
            </div>
          </Panel>

          <Panel
            title="SEO"
            subtitle={LOCALE_LABELS[lang]}
            action={<ScoreBadge percent={score.percent} />}
          >
            <div className="grid gap-3.5">
              <Field label="Odak anahtar kelime" htmlFor="blog-focus">
                <Input id="blog-focus" value={v("focus_keyword")} onChange={(e) => set(`focus_keyword_${lang}`, e.target.value)} placeholder="ör. uber antalya" />
              </Field>
              <Field label="Yan anahtar kelimeler" htmlFor="blog-keywords" hint="Virgülle ayırın">
                <Input id="blog-keywords" value={v("secondary_keywords")} onChange={(e) => set(`secondary_keywords_${lang}`, e.target.value)} placeholder="ör. antalya taksi, havalimanı ulaşım" />
              </Field>

              <SerpPreview
                title={serpTitle}
                description={serpDescription}
                path={`blog/${langSlug}`}
                locale={lang}
                keywords={[v("focus_keyword"), ...parseKeywords(v("secondary_keywords"))].filter(Boolean)}
                imageUrl={form.image_url || null}
              />

              <button
                type="button"
                onClick={() => setChecksOpen((o) => !o)}
                aria-expanded={checksOpen}
                className="flex items-center justify-between rounded-adm-sm px-1 py-1 text-[12.5px] font-semibold text-adm-ink-2 hover:text-adm-ink"
              >
                <span>
                  {score.passed}/{score.total} kontrol geçti
                  {score.total - score.passed > 0 && <span className="font-normal text-adm-muted"> · {score.total - score.passed} öneri</span>}
                </span>
                <ChevronDown size={15} aria-hidden="true" className={cx("transition-transform", checksOpen && "rotate-180")} />
              </button>
              {checksOpen && (
                <SeoScorePanel
                  score={score}
                  onFieldClick={focusControl}
                  note="Bu yazının içeriğine göre hesaplanır. Meta başlık, robots ve paylaşım ayarları SEO Yönetimi'nde."
                />
              )}

              <Link
                href={`/${adminLocale}/admin/seo`}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-adm-brand-ink hover:underline"
              >
                <Info size={13} aria-hidden="true" />
                Meta başlık, robots, sosyal paylaşım → SEO Yönetimi
              </Link>
            </div>
          </Panel>

          <Panel title="Kapak görseli">
            <div className="grid gap-3">
              <div className="relative flex aspect-[2/1] items-center justify-center overflow-hidden rounded-adm-sm border border-adm-line bg-adm-surface-2">
                {form.image_url && !imageBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="size-full object-cover" onError={() => setImageBroken(true)} onLoad={() => setImageBroken(false)} />
                ) : (
                  <ImageIcon size={24} aria-hidden="true" className="text-adm-faint" />
                )}
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => set("image_url", "")}
                    aria-label="Görseli kaldır"
                    className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
              <Button id="blog-cover" icon={uploading ? Loader2 : Upload} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Yükleniyor…" : form.image_url ? "Görseli değiştir" : "Bilgisayardan yükle"}
              </Button>
              {uploadError && <p className="text-xs text-adm-rose">{uploadError}</p>}
              <Input
                value={form.image_url}
                onChange={(e) => {
                  set("image_url", e.target.value);
                  setImageBroken(false);
                }}
                className="text-xs"
                placeholder="veya görsel adresi yapıştırın"
                aria-label="Görsel adresi"
              />
              <Field
                label={`Alt metni · ${LOCALE_LABELS[lang]}`}
                htmlFor="blog-image-alt"
                hint="Görselde ne olduğunu bu dilde yazın. Boşsa başlık kullanılır."
              >
                <Input id="blog-image-alt" value={v("image_alt")} onChange={(e) => set(`image_alt_${lang}`, e.target.value)} placeholder="ör. Antalya Havalimanı önünde Mercedes Vito" />
              </Field>
              <p className="text-[11px] text-adm-muted">JPG, PNG, WEBP · en fazla 5MB · en az 1200px genişlik, 2:1 oran</p>
            </div>
          </Panel>

          <Panel title="Yazı ayarları">
            <div className="grid gap-3.5">
              <Field label="Kategori" htmlFor="blog-category">
                <Select id="blog-category" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">— Seçilmedi —</option>
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Bağlantılı bölge" htmlFor="blog-region" hint="Fiyat kartı, otel listesi ve rezervasyon linki bu bölgeye göre gelir.">
                <Select id="blog-region" value={form.primary_region_slug} onChange={(e) => set("primary_region_slug", e.target.value)}>
                  <option value="">— Yok —</option>
                  {regions.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.name_tr || r.name_en}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Yazar" htmlFor="blog-author" hint="Tüm dillerde aynı. Boşsa yazar satırı çıkmaz.">
                  <Input id="blog-author" value={form.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="ör. Yusuf Yılmaz" />
                </Field>
                <Field label={`Yazar unvanı · ${LOCALE_LABELS[lang]}`} htmlFor="blog-author-role">
                  <Input id="blog-author-role" value={v("author_role")} onChange={(e) => set(`author_role_${lang}`, e.target.value)} placeholder="ör. Kurucu, TORVIAN Transfer" />
                </Field>
              </div>
              <Field label="Genel slug" htmlFor="blog-base-slug" hint="Bir dilin kendi adresi yoksa bu kullanılır. Yayındaki yazıda değiştirmeyin.">
                <Input id="blog-base-slug" required value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="yazi-adresi" className="font-mono" />
              </Field>
            </div>
          </Panel>
        </aside>
      </div>

      {/* Save bar: follows the writer down a long post once there is something to save. */}
      {dirty && (
        <div className="sticky bottom-3 z-20 mt-5 flex items-center gap-3 rounded-adm-lg bg-adm-ink px-4 py-2.5 text-white shadow-adm-lg">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">Kaydedilmemiş değişiklikler var</span>
          <button
            type="button"
            onClick={() => {
              setForm(saved);
              setPublished(initialPublished);
              setPublishedAt(initialDate);
              setTouchUpdated(false);
            }}
            className="h-8 rounded-adm-sm px-3 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white"
          >
            Geri al
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-8 items-center gap-1.5 rounded-adm-sm bg-white px-3.5 text-[13px] font-semibold text-adm-ink hover:bg-white/90 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {post ? "Kaydet" : "Oluştur"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={leaving}
        title="Kaydetmeden çıkılsın mı?"
        message="Kaydedilmemiş değişiklikler kaybolacak."
        confirmLabel="Kaydetmeden çık"
        cancelLabel="Düzenlemeye dön"
        danger
        onConfirm={onClose}
        onClose={() => setLeaving(false)}
      />
    </form>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm">
      <header className="flex items-center gap-2 border-b border-adm-line-2 px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
        {subtitle && <span className="text-[12px] text-adm-muted">{subtitle}</span>}
        {action && <span className="ms-auto">{action}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Counter({ value, min, max, label }: { value: number; min: number; max: number; label?: string }) {
  const tone = value === 0 ? "text-adm-muted" : value < min || value > max ? "text-adm-amber" : "text-adm-green";
  return (
    <span className={cx("tabular-nums", tone)}>
      {label ? `${label} · ` : ""}
      {value}/{max}
    </span>
  );
}

function Feature({ on, label, off }: { on: boolean; label: string; off: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1", on ? "text-adm-green" : "text-adm-muted")} title={on ? undefined : `Görünmesi için: ${off}`}>
      <CheckCircle2 size={13} aria-hidden="true" className={on ? undefined : "opacity-40"} />
      {label}
      {!on && <span className="text-adm-faint">· {off}</span>}
    </span>
  );
}
