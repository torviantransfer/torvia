import { createAdminClient } from "@/lib/supabase/admin";
import SeoManager from "@/components/admin/SeoManager";

export default async function AdminSeoPage() {
  const supabase = createAdminClient();

  // All three tables that back an indexable page. Regions and posts are read
  // regardless of whether they are live: an unpublished page still has SEO
  // fields worth preparing, and the panel labels it rather than hiding it.
  const [{ data: pages }, { data: regions }, { data: posts }] = await Promise.all([
    supabase.from("seo_pages").select("*").order("sort_order"),
    supabase.from("regions").select("*").order("sort_order"),
    supabase.from("blog_posts").select("*").order("published_at", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ana sayfa, landing ve statik sayfalar, bölgeler ve blog yazıları. Panel her alanın
          yayındaki gerçek değerini sayfanın HTML çıktısından okur — boş görünen bir alan
          &quot;değer yok&quot; anlamına gelmez.
        </p>
      </div>
      <SeoManager
        initialPages={(pages ?? []) as Record<string, unknown>[]}
        initialRegions={(regions ?? []) as Record<string, unknown>[]}
        initialPosts={(posts ?? []) as Record<string, unknown>[]}
      />
    </div>
  );
}
