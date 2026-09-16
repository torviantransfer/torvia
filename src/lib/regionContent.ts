/**
 * The region page's editable content — `regions.page_content`.
 *
 * Read defensively: the column is a JSON document an admin writes through a
 * form, and a malformed or half-filled one must never take a region page down.
 * Everything here returns empty values rather than throwing, and the page
 * treats empty as "use what was there before".
 *
 * Shape (see migration 097 — `faqOverrides` is new but needs no migration of
 * its own, since the column is JSONB and an old row simply has none saved):
 *   { "highlight_images": [url, url, url],
 *     "<locale>": { subtitle, about, highlights: [{title, description}],
 *                    faq: [{question, answer}], faqOverrides: [{question, answer} x10] } }
 */

export const HIGHLIGHT_SLOTS = 3;
export const REGION_FAQ_MAX = 6;

/**
 * The eleven questions every region page carries by default (lib/regionDefaults
 * → generalFaq) are a template: the same ten questions, region data filled in,
 * on every one of thirty-plus pages. Real, if moderate, thin/duplicate-content
 * risk — this is how many of the ten a page may rewrite. The eleventh, the
 * hotel-list question, is not overridable: it already names this region's own
 * hotels, so it is not templated to begin with.
 */
export const GENERAL_FAQ_COUNT = 10;

export interface RegionHighlightText {
  title: string;
  description: string;
}

export interface RegionFaqEntry {
  question: string;
  answer: string;
}

export interface RegionLocaleContent {
  subtitle: string;
  about: string;
  highlights: RegionHighlightText[];
  faq: RegionFaqEntry[];
  /** One slot per general question; an empty slot means "use the auto text". */
  faqOverrides: RegionFaqEntry[];
}

export interface RegionPageContent {
  highlightImages: string[];
  locales: Record<string, RegionLocaleContent>;
}

const text = (v: unknown): string => (typeof v === "string" ? v : "");

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function emptyLocaleContent(): RegionLocaleContent {
  return {
    subtitle: "",
    about: "",
    highlights: Array.from({ length: HIGHLIGHT_SLOTS }, () => ({ title: "", description: "" })),
    faq: [],
    faqOverrides: Array.from({ length: GENERAL_FAQ_COUNT }, () => ({ question: "", answer: "" })),
  };
}

/** Always returns a full structure: three highlight slots, every locale asked for. */
export function readPageContent(raw: unknown, locales: readonly string[]): RegionPageContent {
  const doc = record(raw);

  const images = list(doc.highlight_images).map(text);
  const highlightImages = Array.from({ length: HIGHLIGHT_SLOTS }, (_, i) => images[i] ?? "");

  const out: Record<string, RegionLocaleContent> = {};
  for (const loc of locales) {
    const src = record(doc[loc]);
    const highlights = list(src.highlights).map((h) => {
      const r = record(h);
      return { title: text(r.title), description: text(r.description) };
    });
    out[loc] = {
      subtitle: text(src.subtitle),
      about: text(src.about),
      highlights: Array.from(
        { length: HIGHLIGHT_SLOTS },
        (_, i) => highlights[i] ?? { title: "", description: "" }
      ),
      faq: list(src.faq)
        .map((f) => {
          const r = record(f);
          return { question: text(r.question), answer: text(r.answer) };
        })
        .slice(0, REGION_FAQ_MAX),
      faqOverrides: (() => {
        const overrides = list(src.faqOverrides).map((f) => {
          const r = record(f);
          return { question: text(r.question), answer: text(r.answer) };
        });
        return Array.from({ length: GENERAL_FAQ_COUNT }, (_, i) => overrides[i] ?? { question: "", answer: "" });
      })(),
    };
  }

  return { highlightImages, locales: out };
}

/**
 * The document written back. Trims, and leaves out what is empty, so a locale
 * nobody has touched stores nothing and the JSON stays readable in the DB.
 */
export function writePageContent(content: RegionPageContent): Record<string, unknown> {
  const doc: Record<string, unknown> = {};

  const images = content.highlightImages.map((s) => s.trim());
  if (images.some(Boolean)) doc.highlight_images = images;

  for (const [loc, c] of Object.entries(content.locales)) {
    const entry: Record<string, unknown> = {};
    if (c.subtitle.trim()) entry.subtitle = c.subtitle.trim();
    if (c.about.trim()) entry.about = c.about.trim();

    const highlights = c.highlights.map((h) => ({
      title: h.title.trim(),
      description: h.description.trim(),
    }));
    if (highlights.some((h) => h.title || h.description)) entry.highlights = highlights;

    const faq = c.faq
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question && f.answer);
    if (faq.length) entry.faq = faq;

    const faqOverrides = c.faqOverrides.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
    if (faqOverrides.some((f) => f.question || f.answer)) entry.faqOverrides = faqOverrides;

    if (Object.keys(entry).length) doc[loc] = entry;
  }

  return doc;
}

/** Paragraphs are separated by a blank line in the form. */
export function paragraphs(value: string): string[] {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Hotel names, one per line in the form. */
export function readHotels(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(text).map((s) => s.trim()).filter(Boolean);
}

/** How much of a locale is filled in — drives the dot on the language tab. */
export function localeFill(c: RegionLocaleContent): "full" | "partial" | "empty" {
  const parts = [
    Boolean(c.subtitle.trim()),
    Boolean(c.about.trim()),
    c.highlights.some((h) => h.title.trim()),
    c.faq.some((f) => f.question.trim()) || c.faqOverrides.some((f) => f.question.trim() || f.answer.trim()),
  ];
  const n = parts.filter(Boolean).length;
  return n === 0 ? "empty" : n === parts.length ? "full" : "partial";
}
