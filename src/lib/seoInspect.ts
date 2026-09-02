/**
 * Reads the SEO surface of a page as it is actually served.
 *
 * The admin panel needs to show the *effective* value of every SEO field —
 * what Google sees right now — not just whatever override happens to sit in
 * the database. Those are different things whenever a field is blank, which
 * is most of them: the meta title of /en/antalya-airport-transfer comes from
 * a hardcoded map inside that page's generateMetadata, not from any row.
 *
 * Metadata reaches the browser through four different paths in this codebase
 * (`applySeoPage` for the 16 static/landing pages, nothing at all for
 * /booking, the regions table for region pages, blog_posts for posts). Any
 * attempt to recompute a page's fallback inside the admin would have to
 * reimplement all four and would silently drift from them the first time
 * someone edits a page file. So the panel does not recompute anything: it
 * fetches the rendered HTML and reads the tags out of it.
 *
 * Deliberately dependency-free regex parsing rather than a DOM library. The
 * input is our own server-rendered output, the tags of interest are all in
 * <head> with predictable shapes, and pulling a parser into the server bundle
 * for this is not worth it. The one place that needs real leniency —
 * JSON-LD — is parsed with JSON.parse and failures are reported rather than
 * thrown, because an invalid schema block is itself a finding.
 */

export interface InspectedAlternate {
  hreflang: string;
  href: string;
}

export interface InspectedSchema {
  /** @type of the top-level node, or of each node in an @graph. */
  types: string[];
  /** Whether JSON.parse succeeded. */
  valid: boolean;
  /** Parse error message when invalid. */
  error?: string;
  /** Byte length, so the panel can show which block is which. */
  size: number;
  /** Selected fields the audit needs, kept small on purpose. */
  fields: Record<string, unknown>;
}

export interface InspectedImage {
  src: string;
  alt: string | null;
  /** True when the img sits inside the first <main> section — the hero. */
  isHero: boolean;
}

export interface PageInspection {
  url: string;
  status: number;
  /** Present when the fetch itself failed. */
  error?: string;

  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  googlebot: string | null;
  alternates: InspectedAlternate[];

  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogImageAlt: string | null;
  ogType: string | null;
  ogUrl: string | null;
  ogLocale: string | null;

  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterCard: string | null;

  htmlLang: string | null;
  h1s: string[];
  h2Count: number;
  /** Every <img> with its alt, so the audit can report missing alt text. */
  images: InspectedImage[];
  /** Approximate word count of the body text. */
  wordCount: number;

  schemas: InspectedSchema[];
  /** When the inspection ran, so the panel can show staleness. */
  fetchedAt: string;
}

const HEAD_LIMIT = 400_000;

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    // &amp; last, so "&amp;lt;" does not become "<".
    .replace(/&amp;/g, "&");
}

/** Pulls one attribute out of a tag string. Handles both quote styles. */
function attr(tag: string, name: string): string | null {
  const m =
    tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i")) ??
    tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? decodeEntities(m[1]) : null;
}

