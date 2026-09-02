/**
 * Proves the contract the SEO admin panel rests on: a row with no overrides
 * set produces metadata byte-identical to what the page produced before it.
 *
 * Worth keeping runnable rather than checking once by hand, because the two
 * regressions it caught are both easy to reintroduce:
 *
 *  - assigning `next.robots` unconditionally, which puts an explicit
 *    `robots: undefined` on pages that declare none. Next.js reads that as
 *    "unset this field" rather than "inherit", which is exactly how the region
 *    and blog pages lost `max-image-preview: large` and their SERP thumbnails.
 *  - rebuilding `openGraph.images` to change the URL and dropping the `alt`
 *    the page had already set.
 *
 * Run with:  npm run verify:seo
 */
import { applyOverrides } from "../src/lib/seoOverrides";
import type { Metadata } from "next";
import { computeChanges } from "../src/components/admin/seo/SaveDiffDialog";
import { buildAuditRows } from "../src/lib/seoAuditLog";
import { fieldSource } from "../src/components/admin/seo/EffectiveField";
import { detectBlocked, parseInspection } from "../src/lib/seoInspect";
import { auditPage } from "../src/lib/seoAudit";

let failures = 0;
function check(name: string, before: Metadata, row: Record<string, unknown>) {
  const after = applyOverrides(before, { row, locale: "en" });
  const a = JSON.stringify(before);
  const b = JSON.stringify(after);
  const same = a === b;
  // An explicit `robots: undefined` key is the trap that started all of this,
  // so its presence is asserted separately from deep equality.
  const robotsKeyAdded = !("robots" in before) && "robots" in after;
  const ok = same && !robotsKeyAdded;
  if (!ok) failures++;
  console.log(`${ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  ${name}`);
  if (!ok) {
    console.log("   önce:", a);
    console.log("   sonra:", b);
    if (robotsKeyAdded) console.log("   \x1b[31mrobots anahtarı eklendi (undefined)\x1b[0m");
  }
}

// A seo_pages row as migration 057/058 seeds it: labels only, no copy.
const emptySeoPage = {
  id: "1", page_key: "about", page_type: "static", route: "about", label: "Hakkımızda",
  meta_title_en: null, meta_description_en: null, canonical_url_en: null,
  og_title_en: null, og_description_en: null, og_image_url: null,
  twitter_title_en: null, twitter_description_en: null, twitter_image_url: null,
  twitter_card: null, image_url: null, image_alt: null, noindex: null, nofollow: null,
};

check("statik sayfa — robots yok, override yok", {
  title: "Hakkımızda | TORVIAN",
  description: "Bir açıklama",
  alternates: { canonical: "https://torviantransfer.com/en/about" },
  openGraph: { title: "Hakkımızda", images: [{ url: "https://torviantransfer.com/images/og-default.jpg", width: 1200, height: 630, alt: "Hakkımızda" }] },
}, emptySeoPage);

check("landing — twitter da var", {
  title: "VIP Transfer",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/vip-transfer-antalya", languages: { en: "x" } },
  openGraph: { title: "VIP", description: "d", images: [{ url: "https://x/i.jpg", width: 1200, height: 630, alt: "VIP" }] },
  twitter: { card: "summary_large_image", title: "VIP", description: "d", images: ["https://x/i.jpg"] },
}, emptySeoPage);

// A region row after 057's backfill: image_url IS populated from the code map.
check("bölge — image_url backfill dolu, alt korunmalı", {
  title: "Belek Transfer",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/belek-transfer" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { title: "Belek", description: "d", images: [{ url: "https://torviantransfer.com/images/regions/belek-golf.jpg", width: 1200, height: 630, alt: "Belek Transfer" }] },
  twitter: { card: "summary_large_image", title: "Belek", description: "d", images: ["https://torviantransfer.com/images/regions/belek-golf.jpg"] },
} as Metadata, {
  id: "2", slug: "belek", image_url: "/images/regions/belek-golf.jpg",
  og_image_url: null, image_alt: null, noindex: null, nofollow: null,
  meta_title_en: null, meta_description_en: null, canonical_url_en: null,
});

