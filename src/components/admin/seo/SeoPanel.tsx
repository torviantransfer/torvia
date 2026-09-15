"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertOctagon,
  Check,
  ExternalLink,
  EyeOff,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";
import type { PageInspection } from "@/lib/seoInspect";
import type { DuplicateIndex } from "@/lib/seoDuplicates";
import { parseKeywords } from "@/lib/seoScore";
import { Button, Chip, Drawer, IconLink, Tabs, type TabItem } from "@/components/admin/ui";
import SerpPreview from "./SerpPreview";
import SocialPreview from "./SocialPreview";
import SeoScorePanel, { ScoreBadge } from "./SeoScorePanel";
import { TechnicalChecks, HreflangPanel, SchemaPanel, RuntimeSummary } from "./RuntimePanels";
import SaveDiffDialog from "./SaveDiffDialog";
import { LOCALES, LocaleTabs, type Loc } from "./fields";
import { field, str, type Entry } from "./entries";
import { GROUP_META } from "./pageTypes";
import { auditFor, scoreEntry } from "./scoring";
import SeoFields from "./SeoFields";
import { useSeoDraft } from "./useSeoDraft";

const SITE_URL = "https://torviantransfer.com";

type PanelTab = "fields" | "preview" | "technical";

const TABS: TabItem<PanelTab>[] = [
  { key: "fields", label: "Alanlar" },
  { key: "preview", label: "Önizleme" },
  { key: "technical", label: "Teknik" },
];

/**
 * The editing panel for one page: docs/admin-tasarim.md, bölüm 5.16.
 *
 * The fields, the previews and the live technical reading are three tabs
 * rather than one column, because all of them together are far taller than a
 * drawer and an editor only ever works on one of the three at a time.
 */
