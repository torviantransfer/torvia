import { createAdminClient } from "@/lib/supabase/admin";
import LandingManager, { type LandingRow } from "@/components/admin/LandingManager";

export default async function AdminLandingPage() {
  const supabase = createAdminClient();

  // Drafts included: a page is written over several sessions and is only
  // published once its seven languages are filled in, so hiding unpublished
  // rows would hide most of the work.
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Landing Sayfaları</h1>
      <p className="text-sm text-gray-500 mb-6">
        Kod değişikliği ve deploy olmadan yeni satış sayfası oluşturun. SEO alanları aynı ekranda;
        sayfa yayınlandığında site haritasına da girer.
      </p>
      <LandingManager initialPages={(pages ?? []) as LandingRow[]} />
    </div>
  );
}
