import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, ChevronDown, Clock, List, MapPin } from "lucide-react";
import type { ArticleOutline } from "@/lib/articleOutline";

/**
 * A blog post, laid out.
 *
 * Kept apart from `[locale]/blog/[slug]/page.tsx`, which finds the post,
 * redirects to its canonical slug, builds the schema and picks the related
 * posts — the same split as the region page.
 *
 * Blog traffic arrives with a question ("does Uber work in Antalya?"), not to
 * book. So the page answers first: the short answer sits above the article,
 * the outline and the halfway booking card only appear on articles long
 * enough to need them (see articleOutline), and on a phone the booking bar
 * stays out of the way until the reader has started scrolling.
 *
 * Same visual language as the rest of the public site — iOS blue on white,
 * Apple's greys, hairlines rather than shadows.
 */

export interface BlogPostViewProps {
  locale: string;
  title: string;
  /** Only a real excerpt written in this language — never a fallback. */
  excerpt: string | null;
  coverImage: string | null;
  coverAlt: string;
  publishedAt: string | null;
  updatedAt: string | null;
  readingTime: number;
  outline: ArticleOutline;
  /** The route the article is about, when it has one. */
  region: { name: string; href: string } | null;
  /** Rendered through PriceTag so the currency switcher applies. */
  price: ReactNode | null;
  bookHref: string;
  related: { title: string; href: string; image: string | null; excerpt: string }[];
  regions: { name: string; href: string; durationMinutes: number | null }[];
  /** Admin-created landing pages published in this language. */
  landings: { name: string; href: string }[];
  /** Hotels in the post's region (Bölgeler → Sayfa içeriği). */
  hotels: string[];
  /** A named person, set in the blog editor. Null shows no byline. */
  author: { name: string; role: string | null } | null;
  /** The category's label in this language. */
  category: string | null;
}

/* The keyword landing pages that live in code, labelled with the footer
   strings that already exist in every language. */
const CODE_LANDINGS = [
  { href: "/antalya-airport-transfer", key: "linkAirportTransfer" },
  { href: "/vip-transfer-antalya", key: "linkVipTransfer" },
  { href: "/hotel-transfer-antalya", key: "linkHotelTransfer" },
  { href: "/lara-beach-transfer", key: "linkLaraBeach" },
] as const;

const HAIRLINE = "1px solid rgba(0,0,0,0.06)";
const CTA =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC]";

/*
 * Typography for the admin-written body. Written against the elements the
 * blog editor produces, not a generic prose plugin, so nothing here styles
 * markup the posts do not contain.
 */
const PROSE = [
  "min-w-0 max-w-[70ch] text-[16.5px] leading-[1.8] text-gray-700",
  "[&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:scroll-mt-28 [&_h2]:text-balance [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-gray-900 lg:[&_h2]:text-[26px]",
  "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:scroll-mt-28 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-gray-900",
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:font-semibold [&_h4]:text-gray-900",
  "[&_p]:mb-5",
  // The editor wraps list items and table cells in paragraphs.
  "[&_li_p]:m-0 [&_td_p]:m-0 [&_th_p]:m-0",
  "[&_ul]:my-5 [&_ul]:grid [&_ul]:gap-2.5",
  "[&_ul>li]:relative [&_ul>li]:ps-5 [&_ul>li]:before:absolute [&_ul>li]:before:start-0 [&_ul>li]:before:top-[0.72em] [&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-[#007AFF] [&_ul>li]:before:content-['']",
  "[&_ol]:my-5 [&_ol]:grid [&_ol]:list-decimal [&_ol]:gap-2.5 [&_ol]:ps-5 [&_ol>li]:marker:font-semibold [&_ol>li]:marker:text-[#007AFF]",
  "[&_strong]:font-semibold [&_strong]:text-gray-900 [&_b]:font-semibold [&_b]:text-gray-900",
  "[&_a]:font-medium [&_a]:text-[#007AFF] [&_a]:underline [&_a]:decoration-[#007AFF]/30 [&_a]:underline-offset-[3px] hover:[&_a]:decoration-[#007AFF]",
  "[&_blockquote]:my-6 [&_blockquote]:border-s-[3px] [&_blockquote]:border-[#007AFF]/30 [&_blockquote]:ps-5 [&_blockquote]:text-gray-600",
  "[&_hr]:my-10 [&_hr]:border-gray-200",
  "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl",
  // A table cannot shrink to a phone. articleOutline wraps each one in a box
  // that scrolls sideways on its own, so the page never does; the table keeps
  // a floor width so three columns are not squeezed into unreadable strips.
  "[&_.article-table]:my-6 [&_.article-table]:overflow-x-auto [&_.article-table]:rounded-2xl [&_.article-table]:bg-white [&_.article-table]:[border:1px_solid_rgba(0,0,0,0.08)]",
  "[&_table]:w-full [&_table]:min-w-[460px] [&_table]:border-collapse [&_table]:text-[14.5px] [&_table]:leading-snug",
  "[&_th]:whitespace-nowrap [&_th]:bg-[#F5F5F7] [&_th]:px-4 [&_th]:py-3 [&_th]:text-start [&_th]:font-semibold [&_th]:text-gray-900",
  "[&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:[border-top:1px_solid_rgba(0,0,0,0.06)]",
].join(" ");

