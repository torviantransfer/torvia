"use client";

import { useState } from "react";
import { DollarSign, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
}

interface Payment {
  id: string;
  driver_id: string;
  reservation_id: string | null;
  type: "earning" | "payment" | "adjustment";
  amount: number;
  description: string | null;
  created_at: string;
  drivers: { full_name: string } | null;
  reservations: { reservation_code: string } | null;
}

interface Balance {
  earnings: number;
  payments: number;
  adjustments: number;
  balance: number;
}

interface Props {
  drivers: Driver[];
  payments: Payment[];
  balances: Record<string, Balance>;
}

export default function DriverPayments({ drivers, payments, balances }: Props) {
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    driverId: "",
    type: "payment" as "earning" | "payment" | "adjustment",
    amount: "",
    description: "",
  });

  const filteredPayments =
    selectedDriver === "all"
      ? payments
      : payments.filter((p) => p.driver_id === selectedDriver);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/driver-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: formData.driverId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
      }),
    });
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <div>
      {/* Driver balance cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {drivers.map((d) => {
          const b = balances[d.id] ?? {
            earnings: 0,
            payments: 0,
            adjustments: 0,
            balance: 0,
          };
          return (
            <div
              key={d.id}
              className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer transition-all ${
                selectedDriver === d.id
                  ? "border-orange-500 ring-2 ring-orange-200"
                  : "border-gray-100 hover:border-gray-200"
              }`}
              onClick={() =>
                setSelectedDriver(selectedDriver === d.id ? "all" : d.id)
              }
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{d.full_name}</h3>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${d.is_active ? "bg-green-500" : "bg-gray-300"}`}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Kazanç</span>
                  <span className="text-green-600 font-medium">
                    +${b.earnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ödenen</span>
                  <span className="text-red-600 font-medium">
                    -${b.payments.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">Bakiye</span>
                  <span
                    className={`font-bold text-lg ${b.balance >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    ${b.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add payment button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-900">İşlem Geçmişi</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-slate-800"
        >
          <Plus size={14} />
          İşlem Ekle
        </button>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <select
              value={formData.driverId}
              onChange={(e) =>
                setFormData({ ...formData, driverId: e.target.value })
              }
              required
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">Şoför Seçin</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "earning" | "payment" | "adjustment",
                })
              }
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
            >
              <option value="earning">Kazanç</option>
              <option value="payment">Şoföre Ödeme</option>
              <option value="adjustment">Düzeltme</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="Tutar ($)"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Açıklama"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
          >
            İşlemi Kaydet
          </button>
        </form>
      )}

      {/* Transaction list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 font-medium text-gray-500">Tarih</th>
              <th className="px-5 py-3 font-medium text-gray-500">Şoför</th>
              <th className="px-5 py-3 font-medium text-gray-500">Tür</th>
              <th className="px-5 py-3 font-medium text-gray-500">Ref</th>
              <th className="px-5 py-3 font-medium text-gray-500">
                Açıklama
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-right">
                Tutar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500">
                  {new Date(p.created_at).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-5 py-3 font-medium">
                  {p.drivers?.full_name}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.type === "earning"
                        ? "bg-green-100 text-green-700"
                        : p.type === "payment"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.type === "earning" ? (
                      <TrendingUp size={10} />
                    ) : p.type === "payment" ? (
                      <TrendingDown size={10} />
                    ) : (
                      <Minus size={10} />
                    )}
                    {p.type}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-gray-400">
                  {p.reservations?.reservation_code ?? "—"}
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {p.description || "—"}
                </td>
                <td
                  className={`px-5 py-3 font-bold text-right ${
                    p.type === "earning" || p.type === "adjustment"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {p.type === "earning" || p.type === "adjustment"
                    ? "+"
                    : "-"}
                  ${p.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-gray-400"
                >
                  İşlem bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
