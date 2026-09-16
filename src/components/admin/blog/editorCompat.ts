/**
 * What the visual editor can hold, and what it would drop.
 *
 * The editor keeps a document model, not the HTML it was given: markup it has
 * no node for is unwrapped or discarded the first time the post is saved from
 * it. Most posts are plain headings, paragraphs, lists and tables, and survive
 * untouched. A few carry styled boxes (`<div class="info-box">`), inline
 * `style` attributes or anchors on `<section id>` — and a writer fixing a typo
 * should not silently lose those. So the editor opens such a post in HTML mode
 * and says, before converting, what will go.
 *
 * Both parse with DOMParser, so they only do their work in the browser.
 */

/** Wrappers the editor unwraps, keeping what is inside. */
const WRAPPERS = new Set([
  "div", "section", "article", "header", "footer", "nav", "main", "aside", "span", "figure", "figcaption",
]);

/** Elements the editor has a node or mark for. */
const SUPPORTED = new Set([
  "p", "h1", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "strike", "del",
  "a", "blockquote", "hr", "br", "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "colgroup", "col", "code", "pre",
]);

/** The public page's sanitiser removes these anyway, so dropping them loses nothing. */
const IGNORED = new Set(["script", "style", "head", "meta", "link", "title", "noscript"]);

function parse(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
}

/**
 * The HTML as the editor should receive it.
 *
 * An anchor on a wrapper (`<section id="fiyatlar"><h2>…`) moves onto the
 * section's first heading, which the editor keeps, so a hand-written table of
 * contents still resolves. `h1` becomes `h2`, as the public sanitiser does.
 */
export function prepareForEditor(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const body = parse(html);
  body.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (!WRAPPERS.has(tag)) return;
    const heading = el.querySelector<HTMLElement>("h1, h2, h3, h4");
    if (heading && !heading.id) {
      heading.id = el.id;
      el.removeAttribute("id");
    }
  });
  body.querySelectorAll("h1").forEach((h1) => {
    const h2 = h1.ownerDocument.createElement("h2");
    for (const attr of Array.from(h1.attributes)) h2.setAttribute(attr.name, attr.value);
    h2.innerHTML = h1.innerHTML;
    h1.replaceWith(h2);
  });
  return body.innerHTML;
}

/**
 * What converting this HTML to the visual editor would lose, as sentences for
 * the writer. Empty when nothing of consequence goes.
 */
export function editorLosses(html: string): string[] {
  if (!html.trim() || typeof DOMParser === "undefined") return [];
  const body = parse(prepareForEditor(html));

  let styled = 0;
  let anchors = 0;
  const unsupported = new Map<string, number>();

  body.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (IGNORED.has(tag) || el.closest(Array.from(IGNORED).join(","))) return;

    if (!WRAPPERS.has(tag) && !SUPPORTED.has(tag)) {
      unsupported.set(tag, (unsupported.get(tag) ?? 0) + 1);
      return;
    }
    if (el.hasAttribute("style") || el.hasAttribute("class")) styled += 1;
    if (el.id && !/^h[1-4]$/.test(tag) && tag !== "p") anchors += 1;
  });

  const out: string[] = [];
  if (styled) out.push(`${styled} öğedeki özel biçim (style / class): renkli kutular, hizalamalar, özel yazı stilleri`);
  if (anchors) out.push(`${anchors} bağlantı çapası (id), bu bölümlere giden "#" linkler çalışmaz`);
  for (const [tag, n] of unsupported) out.push(`${n} adet <${tag}> öğesi`);
  return out;
}
