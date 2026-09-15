"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Globe, MapPin, Plus, Sparkles, Star, Trash2, XCircle } from "lucide-react";
import { aggregate, MIN_REVIEWS_FOR_SCHEMA, type ReviewRow } from "@/lib/reviews";
import {
  Chip,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  FilterSelect,
  IconButton,
  PageHeader,
  SearchInput,
  StatStrip,
  Tabs,
  Toolbar,
  cx,
  useToast,
  type GridColumn,
} from "@/components/admin/ui";
import ReviewFormDialog, { emptyReviewForm, toReviewForm, type ReviewFormValues } from "./ReviewFormDialog";

export interface AdminReview extends ReviewRow {
  id: string;
  is_approved: boolean;
  created_at: string;
  region_id: string | null;
  customers: { first_name: string; last_name: string; email: string } | null;
  reservations: { reservation_code: string } | null;
}

export interface ReviewRegion {
  id: string;
  slug: string;
  name_tr: string | null;
  name_en: string | null;
}

type Tab = "pending" | "approved" | "featured" | "all";

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex shrink-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} aria-hidden="true" className={i < rating ? "fill-adm-amber text-adm-amber" : "text-adm-faint"} />
      ))}
    </span>
  );
}

/**
 * Değerlendirmeler: docs/admin-tasarim.md, bölüm 5.13. Veride ayrı bir
 * "reddedildi" durumu yok — `is_approved` iki hâlli — bu yüzden sekmeler
 * spesifikasyondaki üçlü yerine gerçek veriye göre kuruldu.
 */
