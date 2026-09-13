"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Save, Wand2, X } from "lucide-react";
import {
  ADJUSTABLE_FIELDS,
  adjustFields,
  adjustProblem,
  type AdjustField,
  type AdjustMode,
  type PriceFields,
} from "@/lib/priceAdjust";

const FIELD_LABELS: Record<AdjustField, string> = {
  one_way_price: "Online tek yön",
  round_trip_price: "Online gidiş/dönüş",
  one_way_cash_price: "Nakit tek yön",
  round_trip_cash_price: "Nakit gidiş/dönüş",
  cash_deposit_amount: "Depozito",
};

// Everything a customer is quoted. The deposit is left out because it is a
// fixed hold rather than a fare — marking a vehicle up by $20 should not also
// raise what the passenger pays online before the trip.
const DEFAULT_FIELDS: AdjustField[] = [
  "one_way_price",
  "round_trip_price",
  "one_way_cash_price",
  "round_trip_cash_price",
];

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

  // ── Bulk adjustment ──
  const [bulkOpen, setBulkOpen] = useState(false);
  /** "" means "this vehicle's own current prices". */
  const [bulkSource, setBulkSource] = useState("");
  const [bulkSign, setBulkSign] = useState<1 | -1>(1);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkMode, setBulkMode] = useState<AdjustMode>("amount");
  const [bulkFields, setBulkFields] = useState<AdjustField[]>(DEFAULT_FIELDS);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

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

  const bulkNumber = bulkValue.trim() === "" ? NaN : Number(bulkValue) * bulkSign;
  const bulkSourceId = bulkSource || categoryId;

  /**
   * What every row would become, keyed by region — or null while the form is
   * incomplete. Rendered into the table rather than a separate dialog: a list
   * of 24 prices is only checkable next to the prices it replaces.
   *
   * Computed with the same helpers the route uses, so this is a rendering of
   * the pending write rather than a second opinion about it.
   */
  const preview = useMemo<Map<string, PriceFields> | null>(() => {
    if (!bulkOpen || !Number.isFinite(bulkNumber) || bulkFields.length === 0) return null;
    if (bulkNumber === 0 && bulkSourceId === categoryId) return null;
    const out = new Map<string, PriceFields>();
    for (const row of pricing) {
      if (row.category_id !== bulkSourceId) continue;
      out.set(
        row.region_id,
        adjustFields(row as PriceFields, { mode: bulkMode, value: bulkNumber, fields: bulkFields })
      );
    }
    return out;
  }, [bulkOpen, bulkNumber, bulkMode, bulkFields, bulkSourceId, categoryId, pricing]);

  const previewProblem = useMemo(() => {
    if (!preview) return null;
    for (const fields of preview.values()) {
      const problem = adjustProblem(fields, bulkFields);
      if (problem) return problem;
    }
    return null;
  }, [preview, bulkFields]);

  const toggleField = (field: AdjustField) => {
    setBulkFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const applyBulk = async () => {
    if (!preview || previewProblem) return;
    setLoading(true);
    setError(null);
    setBulkNotice(null);
    try {
      const res = await fetch("/api/admin/pricing/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          sourceCategoryId: bulkSourceId,
          mode: bulkMode,
          value: bulkNumber,
          fields: bulkFields,
        }),
      });
      const result = await res.json();
      if (!Array.isArray(result.data)) {
        setError(result.error ?? "Toplu güncelleme yapılamadı");
        return;
      }

      // Swap in the rows that came back, keyed by region rather than by id:
      // the write creates rows for regions this vehicle did not have, so
      // patching by id would drop exactly the rows being added. Regions the
      // write did not touch — ones the source vehicle has no price for — keep
      // the row they already had instead of disappearing from the table.
      const written = result.data as PricingRow[];
      const writtenRegions = new Set(written.map((row) => row.region_id));
      const regionName = (regionId: string) =>
        regions.find((r) => r.id === regionId)?.name_en
        ?? pricing.find((p) => p.region_id === regionId)?.regions?.name_en
        ?? regionId;
      setPricing((prev) => [
        ...prev.filter((p) => p.category_id !== categoryId || !writtenRegions.has(p.region_id)),
        ...written.map((row) => ({
          ...row,
          regions: { slug: "", name_en: regionName(row.region_id), name_tr: regionName(row.region_id) },
          vehicle_categories: activeCategory
            ? { name: activeCategory.name, slug: activeCategory.slug }
            : null,
        })),
      ]);
      setBulkNotice(`${result.count} güzergahın fiyatı güncellendi.`);
      setBulkValue("");
      setEditingKey(null);
    } catch {
      setError("Toplu güncelleme yapılamadı");
    } finally {
      setLoading(false);
    }
  };

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
                setBulkNotice(null);
                // The source only ever means another vehicle; kept pointing at
                // the tab just left, it would silently become a self-copy.
                if (cat.id === bulkSource) setBulkSource("");
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

      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{activeCategory?.name}</span>{" "}
          fiyatları — tümü USD cinsindendir. {lines.length - missingCount} güzergah yapılandırıldı
          {missingCount > 0 && (
            <span className="text-amber-600">, {missingCount} güzergahta fiyat yok</span>
          )}
          .
        </p>
        <button
          onClick={() => {
            setBulkOpen((open) => !open);
            setBulkNotice(null);
          }}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            bulkOpen
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Wand2 size={14} />
          Toplu fiyat güncelle
        </button>
      </div>

      {bulkOpen && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Kaynak fiyatlar</span>
              <select
                value={bulkSource}
                onChange={(e) => setBulkSource(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-56"
              >
                <option value="">{activeCategory?.name} (mevcut fiyatları)</option>
                {categories
                  .filter((c) => c.id !== categoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} fiyatlarından
                    </option>
                  ))}
              </select>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">İşlem</span>
              <div className="flex items-stretch">
                <div className="flex gap-1 bg-gray-200 rounded-lg p-1 me-2">
                  {([1, -1] as const).map((sign) => (
                    <button
                      key={sign}
                      onClick={() => setBulkSign(sign)}
                      className={`w-9 rounded-md text-sm font-semibold transition-colors ${
                        bulkSign === sign ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      {sign === 1 ? "+" : "−"}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder="20"
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                />
                <select
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value as AdjustMode)}
                  className="ms-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="amount">$ (sabit tutar)</option>
                  <option value="percent">% (yüzde)</option>
                </select>
              </div>
            </div>

            <button
              onClick={applyBulk}
              disabled={loading || !preview || !!previewProblem}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              {loading ? "Uygulanıyor…" : "Uygula"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-medium text-gray-500">Uygulanacak alanlar:</span>
            {ADJUSTABLE_FIELDS.map((field) => (
              <label key={field} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={bulkFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="rounded border-gray-300"
                />
                {FIELD_LABELS[field]}
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {previewProblem ? (
              <span className="text-red-600">{previewProblem} — değeri düşürün.</span>
            ) : preview ? (
              <>
                Tabloda <span className="text-emerald-700 font-medium">yeni fiyatlar</span> önizleniyor.
                Uygula&apos;ya basana kadar hiçbir şey kaydedilmez.
                {bulkMode === "percent" && " Yüzdeli sonuçlar tam dolara yuvarlanır."}
              </>
            ) : (
              "Bir değer girin; yeni fiyatlar kaydedilmeden önce tabloda gösterilir."
            )}
          </p>
        </div>
      )}

      {bulkNotice && (
        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {bulkNotice}
        </div>
      )}

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
              const amount = (value: number | null | undefined, tone: string) =>
                value != null ? (
                  <span className={`font-medium ${tone}`}>${value.toFixed(0)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                );

              const pending = preview?.get(line.regionId);
              /**
               * The stored price, or — while a bulk adjustment is being set up
               * — the old price struck through next to what it would become.
               * Only the fields the adjustment touches change; the rest render
               * unchanged so the diff is the thing that stands out.
               */
              const money = (field: AdjustField, tone: string) => {
                const current = row?.[field];
                if (!pending || !(field in pending)) return amount(current, tone);
                const next = pending[field];
                if (next == null && current == null) return amount(null, tone);
                return (
                  <span className="inline-flex items-baseline gap-1.5 justify-end">
                    {current != null && (
                      <span className="text-gray-300 line-through text-xs">${current.toFixed(0)}</span>
                    )}
                    {amount(next, "text-emerald-700")}
                  </span>
                );
              };
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
                  {isEditing ? numInput("one_way_price", editValues.one_way_price) : money("one_way_price", "text-blue-700")}
                </td>
                {/* Online round-trip */}
                <td className="px-4 py-3 text-end bg-blue-50/20">
                  {isEditing ? numInput("round_trip_price", editValues.round_trip_price) : money("round_trip_price", "text-blue-700")}
                </td>
                {/* Cash one-way */}
                <td className="px-4 py-3 text-end bg-amber-50/20">
                  {isEditing ? numInput("one_way_cash_price", editValues.one_way_cash_price) : money("one_way_cash_price", "text-amber-700")}
                </td>
                {/* Cash round-trip */}
                <td className="px-4 py-3 text-end bg-amber-50/20">
                  {isEditing ? numInput("round_trip_cash_price", editValues.round_trip_cash_price) : money("round_trip_cash_price", "text-amber-700")}
                </td>
                {/* Deposit */}
                <td className="px-4 py-3 text-end bg-emerald-50/20">
                  {isEditing ? numInput("cash_deposit_amount", editValues.cash_deposit_amount) : money("cash_deposit_amount", "text-emerald-700")}
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
