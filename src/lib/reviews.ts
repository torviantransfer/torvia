/**
 * Reviews, and the structured data that can actually earn a star rating in
 * the SERP.
 *
 * Why a `Product` node and not the `TaxiService` / `LocalBusiness` ones the
 * pages already emit:
 *
 * - Google renders review snippets only for a fixed list of types, and
 *   `TaxiService` (a subtype of `Service`) is not on it. The aggregateRating
 *   the region page has been emitting could never have produced stars.
 * - `LocalBusiness` and `Organization` are on the list, but Google has not
 *   shown *self-serving* reviews — a business publishing reviews about
 *   itself — for those types since 2019. Stars there are a dead end too.
 * - A transfer is a priced, bookable item with a fixed offer, so `Product` is
 *   both the type Google will render and an honest description of it. This is
 *   the pattern the competitors showing "4.8 (127)" are using.
 *
 * Everything below is built only from reviews an admin has approved, and the
 * count and average are the real ones. Inventing either is what earns a manual
 * action, and it is not worth the stars.
 */

export interface ReviewRow {
  id?: string;
  rating: number;
  comment: string | null;
  created_at?: string | null;
  published_at?: string | null;
  author_name?: string | null;
  author_country?: string | null;
  locale?: string | null;
  source?: string | null;
  is_featured?: boolean | null;
  customers?: { first_name?: string | null } | { first_name?: string | null }[] | null;
}

export interface ReviewAggregate {
  /** One decimal, e.g. 4.8. Null when there is nothing to average. */
  value: number | null;
  count: number;
}

/**
 * Google requires at least one review behind an aggregateRating, and a
 * rounded average that matches the underlying data. Anything below this floor
 * is not worth marking up: a "5.0 (1)" snippet reads as fake to a human even
 * when it is true, and Google frequently declines to render it.
 */
export const MIN_REVIEWS_FOR_SCHEMA = 3;

export function aggregate(reviews: ReviewRow[]): ReviewAggregate {
  const valid = reviews.filter((r) => typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5);
  if (valid.length === 0) return { value: null, count: 0 };
  const sum = valid.reduce((acc, r) => acc + r.rating, 0);
  return { value: Math.round((sum / valid.length) * 10) / 10, count: valid.length };
}

/** Display name, falling back through the admin field then the booking customer. */
export function authorName(review: ReviewRow, fallback = "Misafir"): string {
  const own = review.author_name?.trim();
  if (own) return own;
  const c = Array.isArray(review.customers) ? review.customers[0] : review.customers;
  const first = c?.first_name?.trim();
  return first || fallback;
}

export function reviewDate(review: ReviewRow): string | null {
  return review.published_at ?? review.created_at ?? null;
}

/**
 * Builds the aggregateRating + review nodes for a page, or null when there is
 * not enough real data to justify them.
 *
 * Returning null rather than a zeroed object matters: spreading `null` into a
 * schema object is a no-op, so a caller can write
 * `...(ratingSchema(reviews) ?? {})` and get a page with no rating markup at
 * all — which is the correct output for a region nobody has reviewed yet.
 */
export function ratingSchema(
  reviews: ReviewRow[],
  options: { maxReviews?: number } = {}
): Record<string, unknown> | null {
  const { maxReviews = 5 } = options;
  const { value, count } = aggregate(reviews);
  if (value == null || count < MIN_REVIEWS_FOR_SCHEMA) return null;

  const withText = reviews
    .filter((r) => (r.comment ?? "").trim().length > 0)
    .slice(0, maxReviews);

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: value,
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    },
    // Google wants at least one individual review alongside the aggregate.
    // Omitted entirely when none of the approved reviews has written text —
    // an empty array is worse than no property.
    ...(withText.length > 0
      ? {
          review: withText.map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: authorName(r) },
            reviewBody: (r.comment ?? "").trim(),
            ...(reviewDate(r) ? { datePublished: reviewDate(r)!.slice(0, 10) } : {}),
          })),
        }
      : {}),
  };
}

/**
 * The `Product` node that carries the stars.
 *
 * Emitted as a separate top-level script rather than folded into the existing
 * TaxiService graph, so the pages' current markup — which Search Console has
 * already validated — is left exactly as it is.
 */
export function productSchema({
  name,
  description,
  url,
  image,
  price,
  currency = "USD",
  reviews,
}: {
  name: string;
  description: string;
  url: string;
  image: string;
  price?: number | null;
  currency?: string;
  reviews: ReviewRow[];
}): Record<string, unknown> | null {
  const rating = ratingSchema(reviews);
  // With no rating there is nothing this node adds that the TaxiService node
  // does not already say, and a second description of the same thing is only
  // a chance for the two to disagree.
  if (!rating) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    brand: { "@type": "Brand", name: "TORVIAN Transfer" },
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price: Math.round(price),
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
    ...rating,
  };
}

/**
 * Which reviews belong on a page in a given locale.
 *
 * A review with no locale is shown everywhere — that is how every review
 * predating migration 057 is stored, so this keeps them visible. A review
 * tagged with a locale only appears on that language's pages, so a Russian
 * comment does not land on the Dutch page.
 */
export function forLocale<T extends ReviewRow>(reviews: T[], locale: string): T[] {
  return reviews.filter((r) => !r.locale || r.locale === locale);
}
