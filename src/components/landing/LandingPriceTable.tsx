"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useCurrency } from "@/hooks/useCurrency";

export interface LandingPriceRow {
  slug: string;
  name: string;
  href: string;
  distanceKm: number | null;
  durationMin: number | null;
  oneWay: number;
  roundTrip: number | null;
  /** The page's own destination — marked, and listed first. */
  featured?: boolean;
}

/** Rows shown before "show all". The rest are in the HTML, only folded. */
const VISIBLE = 8;

const HAIRLINE = "1px solid rgba(0,0,0,0.06)";

/**
 * The fares, from the pricing table — never typed into the page, so a price
 * change reaches every landing page the moment it is saved.
 *
 * A table on a desktop, where the columns are what is being compared; a list
 * of rows on a phone, where a five-column table would scroll sideways.
 * Every row is rendered on the server; the fold only hides the tail, so the
 * crawler reads all of them.
 */
export default function LandingPriceTable({
  rows,
  initialRates,
}: {
  rows: LandingPriceRow[];
  initialRates: Record<string, number>;
}) {
  const t = useTranslations("landing");
  const b = useTranslations("booking");
  const rd = useTranslations("regionDetail");
  const { format } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const hiddenClass = (i: number) => (!expanded && i >= VISIBLE ? "hidden" : "");
  const bookHref = (slug: string) => ({ pathname: "/booking", query: { region: slug } });

  return (
    <div>
      {/* ── Desktop table ─────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-3xl bg-white md:block" style={{ border: HAIRLINE }}>
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="bg-[#F5F5F7] text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-500">
              <th scope="col" className="px-6 py-3.5 text-start">{t("colDestination")}</th>
              <th scope="col" className="px-4 py-3.5 text-start">{t("colDistance")}</th>
              <th scope="col" className="px-4 py-3.5 text-start">{t("colDuration")}</th>
              <th scope="col" className="px-4 py-3.5 text-end">{b("oneWay")}</th>
              <th scope="col" className="px-4 py-3.5 text-end">{b("roundTrip")}</th>
              <th scope="col" className="px-6 py-3.5"><span className="sr-only">{t("book")}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.slug}
                className={`${hiddenClass(i)} ${r.featured ? "bg-[#007AFF]/[0.04]" : ""}`}
                style={{ borderTop: HAIRLINE }}
              >
                <th scope="row" className="px-6 py-4 text-start font-normal">
                  <Link href={r.href} className="text-[15px] font-semibold text-gray-900 hover:text-[#007AFF]">
                    {r.name}
                  </Link>
                </th>
                <td className="whitespace-nowrap px-4 py-4 text-[14px] text-gray-500">
                  {r.distanceKm ? `${r.distanceKm} ${rd("unitKm")}` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-[14px] text-gray-500">
                  {r.durationMin ? `~${r.durationMin} ${rd("unitMin")}` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-end text-[17px] font-bold tabular-nums text-gray-900">
                  {format(r.oneWay, initialRates)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-end text-[15px] tabular-nums text-gray-500">
                  {r.roundTrip != null ? format(r.roundTrip, initialRates) : "—"}
                </td>
                <td className="px-6 py-4 text-end">
                  <Link
                    href={bookHref(r.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF] px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
                  >
                    {t("book")}
                    <ArrowRight size={14} aria-hidden="true" className="rtl:rotate-180" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Phone list ────────────────────────────────────────────── */}
      <ul className="overflow-hidden rounded-3xl bg-white md:hidden" style={{ border: HAIRLINE }}>
        {rows.map((r, i) => (
          <li
            key={r.slug}
            className={`${hiddenClass(i)} ${r.featured ? "bg-[#007AFF]/[0.04]" : ""}`}
            style={i > 0 ? { borderTop: HAIRLINE } : undefined}
          >
            <Link href={bookHref(r.slug)} className="flex items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-gray-900">{r.name}</span>
                <span className="mt-0.5 block text-[12.5px] text-gray-500">
                  {[r.distanceKm ? `${r.distanceKm} ${rd("unitKm")}` : null, r.durationMin ? `~${r.durationMin} ${rd("unitMin")}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  {r.roundTrip != null && (
                    <>
                      {" · "}
                      {b("roundTrip")} {format(r.roundTrip, initialRates)}
                    </>
                  )}
                </span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-[17px] font-bold tabular-nums text-gray-900">{format(r.oneWay, initialRates)}</span>
                <span className="block text-[11.5px] text-gray-400">{b("oneWay")}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-[#007AFF] rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>

      {rows.length > VISIBLE && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#007AFF] transition-colors hover:bg-[#F5F5F7]"
            style={{ border: HAIRLINE }}
          >
            {expanded ? t("showLess") : t("showAll", { count: rows.length })}
            <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}
