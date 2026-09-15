"use client";

import { AlertTriangle, Save, Loader2, X, ArrowRight } from "lucide-react";

/**
 * Shows exactly what a save will change, before it changes it.
 *
 * Six languages of fields on one screen makes it genuinely easy to lose track
 * of what has been touched — and some of these fields (canonical, noindex)
 * can drop a ranking page out of Google on their own. A field-by-field
 * before/after, with the dangerous ones called out separately, turns "Kaydet"
 * from a leap into a decision.
 */

export interface FieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
  /** Fields that can cost a ranking on their own get an explicit warning. */
  critical?: string;
}

/**
 * Columns whose value reaches a crawler in a way that can remove or move a
 * page. Anything named here forces the confirmation copy, not just the diff.
 */
export const CRITICAL_FIELDS: Record<string, string> = {
  noindex: "Bu sayfa Google'dan tamamen çıkarılacak. Şu an sıralaması varsa o trafik kaybedilir.",
  nofollow: "Bu sayfadaki linkler taranmayacak — iç link gücü aktarılmaz.",
  canonical_url:
    "Canonical değiştirmek, bu sayfanın sıralamasını işaret ettiği adrese devreder. Yanlış bir değer sayfayı indeksten düşürür.",
  slug: "URL değişikliği 301 yönlendirme olmadan mevcut sıralamayı sıfırlar.",
  is_active: "Bölge pasifleştirilirse sitemap'ten ve site menüsünden çıkar.",
  is_published: "Yazı yayından kaldırılırsa Google zamanla indeksten düşürür.",
};

/**
 * The fields a save would actually write.
 *
 * Extracted from the editor so the "diff shows only what changed" contract is
 * assertable without rendering React — and so the save payload and the
 * confirmation screen are computed from one function rather than two that can
 * disagree about what changed.
 *
 * Equality is by JSON, which correctly treats null and "" as different (one
 * means "no override", the other is a value an editor typed and cleared) while
 * still ignoring object key order.
 */
export function computeChanges(
  original: Record<string, unknown>,
  draft: Record<string, unknown>
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const [key, next] of Object.entries(draft)) {
    const before = original[key];
    if (JSON.stringify(next) === JSON.stringify(before)) continue;
    out.push({
      field: key,
      label: key,
      before: before === null || before === undefined ? "" : String(before),
      after: next === null || next === undefined ? "" : String(next),
      critical: criticalReason(key),
    });
  }
  return out;
}

export function criticalReason(field: string): string | undefined {
  for (const [key, reason] of Object.entries(CRITICAL_FIELDS)) {
    if (field === key || field.startsWith(`${key}_`)) return reason;
  }
  return undefined;
}

export default function SaveDiffDialog({
  changes,
  saving,
  onConfirm,
  onCancel,
}: {
  changes: FieldChange[];
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const critical = changes.filter((c) => c.critical);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-adm-lg bg-adm-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 border-b border-adm-line bg-adm-surface">
          <div>
            <h2 className="text-[15px] font-semibold text-adm-ink">Değişiklikleri onayla</h2>
            <p className="text-[11.5px] text-adm-muted mt-0.5">
              {changes.length} alan değişecek
              {critical.length > 0 && ` · ${critical.length} tanesi kritik`}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-adm-muted hover:text-adm-ink-2 cursor-pointer"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {critical.length > 0 && (
          <div className="mx-5 mt-4 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-adm-rose">
              <AlertTriangle size={14} /> Sıralamayı etkileyebilecek değişiklikler
            </p>
            <ul className="mt-1.5 space-y-1">
              {critical.map((c) => (
                <li key={c.field} className="text-[11.5px] text-adm-rose leading-snug">
                  <b>{c.label}:</b> {c.critical}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="p-5 space-y-3">
          {changes.map((c) => (
            <li key={c.field} className="rounded-adm-sm border border-adm-line overflow-hidden">
              <p className="px-3 py-1.5 bg-adm-surface-2 border-b border-adm-line text-[11.5px] font-medium text-adm-ink-2">
                {c.label}
                {c.critical && (
                  <span className="ms-1.5 px-1 py-0.5 rounded text-[9.5px] font-bold bg-adm-rose-soft text-adm-rose">
                    KRİTİK
                  </span>
                )}
              </p>
              <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2">
                <span className="text-[11.5px] text-adm-muted line-through break-words">
                  {c.before || <span className="not-italic no-underline text-adm-muted">— boş —</span>}
                </span>
                <ArrowRight size={13} className="text-adm-muted hidden sm:block" />
                <span className="text-[11.5px] text-adm-ink font-medium break-words">
                  {c.after || <span className="font-normal text-adm-muted">— boş (varsayılana döner) —</span>}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-3.5 border-t border-adm-line bg-adm-surface">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-adm-sm text-[13px] font-medium text-adm-ink-2 hover:bg-adm-line-2 cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-adm-sm disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
            style={{ backgroundColor: critical.length > 0 ? "#dc2626" : "#f97316" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Kaydediliyor…" : critical.length > 0 ? "Anladım, kaydet" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
