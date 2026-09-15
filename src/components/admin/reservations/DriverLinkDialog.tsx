"use client";

import { useState } from "react";
import { Check, Copy, FileText, MessageCircle } from "lucide-react";
import { Button, Dialog, IconButton, buttonClass, useToast } from "@/components/admin/ui";

/**
 * Shown once, right after an assignment is made, to hand the job over. The link
 * and the WhatsApp message come back from the assign call; afterwards the same
 * actions live on the driver's card.
 */
export default function DriverLinkDialog({
  driverLink,
  whatsappUrl,
  driverName,
  onClose,
}: {
  driverLink: string;
  whatsappUrl: string;
  driverName: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const token = driverLink.split("/driver/")[1] ?? "";

  return (
    <Dialog open title="Şoför atandı" subtitle={`${driverName} için görev linki hazır.`} onClose={onClose} width="sm:max-w-md">
      <div className="grid gap-2.5">
        <div className="flex items-center gap-2 rounded-adm-sm border border-adm-line bg-adm-surface-2 py-1 pe-1 ps-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-adm-ink-2">{driverLink}</span>
          <IconButton
            icon={copied ? Check : Copy}
            label="Linki kopyala"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(driverLink);
              setCopied(true);
              toast("Link kopyalandı.");
              window.setTimeout(() => setCopied(false), 2000);
            }}
          />
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "brand", className: "w-full" })}
        >
          <MessageCircle size={16} aria-hidden="true" />
          WhatsApp ile gönder
        </a>
        {token && (
          <a
            href={`/api/driver-voucher?token=${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ className: "w-full" })}
          >
            <FileText size={16} aria-hidden="true" />
            Şoför voucher&apos;ını aç
          </a>
        )}
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Dialog>
  );
}
