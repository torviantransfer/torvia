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
        setMessage("camera_denied");
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
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] px-4 text-[16px] font-semibold text-white transition active:scale-[0.99]"
      >
        <Camera size={18} />
        Yolcunun QR kodunu okut
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] bg-[#F2F2F7]">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
          <Camera size={16} className="text-[#007AFF]" />
          QR Tarayıcı
        </h3>
        <button
          onClick={() => {
            setOpen(false);
            setResult("idle");
          }}
          className="text-[#8E8E93]"
        >
          <XCircle size={20} />
        </button>
      </div>

      {result === "idle" && (
        <>
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <p className="p-3 text-center text-[13px] text-[#6e6e73]">
            Kamerayı yolcunun QR koduna doğrultun.
          </p>
        </>
      )}

      {result === "loading" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={36} className="animate-spin text-[#007AFF]" />
          <p className="text-[15px] font-medium text-[#6e6e73]">{message}</p>
        </div>
      )}

      {result === "success" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2 size={44} className="text-[#34C759]" />
          <p className="text-center text-[15px] font-semibold text-[#248A3D]">{message}</p>
        </div>
      )}

      {result === "error" && (
        <div className="flex flex-col items-center gap-3 px-5 py-12">
          <AlertTriangle size={44} className="text-[#FF3B30]" />
          {message === "camera_denied" ? (
            <>
              <p className="text-center text-[15px] font-semibold text-[#D70015]">
                Kamera erişimine izin verilmedi.
              </p>
              <p className="text-center text-[13px] text-[#6e6e73]">
                Tarayıcı ayarlarından kamera iznini açın, ardından sayfayı yenileyin.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 h-10 rounded-[12px] bg-[#007AFF] px-5 text-[15px] font-semibold text-white"
              >
                Sayfayı Yenile
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-[15px] font-semibold text-[#D70015]">{message}</p>
              <button
                onClick={() => setResult("idle")}
                className="mt-2 h-10 rounded-[12px] bg-[#007AFF] px-5 text-[15px] font-semibold text-white"
              >
                Tekrar Dene
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
