"use client";

import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";

interface PricingRow {
  id: string;
  region_id: string;
  category_id: string;
  one_way_price: number;
  round_trip_price: number | null;
  one_way_cash_price: number | null;
  round_trip_cash_price: number | null;
  cash_deposit_amount: number | null;
  currency: string;
  regions: { slug: string; name_en: string; name_tr: string; sort_order?: number } | null;
  vehicle_categories: { name: string; slug: string } | null;
}

interface Props {
  initialPricing: PricingRow[];
  regions: { id: string; slug: string; name_en: string }[];
  categories: { id: string; name: string; slug: string }[];
}

export default function PricingManager({
  initialPricing,
  regions,
  categories,
}: Props) {
  const [pricing, setPricing] = useState<PricingRow[]>(
    [...initialPricing].sort((a, b) => {
      const so = (a.regions?.sort_order ?? 999) - (b.regions?.sort_order ?? 999);
      return so !== 0 ? so : (a.regions?.name_en ?? "").localeCompare(b.regions?.name_en ?? "");
    })
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    one_way_price: 0,
    round_trip_price: null as number | null,
    one_way_cash_price: null as number | null,
    round_trip_cash_price: null as number | null,
    cash_deposit_amount: null as number | null,
  });
  const [loading, setLoading] = useState(false);

  const startEdit = (row: PricingRow) => {
    setEditingId(row.id);
    setEditValues({
      one_way_price: row.one_way_price,
      round_trip_price: row.round_trip_price,
      one_way_cash_price: row.one_way_cash_price,
      round_trip_cash_price: row.round_trip_cash_price,
      cash_deposit_amount: row.cash_deposit_amount,
    });
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pricing",
          action: "update",
          id,
          data: {
            one_way_price: editValues.one_way_price,
            round_trip_price: editValues.round_trip_price,
            one_way_cash_price: editValues.one_way_cash_price,
            round_trip_cash_price: editValues.round_trip_cash_price,
            cash_deposit_amount: editValues.cash_deposit_amount,
          },
        }),
      });
      const result = await res.json();
      if (result.data) {
        setPricing((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  one_way_price: result.data.one_way_price,
                  round_trip_price: result.data.round_trip_price,
                  one_way_cash_price: result.data.one_way_cash_price,
                  round_trip_cash_price: result.data.round_trip_cash_price,
                  cash_deposit_amount: result.data.cash_deposit_amount,
                }
              : p
          )
        );
        setEditingId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Tüm fiyatlar USD cinsindendir. {pricing.length} güzergah yapılandırıldı.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">#</th>
              <th className="px-4 py-3 font-medium text-gray-500">Bölge</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right text-blue-700 bg-blue-50/50">Online Tek ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right text-blue-700 bg-blue-50/50">Online G/D ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right text-amber-700 bg-amber-50/50">Nakit Tek ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right text-amber-700 bg-amber-50/50">Nakit G/D ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right text-emerald-700 bg-emerald-50/50">Depozit ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pricing.map((row, idx) => {
              const isEditing = editingId === row.id;
              const numInput = (field: keyof typeof editValues, value: number | null) => (
                <input
                  type="number" step="0.01" min="0"
                  value={value ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                />
              );
              return (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                  {row.regions?.name_en ?? row.region_id}
                </td>
                {/* Online one-way */}
                <td className="px-4 py-3 text-right bg-blue-50/20">
                  {isEditing ? numInput("one_way_price", editValues.one_way_price) : <span className="font-medium text-blue-700">${row.one_way_price.toFixed(0)}</span>}
                </td>
                {/* Online round-trip */}
                <td className="px-4 py-3 text-right bg-blue-50/20">
                  {isEditing ? numInput("round_trip_price", editValues.round_trip_price) : <span className="font-medium text-blue-700">{row.round_trip_price ? `$${row.round_trip_price.toFixed(0)}` : "—"}</span>}
                </td>
                {/* Cash one-way */}
                <td className="px-4 py-3 text-right bg-amber-50/20">
                  {isEditing ? numInput("one_way_cash_price", editValues.one_way_cash_price) : <span className="font-medium text-amber-700">{row.one_way_cash_price ? `$${row.one_way_cash_price.toFixed(0)}` : "—"}</span>}
                </td>
                {/* Cash round-trip */}
                <td className="px-4 py-3 text-right bg-amber-50/20">
                  {isEditing ? numInput("round_trip_cash_price", editValues.round_trip_cash_price) : <span className="font-medium text-amber-700">{row.round_trip_cash_price ? `$${row.round_trip_cash_price.toFixed(0)}` : "—"}</span>}
                </td>
                {/* Deposit */}
                <td className="px-4 py-3 text-right bg-emerald-50/20">
                  {isEditing ? numInput("cash_deposit_amount", editValues.cash_deposit_amount) : <span className="font-medium text-emerald-700">{row.cash_deposit_amount ? `$${row.cash_deposit_amount.toFixed(0)}` : "—"}</span>}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleSave(row.id)} disabled={loading} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Save size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-gray-100"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(row)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 size={14} /></button>
                  )}
                </td>
              </tr>
              );
            })}
            {pricing.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  Henüz fiyatlandırma yapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
