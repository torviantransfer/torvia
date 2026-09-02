/**
 * SEO scoring for a single page in a single locale.
 *
 * Pure functions over plain strings — no DOM, no fetch — so the admin editor
 * can score every keystroke and a server component can score a whole list of
 * regions without rendering anything.
 *
 * The score is a weighted percentage, not a verdict. Its job is to tell an
 * editor which field to fix next, so every check carries the concrete number
 * it wants ("53/60 characters") rather than a bare pass/fail.
 *
 * Two rules govern what may be passed in, and both exist because breaking
 * them produced wrong, actively harmful advice:
 *
 * 1. Every field here is an EFFECTIVE value — the admin override when there
 *    is one, otherwise what the page actually serves. Scoring the override
 *    column alone reported "Meta başlık boş" for
 *    /tr/antalya-airport-transfer, a page that has carried a 91-character
 *    Turkish title from a hardcoded map for months. An editor acting on that
 *    would have replaced working copy to fix a problem that did not exist.
 *
 * 2. This is content optimisation, not technical SEO. A missing focus keyword
 *    is a note to the person writing the page; it is not a defect in what the
 *    site serves, because focus and secondary keywords are never emitted as
 *    tags. Nothing here is a hard failure unless the crawler-visible value is
 *    genuinely absent. Facts about the delivered HTML — a broken canonical,
 *    two H1s, an invalid schema — belong in `auditPage`, which reports
 *    error/warning/info rather than a percentage.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  /** Stable id, so the UI can key on it and tests can assert on it. */
  id: string;
  label: string;
  status: CheckStatus;
  /** Weight in the final percentage. A warn scores half its weight. */
  weight: number;
  /** What the editor should read: the measurement, or what to do about it. */
  detail: string;
  /** Which form field to focus when the editor clicks the check. */
  field?: string;
}

export interface SeoScore {
  /** 0-100, rounded. */
  percent: number;
  grade: "excellent" | "good" | "fair" | "poor";
  checks: SeoCheck[];
  passed: number;
  total: number;
}

export interface SeoInput {
  title: string;
  description: string;
  focusKeyword: string;
  keywords: string;
  /** Path after the locale segment, e.g. "belek-transfer". "" for the home page. */
  slug: string;
  /** Body copy used for the density and length checks. Optional. */
  content?: string;
  /**
   * Word count measured from the rendered page, for when the body text itself
   * is not available to the admin.
   *
   * A landing page's copy lives in its component, not in a column, so the
   * intro override is usually blank while the page carries 800 words. Without
   * this the length check called every such page thin, which is the same
   * false alarm as the title one.
   */
  contentWordCount?: number;
  h1?: string;
  imageUrl?: string;
  ogImageUrl?: string;
  imageAlt?: string;
}

/**
 * Google truncates the SERP title by pixel width, not character count, but
 * character count is what an editor can see and reason about. 50-60 is the
 * band that survives truncation for Latin scripts at Google's current widths.
 */
export const TITLE_MIN = 30;
export const TITLE_IDEAL_MIN = 50;
export const TITLE_IDEAL_MAX = 60;
export const TITLE_MAX = 65;

export const DESC_MIN = 70;
export const DESC_IDEAL_MIN = 140;
export const DESC_IDEAL_MAX = 158;
export const DESC_MAX = 165;

/**
 * Locale-aware lowercasing. Turkish maps I to a dotless i, so the default
 * toLowerCase() turns "İstanbul" into "i̇stanbul" and a keyword match against
 * "istanbul" silently fails. Normalising the two dotted/dotless pairs by hand
 * makes the comparison work in both directions.
 */
function fold(value: string): string {
  return value
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase()
    .normalize("NFC")
    .trim();
}

function contains(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  return fold(haystack).includes(fold(needle));
}

function wordCount(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ");
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * How often the focus keyword appears, as a percentage of total words.
 * Anything above ~3% reads as stuffing to a human long before it does to
 * Google, which is why the upper bound here is deliberately tight.
 */
export function keywordDensity(content: string, keyword: string): number {
  const words = wordCount(content);
  if (!words || !keyword.trim()) return 0;
  const needle = fold(keyword);
  const hay = fold(content.replace(/<[^>]*>/g, " "));
  // Count overlapping-free occurrences of the whole phrase.
  let count = 0;
  let idx = hay.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = hay.indexOf(needle, idx + needle.length);
  }
  const keywordWords = needle.split(/\s+/).filter(Boolean).length || 1;
  return (count * keywordWords * 100) / words;
}

