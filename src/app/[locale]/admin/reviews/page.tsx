import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsManager, {
  type AdminReview,
  type ReviewRegion,
} from "@/components/admin/ReviewsManager";

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();

  const [{ data: reviews }, { data: regions }] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, customers(first_name, last_name, email), reservations(reservation_code)")
      .order("created_at", { ascending: false }),
    supabase
      .from("regions")
      .select("id, slug, name_tr, name_en")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Değerlendirmeler</h1>
        <p className="text-sm text-gray-500 mt-1">
          Onaylı yorumlar hem bölge sayfalarında görünür hem de Google&apos;a yıldız verisi
          olarak gönderilir.
        </p>
      </div>
      <ReviewsManager
        initialReviews={(reviews ?? []) as AdminReview[]}
        regions={(regions ?? []) as ReviewRegion[]}
      />
    </div>
  );
}
