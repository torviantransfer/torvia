"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Edit2, Trash2, Power, Upload, Image as ImageIcon,
  Loader2, X, FileText, ArrowLeft,
} from "lucide-react";
import {
  scoreSeo,
  parseKeywords,
  TITLE_IDEAL_MAX,
  DESC_IDEAL_MAX,
} from "@/lib/seoScore";
import SerpPreview from "./seo/SerpPreview";
import SocialPreview from "./seo/SocialPreview";
import SeoScorePanel, { ScoreBadge } from "./seo/SeoScorePanel";
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  cx,
  type GridColumn,
} from "@/components/admin/ui";

interface BlogPost {
  id: string;
  slug: string;
  title_tr: string | null;
  title_en: string | null;
  title_de: string | null;
  title_pl: string | null;
  title_ru: string | null;
  title_nl: string | null;
  title_ro: string | null;
  title_ar: string | null;
  content_tr: string | null;
  content_en: string | null;
  content_de: string | null;
  content_pl: string | null;
  content_ru: string | null;
  content_nl: string | null;
  content_ro: string | null;
  content_ar: string | null;
  excerpt_tr: string | null;
  excerpt_en: string | null;
  excerpt_de: string | null;
  excerpt_pl: string | null;
  excerpt_ru: string | null;
  excerpt_nl: string | null;
  excerpt_ro: string | null;
  excerpt_ar: string | null;
  focus_keyword_tr: string | null;
  focus_keyword_en: string | null;
  focus_keyword_de: string | null;
  focus_keyword_pl: string | null;
  focus_keyword_ru: string | null;
  focus_keyword_nl: string | null;
  focus_keyword_ro: string | null;
  focus_keyword_ar: string | null;
  secondary_keywords_tr: string | null;
  secondary_keywords_en: string | null;
  secondary_keywords_de: string | null;
  secondary_keywords_pl: string | null;
  secondary_keywords_ru: string | null;
  secondary_keywords_nl: string | null;
  secondary_keywords_ro: string | null;
  secondary_keywords_ar: string | null;
  slug_tr: string | null;
  slug_en: string | null;
  slug_de: string | null;
  slug_pl: string | null;
  slug_ru: string | null;
  slug_nl: string | null;
  slug_ro: string | null;
  slug_ar: string | null;
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

// Romanian was missing here while the SEO panel offered it, so a post could
// have its Romanian meta title written but never its Romanian title, body or
// slug -- the two editors disagreed about how many languages the site has.
const LOCALES = ["en", "tr", "de", "pl", "ru", "nl", "ro", "ar"] as const;
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
  ro: "Română",
};

