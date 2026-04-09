import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const admin = createAdminClient();

  let query = admin
    .from("reservations")
    .select(
      "reservation_code, status, trip_type, pickup_datetime, return_datetime, total_price, base_price, night_surcharge, child_seat_fee, welcome_sign_fee, round_trip_discount, coupon_discount, currency, adults, children, luggage_count, hotel_name, flight_code, notes, created_at, customers(first_name, last_name, email, phone), regions(name_en), vehicle_categories(name), driver_assignments(drivers(full_name))"
    )
    .order("pickup_datetime", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("pickup_datetime", from);
  }
  if (to) {
    query = query.lte("pickup_datetime", to + "T23:59:59");
  }

  const { data } = await query;

  const rows = (data ?? []).map((r) => {
    const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    const region = Array.isArray(r.regions) ? r.regions[0] : r.regions;
    const vehicle = Array.isArray(r.vehicle_categories) ? r.vehicle_categories[0] : r.vehicle_categories;
    const assignment = r.driver_assignments?.[0];
    const driver = assignment ? (Array.isArray(assignment.drivers) ? assignment.drivers[0] : assignment.drivers) : null;

    return {
      "Reservation Code": r.reservation_code,
      "Status": r.status,
      "Trip Type": r.trip_type,
      "Pickup Date": r.pickup_datetime ? new Date(r.pickup_datetime).toLocaleString("en-GB") : "",
      "Return Date": r.return_datetime ? new Date(r.return_datetime).toLocaleString("en-GB") : "",
      "Customer Name": customer ? `${(customer as { first_name: string }).first_name} ${(customer as { last_name: string }).last_name}` : "",
      "Email": (customer as { email?: string })?.email ?? "",
      "Phone": (customer as { phone?: string })?.phone ?? "",
      "Region": (region as { name_en?: string })?.name_en ?? "",
      "Vehicle": (vehicle as { name?: string })?.name ?? "",
      "Driver": (driver as { full_name?: string })?.full_name ?? "",
      "Adults": r.adults,
      "Children": r.children,
      "Luggage": r.luggage_count,
      "Hotel": r.hotel_name ?? "",
      "Flight Code": r.flight_code ?? "",
      "Base Price": r.base_price,
      "Night Surcharge": r.night_surcharge,
      "Child Seat Fee": r.child_seat_fee,
      "Welcome Sign Fee": r.welcome_sign_fee,
      "Round Trip Discount": r.round_trip_discount,
      "Coupon Discount": r.coupon_discount,
      "Total Price": r.total_price,
      "Currency": r.currency,
      "Notes": (r.notes ?? "").replace(/"/g, '""'),
      "Booking Date": r.created_at ? new Date(r.created_at).toLocaleString("en-GB") : "",
    };
  });

  if (rows.length === 0) {
    return new NextResponse("No data", { status: 204 });
  }

  const headers = Object.keys(rows[0]);

  if (format === "csv") {
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => {
          const val = String(row[h as keyof typeof row] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val}"`
            : val;
        }).join(",")
      ),
    ];
    const csv = csvLines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="TORVIAN-reservations-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Excel XML format (opens in Excel without extra libraries)
  const xmlRows = rows.map((row) =>
    `<Row>${headers.map((h) => {
      const val = row[h as keyof typeof row];
      const isNum = typeof val === "number";
      return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${isNum ? val : escapeXml(String(val ?? ""))}</Data></Cell>`;
    }).join("")}</Row>`
  ).join("\n");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Reservations">
<Table>
<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}</Row>
${xmlRows}
</Table>
</Worksheet>
</Workbook>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="TORVIAN-reservations-${new Date().toISOString().slice(0, 10)}.xls"`,
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
