"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Car, Clock, MapPin, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

/**
 * One destination as the grid needs it: the cheapest vehicle's online fares,
 * in USD. Cash fares are deliberately absent — they are a different offer,
 * quoted at the vehicle, and putting them on a browse card would advertise a
 * price the online checkout does not charge.
 */
export interface RegionPrice {
  slug: string;
  name: string;
  distanceKm: number | null;
  durationMin: number | null;
  /** pricing.one_way_price — "Online Tek" in the admin price table. */
  oneWay: number;
  /** pricing.round_trip_price — "Online G/D". Null where none is set. */
  roundTrip: number | null;
}

/**
 * Every destination with its fare, under the search form.
 *
 * The booking page used to name a price nowhere: the button said "See Price &
 * Book Now" and finding out cost three taps and a date. Anyone comparing
 * operators had no reason to spend them. Each card also carries its own
 * destination, so tapping one fills the form in instead of only answering the
 * question.
 */
export default function RegionPriceGrid({ regions }: { regions: RegionPrice[] }) {
  const t = useTranslations("booking");
  const tr = useTranslations("regions");
  const { format } = useCurrency();

  // Fares are keyed and charged in USD; anything else on screen is a display
  // conversion. `format` applies the same rounding the checkout and the
  // voucher use, so a euro figure here matches the one quoted later.
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/exchange-rates")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.rates) setRates({ USD: 1, ...data.rates });
      })
      .catch(() => {
        // No rates: `format` falls back to the dollar figure rather than a
        // wrong one, so the grid still shows real prices.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (regions.length === 0) return null;

  return (
    <section aria-label={tr("allRegions")} className="w-full">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
        <h2 className="text-[15px] font-bold text-[#111827] lg:text-[17px]">
          {tr("allRegions")}
        </h2>
        <Link
          href="/regions"
          className="text-[12px] font-semibold text-[#0e8a61] hover:underline"
        >
          {tr("destinations")}
        </Link>
      </div>

      {/* Two columns on a phone: the cards carry four short lines each, so a
          single column would turn 26 destinations into a page of its own. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
        {regions.map((r) => (
          <Link
            key={r.slug}
            href={{ pathname: "/booking", query: { region: r.slug } }}
            className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-2.5 transition-all hover:border-[#0e8a61]/40 hover:shadow-[0_8px_20px_-10px_rgba(14,138,97,0.4)] sm:p-3"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDF8F4] text-[#0e8a61]"
              >
                <Car size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold leading-tight text-[#111827] sm:text-[14px]">
                {r.name}
              </span>
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#0e8a61]"
              />
            </div>

            {(r.distanceKm != null || r.durationMin != null) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-[#9CA3AF]">
                {r.distanceKm != null && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={10} aria-hidden="true" />
                    {r.distanceKm} km
                  </span>
                )}
                {r.durationMin != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} aria-hidden="true" />~{r.durationMin} min
                  </span>
                )}
              </div>
            )}

            {/* The two fares, labelled, one per line. A single "from" figure
                would hide that a return is cheaper than two singles, which is
                the comparison most of these visitors are actually making. */}
            <dl className="mt-2 space-y-1 border-t border-[#F3F4F6] pt-2">
              <div className="flex items-baseline justify-between gap-1.5">
                <dt className="truncate text-[10.5px] text-[#6B7280]">{t("oneWay")}</dt>
                <dd className="shrink-0 text-[14px] font-extrabold tabular-nums leading-none text-[#111827]">
                  {format(r.oneWay, rates)}
                </dd>
              </div>
              {r.roundTrip != null && (
                <div className="flex items-baseline justify-between gap-1.5">
                  <dt className="truncate text-[10.5px] text-[#6B7280]">{t("roundTrip")}</dt>
                  <dd className="shrink-0 text-[13px] font-bold tabular-nums leading-none text-[#0e8a61]">
                    {format(r.roundTrip, rates)}
                  </dd>
                </div>
              )}
            </dl>
          </Link>
        ))}
      </div>
    </section>
  );
}
