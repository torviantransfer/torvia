"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Edit2, Trash2, Power, ExternalLink, LayoutTemplate, Search } from "lucide-react";

import {
  Button,
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  IconButton,
  IconLink,
  PageHeader,
  cx,
  type GridColumn,
} from "@/components/admin/ui";
import LandingEditor, { LOCALES } from "./LandingEditor";

export interface LandingRow {
  id: string;
  slug: string;
  label: string;
  is_published: boolean;
  published_at: string | null;
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
 * The list. Writing happens in LandingEditor, in the same two-column layout
 * as the blog and region editors — this screen lists, publishes and deletes.
 */
export default function LandingManager({ initialPages }: { initialPages: LandingRow[] }) {
  const pathname = usePathname();
  const adminLocale = pathname.split("/")[1] || "tr";

  const [pages, setPages] = useState<LandingRow[]>(initialPages);
  const [regions, setRegions] = useState<Region[]>([]);
  // undefined: the list. null: a new page. A row: that page.
  const [editing, setEditing] = useState<LandingRow | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<LandingRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRegions(d); })
      .catch(() => {});
  }, []);

  const handleToggle = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "landing_pages", action: "toggle", id, data: { field: "is_published" } }),
    });
    const result = await res.json();
    if (result.data) {
      setPages((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: result.data.is_published } : p)));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "landing_pages", action: "delete", id: deleting.id }),
    });
    const result = await res.json();
    setDeleteBusy(false);
    if (result.success) {
      setPages((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    }
  };

  if (editing !== undefined) {
    return (
      <LandingEditor
        page={editing}
        regions={regions}
        siblings={editing ? pages.filter((p) => p.id !== editing.id) : pages}
        onClose={() => setEditing(undefined)}
        onSaved={(row, created) => {
          setPages((prev) => (created ? [row, ...prev] : prev.map((p) => (p.id === row.id ? row : p))));
          // Stay in the editor; a new page becomes the page being edited, so
          // the slug-collision check against siblings still excludes it.
          setEditing(row);
        }}
      />
    );
  }

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
              <span aria-hidden="true" className="ms-1 flex items-center gap-0.5 font-sans" title="Kendi başlığı ve içeriği olan diller">
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
          <IconButton icon={Edit2} label="Düzenle" size="sm" onClick={() => setEditing(p)} />
          <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => setDeleting(p)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
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
          <Button variant="primary" icon={Plus} compact onClick={() => setEditing(null)}>
            Yeni landing sayfası
          </Button>
        }
      />

      <DataGrid
        label="Landing sayfaları"
        columns={columns}
        rows={pages}
        rowKey={(p) => p.id}
        onRowClick={(p) => setEditing(p)}
        empty={<EmptyState compact icon={LayoutTemplate} title="Henüz landing sayfası yok" action={<Button onClick={() => setEditing(null)}>Yeni landing sayfası</Button>} />}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Sayfayı sil"
        message={deleting ? `"${deleting.label}" sayfası silinecek. /${deleting.slug} adresi 404 vermeye başlar. Sayfa Google'da yer alıyorsa silmek yerine yayından kaldırmayı düşünün.` : ""}
        confirmLabel="Sil"
        danger
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
