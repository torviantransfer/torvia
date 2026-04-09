import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import DriverPanel from "@/components/driver/DriverPanel";

export default async function DriverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const supabase = createAdminClient();
  const { token } = await params;

  // Find assignment by token
  const { data: assignment } = await supabase
    .from("driver_assignments")
    .select(
      `*,
       drivers(full_name, phone),
       vehicles(plate_number, brand, model),
       reservations(
         reservation_code, trip_type, pickup_datetime, return_datetime,
         flight_code, adults, children, luggage_count, child_seat,
         welcome_sign, welcome_name, hotel_name, hotel_address, notes,
         status, qr_code_token,
         customers(first_name, last_name, phone, email),
         regions(name_en, name_tr, distance_km, duration_minutes)
       )`
    )
    .eq("link_token", token)
    .single();

  if (!assignment) {
    notFound();
  }

  // Expire link 2 hours after transfer completion
  if (assignment.status === "completed" && assignment.completed_at) {
    const completedAt = new Date(assignment.completed_at).getTime();
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    if (now - completedAt > twoHours) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-5xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
              <p className="text-gray-500 text-sm mb-6">
                This driver link has expired. Transfer links are automatically
                deactivated 2 hours after the transfer is completed.
              </p>
              <div className="text-xs text-gray-400">
                TORVIAN VIP Transfer
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            TORVIAN
          </h1>
          <p className="text-sm text-gray-400">Driver Panel</p>
        </div>

        <DriverPanel
          assignment={JSON.parse(JSON.stringify(assignment))}
          token={token}
        />
      </div>
    </div>
  );
}
