"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Info, Loader2, Upload } from "lucide-react";

import { landingSlugProblem, regionSlugForms, slugifyLanding } from "@/lib/landingSlug";
import { outlineArticle, TOC_MIN_WORDS, INLINE_CARD_MIN_WORDS } from "@/lib/articleOutline";
import { Button, Chip, ConfirmDialog, Field, IconButton, Input, Segmented, Textarea, cx, useToast } from "@/components/admin/ui";
import type { LandingRow } from "./LandingManager";

const RichEditor = dynamic(() => import("./blog/RichEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[560px] items-center justify-center rounded-adm-lg border border-adm-line bg-adm-surface text-adm-muted">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
    </div>
  ),
});

export const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"] as const;
export type Loc = (typeof LOCALES)[number];
export const LOCALE_LABELS: Record<Loc, string> = {
  tr: "Türkçe", en: "English", de: "Deutsch", pl: "Polski", ru: "Русский", nl: "Nederlands", ro: "Română", ar: "العربية",
};

/**
 * The per-language columns this screen owns.
 *
 * Meta title, meta description, keywords, canonical, the Open Graph/Twitter
 * fields and the robots switches stay out of this list on purpose: they are
 * edited on the SEO Yönetimi screen, which is the one place that answers
 * "what does this URL tell Google". Having both screens write the same
 * column is how two editors end up disagreeing about one page.
 */
const LOCALISED_FIELDS = ["slug", "h1", "intro", "content"] as const;
type LocalisedField = (typeof LOCALISED_FIELDS)[number];

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
}

interface Form {
  slug: string;
  label: string;
  cta_region_slug: string;
  image_url: string;
  image_alt: string;
  [key: string]: string;
}

function toForm(page: LandingRow | null): Form {
  const form: Form = {
    slug: page?.slug ?? "",
    label: page?.label ?? "",
    cta_region_slug: (page?.cta_region_slug as string | null) ?? "",
    image_url: (page?.image_url as string | null) ?? "",
    image_alt: (page?.image_alt as string | null) ?? "",
  };
  for (const l of LOCALES) for (const f of LOCALISED_FIELDS) form[`${f}_${l}`] = String(page?.[`${f}_${l}`] ?? "");
  return form;
}

const dateOnly = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

/** How complete one language is, for the dot on its tab. */
function localeStatus(form: Form, l: Loc): "full" | "partial" | "empty" {
  const filled = [form[`h1_${l}`], form[`content_${l}`]].filter((v) => v.trim()).length;
  return filled === 2 ? "full" : filled === 0 ? "empty" : "partial";
}