export default async function BlogPostView({
  locale,
  title,
  excerpt,
  coverImage,
  coverAlt,
  publishedAt,
  updatedAt,
  readingTime,
  outline,
  region,
  price,
  bookHref,
  related,
  regions,
  landings,
  hotels,
  author,
  category,
}: BlogPostViewProps) {
  const t = await getTranslations({ locale, namespace: "blog" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const rd = await getTranslations({ locale, namespace: "regionDetail" });
  const ft = await getTranslations({ locale, namespace: "footer" });

  const serviceLinks = [
    ...CODE_LANDINGS.map((l) => ({ name: ft(l.key), href: l.href })),
    ...landings,
  ];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

  /* Show "Updated" only when it means something: a save the same day as
     publishing is not an update a reader cares about. */
  const updated =
    updatedAt && publishedAt && new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 86_400_000;
  const shownDate = updated ? updatedAt : publishedAt;

  const { before, after, headings, faq, faqSeparated, showToc } = outline;
  const tocItems = faqSeparated && faq.length > 0 ? [...headings, { id: "sss", text: t("faqHeading") }] : headings;

  const heading = region ? t("ctaHeadingRegion", { name: region.name }) : t("ctaHeadingDefault");
  const sub = region ? t("ctaSubRegion", { name: region.name }) : t("ctaSubDefault");

  const toc = (
    <ol className="grid gap-1">
      {tocItems.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className="block rounded-lg px-3 py-1.5 text-[14px] leading-snug text-gray-600 transition-colors hover:bg-[#F5F5F7] hover:text-gray-900"
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  /** The booking card, used halfway through and again at the end. */
  const bookingCard = (
    <aside
      className="my-10 grid gap-5 rounded-3xl bg-[#F5F5F7] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7"
      aria-label={t("cardKicker")}
    >
      <div className="min-w-0">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#007AFF]">{t("cardKicker")}</div>
        <p className="mt-2 text-balance text-[19px] font-bold leading-snug tracking-tight text-gray-900 sm:text-[21px]">
          {heading}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500">{sub}</p>
        {region && (
          <Link
            href={region.href}
            className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#007AFF] hover:underline"
          >
            <MapPin size={13} aria-hidden="true" />
            {t("ctaRegionDetails", { name: region.name })}
          </Link>
        )}
      </div>
      <div className="grid gap-2.5 sm:min-w-[210px] sm:justify-items-end sm:text-end">
        {price && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{t("priceFrom")}</div>
            <div className="text-[30px] font-extrabold leading-tight tracking-tight text-gray-900">{price}</div>
            <div className="text-[12.5px] text-gray-500">{t("priceNote")}</div>
          </div>
        )}
        <Link href={bookHref} className={`${CTA} w-full sm:w-auto`}>
          {t("ctaButton")}
          <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header style={{ background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)" }}>
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 lg:px-6 lg:pb-10 lg:pt-10">
          <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
            <Link href="/" className="transition-colors hover:text-gray-900">{nav("home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="transition-colors hover:text-gray-900">{nav("blog")}</Link>
          </nav>

          <div className="max-w-3xl">
            {(region || category) && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {region && (
                  <Link
                    href={region.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/[0.08] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#0062CC] transition-colors hover:bg-[#007AFF]/[0.14]"
                  >
                    <MapPin size={11} aria-hidden="true" />
                    {region.name}
                  </Link>
                )}
                {category && (
                  <span className="inline-flex items-center rounded-full bg-black/[0.04] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-600">
                    {category}
                  </span>
                )}
              </div>
            )}

            <h1 className={`${region || category ? "mt-4" : "mt-6"} text-balance break-words text-[28px] font-bold leading-[1.18] tracking-tight text-gray-900 sm:text-[36px] lg:text-[44px] lg:leading-[1.12]`}>
              {title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] text-gray-500">
              {author && (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex size-7 items-center justify-center rounded-full bg-[#007AFF]/[0.1] text-[11.5px] font-bold text-[#0062CC]"
                    >
                      {author.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w.charAt(0).toLocaleUpperCase(locale))
                        .join("")}
                    </span>
                    <span>
                      <span className="font-medium text-gray-900">{author.name}</span>
                      {author.role && <span> · {author.role}</span>}
                    </span>
                  </span>
                  <span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
                </>
              )}
              {shownDate && (
                <span>
                  {updated ? `${t("updatedOn")} ` : ""}
                  <time dateTime={new Date(shownDate).toISOString()}>{fmt(shownDate)}</time>
                </span>
              )}
              {shownDate && <span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" className="text-gray-400" />
                {t("readingTime", { minutes: readingTime })}
              </span>
            </div>

            {excerpt && (
              <div className="mt-7 rounded-2xl bg-white p-5" style={{ border: HAIRLINE }}>
                <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#007AFF]">{t("summary")}</div>
                <p className="mt-2 text-[16.5px] leading-relaxed text-gray-800">{excerpt}</p>
              </div>
            )}
          </div>
        </div>

        {coverImage && (
          <div className="mx-auto max-w-6xl lg:px-6">
            <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[2/1] lg:rounded-3xl">
              <Image
                src={coverImage}
                alt={coverAlt}
                fill
                priority
                sizes="(max-width: 1152px) 100vw, 1104px"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Article and sidebar ──────────────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6 lg:py-14">
        <div className="min-w-0">
          {showToc && (
            <details className="group mb-8 rounded-2xl bg-white lg:hidden" style={{ border: HAIRLINE }}>
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <List size={16} aria-hidden="true" className="text-[#007AFF]" />
                <span className="text-[14.5px] font-semibold text-gray-900">{t("onThisPage")}</span>
                <span className="text-[13px] text-gray-400">· {t("sectionsCount", { count: tocItems.length })}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="ms-auto text-gray-400 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-2 pb-3">{toc}</div>
            </details>
          )}

          <div
            className={`${PROSE} ${excerpt ? "" : "[&>p:first-of-type]:text-[18px] [&>p:first-of-type]:leading-[1.7] [&>p:first-of-type]:text-gray-800"}`}
            dangerouslySetInnerHTML={{ __html: before }}
          />

          {after && (
            <>
              {bookingCard}
              <div className={PROSE} dangerouslySetInnerHTML={{ __html: after }} />
            </>
          )}

          {faqSeparated && faq.length > 0 && (
            <section id="sss" className="mt-12 scroll-mt-28">
              <h2 className="text-balance text-[22px] font-bold leading-snug tracking-tight text-gray-900 lg:text-[26px]">
                {t("faqHeading")}
              </h2>
              <div className="mt-5 grid max-w-[70ch] gap-2.5">
                {faq.map((f, i) => (
                  <details key={f.question} open={i === 0} className="group rounded-2xl bg-white" style={{ border: HAIRLINE }}>
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[15.5px] font-semibold leading-snug text-gray-900 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 break-words">{f.question}</span>
                      <ChevronDown
                        size={17}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="px-5 pb-4 text-[15px] leading-relaxed text-gray-600">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {bookingCard}
        </div>

        {/* Desktop only: outline, price and related posts beside the reader.
            The column is sticky but not boxed in: on a short article it is the
            taller of the two and simply scrolls with the page; on a long one the
            outline and the price stay in view and the related posts arrive as
            the article ends. The outline caps its own height so a long one
            cannot push the price card below the window. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-4">
            {showToc && (
              <nav
                aria-label={t("onThisPage")}
                className="max-h-[45vh] overflow-y-auto overscroll-contain rounded-3xl bg-white p-3 [scrollbar-width:thin]"
                style={{ border: HAIRLINE }}
              >
                <div className="px-3 pb-2 pt-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  {t("onThisPage")}
                </div>
                {toc}
              </nav>
            )}

            <div className="rounded-3xl bg-[#F5F5F7] p-5">
              <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#007AFF]">{t("cardKicker")}</div>
              <p className="mt-2 text-[16px] font-bold leading-snug tracking-tight text-gray-900">
                {region ? region.name : t("airportTransfer")}
              </p>
              {price && (
                <div className="mt-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{t("priceFrom")}</div>
                  <div className="text-[28px] font-extrabold leading-tight tracking-tight text-gray-900">{price}</div>
                  <div className="text-[12.5px] text-gray-500">{t("priceNote")}</div>
                </div>
              )}
              <Link href={bookHref} className={`${CTA} mt-4 w-full`}>
                {t("ctaButton")}
                <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
              </Link>
            </div>

            {related.length > 0 && (
              <nav aria-label={t("relatedPosts")} className="mt-2 grid gap-4">
                <div className="px-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  {t("relatedPosts")}
                </div>
                {related.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="group flex flex-col overflow-hidden rounded-3xl bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
                    style={{ border: HAIRLINE }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F5F7]">
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.title}
                          fill
                          sizes="300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-balance text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-[#007AFF]">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{p.excerpt}</p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-[#007AFF]">
                        {t("readMore")}
                        <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </aside>
      </div>

      {/* ── Related posts ────────────────────────────────────────────── */}
      {/* On a desktop these sit in the sidebar under the price card. */}
      {related.length > 0 && (
        <section className="bg-[#FBFBFD] py-12 lg:hidden" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2 className="text-[22px] font-extrabold tracking-tight text-gray-900 lg:text-[28px]">{t("relatedPosts")}</h2>
            <ul className="mt-7 grid gap-5 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
                    style={{ border: HAIRLINE }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F5F7]">
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-balance text-[16.5px] font-semibold leading-snug text-gray-900 group-hover:text-[#007AFF]">
                        {p.title}
                      </h3>
                      {p.excerpt && <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-gray-500">{p.excerpt}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[14px] font-medium text-[#007AFF]">
                        {t("readMore")}
                        <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Transfers ────────────────────────────────────────────────── */}
      {regions.length > 0 && (
        <section className="py-12 lg:py-16" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2 className="text-[22px] font-extrabold tracking-tight text-gray-900 lg:text-[28px]">{t("popularTransfers")}</h2>
            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {regions.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex h-full flex-col rounded-2xl bg-white p-4 transition-colors hover:bg-[#F5F5F7]"
                    style={{ border: HAIRLINE }}
                  >
                    <MapPin size={15} aria-hidden="true" className="text-[#007AFF]" />
                    <span className="mt-2 break-words text-[14.5px] font-semibold leading-snug text-gray-900">{r.name}</span>
                    {r.durationMinutes ? (
                      <span className="mt-1 text-[12.5px] text-gray-500">
                        ~{r.durationMinutes} {rd("unitMin")}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>

            {/* The keyword landing pages. Each targets one search phrase, and a
                blog post is where the informational traffic that could turn
                into those searches already is. */}
            {serviceLinks.length > 0 && (
              <div className="mt-10">
                <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">{ft("servicesHeading")}</h3>
                <ul className="mt-3.5 flex flex-wrap gap-2.5">
                  {serviceLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] text-gray-700 transition-colors hover:text-[#007AFF]"
                        style={{ border: HAIRLINE }}
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hotel names only on a post tied to a region, and only that
                region's hotels. A site-wide hotel list on every article would be
                noise to a reader and a keyword list to Google. */}
            {region && hotels.length > 0 && (
              <div className="mt-10">
                <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">
                  {t("hotelsHeading", { name: region.name })}
                </h3>
                <ul className="mt-3.5 flex flex-wrap gap-2.5">
                  {hotels.map((h) => (
                    <li key={h}>
                      <Link
                        href={region.href}
                        className="inline-flex rounded-full bg-[#F5F5F7] px-4 py-2 text-[14px] text-gray-700 transition-colors hover:text-[#007AFF]"
                      >
                        {h}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
