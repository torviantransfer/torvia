import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsScreen, { type AdminReview, type ReviewRegion } from "@/components/admin/reviews/ReviewsScreen";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();

  const [{ data: reviews }, { data: regions }] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, customers(first_name, last_name, email), reservations(reservation_code)")
      .order("created_at", { ascending: false }),
    supabase.from("regions").select("id, slug, name_tr, name_en").eq("is_active", true).order("sort_order"),
  ]);

  return <ReviewsScreen reviews={(reviews ?? []) as AdminReview[]} regions={(regions ?? []) as ReviewRegion[]} />;
}
