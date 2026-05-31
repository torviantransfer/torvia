"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, XCircle, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  token: string;
  onVerified: () => void;
}

export default function QRScanner({ token, onVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  useEffect(() => {
    if (!open) return;

    let scanner: { clear: () => Promise<void>; stop: () => Promise<void> } | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      const qr = new Html5Qrcode("qr-reader");
      scanner = qr as unknown as typeof scanner;
      html5QrRef.current = qr;

      try {
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // Stop scanning after first read
            try { await qr.stop(); } catch { /* */ }
            await handleScan(decodedText);
          },
          () => {} // ignore errors during scanning
        );
      } catch {
        setMessage("Camera access denied or not available.");
        setResult("error");
      }
    })();

    return () => {
      if (scanner) {
        try { (scanner as { stop: () => Promise<void> }).stop().catch(() => {}); } catch { /* */ }
      }
    };
  }, [open]);

  const handleScan = async (qrValue: string) => {
    setResult("loading");
    setMessage("Verifying...");

    try {
      const response = await fetch("/api/driver/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, qrValue }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setResult("success");
        setMessage(data.message ?? "QR başarıyla doğrulandı — müşteri onaylandı!");
        setTimeout(() => {
          setOpen(false);
          setResult("idle");
          onVerified();
        }, 2000);
      } else {
        setResult("error");
        setMessage(data.error ?? "Geçersiz QR kodu.");
      }
    } catch {
      setResult("error");
      setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setResult("idle"); setMessage(""); }}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Camera size={18} />
        Yolcu QR Kodunu Tara
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Camera size={16} className="text-indigo-600" />
          QR Tarayıcı
        </h3>
        <button
          onClick={() => { setOpen(false); setResult("idle"); }}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={20} />
        </button>
      </div>

      {result === "idle" && (
        <>
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <p className="text-center text-xs text-gray-400 p-3">
            Kamerayı yolcunun QR koduna doğrultun
          </p>
        </>
      )}

      {result === "loading" && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}

      {result === "success" && (
        <div className="flex flex-col items-center py-12 gap-3">
          <CheckCircle2 size={48} className="text-green-500" />
          <p className="text-sm font-bold text-green-700">{message}</p>
        </div>
      )}

      {result === "error" && (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-sm font-bold text-red-700">{message}</p>
          <button
            onClick={() => { setOpen(false); setTimeout(() => setOpen(true), 100); setResult("idle"); }}
            className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
          >
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}
