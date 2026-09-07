/**
 * Builds keyword-map, content-audit and opportunity-map from the measured
 * inventory plus an explicit decision table.
 *
 * The decision for 400+ URLs cannot honestly be typed out one by one, and
 * pretending otherwise would produce a document nobody could check. So the
 * shape is: a stated rule per page type, then a list of named exceptions where
 * the evidence says otherwise. Every exception carries its evidence.
 */
const fs = require("fs");
const audit = JSON.parse(fs.readFileSync("docs/seo-runtime-audit.json", "utf8"));
const LOC = ["tr", "en", "de", "pl", "ru", "nl", "ro"];
const MARKET = {
  tr: "Türkiye",
  en: "UK + international English",
  de: "Germany",
  pl: "Poland",
  ru: "Russia / Ukraine / Kazakhstan (Russian-speaking)",
  nl: "Netherlands",
  ro: "Romania",
};

// ---------------------------------------------------------------------------
// Cluster ownership. One owner per primary keyword cluster, per locale.
// ---------------------------------------------------------------------------
const CLUSTER = {
  home: {
    id: "brand-hub",
    intent: "commercial investigation",
    primary: { tr: "antalya havalimanı transfer", en: "antalya airport transfer", de: "antalya flughafen transfer", pl: "transfer z lotniska antalya", ru: "трансфер из аэропорта анталии", nl: "transfer luchthaven antalya", ro: "transfer aeroport antalya" },
  },
  "antalya-airport-transfer": {
    id: "airport-transfer-service",
    intent: "transactional",
    primary: { tr: "antalya havalimanı transfer sabit fiyat", en: "antalya airport transfer fixed price", de: "flughafen antalya transfer festpreis", pl: "transfer z lotniska antalya stała cena", ru: "трансфер аэропорт анталия фиксированная цена", nl: "antalya luchthaven transfer vaste prijs", ro: "transfer aeroportul antalya preț fix" },
  },
  "vip-transfer-antalya": {
    id: "vip-premium-vehicle",
    intent: "commercial investigation",
    primary: { tr: "antalya vip transfer", en: "antalya vip transfer", de: "vip transfer antalya", pl: "vip transfer antalya", ru: "vip трансфер анталья", nl: "vip transfer antalya", ro: "transfer vip antalya" },
  },
  "hotel-transfer-antalya": {
    id: "airport-to-hotel",
    intent: "transactional",
    primary: { tr: "antalya havalimanı otel transferi", en: "antalya airport hotel transfer", de: "hotel transfer antalya flughafen", pl: "transfer do hotelu z lotniska antalya", ru: "трансфер в отель из аэропорта анталии", nl: "hoteltransfer luchthaven antalya", ro: "transfer hotel aeroportul antalya" },
  },
  "lara-beach-transfer": { id: "dest-lara-beach", intent: "transactional", primary: {} },
  "land-of-legends-transfer": { id: "dest-land-of-legends", intent: "transactional", primary: {} },
  booking: { id: "booking-action", intent: "transactional", primary: {} },
  regions: { id: "destination-list", intent: "commercial investigation", primary: {} },
  blog: { id: "blog-index", intent: "informational", primary: {} },
  about: { id: "brand-trust", intent: "navigational", primary: {} },
  contact: { id: "brand-support", intent: "navigational", primary: {} },
  faq: { id: "support-questions", intent: "informational", primary: {} },
};

const LEGAL = new Set(["privacy", "terms", "cookies", "kvkk", "cancellation"]);

// ---------------------------------------------------------------------------
// Named exceptions. Everything not listed here takes the rule for its type.
// ---------------------------------------------------------------------------
const EXCEPTIONS = {
  "/de/vip-transfer-antalya": {
    action: "MAJOR",
    risk: "LOW",
    growth: "GROWTH-002",
    why:
      "seo_pages.meta_title_de override serves the generic head term 'Flughafentransfer Antalya', which /de, /de/antalya-airport-transfer and two German blog posts already claim. The page gave up the VIP intent it exists for. Override cleared in migration 074 so the differentiated code fallback returns.",
  },
  "/en/antalya-airport-transfer": {
    action: "MINOR",
    risk: "LOW",
    growth: "GROWTH-003",
    why:
      "seo_pages.meta_title_en override ('| Private & VIP Transfer') repeats the homepage's claim with fewer distinguishing words. Cleared in 074; the code fallback names fixed price, meet & greet and online booking — the three things every ranking result on the live English SERP leads with.",
  },
  "/nl/kvkk": {
    action: "MINOR",
    risk: "LOW",
    growth: "GROWTH-004",
    why:
      "meta_title_nl override duplicates /nl/privacy's title and contradicts the page's own H1 ('Beleid gegevensbescherming'). Cleared in 074. Finding SEO-019 from the first audit.",
  },
  "/nl": {
    action: "KEEP",
    risk: "—",
    growth: "GROWTH-005",
    why:
      "Investigated and deliberately not changed. Dutch competitors title themselves with 'luchthaven' almost uniformly, which argued for retitling — but Google's completions for the Netherlands say Dutch searchers type the English form: 'antalya airport transfer' returns eight completions, 'antalya luchthaven transfer' returns one. A change made on competitor evidence was reverted on user evidence. The existing title already carries both the head term and 'privétransfer', the richest Dutch commercial phrase.",
  },
  "/en/blog/flughafen-transfer-antalya": {
    action: "MINOR",
    risk: "LOW",
    growth: "GROWTH-006",
    why:
      "title_en reads 'Flughafen Transfer Antalya' while the article's own opening heading reads 'Antalya Airport Transfer'. Body is 1,258 words of English. Data typo, corrected in migration 075.",
  },
};

