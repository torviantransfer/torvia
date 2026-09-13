"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Save, X } from "lucide-react";

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

/** Active regions, already ordered by sort_order by the page query. */
interface RegionOption {
  id: string;
  slug: string;
  name_en: string;
}

interface Props {
  initialPricing: PricingRow[];
  regions: RegionOption[];
  categories: { id: string; name: string; slug: string }[];
}

/**
 * One line of the table: a region, and the price row the selected vehicle has
 * there — or null when that vehicle has never been priced for that region.
 */
interface Line {
  regionId: string;
  regionName: string;
  row: PricingRow | null;
}

const emptyValues = {
  one_way_price: 0,
  round_trip_price: null as number | null,
  one_way_cash_price: null as number | null,
  round_trip_cash_price: null as number | null,
  cash_deposit_amount: null as number | null,
};

export default function PricingManager({
  initialPricing,
  regions,
  categories,
}: Props) {
  const [pricing, setPricing] = useState<PricingRow[]>(initialPricing);
  // Prices are keyed (region, vehicle), so the table can only show one vehicle
  // at a time — listing them together repeats every region once per vehicle
  // with nothing on the row saying which price belongs to which.
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ ...emptyValues });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;

  const lines = useMemo<Line[]>(() => {
    const forCategory = pricing.filter((p) => p.category_id === categoryId);
    const byRegion = new Map(forCategory.map((p) => [p.region_id, p]));

    const ordered: Line[] = regions.map((region) => ({
      regionId: region.id,
      regionName: region.name_en,
      row: byRegion.get(region.id) ?? null,
    }));

    // A price attached to a region that is no longer active still exists and is
    // still charged if the region comes back; listing those last keeps them
    // editable instead of hiding them behind the active-region list.
    const listed = new Set(regions.map((r) => r.id));
    for (const row of forCategory) {
      if (listed.has(row.region_id)) continue;
      ordered.push({
        regionId: row.region_id,
        regionName: row.regions?.name_en ?? row.region_id,
        row,
      });
    }
    return ordered;
  }, [pricing, regions, categoryId]);

  const missingCount = lines.filter((l) => !l.row).length;

  const startEdit = (line: Line) => {
    setError(null);
    setEditingKey(line.regionId);
    setEditValues(
      line.row
        ? {
            one_way_price: line.row.one_way_price,
            round_trip_price: line.row.round_trip_price,
            one_way_cash_price: line.row.one_way_cash_price,
            round_trip_cash_price: line.row.round_trip_cash_price,
            cash_deposit_amount: line.row.cash_deposit_amount,
          }
        : { ...emptyValues }
    );
  };

  const handleSave = async (line: Line) => {
    // one_way_price is NOT NULL, so a blank field saves as 0 and the region
    // silently becomes free for this vehicle. Nothing downstream catches that.
    if (!editValues.one_way_price || editValues.one_way_price <= 0) {
      setError("Online tek yön fiyatı zorunlu ve sıfırdan büyük olmalı.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = line.row;
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          existing
            ? { table: "pricing", action: "update", id: existing.id, data: editValues }
            : {
                table: "pricing",
                action: "create",
                data: { ...editValues, region_id: line.regionId, category_id: categoryId },
              }
        ),
      });
      const result = await res.json();
      if (!result.data) {
        setError(result.error ?? "Kaydedilemedi");
        return;
      }
      setPricing((prev) =>
        existing
          ? prev.map((p) => (p.id === existing.id ? { ...p, ...result.data } : p))
          : [
              ...prev,
              {
                ...(result.data as PricingRow),
                regions: { slug: "", name_en: line.regionName, name_tr: line.regionName },
                vehicle_categories: activeCategory
                  ? { name: activeCategory.name, slug: activeCategory.slug }
                  : null,
              },
            ]
      );
      setEditingKey(null);
    } catch {
      setError("Kaydedilemedi");
    } finally {
      setLoading(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-8 text-center text-gray-400">
        Önce <span className="font-medium text-gray-600">Araç Tipleri</span> sayfasından bir araç ekleyin.
      </div>
    );
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryId(cat.id);
                setEditingKey(null);
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                cat.id === categoryId
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">
        <span className="font-medium text-gray-700">{activeCategory?.name}</span>{" "}
        fiyatları — tümü USD cinsindendir. {lines.length - missingCount} güzergah yapılandırıldı
        {missingCount > 0 && (
          <span className="text-amber-600">, {missingCount} güzergahta fiyat yok</span>
        )}
        .
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-start">
              <th className="px-4 py-3 font-medium text-gray-500">#</th>
              <th className="px-4 py-3 font-medium text-gray-500">Bölge</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-end text-blue-700 bg-blue-50/50">Online Tek ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-end text-blue-700 bg-blue-50/50">Online G/D ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-end text-amber-700 bg-amber-50/50">Nakit Tek ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-end text-amber-700 bg-amber-50/50">Nakit G/D ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-end text-emerald-700 bg-emerald-50/50">Depozit ($)</th>
              <th className="px-4 py-3 font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((line, idx) => {
              const isEditing = editingKey === line.regionId;
              const row = line.row;
              const numInput = (field: keyof typeof editValues, value: number | null) => (
                <input
                  type="number" step="0.01" min="0"
                  value={value ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-end"
                />
              );
              const money = (value: number | null | undefined, tone: string) =>
                value != null ? (
                  <span className={`font-medium ${tone}`}>${value.toFixed(0)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                );
              return (
              <tr key={line.regionId} className={`hover:bg-gray-50 ${!row && !isEditing ? "bg-amber-50/30" : ""}`}>
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                  {line.regionName}
                  {!row && !isEditing && (
                    <span className="ms-2 text-xs font-normal text-amber-600">fiyat yok</span>
                  )}
                </td>
                {/* Online one-way */}
                <td className="px-4 py-3 text-end bg-blue-50/20">
                  {isEditing ? numInput("one_way_price", editValues.one_way_price) : money(row?.one_way_price, "text-blue-700")}
                </td>
                {/* Online round-trip */}
                <td className="px-4 py-3 text-end bg-blue-50/20">
                  {isEditing ? numInput("round_trip_price", editValues.round_trip_price) : money(row?.round_trip_price, "text-blue-700")}
                </td>
                {/* Cash one-way */}
                <td className="px-4 py-3 text-end bg-amber-50/20">
                  {isEditing ? numInput("one_way_cash_price", editValues.one_way_cash_price) : money(row?.one_way_cash_price, "text-amber-700")}
                </td>
                {/* Cash round-trip */}
                <td className="px-4 py-3 text-end bg-amber-50/20">
                  {isEditing ? numInput("round_trip_cash_price", editValues.round_trip_cash_price) : money(row?.round_trip_cash_price, "text-amber-700")}
                </td>
                {/* Deposit */}
                <td className="px-4 py-3 text-end bg-emerald-50/20">
                  {isEditing ? numInput("cash_deposit_amount", editValues.cash_deposit_amount) : money(row?.cash_deposit_amount, "text-emerald-700")}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleSave(line)} disabled={loading} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Save size={14} /></button>
                      <button onClick={() => setEditingKey(null)} className="p-1.5 rounded hover:bg-gray-100"><X size={14} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(line)}
                      title={row ? "Düzenle" : "Fiyat ekle"}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      {row ? <Edit2 size={14} /> : <Plus size={14} className="text-amber-600" />}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
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
