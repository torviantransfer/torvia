/**
 * Blog categories.
 *
 * A post stores the key; the reader sees `blog.categories.<key>` in their own
 * language, and the panel shows the Turkish label here. Four, because the
 * posts fall into four kinds of question a traveller asks before booking:
 * how does this compare, how far is it, what does it cost, what should I
 * know. More categories than posts per category makes a filter useless.
 */
export const BLOG_CATEGORIES = [
  { key: "comparison", label: "Karşılaştırmalar", hint: "Uber, taksi, Havaş, araç kiralama…" },
  { key: "routes", label: "Rotalar ve mesafeler", hint: "Kaç km, kaç saat, bölge ve otel rehberleri" },
  { key: "prices", label: "Fiyatlar", hint: "Transfer fiyatları ve sabit fiyat listeleri" },
  { key: "guides", label: "Seyahat rehberi", hint: "Aileler, gece uçuşları, kış tatili…" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["key"];

export function isBlogCategory(value: unknown): value is BlogCategory {
  return BLOG_CATEGORIES.some((c) => c.key === value);
}
