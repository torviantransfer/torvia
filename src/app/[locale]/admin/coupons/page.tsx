import { createAdminClient } from "@/lib/supabase/admin";
import CouponsScreen from "@/components/admin/coupons/CouponsScreen";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const supabase = createAdminClient();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponsScreen coupons={coupons ?? []} />;
}
