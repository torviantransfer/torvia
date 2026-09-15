import CapacityCalendar from "@/components/admin/calendar/CapacityCalendar";

/** The same screen as /admin/availability; kept so old links still work. */
export default async function AdminCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CapacityCalendar adminBase={`/${locale}/admin`} />;
}
