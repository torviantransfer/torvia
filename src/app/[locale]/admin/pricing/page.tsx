import { createAdminClient } from "@/lib/supabase/admin";
import PricingManager from "@/components/admin/PricingManager";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const supabase = createAdminClient();

  const { data: pricing } = await supabase
    .from("pricing")
    .select("*, one_way_cash_price, round_trip_cash_price, cash_deposit_amount, regions(slug, name_en, name_tr, sort_order), vehicle_categories(name, slug)")
    .order("one_way_price", { ascending: true });

  const { data: regions } = await supabase
    .from("regions")
    .select("id, slug, name_en")
    .eq("is_active", true)
    .order("sort_order");

  // Ordered like the booking flow orders them, so the tabs here read in the
  // same order as the cards the customer picks between.
  const { data: categories } = await supabase
    .from("vehicle_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <PricingManager
      initialPricing={pricing ?? []}
      regions={regions ?? []}
      categories={categories ?? []}
    />
  );
}
