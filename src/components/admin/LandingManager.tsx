"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Upload,
  Loader2,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
  LayoutTemplate,
  Search,
} from "lucide-react";

import { landingSlugProblem, regionSlugForms, slugifyLanding } from "@/lib/landingSlug";
import { htmlWordCount } from "@/lib/richText";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  DataGrid,
  EmptyState,
  Field,
  IconButton,
  IconLink,
  Input,
  PageHeader,
  Select,
  Textarea,
  cx,
  type GridColumn,
} from "@/components/admin/ui";

const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"] as const;
type Loc = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Loc, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  pl: "Polski",
  ru: "Русский",
  nl: "Nederlands",
  ro: "Română",
  ar: "العربية",
};

/**
 * The per-language columns this screen owns.
 *
 * Deliberately short. Meta title, meta description, keywords, canonical, the
 * Open Graph and Twitter fields and the robots switches are *not* here: they
 * are edited on the SEO Yönetimi screen, which is the one place that answers
 * "what does this URL tell Google". Having both screens write the same column
 * is how two editors end up disagreeing about one page — the same reason a
 * blog post's H1 is editable in the blog editor and read-only in the SEO
 * panel. This screen owns what the visitor reads; that one owns what Google
 * is told.
 *
 * Every list below is built from LOCALES × this array rather than written out,
 * so a language cannot be added to the tabs without its columns coming with it.
 */
const LOCALISED_FIELDS = ["slug", "h1", "intro", "content"] as const;

type LocalisedField = (typeof LOCALISED_FIELDS)[number];

export interface LandingRow {
  id: string;
  slug: string;
  label: string;
  is_published: boolean;
  cta_region_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  updated_at: string | null;
  [key: string]: unknown;
}

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
}

/**
 * Written as an explicit interface rather than inferred from `emptyForm`: the
 * localised columns are generated, so the shape needs an index signature to
 * address them.
 */
interface FormState {
  slug: string;
  label: string;
  cta_region_slug: string;
  image_url: string;
  image_alt: string;
  [key: string]: string;
}

const emptyForm: FormState = {
  ...(Object.fromEntries(
    LOCALES.flatMap((l) => LOCALISED_FIELDS.map((f) => [`${f}_${l}`, ""]))
  ) as Record<string, string>),
  slug: "",
  label: "",
  cta_region_slug: "",
  image_url: "",
  image_alt: "",
};


/** How complete one language is, for the dot on its tab. */
function localeStatus(form: FormState, l: Loc): "full" | "partial" | "empty" {
  const filled = [form[`h1_${l}`], form[`content_${l}`]].filter((v) => String(v ?? "").trim()).length;
  if (filled === 2) return "full";
  return filled === 0 ? "empty" : "partial";
}