// Clusters where two or more URLs in the same locale target the same intent and
// the evidence is not sufficient to choose a survivor without GSC.
const CANNIBAL = [
  {
    id: "CANN-01",
    cluster: "airport-to-hotel (blog layer)",
    locales: ["tr", "en", "de", "pl", "ru", "nl", "ro"],
    urls: ["blog: '…Private VIP Direct to Your Resort'", "blog: '…How It Works, Prices & Tips'", "landing: /{loc}/hotel-transfer-antalya"],
    evidence:
      "Both blog posts cover: what a hotel transfer is, prices, comparison to shuttle/taxi, how to book. Same sections, same entities, ~500-730 words each. Their titles are near-identical to each other and to the landing page's.",
    decision: "CONSOLIDATE — gated",
    note:
      "Not applied. Choosing a survivor without query data is exactly what migration 030 did when it unpublished the stronger Alanya post and had to be undone by 037. Requires the GSC query in 09-content-migrations.md first.",
  },
  {
    id: "CANN-02",
    cluster: "airport-transfer guide (blog layer)",
    locales: ["en", "de"],
    urls: ["blog: flughafen-transfer-antalya (1,258w)", "blog: antalya-airport-transfer-guide (562w)", "landing: /{loc}/antalya-airport-transfer"],
    evidence:
      "Two 'complete guide to the airport transfer' posts per locale plus the landing page. The 1,258-word one is the site's strongest English article on the topic and out-words the landing page it competes with.",
    decision: "CONSOLIDATE — gated",
    note: "Same reasoning as CANN-01. Title language fixed now (GROWTH-006); consolidation needs GSC.",
  },
  {
    id: "CANN-03",
    cluster: "alanya travel time",
    locales: ["tr", "en", "de", "pl", "ru", "nl"],
    urls: ["blog: …-alanya-transfer-kac-saat", "blog: …-alanya-transfer-suresi"],
    evidence: "Identified and resolved in the first audit (SEO-008).",
    decision: "RESOLVED — migration 071 pending",
    note: "Redirects already shipped in src/lib/redirects.ts; the unpublish is migration 071.",
  },
  {
    id: "CANN-04",
    cluster: "vip / premium (DE)",
    locales: ["de"],
    urls: ["/de", "/de/antalya-airport-transfer", "/de/vip-transfer-antalya", "/de/blog/flughafentransfer-antalya", "/de/blog/antalya-flughafentransfer-ratgeber"],
    evidence: "Five German URLs led with 'Flughafentransfer Antalya' / 'Antalya Flughafen Transfer'.",
    decision: "RESOLVED",
    note: "The VIP landing's override is cleared in 074, returning it to its own intent. The two blog posts remain in CANN-02.",
  },
  {
    id: "CANN-05",
    cluster: "lara / kundu destination",
    locales: LOC,
    urls: ["/{loc}/lara-beach-transfer (landing)", "/{loc}/kundu-lara-transfer (region)"],
    evidence:
      "The landing page and the region page target the same destination; title similarity 0.67. Both are indexable and in the sitemap.",
    decision: "KEEP BOTH — intent split",
    note:
      "Deliberate. The region page is the priced route page inside the destination set; the landing page is the standalone Lara Beach entry point and carries its own inline copy in seven languages. They are not merged because merging costs one of two indexed URLs on a destination that has ranking history, and the intent difference (route pricing vs destination landing) is real.",
  },
  {
    id: "CANN-06",
    cluster: "destination list (TR)",
    locales: ["tr"],
    urls: ["/tr", "/tr/regions", "/tr/booking"],
    evidence: "All three titled with the same destination list 'Belek, Side, Alanya, Kemer'; similarity 0.60-0.86.",
    decision: "KEEP — monitor",
    note:
      "These are the three highest-linked Turkish pages and Turkey is the only market where the site earns meaningful clicks (61 of 138). Retitling them without query data risks the one locale that works. Recorded, not acted on.",
  },
];

// ---------------------------------------------------------------------------
function decide(r) {
  const ex = EXCEPTIONS[r.path];
  if (ex) return ex;
  if (r.kind === "legal") return { action: "NO SEO CHANGE", risk: "—", why: "Legal page. Indexable, but not competing for anything; padding it with SEO copy is explicitly out of scope." };
  if (r.kind === "utility" || r.kind === "private") return { action: "NO SEO CHANGE", risk: "—", why: "noindex by design (first audit, SEO-004 / SEO-007)." };
  if (r.kind === "region") return { action: "KEEP", risk: "—", why: "Route-level page with destination-specific distance, duration, price, hotels and FAQ. Several rank in the top 10 (pl/beldibi 3.6, tr/sehirici 3.1, tr/side 4.3); the first audit's price-token work already restored admin control of the title. No evidence supports touching these." };
  if (r.kind === "blog-post") return { action: "KEEP", risk: "—", why: "Informational/comparison content. Comparison queries are the site's best-performing cluster (0.48% CTR vs 0.20% informational) and its best positions. Left alone except where a language or duplication defect is named." };
  return { action: "KEEP", risk: "—", why: "No evidence of an intent or keyword problem." };
}

