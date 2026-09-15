/** Joins class names, dropping the falsy ones. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * The meanings a colour may carry in the admin. Nothing is coloured for
 * decoration: amber asks for attention, rose is a problem, green is done,
 * blue is assigned, violet is on the road, teal is a deposit.
 */
export type Tone = "green" | "amber" | "rose" | "blue" | "violet" | "teal" | "neutral";

/** Soft ground with its matching text. */
export const TONE: Record<Tone, string> = {
  green: "bg-adm-green-soft text-adm-green",
  amber: "bg-adm-amber-soft text-adm-amber",
  rose: "bg-adm-rose-soft text-adm-rose",
  blue: "bg-adm-blue-soft text-adm-blue",
  violet: "bg-adm-violet-soft text-adm-violet",
  teal: "bg-adm-teal-soft text-adm-teal",
  neutral: "bg-adm-line-2 text-adm-ink-2",
};

/** Text alone, for a figure or a payment note that sits on white. */
export const TONE_TEXT: Record<Tone, string> = {
  green: "text-adm-green",
  amber: "text-adm-amber",
  rose: "text-adm-rose",
  blue: "text-adm-blue",
  violet: "text-adm-violet",
  teal: "text-adm-teal",
  neutral: "text-adm-ink-2",
};

/**
 * Takes a one-shot parameter such as `?pay=1` back out of the address bar once
 * it has done its job, so a refresh does not open the same dialog again.
 */
export function dropQueryParam(name: string) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.delete(name);
  window.history.replaceState(window.history.state, "", url);
}

/**
 * Whether a click on a clickable row actually landed on a control inside it —
 * a checkbox, a WhatsApp link, "Şoför ata". Those do their own thing and must
 * not also open the row.
 */
export function fromControl(e: { target: EventTarget; currentTarget: EventTarget }) {
  const hit = (e.target as HTMLElement).closest("a, button, input, select, textarea, label");
  return !!hit && hit !== e.currentTarget && (e.currentTarget as HTMLElement).contains(hit);
}
