"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  Field,
  IconButton,
  Input,
  Textarea,
  useToast,
} from "@/components/admin/ui";
import { ImageField, LOCALES, LOCALE_LABELS, LocaleTabs, type Loc } from "@/components/admin/seo/fields";
import {
  HIGHLIGHT_SLOTS,
  REGION_FAQ_MAX,
  localeFill,
  paragraphs,
  writePageContent,
  type RegionLocaleContent,
  type RegionPageContent,
} from "@/lib/regionContent";

export interface RegionContentEditorProps {
  adminBase: string;
  region: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    routeName: string;
    columnsReady: boolean;
    hotels: string[];
    names: Record<string, string>;
    content: RegionPageContent;
  };
}

/**
 * Region page content, edited per language.
 *
 * Everything here is optional, and says so next to the field: an empty field
 * leaves the live page exactly as it is today. That is what lets thirty
 * regions be filled one at a time — the ones that already rank last — without
 * any of them changing until someone chooses to change it.
 */
export default function RegionContentEditor({ adminBase, region }: RegionContentEditorProps) {
  const router = useRouter();
  const toast = useToast();

  const [locale, setLocale] = useState<Loc>("tr");
  const [routeName, setRouteName] = useState(region.routeName);
  const [hotelsText, setHotelsText] = useState(region.hotels.join("\n"));
  const [content, setContent] = useState<RegionPageContent>(region.content);
  const [saving, setSaving] = useState(false);

  const payload = useMemo(
    () => ({
      page_content: writePageContent(content),
      hotels: hotelsText.split("\n").map((s) => s.trim()).filter(Boolean),
      route_name: routeName.trim() || null,
    }),
    [content, hotelsText, routeName]
  );

  const initial = useMemo(
    () =>
      JSON.stringify({
        page_content: writePageContent(region.content),
        hotels: region.hotels,
        route_name: region.routeName.trim() || null,
      }),
    [region]
  );
  const dirty = JSON.stringify(payload) !== initial;

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const current = content.locales[locale];
  const name = region.names[locale] || region.name;

  const patch = (next: Partial<RegionLocaleContent>) =>
    setContent((c) => ({ ...c, locales: { ...c.locales, [locale]: { ...c.locales[locale], ...next } } }));

  const setHighlight = (i: number, key: "title" | "description", value: string) =>
    patch({ highlights: current.highlights.map((h, j) => (j === i ? { ...h, [key]: value } : h)) });

  const setImage = (i: number, value: string) =>
    setContent((c) => ({ ...c, highlightImages: c.highlightImages.map((u, j) => (j === i ? value : u)) }));

  const setFaq = (i: number, key: "question" | "answer", value: string) =>
    patch({ faq: current.faq.map((f, j) => (j === i ? { ...f, [key]: value } : f)) });

  const fill = Object.fromEntries(LOCALES.map((l) => [l, localeFill(content.locales[l])]));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "regions", action: "update", id: region.id, data: payload }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) throw new Error(json?.error ?? "Kaydedilemedi.");
      toast("Kaydedildi. Sayfa birkaç saniye içinde güncellenir.");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Kaydedilemedi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const liveHref = `/${locale}/${region.slug.endsWith("-transfer") ? region.slug : `${region.slug}-transfer`}`;
  const aboutCount = paragraphs(current.about).length;

  return (
    <>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-3">
        <IconButton
          icon={ArrowLeft}
          label="Bölgelere dön"
          onClick={() => {
            if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?")) return;
            router.push(`${adminBase}/regions`);
          }}
          className="rtl:rotate-180"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">
            {region.name} — sayfa içeriği
          </h1>
          <p className="text-[12.5px] text-adm-muted">
            Bütün alanlar isteğe bağlı. Boş bırakılan alan sayfada bugünkü hâliyle kalır.
          </p>
        </div>
        <ButtonLink href={liveHref} icon={ExternalLink} compact target="_blank" rel="noopener noreferrer">
          Sayfayı aç
        </ButtonLink>
        <Button variant="primary" icon={Save} compact loading={saving} disabled={!dirty || !region.columnsReady} onClick={save}>
          {dirty ? "Kaydet" : "Kaydedildi"}
        </Button>
      </div>

      {!region.columnsReady && (
        <div className="mb-4 flex items-start gap-2.5 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3">
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
          <p className="text-[12.5px] text-adm-amber">
            <b>097_region_page_content.sql</b> henüz çalıştırılmamış. Bu alanlar ancak migration
            Supabase&apos;de çalıştırıldıktan sonra kaydedilebilir.
          </p>
        </div>
      )}

      {!region.isActive && (
        <p className="mb-4 rounded-adm border border-adm-line bg-adm-surface-2 px-4 py-2.5 text-[12.5px] text-adm-ink-2">
          Bu bölge pasif — sayfası yayında değil. İçerik yine de hazırlanabilir.
        </p>
      )}

      <div className="grid gap-4">
        {/* ── Every language ───────────────────────────────────────────── */}
        <Card flush title="Tüm diller" subtitle="Dile göre değişmeyen bilgiler.">
          <div className="grid gap-4 p-[18px] lg:grid-cols-2">
            <Field
              label="Güzergah"
              htmlFor="region-route"
              hint="Havalimanından gidilen yol, ör. D400. Boşsa sayfada gösterilmez."
            >
              <Input id="region-route" value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="D400" />
            </Field>
            <Field
              label="Oteller"
              htmlFor="region-hotels"
              hint="Her satıra bir otel. Boşsa bölümde otel listesi görünmez."
            >
              <Textarea
                id="region-hotels"
                rows={4}
                value={hotelsText}
                onChange={(e) => setHotelsText(e.target.value)}
                placeholder={"Rixos Premium Belek\nMaxx Royal Belek"}
              />
            </Field>
          </div>
          <div className="border-t border-adm-line-2 p-[18px]">
            <p className="mb-3 text-[12.5px] font-semibold text-adm-ink-2">Öne çıkanlar — görseller</p>
            <p className="mb-3 text-[12px] text-adm-muted">
              Görsel her dilde aynıdır. Kart, o dilde başlığı ve görseli olduğunda görünür.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: HIGHLIGHT_SLOTS }, (_, i) => (
                <ImageField
                  key={i}
                  label={`${i + 1}. kart`}
                  value={content.highlightImages[i]}
                  onChange={(v) => setImage(i, v)}
                  folder="regions"
                  aspect="4/3"
                />
              ))}
            </div>
          </div>
        </Card>

        {/* ── Per language ─────────────────────────────────────────────── */}
        <Card flush title="Dil içeriği" subtitle="Her dil kendi diliyle yazılmalı — çeviri değil.">
          <div className="border-b border-adm-line-2 p-[18px]">
            <LocaleTabs active={locale} onChange={setLocale} status={fill} />
          </div>

          <div className="grid gap-6 p-[18px]">
            <Field
              label="Hero alt başlığı"
              htmlFor="region-subtitle"
              hint="Başlığın altındaki giriş cümlesi. Boşsa bugünkü otomatik metin kalır."
            >
              <Textarea
                id="region-subtitle"
                rows={2}
                value={current.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value })}
                placeholder={`${name} için Antalya Havalimanı'ndan özel VIP transfer…`}
              />
            </Field>

            <Field
              label={`${name} hakkında — ek paragraflar`}
              htmlFor="region-about"
              hint={
                aboutCount > 0
                  ? `${aboutCount} paragraf. Bölge açıklamasının altında görünür; genel kalıp paragrafın yerini alır.`
                  : "Paragrafları boş bir satırla ayırın. Boşsa yalnızca bölge açıklaması ve genel paragraf görünür."
              }
            >
              <Textarea
                id="region-about"
                rows={7}
                value={current.about}
                onChange={(e) => patch({ about: e.target.value })}
              />
            </Field>

            <div>
              <p className="mb-1 text-[12.5px] font-semibold text-adm-ink-2">Öne çıkanlar</p>
              <p className="mb-3 text-[12px] text-adm-muted">
                Bölgeye gelenlerin en çok gittiği yerler. Üçü de boşsa bölüm görünmez.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {current.highlights.map((h, i) => (
                  <div key={i} className="grid gap-2.5 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold text-adm-muted">
                      {i + 1}. kart
                      {!content.highlightImages[i] && <span className="font-normal text-adm-amber">· görsel yok</span>}
                    </div>
                    <Input
                      aria-label={`${i + 1}. kart başlığı`}
                      value={h.title}
                      onChange={(e) => setHighlight(i, "title", e.target.value)}
                      placeholder="Başlık"
                    />
                    <Textarea
                      aria-label={`${i + 1}. kart açıklaması`}
                      rows={3}
                      value={h.description}
                      onChange={(e) => setHighlight(i, "description", e.target.value)}
                      placeholder="Kısa açıklama"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[12.5px] font-semibold text-adm-ink-2">Bölgeye özel sorular</p>
                  <p className="text-[12px] text-adm-muted">
                    Genel on bir sorunun üstünde görünür ve SSS yapısal verisine eklenir. En fazla {REGION_FAQ_MAX}.
                  </p>
                </div>
                <Button
                  icon={Plus}
                  compact
                  disabled={current.faq.length >= REGION_FAQ_MAX}
                  onClick={() => patch({ faq: [...current.faq, { question: "", answer: "" }] })}
                >
                  Soru ekle
                </Button>
              </div>

              {current.faq.length === 0 ? (
                <p className="rounded-adm border border-dashed border-adm-line px-4 py-5 text-center text-[12.5px] text-adm-muted">
                  {LOCALE_LABELS[locale]} için bölgeye özel soru yok — sayfada yalnızca genel sorular görünür.
                </p>
              ) : (
                <div className="grid gap-3">
                  {current.faq.map((f, i) => (
                    <div key={i} className="grid gap-2.5 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`${i + 1}. soru`}
                          value={f.question}
                          onChange={(e) => setFaq(i, "question", e.target.value)}
                          placeholder="Soru"
                          className="flex-1"
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
                        onChange={(e) => setFaq(i, "answer", e.target.value)}
                        placeholder="Cevap"
                      />
                      {(!f.question.trim() || !f.answer.trim()) && (
                        <p className="text-[11.5px] text-adm-amber">Sorusu veya cevabı boş olan kayıt kaydedilmez.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
