import { createAdminClient } from "@/lib/supabase/admin";
import LandingManager, { type LandingRow } from "@/components/admin/LandingManager";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const supabase = createAdminClient();

  // Drafts included: a page is written over several sessions and is only
  // published once its seven languages are filled in, so hiding unpublished
  // rows would hide most of the work.
  const { data: pages } = await supabase.from("landing_pages").select("*").order("updated_at", { ascending: false });

  return <LandingManager initialPages={(pages ?? []) as LandingRow[]} />;
}
