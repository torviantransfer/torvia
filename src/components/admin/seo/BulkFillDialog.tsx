"use client";

import { useMemo, useState } from "react";
import { X, Loader2, Wand2, AlertCircle, Check } from "lucide-react";
import {
  TITLE_IDEAL_MAX,
  DESC_IDEAL_MAX,
  TITLE_MAX,
  DESC_MAX,
} from "@/lib/seoScore";
import { LOCALES, LOCALE_LABELS, type Loc } from "./fields";

/**
 * Fills meta copy across many pages from one template.
 *
 * Thirty regions in six languages is a hundred and eighty title fields and as
 * many descriptions. Nobody types those one at a time, and a panel that
 * requires it is a panel that stays empty — which is how the hardcoded
 * templates in the page files came to exist in the first place. This turns
 * that same pattern into something an editor owns.
 *
 * Two deliberate constraints:
 *
 * - The default only writes fields that are currently blank. Overwriting is
 *   possible but has to be chosen, because a template that rewrites hand-
 *   tuned copy on thirty ranking pages is a bad afternoon.
 * - Rows are written one at a time and the failures are reported rather than
 *   swallowed, so a partial run tells you exactly where it stopped.
 */

export interface BulkTarget {
  id: string;
  table: "seo_pages" | "regions";
  /** Region or page name, for the {ad} token. */
  name: string;
  /** Path after the locale segment, for the {url} token. */
  route: string;
  row: Record<string, unknown>;
}

const TOKENS: { token: string; label: string }[] = [
  { token: "{ad}", label: "Sayfa / bölge adı" },
  { token: "{url}", label: "URL yolu" },
];

function render(template: string, target: BulkTarget): string {
  return template.replace(/\{ad\}/g, target.name).replace(/\{url\}/g, target.route);
}

function str(row: Record<string, unknown>, field: string): string {
  const v = row[field];
  return typeof v === "string" ? v.trim() : "";
}

