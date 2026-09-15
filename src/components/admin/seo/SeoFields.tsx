"use client";

import type { PageInspection } from "@/lib/seoInspect";
import {
  TITLE_MIN,
  TITLE_IDEAL_MIN,
  TITLE_IDEAL_MAX,
  TITLE_MAX,
  DESC_MIN,
  DESC_IDEAL_MIN,
  DESC_IDEAL_MAX,
  DESC_MAX,
} from "@/lib/seoScore";
import { safeCanonical } from "@/lib/seoOverrides";
import { Field, Select } from "@/components/admin/ui";
import EffectiveField from "./EffectiveField";
import { ImageField, KeywordField, Section, TextField, type Loc } from "./fields";
import { str, type Entry } from "./entries";
import { LITE_KEYS } from "./scoring";
import TriToggle from "./TriToggle";
import type { SeoDraft } from "./useSeoDraft";

const SITE_URL = "https://torviantransfer.com";
const TWITTER_CARDS = ["summary_large_image", "summary"] as const;

/**
 * Every editable SEO field for one page in one language.
 *
 * Each field shows what the site currently serves next to the override box, so
 * an empty box never reads as "this page has no title" when the title simply
 * comes from the page's own code.
 */
export default function SeoFields({
  entry,
  locale,
  editor,
  inspection,
  scanning,
}: {
  entry: Entry;
  locale: Loc;
  editor: SeoDraft;
  inspection: PageInspection | null;
  scanning: boolean;
}) {
  const { draft, get, set, setRaw, raw } = editor;
  const lite = LITE_KEYS.has(entry.key);

  // Every field receives this, so none of them can render a value that was
  // never read -- or claim a value is missing when it simply was not fetched.
  const unreadable = inspection?.blocked?.message ?? null;

  const canonicalDraft = get("canonical");
  const canonicalSafe = safeCanonical(canonicalDraft);
  const canonicalWarning = !canonicalDraft
    ? null
    : !canonicalSafe
      ? "Geçersiz veya site dışı bir adres — bu haliyle yok sayılır. Sadece torviantransfer.com adresleri kabul edilir."
      : canonicalSafe !== canonicalDraft
        ? `Kaydedilecek hali: ${canonicalSafe}`
        : null;

  const uploadFolder =
    entry.kind === "region" ? "regions" : entry.kind === "blog" ? "blog" : "pages";

  const route = entry.routeFor(locale);
  const liveUrl = `${SITE_URL}/${locale}${route ? `/${route}` : ""}`;
  const altless = inspection?.images.filter((i) => i.alt === null).length ?? 0;

  return (
    <>
      <Section
        title="Arama sonucu"
        description="Boş bırakılan alanlar sayfanın mevcut değerini kullanmaya devam eder. Kutunun üstündeki etiket değerin nereden geldiğini gösterir."
      >
        <EffectiveField
          id={`seo-meta_title-${locale}`}
          label="Meta başlık"
          override={get("metaTitle")}
          onChange={(v) => set("metaTitle", v)}
          live={inspection?.title}
          loading={scanning}
          unreadable={unreadable}
          counter={{ min: TITLE_MIN, ideal: [TITLE_IDEAL_MIN, TITLE_IDEAL_MAX], max: TITLE_MAX }}
        />
        <EffectiveField
          id={`seo-meta_description-${locale}`}
          label="Meta açıklama"
          multiline
          rows={3}
          override={get("metaDescription")}
          onChange={(v) => set("metaDescription", v)}
          live={inspection?.description}
          loading={scanning}
          unreadable={unreadable}
          counter={{ min: DESC_MIN, ideal: [DESC_IDEAL_MIN, DESC_IDEAL_MAX], max: DESC_MAX }}
        />
      </Section>

      <Section
        title="Canonical"
        description="Aynı içeriğin asıl adresi. Yanlış bir değer sayfayı Google'dan düşürür."
      >
        <EffectiveField
          id={`seo-canonical_url-${locale}`}
          label="Canonical URL"
          override={canonicalDraft}
          onChange={(v) => set("canonical", v)}
          live={inspection?.canonical}
          loading={scanning}
          unreadable={unreadable}
          warning={canonicalWarning}
          hint="Boş bırakılırsa sistem otomatik üretir — normal durumda doğrusu budur."
        />
      </Section>

      <Section
        title="İndeksleme"
        description="Bu iki ayar sayfanın Google'da olup olmayacağını doğrudan belirler."
      >
        <TriToggle
          label="Google'dan gizle (noindex)"
          description="Açılırsa sayfa arama sonuçlarından çıkarılır. Sıralaması olan bir sayfada bu trafiği kaybettirir."
          value={draft.noindex === true ? true : draft.noindex === false ? false : null}
          onChange={(v) => setRaw("noindex", v)}
        />
        <TriToggle
          label="Linkleri izleme (nofollow)"
          description="Açılırsa bu sayfadaki linkler taranmaz, iç link gücü aktarılmaz."
          value={draft.nofollow === true ? true : draft.nofollow === false ? false : null}
          onChange={(v) => setRaw("nofollow", v)}
        />
        {inspection && (
          <p className="text-[11.5px] text-adm-muted">
            Şu an yayında:{" "}
            <code className="font-mono text-adm-ink-2">
              {inspection.googlebot ?? inspection.robots ?? "direktif yok"}
            </code>
          </p>
        )}
      </Section>

      {!lite && (
        <Section
          title="Anahtar kelimeler"
          description="Sitede meta etiketi olarak yayınlanmaz — puanlama bunlara göre yapılır."
        >
          <TextField
            id={`seo-focus_keyword-${locale}`}
            label="Odak anahtar kelime"
            value={get("focusKeyword")}
            onChange={(v) => set("focusKeyword", v)}
            placeholder="belek transfer"
          />
          <KeywordField
            id={`seo-keywords-${locale}`}
            label="Yan anahtar kelimeler"
            value={get("keywords")}
            onChange={(v) => set("keywords", v)}
          />
        </Section>
      )}

      <Section title="Sayfa metni">
        {entry.fieldMap.h1 ? (
          <EffectiveField
            id={`seo-h1-${locale}`}
            label="H1 başlığı"
            override={get("h1")}
            onChange={(v) => set("h1", v)}
            live={inspection?.h1s[0]}
            loading={scanning}
            unreadable={unreadable}
          />
        ) : (
          <EffectiveField
            label="H1 başlığı"
            override=""
            onChange={() => {}}
            live={
              (unreadable ? undefined : inspection?.h1s[0]) ??
              str(draft, entry.kind === "landing" ? `h1_${locale}` : `title_${locale}`)
            }
            readOnly={{
              reason:
                entry.kind === "landing"
                  ? "Landing sayfalarının H1'i ve giriş paragrafı, gövde metniyle birlikte Landing Sayfaları ekranından düzenlenir. Arama sonucundaki başlığı sayfadaki başlıktan ayırmak için yukarıdaki meta başlığı doldurun."
                  : "Blog yazılarında H1, yazının başlığıdır ve Blog Yazıları ekranından düzenlenir. Arama sonucundaki başlığı ondan ayırmak için yukarıdaki meta başlığı doldurun.",
            }}
          />
        )}
        {!entry.fieldMap.intro && entry.kind === "landing" && (
          <EffectiveField
            label="Giriş paragrafı"
            override=""
            onChange={() => {}}
            live={str(draft, `intro_${locale}`)}
            readOnly={{
              reason:
                "Sayfanın giriş paragrafı. Landing Sayfaları ekranından düzenlenir; meta açıklama boş bırakılırsa arama sonucunda bu metin kullanılır.",
            }}
          />
        )}
        {entry.fieldMap.intro && (
          <TextField
            id={`seo-intro-${locale}`}
            label={
              entry.kind === "region"
                ? "Bölge açıklaması"
                : entry.kind === "blog"
                  ? "Özet (excerpt)"
                  : "Giriş paragrafı"
            }
            multiline
            rows={5}
            value={get("intro")}
            onChange={(v) => set("intro", v)}
            hint={
              entry.kind === "region"
                ? "Bu dilde boş bırakılan bölgeler o dilde indekslenmez — mevcut davranış korunur."
                : undefined
            }
          />
        )}
        {entry.kind === "region" && (
          <TextField
            id={`seo-name-${locale}`}
            label="Bölge adı"
            value={str(draft, `name_${locale}`)}
            onChange={(v) => setRaw(`name_${locale}`, v)}
          />
        )}
      </Section>

      <Section
        title="Open Graph"
        description="WhatsApp ve Facebook paylaşımlarında görünen bilgiler. Boş bırakılırsa yukarıdaki meta başlık ve açıklama kullanılır."
      >
        <EffectiveField
          id={`seo-og_title-${locale}`}
          label="OG başlık"
          override={get("ogTitle")}
          onChange={(v) => set("ogTitle", v)}
          live={inspection?.ogTitle}
          loading={scanning}
          unreadable={unreadable}
        />
        <EffectiveField
          id={`seo-og_description-${locale}`}
          label="OG açıklama"
          multiline
          rows={2}
          override={get("ogDescription")}
          onChange={(v) => set("ogDescription", v)}
          live={inspection?.ogDescription}
          loading={scanning}
          unreadable={unreadable}
        />
        <ImageField
          label="OG görseli (1200×630)"
          value={raw("og_image_url")}
          onChange={(v) => setRaw("og_image_url", v)}
          folder={uploadFolder}
          aspect="1.91/1"
          hint={
            inspection?.ogImage
              ? `Şu an yayında: ${inspection.ogImage.replace(SITE_URL, "")}`
              : "Boş bırakılırsa kart görseli kullanılır."
          }
        />
      </Section>

      <Section
        title="X / Twitter"
        description="Boş bırakılan alanlar önce Open Graph, sonra meta değerlerine düşer."
      >
        <EffectiveField
          id={`seo-twitter_title-${locale}`}
          label="Twitter başlık"
          override={get("twitterTitle")}
          onChange={(v) => set("twitterTitle", v)}
          live={inspection?.twitterTitle}
          loading={scanning}
          unreadable={unreadable}
        />
        <EffectiveField
          id={`seo-twitter_description-${locale}`}
          label="Twitter açıklama"
          multiline
          rows={2}
          override={get("twitterDescription")}
          onChange={(v) => set("twitterDescription", v)}
          live={inspection?.twitterDescription}
          loading={scanning}
          unreadable={unreadable}
        />
        <ImageField
          label="Twitter görseli"
          value={raw("twitter_image_url")}
          onChange={(v) => setRaw("twitter_image_url", v)}
          folder={uploadFolder}
          aspect="1.91/1"
          hint="Boş bırakılırsa OG görseli kullanılır."
        />
        <Field label="Kart tipi" htmlFor="seo-twitter_card">
          <Select
            id="seo-twitter_card"
            value={raw("twitter_card")}
            onChange={(e) => setRaw("twitter_card", e.target.value || null)}
          >
            <option value="">
              Varsayılan ({inspection?.twitterCard ?? "summary_large_image"})
            </option>
            {TWITTER_CARDS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Görsel ve alt metni">
        <ImageField
          label="Kart / sayfa görseli"
          value={raw("image_url")}
          onChange={(v) => setRaw("image_url", v)}
          folder={uploadFolder}
          hint="Repodaki bir dosyayı kullanmak için yolu yapıştırın: /images/regions/belek-golf.jpg"
        />
        <TextField
          id="seo-image_alt"
          label="Görsel alt metni"
          value={raw("image_alt")}
          onChange={(v) => setRaw("image_alt", v)}
          hint={
            altless > 0
              ? `Sayfada alt metni olmayan ${altless} görsel var.`
              : "Google Görseller bu metinle eşleştirir."
          }
        />
      </Section>

      <Section
        title="URL"
        description="URL değiştirmek 301 yönlendirme gerektirir; bu panel yönlendirme yönetmediği için adres salt okunurdur."
      >
        <EffectiveField
          label="Sayfa adresi"
          override=""
          onChange={() => {}}
          live={liveUrl}
          readOnly={{
            reason:
              entry.kind === "region"
                ? "Bölge URL'i değiştirilirse mevcut sıralama sıfırlanır. Değişiklik gerekiyorsa önce 301 yönlendirme kurulmalıdır."
                : "URL değişiklikleri bu panelden yapılmaz; 301 yönlendirme kurulumu gerekir.",
          }}
        />
      </Section>
    </>
  );
}
