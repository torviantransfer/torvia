"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Undo2 } from "lucide-react";
import { Button, Dialog, Field, Input, Segmented } from "@/components/admin/ui";
import { amountText } from "./types";

interface Refundable {
  refundable: boolean;
  reason?: "no_payment" | "no_charge";
  currency?: string;
  captured?: number;
  refunded?: number;
  remaining?: number;
  /** The balance of a cash booking paid by card later: a separate charge this dialog does not refund. */
  balance?: { amount: number; paymentIntentId: string | null } | null;
}

const REASON_TEXT: Record<string, string> = {
  no_payment: "Bu rezervasyon için alınmış bir online ödeme yok — iade edilecek bir şey bulunmuyor.",
  no_charge: "Stripe'ta tamamlanmış bir tahsilat bulunamadı.",
};

/**
 * Sends money back to the customer.
 *
 * Every figure here is read from Stripe when the dialog opens, not from our own
 * columns: what a booking costs and what was actually captured are different
 * numbers, and a refund made earlier from the Stripe dashboard would not show
 * up in ours at all. The button says the amount out loud because pressing it
 * moves real money and cannot be undone.
 */
export default function RefundDialog({
  reservationId,
  code,
  customerName,
  onClose,
  onDone,
}: {
  reservationId: string;
  code: string;
  customerName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [info, setInfo] = useState<Refundable | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [partial, setPartial] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/refund?reservationId=${encodeURIComponent(reservationId)}`);
        const data = await res.json().catch(() => null);
        if (!live) return;
        if (!res.ok) throw new Error(data?.error ?? "Bilgi alınamadı.");
        setInfo(data as Refundable);
      } catch (e) {
        if (live) setLoadError(e instanceof Error ? e.message : "Bilgi alınamadı.");
      }
    })();
    return () => {
      live = false;
    };
  }, [reservationId]);

  const currency = info?.currency ?? "EUR";
  const remaining = info?.remaining ?? 0;
  const partialValue = Number(partial.replace(",", "."));
  const partialValid =
    mode === "full" || (Number.isFinite(partialValue) && partialValue > 0 && partialValue <= remaining);
  const amount = mode === "full" ? remaining : partialValue;
  const canSubmit = !!info?.refundable && partialValid && !saving;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          amount: mode === "full" ? null : partialValue,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "İade yapılamadı.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "İade yapılamadı.");
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      title="Para iadesi"
      subtitle={`${code} · ${customerName}`}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button
            variant="danger"
            icon={saving ? Loader2 : Undo2}
            disabled={!canSubmit}
            onClick={submit}
          >
            {saving
              ? "İade ediliyor…"
              : info?.refundable
                ? `${amountText(amount, currency)} iade et`
                : "İade et"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {loadError && (
          <p className="flex items-center gap-2 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[12.5px] text-adm-rose">
            <AlertCircle size={14} aria-hidden="true" /> {loadError}
          </p>
        )}

        {!info && !loadError && (
          <p className="flex items-center gap-2 text-[13px] text-adm-muted">
            <Loader2 size={14} aria-hidden="true" className="animate-spin" />
            Stripe&apos;tan tahsilat okunuyor…
          </p>
        )}

        {info && !info.refundable && (
          <p className="flex items-start gap-2 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5 text-[12.5px] text-adm-amber">
            <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            {info.reason
              ? REASON_TEXT[info.reason]
              : "Bu ödemenin tamamı zaten iade edilmiş."}
          </p>
        )}

        {info?.balance && (
          <p className="flex items-start gap-2 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2.5 text-[12.5px] text-adm-amber">
            <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Bu rezervasyonda kalan tutar ayrıca kartla ödendi (<b>{amountText(info.balance.amount, info.currency ?? "EUR")}</b>). Buradaki iade yalnız kaporayı kapsar; kalan tutarı Stripe panelinden
              {info.balance.paymentIntentId ? <> <span className="font-mono">{info.balance.paymentIntentId}</span></> : null} ödemesini iade ederek geri verin.
            </span>
          </p>
        )}

        {info?.refundable && (
          <>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-adm border border-adm-line bg-adm-line-2">
              <div className="bg-adm-surface px-3 py-2.5">
                <dt className="text-[11.5px] text-adm-muted">Tahsil edilen</dt>
                <dd className="mt-0.5 text-[15px] font-bold tabular-nums">
                  {amountText(info.captured, currency)}
                </dd>
              </div>
              <div className="bg-adm-surface px-3 py-2.5">
                <dt className="text-[11.5px] text-adm-muted">İade edilmiş</dt>
                <dd className="mt-0.5 text-[15px] font-bold tabular-nums">
                  {amountText(info.refunded, currency)}
                </dd>
              </div>
              <div className="bg-adm-surface px-3 py-2.5">
                <dt className="text-[11.5px] text-adm-muted">Kalan</dt>
                <dd className="mt-0.5 text-[15px] font-bold tabular-nums text-adm-green">
                  {amountText(remaining, currency)}
                </dd>
              </div>
            </dl>

            <Segmented
              options={[
                { value: "full", label: "Tamamı" },
                { value: "partial", label: "Bir kısmı" },
              ]}
              value={mode}
              onChange={setMode}
              label="İade tutarı"
            />

            {mode === "partial" && (
              <Field
                label={`İade tutarı (${currency})`}
                htmlFor="refund-amount"
                hint={`En fazla ${amountText(remaining, currency)}`}
                error={
                  partial && !partialValid
                    ? `0 ile ${amountText(remaining, currency)} arasında bir tutar girin.`
                    : undefined
                }
              >
                <Input
                  id="refund-amount"
                  inputMode="decimal"
                  value={partial}
                  onChange={(e) => setPartial(e.target.value)}
                  placeholder={remaining.toFixed(2)}
                  autoFocus
                />
              </Field>
            )}

            <p className="rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-adm-rose">
              <b>{amountText(amount, currency)}</b> müşterinin kartına geri gönderilecek. Bu işlem
              geri alınamaz; para Stripe hesabından çıkar ve karta ulaşması birkaç iş günü sürer.
              İade, rezervasyonun durumunu değiştirmez — iptal etmek ayrı bir işlemdir.
            </p>
          </>
        )}

        {error && (
          <p className="flex items-center gap-2 rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[12.5px] text-adm-rose">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
