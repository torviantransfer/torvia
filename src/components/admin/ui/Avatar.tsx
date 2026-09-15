import { cx } from "./cx";

const DIMS = {
  sm: "size-6 text-[10px]",
  md: "size-[30px] text-[11px]",
  lg: "size-10 text-[13px]",
};

/** Initials in a warm grey disc — enough to tell drivers apart at a glance without photos. */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof DIMS;
  className?: string;
}) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toLocaleUpperCase("tr-TR"))
      .join("") || "?";
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-adm-avatar font-bold text-adm-ink-2",
        DIMS[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
