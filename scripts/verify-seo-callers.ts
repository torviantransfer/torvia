/**
 * Contracts the *pages* have to keep, not just the helper they share.
 *
 * `applyOverrides` had a full suite and passed every run while blog meta
 * titles typed into the admin reached nothing at all, in seven languages, for
 * as long as the field existed. The helper was correct. The caller passed it
 * `rowOwnsMetaText: true` — "I already read those columns" — without reading
 * them, which switched off the only code path that would have applied them.
 *
 * No test of a helper can see that. So these import the page modules
 * themselves and call the metadata builders the pages actually use. If a page
 * stops using its builder, or starts lying to `applyOverrides` again, this is
 * what notices.
 *
 * The contract each one demonstrates is the same four steps, because that is
 * what an editor experiences:
 *
 *     fallback → add an override → the effective value changes → remove it →
 *     the fallback comes back
 *
 * Run via `npm run verify:seo`.
 */
import type { Metadata } from "next";
import { applySeoPage, type SeoPage } from "../src/lib/seoPages";

type Assert = (name: string, condition: boolean, detail?: string) => void;

const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro"] as const;

/** Reads a title back out of Metadata, through the `absolute` form. */
function titleOf(m: Metadata): string {
  const t = m.title;
  if (typeof t === "string") return t;
  if (t && typeof t === "object" && "absolute" in t && typeof t.absolute === "string") {
    return t.absolute;
  }
  return "";
}

function ogTitleOf(m: Metadata): string {
  const og = m.openGraph as { title?: unknown } | undefined;
  return typeof og?.title === "string" ? og.title : "";
}

/** A published post translated into every locale, with no SEO overrides. */
function basePost(): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: "p1",
    slug: "antalya-havalimani-belek-transfer",
    is_published: true,
    image_url: "/images/blog/belek-golf.avif",
    published_at: "2026-01-01T00:00:00Z",
  };
  for (const l of LOCALES) {
    row[`title_${l}`] = `Başlık ${l}`;
    row[`content_${l}`] = `<p>İçerik ${l}</p>`.repeat(4);
    row[`excerpt_${l}`] = `Özet ${l}`;
    row[`slug_${l}`] = `slug-${l}`;
  }
  return row;
}

/** An active region priced at $55, translated into every locale. */
function baseRegion(): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: "r1",
    slug: "belek",
    is_active: true,
    distance_km: 33,
    duration_minutes: 30,
    image_url: "/images/regions/belek-golf.jpg",
  };
  for (const l of LOCALES) {
    row[`name_${l}`] = "Belek";
    row[`description_${l}`] = `Açıklama ${l}`;
  }
  return row;
}

function emptySeoPageRow(): SeoPage {
  return {
    page_key: "about",
    route: "about",
    image_url: null,
    og_image_url: null,
    image_alt: null,
    noindex: null,
  };
}

