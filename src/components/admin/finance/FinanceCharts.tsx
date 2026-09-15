"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthRow } from "@/lib/finance";
import { fmtCash } from "@/lib/rates";

/**
 * Two charts rather than one busy one: revenue against cost, then the profit
 * that is left. Both on a single euro axis. Colours are the validated default
 * pair (blue / orange, and blue / red for profit and loss — both checked for
 * colour-vision separation on the white card); text never wears them.
 */
const REVENUE = "#2a78d6";
const COST = "#eb6834";
const LOSS = "#e34948";
const GRID = "#e2e8f0";
const AXIS_TEXT = "#94a3b8";
const HEIGHT = 250;

const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const tick = (v: number) => `${v < 0 ? "−" : ""}€${compact.format(Math.abs(v))}`;

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; color?: string; sub?: boolean }[] }) {
  return (
    <div className="min-w-[190px] rounded-adm border border-adm-line bg-adm-surface px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-adm-muted">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-5 py-0.5">
          <span className={`flex items-center gap-2 ${row.sub ? "ps-5 text-adm-muted" : "text-adm-muted"}`}>
            {row.color && <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: row.color }} />}
            {row.label}
          </span>
          <span className={`tabular-nums ${row.sub ? "text-adm-ink-2" : "font-bold text-adm-ink"}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** A column rounded at its data end and square on the baseline, whichever side of zero it falls. */
function DataEndBar(props: unknown) {
  const { x = 0, y = 0, width = 0, height = 0, fill, payload } = props as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    payload?: MonthRow;
  };
  const h = Math.abs(height);
  if (!h || !width) return <g />;
  const top = height < 0 ? y + height : y;
  const r = Math.min(4, h, width / 2);
  const below = (payload?.net ?? 0) < 0;
  const d = below
    ? `M${x},${top} H${x + width} V${top + h - r} Q${x + width},${top + h} ${x + width - r},${top + h} H${x + r} Q${x},${top + h} ${x},${top + h - r} Z`
    : `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${top + h} Z`;
  return <path d={d} fill={fill} />;
}

const axes = (
  <>
    <CartesianGrid vertical={false} stroke={GRID} />
    <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
    <YAxis tickFormatter={tick} tick={{ fontSize: 11, fill: AXIS_TEXT }} axisLine={false} tickLine={false} width={58} />
  </>
);

export function RevenueCostChart({ months }: { months: MonthRow[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-adm-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: REVENUE }} />
          Ciro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COST }} />
          Maliyet (şoför + gider)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={HEIGHT}>
        <BarChart data={months} barGap={2} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          {axes}
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as MonthRow;
              return (
                <TooltipCard
                  title={`${m.label} · ${m.transfers} transfer`}
                  rows={[
                    { label: "Ciro", value: fmtCash(m.revenue, "EUR"), color: REVENUE },
                    { label: "Maliyet", value: fmtCash(m.costs, "EUR"), color: COST },
                    { label: "Şoför", value: fmtCash(m.driverCost, "EUR"), sub: true },
                    { label: "Gider", value: fmtCash(m.expenses, "EUR"), sub: true },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="revenue" name="Ciro" fill={REVENUE} maxBarSize={24} radius={[4, 4, 0, 0]} />
          <Bar dataKey="costs" name="Maliyet" fill={COST} maxBarSize={24} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetProfitChart({ months }: { months: MonthRow[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-adm-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: REVENUE }} />
          Kâr
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LOSS }} />
          Zarar
        </span>
      </div>
      <ResponsiveContainer width="100%" height={HEIGHT}>
        <BarChart data={months} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          {axes}
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as MonthRow;
              const margin = m.revenue > 0 ? Math.round((m.net / m.revenue) * 1000) / 10 : null;
              return (
                <TooltipCard
                  title={m.label}
                  rows={[
                    { label: m.net < 0 ? "Zarar" : "Net kâr", value: fmtCash(m.net, "EUR"), color: m.net < 0 ? LOSS : REVENUE },
                    ...(margin === null ? [] : [{ label: "Marj", value: `%${margin.toLocaleString("tr-TR")}`, sub: true }]),
                    ...(m.otherIncome ? [{ label: "Diğer gelir", value: fmtCash(m.otherIncome, "EUR"), sub: true }] : []),
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="net" name="Net kâr" maxBarSize={24} shape={DataEndBar}>
            {months.map((m) => (
              <Cell key={m.key} fill={m.net < 0 ? LOSS : REVENUE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
