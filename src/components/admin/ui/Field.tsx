import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

export const controlClass =
  "w-full rounded-[9px] border border-adm-line bg-adm-surface text-adm-ink shadow-adm-sm outline-none transition-[border-color,box-shadow] placeholder:text-adm-faint focus:border-[#c9c8c2] focus:ring-[3px] focus:ring-adm-ink/[0.06] disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-adm-rose aria-[invalid=true]:focus:ring-adm-rose/10";

const HEIGHT = {
  sm: "h-7 text-xs",
  md: "h-[34px] text-[13px]",
  lg: "h-10 text-sm",
};

/** A label over its control, and under it either the error or a hint. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-adm-ink-2">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-adm-rose">
          <AlertCircle size={13} aria-hidden="true" className="mt-px shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-adm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  icon: Icon,
  inputSize = "md",
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; inputSize?: keyof typeof HEIGHT }) {
  const input = (
    <input
      {...props}
      className={cx(controlClass, HEIGHT[inputSize], Icon ? "pe-3 ps-[34px]" : "px-3", className)}
    />
  );
  if (!Icon) return input;
  return (
    <div className="relative">
      <Icon
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute start-[11px] top-1/2 -translate-y-1/2 text-adm-faint"
      />
      {input}
    </div>
  );
}

export function Select({
  inputSize = "md",
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { inputSize?: keyof typeof HEIGHT }) {
  return (
    <select {...props} className={cx(controlClass, HEIGHT[inputSize], "px-2.5", className)}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, "min-h-[84px] px-3 py-2 text-[13px]", className)} />;
}
