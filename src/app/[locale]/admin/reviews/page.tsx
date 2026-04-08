import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsManager from "@/components/admin/ReviewsManager";

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, customers(first_name, last_name, email), reservations(reservation_code)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Değerlendirmeler</h1>
      <ReviewsManager initialReviews={reviews ?? []} />
    </div>
  );
}
