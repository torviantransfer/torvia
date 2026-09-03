import AdminCalendarAvailability from "@/components/admin/AdminCalendarAvailability";

export default function AdminAvailabilityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Takvim & Kapasite</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bir güne tıklayarak o günün kapasitesini elle belirleyin (3, 4, 5, 6…), günü tamamen kapatın veya varsayılana döndürün.
        </p>
      </div>
      <AdminCalendarAvailability />
    </div>
  );
}
