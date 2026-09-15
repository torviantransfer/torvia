import CapacityCalendar from "@/components/admin/calendar/CapacityCalendar";

export default async function AdminAvailabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CapacityCalendar adminBase={`/${locale}/admin`} />;
}
