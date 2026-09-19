"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { Button, Dialog, buttonClass, useToast } from "@/components/admin/ui";

/**
 * Shown right after /api/admin/send-payment-link creates a Stripe Checkout
 * link for a reservation taken by hand (CreateReservationScreen) or any other
 * booking still `pending`. Same kind of moment as DriverLinkDialog: a link
 * generated once that the operator now has to get in front of someone.
 *
 * The column is `minmax(0,1fr)` rather than a bare grid: a Stripe Checkout URL
 * is one unbreakable word of well over a hundred characters, and an implicit
 * grid column sizes itself to that, which pushed the link and the WhatsApp
 * button off the right edge of the dialog on every screen size.
 */
export default function PaymentLinkDialog({
  url,
  customerName,
  phone,
  title = "Ödeme linki hazır",
  message = "TORVIAN Transfer — ödeme linkiniz:",
  onClose,
}: {
  url: string;
  customerName: string;
  phone?: string;
  title?: string;
  /** The line the WhatsApp message opens with; the link follows it. */
  message?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`${message}\n${url}`);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Link kopyalandı.");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open title={title} subtitle={`${customerName} için oluşturuldu.`} onClose={onClose} width="sm:max-w-md">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
        <div className="rounded-adm-sm border border-adm-line bg-adm-surface-2 px-3 py-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-adm-muted">Link</p>
          <p className="truncate font-mono text-xs text-adm-ink-2" title={url}>
            {url}
          </p>
        </div>

        {/* WhatsApp first: it is how nearly every one of these reaches the customer. */}
        <a
          href={digits ? `https://wa.me/${digits}?text=${waMessage}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!digits}
          className={buttonClass({ variant: "brand", className: `w-full ${!digits ? "pointer-events-none opacity-50" : ""}` })}
        >
          <MessageCircle size={16} aria-hidden="true" />
          WhatsApp ile gönder
        </a>
        {!digits && <p className="-mt-1 text-center text-xs text-adm-muted">Müşterinin telefonu yok; linki kopyalayıp gönderin.</p>}

        <div className="grid grid-cols-2 gap-2.5">
          <Button className="w-full" icon={copied ? Check : Copy} onClick={copy}>
            {copied ? "Kopyalandı" : "Linki kopyala"}
          </Button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClass({ className: "w-full" })}>
            <ExternalLink size={16} aria-hidden="true" />
            Linki aç
          </a>
        </div>

        <Button variant="ghost" className="w-full" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Dialog>
  );
}
