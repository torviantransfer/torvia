"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  customers: { first_name: string; last_name: string; email: string } | null;
  reservations: { reservation_code: string } | null;
}

interface Props {
  initialReviews: Review[];
}

export default function ReviewsManager({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  const handleToggleApproval = async (id: string) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "reviews",
        action: "toggle",
        id,
        data: { field: "is_approved" },
      }),
    });
    const result = await res.json();
    if (result.data) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_approved: result.data.is_approved } : r
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu değerlendirmeyi silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "reviews", action: "delete", id }),
    });
    const result = await res.json();
    if (result.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? `Tümü (${reviews.length})`
              : f === "pending"
                ? `Bekleyen (${reviews.filter((r) => !r.is_approved).length})`
                : `Onaylı (${reviews.filter((r) => r.is_approved).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((review) => (
          <div
            key={review.id}
            className={`bg-white rounded-xl border p-5 ${
              review.is_approved
                ? "border-green-100"
                : "border-yellow-100"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={
                          s <= review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      review.is_approved
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {review.is_approved ? "Onaylı" : "Bekliyor"}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 mb-2">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    {review.customers
                      ? `${review.customers.first_name} ${review.customers.last_name}`
                      : "Anonim"}
                  </span>
                  {review.reservations && (
                    <span className="font-mono">
                      {review.reservations.reservation_code}
                    </span>
                  )}
                  <span>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => handleToggleApproval(review.id)}
                  className={`p-2 rounded-lg ${
                    review.is_approved
                      ? "hover:bg-yellow-50 text-yellow-600"
                      : "hover:bg-green-50 text-green-600"
                  }`}
                  title={review.is_approved ? "Onayı Kaldır" : "Onayla"}
                >
                  {review.is_approved ? (
                    <XCircle size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Henüz değerlendirme yok {filter !== "all" ? `(${filter === "pending" ? "bekleyen" : "onaylı"})` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
