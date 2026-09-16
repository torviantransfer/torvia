"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, ExternalLink, Info, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button, Chip, ConfirmDialog, Field, IconButton, Input, Segmented, Textarea, cx, useToast } from "@/components/admin/ui";
import { ImageField, LOCALES, LOCALE_LABELS, type Loc } from "@/components/admin/seo/fields";
import {
  REGION_FAQ_MAX,
  paragraphs,
  writePageContent,
  type RegionFaqEntry,
  type RegionPageContent,
} from "@/lib/regionContent";

/** What a language's page shows where nothing has been written (lib/regionDefaults). */
export interface RegionEditorDefaults {
  subtitle: string;
  about: string;
  faq: RegionFaqEntry[];
}

export interface RegionEditorProps {
  adminBase: string;
  /** False until migration 097 has run. */
  columnsReady: boolean;
  defaults: Record<string, RegionEditorDefaults>;
  /** The built-in picture the page uses while no image is set. */
  fallbackImage: string | null;
  region: {
    id: string;
    slug: string;
    isActive: boolean;
    isPopular: boolean;
    sortOrder: number;
    distanceKm: string;
    durationMinutes: string;
    imageUrl: string;
    routeName: string;
    hotels: string[];
    names: Record<string, string>;
    descriptions: Record<string, string>;
    content: RegionPageContent;
  };
}

interface Form {
  slug: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: string;
  distanceKm: string;
  durationMinutes: string;
  imageUrl: string;
  routeName: string;
  hotels: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  content: RegionPageContent;
}

/**
 * Fields that fall back to automatic text open with that text in them, so the
 * editor sees what the page says. Saving writes nothing for a field that still
 * holds its automatic text: the page keeps following the template (a new
 * duration, a renamed region) instead of freezing today's sentence.
 */
function toForm(region: RegionEditorProps["region"], defaults: Record<string, RegionEditorDefaults>): Form {
  const locales = Object.fromEntries(
    LOCALES.map((l) => {
      const c = region.content.locales[l];
      return [l, { ...c, subtitle: c.subtitle || defaults[l].subtitle, about: c.about || defaults[l].about }];
    })
  );
  return {
    slug: region.slug,
    isActive: region.isActive,
    isPopular: region.isPopular,
    sortOrder: String(region.sortOrder),
    distanceKm: region.distanceKm,
    durationMinutes: region.durationMinutes,
    imageUrl: region.imageUrl,
    routeName: region.routeName,
    hotels: region.hotels.join("\n"),
    names: { ...region.names },
    descriptions: { ...region.descriptions },
    content: { highlightImages: [...region.content.highlightImages], locales },
  };
}

const same = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

/**
 * One screen for a region: its facts, its page and its languages. It replaces
 * a dialog for name/description/distance and a separate page-content screen,
 * which showed the same region in two places and neither of them whole.
 * Layout matches the blog editor: writing on the left, settings on the right.
 */
