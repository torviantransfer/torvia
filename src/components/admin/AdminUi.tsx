import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

/** Initials in a dark disc — enough to tell drivers apart at a glance without photos. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toLocaleUpperCase("tr-TR"))
      .join("") || "?";
  const dims = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" }[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white ${dims}`}
    >
      {initials}
    </span>
  );
}

/** A labelled figure. The value keeps proportional digits: it stands alone, it does not line up in a column. */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  negative,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon && <Icon size={14} className="text-slate-400" />}
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${negative ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/**
 * A change against the previous period, signed and worded. Colour follows
 * whether the move is good — revenue up is good, cost up is not — and never
 * carries the meaning alone: the arrow and the figure say it too.
 */
export function Delta({
  value,
  goodWhenUp = true,
  onDark = false,
  suffix = "önceki döneme göre",
}: {
  value: number | null;
  goodWhenUp?: boolean;
  onDark?: boolean;
  suffix?: string;
}) {
  if (value === null) return <span className={onDark ? "text-white/60" : "text-slate-400"}>Karşılaştırma yok</span>;
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const good = value === 0 ? null : value > 0 === goodWhenUp;
  const colour =
    good === null
      ? onDark
        ? "text-white/80"
        : "text-slate-500"
      : good
      ? onDark
        ? "text-emerald-300"
        : "text-emerald-700"
      : onDark
      ? "text-rose-200"
      : "text-rose-600";
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${colour}`}>
      <Icon size={13} aria-hidden="true" />%{Math.abs(value).toLocaleString("tr-TR")}
      <span className={`font-normal ${onDark ? "text-white/60" : "text-slate-400"}`}>{suffix}</span>
    </span>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  flush,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** No inner padding, for tables that run to the card's edges. */
  flush?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export const buttonPrimary =
  "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800";
export const buttonSecondary =
  "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
