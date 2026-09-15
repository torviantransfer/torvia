"use client";

import { Globe, Star, ChevronDown, Smartphone, Monitor } from "lucide-react";
import { useState } from "react";
import { TITLE_IDEAL_MAX, DESC_IDEAL_MAX } from "@/lib/seoScore";

const SITE = "torviantransfer.com";

/**
 * Google truncates at a pixel width, so the same character count fits
 * differently on desktop (~600px title) and mobile. Approximating with a
 * character cap per device is close enough to be useful and, unlike a pixel
 * measurement, does not depend on the exact font Google is shipping this week.
 */
const LIMITS = {
  desktop: { title: TITLE_IDEAL_MAX, desc: DESC_IDEAL_MAX },
  mobile: { title: 55, desc: 120 },
};

function truncate(value: string, max: number): { text: string; cut: boolean } {
  if (value.length <= max) return { text: value, cut: false };
  return { text: value.slice(0, max - 1).trimEnd() + "…", cut: true };
}

/** Bolds the words Google would bold: those matching the query terms. */
function highlight(text: string, terms: string[]) {
  const real = terms.map((t) => t.trim()).filter((t) => t.length > 2);
  if (real.length === 0) return text;
  const pattern = new RegExp(
    `(${real.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  return text.split(pattern).map((part, i) =>
    real.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <b key={i} style={{ fontWeight: 700 }}>
        {part}
      </b>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function SerpPreview({
  title,
  description,
  path,
  locale,
  keywords = [],
  imageUrl,
  rating,
  reviewCount,
}: {
  title: string;
  description: string;
  /** Path after the locale segment. "" for the homepage. */
  path: string;
  locale: string;
  keywords?: string[];
  /** Shown as the thumbnail Google renders when max-image-preview is large. */
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const limit = LIMITS[device];

  const shownTitle = truncate(title || "Başlık yok — Google sayfadan kendi seçer", limit.title);
  const shownDesc = truncate(
    description || "Meta açıklama yok. Google sayfa metninden rastgele bir bölüm gösterir.",
    limit.desc
  );

  const crumb = path ? `${SITE} › ${locale} › ${path.split("/").join(" › ")}` : `${SITE} › ${locale}`;

  return (
    <div className="rounded-adm border border-adm-line bg-adm-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-adm-line-2 bg-adm-surface-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-adm-muted">
          <Globe size={13} />
          Google önizleme
        </div>
        <div className="flex items-center gap-0.5 rounded-adm-sm bg-adm-surface border border-adm-line p-0.5">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: device === d ? "#0f172a" : "transparent",
                color: device === d ? "#fff" : "#64748b",
              }}
            >
              {d === "desktop" ? <Monitor size={12} /> : <Smartphone size={12} />}
              {d === "desktop" ? "Masaüstü" : "Mobil"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4" style={{ maxWidth: device === "mobile" ? 400 : "100%" }}>
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {/* Favicon + breadcrumb row, matching Google's current layout. */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-adm-line-2 border border-adm-line flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-adm-brand-ink">T</span>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] leading-4 text-adm-ink">TORVIAN Transfer</div>
                <div className="text-[11px] leading-4 text-adm-muted truncate">{crumb}</div>
              </div>
              <ChevronDown size={13} className="text-adm-muted shrink-0" />
            </div>

            <div
              className="text-[19px] leading-[1.3] mb-1"
              style={{
                color: "#1a0dab",
                fontFamily: "arial, sans-serif",
                textDecoration: "none",
              }}
            >
              {shownTitle.text}
            </div>

            {/* Review stars only render when there is an aggregateRating to
                back them; showing them unconditionally would teach the editor
                to expect stars the markup does not actually earn. */}
            {rating != null && reviewCount != null && reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mb-1 text-[13px] text-adm-ink-2">
                <span className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < Math.round(rating) ? "text-adm-amber" : "text-adm-faint"}
                      fill="currentColor"
                    />
                  ))}
                </span>
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-adm-muted">({reviewCount} yorum)</span>
              </div>
            )}

            <div
              className="text-[13px] leading-[1.58] text-adm-ink-2"
              style={{ fontFamily: "arial, sans-serif" }}
            >
              {highlight(shownDesc.text, keywords)}
            </div>
          </div>

          {/* max-image-preview:large is what lets this thumbnail appear at all. */}
          {imageUrl && (
            <div className="w-[92px] h-[92px] shrink-0 rounded-adm-sm overflow-hidden bg-adm-line-2 border border-adm-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {(shownTitle.cut || shownDesc.cut) && (
          <p className="mt-3 text-[11px] text-adm-amber bg-adm-amber-soft border border-adm-amber-line rounded-md px-2.5 py-1.5">
            {shownTitle.cut && shownDesc.cut
              ? "Başlık ve açıklama bu ekranda kesiliyor."
              : shownTitle.cut
                ? "Başlık bu ekranda kesiliyor."
                : "Açıklama bu ekranda kesiliyor."}
          </p>
        )}
      </div>
    </div>
  );
}
