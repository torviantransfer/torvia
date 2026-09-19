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
         *,
         customers(first_name, last_name, phone, email),
         regions(name_en, name_tr, distance_km, duration_minutes)
       )`
    )
    .eq("link_token", token)
    .single();

  if (!assignment) {
    notFound();
  }

  // The driver link is single-use for operations: once the transfer is completed,
  // the panel is no longer available.
  if (assignment.status === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F7] px-4">
        <div className="w-full max-w-sm rounded-[22px] bg-white p-8 text-center ring-1 ring-black/[0.04]">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#34C759] text-2xl text-white">✓</div>
          <h1 className="mb-1.5 text-[22px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">Transfer tamamlandı</h1>
          <p className="text-[15px] text-[#6e6e73]">Bu şoför linki tamamlanan transfer için artık kullanılamaz.</p>
          <p className="mt-6 text-[12px] font-semibold tracking-[0.2em] text-[#c7c7cc]">TORVIAN</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="mx-auto max-w-xl px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <DriverPanel
          assignment={JSON.parse(JSON.stringify(assignment))}
          token={token}
        />
      </div>
    </div>
  );
}
