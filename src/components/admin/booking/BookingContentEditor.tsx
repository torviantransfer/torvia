"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { Button, Textarea, cx, useToast } from "@/components/admin/ui";
import { LOCALES, LOCALE_LABELS, type Loc } from "@/components/admin/seo/fields";
import { writeBookingContent, type BookingPageContent } from "@/lib/bookingContent";

export interface BookingContentDefaults {
  trustCards: { title: string; desc: string }[];
  guideHeading: string;
  guideSections: { title: string; body: string }[];
  faqTitle: string;
  faq: { question: string; answer: string }[];
  closingText: string;
}

export interface BookingContentEditorProps {
  /** False until migration 105 has seeded the settings row. */
  settingsRowExists: boolean;
  defaults: Record<string, BookingContentDefaults>;
  content: BookingPageContent;
}

const same = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

/**
 * One screen for everything on /booking that isn't the hero form: the trust
 * cards under it, the "what you should know" guide, the SSS, and the closing
 * paragraph. All four blocks were fixed text in src/messages/<locale>.json;
 * an empty field here means "keep showing that text", same contract as the
 * region editor's auto-text fields.
 */
export default function BookingContentEditor({ settingsRowExists, defaults, content }: BookingContentEditorProps) {
  const router = useRouter();
  const toast = useToast();

  const initial = useMemo(() => {
    const locales = Object.fromEntries(
      LOCALES.map((l) => {
        const c = content.locales[l];
        const d = defaults[l];
        return [
          l,
          {
            trustCards: c.trustCards.map((t, i) => ({
              title: t.title || d.trustCards[i]?.title || "",
              desc: t.desc || d.trustCards[i]?.desc || "",
            })),
            guideSections: c.guideSections.map((g, i) => ({
              title: g.title || d.guideSections[i]?.title || "",
              body: g.body || d.guideSections[i]?.body || "",
            })),
            faq: c.faq.map((f, i) => ({
              question: f.question || d.faq[i]?.question || "",
              answer: f.answer || d.faq[i]?.answer || "",
            })),
            closingText: c.closingText || d.closingText || "",
          },
        ];
      })
    );
    return { locales } as BookingPageContent;
  }, [content, defaults]);

  const [form, setForm] = useState(initial);
  const [seed, setSeed] = useState(initial);
  if (seed !== initial) {
    setSeed(initial);
    setForm(initial);
  }
  const [lang, setLang] = useState<Loc>("tr");
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const current = form.locales[lang];
  const def = defaults[lang];

  const patch = (next: Partial<typeof current>) =>
    setForm((f) => ({ ...f, locales: { ...f.locales, [lang]: { ...f.locales[lang], ...next } } }));

  const langState = (l: Loc): "full" | "partial" | "empty" => {
    const c = form.locales[l];
    const d = defaults[l];
    const parts = [
      c.trustCards.some((t, i) => t.title.trim() && !same(t.title, d.trustCards[i]?.title || "")),
      c.guideSections.some((g, i) => g.body.trim() && !same(g.body, d.guideSections[i]?.body || "")),
      c.faq.some((f, i) => f.answer.trim() && !same(f.answer, d.faq[i]?.answer || "")),
      Boolean(c.closingText.trim()) && !same(c.closingText, d.closingText),
    ];
    const n = parts.filter(Boolean).length;
    return n === 0 ? "empty" : n === parts.length ? "full" : "partial";
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      // Automatic text is not stored — matches what's on the page today.
      const toSave: BookingPageContent = {
        locales: Object.fromEntries(
          LOCALES.map((l) => {
            const c = form.locales[l];
            const d = defaults[l];
            return [
              l,
              {
                trustCards: c.trustCards.map((t, i) => ({
                  title: same(t.title, d.trustCards[i]?.title || "") ? "" : t.title,
                  desc: same(t.desc, d.trustCards[i]?.desc || "") ? "" : t.desc,
                })),
                guideSections: c.guideSections.map((g, i) => ({
                  title: same(g.title, d.guideSections[i]?.title || "") ? "" : g.title,
                  body: same(g.body, d.guideSections[i]?.body || "") ? "" : g.body,
                })),
                faq: c.faq.map((f, i) => ({
                  question: same(f.question, d.faq[i]?.question || "") ? "" : f.question,
                  answer: same(f.answer, d.faq[i]?.answer || "") ? "" : f.answer,
                })),
                closingText: same(c.closingText, d.closingText) ? "" : c.closingText,
              },
            ];
          })
        ),
      };

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "settings",
          action: "update",
          id: "booking_page_content",
          data: { value: writeBookingContent(toSave) },
        }),
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

  return (
    <form onSubmit={save} className="pb-4">
      <div className="mb-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 truncate text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">
          Booking Sayfası İçeriği
        </h1>
        <div className="ms-auto flex items-center gap-2">
          <a
            href={`/${lang}/booking`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold text-adm-ink-2 hover:bg-adm-line-2"
          >
            <ExternalLink size={15} aria-hidden="true" />
            <span className="max-[520px]:hidden">Sitede gör</span>
          </a>
          <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
            {dirty ? "Kaydet" : "Kaydedildi"}
          </Button>
        </div>
      </div>

      {!settingsRowExists && (
        <div className="mb-4 flex items-start gap-2.5 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3">
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
          <p className="text-[12.5px] text-adm-amber">
            <b>105_booking_page_content_setting.sql</b> çalıştırılmamış. Bu ekran çalışır ama kaydetme başarısız olur; migration&apos;ı çalıştırdıktan sonra tekrar deneyin.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-semibold text-adm-muted">Dil</span>
        <div role="tablist" aria-label="İçerik dili" className="flex gap-1.5">
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

      <div className="grid min-w-0 gap-4">
        <Panel title="Güven kartları" subtitle={`${LOCALE_LABELS[lang]} · formun altındaki 6 kart`}>
          <div className="grid gap-3 md:grid-cols-2">
            {current.trustCards.map((c, i) => (
              <div key={i} className="grid content-start gap-2 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                <AutoField
                  id={`trust-title-${i}`}
                  label={`${i + 1}. kart başlığı`}
                  value={c.title}
                  auto={def.trustCards[i]?.title || ""}
                  rows={1}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ trustCards: current.trustCards.map((x, j) => (j === i ? { ...x, title: v } : x)) })}
                />
                <AutoField
                  id={`trust-desc-${i}`}
                  label="Açıklama"
                  value={c.desc}
                  auto={def.trustCards[i]?.desc || ""}
                  rows={2}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ trustCards: current.trustCards.map((x, j) => (j === i ? { ...x, desc: v } : x)) })}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Rehber" subtitle={`${LOCALE_LABELS[lang]} · başlık: “${def.guideHeading}”`}>
          <div className="grid gap-3">
            {current.guideSections.map((g, i) => (
              <div key={i} className="grid gap-2 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                <AutoField
                  id={`guide-title-${i}`}
                  label={`${i + 1}. bölüm başlığı`}
                  value={g.title}
                  auto={def.guideSections[i]?.title || ""}
                  rows={1}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ guideSections: current.guideSections.map((x, j) => (j === i ? { ...x, title: v } : x)) })}
                />
                <AutoField
                  id={`guide-body-${i}`}
                  label="Metin"
                  value={g.body}
                  auto={def.guideSections[i]?.body || ""}
                  rows={4}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ guideSections: current.guideSections.map((x, j) => (j === i ? { ...x, body: v } : x)) })}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Sık sorulan sorular" subtitle={`${LOCALE_LABELS[lang]} · başlık: “${def.faqTitle}”`}>
          <div className="grid gap-3">
            {current.faq.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-adm border border-adm-line bg-adm-surface-2 p-3">
                <AutoField
                  id={`faq-q-${i}`}
                  label={`${i + 1}. soru`}
                  value={f.question}
                  auto={def.faq[i]?.question || ""}
                  rows={1}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ faq: current.faq.map((x, j) => (j === i ? { ...x, question: v } : x)) })}
                />
                <AutoField
                  id={`faq-a-${i}`}
                  label="Cevap"
                  value={f.answer}
                  auto={def.faq[i]?.answer || ""}
                  rows={3}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(v) => patch({ faq: current.faq.map((x, j) => (j === i ? { ...x, answer: v } : x)) })}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Kapanış metni" subtitle={LOCALE_LABELS[lang]}>
          <AutoField
            id="closing-text"
            label="Sayfanın en altındaki SEO paragrafı"
            value={current.closingText}
            auto={def.closingText}
            rows={5}
            dir={lang === "ar" ? "rtl" : "ltr"}
            onChange={(v) => patch({ closingText: v })}
          />
        </Panel>
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
    </form>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-adm-line-2 px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
        {subtitle && <span className="truncate text-[12px] text-adm-muted">{subtitle}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** A text field that starts out holding the page's automatic text. */
function AutoField({
  id,
  label,
  value,
  auto,
  rows,
  dir,
  onChange,
}: {
  id: string;
  label: string;
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
    </div>
  );
}
