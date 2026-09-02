import { createAdminClient } from "@/lib/supabase/admin";
import SeoManager, { type SeoPageRow, type RegionRow } from "@/components/admin/SeoManager";

export default async function AdminSeoPage() {
  const supabase = createAdminClient();

  const [{ data: pages }, { data: regions }] = await Promise.all([
    supabase.from("seo_pages").select("*").order("sort_order"),
    supabase.from("regions").select("*").order("sort_order"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ana sayfa, landing ve statik sayfalar ile bölge sayfalarının arama görünümü. Boş
          bırakılan alanlar sitenin mevcut değerlerini kullanmaya devam eder.
        </p>
      </div>
      <SeoManager
        initialPages={(pages ?? []) as SeoPageRow[]}
        initialRegions={(regions ?? []) as RegionRow[]}
      />
    </div>
  );
}
