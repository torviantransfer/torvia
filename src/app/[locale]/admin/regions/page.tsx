import { createAdminClient } from "@/lib/supabase/admin";
import RegionsScreen from "@/components/admin/regions/RegionsScreen";

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  const supabase = createAdminClient();
  const { data: regions } = await supabase.from("regions").select("*").order("sort_order");
  return <RegionsScreen regions={regions ?? []} />;
}
