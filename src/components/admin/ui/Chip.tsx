import type { ReactNode } from "react";
import { cx, TONE, type Tone } from "./cx";
import { ASSIGNMENT_STATUS, RESERVATION_STATUS, statusLook } from "./status";

/** A status badge. The leading dot marks a state; `plain` drops it for counts and codes. */
export function Chip({
  tone = "neutral",
  plain,
  faded,
  title,
  className,
  children,
}: {
  tone?: Tone;
  plain?: boolean;
  faded?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 text-xs font-semibold",
        TONE[tone],
        faded && "opacity-70",
        className
      )}
    >
      {!plain && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current opacity-85" />}
      {children}
    </span>
  );
}

export function ReservationStatusChip({ status, className }: { status: string | null | undefined; className?: string }) {
  const look = statusLook(RESERVATION_STATUS, status);
  return (
    <Chip tone={look.tone} faded={look.faded} className={className}>
      {look.label}
    </Chip>
  );
}

export function AssignmentStatusChip({ status, className }: { status: string | null | undefined; className?: string }) {
  const look = statusLook(ASSIGNMENT_STATUS, status);
  return (
    <Chip tone={look.tone} faded={look.faded} className={className}>
      {look.label}
    </Chip>
  );
}