/** Finds a <meta> tag by its name/property and returns its content. */
function meta(html: string, key: string, keyAttr: "name" | "property" = "name"): string | null {
  const re = new RegExp(`<meta\\b[^>]*\\b${keyAttr}\\s*=\\s*["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return attr(tag, "content");
}

/**
 * Open Graph tags are `property=`, but Next.js emits `name=` for some and
 * plenty of pages in the wild use either, so both are tried.
 */
function ogMeta(html: string, key: string): string | null {
  return meta(html, key, "property") ?? meta(html, key, "name");
}

function collectSchemas(html: string): InspectedSchema[] {
  const out: InspectedSchema[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const nodes: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>)["@graph"])
          ? ((parsed as Record<string, unknown>)["@graph"] as Record<string, unknown>[])
          : [parsed];
      const types = nodes
        .map((n) => n?.["@type"])
        .flatMap((t) => (Array.isArray(t) ? t : [t]))
        .filter((t): t is string => typeof t === "string");

      // Only the handful of fields the audit reasons about are carried over.
      // Keeping whole schema objects would balloon the response for a
      // 30-region scan without telling the panel anything more.
      const first = nodes[0] ?? {};
      const fields: Record<string, unknown> = {};
      for (const key of [
        "name",
        "headline",
        "datePublished",
        "dateModified",
        "author",
        "image",
        "aggregateRating",
        "review",
        "mainEntityOfPage",
      ]) {
        if (key in first) fields[key] = first[key];
      }

      out.push({ types, valid: true, size: raw.length, fields });
    } catch (err) {
      out.push({
        types: [],
        valid: false,
        error: err instanceof Error ? err.message : "JSON parse hatası",
        size: raw.length,
        fields: {},
      });
    }
  }
  return out;
}

function collectImages(html: string): InspectedImage[] {
  const mainStart = html.search(/<main\b/i);
  const out: InspectedImage[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let seenInMain = 0;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const src = attr(tag, "src");
    if (!src) continue;
    const inMain = mainStart >= 0 && m.index > mainStart;
    if (inMain) seenInMain += 1;
    out.push({
      src,
      // An explicitly empty alt="" is a valid decorative marker, and is
      // reported as "" rather than null so the audit can tell the two apart.
      alt: attr(tag, "alt"),
      isHero: inMain && seenInMain === 1,
    });
    if (out.length >= 60) break;
  }
  return out;
}

function collectHeadings(html: string, tag: "h1" | "h2"): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = decodeEntities(m[1].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    if (out.length >= 20) break;
  }
  return out;
}

function bodyWordCount(html: string): number {
  const bodyStart = html.search(/<main\b/i);
  const slice = bodyStart >= 0 ? html.slice(bodyStart) : html;
  const text = slice
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(text).split(/\s+/).filter((w) => w.length > 1).length;
}

/** Parses an already-fetched HTML document. Exported for testing. */
export function parseInspection(url: string, status: number, html: string): PageInspection {
  const doc = html.length > HEAD_LIMIT ? html.slice(0, HEAD_LIMIT) : html;

  const titleTag = doc.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const canonicalTag = doc.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i)?.[0];

  const alternates: InspectedAlternate[] = [];
  const altRe = /<link\b[^>]*rel\s*=\s*["']alternate["'][^>]*>/gi;
  let am: RegExpExecArray | null;
  while ((am = altRe.exec(doc)) !== null) {
    const hreflang = attr(am[0], "hreflang");
    const href = attr(am[0], "href");
    if (hreflang && href) alternates.push({ hreflang, href });
  }

  return {
    url,
    status,
    title: titleTag ? decodeEntities(titleTag).trim() : null,
    description: meta(doc, "description"),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    robots: meta(doc, "robots"),
    googlebot: meta(doc, "googlebot"),
    alternates,

    ogTitle: ogMeta(doc, "og:title"),
    ogDescription: ogMeta(doc, "og:description"),
    ogImage: ogMeta(doc, "og:image"),
    ogImageAlt: ogMeta(doc, "og:image:alt"),
    ogType: ogMeta(doc, "og:type"),
    ogUrl: ogMeta(doc, "og:url"),
    ogLocale: ogMeta(doc, "og:locale"),

    twitterTitle: meta(doc, "twitter:title") ?? ogMeta(doc, "twitter:title"),
    twitterDescription: meta(doc, "twitter:description") ?? ogMeta(doc, "twitter:description"),
    twitterImage: meta(doc, "twitter:image") ?? ogMeta(doc, "twitter:image"),
    twitterCard: meta(doc, "twitter:card") ?? ogMeta(doc, "twitter:card"),

    htmlLang: doc.match(/<html\b[^>]*>/i)?.[0] ? attr(doc.match(/<html\b[^>]*>/i)![0], "lang") : null,
    h1s: collectHeadings(html, "h1"),
    h2Count: collectHeadings(html, "h2").length,
    images: collectImages(html),
    wordCount: bodyWordCount(html),

    schemas: collectSchemas(html),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches and inspects one page.
 *
 * `origin` is the deployment doing the asking, not the production domain, so
 * a preview build reports on itself rather than on whatever is live. That
 * distinction is the whole point when the purpose is verifying a change
 * before it ships.
 */
export async function inspectPage(origin: string, path: string): Promise<PageInspection> {
  const url = new URL(path, origin).toString();
  try {
    const res = await fetch(url, {
      // The page must be rendered fresh: a cached copy would show the state
      // before the admin's last save and make the panel look broken.
      cache: "no-store",
      redirect: "follow",
      headers: {
        // Identifies these requests in access logs, and keeps the analytics
        // middleware from counting them as visitors.
        "user-agent": "TorvianSeoInspector/1.0",
        accept: "text/html",
      },
    });
    const html = await res.text();
    const inspection = parseInspection(url, res.status, html);
    // A redirect means the URL the panel holds is not the live one; the
    // caller compares res.url to spot it.
    if (res.redirected) inspection.url = res.url;
    return inspection;
  } catch (err) {
    return {
      url,
      status: 0,
      error: err instanceof Error ? err.message : "Sayfa okunamadı",
      title: null,
      description: null,
      canonical: null,
      robots: null,
      googlebot: null,
      alternates: [],
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      ogImageAlt: null,
      ogType: null,
      ogUrl: null,
      ogLocale: null,
      twitterTitle: null,
      twitterDescription: null,
      twitterImage: null,
      twitterCard: null,
      htmlLang: null,
      h1s: [],
      h2Count: 0,
      images: [],
      wordCount: 0,
      schemas: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}
