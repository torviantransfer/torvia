import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx, TONE, type Tone } from "./cx";

/** A line of "Dikkat gerektiriyor": what is wrong, and the button that fixes it. */
export function InboxItem({
  icon: Icon,
  tone,
  title,
  meta,
  actions,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-adm-line-2 px-[18px] py-3 last:border-b-0 max-[760px]:flex-wrap">
      <span className={cx("grid size-8 shrink-0 place-items-center rounded-[9px]", TONE[tone])}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-adm-ink">{title}</div>
        {meta && <div className="text-[12.5px] text-adm-muted">{meta}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-1.5 max-[760px]:w-full max-[760px]:ps-11">{actions}</div>
      )}
    </div>
  );
}