const emptyForm = {
  slug: "",
  image_url: "",
  primary_region_slug: "",
  title_en: "", title_tr: "", title_de: "", title_pl: "", title_ru: "", title_nl: "", title_ro: "",
  content_en: "", content_tr: "", content_de: "", content_pl: "", content_ru: "", content_nl: "", content_ro: "",
  excerpt_en: "", excerpt_tr: "", excerpt_de: "", excerpt_pl: "", excerpt_ru: "", excerpt_nl: "", excerpt_ro: "",
  focus_keyword_en: "", focus_keyword_tr: "", focus_keyword_de: "", focus_keyword_pl: "", focus_keyword_ru: "", focus_keyword_nl: "", focus_keyword_ro: "",
  secondary_keywords_en: "", secondary_keywords_tr: "", secondary_keywords_de: "", secondary_keywords_pl: "", secondary_keywords_ru: "", secondary_keywords_nl: "", secondary_keywords_ro: "",
  slug_en: "", slug_tr: "", slug_de: "", slug_pl: "", slug_ru: "", slug_nl: "", slug_ro: "",
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
  const [formSection, setFormSection] = useState<"general" | "content">("general");
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
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
    setFormSection("general");
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
                [`focus_keyword_${l}`, form[`focus_keyword_${l}` as keyof FormState] || null],
                [`secondary_keywords_${l}`, form[`secondary_keywords_${l}` as keyof FormState] || null],
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

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "blog_posts", action: "delete", id: deleting.id }),
    });
    const result = await res.json();
    setDeleteBusy(false);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    }
  };

  /** The six per-language columns a post carries, in one place. */
  const LOCALISED_FIELDS = [
    "title",
    "content",
    "excerpt",
    "focus_keyword",
    "secondary_keywords",
    "slug",
  ] as const;

  const startEdit = (p: BlogPost) => {
    // Built from LOCALES × LOCALISED_FIELDS rather than written out. The
    // hand-written version listed thirty-six assignments and stopped at `nl`,
    // so adding a seventh language meant remembering six more lines in this
    // one function — and the language that was added did not get them.
    setForm({
      ...emptyForm,
      slug: p.slug,
      image_url: p.image_url ?? "",
      primary_region_slug: p.primary_region_slug ?? "",
      ...(Object.fromEntries(
        LOCALES.flatMap((l) =>
          LOCALISED_FIELDS.map((f) => [
            `${f}_${l}`,
            (p[`${f}_${l}` as keyof BlogPost] as string | null) ?? "",
          ])
        )
      ) as Partial<FormState>),
    });
    setEditingId(p.id);
    setShowForm(true);
    setImageBroken(false);
    setFormSection("general");
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
  const activeFocusKeyword = form[`focus_keyword_${activeLang}` as keyof FormState];
  const activeSecondaryKeywords = form[`secondary_keywords_${activeLang}` as keyof FormState];
  const activeSlugOverride = form[`slug_${activeLang}` as keyof FormState];
  const activeContent = form[`content_${activeLang}` as keyof FormState];
  const previewSlug = activeSlugOverride || form.slug || "yazi-basligi";

  // The same scorer the SEO screen uses, so a post and a region page are
  // judged by one rule set rather than two that drift apart. The post's
  // excerpt is its meta description; there is no separate column.
  const score = scoreSeo({
    title: activeTitle,
    description: activeExcerpt,
    focusKeyword: activeFocusKeyword,
    keywords: activeSecondaryKeywords,
    slug: previewSlug,
    content: activeContent,
    h1: activeTitle,
    imageUrl: form.image_url,
    ogImageUrl: form.image_url,
    imageAlt: activeTitle,
  });

  const focusField = (field: string) => {
    const el = document.getElementById(`blog-${field}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus();
  };

  const columns: GridColumn<BlogPost>[] = [
    {
      key: "post",
      header: "Yazı",
      width: "minmax(220px,1.6fr)",
      area: "body",
      cell: (post) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-adm-sm border border-adm-line-2 bg-adm-line-2">
            {post.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.image_url} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon size={16} aria-hidden="true" className="text-adm-faint" />
            )}
          </div>
          <div className="min-w-0">
            <div className="line-clamp-1 text-[13.5px] font-semibold">{post.title_en || post.title_tr || "Başlıksız"}</div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-adm-muted">
              {post.slug}
              <span className="ms-1.5 flex items-center gap-0.5 font-sans" title="Dolu diller">
                {LOCALES.map((l) => (
                  <span
                    key={l}
                    aria-hidden="true"
                    className={cx("size-1.5 rounded-full", (post[`title_${l}` as keyof BlogPost] as string | null) ? "bg-adm-green" : "bg-adm-line-2")}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    { key: "seo", header: "SEO", width: "70px", area: "top-start", cell: (post) => <ScoreBadge percent={postScore(post)} /> },
    {
      key: "status",
      header: "Durum",
      width: "110px",
      area: "top-end",
      cell: (post) => (
        <Chip tone={post.is_published ? "green" : "neutral"} plain>
          {post.is_published ? "Yayında" : "Taslak"}
        </Chip>
      ),
    },
    { key: "date", header: "Tarih", width: "100px", area: "foot-start", cell: (post) => <span className="text-[13px] text-adm-muted">{new Date(post.created_at).toLocaleDateString("tr-TR")}</span> },
    {
      key: "actions",
      header: "",
      width: "110px",
      area: "foot-end",
      cell: (post) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            icon={Power}
            label={post.is_published ? "Yayından kaldır" : "Yayınla"}
            size="sm"
            onClick={() => handleToggle(post.id)}
            className={post.is_published ? "text-adm-green" : undefined}
          />
          <IconButton icon={Edit2} label="Düzenle" size="sm" onClick={() => startEdit(post)} />
          <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => setDeleting(post)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
        </div>
      ),
    },
  ];

  if (showForm) {
    return (
      <>
        <div className="mb-5 mt-3 flex flex-wrap items-center gap-3">
          <IconButton icon={ArrowLeft} label="Listeye dön" onClick={resetForm} className="rtl:rotate-180" />
          <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">{editingId ? "Yazıyı düzenle" : "Yeni yazı"}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs
            label="Yazı bölümleri"
            value={formSection}
            onChange={setFormSection}
            items={[
              { key: "general", label: "Genel" },
              { key: "content", label: "Dil içeriği" },
            ]}
          />

          {formSection === "general" && (
            <Card bodyClassName="grid gap-4 p-[18px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug (genel / yedek)" htmlFor="blog-base-slug">
                  <Input id="blog-base-slug" required value={form.slug} onChange={(e) => updateField("slug", slugify(e.target.value))} placeholder="my-blog-post" />
                </Field>
                <Field label="Bağlantılı bölge" htmlFor="blog-region" hint="Opsiyonel — CTA fiyatı için.">
                  <Select id="blog-region" value={form.primary_region_slug} onChange={(e) => updateField("primary_region_slug", e.target.value)}>
                    <option value="">— Yok —</option>
                    {regions.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name_tr || r.name_en}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Kapak görseli">
                <div className="flex flex-col items-start gap-3 sm:flex-row">
                  <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-adm-sm border border-adm-line bg-adm-surface-2 sm:w-40">
                    {form.image_url && !imageBroken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image_url} alt="" className="size-full object-cover" onError={() => setImageBroken(true)} onLoad={() => setImageBroken(false)} />
                    ) : (
                      <ImageIcon size={22} aria-hidden="true" className="text-adm-faint" />
                    )}
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField("image_url", "");
                          setImageBroken(false);
                        }}
                        aria-label="Görseli kaldır"
                        className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <div className="w-full flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => handleFileSelect(e.target.files?.[0])} className="hidden" id="blog-image-upload" />
                      <label htmlFor="blog-image-upload" className={buttonSecondaryLabelClass}>
                        {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
                        {uploading ? "Yükleniyor…" : "Bilgisayardan yükle"}
                      </label>
                    </div>
                    {uploadError && <p className="text-xs text-adm-rose">{uploadError}</p>}
                    <Input
                      value={form.image_url}
                      onChange={(e) => {
                        updateField("image_url", e.target.value);
                        setImageBroken(false);
                      }}
                      className="text-xs"
                      placeholder="veya bir görsel URL'si yapıştırın"
                    />
                    <p className="text-[11px] text-adm-muted">JPG, PNG, WEBP veya GIF · en fazla 5MB · önerilen oran 16:9</p>
                  </div>
                </div>
              </Field>
            </Card>
          )}

          {formSection === "content" && (
            <div className="grid gap-4">
              <div className="flex gap-1 overflow-x-auto border-b border-adm-line">
                {LOCALES.map((lang) => {
                  const hasContent = !!form[`title_${lang}` as keyof FormState];
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={cx(
                        "whitespace-nowrap border-b-2 px-4 py-2 text-[13.5px] font-medium transition-colors",
                        activeLang === lang ? "border-adm-ink text-adm-ink" : "border-transparent text-adm-muted hover:text-adm-ink-2"
                      )}
                    >
                      {LOCALE_LABELS[lang]}
                      {hasContent && <span aria-hidden="true" className="ms-1.5 inline-block size-1.5 rounded-full bg-adm-green align-middle" />}
                    </button>
                  );
                })}
              </div>

              <Card bodyClassName="grid gap-4 p-[18px]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Odak anahtar kelime" htmlFor="blog-focus_keyword" hint={LOCALE_LABELS[activeLang]}>
                    <Input id="blog-focus_keyword" value={activeFocusKeyword} onChange={(e) => updateField(`focus_keyword_${activeLang}`, e.target.value)} placeholder="ör. antalya havalimanı transfer" />
                  </Field>
                  <Field label="Yan kelimeler" htmlFor="blog-keywords" hint="Virgülle ayırın">
                    <Input id="blog-keywords" value={activeSecondaryKeywords} onChange={(e) => updateField(`secondary_keywords_${activeLang}`, e.target.value)} placeholder="ör. belek transfer, vip transfer" />
                  </Field>
                </div>

                <Field
                  label="Başlık"
                  htmlFor="blog-meta_title"
                  hint={
                    <span className={activeTitle.length > TITLE_IDEAL_MAX ? "text-adm-amber" : undefined}>
                      Sayfa H1 + Google başlığı · {activeTitle.length}/{TITLE_IDEAL_MAX}
                    </span>
                  }
                >
                  <Input id="blog-meta_title" value={activeTitle} onChange={(e) => updateField(`title_${activeLang}`, e.target.value)} placeholder={`${LOCALE_LABELS[activeLang]} başlığı`} />
                </Field>

                <Field
                  label="Meta açıklama"
                  htmlFor="blog-meta_description"
                  hint={
                    <span className={activeExcerpt.length > DESC_IDEAL_MAX ? "text-adm-amber" : undefined}>
                      Google&apos;da başlığın altında görünür · {activeExcerpt.length}/{DESC_IDEAL_MAX}
                    </span>
                  }
                >
                  <Textarea id="blog-meta_description" value={activeExcerpt} onChange={(e) => updateField(`excerpt_${activeLang}`, e.target.value)} rows={2} placeholder="Arama sonuçlarında görünecek kısa açıklama (~150-160 karakter)" />
                </Field>
                <p className="-mt-2 text-xs text-adm-muted">Boş bırakılırsa içerikten otomatik kısaltılır — ama tıklanma oranı için elle yazmanız önerilir.</p>

                {/* Previews and score, the same components the SEO screen uses. */}
                <div className="grid items-start gap-4 lg:grid-cols-2">
                  <div className="grid gap-4">
                    <SerpPreview
                      title={activeTitle}
                      description={activeExcerpt}
                      path={`blog/${previewSlug}`}
                      locale={activeLang}
                      keywords={[activeFocusKeyword, ...parseKeywords(activeSecondaryKeywords)].filter(Boolean)}
                      imageUrl={form.image_url || null}
                    />
                    <SocialPreview title={activeTitle} description={activeExcerpt} imageUrl={form.image_url || null} path={`blog/${previewSlug}`} locale={activeLang} />
                  </div>
                  <SeoScorePanel score={score} onFieldClick={focusField} />
                </div>

                <Field label={`URL slug (${LOCALE_LABELS[activeLang]})`} htmlFor="blog-slug" hint="Okuyucunun dilinde yazın; boş bırakılırsa üstteki genel slug kullanılır.">
                  <Input id="blog-slug" value={activeSlugOverride} onChange={(e) => updateField(`slug_${activeLang}`, slugify(e.target.value))} placeholder="Boş bırakılırsa üstteki genel slug kullanılır" />
                </Field>

                <Field label={`İçerik (${LOCALE_LABELS[activeLang]})`} htmlFor="blog-content">
                  <Textarea
                    id="blog-content"
                    value={form[`content_${activeLang}` as keyof FormState]}
                    onChange={(e) => updateField(`content_${activeLang}`, e.target.value)}
                    rows={12}
                    className="font-mono"
                    placeholder={`${LOCALE_LABELS[activeLang]} içeriği (HTML destekler: <h2>, <p>, <img>, <a>…)`}
                  />
                </Field>
              </Card>
            </div>
          )}

          <div className="mt-4 flex gap-2 border-t border-adm-line-2 pt-4">
            <Button type="submit" variant="primary" loading={loading || uploading}>
              {editingId ? "Güncelle" : "Oluştur"}
            </Button>
            <Button type="button" onClick={resetForm}>
              İptal
            </Button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Blog Yazıları"
        actions={
          <Button
            variant="primary"
            icon={Plus}
            compact
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Yeni yazı
          </Button>
        }
      />

      <DataGrid
        label="Blog yazıları"
        columns={columns}
        rows={posts}
        rowKey={(post) => post.id}
        onRowClick={(post) => startEdit(post)}
        empty={<EmptyState compact icon={FileText} title="Henüz blog yazısı yok" action={<Button onClick={() => setShowForm(true)}>İlk yazıyı oluştur</Button>} />}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Yazıyı sil"
        message={deleting ? `"${deleting.title_en || deleting.title_tr || deleting.slug}" kalıcı olarak silinecek.` : ""}
        confirmLabel="Sil"
        danger
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

const buttonSecondaryLabelClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-surface px-3.5 py-2 text-[13px] font-semibold text-adm-ink-2 transition-colors hover:bg-adm-surface-2";

/**
 * Row-level score for the posts table.
 *
 * Uses the first locale the post actually has a title in. Scoring every row
 * against a single fixed language would mark a Turkish-only post as broken
 * for a reason that is not a defect.
 */
function postScore(post: BlogPost): number {
  const lang = LOCALES.find((l) => (post[`title_${l}` as keyof BlogPost] as string | null)?.trim()) ?? "en";
  const pick = (prefix: string) =>
    ((post[`${prefix}_${lang}` as keyof BlogPost] as string | null) ?? "");
  return scoreSeo({
    title: pick("title"),
    description: pick("excerpt"),
    focusKeyword: pick("focus_keyword"),
    keywords: pick("secondary_keywords"),
    slug: pick("slug") || post.slug,
    content: pick("content"),
    h1: pick("title"),
    imageUrl: post.image_url ?? "",
    ogImageUrl: post.image_url ?? "",
    imageAlt: pick("title"),
  }).percent;
}