export default function BulkFillDialog({
  targets,
  locale: initialLocale,
  onClose,
  onApplied,
}: {
  /** The rows the list is currently showing — filtering happens outside. */
  targets: BulkTarget[];
  locale: Loc;
  onClose: () => void;
  onApplied: (updates: { id: string; table: string; data: Record<string, unknown> }[]) => void;
}) {
  const [locale, setLocale] = useState<Loc>(initialLocale);
  const [titleTpl, setTitleTpl] = useState("");
  const [descTpl, setDescTpl] = useState("");
  const [keywordsTpl, setKeywordsTpl] = useState("");
  const [focusTpl, setFocusTpl] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<number | null>(null);

  /** What each target would end up with, and whether it would change. */
  const plan = useMemo(() => {
    return targets.map((t) => {
      const data: Record<string, unknown> = {};
      const consider = (field: string, template: string) => {
        if (!template.trim()) return;
        const existing = str(t.row, field);
        if (existing && !overwrite) return;
        const next = render(template, t);
        if (next !== existing) data[field] = next;
      };
      consider(`meta_title_${locale}`, titleTpl);
      consider(`meta_description_${locale}`, descTpl);
      consider(`keywords_${locale}`, keywordsTpl);
      consider(`focus_keyword_${locale}`, focusTpl);
      return { target: t, data };
    });
  }, [targets, locale, titleTpl, descTpl, keywordsTpl, focusTpl, overwrite]);

  const willChange = plan.filter((p) => Object.keys(p.data).length > 0);
  const skipped = plan.length - willChange.length;

  // Length is checked against the longest name in the set, because that is the
  // row the template will overflow on — not the average one.
  const longest = useMemo(() => {
    let worstTitle = "";
    let worstDesc = "";
    for (const t of targets) {
      const title = titleTpl ? render(titleTpl, t) : "";
      const desc = descTpl ? render(descTpl, t) : "";
      if (title.length > worstTitle.length) worstTitle = title;
      if (desc.length > worstDesc.length) worstDesc = desc;
    }
    return { title: worstTitle, desc: worstDesc };
  }, [targets, titleTpl, descTpl]);

  const apply = async () => {
    setRunning(true);
    setErrors([]);
    setProgress(0);
    const applied: { id: string; table: string; data: Record<string, unknown> }[] = [];
    const failures: string[] = [];

    for (const { target, data } of willChange) {
      try {
        const res = await fetch("/api/admin/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: target.table,
            action: "update",
            id: target.id,
            data: { ...data, updated_at: new Date().toISOString() },
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? "bilinmeyen hata");
        applied.push({ id: target.id, table: target.table, data: json.data ?? data });
      } catch (e) {
        failures.push(`${target.name}: ${e instanceof Error ? e.message : "hata"}`);
      }
      setProgress((p) => p + 1);
    }

    onApplied(applied);
    setErrors(failures);
    setDone(applied.length);
    setRunning(false);
  };

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white z-10">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Şablondan toplu doldur</h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Listede görünen {targets.length} sayfa için geçerli.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[12.5px] font-medium text-slate-700">Dil:</span>
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className="px-2.5 py-1 rounded-lg text-[12px] font-semibold uppercase transition-all cursor-pointer"
                  style={{
                    backgroundColor: locale === l ? "#0f172a" : "transparent",
                    color: locale === l ? "#fff" : "#64748b",
                  }}
                  title={LOCALE_LABELS[l]}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <span
                key={t.token}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-[11.5px] text-slate-600"
              >
                <code className="font-mono font-semibold text-slate-800">{t.token}</code>
                {t.label}
              </span>
            ))}
          </div>

          <TemplateField
            label="Meta başlık şablonu"
            value={titleTpl}
            onChange={setTitleTpl}
            placeholder="Antalya Havalimanı {ad} Transfer | Sabit Fiyat | TORVIAN"
            sample={longest.title}
            ideal={TITLE_IDEAL_MAX}
            max={TITLE_MAX}
            className={input}
          />

          <TemplateField
            label="Meta açıklama şablonu"
            value={descTpl}
            onChange={setDescTpl}
            placeholder="Antalya Havalimanı'ndan {ad}'e özel VIP transfer. Sabit fiyat, Mercedes Vito, karşılama, uçuş takibi. Online rezervasyon."
            sample={longest.desc}
            ideal={DESC_IDEAL_MAX}
            max={DESC_MAX}
            multiline
            className={input}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
                Odak kelime şablonu
              </label>
              <input
                value={focusTpl}
                onChange={(e) => setFocusTpl(e.target.value)}
                placeholder="{ad} transfer"
                className={input}
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
                Yan kelime şablonu
              </label>
              <input
                value={keywordsTpl}
                onChange={(e) => setKeywordsTpl(e.target.value)}
                placeholder="{ad} transfer, antalya {ad} transfer, {ad} havalimanı transferi"
                className={input}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer"
            />
            <span>
              <span className="block text-[13px] font-medium text-slate-800">
                Dolu alanların üzerine yaz
              </span>
              <span className="block text-[11.5px] text-slate-500 mt-0.5">
                Kapalıyken sadece boş alanlar doldurulur — elle yazdığınız metinlere dokunulmaz.
                Açarsanız sıralaması olan sayfaların metinleri de değişir.
              </span>
            </span>
          </label>

          {/* Preview */}
          {willChange.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <p className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Önizleme — ilk 3 sayfa
              </p>
              <ul className="divide-y divide-slate-100">
                {willChange.slice(0, 3).map(({ target, data }) => (
                  <li key={target.id} className="px-3 py-2.5">
                    <p className="text-[12px] font-medium text-slate-800">{target.name}</p>
                    {typeof data[`meta_title_${locale}`] === "string" && (
                      <p className="text-[12px] text-blue-700 mt-1 leading-snug">
                        {data[`meta_title_${locale}`] as string}
                      </p>
                    )}
                    {typeof data[`meta_description_${locale}`] === "string" && (
                      <p className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">
                        {data[`meta_description_${locale}`] as string}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[12px] text-slate-600">
            <b className="text-slate-900">{willChange.length} sayfa</b> güncellenecek
            {skipped > 0 && (
              <>
                , <b>{skipped} sayfa</b> atlanacak
                {!overwrite && " (alanları zaten dolu)"}
              </>
            )}
            .
          </div>

          {done !== null && (
            <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-[12.5px] text-green-800">
              <Check size={14} /> {done} sayfa güncellendi.
            </p>
          )}

          {errors.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <p className="flex items-center gap-2 text-[12.5px] font-medium text-red-700">
                <AlertCircle size={14} /> {errors.length} sayfa güncellenemedi
              </p>
              <ul className="mt-1 space-y-0.5">
                {errors.slice(0, 5).map((e) => (
                  <li key={e} className="text-[11.5px] text-red-600">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-white">
          {running && (
            <span className="mr-auto text-[12px] text-slate-500 tabular-nums">
              {progress} / {willChange.length}
            </span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {done !== null ? "Kapat" : "Vazgeç"}
          </button>
          <button
            onClick={apply}
            disabled={running || willChange.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {running ? "Uygulanıyor…" : `${willChange.length} sayfayı doldur`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateField({
  label,
  value,
  onChange,
  placeholder,
  sample,
  ideal,
  max,
  multiline,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** The longest result the template produces across the whole target set. */
  sample: string;
  ideal: number;
  max: number;
  multiline?: boolean;
  className: string;
}) {
  const len = sample.length;
  const over = len > max;
  const near = !over && len > ideal;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[12.5px] font-medium text-slate-700">{label}</label>
        {sample && (
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: over ? "#dc2626" : near ? "#d97706" : "#16a34a" }}
          >
            en uzun: {len} / {ideal}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
      {over && (
        <p className="mt-1 text-[11px] text-red-600">
          En uzun isimli sayfada {len} karaktere çıkıyor — Google kesecek. Şablonu kısaltın.
        </p>
      )}
    </div>
  );
}