export default function SeoPanel({
  entry,
  locale,
  duplicates,
  inspection,
  scanning,
  onScan,
  onLocale,
  onClose,
  onSaved,
}: {
  entry: Entry | null;
  locale: Loc;
  duplicates: DuplicateIndex;
  inspection: PageInspection | null;
  scanning: boolean;
  onScan: () => void;
  onLocale: (l: Loc) => void;
  onClose: () => void;
  onSaved: (entry: Entry, next: Record<string, unknown>) => void;
}) {
  if (!entry) return <Drawer open={false} onClose={onClose} label="SEO paneli" />;
  return (
    <SeoPanelBody
      // A fresh draft per page and per language: the row being edited changes
      // with both, and carrying the old draft over would write one page's copy
      // onto another.
      key={`${entry.id}:${locale}`}
      entry={entry}
      locale={locale}
      duplicates={duplicates}
      inspection={inspection}
      scanning={scanning}
      onScan={onScan}
      onLocale={onLocale}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function SeoPanelBody({
  entry,
  locale,
  duplicates,
  inspection,
  scanning,
  onScan,
  onLocale,
  onClose,
  onSaved,
}: {
  entry: Entry;
  locale: Loc;
  duplicates: DuplicateIndex;
  inspection: PageInspection | null;
  scanning: boolean;
  onScan: () => void;
  onLocale: (l: Loc) => void;
  onClose: () => void;
  onSaved: (entry: Entry, next: Record<string, unknown>) => void;
}) {
  const [tab, setTab] = useState<PanelTab>("fields");
  const [confirming, setConfirming] = useState(false);
  const requested = useRef<string | null>(null);

  const path = `${locale}${entry.routeFor(locale)}`;

  const editor = useSeoDraft({
    entry,
    locale,
    onSaved: (next) => onSaved(entry, next),
    onCommitted: () => {
      setConfirming(false);
      // The save revalidated the page server-side; re-reading it is what
      // proves the change actually reached the HTML.
      requested.current = null;
      setTimeout(onScan, 1500);
    },
  });

  const { draft, get, changes, dirty, saving, saved, error, save } = editor;

  // The panel can open on a page whose live values have not been read yet.
  // Without them every field would claim "no value", which is precisely the
  // misreading this panel exists to prevent.
  useEffect(() => {
    if (!inspection && !scanning && requested.current !== path) {
      requested.current = path;
      onScan();
    }
  }, [inspection, scanning, onScan, path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) setConfirming(true);
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty, saving]);

  const score = useMemo(
    () => scoreEntry({ ...entry, row: draft }, locale, duplicates, inspection),
    [entry, draft, locale, duplicates, inspection]
  );

  const findings = useMemo(
    () => (inspection ? auditFor(entry, locale, inspection, duplicates) : []),
    [inspection, entry, locale, duplicates]
  );

  const localeStatus = useMemo(() => {
    const out: Record<string, "full" | "partial" | "empty"> = {};
    for (const l of LOCALES) {
      const t = str(draft, field(entry.fieldMap, "metaTitle", l));
      const d = str(draft, field(entry.fieldMap, "metaDescription", l));
      out[l] = t && d ? "full" : t || d ? "partial" : "empty";
    }
    return out;
  }, [draft, entry.fieldMap]);

  const leave = () => {
    if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Panel kapatılsın mı?")) return;
    onClose();
  };

  /** Jumps to the field a score or audit line is complaining about. */
  const focusField = (name: string) => {
    setTab("fields");
    // The tab has to render before the input exists to be focused.
    requestAnimationFrame(() => {
      const el =
        document.getElementById(`seo-${name}-${locale}`) ?? document.getElementById(`seo-${name}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | null)?.focus();
    });
  };

  const route = entry.routeFor(locale);
  const liveUrl = `${SITE_URL}/${locale}${route ? `/${route}` : ""}`;
  const meta = GROUP_META[entry.pageType] ?? GROUP_META.static;
  const unreadable = inspection?.blocked?.message ?? null;

  const effTitle = get("metaTitle") || (unreadable ? "" : inspection?.title) || "";
  const effDesc = get("metaDescription") || (unreadable ? "" : inspection?.description) || "";
  const effOgImage =
    str(draft, "og_image_url") ||
    str(draft, "image_url") ||
    (unreadable ? "" : inspection?.ogImage) ||
    "";

  return (
    <>
      <Drawer
        open
        onClose={leave}
        label={`${entry.label} — SEO`}
        top={
          <div className="flex items-center gap-2">
            <Chip tone="neutral" plain>
              <meta.icon size={11} aria-hidden="true" style={{ color: meta.color }} />
              {meta.label}
            </Chip>
            <ScoreBadge percent={score.percent} />
          </div>
        }
        actions={
          <IconLink icon={ExternalLink} label="Sayfayı aç" href={liveUrl} newTab size="sm" />
        }
        title={entry.label}
        meta={<span className="font-mono">{liveUrl.replace("https://", "")}</span>}
        footer={
          <>
            <span className="text-[12px] text-adm-muted">
              {dirty ? `${changes.length} değişiklik` : saved ? "Kaydedildi" : "Değişiklik yok"}
            </span>
            <Button
              className="ms-auto"
              variant={saved && !dirty ? "primary" : "brand"}
              icon={saving ? Loader2 : saved && !dirty ? Check : Save}
              disabled={saving || !dirty}
              onClick={() => setConfirming(true)}
            >
              {saving ? "Kaydediliyor…" : saved && !dirty ? "Kaydedildi" : "Kaydet"}
            </Button>
          </>
        }
      >
        {error && (
          <p className="flex items-center gap-2 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[12.5px] text-adm-rose">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </p>
        )}

        {inspection?.blocked && (
          <div className="flex items-start gap-2.5 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5">
            <ShieldAlert size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
            <div>
              <p className="text-[12.5px] font-semibold text-adm-amber">
                {inspection.blocked.message}
              </p>
              <p className="mt-0.5 text-[11.5px] text-adm-amber">{inspection.blocked.detail}</p>
              <p className="mt-1 text-[11.5px] text-adm-ink-2">
                Alanların hiçbirinde &quot;mevcut değer&quot; gösterilmiyor. Boş görünenleri
                doldurmayın — gerçek değerleri bilinmiyor.
              </p>
            </div>
          </div>
        )}

        {!entry.isPublic && (
          <p className="flex items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-line-2 px-3 py-2 text-[12.5px] text-adm-ink-2">
            <EyeOff size={14} aria-hidden="true" /> Bu sayfa yayında değil — sitemap&apos;te yok.
            SEO alanları yine de doldurulabilir.
          </p>
        )}

        {entry.shadowedBy && (
          <div className="flex items-start gap-2.5 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5">
            <AlertOctagon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
            <div>
              <p className="text-[12.5px] font-semibold text-adm-amber">
                Bu adresi bu kayıt üretmiyor.
              </p>
              <p className="mt-0.5 text-[11.5px] text-adm-amber">
                /{locale}/{route} adresini kod içindeki landing sayfası servis ediyor; bölge satırı
                yalnızca fiyat, mesafe ve rezervasyon için kullanılıyor. Buradaki SEO alanları
                yayına çıkmaz.
              </p>
              <p className="mt-1 text-[11.5px] text-adm-ink-2">
                Bu sayfanın SEO&apos;sunu <strong>Landing → {entry.shadowedBy}</strong> kaydından
                düzenleyin.
              </p>
            </div>
          </div>
        )}

        <LocaleTabs active={locale} onChange={onLocale} status={localeStatus} />

        <Tabs items={TABS} value={tab} onChange={setTab} label="Panel bölümü" />

        {tab === "fields" && (
          <SeoFields
            entry={entry}
            locale={locale}
            editor={editor}
            inspection={inspection}
            scanning={scanning}
          />
        )}

        {tab === "preview" && (
          <>
            <SerpPreview
              title={effTitle}
              description={effDesc}
              path={route}
              locale={locale}
              keywords={[get("focusKeyword"), ...parseKeywords(get("keywords"))].filter(Boolean)}
              imageUrl={effOgImage || null}
            />
            <SocialPreview
              title={get("ogTitle") || effTitle}
              description={get("ogDescription") || effDesc}
              imageUrl={effOgImage || null}
              path={route}
              locale={locale}
            />
          </>
        )}

        {tab === "technical" && (
          <>
            <TechnicalChecks
              findings={findings}
              loading={scanning}
              onRefresh={onScan}
              onFieldClick={focusField}
              fetchedAt={inspection?.fetchedAt}
            />
            <SeoScorePanel score={score} onFieldClick={focusField} />
            <RuntimeSummary inspection={inspection} loading={scanning} />
            <HreflangPanel inspection={inspection} locale={locale} />
            <SchemaPanel inspection={inspection} />
          </>
        )}
      </Drawer>

      {confirming && (
        <SaveDiffDialog
          changes={changes}
          saving={saving}
          onConfirm={save}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
