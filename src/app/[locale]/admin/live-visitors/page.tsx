import LiveVisitors from "@/components/admin/LiveVisitors";
import AdminDashboardCharts from "@/components/admin/AdminDashboardCharts";

/**
 * The booking charts that used to open the panel sit under the live view until
 * this screen gets its Canlı / Analitik tabs.
 */
export default function LiveVisitorsPage() {
  return (
    <>
      <LiveVisitors />
      <AdminDashboardCharts />
    </>
  );
}
