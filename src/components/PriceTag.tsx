"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";

export default function PriceTag({
  amount,
  className,
  showLabel = true,
}: {
  amount: number;
  className?: string;
  showLabel?: boolean;
}) {
  const { format } = useCurrency();
  const t = useTranslations("regionDetail");
  // USD is the DB's base currency (see supabase/seed.sql). Selecting EUR/TRY
  // in the currency switcher must convert the amount, not just swap the
  // symbol — fetch live rates the same way BookingWizard does.
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/exchange-rates")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.rates) setRates({ USD: 1, ...data.rates });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className={className}>
      {showLabel && <>{t("fromPrice")} </>}
      {format(amount, rates)}
    </span>
  );
}
