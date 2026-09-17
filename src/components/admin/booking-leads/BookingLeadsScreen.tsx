"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, Trash2 } from "lucide-react";
import { ConfirmDialog, DataGrid, EmptyState, PageHeader, RowActions, useToast, type GridColumn } from "@/components/admin/ui";

export interface BookingLeadRow {
  id: string;
  phone: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  region_slug: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  party_size: number | null;
  locale: string | null;
  created_at: string;
}

const name = (l: BookingLeadRow) => [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";

/**
 * Passenger-info forms someone started and never finished — see migration
 * 106. Read-only besides deleting: there is nothing to edit here, only a
 * phone/email to act on and, once it has been, a row worth clearing out.
 */
export default function BookingLeadsScreen({ leads }: { leads: BookingLeadRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState<BookingLeadRow | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "booking_leads", action: "delete", id: deleting.id }),
    });
    setBusy(false);
    const result = await res.json().catch(() => null);
    if (res.ok && result?.success) {
      toast("Silindi.");
      setDeleting(null);
      router.refresh();
    } else {
      toast(result?.error ?? "Silinemedi.", "error");
    }
  };

  const columns: GridColumn<BookingLeadRow>[] = [
    {
      key: "when",
      header: "Tarih",
      width: "140px",
      area: "top-start",
      cell: (l) => (
        <span className="text-[13px] text-adm-ink-2">
          {new Date(l.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    { key: "name", header: "Ad", width: "minmax(120px,1fr)", area: "body", cell: (l) => <span className="font-semibold text-[13.5px]">{name(l)}</span> },
    {
      key: "contact",
      header: "İletişim",
      width: "minmax(140px,1fr)",
      area: "foot-start",
      cell: (l) => (
        <span className="text-[13px] text-adm-ink-2">
          {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="font-mono hover:underline">{l.phone}</a>}
          {l.phone && l.email && " · "}
          {l.email && <span className="font-mono">{l.email}</span>}
        </span>
      ),
    },
    {
      key: "trip",
      header: "Güzergah / Tarih",
      width: "minmax(140px,1fr)",
      area: "foot-end",
      cell: (l) => (
        <span className="text-[13px] text-adm-ink-2">
          {l.region_slug ?? "—"}
          {l.pickup_date ? ` · ${l.pickup_date}` : ""}
          {l.pickup_time ? ` ${l.pickup_time}` : ""}
          {l.party_size ? ` · ${l.party_size} kişi` : ""}
        </span>
      ),
    },
    {
      // Not `wideOnly`: that hides the column below 1180px, and deleting a row
      // once its number is in WhatsApp is the whole point of this screen — it
      // has to stay reachable on the phone the number was saved on. `top-end`
      // puts it in the card's top-right corner once the row reflows.
      key: "actions",
      header: "",
      width: "56px",
      area: "top-end",
      cell: (l) => (
        <RowActions>
          <button type="button" onClick={() => setDeleting(l)} aria-label="Sil" title="Sil" className="grid size-7 place-items-center rounded-adm-sm text-adm-rose hover:bg-adm-rose-soft">
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Yarım Kalan Formlar" />
      <DataGrid
        label="Yarım kalan formlar"
        columns={columns}
        rows={leads}
        rowKey={(l) => l.id}
        empty={<EmptyState compact icon={PhoneCall} title="Kayıt yok" />}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Kaydı sil"
        message={deleting ? `${name(deleting)} (${deleting.phone ?? deleting.email}) kalıcı olarak silinecek.` : ""}
        confirmLabel="Sil"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