export default function LandingEditor({
  page,
  regions,
  siblings,
  onSaved,
  onClose,
}: {
  /** Null for a new page. */
  page: LandingRow | null;
  regions: Region[];
  /** Every other landing page, for the slug-collision check. */
  siblings: LandingRow[];
  onSaved: (row: LandingRow, created: boolean) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const pathname = usePathname();
  const adminLocale = pathname.split("/")[1] || "tr";

  const [form, setForm] = useState<Form>(() => toForm(page));
  const [saved, setSaved] = useState<Form>(() => toForm(page));
  const [published, setPublished] = useState<boolean>(page?.is_published ?? false);
  const [publishedAt, setPublishedAt] = useState<string>(dateOnly((page?.published_at as string | null) ?? null));
  const [lang, setLang] = useState<Loc>(() => LOCALES.find((l) => String(page?.[`h1_${l}`] ?? "").trim()) ?? "tr");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initialPublished = page?.is_published ?? false;
  const initialDate = dateOnly((page?.published_at as string | null) ?? null);
  const initial = useMemo(() => toForm(page), [page]);
  const dirty =
    JSON.stringify(form) !== JSON.stringify(initial) || published !== initialPublished || publishedAt !== initialDate;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const v = (field: LocalisedField) => form[`${field}_${lang}`] ?? "";

  // ── Slug validation — every URL a landing page may not take, in both the
  // bare and "-transfer" forms a region occupies. Re-checked in
  // /api/admin/crud; this copy exists so the editor can say why before a
  // save is attempted, not so the server can trust it.
  const regionSlugs = useMemo(() => regions.flatMap((r) => regionSlugForms(r.slug)), [regions]);
  const takenSlugs = useMemo(
    () => siblings.flatMap((p) => [p.slug, ...LOCALES.map((l) => String(p[`slug_${l}`] ?? "").trim()).filter(Boolean)]),
    [siblings]
  );
  const slugProblem = form.slug ? landingSlugProblem(form.slug, regionSlugs, takenSlugs) : null;
  const localeSlugProblem = (l: Loc) => {
    const val = form[`slug_${l}`]?.trim();
    return val ? landingSlugProblem(val, regionSlugs, takenSlugs) : null;
  };
  const firstLocaleSlugProblem = LOCALES.map((l) => [l, localeSlugProblem(l)] as const).find(([, p]) => p) ?? null;

  const title = v("h1");
  const intro = v("intro");
  const content = v("content");
  const activeSlug = v("slug").trim() || form.slug || "sayfa-adresi";

  const outline = useMemo(() => outlineArticle(content), [content]);
  const readingMinutes = Math.max(1, Math.round(outline.wordCount / 200));

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "landing");
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
    if (slugProblem) {
      toast(slugProblem, "error");
      return;
    }
    if (firstLocaleSlugProblem) {
      const [l, problem] = firstLocaleSlugProblem;
      toast(`${LOCALE_LABELS[l]} adresi: ${problem}`, "error");
      setLang(l);
      return;
    }
    if (!form.label.trim()) {
      toast("Panel adı boş olamaz — listede sayfayı bu isimle bulacaksınız.", "error");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        slug: form.slug.trim(),
        label: form.label.trim(),
        cta_region_slug: form.cta_region_slug || null,
        image_url: form.image_url || null,
        image_alt: form.image_alt || null,
        is_published: published,
      };
      for (const l of LOCALES) for (const f of LOCALISED_FIELDS) data[`${f}_${l}`] = form[`${f}_${l}`].trim() || null;
      if (publishedAt !== initialDate || !page) {
        data.published_at = publishedAt ? `${publishedAt}T12:00:00.000Z` : new Date().toISOString();
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "landing_pages", action: page ? "update" : "create", id: page?.id, data }),
      });
      const result = await res.json();
      if (!res.ok || result.error || !result.data) {
        toast(result.error || "Kaydedilemedi", "error");
        return;
      }
      const row = result.data as LandingRow;
      setSaved(toForm(row));
      setForm(toForm(row));
      toast(page ? "Sayfa güncellendi" : "Sayfa oluşturuldu");
      onSaved(row, !page);
    } catch {
      toast("Kaydedilemedi, bağlantıyı kontrol edin", "error");
    } finally {
      setSaving(false);
    }
  };

  const publicHref = `/${lang}/${activeSlug}`;
  const livePost = page && initialPublished && String(page[`h1_${lang}`] ?? "").trim();

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
          {page ? "Sayfayı düzenle" : "Yeni landing sayfası"}
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
          <Button type="submit" variant="primary" loading={saving} disabled={uploading || !!slugProblem || !!firstLocaleSlugProblem}>
            {page ? "Kaydet" : "Oluştur"}
          </Button>
        </div>
      </div>

      {/* ── Language ───────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-semibold text-adm-muted">Dil</span>
        <div role="tablist" aria-label="Sayfa dili" className="flex gap-1.5">
          {LOCALES.map((l) => {
            const status = localeStatus(form, l);
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
                  className={cx(
                    "size-1.5 rounded-full",
                    status === "full" ? "bg-adm-green" : status === "partial" ? "bg-adm-amber" : on ? "bg-white/40" : "bg-adm-line"
                  )}
                />
                {LOCALE_LABELS[l]}
              </button>
            );
          })}
        </div>
      </div>

      {localeStatus(form, lang) !== "full" && (
        <p className="mb-4 flex items-start gap-2 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5 text-[13px] text-adm-amber">
          <AlertTriangle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Bu dilde başlık ve içerik dolu değilse sayfa o dilde <strong>noindex</strong> yayınlanır ve site haritasına
            girmez. Bu kasıtlı: çevrilmemiş bir sayfayı Google&apos;a ayrı bir dil gibi sunmak kopya içerik sayılır.
          </span>
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* ── Writing column ───────────────────────────────────────── */}
        <div className="grid min-w-0 gap-4">
          <section className="rounded-adm-lg border border-adm-line bg-adm-surface px-5 py-4 shadow-adm-sm sm:px-8 sm:py-6">
            <label htmlFor="landing-h1" className="sr-only">Başlık</label>
            <textarea
              id="landing-h1"
              rows={1}
              value={title}
              onChange={(e) => set(`h1_${lang}`, e.target.value.replace(/\n/g, " "))}
              placeholder="Sayfa başlığı (H1)"
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="w-full resize-none bg-transparent text-[24px] font-bold leading-tight tracking-[-0.02em] text-adm-ink outline-none [field-sizing:content] placeholder:text-adm-faint sm:text-[28px]"
            />

            <div className="mt-4 flex min-w-0 items-center rounded-[9px] border border-adm-line bg-adm-surface-2 ps-3 text-[12.5px] focus-within:border-[#c9c8c2]">
              <span className="shrink-0 truncate text-adm-muted max-[520px]:max-w-[42%]" dir="ltr">
                torviantransfer.com/{lang}/
              </span>
              <label htmlFor="landing-slug-locale" className="sr-only">URL</label>
              <input
                id="landing-slug-locale"
                value={v("slug")}
                onChange={(e) => set(`slug_${lang}`, slugifyLanding(e.target.value))}
                placeholder={form.slug || "sayfa-adresi"}
                dir="ltr"
                aria-invalid={!!localeSlugProblem(lang)}
                className="h-8 min-w-0 flex-1 bg-transparent pe-3 font-mono text-adm-ink outline-none placeholder:text-adm-faint"
              />
            </div>
            {localeSlugProblem(lang) && <p className="mt-1.5 text-[12px] text-adm-rose">{localeSlugProblem(lang)}</p>}
            {!localeSlugProblem(lang) && (
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Boşsa varsayılan adres kullanılır. Yayındaki adres: torviantransfer.com/{lang}/{activeSlug}
              </p>
            )}
          </section>

          <section className="rounded-adm-lg border border-adm-line bg-adm-surface px-5 py-4 shadow-adm-sm sm:px-8">
            <label htmlFor="landing-intro" className="text-[13px] font-semibold text-adm-ink">Giriş paragrafı</label>
            <p className="mt-0.5 text-[12px] text-adm-muted">
              Başlığın altında ve yazının başında görünür. SEO Yönetimi&apos;nde meta açıklama boşsa arama sonucunda da bu kullanılır.
            </p>
            <Textarea
              id="landing-intro"
              value={intro}
              onChange={(e) => set(`intro_${lang}`, e.target.value)}
              rows={3}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="mt-2.5 text-[14px] leading-relaxed"
              placeholder="ör. Antalya'da özel transfer: havalimanından otelinize sabit fiyatla, doğrudan."
            />
          </section>

          <div>
            <RichEditor key={`${page?.id ?? "new"}-${lang}`} id="landing-content" value={content} onChange={(html) => set(`content_${lang}`, html)} locale={lang} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[12px] text-adm-muted">
              <span>
                <b className="font-semibold text-adm-ink-2">{outline.wordCount.toLocaleString("tr-TR")}</b> kelime · {readingMinutes} dk okuma
              </span>
              <Feature on={outline.showToc} label="İçindekiler" off={`${TOC_MIN_WORDS}+ kelime ve 3+ başlıkta`} />
              <Feature on={!!outline.after} label="Ara rezervasyon kartı" off={`${INLINE_CARD_MIN_WORDS}+ kelime ve 4+ başlıkta`} />
              <Feature on={outline.faqSeparated && outline.faq.length > 0} label={outline.faq.length ? `SSS · ${outline.faq.length} soru` : "SSS"} off="son bölüme SSS ekleyin" />
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
              <Field label="Yayın tarihi" htmlFor="landing-published-at">
                <Input id="landing-published-at" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Rezervasyon bölgesi">
            <Field
              htmlFor="landing-region"
              hint="Seçilirse sayfadaki fiyat ve rezervasyon butonu bu bölgeye göre gelir, bölge sayfasına da iç link verilir. Boşsa genel rezervasyon formu ve en ucuz fiyat gösterilir."
            >
              <select
                id="landing-region"
                value={form.cta_region_slug}
                onChange={(e) => set("cta_region_slug", e.target.value)}
                className="w-full rounded-[9px] border border-adm-line bg-adm-surface px-2.5 text-[13px] text-adm-ink shadow-adm-sm outline-none h-[34px] focus:border-[#c9c8c2] focus:ring-[3px] focus:ring-adm-ink/[0.06]"
              >
                <option value="">Seçilmedi — genel rezervasyon</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.slug}>{r.name_tr || r.name_en}</option>
                ))}
              </select>
            </Field>
          </Panel>

          <Panel title="Kapak görseli">
            <div className="grid gap-3">
              <div className="relative flex aspect-[2/1] items-center justify-center overflow-hidden rounded-adm-sm border border-adm-line bg-adm-surface-2">
                {form.image_url && !imageBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="size-full object-cover" onError={() => setImageBroken(true)} onLoad={() => setImageBroken(false)} />
                ) : (
                  <Upload size={22} aria-hidden="true" className="text-adm-faint" />
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
              <Button icon={uploading ? Loader2 : Upload} onClick={() => fileRef.current?.click()} disabled={uploading}>
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
              <Field label="Alt metni" htmlFor="landing-image-alt" hint="Görselde ne olduğunu yazın. Tüm dillerde ortak.">
                <Input id="landing-image-alt" value={form.image_alt} onChange={(e) => set("image_alt", e.target.value)} placeholder="ör. Antalya Havalimanı'nda özel transfer aracı" />
              </Field>
              <p className="text-[11px] text-adm-muted">Paylaşım görseli (WhatsApp / Facebook) SEO Yönetimi&apos;nden ayrıca ayarlanır.</p>
            </div>
          </Panel>

          <Panel title="Sayfa ayarları">
            <div className="grid gap-3.5">
              <Field label="Panel adı" htmlFor="landing-label" hint="Sadece listede görünür, sayfada değil.">
                <Input
                  id="landing-label"
                  required
                  value={form.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    set("label", label);
                    // Only while creating and only until the slug is touched: a
                    // published page's slug is its URL, rewriting it because a
                    // typo got fixed in the panel name would retire a live URL.
                    if (!page && !form.slug.trim()) set("slug", slugifyLanding(label));
                  }}
                  placeholder="ör. Antalya Kayak Transferi"
                />
              </Field>
              <Field
                label="Varsayılan adres (slug)"
                htmlFor="landing-slug"
                error={slugProblem ?? undefined}
                hint={slugProblem ? undefined : "Dil sekmesinde ayrı adres girilmezse her dil bu adresi kullanır."}
              >
                <Input id="landing-slug" required value={form.slug} onChange={(e) => set("slug", slugifyLanding(e.target.value))} aria-invalid={!!slugProblem} className="font-mono" placeholder="antalya-kayak-transfer" />
              </Field>
            </div>
          </Panel>

          <Link
            href={`/${adminLocale}/admin/seo`}
            className="flex items-center gap-2 rounded-adm-lg border border-adm-line bg-adm-surface px-4 py-3 text-[12.5px] font-semibold text-adm-brand-ink shadow-adm-sm hover:underline"
          >
            <Info size={14} aria-hidden="true" />
            Meta başlık, açıklama, anahtar kelime, paylaşım → SEO Yönetimi
          </Link>
        </aside>
      </div>

      {dirty && (
        <div className="sticky bottom-3 z-20 mt-5 flex items-center gap-3 rounded-adm-lg bg-adm-ink px-4 py-2.5 text-white shadow-adm-lg">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">Kaydedilmemiş değişiklikler var</span>
          <button
            type="button"
            onClick={() => {
              setForm(saved);
              setPublished(initialPublished);
              setPublishedAt(initialDate);
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
            {page ? "Kaydet" : "Oluştur"}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm">
      <header className="flex items-center gap-2 border-b border-adm-line-2 px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Feature({ on, label, off }: { on: boolean; label: string; off: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1", on ? "text-adm-green" : "text-adm-muted")} title={on ? undefined : `Görünmesi için: ${off}`}>
      {label}
      {!on && <span className="text-adm-faint">· {off}</span>}
    </span>
  );
}
