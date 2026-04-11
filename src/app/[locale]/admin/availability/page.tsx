import DateAvailabilityManager from "@/components/admin/DateAvailabilityManager";

export default function AdminAvailabilityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tarih & Kapasite Yönetimi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tarihleri kapatın, kapasite kontrolü yapın. Dolu tarihlere yeni rezervasyon alınmaz.
        </p>
      </div>
      <DateAvailabilityManager />
    </div>
  );
}
