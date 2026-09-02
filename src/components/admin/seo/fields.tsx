"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Link2, ImageOff, AlertCircle } from "lucide-react";

export const LOCALES = ["tr", "en", "de", "pl", "ru", "nl"] as const;
export type Loc = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Loc, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
};

export const LOCALE_FLAGS: Record<Loc, string> = {
  tr: "🇹🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  pl: "🇵🇱",
  ru: "🇷🇺",
  nl: "🇳🇱",
};

/**
 * Language tabs carrying a per-language completeness dot, so an editor can see
 * at a glance which of six translations is still empty without opening each.
 */
export function LocaleTabs({
  active,
  onChange,
  status,
}: {
  active: Loc;
  onChange: (l: Loc) => void;
  /** Per locale: "full" | "partial" | "empty". */
  status: Record<string, "full" | "partial" | "empty">;
}) {
  const dot = { full: "#16a34a", partial: "#d97706", empty: "#cbd5e1" };
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100">
      {LOCALES.map((l) => {
        const on = active === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer"
            style={{
              backgroundColor: on ? "#fff" : "transparent",
              color: on ? "#0f172a" : "#64748b",
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <span aria-hidden>{LOCALE_FLAGS[l]}</span>
            {LOCALE_LABELS[l]}
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: dot[status[l] ?? "empty"] }}
              title={
                status[l] === "full" ? "Tamamlandı" : status[l] === "partial" ? "Eksik" : "Boş"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Text input with a live character counter that colours itself against the
 * ideal band. The counter is the whole point: meta length is the one SEO
 * property an editor can get exactly right, but only if they can see it.
 */
export function CountedField({
  label,
  value,
  onChange,
  min,
  ideal,
  max,
  placeholder,
  multiline,
  hint,
  id,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  ideal: [number, number];
  max: number;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  id?: string;
  rows?: number;
}) {
  const len = value.length;
  const state =
    len === 0 ? "empty" : len < min || len > max ? "bad" : len < ideal[0] || len > ideal[1] ? "ok" : "good";
  const color = { empty: "#94a3b8", bad: "#dc2626", ok: "#d97706", good: "#16a34a" }[state];
  // The bar fills toward the top of the ideal band, then turns red past max.
  const pct = Math.min(100, (len / max) * 100);

  const common = {
    id,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className:
      "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-shadow",
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-[12.5px] font-medium text-slate-700">
          {label}
        </label>
        <span className="text-[11px] font-medium tabular-nums" style={{ color }}>
          {len} / {ideal[1]}
        </span>
      </div>
      {multiline ? <textarea {...common} rows={rows} /> : <input type="text" {...common} />}
      <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  id,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  id?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const common = {
    id,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className:
      "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-shadow",
  };
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {multiline ? <textarea {...common} rows={rows} /> : <input type="text" {...common} />}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * Comma-separated keywords rendered as removable chips.
 *
 * Kept as a single comma-separated string in state rather than an array,
 * because that is what the DB column holds — round-tripping through an array
 * would silently reorder or trim what the editor typed.
 */
export function KeywordField({
  label,
  value,
  onChange,
  hint,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const items = value.split(",").map((k) => k.trim()).filter(Boolean);

  const add = (raw: string) => {
    const next = raw.trim().replace(/,$/, "");
    if (!next || items.some((i) => i.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...items, next].join(", "));
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="rounded-lg border border-slate-300 px-2 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500 transition-shadow">
        <div className="flex flex-wrap gap-1.5">
          {items.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-slate-100 text-[12px] text-slate-700"
            >
              {kw}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== kw).join(", "))}
                className="text-slate-400 hover:text-red-600 cursor-pointer"
                aria-label={`${kw} kaldır`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            onChange={(e) => {
              // A pasted "a, b, c" should become three chips, not one.
              if (e.target.value.includes(",")) {
                e.target.value.split(",").forEach((p) => p.trim() && add(p));
              } else {
                setDraft(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && items.length) {
                onChange(items.slice(0, -1).join(", "));
              }
            }}
            onBlur={() => add(draft)}
            placeholder={items.length ? "" : "kelime yazıp Enter'a basın"}
            className="flex-1 min-w-[140px] px-1 py-0.5 text-[13px] outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * Image picker that accepts either an upload or a pasted path.
 *
 * A pasted path matters as much as the upload: every region photo already in
 * the repo lives at /images/regions/*.jpg, and forcing a re-upload would
 * duplicate them into Supabase storage and orphan the originals.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  hint,
  aspect = "16/9",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Storage prefix; must match the API's [a-z0-9-]{1,32} rule. */
  folder: string;
  hint?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Yükleme başarısız");
      onChange(json.url);
      setBroken(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">{label}</label>

      <div className="flex gap-3">
        <div
          className="w-28 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center"
          style={{ aspectRatio: aspect }}
        >
          {value && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
          ) : (
            <ImageOff size={18} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="relative">
            <Link2
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setBroken(false);
              }}
              placeholder="/images/regions/ornek.jpg veya https://…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? "Yükleniyor…" : "Yükle"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setBroken(false);
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <X size={13} /> Kaldır
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </div>
      </div>

      {broken && value && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-600">
          <AlertCircle size={12} /> Bu yol yüklenemedi — dosya adını kontrol edin.
        </p>
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-600">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {hint && !error && <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-[11.5px] text-slate-500 mt-0.5 mb-3">{description}</p>}
      <div className={description ? "space-y-3.5" : "space-y-3.5 mt-3"}>{children}</div>
    </section>
  );
}
