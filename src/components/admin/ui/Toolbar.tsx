import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronDown, Search, X, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** Search and filters on the left; view and sort on the right, which a phone drops. */
export function Toolbar({ children, end, className }: { children: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-3.5 flex flex-wrap items-center gap-2", className)}>
      {children}
      {end && <div className="ms-auto flex items-center gap-2 max-[760px]:hidden">{end}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Ara…",
  label = "Ara",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative min-w-[240px] max-w-[420px] flex-1 max-[760px]:min-w-full max-[760px]:max-w-none",
        className
      )}
    >
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute start-[11px] top-1/2 -translate-y-1/2 text-adm-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-[34px] w-full rounded-[9px] border border-adm-line bg-adm-surface pe-8 ps-[34px] text-[13px] text-adm-ink shadow-adm-sm outline-none transition-[border-color,box-shadow] placeholder:text-adm-faint focus:border-[#c9c8c2] focus:ring-[3px] focus:ring-adm-ink/[0.06] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Aramayı temizle"
          className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-adm-faint hover:bg-adm-line-2 hover:text-adm-ink"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Dashed until a value is chosen, then solid with the value spelled out. */
export function filterClass(set: boolean) {
  return cx(
    "inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-[9px] border px-[11px] text-[13px] font-medium text-adm-ink-2 transition-colors",
    set
      ? "border-solid border-adm-line bg-adm-surface shadow-adm-sm"
      : "border-dashed border-[#d4d3cd] hover:border-[#b9b8b2] hover:bg-adm-surface"
  );
}

export function FilterButton({
  label,
  value,
  icon: Icon,
  className,
  type = "button",
  ...rest
}: {
  label: string;
  value?: ReactNode;
  icon?: LucideIcon;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cx(filterClass(value !== undefined && value !== null), className)} {...rest}>
      {Icon && <Icon size={14} aria-hidden="true" className="text-adm-muted" />}
      <span>
        {label}
        {value !== undefined && value !== null && (
          <>
            : <b className="font-semibold text-adm-ink">{value}</b>
          </>
        )}
      </span>
      <ChevronDown size={14} aria-hidden="true" className="text-adm-faint" />
    </button>
  );
}

/**
 * A filter button over a native select: the look of the toolbar, and the
 * phone's own picker when tapped. The option with value "" means "any".
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
}) {
  const chosen = value ? options.find((o) => o.value === value) : undefined;
  return (
    <label className={cx(filterClass(!!chosen), "relative cursor-pointer")}>
      {Icon && <Icon size={14} aria-hidden="true" className="text-adm-muted" />}
      <span>
        {label}
        {chosen && (
          <>
            : <b className="font-semibold text-adm-ink">{chosen.label}</b>
          </>
        )}
      </span>
      <ChevronDown size={14} aria-hidden="true" className="text-adm-faint" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