// A blog post: image_url populated, excerpt-driven description.
check("blog — image_url dolu, alt korunmalı", {
  title: "Side Ancient City",
  description: "d",
  alternates: { canonical: "https://torviantransfer.com/en/blog/side" },
  robots: { index: true, follow: true },
  openGraph: { title: "Side", description: "d", images: [{ url: "https://torviantransfer.com/images/blog/side-temple.avif", width: 1200, height: 630, alt: "Side Ancient City" }] },
  twitter: { card: "summary_large_image", title: "Side", description: "d", images: ["https://torviantransfer.com/images/blog/side-temple.avif"] },
} as Metadata, {
  id: "3", slug: "side", image_url: "https://torviantransfer.com/images/blog/side-temple.avif",
  og_image_url: null, image_alt: null, noindex: null, nofollow: null,
});

console.log("\n--- override GİRİLDİĞİNDE değişmeli ---");
const withOverride = applyOverrides(
  { title: "Eski", description: "eski", alternates: { canonical: "https://torviantransfer.com/en/about" } },
  { row: { ...emptySeoPage, meta_title_en: "Yeni başlık", noindex: true }, locale: "en" }
);
const changed = withOverride.title === "Yeni başlık" && withOverride.robots !== undefined;
console.log(`${changed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  override uygulanıyor`);
if (!changed) failures++;

function assert(name: string, condition: boolean, detail?: string) {
  if (!condition) failures++;
  console.log(`${condition ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  ${name}`);
  if (!condition && detail) console.log(`   ${detail}`);
}

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: panelde alan boş görünmemeli, runtime değeri görünmeli ---");

// The field's source decides what the editor sees. "runtime" means the panel
// renders the live value rather than an empty input, which is the whole point.
assert(
  "override boş + runtime dolu -> source 'runtime'",
  fieldSource("", "Antalya Airport Transfer | TORVIAN") === "runtime"
);
assert("override dolu -> source 'admin'", fieldSource("Elle yazılmış", "Canlı") === "admin");
assert("ikisi de boş -> source 'none' (gerçekten eksik)", fieldSource("", null) === "none");
assert("sadece boşluk içeren override runtime sayılmalı", fieldSource("   ", "Canlı değer") === "runtime");

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: save diff sadece gerçekten değişen alanları göstermeli ---");

const original = {
  id: "1",
  meta_title_en: "Eski başlık",
  meta_description_en: null,
  canonical_url_en: null,
  noindex: null,
  image_url: "/images/a.jpg",
};

assert("hiçbir şey değişmediyse diff boş", computeChanges(original, { ...original }).length === 0);

const oneChange = computeChanges(original, { ...original, meta_title_en: "Yeni başlık" });
assert("tek alan değişti -> 1 satır", oneChange.length === 1, JSON.stringify(oneChange));
assert(
  "diff eski ve yeni değeri taşıyor",
  oneChange[0]?.before === "Eski başlık" && oneChange[0]?.after === "Yeni başlık"
);

// null and "" are different states: one means "no override", the other is a
// value an editor typed and then cleared. Collapsing them would hide a reset.
const resetChange = computeChanges(
  { ...original, meta_title_en: "Bir şey" },
  { ...original, meta_title_en: "" }
);
assert("override silme (reset) diff'te görünüyor", resetChange.length === 1);
assert("reset sonrası yeni değer boş -> fallback devreye girer", resetChange[0]?.after === "");

