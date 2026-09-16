/**
 * The booking page's editable content — `settings` row keyed
 * `booking_page_content` (see migration 105).
 *
 * Same "auto text with override" contract as `regionContent.ts`: read
 * defensively, and treat an empty field as "keep showing the translation-file
 * text that has always been there", never as "show nothing". The page decides
 * what the auto text is (it comes from `next-intl`, not from here) — this
 * module only carries what the admin typed, if anything.
 *
 * Shape:
 *   { "<locale>": {
 *       trustCards:    [{title, desc} x TRUST_CARD_COUNT],
 *       guideSections: [{title, body} x GUIDE_SECTION_COUNT],
 *       faq:           [{question, answer} x FAQ_COUNT],
 *       closingText:   "…"
 *     }, … }
 */

export const TRUST_CARD_COUNT = 6;
export const GUIDE_SECTION_COUNT = 4;
export const FAQ_COUNT = 8;

export interface BookingTrustCard {
  title: string;
  desc: string;
}

export interface BookingGuideSection {
  title: string;
  body: string;
}

export interface BookingFaqEntry {
  question: string;
  answer: string;
}

export interface BookingLocaleContent {
  trustCards: BookingTrustCard[];
  guideSections: BookingGuideSection[];
  faq: BookingFaqEntry[];
  closingText: string;
}

export interface BookingPageContent {
  locales: Record<string, BookingLocaleContent>;
}

const text = (v: unknown): string => (typeof v === "string" ? v : "");

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function emptyLocaleContent(): BookingLocaleContent {
  return {
    trustCards: Array.from({ length: TRUST_CARD_COUNT }, () => ({ title: "", desc: "" })),
    guideSections: Array.from({ length: GUIDE_SECTION_COUNT }, () => ({ title: "", body: "" })),
    faq: Array.from({ length: FAQ_COUNT }, () => ({ question: "", answer: "" })),
    closingText: "",
  };
}

/** Always returns a full structure: every slot, every locale asked for. */
export function readBookingContent(raw: unknown, locales: readonly string[]): BookingPageContent {
  const doc = record(raw);

  const out: Record<string, BookingLocaleContent> = {};
  for (const loc of locales) {
    const src = record(doc[loc]);

    const trustCards = list(src.trustCards).map((c) => {
      const r = record(c);
      return { title: text(r.title), desc: text(r.desc) };
    });
    const guideSections = list(src.guideSections).map((g) => {
      const r = record(g);
      return { title: text(r.title), body: text(r.body) };
    });
    const faq = list(src.faq).map((f) => {
      const r = record(f);
      return { question: text(r.question), answer: text(r.answer) };
    });

    out[loc] = {
      trustCards: Array.from({ length: TRUST_CARD_COUNT }, (_, i) => trustCards[i] ?? { title: "", desc: "" }),
      guideSections: Array.from(
        { length: GUIDE_SECTION_COUNT },
        (_, i) => guideSections[i] ?? { title: "", body: "" }
      ),
      faq: Array.from({ length: FAQ_COUNT }, (_, i) => faq[i] ?? { question: "", answer: "" }),
      closingText: text(src.closingText),
    };
  }

  return { locales: out };
}

/**
 * The document written back. Trims, and leaves out what is empty, so a locale
 * nobody has touched stores nothing and the JSON stays readable in the DB.
 */
export function writeBookingContent(content: BookingPageContent): Record<string, unknown> {
  const doc: Record<string, unknown> = {};

  for (const [loc, c] of Object.entries(content.locales)) {
    const entry: Record<string, unknown> = {};

    const trustCards = c.trustCards.map((t) => ({ title: t.title.trim(), desc: t.desc.trim() }));
    if (trustCards.some((t) => t.title || t.desc)) entry.trustCards = trustCards;

    const guideSections = c.guideSections.map((g) => ({ title: g.title.trim(), body: g.body.trim() }));
    if (guideSections.some((g) => g.title || g.body)) entry.guideSections = guideSections;

    const faq = c.faq.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
    if (faq.some((f) => f.question || f.answer)) entry.faq = faq;

    if (c.closingText.trim()) entry.closingText = c.closingText.trim();

    if (Object.keys(entry).length) doc[loc] = entry;
  }

  return doc;
}

/** How much of a locale is filled in — drives the dot on the language tab. */
export function localeFill(c: BookingLocaleContent): "full" | "partial" | "empty" {
  const parts = [
    c.trustCards.some((t) => t.title.trim() || t.desc.trim()),
    c.guideSections.some((g) => g.title.trim() || g.body.trim()),
    c.faq.some((f) => f.question.trim() || f.answer.trim()),
    Boolean(c.closingText.trim()),
  ];
  const n = parts.filter(Boolean).length;
  return n === 0 ? "empty" : n === parts.length ? "full" : "partial";
}
