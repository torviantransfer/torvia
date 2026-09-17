import { createAdminClient } from "@/lib/supabase/admin";
import BookingLeadsScreen from "@/components/admin/booking-leads/BookingLeadsScreen";

export const dynamic = "force-dynamic";

export const metadata = { title: "Yarım Kalan Formlar — TORVIAN Admin" };

export default async function AdminBookingLeadsPage() {
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("booking_leads")
    .select("*")
    .order("created_at", { ascending: false });
  return <BookingLeadsScreen leads={leads ?? []} />;
}
