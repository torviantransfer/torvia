"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Loader2, XCircle } from "lucide-react";

interface Props {
  token: string;
  onVerified: () => void;
}

export default function QRScanner({ token, onVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);

  const handleScan = useCallback(async (qrValue: string) => {
    setResult("loading");
    setMessage("Doğrulanıyor...");

    try {
      const response = await fetch("/api/driver/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, qrValue }),
      });
      const data = await response.json();

      if (response.ok && data.verified) {
        setResult("success");
        setMessage(data.message ?? "QR başarıyla doğrulandı. Müşteri onaylandı.");
        setTimeout(() => {
          setOpen(false);
          setResult("idle");
          onVerified();
        }, 1600);
        return;
      }

      setResult("error");
      setMessage(data.error ?? "Geçersiz QR kodu.");
    } catch {
      setResult("error");
      setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  }, [onVerified, token]);

  useEffect(() => {
    if (!open) return;

    let scanner: { stop: () => Promise<void>; clear: () => Promise<void> } | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      const qr = new Html5Qrcode("qr-reader");
      scanner = qr as unknown as typeof scanner;

      try {
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              await qr.stop();
            } catch {
              // Scanner may already be stopped after a successful read.
            }
            await handleScan(decodedText);
          },
          () => {}
        );
      } catch {
        setMessage("Kamera izni verilmedi veya kamera kullanılamıyor.");
        setResult("error");
      }
    })();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [handleScan, open]);

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setResult("idle");
          setMessage("");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-black text-white hover:bg-blue-800"
      >
        <Camera size={18} />
        Yolcu QR Kodunu Tara
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h3 className="flex items-center gap-2 font-black text-slate-950">
          <Camera size={16} className="text-blue-700" />
          QR Tarayıcı
        </h3>
        <button
          onClick={() => {
            setOpen(false);
            setResult("idle");
          }}
          className="text-slate-400 hover:text-slate-700"
        >
          <XCircle size={20} />
        </button>
      </div>

      {result === "idle" && (
        <>
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <p className="p-3 text-center text-xs font-medium text-slate-500">
            Kamerayı yolcunun QR koduna doğrultun.
          </p>
        </>
      )}

      {result === "loading" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={40} className="animate-spin text-blue-700" />
          <p className="text-sm font-semibold text-slate-600">{message}</p>
        </div>
      )}

      {result === "success" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2 size={48} className="text-emerald-500" />
          <p className="text-center text-sm font-black text-emerald-700">{message}</p>
        </div>
      )}

      {result === "error" && (
        <div className="flex flex-col items-center gap-3 px-5 py-12">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-center text-sm font-black text-red-700">{message}</p>
          <button
            onClick={() => {
              setOpen(false);
              setTimeout(() => setOpen(true), 100);
              setResult("idle");
            }}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}
