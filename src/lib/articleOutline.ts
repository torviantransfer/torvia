/**
 * Turns a sanitised article body into the parts the post page lays out: an
 * outline for the table of contents, a FAQ section that can render as an
 * accordion and feed FAQPage schema, and a split point for the inline booking
 * card.
 *
 * Works on the HTML string, not a DOM, because it runs on the server on every
 * post render and the bodies are small, admin-written markup — a parser would
 * cost more than it buys. Every step falls back to leaving the HTML exactly as
 * it was: an article this cannot read is still an article.
 */

export interface ArticleHeading {
  id: string;
  text: string;
}

export interface ArticleFaqItem {
  question: string;
  answer: string;
}

export interface ArticleOutline {
  /** Body before the inline card — or the whole body when there is no split. */
  before: string;
  /** Body after the inline card. Empty when the article is too short to split. */
  after: string;
  headings: ArticleHeading[];
  faq: ArticleFaqItem[];
  /** True when the FAQ was cut out of the body and should render as an accordion. */
  faqSeparated: boolean;
  /** Words in the whole article, FAQ included. */
  wordCount: number;
  /** Whether the article is long enough for a table of contents to help. */
  showToc: boolean;
}

/*
 * Length thresholds, in words. Tied to length rather than to the number of
 * headings: the posts use many short sections, and a 321-word article with
 * seven headings got a table of contents nearly as long as itself and a
 * booking card after its first 160 words, ahead of the answer the reader
 * came for.
 */
export const TOC_MIN_WORDS = 700;
export const INLINE_CARD_MIN_WORDS = 900;

/*
 * FAQ section headings as they appear in the posts, in every language. The
 * previous pattern had no Romanian or Arabic, and "często zadawane" never
 * matched the Polish posts, which say "Najczęściej zadawane pytania" — so those
 * pages carried a visible FAQ and no FAQPage markup.
 */
export const FAQ_HEADING =
  /sık sorulan|frequently asked|\bfaq\b|häufig gestellt|häufige fragen|zadawane pytania|часто задаваемые|частые вопросы|veelgestelde vragen|întrebări frecvente|intrebari frecvente|الأسئلة الشائعة/i;

const H2 = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;

/* An author who wrote a contents section by hand gets to keep it — a second,
   generated one above it would only repeat the same list. */
const MANUAL_TOC = /^(i̇çindekiler|içindekiler|contents|table of contents|inhalt|inhaltsverzeichnis|spis treści|содержание|inhoud|inhoudsopgave|cuprins)$/i;

const stripTags = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const LATIN: Record<string, string> = {
  ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u",
  ä: "a", ß: "ss", ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s",
  ź: "z", ż: "z", ă: "a", ș: "s", ț: "t", ţ: "t", é: "e", è: "e",
};

function slugify(text: string, fallback: string): string {
  const slug = text
    .toLocaleLowerCase("tr")
    .split("")
    .map((ch) => LATIN[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  // Cyrillic and Arabic headings leave nothing Latin behind.
  return slug.length >= 3 ? slug : fallback;
}

/**
 * Pulls question/answer pairs out of a FAQ section: each <h3> is a question,
 * the paragraphs up to the next <h3> are its answer.
 */
function readFaq(section: string): ArticleFaqItem[] {
  const items: ArticleFaqItem[] = [];
  const parts = section.split(/<h3\b[^>]*>/i).slice(1);
  for (const part of parts) {
    const end = part.search(/<\/h3>/i);
    if (end < 0) continue;
    const question = stripTags(part.slice(0, end));
    const answer = stripTags(part.slice(end + 5));
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

export function outlineArticle(html: string): ArticleOutline {
  const matches = [...html.matchAll(H2)];
  const wordCount = stripTags(html.replace(/<\/(p|li|h[1-6]|td|th)>/gi, " ")).split(" ").filter(Boolean).length;

  // ── FAQ ───────────────────────────────────────────────────────────────
  let body = html;
  let faq: ArticleFaqItem[] = [];
  let faqSeparated = false;

  const faqIndex = matches.findIndex((m) => FAQ_HEADING.test(stripTags(m[1])));
  if (faqIndex >= 0) {
    const start = matches[faqIndex].index ?? 0;
    const next = matches[faqIndex + 1];
    const end = next?.index ?? html.length;
    faq = readFaq(html.slice(start, end));
    // Cut out only when the FAQ is the last section and every question was
    // read. Anything else is left in place — the page still shows it, and the
    // schema still gets whatever pairs were found.
    if (faq.length > 0 && !next) {
      body = html.slice(0, start);
      faqSeparated = true;
    }
  }

  // ── Tables ────────────────────────────────────────────────────────────
  // Each table gets its own scrolling box. Styling the table itself as a block
  // stretched its border to the full width while the rows stayed as narrow as
  // their content — the "cut off" look — and the editor's tables have no
  // <thead>/<tbody> for CSS to hang anything else on.
  body = body.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => `<div class="article-table">${table}</div>`);

  // ── Heading ids for the table of contents ─────────────────────────────
  const headings: ArticleHeading[] = [];
  const used = new Set<string>();
  let n = 0;
  body = body.replace(H2, (full, inner: string) => {
    n += 1;
    const text = stripTags(inner);
    if (!text) return full;
    const existing = /\bid\s*=\s*["']([^"']+)["']/i.exec(full.slice(0, full.indexOf(">")));
    let id = existing?.[1] ?? slugify(text, `bolum-${n}`);
    while (used.has(id)) id = `${id}-${n}`;
    used.add(id);
    headings.push({ id, text });
    return existing ? full : full.replace(/^<h2\b/i, `<h2 id="${id}"`);
  });

  // ── Split point for the inline card ───────────────────────────────────
  // Halfway through the sections, at a heading, so the card never lands inside
  // a list or between a table and the sentence that explains it. Short
  // articles are not split — the closing card is close enough.
  let before = body;
  let after = "";
  if (wordCount >= INLINE_CARD_MIN_WORDS && headings.length >= 4) {
    const target = headings[Math.floor(headings.length / 2)];
    const at = body.search(new RegExp(`<h2\\b[^>]*\\bid="${target.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "i"));
    if (at > 0) {
      before = body.slice(0, at);
      after = body.slice(at);
    }
  }

  const hasManualToc = headings.some((h) => MANUAL_TOC.test(h.text));
  const showToc = !hasManualToc && wordCount >= TOC_MIN_WORDS && headings.length >= 3;

  return { before, after, headings, faq, faqSeparated, wordCount, showToc };
}