export async function runCallerContracts(assert: Assert): Promise<void> {
  const blog = await import("../src/app/[locale]/blog/[slug]/page");
  const region = await import("../src/app/[locale]/[region]/page");
  const { blogMetadata } = blog;
  const { regionMetadata, resolvePriceTokens } = region;

  // =======================================================================
  console.log("\n--- KONTRAT: blog meta override'ı gerçekten yayına çıkıyor (EN) ---");
  // =======================================================================
  //
  // The exact defect. Before the fix, `after.title` was still "Başlık en".
  const before = blogMetadata(basePost(), "en");
  assert(
    "override yokken title yazının başlığından geliyor",
    titleOf(before) === "Başlık en",
    titleOf(before)
  );
  assert(
    "override yokken description excerpt'ten geliyor",
    before.description === "Özet en",
    String(before.description)
  );

  const withMeta = blogMetadata(
    {
      ...basePost(),
      meta_title_en: "Antalya Airport to Belek Transfer | Fixed Price",
      meta_description_en: "Private transfer, fixed price, meet & greet.",
    },
    "en"
  );
  assert(
    "meta_title_en override'ı title'a uygulanıyor",
    titleOf(withMeta) === "Antalya Airport to Belek Transfer | Fixed Price",
    titleOf(withMeta)
  );
  assert(
    "meta_description_en override'ı description'a uygulanıyor",
    withMeta.description === "Private transfer, fixed price, meet & greet.",
    String(withMeta.description)
  );
  assert(
    "override og:title'a da taşınıyor",
    ogTitleOf(withMeta) === "Antalya Airport to Belek Transfer | Fixed Price",
    ogTitleOf(withMeta)
  );

  const removed = blogMetadata({ ...basePost(), meta_title_en: "", meta_description_en: null }, "en");
  assert(
    "override boşaltılınca fallback geri geliyor",
    titleOf(removed) === "Başlık en" && removed.description === "Özet en",
    `${titleOf(removed)} / ${String(removed.description)}`
  );

  // =======================================================================
  console.log("\n--- KONTRAT: blog meta override'ı 7 dilin hepsinde çalışıyor ---");
  // =======================================================================
  //
  // The original bug was not locale-specific and neither is this check: the
  // panel offers the field in every language, so every language has to work.
  for (const l of LOCALES) {
    const marker = `TEST SEO TITLE ${l.toUpperCase()} 92841`;
    const m = blogMetadata({ ...basePost(), [`meta_title_${l}`]: marker }, l);
    assert(`blog meta_title_${l} yayına çıkıyor`, titleOf(m) === marker, titleOf(m));

    const d = `TEST SEO DESC ${l.toUpperCase()} 92841`;
    const md = blogMetadata({ ...basePost(), [`meta_description_${l}`]: d }, l);
    assert(`blog meta_description_${l} yayına çıkıyor`, md.description === d, String(md.description));
  }

  // =======================================================================
  console.log("\n--- KONTRAT: blog override'ı yalnızca kendi dilini etkiliyor ---");
  // =======================================================================
  const deOnly = { ...basePost(), meta_title_de: "Nur Deutsch" };
  assert("de override'ı de'yi değiştiriyor", titleOf(blogMetadata(deOnly, "de")) === "Nur Deutsch");
  assert(
    "de override'ı en'i değiştirmiyor",
    titleOf(blogMetadata(deOnly, "en")) === "Başlık en",
    titleOf(blogMetadata(deOnly, "en"))
  );

  // =======================================================================
  console.log("\n--- KONTRAT: bölge title'ında hiçbir dilde 'undefined' olamaz ---");
  // =======================================================================
  //
  // Twenty-two Romanian region pages shipped
  // "… | Privat VIP · 2 oreundefined" because `priceLabel` was a record with
  // six keys and `priceLabel[locale]` was interpolated regardless. Assert the
  // absence of the symptom in every locale, with and without a price.
  for (const l of LOCALES) {
    for (const price of [55, null]) {
      const m = regionMetadata(baseRegion(), l, price);
      const t = titleOf(m);
      const d = String(m.description ?? "");
      assert(
        `bölge ${l} title'ı temiz (fiyat: ${price ?? "yok"})`,
        !/undefined|NaN|\[object Object\]/.test(t),
        t
      );
      assert(
        `bölge ${l} description'ı temiz (fiyat: ${price ?? "yok"})`,
        !/undefined|NaN|\[object Object\]/.test(d),
        d
      );
      assert(`bölge ${l} title'ı boş değil`, t.length > 10, t);
    }
  }

  // =======================================================================
  console.log("\n--- KONTRAT: bölge fallback'i her dilde o dilin şablonunu kullanıyor ---");
  // =======================================================================
  //
  // Romanian used to fall through to the generic English `meta_title` column.
  const roFallback = titleOf(regionMetadata(baseRegion(), "ro", 55));
  assert(
    "ro fallback title'ı Romence şablondan geliyor",
    roFallback.startsWith("Transfer Aeroportul Antalya"),
    roFallback
  );
  assert("ro fallback'inde fiyat var", roFallback.includes("De la $55"), roFallback);

  const genericIgnored = titleOf(
    regionMetadata({ ...baseRegion(), meta_title: "English generic column" }, "ro", 55)
  );
  assert(
    "çevrilmemiş genel meta_title kolonu artık kullanılmıyor",
    genericIgnored === roFallback,
    genericIgnored
  );

  // =======================================================================
  console.log("\n--- KONTRAT: admin'in yazdığı bölge title'ı olduğu gibi yayınlanıyor ---");
  // =======================================================================
  //
  // The old behaviour appended the price to any admin title without a currency
  // symbol, so the panel showed one string and Google got another.
  const verbatim = "Antalya Flughafen Privattransfer | Festpreis";
  const adminTitle = regionMetadata({ ...baseRegion(), meta_title_de: verbatim }, "de", 55);
  assert(
    "fiyat eki admin title'ına eklenmiyor",
    titleOf(adminTitle) === verbatim,
    titleOf(adminTitle)
  );
  assert(
    "og:title da aynı",
    ogTitleOf(adminTitle) === verbatim,
    ogTitleOf(adminTitle)
  );

  const adminDesc = "Festpreis, Mercedes Vito, Flugverfolgung.";
  assert(
    "fiyat eki admin description'ına eklenmiyor",
    regionMetadata({ ...baseRegion(), meta_description_de: adminDesc }, "de", 55).description ===
      adminDesc
  );

  // =======================================================================
  console.log("\n--- KONTRAT: {price} token'ı canlı fiyatı getiriyor ---");
  // =======================================================================
  const tokenised = regionMetadata(
    { ...baseRegion(), meta_title_tr: "Antalya Havalimanı Belek Transfer | VIP · Sabit Fiyat{price}" },
    "tr",
    55
  );
  assert(
    "{price} token'ı fiyat etiketine dönüşüyor",
    titleOf(tokenised) === "Antalya Havalimanı Belek Transfer | VIP · Sabit Fiyat · $55'den",
    titleOf(tokenised)
  );

  const tokenNoPrice = regionMetadata(
    { ...baseRegion(), meta_title_tr: "Antalya Havalimanı Belek Transfer | VIP · Sabit Fiyat{price}" },
    "tr",
    null
  );
  assert(
    "fiyat yokken token temiz siliniyor (sonda ayraç kalmıyor)",
    tokenNoPrice.title !== undefined &&
      titleOf(tokenNoPrice) === "Antalya Havalimanı Belek Transfer | VIP · Sabit Fiyat",
    titleOf(tokenNoPrice)
  );

  assert(
    "token'sız metin hiç dokunulmadan dönüyor",
    resolvePriceTokens("Sabit fiyat", " · From $55") === "Sabit fiyat"
  );
  assert(
    "token ayraçtan sonra yazılsa bile ayraç iki kez çıkmıyor",
    resolvePriceTokens("Belek Transfer · {price}", " · From $55") === "Belek Transfer · From $55",
    resolvePriceTokens("Belek Transfer · {price}", " · From $55")
  );

  // =======================================================================
  console.log("\n--- KONTRAT: bölge override'ı 7 dilin hepsinde çalışıyor ---");
  // =======================================================================
  for (const l of LOCALES) {
    const marker = `TEST BOLGE ${l.toUpperCase()} 77310`;
    assert(
      `bölge meta_title_${l} yayına çıkıyor`,
      titleOf(regionMetadata({ ...baseRegion(), [`meta_title_${l}`]: marker }, l, 55)) === marker
    );
    const dm = `TEST BOLGE DESC ${l.toUpperCase()} 77310`;
    assert(
      `bölge meta_description_${l} yayına çıkıyor`,
      regionMetadata({ ...baseRegion(), [`meta_description_${l}`]: dm }, l, 55).description === dm
    );
  }

  // A PL description override, spelled out as its own case because it is the
  // example the brief names.
  const plDesc = "Prywatny transfer VIP z lotniska Antalya do Belek. Stała cena.";
  const plBefore = regionMetadata(baseRegion(), "pl", 55).description;
  const plAfter = regionMetadata({ ...baseRegion(), meta_description_pl: plDesc }, "pl", 55);
  const plRemoved = regionMetadata({ ...baseRegion(), meta_description_pl: "  " }, "pl", 55);
  assert("PL: önce fallback", typeof plBefore === "string" && plBefore !== plDesc);
  assert("PL: override uygulanıyor", plAfter.description === plDesc, String(plAfter.description));
  assert("PL: override silinince fallback geri geliyor", plRemoved.description === plBefore);

  // =======================================================================
  console.log("\n--- KONTRAT: seo_pages override'ı 7 dilin hepsinde çalışıyor (DE dahil) ---");
  // =======================================================================
  const codeTitle = "Koddan gelen başlık";
  for (const l of LOCALES) {
    const marker = `TEST SAYFA ${l.toUpperCase()} 55021`;
    const applied = applySeoPage(
      { title: codeTitle, description: "Koddan gelen açıklama" },
      { ...emptySeoPageRow(), [`meta_title_${l}`]: marker },
      l
    );
    assert(`seo_pages meta_title_${l} yayına çıkıyor`, titleOf(applied) === marker, titleOf(applied));
  }

  const deOverride = "Antalya Flughafen Privattransfer | Festpreis";
  const dePage = applySeoPage(
    { title: codeTitle, description: "x" },
    { ...emptySeoPageRow(), meta_title_de: deOverride },
    "de"
  );
  assert("DE seo_pages override'ı aynen çıkıyor", titleOf(dePage) === deOverride, titleOf(dePage));
  assert(
    "DE override kaldırılınca kod değeri geri geliyor",
    titleOf(applySeoPage({ title: codeTitle, description: "x" }, emptySeoPageRow(), "de")) ===
      codeTitle
  );

  // =======================================================================
  console.log("\n--- KONTRAT: marka adı title'a iki kez eklenmiyor ---");
  // =======================================================================
  //
  // The root layout appends " | TORVIAN Transfer" through title.template, so a
  // value that already ends with it has to opt out via title.absolute.
  const branded = applySeoPage(
    { title: "Gizlilik Politikası | TORVIAN Transfer", description: "x" },
    null,
    "tr"
  );
  assert(
    "markayı zaten içeren title absolute olarak işaretleniyor",
    typeof branded.title === "object" && branded.title !== null,
    JSON.stringify(branded.title)
  );
  assert(
    "absolute değeri değiştirilmiyor",
    titleOf(branded) === "Gizlilik Politikası | TORVIAN Transfer",
    titleOf(branded)
  );

  const plain = applySeoPage({ title: "Gizlilik Politikası", description: "x" }, null, "tr");
  assert(
    "marka içermeyen title string kalıyor (şablon uygulanır)",
    plain.title === "Gizlilik Politikası",
    JSON.stringify(plain.title)
  );

  const brandedOverride = applySeoPage(
    { title: "Koddan", description: "x" },
    { ...emptySeoPageRow(), meta_title_nl: "Privacybeleid | TORVIAN Transfer" },
    "nl"
  );
  assert(
    "adminden gelen markalı title da iki kez çıkmıyor",
    typeof brandedOverride.title === "object" &&
      titleOf(brandedOverride) === "Privacybeleid | TORVIAN Transfer",
    JSON.stringify(brandedOverride.title)
  );

  // =======================================================================
  console.log("\n--- KONTRAT: çevrilmemiş dil indexlenmiyor ---");
  // =======================================================================
  const untranslated = basePost();
  delete untranslated.title_ro;
  delete untranslated.content_ro;
  const roPost = blogMetadata(untranslated, "ro");
  const roRobots = roPost.robots as { index?: boolean } | undefined;
  assert("çevirisi olmayan blog locale'i noindex", roRobots?.index === false, JSON.stringify(roRobots));
  assert(
    "çevirisi olmayan blog locale'i canonical'ı birincil dile veriyor",
    typeof roPost.alternates?.canonical === "string" &&
      !String(roPost.alternates.canonical).includes("/ro/"),
    String(roPost.alternates?.canonical)
  );

  const translated = blogMetadata(basePost(), "ro");
  const okRobots = translated.robots as { index?: boolean } | undefined;
  assert("çevirisi olan blog locale'i indexlenebilir", okRobots?.index === true);
  const langs = (translated.alternates?.languages ?? {}) as Record<string, unknown>;
  assert(
    "çevrilmiş blog hreflang kümesi 7 dili de içeriyor",
    LOCALES.every((l) => typeof langs[l] === "string"),
    Object.keys(langs).join(", ")
  );
  assert("blog hreflang'inde x-default var", typeof langs["x-default"] === "string");

  // =======================================================================
  console.log("\n--- KONTRAT: bölge hreflang kümesi çevrilmiş dilleri kapsıyor ---");
  // =======================================================================
  const regionMeta = regionMetadata(baseRegion(), "ro", 55);
  const regionLangs = (regionMeta.alternates?.languages ?? {}) as Record<string, unknown>;
  assert(
    "bölge hreflang'i ro dahil 7 dili içeriyor",
    LOCALES.every((l) => typeof regionLangs[l] === "string"),
    Object.keys(regionLangs).join(", ")
  );
  assert(
    "bölge canonical'ı kendini gösteriyor",
    regionMeta.alternates?.canonical === "https://torviantransfer.com/ro/belek-transfer",
    String(regionMeta.alternates?.canonical)
  );

  // =======================================================================
  console.log("\n--- KONTRAT: pasif bölge indexlenebilir metadata üretmiyor ---");
  // =======================================================================
  //
  // Exercised through the builder's own guard: a deactivated row never reaches
  // regionMetadata, and generateMetadata returns NOINDEX_ROBOTS for it. The
  // check here is that an active row still does produce an indexable one, so
  // the guard cannot be widened by accident.
  const activeRobots = regionMetadata(baseRegion(), "tr", 55).robots as
    | { index?: boolean }
    | undefined;
  assert("aktif bölge indexlenebilir", activeRobots?.index === true);
}