export default function LandingManager({ initialPages }: { initialPages: LandingRow[] }) {
  const pathname = usePathname();
  const adminLocale = pathname.split("/")[1] || "tr";

  const [pages, setPages] = useState<LandingRow[]>(initialPages);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [activeLang, setActiveLang] = useState<Loc>("tr");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRegions(d);
      })
      .catch(() => {});
  }, []);

  /**
   * Every URL a landing page may not take, in both the bare and `-transfer`
   * forms a region occupies. The same check runs again in /api/admin/crud —
   * this copy exists so the editor can say why before a save is attempted, not
   * so the server can trust it.
   */
  const regionSlugs = useMemo(() => regions.flatMap((r) => regionSlugForms(r.slug)), [regions]);

  /** Every slug already spoken for by another landing page, in any language. */
  const takenSlugs = useMemo(
    () =>
      pages
        .filter((p) => p.id !== editingId)
        .flatMap((p) => [
          p.slug,
          ...LOCALES.map((l) => String(p[`slug_${l}`] ?? "").trim()).filter(Boolean),
        ]),
    [pages, editingId]
  );

  const slugProblem = useMemo(
    () => (form.slug ? landingSlugProblem(form.slug, regionSlugs, takenSlugs) : null),
    [form.slug, regionSlugs, takenSlugs]
  );

  /** Per-language slug overrides are optional; a blank one is not an error. */
  const localeSlugProblem = (l: Loc) => {
    const v = String(form[`slug_${l}`] ?? "").trim();
    if (!v) return null;
    return landingSlugProblem(v, regionSlugs, takenSlugs);
  };

  const firstLocaleSlugProblem = useMemo(
    () => LOCALES.map((l) => [l, localeSlugProblem(l)] as const).find(([, p]) => p) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, regionSlugs, takenSlugs]
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const localised = (f: LocalisedField, l: Loc = activeLang) => String(form[`${f}_${l}`] ?? "");

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setActiveLang("tr");
    setSaveError(null);
    setUploadError(null);
  };

  const startCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setActiveLang("tr");
    setSaveError(null);
    setShowForm(true);
  };

  const startEdit = (p: LandingRow) => {
    setForm({
      ...emptyForm,
      ...(Object.fromEntries(
        LOCALES.flatMap((l) =>
          LOCALISED_FIELDS.map((f) => [`${f}_${l}`, (p[`${f}_${l}`] as string | null) ?? ""])
        )
      ) as Record<string, string>),
      slug: p.slug,
      label: p.label,
      cta_region_slug: p.cta_region_slug ?? "",
      image_url: p.image_url ?? "",
      image_alt: p.image_alt ?? "",
    });
    setEditingId(p.id);
    setActiveLang("tr");
    setSaveError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (slugProblem) {
      setSaveError(slugProblem);
      return;
    }
    if (firstLocaleSlugProblem) {
      const [l, problem] = firstLocaleSlugProblem;
      setSaveError(`${LOCALE_LABELS[l]} adresi: ${problem}`);
      setActiveLang(l);
      return;
    }
    if (!form.label.trim()) {
      setSaveError("Panel adı boş olamaz — listede sayfayı bu isimle bulacaksınız.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "landing_pages",
          action: editingId ? "update" : "create",
          id: editingId,
          data: {
            slug: form.slug.trim(),
            label: form.label.trim(),
            cta_region_slug: form.cta_region_slug || null,
            image_url: form.image_url || null,
            image_alt: form.image_alt || null,
            ...Object.fromEntries(
              LOCALES.flatMap((l) =>
                LOCALISED_FIELDS.map((f) => [
                  `${f}_${l}`,
                  String(form[`${f}_${l}` as keyof FormState] ?? "").trim() || null,
                ])
              )
            ),
          },
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setSaveError(result.error || "Kaydedilemedi.");
        return;
      }
      if (result.data) {
        setPages((prev) =>
          editingId
            ? prev.map((p) => (p.id === editingId ? (result.data as LandingRow) : p))
            : [result.data as LandingRow, ...prev]
        );
        resetForm();
      }
    } catch {
      setSaveError("Kaydedilemedi — bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "landing_pages",
        action: "toggle",
        id,
        data: { field: "is_published" },
      }),
    });
    const result = await res.json();
    if (result.data) {
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_published: result.data.is_published } : p))
      );
    }
  };

  const handleDelete = async (p: LandingRow) => {
    if (
      !confirm(
        `"${p.label}" sayfası silinsin mi?\n\n/${p.slug} adresi 404 vermeye başlar. Sayfa Google'da yer alıyorsa silmek yerine yayından kaldırmayı düşünün.`
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "landing_pages", action: "delete", id: p.id }),
    });
    const result = await res.json();
    if (result.success) setPages((prev) => prev.filter((x) => x.id !== p.id));
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "landing");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        setUploadError(result.error || "Yükleme başarısız oldu");
        return;
      }
      set("image_url", result.url);
    } catch {
      setUploadError("Yükleme başarısız oldu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------
  if (!showForm) {
    const columns: GridColumn<LandingRow>[] = [
      {
        key: "page",
        header: "Sayfa",
        width: "minmax(220px,1.6fr)",
        area: "body",
        cell: (p) => {
          const filled = LOCALES.filter((l) => String(p[`h1_${l}`] ?? "").trim() && String(p[`content_${l}`] ?? "").trim());
          return (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold">{p.label}</span>
                {p.noindex === true && <Chip tone="amber" plain>noindex</Chip>}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-adm-muted">
                /{p.slug}
                <span
                  aria-hidden="true"
                  className="ms-1 flex items-center gap-0.5 font-sans"
                  title="Kendi H1 ve içeriği olan diller"
                >
                  {LOCALES.map((l) => (
                    <span key={l} className={cx("size-1.5 rounded-full", filled.includes(l) ? "bg-adm-green" : "bg-adm-line-2")} />
                  ))}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Durum",
        width: "110px",
        area: "top-end",
        cell: (p) => (
          <Chip tone={p.is_published ? "green" : "neutral"} plain>
            {p.is_published ? "Yayında" : "Taslak"}
          </Chip>
        ),
      },
      {
        key: "actions",
        header: "",
        width: "150px",
        area: "foot-end",
        cell: (p) => (
          <div className="flex items-center justify-end gap-0.5">
            <IconLink icon={Search} label="SEO ayarları" size="sm" href={`/${adminLocale}/admin/seo`} />
            {p.is_published && (
              <IconLink icon={ExternalLink} label="Sayfayı aç" size="sm" href={`/tr/${String(p.slug_tr ?? "").trim() || p.slug}`} newTab />
            )}
            <IconButton icon={Power} label={p.is_published ? "Yayından kaldır" : "Yayınla"} size="sm" onClick={() => handleToggle(p.id)} className={p.is_published ? "text-adm-green" : undefined} />
            <IconButton icon={Edit2} label="Düzenle" size="sm" onClick={() => startEdit(p)} />
            <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => handleDelete(p)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
          </div>
        ),
      },
    ];

    return (
      <>
        <PageHeader
          title="Landing Sayfaları"
          description={
            <>
              Sayfa metni ve adresi bu ekranda. Meta başlık, açıklama ve diğer arama ayarları{" "}
              <Link href={`/${adminLocale}/admin/seo`} className="font-medium text-adm-brand-ink underline underline-offset-2">
                SEO Yönetimi
              </Link>{" "}
              ekranında.
            </>
          }
          actions={
            <Button variant="primary" icon={Plus} compact onClick={startCreate}>
              Yeni landing sayfası
            </Button>
          }
        />

        <DataGrid
          label="Landing sayfaları"
          columns={columns}
          rows={pages}
          rowKey={(p) => p.id}
          onRowClick={(p) => startEdit(p)}
          empty={<EmptyState compact icon={LayoutTemplate} title="Henüz landing sayfası yok" action={<Button onClick={startCreate}>Yeni landing sayfası</Button>} />}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------
  const activeSlug = localised("slug").trim() || form.slug || "sayfa-adresi";

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-3">
        <IconButton icon={ArrowLeft} label="Listeye dön" onClick={resetForm} className="rtl:rotate-180" />
        <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">
          {editingId ? "Landing sayfasını düzenle" : "Yeni landing sayfası"}
        </h1>
      </div>

      <div className="grid gap-4">
        {saveError && (
          <div className="flex items-start gap-2 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2.5 text-sm text-adm-rose">
            <AlertTriangle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <p className="flex items-start gap-2 rounded-adm-sm border border-adm-blue-soft bg-adm-blue-soft px-3 py-2.5 text-[13px] text-adm-blue">
          <Search size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Bu ekran sayfanın <strong>metnini ve adresini</strong> tutar. Meta başlık, meta açıklama, anahtar kelime,
            paylaşım görseli ve noindex ayarları{" "}
            <Link href={`/${adminLocale}/admin/seo`} className="font-medium underline underline-offset-2">
              SEO Yönetimi
            </Link>{" "}
            ekranındadır — orada Google önizlemesi ve puanlama ile birlikte. Kaydettikten sonra sayfa orada
            &quot;Landing&quot; grubunda listelenir.
          </span>
        </p>

        {/* ---- Identity ---- */}
        <Card bodyClassName="grid gap-4 p-[18px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Panel adı" htmlFor="landing-label" hint="Sadece burada görünür">
              <Input
                id="landing-label"
                required
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value;
                  set("label", label);
                  // Only while creating, and only until the slug is touched: a
                  // published page's slug is its URL, and rewriting it because
                  // someone fixed a typo in the panel name would retire a URL
                  // Google already has.
                  if (!editingId && !form.slug.trim()) set("slug", slugifyLanding(label));
                }}
                placeholder="Örn. Antalya Kayak Transferi"
              />
            </Field>

            <Field label="Varsayılan adres (slug)" htmlFor="landing-slug" error={slugProblem} hint={slugProblem ? undefined : "Dil sekmesinde ayrı adres girmediğiniz her dil bu adresi kullanır."}>
              <Input id="landing-slug" required value={form.slug} onChange={(e) => set("slug", slugifyLanding(e.target.value))} aria-invalid={!!slugProblem} placeholder="antalya-kayak-transfer" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rezervasyon bölgesi" htmlFor="landing-region" hint="Seçilirse sayfanın altındaki butona bu bölgenin fiyatı ve rezervasyon bağlantısı gelir, ayrıca bölge sayfasına iç link verilir.">
              <Select id="landing-region" value={form.cta_region_slug} onChange={(e) => set("cta_region_slug", e.target.value)}>
                <option value="">Seçilmedi — genel rezervasyon formu</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name_tr || r.name_en}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Görsel alt metni" htmlFor="landing-image_alt">
              <Input id="landing-image_alt" value={form.image_alt} onChange={(e) => set("image_alt", e.target.value)} placeholder="Görselde ne olduğunu yazın" />
            </Field>
          </div>

          <Field label="Kapak görseli" hint="Sayfanın üstünde görünür. Paylaşım görseli (WhatsApp / Facebook) SEO Yönetimi ekranından ayarlanır." error={uploadError ?? undefined}>
            <div className="flex items-center gap-2">
              <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="/images/… veya https://…" className="flex-1" />
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-adm-sm border border-adm-line px-3 py-2.5 text-sm text-adm-ink-2 hover:bg-adm-surface-2">
                {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Upload size={14} aria-hidden="true" />}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
                Yükle
              </label>
            </div>
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" className="mt-2 h-24 w-full rounded-adm-sm border border-adm-line object-cover" />
            )}
          </Field>
        </Card>

        {/* ---- Language tabs ---- */}
        <div className="flex flex-wrap gap-1 rounded-adm bg-adm-line-2 p-1">
          {LOCALES.map((l) => {
            const status = localeStatus(form, l);
            const dot = { full: "bg-adm-green", partial: "bg-adm-amber", empty: "bg-adm-faint" }[status];
            const on = activeLang === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLang(l)}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-adm-sm px-3 py-1.5 text-[13px] font-medium transition-colors",
                  on ? "bg-adm-surface text-adm-ink shadow-adm-sm" : "text-adm-muted hover:text-adm-ink"
                )}
              >
                <span aria-hidden="true" className={cx("size-1.5 rounded-full", dot)} />
                {LOCALE_LABELS[l]}
              </button>
            );
          })}
        </div>

        {localeStatus(form, activeLang) !== "full" && (
          <p className="flex items-start gap-2 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5 text-[13px] text-adm-amber">
            <AlertTriangle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Bu dilde H1 ve içerik dolu değilse sayfa o dilde <strong>noindex</strong> yayınlanır, site haritasına
              girmez ve İngilizce metni gösterir. Bu kasıtlı: çevrilmemiş bir sayfayı Google&apos;a ayrı bir dil gibi
              sunmak kopya içerik sayılır.
            </span>
          </p>
        )}

        {/* ---- Per-language copy ---- */}
        <Card bodyClassName="grid gap-4 p-[18px]">
          <Field
            label={`${LOCALE_LABELS[activeLang]} adresi`}
            htmlFor="landing-locale-slug"
            error={localeSlugProblem(activeLang) ?? undefined}
            hint={
              localeSlugProblem(activeLang)
                ? undefined
                : `Opsiyonel. Boş bırakılırsa varsayılan adres kullanılır. Yayındaki adres: /${activeLang}/${activeSlug}`
            }
          >
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-sm text-adm-muted">/{activeLang}/</span>
              <Input
                id="landing-locale-slug"
                value={localised("slug")}
                onChange={(e) => set(`slug_${activeLang}`, slugifyLanding(e.target.value))}
                aria-invalid={!!localeSlugProblem(activeLang)}
                placeholder={form.slug || "antalya-kayak-transfer"}
              />
            </div>
          </Field>

          <Field label={`Sayfa başlığı — H1 (${LOCALE_LABELS[activeLang]})`} htmlFor="landing-h1">
            <Input id="landing-h1" value={localised("h1")} onChange={(e) => set(`h1_${activeLang}`, e.target.value)} placeholder="Sayfanın en üstünde görünen başlık" />
          </Field>

          <Field label={`Giriş paragrafı (${LOCALE_LABELS[activeLang]})`} htmlFor="landing-intro" hint="SEO Yönetimi'nde meta açıklama boş bırakılırsa arama sonucunda bu metin kullanılır.">
            <Textarea id="landing-intro" value={localised("intro")} onChange={(e) => set(`intro_${activeLang}`, e.target.value)} rows={3} placeholder="Başlığın altındaki kısa açıklama." />
          </Field>

          <Field
            label={`İçerik — HTML (${LOCALE_LABELS[activeLang]})`}
            htmlFor="landing-content"
            hint={
              <>
                {htmlWordCount(localised("content"))} kelime · <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>,{" "}
                <code>&lt;ul&gt;</code>, <code>&lt;table&gt;</code>, <code>&lt;img&gt;</code>, <code>&lt;a&gt;</code> ve
                YouTube gömme desteklenir. <code>&lt;h1&gt;</code> yazarsanız <code>&lt;h2&gt;</code>&apos;ye çevrilir —
                sayfanın H1&apos;i yukarıdaki alandır.
              </>
            }
          >
            <Textarea
              id="landing-content"
              value={localised("content")}
              onChange={(e) => set(`content_${activeLang}`, e.target.value)}
              rows={16}
              className="font-mono"
              placeholder={"<h2>Alt başlık</h2>\n<p>Paragraf…</p>\n<ul><li>Madde</li></ul>"}
            />
          </Field>
        </Card>

        <div className="flex flex-wrap gap-2 border-t border-adm-line-2 pt-4">
          <Button type="submit" variant="primary" loading={loading || uploading} disabled={Boolean(slugProblem) || Boolean(firstLocaleSlugProblem)}>
            {editingId ? "Güncelle" : "Oluştur"}
          </Button>
          <Button type="button" onClick={resetForm}>
            Vazgeç
          </Button>
          <ButtonLink href={`/${adminLocale}/admin/seo`} icon={Search}>
            SEO ayarlarına git
          </ButtonLink>
        </div>
      </div>
    </form>
  );
}