export default function RegionEditor({ adminBase, columnsReady, defaults, fallbackImage, region }: RegionEditorProps) {
  const router = useRouter();
  const toast = useToast();

  const initial = useMemo(() => toForm(region, defaults), [region, defaults]);
  const [form, setForm] = useState<Form>(initial);
  // A save refreshes the server props; start again from what was stored.
  const [seed, setSeed] = useState(initial);
  if (seed !== initial) {
    setSeed(initial);
    setForm(initial);
  }
  const [lang, setLang] = useState<Loc>("tr");
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [autoFaqOpen, setAutoFaqOpen] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const current = form.content.locales[lang];
  const def = defaults[lang];
  const name = form.names[lang] || form.names.en || form.slug;

  const patch = (next: Partial<typeof current>) =>
    setForm((f) => ({
      ...f,
      content: { ...f.content, locales: { ...f.content.locales, [lang]: { ...f.content.locales[lang], ...next } } },
    }));

  /** Filled in by a person, not left on automatic text — drives the dot on each language. */
  const langState = (l: Loc): "full" | "partial" | "empty" => {
    const c = form.content.locales[l];
    const parts = [
      !!form.names[l]?.trim(),
      !!form.descriptions[l]?.trim(),
      !!c.subtitle.trim() && !same(c.subtitle, defaults[l].subtitle),
      !!c.about.trim() && !same(c.about, defaults[l].about),
      c.highlights.some((h) => h.title.trim()),
    ];
    const n = parts.filter(Boolean).length;
    return n === 0 ? "empty" : n === parts.length ? "full" : "partial";
  };

  const canSave = form.slug.trim() && form.names.tr.trim() && form.names.en.trim();

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSave) {
      toast("Slug ile Türkçe ve İngilizce ad zorunlu.", "error");
      return;
    }
    setSaving(true);
    try {
      // Automatic text is not stored — see toForm.
      const content: RegionPageContent = {
        highlightImages: form.content.highlightImages,
        locales: Object.fromEntries(
          LOCALES.map((l) => {
            const c = form.content.locales[l];
            return [
              l,
              {
                ...c,
                subtitle: same(c.subtitle, defaults[l].subtitle) ? "" : c.subtitle,
                about: same(c.about, defaults[l].about) ? "" : c.about,
              },
            ];
          })
        ),
      };

      const data: Record<string, unknown> = {
        slug: form.slug.trim(),
        is_active: form.isActive,
        is_popular: form.isPopular,
        sort_order: parseInt(form.sortOrder, 10) || 0,
        distance_km: form.distanceKm ? parseFloat(form.distanceKm) : null,
        duration_minutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
        image_url: form.imageUrl.trim() || null,
      };
      for (const l of LOCALES) {
        // A blank name falls back to English, so a missing translation still shows something.
        data[`name_${l}`] = form.names[l].trim() || form.names.en.trim();
        data[`description_${l}`] = form.descriptions[l].trim() || null;
      }
      if (columnsReady) {
        data.page_content = writePageContent(content);
        data.hotels = form.hotels.split("\n").map((s) => s.trim()).filter(Boolean);
        data.route_name = form.routeName.trim() || null;
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "regions", action: "update", id: region.id, data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) throw new Error(json?.error ?? "Kaydedilemedi.");
      toast("Kaydedildi. Sayfa birkaç saniye içinde güncellenir.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kaydedilemedi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const liveHref = `/${lang}/${form.slug.endsWith("-transfer") ? form.slug : `${form.slug}-transfer`}`;
  const aboutCount = paragraphs(current.about).length;
  const hotelCount = form.hotels.split("\n").filter((s) => s.trim()).length;

  return (
    <form onSubmit={save} className="pb-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <IconButton
          icon={ArrowLeft}
          label="Bölgelere dön"
          onClick={() => (dirty ? setLeaving(true) : router.push(`${adminBase}/regions`))}
          className="rtl:rotate-180"
        />
        <h1 className="min-w-0 truncate text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">
          {form.names.tr || region.slug}
        </h1>
        <Chip tone={form.isActive ? "green" : "neutral"} plain>
          {form.isActive ? "Aktif" : "Pasif"}
        </Chip>
        <div className="ms-auto flex items-center gap-2">
          {region.isActive && (
            <a
              href={liveHref}
              target="_blank"
              rel="noopener"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold text-adm-ink-2 hover:bg-adm-line-2"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="max-[520px]:hidden">Sitede gör</span>
            </a>
          )}
          <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
            {dirty ? "Kaydet" : "Kaydedildi"}
          </Button>
        </div>
      </div>

      {!columnsReady && (
        <div className="mb-4 flex items-start gap-2.5 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3">
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
          <p className="text-[12.5px] text-adm-amber">
            <b>097_region_page_content.sql</b> çalıştırılmamış. Ad, açıklama ve rota bilgileri kaydedilir; sayfa içeriği, oteller ve güzergah migration&apos;dan sonra kaydedilebilir.
          </p>
        </div>
      )}

      {/* ── Language ───────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-semibold text-adm-muted">Dil</span>
        <div role="tablist" aria-label="Sayfa dili" className="flex gap-1.5">
          {LOCALES.map((l) => {
            const state = langState(l);
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
                title={state === "full" ? "Dolu" : state === "partial" ? "Kısmen dolu" : "Boş"}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "size-1.5 rounded-full",
                    state === "full" ? "bg-adm-green" : state === "partial" ? "bg-adm-amber" : on ? "bg-white/40" : "bg-adm-line"
                  )}
                />
                {LOCALE_LABELS[l]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* ── Page content, per language ───────────────────────────── */}
        <div className="grid min-w-0 gap-4">
          <Panel title="Başlık ve giriş" subtitle={LOCALE_LABELS[lang]}>
            <div className="grid gap-4">
              <Field
                label="Bölge adı"
                htmlFor="region-name"
                hint={lang === "tr" || lang === "en" ? "Zorunlu." : `Boşsa İngilizce ad kullanılır${form.names.en ? `: ${form.names.en}` : ""}.`}
              >
                <Input
                  id="region-name"
                  value={form.names[lang]}
                  onChange={(e) => set("names", { ...form.names, [lang]: e.target.value })}
                  placeholder={lang !== "en" ? form.names.en : "Belek"}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  inputSize="lg"
                  className="font-semibold"
                />
              </Field>
              <AutoField
                id="region-subtitle"
                label="Hero alt başlığı"
                hint="Sayfa başlığının altındaki giriş cümlesi."
                value={current.subtitle}
                auto={def.subtitle}
                rows={2}
                dir={lang === "ar" ? "rtl" : "ltr"}
                onChange={(v) => patch({ subtitle: v })}
              />
            </div>
          </Panel>

          <Panel title={`${name} hakkında`} subtitle={LOCALE_LABELS[lang]}>
            <div className="grid gap-4">
              <Field
                label="Bölge açıklaması (ilk paragraf)"
                htmlFor="region-description"
                hint="Bölüm bu paragrafla başlar; bölge listelerinde ve Google'daki bölge bilgisinde de kullanılır."
              >
                <Textarea
                  id="region-description"
                  rows={4}
                  value={form.descriptions[lang]}
                  onChange={(e) => set("descriptions", { ...form.descriptions, [lang]: e.target.value })}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className="text-[14px] leading-relaxed"
                />
              </Field>
              <AutoField
                id="region-about"
                label="Devam paragrafları"
                hint={`Açıklamanın altında görünür. Paragrafları boş bir satırla ayırın${aboutCount > 1 ? ` · ${aboutCount} paragraf` : ""}.`}
                value={current.about}
                auto={def.about}
                rows={7}
                dir={lang === "ar" ? "rtl" : "ltr"}
                onChange={(v) => patch({ about: v })}
              />
            </div>
          </Panel>

          <Panel title="Öne çıkanlar" subtitle={`${LOCALE_LABELS[lang]} · görseller tüm dillerde ortak`}>
            <p className="mb-3 text-[12px] text-adm-muted">
              Bölgeye gelenlerin en çok gittiği yerler. Kart, başlığı ve görseli olduğunda sayfada görünür; üçü de boşsa bölüm çıkmaz.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {current.highlights.map((h, i) => (
                <div key={i} className="grid content-start gap-2.5 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                  <ImageField
                    label={`${i + 1}. kart`}
                    value={form.content.highlightImages[i]}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        content: { ...f.content, highlightImages: f.content.highlightImages.map((u, j) => (j === i ? v : u)) },
                      }))
                    }
                    folder="regions"
                    aspect="4/3"
                  />
                  <Input
                    aria-label={`${i + 1}. kart başlığı`}
                    value={h.title}
                    onChange={(e) => patch({ highlights: current.highlights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                    placeholder="Başlık"
                  />
                  <Textarea
                    aria-label={`${i + 1}. kart açıklaması`}
                    rows={3}
                    value={h.description}
                    onChange={(e) => patch({ highlights: current.highlights.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })}
                    placeholder="Kısa açıklama"
                  />
                  {h.title.trim() && !form.content.highlightImages[i] && (
                    <p className="text-[11.5px] text-adm-amber">Görsel yok, kart sayfada görünmez.</p>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Sık sorulan sorular"
            subtitle={LOCALE_LABELS[lang]}
            action={
              <Button
                icon={Plus}
                size="sm"
                disabled={current.faq.length >= REGION_FAQ_MAX}
                onClick={() => patch({ faq: [...current.faq, { question: "", answer: "" }] })}
              >
                Soru ekle
              </Button>
            }
          >
            <div className="grid gap-3">
              <p className="text-[12px] text-adm-muted">
                Bölgeye özel sorular listenin en üstünde görünür ve Google&apos;ın SSS verisine eklenir. En fazla {REGION_FAQ_MAX}.
              </p>
              {current.faq.map((f, i) => (
                <div key={i} className="grid gap-2.5 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`${i + 1}. soru`}
                      value={f.question}
                      onChange={(e) => patch({ faq: current.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })}
                      placeholder="Soru"
                      className="flex-1 font-medium"
                    />
                    <IconButton
                      icon={Trash2}
                      label="Soruyu sil"
                      size="sm"
                      onClick={() => patch({ faq: current.faq.filter((_, j) => j !== i) })}
                      className="hover:bg-adm-rose-soft hover:text-adm-rose"
                    />
                  </div>
                  <Textarea
                    aria-label={`${i + 1}. cevap`}
                    rows={3}
                    value={f.answer}
                    onChange={(e) => patch({ faq: current.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })}
                    placeholder="Cevap"
                  />
                  {(!f.question.trim() || !f.answer.trim()) && (
                    <p className="text-[11.5px] text-adm-amber">Sorusu veya cevabı boş olan kayıt kaydedilmez.</p>
                  )}
                </div>
              ))}

              {/* The template questions, as the page shows them, so the panel is the whole page. */}
              <div className="rounded-adm border border-adm-line">
                <button
                  type="button"
                  onClick={() => setAutoFaqOpen((o) => !o)}
                  aria-expanded={autoFaqOpen}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-start"
                >
                  <span className="text-[12.5px] font-semibold text-adm-ink-2">
                    Otomatik sorular · {def.faq.length}
                    <span className="block text-[11.5px] font-normal text-adm-muted">
                      Tüm bölgelerde ortak. Mesafe, süre, fiyat ve otel listesiyle otomatik dolar; buradan değiştirilmez.
                    </span>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" className={cx("shrink-0 text-adm-muted transition-transform", autoFaqOpen && "rotate-180")} />
                </button>
                {autoFaqOpen && (
                  <ol className="grid gap-3 border-t border-adm-line-2 px-3.5 py-3" dir={lang === "ar" ? "rtl" : "ltr"}>
                    {def.faq.map((f, i) => (
                      <li key={i} className="text-[12.5px]">
                        <p className="font-semibold text-adm-ink-2">{f.question}</p>
                        <p className="mt-0.5 text-adm-muted">{f.answer}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Settings, every language ─────────────────────────────── */}
        <aside className="grid min-w-0 gap-4">
          <Panel title="Yayın">
            <div className="grid gap-3.5">
              <Segmented
                label="Durum"
                value={form.isActive ? "on" : "off"}
                onChange={(v) => set("isActive", v === "on")}
                options={[
                  { value: "off", label: "Pasif" },
                  { value: "on", label: "Aktif" },
                ]}
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
              />
              <label className="flex items-start gap-2.5 text-[12.5px] text-adm-ink-2">
                <input type="checkbox" className="mt-0.5" checked={form.isPopular} onChange={(e) => set("isPopular", e.target.checked)} />
                <span>
                  <span className="font-semibold">Popüler bölge</span>
                  <span className="block text-[11.5px] text-adm-muted">Ana sayfada ve blog yazılarının altında listelenir.</span>
                </span>
              </label>
              <Field label="Sıra" htmlFor="region-sort" hint="Menülerde ve listelerde sıralama.">
                <Input id="region-sort" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="w-28" />
              </Field>
            </div>
          </Panel>

          <Panel title="Rota">
            <div className="grid gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mesafe (km)" htmlFor="region-distance">
                  <Input id="region-distance" type="number" step="0.1" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} />
                </Field>
                <Field label="Süre (dk)" htmlFor="region-duration">
                  <Input id="region-duration" type="number" value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
                </Field>
              </div>
              <Field label="Güzergah" htmlFor="region-route" hint="Havalimanından gidilen yol, ör. D400. Boşsa sayfada gösterilmez.">
                <Input id="region-route" value={form.routeName} onChange={(e) => set("routeName", e.target.value)} placeholder="D400" />
              </Field>
              <Field
                label="Slug"
                htmlFor="region-slug"
                hint={region.isActive ? "Yayındaki bölgenin adresi. Değiştirirseniz Google'daki sıralaması ve linkler etkilenir." : "Sayfa adresi: /tr/{slug}-transfer"}
              >
                <Input id="region-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} className="font-mono" />
              </Field>
              {region.isActive && form.slug !== region.slug && (
                <p className="-mt-1.5 text-[12px] text-adm-amber">Adres değişiyor. Emin değilseniz eski slug&apos;a geri dönün.</p>
              )}
            </div>
          </Panel>

          <Panel title="Sayfa görseli">
            <ImageField
              label="Ana görsel"
              value={form.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              folder="regions"
              aspect="16/10"
              hint={!form.imageUrl && fallbackImage ? `Boş: sitedeki hazır görsel kullanılıyor (${fallbackImage}).` : "Hero'da ve bölge bölümünde kullanılır. En az 1600px genişlik."}
            />
          </Panel>

          <Panel title="Oteller" subtitle={hotelCount ? `${hotelCount} otel` : undefined}>
            <Field htmlFor="region-hotels" hint="Her satıra bir otel. Bölge sayfasında, SSS'de ve bu bölgeye bağlı blog yazılarında listelenir.">
              <Textarea
                id="region-hotels"
                rows={6}
                value={form.hotels}
                onChange={(e) => set("hotels", e.target.value)}
                placeholder={"Rixos Premium Belek\nMaxx Royal Belek"}
              />
            </Field>
          </Panel>

          <Link
            href={`${adminBase}/seo`}
            className="flex items-center gap-2 rounded-adm-lg border border-adm-line bg-adm-surface px-4 py-3 text-[12.5px] font-semibold text-adm-brand-ink shadow-adm-sm hover:underline"
          >
            <Info size={14} aria-hidden="true" />
            Meta başlık, anahtar kelimeler, sosyal paylaşım → SEO Yönetimi
          </Link>
        </aside>
      </div>

      {dirty && (
        <div className="sticky bottom-3 z-20 mt-5 flex items-center gap-3 rounded-adm-lg bg-adm-ink px-4 py-2.5 text-white shadow-adm-lg">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">Kaydedilmemiş değişiklikler var</span>
          <button
            type="button"
            onClick={() => setForm(initial)}
            className="h-8 rounded-adm-sm px-3 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white"
          >
            Geri al
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-adm-sm bg-white px-3.5 text-[13px] font-semibold text-adm-ink hover:bg-white/90 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Kaydet
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
        onConfirm={() => router.push(`${adminBase}/regions`)}
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
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-adm-line-2 px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
        {subtitle && <span className="text-[12px] text-adm-muted">{subtitle}</span>}
        {action && <span className="ms-auto">{action}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/**
 * A text field that starts out holding the page's automatic text. Says which
 * it is holding, and offers the way back once it has been changed.
 */
function AutoField({
  id,
  label,
  hint,
  value,
  auto,
  rows,
  dir,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  auto: string;
  rows: number;
  dir: "rtl" | "ltr";
  onChange: (v: string) => void;
}) {
  const isAuto = !value.trim() || same(value, auto);
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-adm-ink-2">{label}</label>
        {isAuto ? (
          <span className="rounded-full bg-adm-line-2 px-2 py-0.5 text-[11px] font-medium text-adm-muted">Otomatik metin</span>
        ) : (
          <>
            <span className="rounded-full bg-adm-brand/10 px-2 py-0.5 text-[11px] font-medium text-adm-brand-ink">Size özel</span>
            <button
              type="button"
              onClick={() => onChange(auto)}
              className="ms-auto inline-flex items-center gap-1 text-[11.5px] font-medium text-adm-muted hover:text-adm-ink"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Otomatik metne dön
            </button>
          </>
        )}
      </div>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={auto}
        dir={dir}
        className="text-[14px] leading-relaxed"
      />
      <p className="mt-1.5 text-xs text-adm-muted">
        {hint} {isAuto ? "Şu an sayfada tüm bölgelerde ortak şablon metni var; değiştirirseniz bu bölgeye özel olur." : ""}
      </p>
    </div>
  );
}