function clusterFor(r) {
  if (r.kind === "region") {
    const dest = r.route.replace(/-transfer$/, "");
    return { id: "dest-" + dest, intent: "transactional", primary: {} };
  }
  if (r.kind === "blog-post") return { id: "blog-" + r.route.replace("blog/", ""), intent: "informational", primary: {} };
  if (LEGAL.has(r.route)) return { id: "legal-" + r.route, intent: "none", primary: {} };
  return CLUSTER[r.route === "" ? "home" : r.route] || { id: "other-" + (r.route || "home"), intent: "n/a", primary: {} };
}

const rows = [];
for (const r of audit.results) {
  if (r.finalStatus !== 200) continue;
  if (r.kind === "private") continue;
  const c = clusterFor(r);
  const d = decide(r);
  rows.push({
    locale: r.locale,
    market: MARKET[r.locale],
    url: r.path,
    pageType: r.kind,
    existingTitle: (r.title || "").replace(/ \| TORVIAN Transfer$/, ""),
    existingH1: r.h1s[0] || "",
    primaryIntent: c.intent,
    primaryKeyword: c.primary[r.locale] || "",
    keywordCluster: c.id,
    words: r.wordCount,
    inboundLinks: r.inboundLinks,
    inSitemap: r.inSitemap,
    indexable: !/noindex/i.test(r.robots || ""),
    gsc: "NO DATA (access blocked)",
    action: d.action,
    risk: d.risk,
    growthId: d.growth || "",
    rationale: d.why,
  });
}
rows.sort((a, b) => (a.locale === b.locale ? a.url.localeCompare(b.url) : LOC.indexOf(a.locale) - LOC.indexOf(b.locale)));

// --- Opportunity scoring ---------------------------------------------------
// Deliberately not a volume score: without GSC there is no volume to score.
// What is measurable here is commercial proximity, current internal support,
// whether the SERP is winnable in that language, and implementation risk.
const SERP_DIFFICULTY = { en: 9, de: 7, ru: 7, tr: 6, nl: 6, pl: 4, ro: 3 };
const opportunities = [];
for (const r of rows) {
  if (!r.indexable || r.pageType === "legal" || r.pageType === "utility") continue;
  const commercial = { transactional: 10, "commercial investigation": 8, informational: 4, navigational: 2, none: 0, "n/a": 2 }[r.primaryIntent] ?? 2;
  const winnable = 10 - SERP_DIFFICULTY[r.locale];
  const support = Math.min(10, r.inboundLinks / 7);
  const depth = Math.min(10, r.words / 120);
  const acted = r.action === "KEEP" || r.action === "NO SEO CHANGE" ? 0 : 6;
  const score = Math.round(commercial * 3 + winnable * 3 + support * 1.5 + depth * 1.5 + acted * 1);
  opportunities.push({ url: r.url, locale: r.locale, cluster: r.keywordCluster, intent: r.primaryIntent, score, commercial, winnable, support: +support.toFixed(1), depth: +depth.toFixed(1), action: r.action });
}
opportunities.sort((a, b) => b.score - a.score);

fs.writeFileSync("docs/seo-growth/keyword-map.json", JSON.stringify({ generated: new Date().toISOString(), source: "docs/seo-runtime-audit.json + live SERP research", gscAccess: "BLOCKED", rows }, null, 1));
fs.writeFileSync("docs/seo-growth/content-audit.json", JSON.stringify({ generated: new Date().toISOString(), rows: rows.map((r) => ({ url: r.url, locale: r.locale, pageType: r.pageType, words: r.words, inboundLinks: r.inboundLinks, action: r.action, risk: r.risk, growthId: r.growthId, rationale: r.rationale })) }, null, 1));
fs.writeFileSync("docs/seo-growth/opportunity-map.json", JSON.stringify({ generated: new Date().toISOString(), method: "commercial intent x SERP winnability x internal support x content depth; no volume component because GSC access is blocked", serpDifficulty: SERP_DIFFICULTY, opportunities }, null, 1));
fs.writeFileSync("docs/seo-growth/_cannibalization.json", JSON.stringify(CANNIBAL, null, 1));

const counts = {};
for (const r of rows) counts[r.action] = (counts[r.action] || 0) + 1;
console.log("mapped URLs:", rows.length);
console.log("actions:", JSON.stringify(counts));
console.log("cannibalization clusters:", CANNIBAL.length);
console.log("top opportunities:");
for (const o of opportunities.slice(0, 12)) console.log("  " + String(o.score).padStart(3) + "  " + o.url + "  (" + o.cluster + ")");
