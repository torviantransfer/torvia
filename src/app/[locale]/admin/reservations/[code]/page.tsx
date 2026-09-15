import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadReservationDetail } from "@/lib/adminReservationsData";
import ReservationDetailPage from "@/components/admin/reservations/ReservationDetailPage";

// Assigning a driver or editing the booking calls router.refresh(), so this
// must never be served from a prerender.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `${decodeURIComponent(code)} — TORVIAN Admin` };
}

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const detail = await loadReservationDetail(createAdminClient(), decodeURIComponent(code));
  if (!detail) notFound();

  return <ReservationDetailPage detail={detail} adminBase={`/${locale}/admin`} />;
}
