import type { ReactNode } from "react";

/** Eyebrow (a date or the group), the title, and the screen's own actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 mt-3 flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[12.5px] font-medium text-adm-muted">{eyebrow}</p>}
        <h1 className="mt-0.5 text-[21px] font-bold leading-tight tracking-[-0.02em] text-adm-ink min-[761px]:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-[13px] text-adm-muted">{description}</p>}
      </div>
      {actions && <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
