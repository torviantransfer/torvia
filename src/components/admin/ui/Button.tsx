import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "brand" | "outline" | "ghost" | "warn" | "danger-ghost";
/** `tile` is the tall icon-over-label button of a drawer's quick actions. */
export type ButtonSize = "md" | "sm" | "tile";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-adm-ink text-white shadow-[0_1px_2px_rgba(0,0,0,.2)] hover:bg-adm-ink-hover",
  brand: "bg-adm-brand text-white hover:bg-adm-brand-ink",
  outline:
    "bg-adm-surface text-adm-ink-2 shadow-adm-sm ring-1 ring-inset ring-adm-line hover:text-adm-ink hover:ring-adm-line-strong",
  ghost: "text-adm-ink-2 hover:bg-adm-line-2 hover:text-adm-ink",
  warn: "bg-adm-amber-soft text-adm-amber ring-1 ring-inset ring-adm-amber-line hover:bg-[#fbe8b8]",
  "danger-ghost": "text-adm-rose hover:bg-adm-rose-soft",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-[34px] gap-[7px] rounded-[9px] px-[13px] text-[13px]",
  sm: "h-7 gap-1.5 rounded-adm-sm px-2.5 text-[12.5px]",
  tile: "h-[52px] flex-col gap-[3px] rounded-adm px-2 text-[11.5px] max-[760px]:h-12",
};

/** On a phone a compact button keeps its icon and gives up the label. */
const COMPACT: Record<ButtonSize, string> = {
  md: "max-[760px]:w-[34px] max-[760px]:px-0",
  sm: "max-[760px]:w-7 max-[760px]:px-0",
  tile: "",
};

const ICON_PX: Record<ButtonSize, number> = { md: 16, sm: 14, tile: 17 };

export function buttonClass({
  variant = "outline",
  size = "md",
  compact = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  compact?: boolean;
  className?: string;
} = {}) {
  return cx(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,box-shadow,color] duration-150",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    compact && COMPACT[size],
    className
  );
}

/** For screens not yet moved onto <Button>; same look as the variants above. */
export const buttonPrimary = buttonClass({ variant: "primary" });
export const buttonSecondary = buttonClass({ variant: "outline" });

export const textLinkClass = "text-[12.5px] font-semibold text-adm-brand-ink hover:underline";

interface Look {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
  loading?: boolean;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

function Content({ icon: Icon, iconEnd: IconEnd, loading, compact, size = "md", children }: Look) {
  const px = ICON_PX[size];
  const hasLabel = children !== undefined && children !== null && children !== false;
  return (
    <>
      {loading ? (
        <Loader2 size={px} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={px} aria-hidden="true" />
      ) : null}
      {hasLabel && <span className={cx(compact && (Icon || loading) && "max-[760px]:sr-only")}>{children}</span>}
      {IconEnd && <IconEnd size={px} aria-hidden="true" className={cx(compact && "max-[760px]:hidden")} />}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconEnd,
  loading,
  compact,
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, compact, className })}
      {...rest}
    >
      <Content icon={icon} iconEnd={iconEnd} loading={loading} compact={compact} size={size}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  icon,
  iconEnd,
  compact,
  className,
  children,
  ...rest
}: Omit<Look, "loading"> & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass({ variant, size, compact, className })} {...rest}>
      <Content icon={icon} iconEnd={iconEnd} compact={compact} size={size}>
        {children}
      </Content>
    </Link>
  );
}

/** A bare icon with a label for screen readers and a tooltip for the mouse. */
export function IconButton({
  icon: Icon,
  label,
  size = "md",
  dot,
  className,
  type = "button",
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  size?: "md" | "sm";
  /** A small red mark in the corner, for something unread. */
  dot?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "relative grid shrink-0 place-items-center text-adm-ink-2 transition-colors hover:bg-adm-line-2 hover:text-adm-ink disabled:pointer-events-none disabled:opacity-40",
        size === "md" ? "size-[34px] rounded-[9px]" : "size-7 rounded-adm-sm",
        className
      )}
      {...rest}
    >
      <Icon size={size === "md" ? 16 : 15} aria-hidden="true" />
      {dot && (
        <span className="absolute end-2 top-[7px] size-[7px] rounded-full border-2 border-adm-bg bg-[#e11d48]" />
      )}
    </button>
  );
}
