import type { ReactNode } from "react";
import type { Tone } from "@/components/admin/ui";

export type Stage = "browsing" | "vehicle" | "form" | "payment" | "purchased";

export const STAGE: Record<Stage, { label: string; tone: Tone }> = {
  browsing: { label: "Geziniyor", tone: "neutral" },
  vehicle: { label: "Araç seçti", tone: "violet" },
  form: { label: "Form dolduruyor", tone: "blue" },
  payment: { label: "Ödemede", tone: "amber" },
  purchased: { label: "Satın aldı", tone: "green" },
};

const SOURCES: Record<string, string> = {
  direct: "Doğrudan",
  google: "Google (organik)",
  google_ads: "Google Ads",
  instagram: "Instagram",
  facebook: "Facebook",
  meta_ads: "Meta reklamları",
  twitter: "Twitter / X",
  tiktok: "TikTok",
  youtube: "YouTube",
  email: "E-posta",
  bing: "Bing",
  yandex: "Yandex",
  whatsapp: "WhatsApp",
  referral: "Yönlendirme",
};

export const sourceLabel = (source: string) => SOURCES[source] ?? source;

/* Only the countries Antalya actually sells to are named; anything else keeps
   its ISO code, which is still more use than a blank. */
const COUNTRIES: Record<string, string> = {
  TR: "Türkiye", DE: "Almanya", GB: "İngiltere", US: "ABD", RU: "Rusya",
  NL: "Hollanda", FR: "Fransa", PL: "Polonya", UA: "Ukrayna", BE: "Belçika",
  AT: "Avusturya", SE: "İsveç", NO: "Norveç", DK: "Danimarka", FI: "Finlandiya",
  CH: "İsviçre", IT: "İtalya", ES: "İspanya", PT: "Portekiz", CZ: "Çekya",
  SK: "Slovakya", HU: "Macaristan", RO: "Romanya", BG: "Bulgaristan",
  HR: "Hırvatistan", GR: "Yunanistan", IL: "İsrail", AE: "BAE",
  SA: "S. Arabistan", KW: "Kuveyt", QA: "Katar", BH: "Bahreyn", OM: "Umman",
  LB: "Lübnan", JO: "Ürdün", EG: "Mısır", IR: "İran", IQ: "Irak",
  KZ: "Kazakistan", AZ: "Azerbaycan", GE: "Gürcistan", AM: "Ermenistan",
  AU: "Avustralya", CA: "Kanada", JP: "Japonya", CN: "Çin", KR: "G. Kore",
  IN: "Hindistan", SG: "Singapur", IE: "İrlanda", LT: "Litvanya",
  LV: "Letonya", EE: "Estonya", RS: "Sırbistan", MD: "Moldova", BY: "Belarus",
};

/* Regional indicator symbols are the code's two letters offset into their own
   Unicode block, so every country gets a flag without a lookup table. */
function flagOf(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function Country({ code, city }: { code: string | null; city?: string | null }): ReactNode {
  const upper = (code ?? "").toUpperCase();
  const known = upper && upper !== "UNKNOWN";
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span aria-hidden="true" className="text-base leading-none">
        {known ? flagOf(upper) : "🌐"}
      </span>
      <span className="truncate">{known ? (COUNTRIES[upper] ?? upper) : "Bilinmiyor"}</span>
      {city && <span className="truncate text-adm-muted">· {city}</span>}
    </span>
  );
}

/** "mercedes-vito-vip" → "Mercedes Vito Vip": the wizard reports slugs. */
export const vehicleLabel = (slug: string | null) =>
  slug ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : null;

/**
 * The path as the visitor actually has it, only shortened.
 *
 * The locale used to be stripped here, which made every language collapse
 * into the same line: `/en/booking` and `/de/booking` both read `/booking`,
 * and the one thing worth knowing about a visitor on a site sold in eight
 * languages — which version they are reading — was the one thing the screen
 * threw away. It costs three characters to keep.
 */
export function shortPath(raw: string | null) {
  const clean = raw?.trim() || "/";
  return clean.length > 44 ? `${clean.slice(0, 43)}…` : clean;
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds} sn önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  return `${Math.floor(minutes / 60)} sa önce`;
}

/** A ranked list with a thin bar per row; one hue, the value in text beside it. */
export function RankedBars({
  rows,
  empty = "Henüz veri yok",
}: {
  rows: { key: string; label: ReactNode; value: number; extra?: ReactNode }[];
  empty?: string;
}) {
  if (rows.length === 0) return <p className="px-[18px] py-8 text-center text-[13px] text-adm-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid max-h-80 gap-2.5 overflow-y-auto p-[18px]">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-adm-ink-2">{r.label}</span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums">
              <span className="font-semibold text-adm-ink">{r.value.toLocaleString("tr-TR")}</span>
              {r.extra}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-adm-line-2">
            <div className="h-1.5 rounded-full bg-[#2a78d6]" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
