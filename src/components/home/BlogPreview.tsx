import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import Image from "next/image";
import { localizedBlogSlug } from "@/lib/seo";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * The three most recent posts, on the homepage.
 *
 * This has never rendered. It selected `slug, title, content` — columns that
 * do not exist on `blog_posts`, which has carried `title_<locale>` and
 * `content_<locale>` since migration 001. PostgREST answered with an error,
 * the destructured `data` was null, and the `if (!posts) return null` below
 * turned that into an empty section on all seven homepages rather than into
 * anything anyone would notice. The homepage lost its only contextual links
 * into the blog, in every language, silently.
 *
 * Reading the per-locale columns is the fix; using `localizedBlogSlug` for the
 * href is the other half, because a post's URL differs per language and
 * `/nl/blog/<turkish-slug>` 301s rather than resolving.
 */

const headings: Record<Locale, string> = {
  tr: "Blog & Rehber",
  en: "Blog & Guides",
  de: "Blog & Reiseführer",
  pl: "Blog i Przewodniki",
  ru: "Блог и Гиды",
  nl: "Blog & Reisgidsen",
  ro: "Blog și ghiduri",
};

const subheadings: Record<Locale, string> = {
  tr: "Antalya seyahat ipuçları, transfer rehberleri ve bölge keşifleri",
  en: "Antalya travel tips, transfer guides and destination discoveries",
  de: "Antalya Reisetipps, Transferführer und Reiseziel-Entdeckungen",
  pl: "Porady podróżnicze, przewodniki transferowe i odkrywanie regionów",
  ru: "Советы путешественникам, гиды по трансферам и открытие регионов",
  nl: "Reistips voor Antalya, transfergidsen en bestemmingen om te ontdekken",
  ro: "Sfaturi de călătorie în Antalya, ghiduri de transfer și destinații",
};

const viewAll: Record<Locale, string> = {
  tr: "Tüm Yazılar",
  en: "All Posts",
  de: "Alle Beiträge",
  pl: "Wszystkie wpisy",
  ru: "Все статьи",
  nl: "Alle artikelen",
  ro: "Toate articolele",
};

/**
 * Written out rather than joined from an array: supabase-js parses the select
 * string at the type level, and a value it cannot see as a literal collapses
 * the row type to a parser error.
 */
const SELECT =
  "slug, image_url, published_at, " +
  "title_tr, title_en, title_de, title_pl, title_ru, title_nl, title_ro, " +
  "content_tr, content_en, content_de, content_pl, content_ru, content_nl, content_ro, " +
  "slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl, slug_ro";

export default async function BlogPreview({ locale }: { locale: string }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const supabase = createAdminClient();
  const loc = (locale in headings ? locale : defaultLocale) as Locale;

  const { data, error } = await supabase
    .from("blog_posts")
    .select(SELECT)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(6);
  const posts = (data ?? []) as unknown as Record<string, unknown>[];

  if (error) {
    // The silent `return null` above is what hid this component's absence for
    // months. A query failure is not the same as "no posts", so say so.
    console.error("[BlogPreview] blog_posts okunamadı:", error.message);
    return null;
  }
  if (!posts || posts.length === 0) return null;

  // Only posts translated into this language. Showing a Turkish headline on
  // the Dutch homepage is worse than showing one card fewer.
  const translated = posts
    .filter((row) => {
      const title = (row[`title_${loc}`] as string | null) ?? "";
      const content = (row[`content_${loc}`] as string | null) ?? "";
      return title.trim().length > 0 && content.trim().length > 0;
    })
    .slice(0, 3);

  if (translated.length === 0) return null;

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-3">
              {headings[loc]}
            </h2>
            <p className="text-gray-500 text-lg">{subheadings[loc]}</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors group shrink-0"
          >
            {viewAll[loc]}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {translated.map((row) => {
            const slug = String(row.slug ?? "");
            const imageUrl = (row.image_url as string | null) ?? null;
            const publishedAt = (row.published_at as string | null) ?? null;
            const title = (row[`title_${loc}`] as string) ?? "";
            const body = (row[`content_${loc}`] as string) ?? "";
            const excerpt = body.replace(/<[^>]*>/g, "").substring(0, 120).trim();
            const date = publishedAt
              ? new Date(publishedAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "";

            return (
              <Link
                key={slug}
                href={`/blog/${localizedBlogSlug(row, loc)}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: "#F5F5F7",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-emerald-500/10">
                      <BookOpen size={32} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Calendar size={12} />
                      <span>{date}</span>
                    </div>
                  )}
                  <h3 className="text-gray-900 font-semibold text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {title}
                  </h3>
                  {excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                      {excerpt}...
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
