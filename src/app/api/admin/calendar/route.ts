import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVE_STATUSES = ["pending", "paid", "driver_assigned", "passenger_picked_up", "completed", "cancel_requested"];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate   = new Date(year, month, 1).toISOString();

  const admin = createAdminClient();

  const SELECT = "id, reservation_code, status, pickup_datetime, return_datetime, trip_type, total_price, hotel_name, adults, children, customers(first_name, last_name, phone), regions(name_en), vehicle_categories(name), driver_assignments(drivers(full_name))";

  // Fetch outbound reservations in this month
  const { data: outboundData } = await admin
    .from("reservations")
    .select(SELECT)
    .gte("pickup_datetime", startDate)
    .lt("pickup_datetime", endDate)
    .in("status", ACTIVE_STATUSES)
    .order("pickup_datetime", { ascending: true });

  // Fetch return-leg reservations whose return_datetime falls in this month
  const { data: returnData } = await admin
    .from("reservations")
    .select(SELECT)
    .gte("return_datetime", startDate)
    .lt("return_datetime", endDate)
    .not("return_datetime", "is", null)
    .in("status", ACTIVE_STATUSES)
    .order("return_datetime", { ascending: true });

  const toEvent = (r: Record<string, unknown>, leg: "outbound" | "return") => {
    const customer  = Array.isArray(r.customers) ? r.customers[0] : r.customers as Record<string, string> | null;
    const region    = Array.isArray(r.regions) ? r.regions[0] : r.regions as Record<string, string> | null;
    const vehicle   = Array.isArray(r.vehicle_categories) ? r.vehicle_categories[0] : r.vehicle_categories as Record<string, string> | null;
    const assignment = (r.driver_assignments as Array<Record<string, unknown>> | null)?.[0];
    const driver    = assignment ? (Array.isArray(assignment.drivers) ? assignment.drivers[0] : assignment.drivers) as Record<string, string> | null : null;

    const pickupDatetime = leg === "return" ? String(r.return_datetime) : String(r.pickup_datetime);
    const regionName = region?.name_en ?? "";
    const route = leg === "return"
      ? `${regionName} → Antalya Havalimanı`
      : `Antalya Havalimanı → ${regionName}`;

    return {
      id: `${r.id as string}-${leg}`,
      reservationId: r.id as string,
      code: r.reservation_code as string,
      status: r.status as string,
      pickup: pickupDatetime,
      returnDate: r.return_datetime as string | null,
      tripType: r.trip_type as string,
      leg,
      route,
      price: r.total_price as number,
      hotel: r.hotel_name as string | null,
      adults: r.adults as number,
      children: r.children as number,
      customer: customer ? `${customer.first_name} ${customer.last_name}` : "",
      phone: customer?.phone ?? "",
      region: regionName,
      vehicle: vehicle?.name ?? "",
      driver: driver?.full_name ?? "",
    };
  };

  // Build events — deduplicate: if same reservation appears in both queries (pickup & return same month), include both legs
  const outboundIds = new Set((outboundData ?? []).map(r => r.id));
  const events = [
    ...(outboundData ?? []).map(r => toEvent(r as unknown as Record<string, unknown>, "outbound")),
    ...(returnData ?? [])
      .filter(r => r.trip_type === "round_trip") // only round trips have a return leg
      .map(r => toEvent(r as unknown as Record<string, unknown>, "return")),
  ].sort((a, b) => new Date(a.pickup).getTime() - new Date(b.pickup).getTime());

  // Suppress unused variable warning
  void outboundIds;

  return NextResponse.json({ events, year, month });
}