assert(
  "noindex kritik olarak işaretleniyor",
  Boolean(computeChanges(original, { ...original, noindex: true })[0]?.critical)
);
assert(
  "canonical kritik olarak işaretleniyor",
  Boolean(
    computeChanges(original, {
      ...original,
      canonical_url_en: "https://torviantransfer.com/en/x",
    })[0]?.critical
  )
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: reset override sonrası fallback devreye girmeli ---");

const afterReset = applyOverrides(
  { title: "Sayfanın kendi başlığı", description: "Sayfanın açıklaması" },
  { row: { ...emptySeoPage, meta_title_en: "" }, locale: "en" }
);
assert(
  "boş string override yok sayılıyor, sayfa başlığı korunuyor",
  afterReset.title === "Sayfanın kendi başlığı"
);
assert(
  "null override yok sayılıyor",
  applyOverrides({ title: "Sayfanın kendi başlığı" }, {
    row: { ...emptySeoPage, meta_title_en: null },
    locale: "en",
  }).title === "Sayfanın kendi başlığı"
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: canonical override boşken otomatik canonical korunmalı ---");

const languages = {
  en: "https://torviantransfer.com/en/belek-transfer",
  tr: "https://torviantransfer.com/tr/belek-transfer",
};
const autoCanonical = applyOverrides(
  {
    title: "x",
    alternates: { canonical: "https://torviantransfer.com/en/belek-transfer", languages },
  },
  { row: { ...emptySeoPage, canonical_url_en: null }, locale: "en" }
);
assert(
  "canonical dokunulmadan aynı kalıyor",
  autoCanonical.alternates?.canonical === "https://torviantransfer.com/en/belek-transfer"
);
assert(
  "hreflang kümesi (languages) dokunulmadan aynı kalıyor",
  JSON.stringify(autoCanonical.alternates?.languages) === JSON.stringify(languages)
);

// A canonical override must never be able to take the page off-site.
assert(
  "site dışı canonical reddediliyor",
  applyOverrides({ title: "x", alternates: { canonical: "https://torviantransfer.com/en/a" } }, {
    row: { ...emptySeoPage, canonical_url_en: "https://rakip-site.com/x" },
    locale: "en",
  }).alternates?.canonical === "https://torviantransfer.com/en/a"
);
assert(
  "protokolsüz/bozuk canonical site içine sabitleniyor",
  applyOverrides({ title: "x", alternates: { canonical: "https://torviantransfer.com/en/a" } }, {
    row: { ...emptySeoPage, canonical_url_en: "//rakip-site.com/x" },
    locale: "en",
  }).alternates?.canonical === "https://torviantransfer.com/en/a"
);
assert(
  "trailing slash temizleniyor",
  applyOverrides({ title: "x", alternates: { canonical: "https://torviantransfer.com/en/a" } }, {
    row: { ...emptySeoPage, canonical_url_en: "https://torviantransfer.com/en/b/" },
    locale: "en",
  }).alternates?.canonical === "https://torviantransfer.com/en/b"
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: OG image override alt metnini düşürmemeli ---");

function ogImagesOf(m: Metadata): { url?: string; alt?: string }[] {
  const og = m.openGraph;
  if (!og || !("images" in og) || !Array.isArray(og.images)) return [];
  return og.images as { url?: string; alt?: string }[];
}

const newOgImage = ogImagesOf(
  applyOverrides(
    {
      title: "x",
      openGraph: {
        title: "Belek",
        images: [
          {
            url: "https://torviantransfer.com/images/regions/belek-golf.jpg",
            width: 1200,
            height: 630,
            alt: "Belek golf sahası",
          },
        ],
      },
    } as Metadata,
    { row: { ...emptySeoPage, og_image_url: "/images/regions/yeni.jpg" }, locale: "en" }
  )
);
assert(
  "yeni görsel uygulandı",
  newOgImage[0]?.url === "https://torviantransfer.com/images/regions/yeni.jpg",
  JSON.stringify(newOgImage)
);
assert(
  "sayfanın alt metni korundu",
  newOgImage[0]?.alt === "Belek golf sahası",
  JSON.stringify(newOgImage)
);

const ownAlt = ogImagesOf(
  applyOverrides(
    {
      title: "x",
      openGraph: { images: [{ url: "https://x/a.jpg", width: 1200, height: 630, alt: "Eski alt" }] },
    } as Metadata,
    { row: { ...emptySeoPage, og_image_url: "/b.jpg", image_alt: "Yeni alt" }, locale: "en" }
  )
);
assert("image_alt girilmişse o kazanıyor", ownAlt[0]?.alt === "Yeni alt", JSON.stringify(ownAlt));

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: robots/googlebot metadata kaybolmamalı ---");

// The bug this guards against: assigning `next.robots` unconditionally puts an
// explicit `robots: undefined` on pages that declare none, and Next.js reads
// that as "unset", stripping the root layout's max-image-preview:large.
const noRobotsPage = applyOverrides({ title: "x" }, { row: emptySeoPage, locale: "en" });
assert(
  "robots bildirmeyen sayfaya robots anahtarı eklenmiyor",
  !("robots" in noRobotsPage),
  `anahtarlar: ${Object.keys(noRobotsPage).join(", ")}`
);

const pageRobots = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large" },
};
assert(
  "sayfanın kendi robots direktifi aynen korunuyor",
  JSON.stringify(
    applyOverrides({ title: "x", robots: pageRobots } as Metadata, {
      row: emptySeoPage,
      locale: "en",
    }).robots
  ) === JSON.stringify(pageRobots)
);

const forced = applyOverrides({ title: "x", robots: pageRobots } as Metadata, {
  row: { ...emptySeoPage, nofollow: true },
  locale: "en",
}).robots as { index?: boolean; follow?: boolean } | undefined;
assert(
  "sadece nofollow override edilince index korunuyor",
  forced?.index === true && forced?.follow === false,
  JSON.stringify(forced)
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: audit log eski ve yeni değeri doğru kaydetmeli ---");

const rows = buildAuditRows({
  table: "seo_pages",
  recordId: "abc",
  before: { id: "abc", label: "Hakkımızda", meta_title_en: "Eski", noindex: null },
  changes: { meta_title_en: "Yeni", noindex: true, updated_at: "2026-09-02" },
  after: { id: "abc", label: "Hakkımızda" },
  changedBy: "admin@torviantransfer.com",
});
assert("değişen 2 alan loglandı (updated_at hariç)", rows.length === 2, JSON.stringify(rows));

const titleRow = rows.find((r) => r.field === "meta_title_en");
assert("eski değer doğru", titleRow?.old_value === "Eski");
assert("yeni değer doğru", titleRow?.new_value === "Yeni");
assert("değiştiren kişi kaydedildi", titleRow?.changed_by === "admin@torviantransfer.com");
assert("kayıt etiketi tutuldu", titleRow?.record_label === "Hakkımızda");

const noindexRow = rows.find((r) => r.field === "noindex");
assert(
  "boolean null -> true doğru kaydedildi",
  noindexRow?.old_value === null && noindexRow?.new_value === "true",
  JSON.stringify(noindexRow)
);

assert(
  "değişmeyen alan loglanmıyor",
  buildAuditRows({
    table: "seo_pages",
    recordId: "abc",
    before: { meta_title_en: "Aynı" },
    changes: { meta_title_en: "Aynı" },
    changedBy: "a@b.c",
  }).length === 0
);
assert(
  "SEO dışı tablo loglanmıyor",
  buildAuditRows({
    table: "drivers",
    recordId: "1",
    before: { name: "a" },
    changes: { name: "b" },
    changedBy: "a@b.c",
  }).length === 0
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: inspector koruma sayfasını SEO verisi sanmamalı ---");

// A verbatim-shaped Vercel Deployment Protection page. Perfectly valid HTML
// with its own title, canonical and og:title -- which is exactly why parsing
// it naively surfaced `Title: Login – Vercel` in the admin.
const VERCEL_LOGIN_HTML = `<!DOCTYPE html><html lang="en"><head>
<title>Login – Vercel</title>
<meta name="description" content="Log in to your Vercel account" />
<link rel="canonical" href="https://vercel.com/login" />
<meta property="og:title" content="Protected Deployment – Vercel" />
<meta property="og:image" content="https://vercel.com/og.png" />
<meta name="twitter:card" content="summary" />
</head><body><main><h1>Log in to Vercel</h1></main></body></html>`;

const loginBlocked = detectBlocked(
  "https://torvia-git-branch.vercel.app/tr/antalya-airport-transfer",
  "https://torvia-git-branch.vercel.app/tr/antalya-airport-transfer",
  200,
  VERCEL_LOGIN_HTML
);
assert("Vercel login HTML'i koruma sayfası olarak tespit ediliyor", loginBlocked !== null);
assert(
  "hata mesajı istenen metni veriyor",
  loginBlocked?.message.includes("protected Vercel deployment") === true,
  loginBlocked?.message
);

assert(
  "vercel.com'a yönlendirme tespit ediliyor",
  detectBlocked(
    "https://torvia-git-branch.vercel.app/tr/x",
    "https://vercel.com/login?next=%2Ftr%2Fx",
    200,
    "<html><head><title>Login</title></head></html>"
  )?.kind === "vercel-protection"
);

assert(
  "HTTP 401 koruma olarak tespit ediliyor",
  detectBlocked("https://x.vercel.app/tr/a", "https://x.vercel.app/tr/a", 401, "")?.kind ===
    "auth-required"
);
assert(
  "HTTP 403 koruma olarak tespit ediliyor",
  detectBlocked("https://x.vercel.app/tr/a", "https://x.vercel.app/tr/a", 403, "")?.kind ===
    "auth-required"
);

// The gate must not fire on a real page. A false positive here hides working
// SEO from the panel, which is the opposite failure but just as damaging.
const REAL_PAGE_HTML = `<!DOCTYPE html><html lang="tr"><head>
<title>Antalya Havalimanı Transfer | Sabit Fiyat, Karşılama, Online Rezervasyon</title>
<meta name="description" content="Özel Antalya Havalimanı transferi." />
<link rel="canonical" href="https://torviantransfer.com/tr/antalya-airport-transfer" />
<meta property="og:title" content="Antalya Havalimanı Transfer" />
</head><body><main><h1>Antalya Havalimanı Transfer</h1></main></body></html>`;

assert(
  "gerçek sayfa koruma sanılmıyor",
  detectBlocked(
    "https://torviantransfer.com/tr/antalya-airport-transfer",
    "https://torviantransfer.com/tr/antalya-airport-transfer",
    200,
    REAL_PAGE_HTML
  ) === null
);

// A same-host redirect is legitimate: region slugs normalise and blog slugs
// localise, and refusing those would break the panel for real pages.
assert(
  "aynı host içindeki yönlendirme engellenmiyor",
  detectBlocked(
    "https://torviantransfer.com/tr/belek",
    "https://torviantransfer.com/tr/belek-transfer",
    200,
    REAL_PAGE_HTML
  ) === null
);

// Parsing the login page in isolation still yields its own tags -- that is
// what `parseInspection` is for. The guarantee is that `inspectPage` never
// reaches it, so the two are asserted separately.
const parsedLogin = parseInspection("https://x.vercel.app/tr/a", 200, VERCEL_LOGIN_HTML);
assert(
  "parser tek başına login sayfasını okuyabiliyor (guard ayrı katman)",
  parsedLogin.title === "Login – Vercel"
);

// The panel's own rule: a blocked reading must not produce a wall of
// "missing" findings about a page that was never fetched.
const blockedInspection = {
  ...parsedLogin,
  blocked: loginBlocked!,
  title: null,
  description: null,
  canonical: null,
  h1s: [],
  ogTitle: null,
  ogImage: null,
  alternates: [],
  schemas: [],
  images: [],
};
const blockedFindings = auditPage(blockedInspection, {
  route: "antalya-airport-transfer",
  locale: "tr",
  pageType: "landing",
  shouldIndex: true,
});
assert("engellenen okuma tek bir hata üretiyor", blockedFindings.length === 1, JSON.stringify(blockedFindings.map((f) => f.id)));
assert("o hata 'blocked' olarak işaretli", blockedFindings[0]?.id === "blocked");
assert(
  "'title-missing' gibi yanlış alarm üretilmiyor",
  !blockedFindings.some((f) => f.id.includes("missing"))
);

// The field-level rule: unreadable is not the same as empty.
assert(
  "okunamayan alan 'değer yok' sayılmıyor",
  fieldSource("", null) === "none" && fieldSource("", "Login – Vercel") === "runtime"
);

console.log(
  `
${failures === 0 ? "[32mTÜM KONTRATLAR GEÇTİ[0m" : `[31m${failures} KONTRAT BAŞARISIZ[0m`}`
);
process.exit(failures === 0 ? 0 : 1);
