import { getTranslations } from "next-intl/server";
import { Star, Quote } from "lucide-react";
import {
  MIN_REVIEWS_FOR_SCHEMA,
  aggregate,
  authorName,
  forLocale,
  type ReviewRow,
} from "@/lib/reviews";

/**
 * Real customer reviews, beside the booking form.
 *
 * The booking page asks a stranger for their card details and showed them not
 * one word from anybody who had already done it. The reviews existed — approved
 * in the admin panel, feeding the star rating in Google's results — and the
 * pages that sell the transfer never printed them.
 *
 * Two deliberate omissions:
 *
 * - No photographs of the reviewers. We do not have any, and a stock face
 *   beside a real person's words is the one thing here that would make honest
 *   reviews look invented. An initial on a coloured disc reads as an avatar,
 *   claims nothing, and cannot be caught out.
 * - No rounding up, no padding of the count. Both come straight from
 *   lib/reviews, which counts only approved rows. Three real reviews shown as
 *   three is worth more than a number nobody believes, and in the EU inventing
 *   them is illegal, not merely unwise.
 *
 * A server component: it renders once, ships no JavaScript, and adds nothing to
 * the wait before the form is usable.
 */

/** Deterministic disc colour, so the same reviewer keeps the same one. */
const AVATAR_TONES = [
  { bg: "#EDF8F4", fg: "#0e8a61" },
  { bg: "#EFF6FF", fg: "#1d4ed8" },
  { bg: "#FEF3C7", fg: "#b45309" },
  { bg: "#F3E8FF", fg: "#7e22ce" },
  { bg: "#FFE4E6", fg: "#be123c" },
];

function toneFor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export default async function SocialProofStrip({
  reviews,
  locale,
}: {
  reviews: ReviewRow[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "testimonials" });

  /* The average and the count come from every approved review, in every
     language: a number needs no translation, and splitting it by locale would
     show a Polish visitor a smaller count than the one the same page's search
     result advertises. */
  const { value, count } = aggregate(reviews);

  /* The same floor lib/reviews applies to the markup, for the same reason: a
     lone "5.0" persuades nobody and invites the suspicion that we wrote it.
     Below the floor the quotes still stand on their own — one real passenger in
     their own words is worth more than an average of one. */
  const showScore = value != null && count >= MIN_REVIEWS_FOR_SCHEMA;

  /* The quotes are a different matter — a comment the visitor cannot read is
     not reassurance. Prefer this language, fall back to the untagged ones,
     which lib/reviews treats as belonging everywhere. */
  const withText = (list: ReviewRow[]) =>
    list.filter((r) => (r.comment ?? "").trim().length > 0);

  const localised = withText(forLocale(reviews, locale));
  const quotes = (localised.length > 0 ? localised : withText(reviews)).slice(0, 3);

  // Nothing approved yet, or nothing anyone wrote down: draw nothing at all
  // rather than an empty frame promising reassurance it cannot give.
  if (!showScore && quotes.length === 0) return null;

  return (
    <section
      aria-label={t("heading")}
      className="w-full rounded-2xl bg-white p-4 sm:p-5"
      style={{ border: "1px solid rgba(0,0,0,0.07)" }}
    >
      {/* The score first, because it is the one thing that is read even by
          someone who is not going to read a review. */}
      {showScore && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[26px] font-black leading-none text-[#111827] tabular-nums">
            {value!.toFixed(1)}
          </span>
          <span className="flex flex-col gap-1">
            <Stars rating={value!} size={14} />
            <span className="text-[11.5px] font-medium text-[#6B7280]">
              {count} {t("reviewsLabel")}
            </span>
          </span>
          <span className="ms-auto hidden text-[12px] font-semibold text-[#111827] sm:block">
            {t("heading")}
          </span>
        </div>
      )}

      {quotes.length > 0 && (
        <div className={`grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 ${showScore ? "mt-4" : ""}`}>
          {quotes.map((r, i) => {
            const name = authorName(r, t("verifiedReview"));
            const tone = toneFor(name);
            const initial = name.trim().charAt(0).toLocaleUpperCase(locale);
            return (
              <figure
                key={r.id ?? i}
                className="flex h-full flex-col rounded-xl p-3"
                style={{ backgroundColor: "rgba(0,0,0,0.022)", border: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ backgroundColor: tone.bg, color: tone.fg }}
                  >
                    {initial}
                  </span>
                  <figcaption className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold leading-tight text-[#111827]">
                      {name}
                    </span>
                    {r.author_country && (
                      <span className="block truncate text-[10.5px] leading-tight text-[#9CA3AF]">
                        {r.author_country}
                      </span>
                    )}
                  </figcaption>
                  <Stars rating={r.rating} />
                </div>
                <blockquote className="relative mt-2.5 ps-4 text-[12px] leading-snug text-[#4B5563]">
                  <Quote
                    size={11}
                    aria-hidden="true"
                    className="absolute start-0 top-0.5 text-[#D1D5DB]"
                  />
                  {/* Clamped rather than cut, so no sentence ends mid-word and
                      nothing a customer wrote is silently rewritten. */}
                  <span className="line-clamp-4">{(r.comment ?? "").trim()}</span>
                </blockquote>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
