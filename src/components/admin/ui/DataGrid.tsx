"use client";

import type { CSSProperties, ReactNode } from "react";
import { cx, fromControl } from "./cx";

/** Where a cell goes once the row becomes a card on a phone (≤760px). */
export type GridArea = "top-start" | "top-end" | "body" | "foot-start" | "foot-end";

export interface GridColumn<T> {
  key: string;
  header: ReactNode;
  /** The column's grid track, e.g. `78px` or `minmax(170px,1.2fr)`. */
  width: string;
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
  /** Dropped at ≤1180px, where the row runs out of room — row actions, typically. */
  wideOnly?: boolean;
  /** Left out: the cell is not shown on a phone. */
  area?: GridArea;
}

export interface GridGroup<T> {
  key: string;
  label: ReactNode;
  meta?: ReactNode;
  rows: T[];
}

const AREA: Record<GridArea, string> = {
  "top-start": "max-[760px]:order-1 max-[760px]:grow",
  "top-end": "max-[760px]:order-2 max-[760px]:ms-auto",
  body: "max-[760px]:order-3 max-[760px]:basis-full",
  "foot-start": "max-[760px]:order-4 max-[760px]:grow",
  "foot-end": "max-[760px]:order-5 max-[760px]:ms-auto max-[760px]:text-end",
};

const ROW_GRID =
  "grid grid-cols-[var(--cols)] items-center gap-3.5 px-4 max-[1180px]:grid-cols-[var(--cols-wide)]";

/**
 * A row-based list: a header row, day groups, a checkbox per row, actions that
 * appear on hover, and a green rail on the selected rows. Below 760px every row
 * turns into a card laid out by each column's `area`.
 */
export function DataGrid<T>({
  columns,
  groups,
  rows,
  rowKey,
  onRowClick,
  activeKey,
  selected,
  onSelectedChange,
  empty,
  footer,
  label,
  className,
}: {
  columns: GridColumn<T>[];
  /** Grouped rows; use `rows` instead for a flat list. */
  groups?: GridGroup<T>[];
  rows?: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** The row whose drawer is open. */
  activeKey?: string | null;
  selected?: ReadonlySet<string>;
  /** Giving this turns the checkboxes on. */
  onSelectedChange?: (next: Set<string>) => void;
  empty?: ReactNode;
  footer?: ReactNode;
  label?: string;
  className?: string;
}) {
  const sets: GridGroup<T>[] = groups ?? [{ key: "all", label: null, rows: rows ?? [] }];
  const all = sets.flatMap((g) => g.rows);
  const selectable = !!onSelectedChange;

  const tracks = (cols: GridColumn<T>[]) => [selectable ? "22px" : "", ...cols.map((c) => c.width)].filter(Boolean).join(" ");
  const style = {
    "--cols": tracks(columns),
    "--cols-wide": tracks(columns.filter((c) => !c.wideOnly)),
  } as CSSProperties;

  const container = cx(
    "overflow-hidden rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm",
    className
  );

  if (all.length === 0 && empty) return <div className={container}>{empty}</div>;

  const allSelected = selectable && all.length > 0 && all.every((r) => selected?.has(rowKey(r)));

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectedChange?.(next);
  };

  const toggleAll = () => {
    if (allSelected) onSelectedChange?.(new Set());
    else onSelectedChange?.(new Set([...(selected ?? []), ...all.map(rowKey)]));
  };

  const cellClass = (c: GridColumn<T>) =>
    cx("min-w-0", c.align === "end" && "text-end", c.wideOnly && "max-[1180px]:hidden");

  return (
    <div className={cx(container, "overflow-x-auto")} style={style}>
      {/* As wide as the columns' minimums: on a narrow desktop the list scrolls
          sideways inside its card instead of clipping the last columns. */}
      <div role="table" aria-label={label} className="min-w-min max-[760px]:min-w-0">
      <div
        role="row"
        className={cx(
          ROW_GRID,
          "border-b border-adm-line bg-adm-surface-2 py-[9px] text-xs font-semibold text-adm-muted max-[760px]:hidden"
        )}
      >
        {selectable && (
          <span role="columnheader">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="Tümünü seç"
              className="size-[15px] cursor-pointer accent-adm-ink"
            />
          </span>
        )}
        {columns.map((c) => (
          <div key={c.key} role="columnheader" className={cx(cellClass(c), "truncate")}>
            {c.header}
          </div>
        ))}
      </div>

      <div role="rowgroup">
        {sets.map((g) => (
          <div key={g.key} role="presentation" className="contents">
            {g.label !== null && g.label !== undefined && (
              <div className="flex flex-wrap items-center gap-x-2.5 border-b border-adm-line-2 bg-adm-surface-2 px-4 py-2.5 text-[12.5px]">
                <b className="font-semibold text-adm-ink">{g.label}</b>
                {g.meta && <span className="text-adm-muted">{g.meta}</span>}
              </div>
            )}
            {g.rows.map((row) => {
              const key = rowKey(row);
              const isSelected = !!selected?.has(key);
              const isActive = activeKey === key;
              return (
                <div
                  key={key}
                  role="row"
                  aria-selected={selectable ? isSelected : undefined}
                  data-active={isActive || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={
                    onRowClick
                      ? (e) => {
                          if (!fromControl(e)) onRowClick(row);
                        }
                      : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={cx(
                    ROW_GRID,
                    "group/row relative border-b border-adm-line-2 py-2.5 transition-colors last:border-b-0",
                    "max-[760px]:flex max-[760px]:flex-wrap max-[760px]:items-center max-[760px]:gap-x-3 max-[760px]:gap-y-1.5 max-[760px]:py-3.5",
                    onRowClick && "cursor-pointer",
                    isSelected
                      ? "bg-[#f3faf6] before:absolute before:inset-y-0 before:start-0 before:w-[3px] before:bg-adm-brand"
                      : isActive
                        ? "bg-[#f6f6f2]"
                        : "hover:bg-[#fbfbf8]"
                  )}
                >
                  {selectable && (
                    <span role="cell" className="max-[760px]:hidden">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(key)}
                        aria-label="Satırı seç"
                        className="size-[15px] cursor-pointer accent-adm-ink"
                      />
                    </span>
                  )}
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      role="cell"
                      className={cx(cellClass(c), c.area ? AREA[c.area] : "max-[760px]:hidden")}
                    >
                      {c.cell(row)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
      {footer}
    </div>
  );
}

/** Row actions: hidden until the row is hovered, focused or open. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-[active]/row:opacity-100">
      {children}
    </div>
  );
}