/** Splits the comma-separated keywords field into trimmed, non-empty terms. */
export function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

interface ScoreOptions {
  /**
   * Legal and utility pages ("privacy", "terms") are not meant to rank, so
   * scoring them against a focus keyword or a body length would report
   * failures no one should act on. In "lite" mode only the title, description
   * and social image are checked.
   */
  mode?: "full" | "lite";
  /** Whether the page has body copy worth scoring at all. */
  hasContent?: boolean;
}

export function scoreSeo(input: SeoInput, options: ScoreOptions = {}): SeoScore {
  const {
    mode = "full",
    hasContent = Boolean(input.content?.trim()) || (input.contentWordCount ?? 0) > 0,
  } = options;
  const checks: SeoCheck[] = [];

  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();
  const focus = (input.focusKeyword ?? "").trim();
  const keywords = parseKeywords(input.keywords ?? "");
  const content = input.content ?? "";

  // ---- Title ------------------------------------------------------------
  if (!title) {
    checks.push({
      id: "title-present",
      label: "Meta başlık",
      status: "fail",
      weight: 20,
      // Reached only when neither an override nor the live page has a title,
      // so this really is "the page serves no title" and not "the admin has
      // not typed one".
      detail: "Meta başlık boş. Google sayfanın <h1>'ini veya rastgele bir metni kullanır.",
      field: "meta_title",
    });
  } else if (title.length < TITLE_MIN) {
    checks.push({
      id: "title-present",
      label: "Meta başlık uzunluğu",
      status: "fail",
      weight: 20,
      detail: `Meta başlık mevcut ancak çok kısa: ${title.length} karakter. ${TITLE_IDEAL_MIN}-${TITLE_IDEAL_MAX} arası hedefleyin.`,
      field: "meta_title",
    });
  } else if (title.length > TITLE_IDEAL_MAX) {
    checks.push({
      id: "title-present",
      label: "Meta başlık uzunluğu",
      status: "warn",
      weight: 20,
      detail:
        title.length > TITLE_MAX
          ? `Meta başlık mevcut ancak uzun: ${title.length} karakter. Google sonuçta sonunu keser; en fazla ${TITLE_IDEAL_MAX} önerilir.`
          : `Meta başlık mevcut ancak uzun: ${title.length} karakter. Önerilen üst sınır ${TITLE_IDEAL_MAX}; bu uzunlukta kesilme riski var.`,
      field: "meta_title",
    });
  } else if (title.length < TITLE_IDEAL_MIN) {
    checks.push({
      id: "title-present",
      label: "Meta başlık uzunluğu",
      status: "warn",
      weight: 20,
      detail: `Meta başlık mevcut ancak kısa: ${title.length} karakter — kullanılabilir alanın bir kısmı boş kalıyor. ${TITLE_IDEAL_MIN}-${TITLE_IDEAL_MAX} ideal.`,
      field: "meta_title",
    });
  } else {
    checks.push({
      id: "title-present",
      label: "Meta başlık uzunluğu",
      status: "pass",
      weight: 20,
      detail: `${title.length}/${TITLE_IDEAL_MAX} karakter — ideal aralıkta.`,
      field: "meta_title",
    });
  }

  // ---- Description ------------------------------------------------------
  if (!description) {
    checks.push({
      id: "desc-present",
      label: "Meta açıklama",
      status: "fail",
      weight: 18,
      detail: "Meta açıklama boş. Google sayfadan rastgele bir cümle seçer — tıklama oranını düşürür.",
      field: "meta_description",
    });
  } else if (description.length < DESC_MIN) {
    checks.push({
      id: "desc-present",
      label: "Meta açıklama uzunluğu",
      status: "fail",
      weight: 18,
      detail: `Meta açıklama mevcut ancak çok kısa: ${description.length} karakter. ${DESC_IDEAL_MIN}-${DESC_IDEAL_MAX} hedefleyin.`,
      field: "meta_description",
    });
  } else if (description.length > DESC_IDEAL_MAX) {
    checks.push({
      id: "desc-present",
      label: "Meta açıklama uzunluğu",
      status: "warn",
      weight: 18,
      detail:
        description.length > DESC_MAX
          ? `Meta açıklama mevcut ancak uzun: ${description.length} karakter. Sonu "..." ile kesilir; en fazla ${DESC_IDEAL_MAX} önerilir.`
          : `Meta açıklama mevcut ancak uzun: ${description.length} karakter. Önerilen üst sınır ${DESC_IDEAL_MAX}; bu uzunlukta kesilme riski var.`,
      field: "meta_description",
    });
  } else if (description.length < DESC_IDEAL_MIN) {
    checks.push({
      id: "desc-present",
      label: "Meta açıklama uzunluğu",
      status: "warn",
      weight: 18,
      detail: `Meta açıklama mevcut ancak kısa: ${description.length} karakter — daha fazla alan kullanılabilir. ${DESC_IDEAL_MIN}-${DESC_IDEAL_MAX} ideal.`,
      field: "meta_description",
    });
  } else {
    checks.push({
      id: "desc-present",
      label: "Meta açıklama uzunluğu",
      status: "pass",
      weight: 18,
      detail: `${description.length}/${DESC_IDEAL_MAX} karakter — ideal aralıkta.`,
      field: "meta_description",
    });
  }

  // ---- Social image -----------------------------------------------------
  // Checked in every mode: a legal page still gets shared on WhatsApp.
  const socialImage = input.ogImageUrl?.trim() || input.imageUrl?.trim() || "";
  checks.push({
    id: "og-image",
    label: "Paylaşım görseli",
    status: socialImage ? "pass" : "fail",
    weight: 10,
    detail: socialImage
      ? "Ayarlı — WhatsApp, Facebook ve X paylaşımlarında bu görsel çıkar."
      : "Yok. Bu sayfanın linki paylaşıldığında görselsiz, düz bir kart görünür.",
    field: "og_image_url",
  });

  if (mode === "lite") {
    return finalise(checks);
  }

  // ---- Focus keyword ----------------------------------------------------
  if (!focus) {
    checks.push({
      id: "focus-present",
      label: "Odak anahtar kelime",
      status: "warn",
      weight: 6,
      detail:
        "Belirlenmemiş. Bu alan sitede yayınlanmaz — sadece bu paneldeki puanlama için kullanılır, teknik bir SEO eksikliği değildir.",
      field: "focus_keyword",
    });
  } else {
    checks.push({
      id: "focus-present",
      label: "Odak anahtar kelime",
      status: "pass",
      weight: 12,
      detail: `"${focus}" — bu terime göre puanlanıyor.`,
      field: "focus_keyword",
    });

    const inTitle = contains(title, focus);
    checks.push({
      id: "focus-in-title",
      label: "Odak kelime başlıkta",
      status: inTitle ? "pass" : "warn",
      weight: 10,
      detail: inTitle
        ? "Meta başlıkta geçiyor."
        : `Meta başlıkta "${focus}" geçmiyor — sıralama için en güçlü tek sinyal budur.`,
      field: "meta_title",
    });

    // Early placement is a weak signal, so it is a warn at most — never a
    // reason to drag an otherwise sound title's score down.
    const pos = fold(title).indexOf(fold(focus));
    checks.push({
      id: "focus-title-position",
      label: "Odak kelime başlığın başında",
      status: pos === -1 ? "warn" : pos <= 30 ? "pass" : "warn",
      weight: 4,
      detail:
        pos === -1
          ? "Başlıkta olmadığı için konumu ölçülemiyor."
          : pos <= 30
            ? `Başlığın ${pos}. karakterinde — başa yakın, iyi.`
            : `Başlığın ${pos}. karakterinde. Başa çekmek tıklama oranını artırır.`,
      field: "meta_title",
    });

    const inDesc = contains(description, focus);
    checks.push({
      id: "focus-in-desc",
      label: "Odak kelime açıklamada",
      status: inDesc ? "pass" : "warn",
      weight: 8,
      detail: inDesc
        ? "Meta açıklamada geçiyor — Google aramada kalın gösterir."
        : `Meta açıklamada "${focus}" geçmiyor. Google eşleşen kelimeleri kalın yazar, bu da tıklamayı artırır.`,
      field: "meta_description",
    });

    const inSlug = contains(input.slug ?? "", focus.replace(/\s+/g, "-"));
    checks.push({
      id: "focus-in-slug",
      label: "Odak kelime URL'de",
      status: inSlug ? "pass" : "warn",
      weight: 5,
      detail: inSlug
        ? "URL odak kelimeyi içeriyor."
        : "URL odak kelimeyi içermiyor. Yayındaki bir sayfanın URL'ini değiştirmek sıralamayı riske atar — yeni sayfalarda dikkat edin.",
      field: "slug",
    });
  }

  // ---- Keywords ---------------------------------------------------------
  checks.push({
    id: "keywords",
    label: "Yan anahtar kelimeler",
    status: keywords.length >= 3 ? "pass" : "warn",
    weight: 4,
    detail:
      keywords.length >= 3
        ? `${keywords.length} terim tanımlı.`
        : keywords.length > 0
          ? `Sadece ${keywords.length} terim. En az 3 önerilir.`
          : "Hiç yan anahtar kelime yok. Bu alan sitede meta etiketi olarak yayınlanmaz — teknik bir eksiklik değildir.",
    field: "keywords",
  });

  // ---- H1 ---------------------------------------------------------------
  const h1 = (input.h1 ?? "").trim();
  if (h1) {
    const h1HasFocus = !focus || contains(h1, focus);
    checks.push({
      id: "h1",
      label: "H1 başlığı",
      status: h1HasFocus ? "pass" : "warn",
      weight: 6,
      detail: h1HasFocus
        ? "Sayfa başlığı odak kelimeyi içeriyor."
        : `H1 "${focus}" içermiyor.`,
      field: "h1",
    });
  }

  // ---- Content ----------------------------------------------------------
  if (hasContent) {
    // Prefer the count measured from the rendered page. A landing page's copy
    // lives in its component rather than in a column, so counting only the
    // editable intro would report an 800-word page as thin.
    const editableWords = wordCount(content);
    const words = Math.max(editableWords, input.contentWordCount ?? 0);
    checks.push({
      id: "content-length",
      label: "İçerik uzunluğu",
      status: words >= 300 ? "pass" : words >= 120 ? "warn" : "fail",
      weight: 8,
      detail:
        words >= 300
          ? `${words} kelime — yeterli derinlik.`
          : `${words} kelime. 300+ kelime, aynı terime çıkan rakiplerle yarışabilmek için pratik alt sınır.`,
      field: "content",
    });

    // Density is only measurable over text we actually hold. When the copy
    // lives in the page component there is nothing to count, and guessing
    // would be worse than staying quiet.
    if (focus && editableWords > 0) {
      const density = keywordDensity(content, focus);
      checks.push({
        id: "keyword-density",
        label: "Anahtar kelime yoğunluğu",
        status:
          density === 0 ? "fail" : density > 3 ? "warn" : density < 0.5 ? "warn" : "pass",
        weight: 6,
        detail:
          density === 0
            ? `İçerikte "${focus}" hiç geçmiyor.`
            : density > 3
              ? `%${density.toFixed(1)} — fazla tekrar ediyor, spam olarak okunur. %0.5-%3 arası hedefleyin.`
              : density < 0.5
                ? `%${density.toFixed(1)} — biraz düşük. %0.5-%3 arası hedefleyin.`
                : `%${density.toFixed(1)} — sağlıklı aralıkta.`,
        field: "content",
      });
    }
  }

  // ---- Image alt --------------------------------------------------------
  if (socialImage) {
    const alt = (input.imageAlt ?? "").trim();
    checks.push({
      id: "image-alt",
      label: "Görsel alt metni",
      status: alt ? "pass" : "warn",
      weight: 4,
      detail: alt
        ? "Tanımlı — Google Görseller'de bu metinle eşleşir."
        : "Boş. Google Görseller'de çıkmak için görselin ne olduğunu yazın.",
      field: "image_alt",
    });
  }

  return finalise(checks);
}

function finalise(checks: SeoCheck[]): SeoScore {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce(
    (sum, c) => sum + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0),
    0
  );
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  return {
    percent,
    grade: percent >= 85 ? "excellent" : percent >= 65 ? "good" : percent >= 40 ? "fair" : "poor",
    checks,
    passed: checks.filter((c) => c.status === "pass").length,
    total: checks.length,
  };
}

export const GRADE_LABEL: Record<SeoScore["grade"], string> = {
  excellent: "Mükemmel",
  good: "İyi",
  fair: "Orta",
  poor: "Zayıf",
};

/** Tailwind-free colours, so the same values work in inline styles and SVG. */
export const GRADE_COLOR: Record<SeoScore["grade"], string> = {
  excellent: "#16a34a",
  good: "#65a30d",
  fair: "#d97706",
  poor: "#dc2626",
};
