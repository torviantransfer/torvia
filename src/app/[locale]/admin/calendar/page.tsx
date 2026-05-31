import AdminCalendarAvailability from "@/components/admin/AdminCalendarAvailability";

export default function AdminCalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Takvim & Kapasite</h1>
        <p className="text-sm text-slate-500 mt-1">Tüm transferleri takip edin, günleri kapatın.</p>
      </div>
      <AdminCalendarAvailability />
    </div>
  );
}
