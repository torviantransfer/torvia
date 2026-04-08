"use client";

import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";

interface PricingRow {
  id: string;
  region_id: string;
  category_id: string;
  one_way_price: number;
  round_trip_price: number | null;
  currency: string;
  regions: { slug: string; name_en: string; name_tr: string } | null;
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
  const [pricing, setPricing] = useState<PricingRow[]>(initialPricing);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    one_way_price: 0,
    round_trip_price: null as number | null,
  });
  const [loading, setLoading] = useState(false);

  const startEdit = (row: PricingRow) => {
    setEditingId(row.id);
    setEditValues({
      one_way_price: row.one_way_price,
      round_trip_price: row.round_trip_price,
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
              <th className="px-5 py-3 font-medium text-gray-500">#</th>
              <th className="px-5 py-3 font-medium text-gray-500">Bölge</th>
              <th className="px-5 py-3 font-medium text-gray-500">Kategori</th>
              <th className="px-5 py-3 font-medium text-gray-500 text-right">
                Tek Yön ($)
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-right">
                Gidiş-Dönüş ($)
              </th>
              <th className="px-5 py-3 font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pricing.map((row, idx) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-900">
                  {row.regions?.name_en ?? row.region_id}
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {row.vehicle_categories?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  {editingId === row.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.one_way_price}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          one_way_price: parseFloat(e.target.value),
                        })
                      }
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                    />
                  ) : (
                    <span className="font-medium">
                      ${row.one_way_price.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {editingId === row.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.round_trip_price ?? ""}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          round_trip_price: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        })
                      }
                      placeholder="N/A"
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                    />
                  ) : (
                    <span className="font-medium">
                      {row.round_trip_price
                        ? `$${row.round_trip_price.toFixed(2)}`
                        : "—"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSave(row.id)}
                        disabled={loading}
                        className="p-1.5 rounded hover:bg-green-50 text-green-600"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded hover:bg-gray-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(row)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
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
