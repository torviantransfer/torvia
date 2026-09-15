"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button, Dialog, IconButton, buttonClass, useToast } from "@/components/admin/ui";

/**
 * Shown right after /api/admin/send-payment-link creates a Stripe Checkout
 * link for a reservation taken by hand (CreateReservationScreen) or any other
 * booking still `pending`. Same shape as DriverLinkDialog — copy or hand off
 * over WhatsApp — because it is the same kind of moment: a link generated
 * once that the operator now has to get in front of someone.
 */
export default function PaymentLinkDialog({
  url,
  customerName,
  phone,
  onClose,
}: {
  url: string;
  customerName: string;
  phone?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`TORVIAN Transfer — ödeme linkiniz:\n${url}`);

  return (
    <Dialog open title="Ödeme linki hazır" subtitle={`${customerName} için oluşturuldu.`} onClose={onClose} width="sm:max-w-md">
      <div className="grid gap-2.5">
        <div className="flex items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-surface-2 py-1 pe-1 ps-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-adm-ink-2">{url}</span>
          <IconButton
            icon={copied ? Check : Copy}
            label="Linki kopyala"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              toast("Link kopyalandı.");
              window.setTimeout(() => setCopied(false), 2000);
            }}
          />
        </div>
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
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Dialog>
  );
}
