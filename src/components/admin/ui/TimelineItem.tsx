"use client";

import type { ReactNode } from "react";
import { Car, PlaneLanding, PlaneTakeoff, UserPlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { cx, fromControl, TONE } from "./cx";

export type Direction = "arrival" | "departure";

export const DIRECTION_LABEL: Record<Direction, string> = {
  arrival: "Karşılama",
  departure: "Çıkış",
};

/** Karşılama in blue, çıkış in violet; a plain car when the direction is unknown. */
export function DirectionIcon({ direction }: { direction: Direction | null | undefined }) {
  const Icon = direction === "arrival" ? PlaneLanding : direction === "departure" ? PlaneTakeoff : Car;
  const tone = direction === "arrival" ? TONE.blue : direction === "departure" ? TONE.violet : TONE.neutral;
  return (
    <span
      title={direction ? DIRECTION_LABEL[direction] : undefined}
      className={cx("grid size-[30px] shrink-0 place-items-center rounded-[9px]", tone)}
    >
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}

/** The dashed amber button that stands where a driver's name should be. */
export function AssignButton({ onClick, label = "Şoför ata" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-adm-sm border border-dashed border-adm-amber-line bg-[#fffaf0] px-2.5 text-[12.5px] font-semibold text-adm-amber transition-colors hover:bg-adm-amber-soft"
    >
      <UserPlus size={14} aria-hidden="true" />
      {label}
    </button>
  );
}

/** Initials, a name and a line under it — a driver with a plate, typically. */
export function Person({ name, sub, size = "sm" }: { name: string; sub?: ReactNode; size?: "sm" | "md" }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-adm-ink">{name}</div>
        {sub && <div className="truncate font-mono text-[11.5px] text-adm-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function TimelineHour({ label, now }: { label: ReactNode; now?: boolean }) {
  return (
    <div
      className={cx(
        "flex items-center gap-2.5 px-[18px] pb-1.5 pt-3 text-[11.5px] font-semibold tracking-[.04em] after:h-px after:flex-1",
        now ? "text-[#e11d48] after:bg-[#fecdd3]" : "text-adm-faint after:bg-adm-line-2"
      )}
    >
      {label}
    </div>
  );
}

/** One transfer on the day's timeline. */
export function TimelineItem({
  time,
  direction,
  title,
  sub,
  flight,
  who,
  onClick,
}: {
  time: string;
  direction?: Direction | null;
  title: ReactNode;
  sub?: ReactNode;
  flight?: ReactNode;
  who?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      tabIndex={onClick ? 0 : undefined}
      onClick={
        onClick
          ? (e) => {
              if (!fromControl(e)) onClick();
            }
          : undefined
      }
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) onClick();
            }
          : undefined
      }
      className={cx(
        "grid grid-cols-[62px_34px_minmax(0,1.4fr)_minmax(0,1fr)_150px] items-center gap-3 px-[18px] py-2.5 transition-colors",
        "max-[760px]:grid-cols-[52px_minmax(0,1fr)] max-[760px]:gap-y-1",
        onClick && "cursor-pointer hover:bg-adm-surface-2"
      )}
    >
      <div className="text-[15px] font-bold tabular-nums max-[760px]:row-span-2 max-[760px]:self-start max-[760px]:pt-0.5">
        {time}
      </div>
      <div className="max-[760px]:hidden">
        <DirectionIcon direction={direction} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-adm-ink">{title}</div>
        {sub && <div className="truncate text-[12.5px] text-adm-muted">{sub}</div>}
      </div>
      <div className="min-w-0 max-[760px]:hidden">{flight}</div>
      <div className="min-w-0">{who}</div>
    </div>
  );
}
