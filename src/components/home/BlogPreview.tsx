import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import Image from "next/image";

type Locale = "tr" | "en" | "de" | "pl" | "ru";

const headings: Record<Locale, string> = {
  tr: "Blog & Rehber",
  en: "Blog & Guides",
  de: "Blog & Reiseführer",
  pl: "Blog i Przewodniki",
  ru: "Блог и Гиды",
};

const subheadings: Record<Locale, string> = {
  tr: "Antalya seyahat ipuçları, transfer rehberleri ve bölge keşifleri",
  en: "Antalya travel tips, transfer guides and destination discoveries",
  de: "Antalya Reisetipps, Transferführer und Reiseziel-Entdeckungen",
  pl: "Porady podróżnicze, przewodniki transferowe i odkrywanie regionów",
  ru: "Советы путешественникам, гиды по трансферам и открытие регионов",
};

const viewAll: Record<Locale, string> = {
  tr: "Tüm Yazılar",
  en: "All Posts",
  de: "Alle Beiträge",
  pl: "Wszystkie wpisy",
  ru: "Все статьи",
};

export default async function BlogPreview({ locale }: { locale: string }) {
  const supabase = createAdminClient();
  const loc = (locale as Locale) || "en";

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, content, image_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#000" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3">
              {headings[loc]}
            </h2>
            <p className="text-gray-400 text-lg">{subheadings[loc]}</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors group shrink-0"
          >
            {viewAll[loc]}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((post) => {
            const excerpt = post.content
              ?.replace(/<[^>]*>/g, "")
              .substring(0, 120)
              .trim();
            const date = post.published_at
              ? new Date(post.published_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "";

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {post.image_url ? (
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-blue-500/20">
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
                  <h3 className="text-white font-semibold text-base mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                    {post.title}
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