export default function ReviewsScreen({ reviews, regions }: { reviews: AdminReview[]; regions: ReviewRegion[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ReviewFormValues | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const regionName = (id: string | null) => {
    if (!id) return null;
    const r = regions.find((x) => x.id === id);
    return r ? r.name_tr || r.name_en || r.slug : null;
  };

  const approved = useMemo(() => reviews.filter((r) => r.is_approved), [reviews]);
  const stats = useMemo(() => aggregate(approved), [approved]);
  const enoughForStars = stats.count >= MIN_REVIEWS_FOR_SCHEMA;

  const counts = useMemo(
    () => ({
      pending: reviews.filter((r) => !r.is_approved).length,
      approved: approved.length,
      featured: reviews.filter((r) => r.is_featured).length,
      all: reviews.length,
    }),
    [reviews, approved]
  );

  const rows = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return reviews
      .filter((r) => (tab === "pending" ? !r.is_approved : tab === "approved" ? r.is_approved : tab === "featured" ? r.is_featured : true))
      .filter((r) => !regionFilter || r.region_id === regionFilter)
      .filter((r) => {
        if (!query) return true;
        const name = (r.author_name ?? r.customers?.first_name ?? "").toLocaleLowerCase("tr-TR");
        return name.includes(query) || (r.comment ?? "").toLocaleLowerCase("tr-TR").includes(query);
      })
      .sort((a, b) => (b.published_at ?? b.created_at ?? "").localeCompare(a.published_at ?? a.created_at ?? ""));
  }, [reviews, tab, regionFilter, q]);

  const toggle = async (r: AdminReview, field: "is_approved" | "is_featured") => {
    setTogglingId(`${r.id}:${field}`);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "reviews", action: "toggle", id: r.id, data: { field } }),
    });
    setTogglingId(null);
    if (res.ok) refresh();
    else toast("İşlem yapılamadı.", "error");
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "reviews", action: "delete", id: deleting.id }),
    });
    setBusy(false);
    const result = await res.json().catch(() => null);
    if (res.ok && result?.success) {
      toast("Değerlendirme silindi.");
      setDeleting(null);
      refresh();
    } else {
      toast(result?.error ?? "Silinemedi.", "error");
    }
  };

  const columns: GridColumn<AdminReview>[] = [
    {
      key: "rating",
      header: "Puan",
      width: "84px",
      area: "top-start",
      cell: (r) => <Stars rating={r.rating} />,
    },
    {
      key: "review",
      header: "Değerlendirme",
      width: "minmax(220px,2fr)",
      area: "body",
      cell: (r) => {
        const name = r.author_name || r.customers?.first_name || "Misafir";
        const region = regionName(r.region_id);
        const date = (r.published_at ?? r.created_at ?? "").slice(0, 10);
        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-semibold text-adm-ink">{name}</span>
              {r.author_country && <span className="text-[11.5px] text-adm-muted">· {r.author_country}</span>}
              {!r.is_approved && <Chip tone="amber" plain>Onay bekliyor</Chip>}
              {r.is_featured && <Chip tone="violet" plain>Öne çıkan</Chip>}
            </div>
            {r.comment && <p className="mt-1 line-clamp-2 text-[13px] text-adm-ink-2">{r.comment}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-adm-faint">
              <span>{date}</span>
              {region && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" />
                  {region}
                </span>
              )}
              {r.locale && (
                <span className="inline-flex items-center gap-1">
                  <Globe size={11} aria-hidden="true" />
                  {r.locale.toUpperCase()}
                </span>
              )}
              {r.source && r.source !== "site" && <span>kaynak: {r.source}</span>}
              {r.reservations?.reservation_code && <span className="font-mono">#{r.reservations.reservation_code}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "150px",
      area: "foot-end",
      cell: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            icon={Sparkles}
            label={r.is_featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}
            size="sm"
            onClick={() => toggle(r, "is_featured")}
            disabled={togglingId === `${r.id}:is_featured`}
            className={r.is_featured ? "text-adm-violet" : undefined}
          />
          <IconButton
            icon={r.is_approved ? CheckCircle : XCircle}
            label={r.is_approved ? "Onayı kaldır" : "Onayla"}
            size="sm"
            onClick={() => toggle(r, "is_approved")}
            disabled={togglingId === `${r.id}:is_approved`}
            className={r.is_approved ? "text-adm-green" : undefined}
          />
          <button
            type="button"
            onClick={() => setEditing(toReviewForm(r))}
            className="rounded-adm-sm px-2 py-1 text-[12px] font-semibold text-adm-ink-2 hover:bg-adm-line-2"
          >
            Düzenle
          </button>
          <IconButton icon={Trash2} label="Sil" size="sm" onClick={() => setDeleting(r)} className="hover:bg-adm-rose-soft hover:text-adm-rose" />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Değerlendirmeler"
        description="Onaylı yorumlar hem bölge sayfalarında görünür hem de Google'a yıldız verisi olarak gönderilir."
      />

      <StatStrip
        items={[
          {
            label: "Ortalama puan",
            value: (
              <span className="inline-flex items-center gap-2">
                {stats.value?.toFixed(1) ?? "—"}
                <Stars rating={stats.value ? Math.round(stats.value) : 0} />
              </span>
            ),
          },
          { label: "Onaylı yorum", value: stats.count },
          { label: "Onay bekleyen", value: counts.pending, warn: counts.pending > 0 },
          { label: "Öne çıkan", value: counts.featured },
        ]}
      />

      <div
        className={cx(
          "mb-5 flex items-start gap-2.5 rounded-adm border px-4 py-3",
          enoughForStars ? "border-[#bfe3cb] bg-adm-green-soft" : "border-adm-amber-line bg-adm-amber-soft"
        )}
      >
        {enoughForStars ? (
          <CheckCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-green" />
        ) : (
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
        )}
        <p className="text-[12.5px] leading-relaxed text-adm-ink-2">
          {enoughForStars ? (
            <>
              <b>{stats.count} onaylı yorum</b> ile Google&apos;a yıldız verisi gönderiliyor ({stats.value?.toFixed(1)} / 5).
              Google&apos;ın bunu arama sonucunda göstermesi birkaç hafta sürebilir ve garanti değildir.
            </>
          ) : (
            <>
              Yıldızların arama sonuçlarında çıkabilmesi için en az <b>{MIN_REVIEWS_FOR_SCHEMA} onaylı yorum</b> gerekiyor —
              şu an {stats.count} var. Bu sayının altında yıldız verisi hiç gönderilmiyor.
            </>
          )}
        </p>
      </div>

      <Tabs
        label="Değerlendirme listesi"
        value={tab}
        onChange={setTab}
        items={[
          { key: "pending", label: "Onay bekleyen", count: counts.pending, tone: counts.pending ? "warn" : "neutral" },
          { key: "approved", label: "Yayında", count: counts.approved },
          { key: "featured", label: "Öne çıkan", count: counts.featured },
          { key: "all", label: "Tümü" },
        ]}
      />
      <Toolbar
        end={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] bg-adm-ink px-[13px] text-[13px] font-semibold text-white hover:bg-adm-ink-hover"
          >
            <Plus size={16} aria-hidden="true" />
            Yorum ekle
          </button>
        }
      >
        <SearchInput value={q} onChange={setQ} placeholder="Yorum veya isim ara…" />
        <FilterSelect
          label="Bölge"
          value={regionFilter}
          onChange={setRegionFilter}
          options={[{ value: "", label: "Tümü" }, ...regions.map((r) => ({ value: r.id, label: r.name_tr || r.name_en || r.slug }))]}
        />
      </Toolbar>

      <DataGrid
        label="Değerlendirmeler"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState compact icon={Star} title="Bu filtreyle değerlendirme yok" />}
      />

      {(creating || editing) && (
        <ReviewFormDialog
          initial={editing ?? emptyReviewForm}
          regions={regions}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Değerlendirmeyi sil"
        message="Bu değerlendirme kalıcı olarak silinecek."
        confirmLabel="Sil"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
