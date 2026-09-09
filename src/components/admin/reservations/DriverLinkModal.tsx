"use client";

import { useState } from "react";
import { Check, Copy, FileText, MessageCircle, X } from "lucide-react";

/**
 * Shown once, right after an assignment is created, to hand the job over.
 *
 * The link and the WhatsApp message are only produced by the assign call, so
 * this is the one moment they exist without a round trip. Afterwards the same
 * actions live on the assignment card.
 */
export default function DriverLinkModal({
  driverLink,
  whatsappUrl,
  driverName,
  onClose,
  onToast,
}: {
  driverLink: string;
  whatsappUrl: string;
  driverName: string;
  onClose: () => void;
  onToast: (message: string, tone?: "ok" | "error") => void;
}) {
  const [copied, setCopied] = useState(false);
  const token = driverLink.split("/driver/")[1] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Şoför atandı</h3>
            <p className="mt-1 text-sm text-slate-600">
              <strong>{driverName}</strong> için görev linki hazır.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <input
            readOnly
            value={driverLink}
            className="flex-1 truncate bg-transparent text-xs text-slate-600 outline-none"
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(driverLink);
              setCopied(true);
              onToast("Link kopyalandı.");
              setTimeout(() => setCopied(false), 2000);
            }}
            className="rounded-lg p-2 hover:bg-slate-200"
            title="Linki kopyala"
          >
            {copied ? (
              <Check size={15} className="text-emerald-600" />
            ) : (
              <Copy size={15} className="text-slate-500" />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <MessageCircle size={15} />
            WhatsApp ile gönder
          </a>
          {token && (
            <a
              href={`/api/driver-voucher?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileText size={15} />
              Şoför voucher&apos;ını önizle
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
