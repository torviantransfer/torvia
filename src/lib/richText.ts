import sanitizeHtml from "sanitize-html";

/**
 * The allow-list for body copy an admin types into the panel.
 *
 * Shared by the blog article page and by admin-created landing pages, for the
 * same reason `seoOverrides` is shared by the three tables that back a page:
 * two copies of a sanitiser drift, and the half that drifts is the half that
 * stops blocking something.
 *
 * `transformTags` demotes `h1` because both callers already render the page's
 * own `<h1>` above the body. Several imported posts open with their own, which
 * gave those pages two top-level headings that disagreed with each other —
 * /en/blog/flughafen-transfer-antalya shipped a German heading under an
 * English one. Demoting it here means no editor can reintroduce that by
 * pasting, in either surface.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "iframe", "video", "source"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height", "loading", "class"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
    video: ["src", "controls", "width", "height"],
    source: ["src", "type"],
    "*": ["class", "id", "style"],
  },
  allowedIframeHostnames: ["www.youtube.com", "www.google.com"],
  transformTags: { h1: "h2" },
};

/** Sanitised HTML, safe to hand to `dangerouslySetInnerHTML`. */
export function sanitizeArticleHtml(raw: string): string {
  return sanitizeHtml(raw ?? "", OPTIONS);
}

/**
 * Tailwind rules that style the sanitised HTML on a landing page.
 *
 * Held next to the sanitiser so the tags the allow-list permits and the tags
 * that actually get styled cannot fall out of step — a table that is allowed
 * but unstyled renders as unreadable stacked text.
 *
 * Deliberately not shared with the blog article page, which keeps its own
 * variant: its `h2` carries a blue rule down the left edge that belongs to the
 * article layout, not to landing copy. The sanitiser is shared because two
 * copies of an allow-list is a security problem; two type scales is a design
 * decision.
 */
export const ARTICLE_PROSE_CLASSES = `
  max-w-none text-[16.5px] leading-[1.8] text-gray-600
  [&>*:first-child]:mt-0
  [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight
  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
  [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-2
  [&_p]:text-gray-600 [&_p]:leading-[1.85] [&_p]:mb-5
  [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-gray-600 [&_li]:leading-relaxed [&_li]:ps-5 [&_li]:relative [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:start-0 [&_li]:before:top-[10px] [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-blue-500
  [&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol_li]:marker:text-blue-600 [&_ol_li]:marker:font-semibold
  [&_blockquote]:my-6 [&_blockquote]:ps-5 [&_blockquote]:border-s-2 [&_blockquote]:border-blue-500/40 [&_blockquote]:text-gray-500 [&_blockquote]:italic
  [&_strong]:text-gray-900 [&_b]:text-gray-900
  [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
  [&_hr]:my-10 [&_hr]:border-gray-200
  [&_table]:w-full [&_table]:my-6 [&_table]:text-sm [&_th]:text-start [&_th]:text-gray-900 [&_th]:pb-3 [&_th]:border-b [&_th]:border-gray-200 [&_td]:text-gray-600 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-gray-200
  [&_img]:rounded-xl [&_img]:my-6
`;

/**
 * Word count of a rendered HTML fragment, for reading time and for the SEO
 * score's thin-content check.
 */
export function htmlWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}
