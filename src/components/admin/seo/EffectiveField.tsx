"use client";

import { useState } from "react";
import {
  Pencil, RotateCcw, Globe, Database, Check, ChevronDown, ChevronRight,
} from "lucide-react";

/**
 * One SEO field, showing three things that are easy to confuse and expensive
 * to confuse: what the admin has overridden, what the page serves today, and
 * where that value comes from.
 *
 * The problem this solves is concrete. Before this, an editor opening
 * /en/antalya-airport-transfer saw an empty "Meta title" box — because the
 * override column is empty — while the live page has had a perfectly good
 * title from a hardcoded map for months. Reading that as "no SEO here" and
 * typing something new silently replaced working, ranking copy.
 *
 * So a field with no override does not render an empty input at all. It
 * renders the live value, labelled with its source, and an "Override oluştur"
 * button. Editing becomes a deliberate act rather than the default state.
 */

export type FieldSource = "admin" | "runtime" | "none";

export interface EffectiveFieldProps {
  label: string;
  /** The value stored in the admin's own column. Empty means no override. */
  override: string;
  onChange: (value: string) => void;
  /**
   * What the page actually serves right now, read from the rendered HTML.
   * Undefined while the inspection is still loading or failed.
   */
  live: string | null | undefined;
  /** True while the inspection request is in flight. */
  loading?: boolean;
  id?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  /** Optional character counter, for title and description. */
  counter?: { min: number; ideal: [number, number]; max: number };
  /** Rendered under the field when an override exists — e.g. a URL warning. */
  warning?: string | null;
  /** Read-only fields (slug) explain why rather than just being disabled. */
  readOnly?: { reason: string };
  /**
   * Set when the live value could not be read at all — a protected preview,
   * an auth wall, a failed fetch. Distinct from "the page has no value here",
   * because the two demand opposite actions: one needs the inspector pointed
   * somewhere else, the other needs an editor to write something.
   */
  unreadable?: string | null;
}

export function fieldSource(override: string, live: string | null | undefined): FieldSource {
  if (override.trim()) return "admin";
  if (live && live.trim()) return "runtime";
  return "none";
}

const SOURCE_META: Record<FieldSource, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin override", color: "#7c3aed", bg: "#f5f3ff" },
  runtime: { label: "Sayfa kodu / varsayılan", color: "#0369a1", bg: "#f0f9ff" },
  none: { label: "Değer yok", color: "#b91c1c", bg: "#fef2f2" },
};

export default function EffectiveField({
  label,
  override,
  onChange,
  live,
  loading,
  id,
  placeholder,
  hint,
  multiline,
  rows = 3,
  counter,
  warning,
  readOnly,
  unreadable,
}: EffectiveFieldProps) {
  // When the live value is unreadable, `live` is null and must stay null:
  // treating "could not read" as "no value" is what would let a protected
  // preview's own metadata be mistaken for this page's.
  const source = fieldSource(override, unreadable ? null : live);
  const [editing, setEditing] = useState(source === "admin");
  const [showDetail, setShowDetail] = useState(false);

  // The value a crawler gets: the override when there is one, otherwise
  // whatever the page renders.
  const effective = source === "admin" ? override.trim() : (live ?? "");
  const meta = SOURCE_META[source];

  const len = editing ? override.length : effective.length;
  const counterColor = counter
    ? len === 0
      ? "#94a3b8"
      : len < counter.min || len > counter.max
        ? "#dc2626"
        : len < counter.ideal[0] || len > counter.ideal[1]
          ? "#d97706"
          : "#16a34a"
    : "#94a3b8";

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="text-[12.5px] font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {counter && (
            <span className="text-[11px] font-medium tabular-nums" style={{ color: counterColor }}>
              {len} / {counter.ideal[1]}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            {source === "admin" ? <Database size={9} /> : source === "runtime" ? <Globe size={9} /> : null}
            {loading && source !== "admin"
              ? "Okunuyor…"
              : unreadable && source !== "admin"
                ? "Okunamadı"
                : meta.label}
          </span>
        </div>
      </div>

      {readOnly ? (
        <>
          <input value={effective} disabled className={inputClass} />
          <p className="mt-1 text-[11px] text-amber-700">{readOnly.reason}</p>
        </>
      ) : editing ? (
        <>
          {multiline ? (
            <textarea
              id={id}
              rows={rows}
              value={override}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? live ?? ""}
              className={inputClass}
            />
          ) : (
            <input
              id={id}
              type="text"
              value={override}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? live ?? ""}
              className={inputClass}
            />
          )}
          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                // Clearing the column is what restores the code fallback --
                // there is no separate "unset" state to write.
                onChange("");
                setEditing(false);
              }}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-500 hover:text-red-600 cursor-pointer"
            >
              <RotateCcw size={11} /> Override&apos;ı sil, varsayılana dön
            </button>
            {live && live.trim() && live.trim() !== override.trim() && (
              <button
                type="button"
                onClick={() => onChange(live.trim())}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <Check size={11} /> Mevcut değeri kopyala
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          {loading ? (
            <p className="text-[13px] text-slate-400">Sayfadan okunuyor…</p>
          ) : unreadable ? (
            <p className="text-[13px] text-amber-700 leading-snug">
              {unreadable}
              <br />
              <span className="text-[11.5px] text-slate-500">
                Bu alanın gerçek değeri bilinmiyor — boş sanıp doldurmayın.
              </span>
            </p>
          ) : effective ? (
            <p className="text-[13px] text-slate-800 leading-snug break-words">{effective}</p>
          ) : (
            <p className="text-[13px] text-red-600">
              Sayfada bu değer yok — burayı doldurmak gerçekten bir eksiği kapatır.
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            <Pencil size={11} /> Bu değeri düzenle / override oluştur
          </button>
        </div>
      )}

      {warning && <p className="mt-1.5 text-[11px] text-red-600">{warning}</p>}
      {hint && !warning && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}

      {/* The three-way breakdown, collapsed by default. Expanded it answers
          "why does the site show X when the box says Y" without guesswork. */}
      {(editing || source === "admin") && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showDetail ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Değer kaynağı
          </button>
          {showDetail && (
            <dl className="mt-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 space-y-1">
              <Row term="Admin override" value={override.trim() || "—"} />
              <Row
                term="Sayfadaki mevcut değer"
                value={unreadable ? "okunamadı" : live?.trim() || "—"}
              />
              <Row term="Yayınlanan (effective)" value={effective || "—"} strong />
              <Row term="Kaynak" value={meta.label} />
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ term, value, strong }: { term: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-2">
      <dt className="text-[11px] text-slate-500">{term}</dt>
      <dd
        className={`text-[11.5px] break-words ${strong ? "font-medium text-slate-900" : "text-slate-700"}`}
      >
        {value}
      </dd>
    </div>
  );
}
