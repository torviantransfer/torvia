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
      <div className="bg-adm-surface rounded-adm border border-adm-line-2 shadow-sm px-5 py-8 text-center text-adm-muted">
        Önce <span className="font-medium text-adm-ink-2">Araç Tipleri</span> sayfasından bir araç ekleyin.
      </div>
    );
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex gap-1 bg-adm-line-2 rounded-adm-sm p-1 mb-4">
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
                  ? "bg-adm-surface text-adm-ink shadow-sm"
                  : "text-adm-muted hover:text-adm-ink-2"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm text-adm-muted">
          <span className="font-medium text-adm-ink-2">{activeCategory?.name}</span>{" "}
          fiyatları — tümü EUR cinsindendir. {lines.length - missingCount} güzergah yapılandırıldı
          {missingCount > 0 && (
            <span className="text-adm-amber">, {missingCount} güzergahta fiyat yok</span>
          )}
          .
        </p>
        <button
          onClick={() => {
            setBulkOpen((open) => !open);
            setBulkNotice(null);
          }}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-adm-sm text-sm font-medium border transition-colors ${
            bulkOpen
              ? "bg-adm-ink text-white border-adm-ink"
              : "bg-adm-surface text-adm-ink-2 border-adm-line hover:bg-adm-surface-2"
          }`}
        >
          <Wand2 size={14} />
          Toplu fiyat güncelle
        </button>
      </div>

      {bulkOpen && (
        <div className="mb-4 rounded-adm border border-adm-line bg-adm-surface-2 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-adm-muted">Kaynak fiyatlar</span>
              <select
                value={bulkSource}
                onChange={(e) => setBulkSource(e.target.value)}
                className="border border-adm-line rounded-adm-sm px-3 py-2 text-sm bg-adm-surface min-w-56"
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
              <span className="text-xs font-medium text-adm-muted">İşlem</span>
              <div className="flex items-stretch">
                <div className="flex gap-1 bg-adm-seg rounded-adm-sm p-1 me-2">
                  {([1, -1] as const).map((sign) => (
                    <button
                      key={sign}
                      onClick={() => setBulkSign(sign)}
                      className={`w-9 rounded-md text-sm font-semibold transition-colors ${
                        bulkSign === sign ? "bg-adm-surface text-adm-ink shadow-sm" : "text-adm-muted"
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
                  className="w-24 border border-adm-line rounded-adm-sm px-3 py-2 text-sm bg-adm-surface"
                />
                <select
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value as AdjustMode)}
                  className="ms-2 border border-adm-line rounded-adm-sm px-3 py-2 text-sm bg-adm-surface"
                >
                  <option value="amount">$ (sabit tutar)</option>
                  <option value="percent">% (yüzde)</option>
                </select>
              </div>
            </div>

            <button
              onClick={applyBulk}
              disabled={loading || !preview || !!previewProblem}
              className="px-4 py-2 rounded-adm-sm bg-adm-ink text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-adm-ink-hover transition-colors"
            >
              {loading ? "Uygulanıyor…" : "Uygula"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-medium text-adm-muted">Uygulanacak alanlar:</span>
            {ADJUSTABLE_FIELDS.map((field) => (
              <label key={field} className="flex items-center gap-1.5 text-sm text-adm-ink-2">
                <input
                  type="checkbox"
                  checked={bulkFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="rounded border-adm-line-strong"
                />
                {FIELD_LABELS[field]}
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs text-adm-muted">
            {previewProblem ? (
              <span className="text-adm-rose">{previewProblem} — değeri düşürün.</span>
            ) : preview ? (
              <>
                Tabloda <span className="text-adm-green font-medium">yeni fiyatlar</span> önizleniyor.
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
        <div className="mb-4 rounded-adm-sm border border-[#bfe3cb] bg-adm-green-soft px-4 py-2 text-sm text-adm-green">
          {bulkNotice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-4 py-2 text-sm text-adm-rose">
          {error}
        </div>
      )}

      <div className="bg-adm-surface rounded-adm border border-adm-line-2 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-adm-surface-2 text-start">
              <th className="px-4 py-3 font-medium text-adm-muted">#</th>
              <th className="px-4 py-3 font-medium text-adm-muted">Bölge</th>
              <th className="px-4 py-3 font-medium text-adm-muted text-end text-adm-brand-ink bg-adm-blue-soft/50">Online Tek ($)</th>
              <th className="px-4 py-3 font-medium text-adm-muted text-end text-adm-brand-ink bg-adm-blue-soft/50">Online G/D ($)</th>
              <th className="px-4 py-3 font-medium text-adm-muted text-end text-adm-amber bg-adm-amber-soft/50">Nakit Tek ($)</th>
              <th className="px-4 py-3 font-medium text-adm-muted text-end text-adm-amber bg-adm-amber-soft/50">Nakit G/D ($)</th>
              <th className="px-4 py-3 font-medium text-adm-muted text-end text-adm-green bg-adm-green-soft/50">Depozit ($)</th>
              <th className="px-4 py-3 font-medium text-adm-muted">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-adm-line-2">
            {lines.map((line, idx) => {
              const isEditing = editingKey === line.regionId;
              const row = line.row;
              const numInput = (field: keyof typeof editValues, value: number | null) => (
                <input
                  type="number" step="0.01" min="0"
                  value={value ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-20 border border-adm-line rounded px-2 py-1 text-sm text-end"
                />
              );
              const amount = (value: number | null | undefined, tone: string) =>
                value != null ? (
                  <span className={`font-medium ${tone}`}>€{value.toFixed(0)}</span>
                ) : (
                  <span className="text-adm-faint">—</span>
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
                      <span className="text-adm-faint line-through text-xs">${current.toFixed(0)}</span>
                    )}
                    {amount(next, "text-adm-green")}
                  </span>
                );
              };
              return (
              <tr key={line.regionId} className={`hover:bg-adm-surface-2 ${!row && !isEditing ? "bg-adm-amber-soft/30" : ""}`}>
                <td className="px-4 py-3 text-adm-muted text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-adm-ink text-sm">
                  {line.regionName}
                  {!row && !isEditing && (
                    <span className="ms-2 text-xs font-normal text-adm-amber">fiyat yok</span>
                  )}
                </td>
                {/* Online one-way */}
                <td className="px-4 py-3 text-end bg-adm-blue-soft/20">
                  {isEditing ? numInput("one_way_price", editValues.one_way_price) : money("one_way_price", "text-adm-brand-ink")}
                </td>
                {/* Online round-trip */}
                <td className="px-4 py-3 text-end bg-adm-blue-soft/20">
                  {isEditing ? numInput("round_trip_price", editValues.round_trip_price) : money("round_trip_price", "text-adm-brand-ink")}
                </td>
                {/* Cash one-way */}
                <td className="px-4 py-3 text-end bg-adm-amber-soft/20">
                  {isEditing ? numInput("one_way_cash_price", editValues.one_way_cash_price) : money("one_way_cash_price", "text-adm-amber")}
                </td>
                {/* Cash round-trip */}
                <td className="px-4 py-3 text-end bg-adm-amber-soft/20">
                  {isEditing ? numInput("round_trip_cash_price", editValues.round_trip_cash_price) : money("round_trip_cash_price", "text-adm-amber")}
                </td>
                {/* Deposit */}
                <td className="px-4 py-3 text-end bg-adm-green-soft/20">
                  {isEditing ? numInput("cash_deposit_amount", editValues.cash_deposit_amount) : money("cash_deposit_amount", "text-adm-green")}
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleSave(line)} disabled={loading} className="p-1.5 rounded hover:bg-adm-green-soft text-adm-green"><Save size={14} /></button>
                      <button onClick={() => setEditingKey(null)} className="p-1.5 rounded hover:bg-adm-line-2"><X size={14} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(line)}
                      title={row ? "Düzenle" : "Fiyat ekle"}
                      className="p-1.5 rounded hover:bg-adm-line-2"
                    >
                      {row ? <Edit2 size={14} /> : <Plus size={14} className="text-adm-amber" />}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-adm-muted">
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
