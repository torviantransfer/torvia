import VisitorsScreen from "@/components/admin/visitors/VisitorsScreen";

export default async function LiveVisitorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab } = await searchParams;
  return <VisitorsScreen initialTab={tab === "analitik" ? "analytics" : "live"} />;
}
