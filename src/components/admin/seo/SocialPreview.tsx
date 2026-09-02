"use client";

import { useState } from "react";
import { MessageCircle, ThumbsUp, AtSign, ImageOff } from "lucide-react";

type Network = "whatsapp" | "facebook" | "x";

const NETWORKS: { id: Network; label: string; icon: typeof MessageCircle }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "facebook", label: "Facebook", icon: ThumbsUp },
  { id: "x", label: "X / Twitter", icon: AtSign },
];

const SITE = "torviantransfer.com";

/**
 * How each network actually renders a shared link.
 *
 * These are not three skins of one card. WhatsApp shows a small square
 * thumbnail beside two lines of text; Facebook shows a full-width 1.91:1
 * image with the domain above the title; X shows the same image with the
 * domain below. An editor picking a photo needs to see the square crop, which
 * is where a 1200x630 image loses its edges.
 */
export default function SocialPreview({
  title,
  description,
  imageUrl,
  path,
  locale,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  path: string;
  locale: string;
}) {
  const [network, setNetwork] = useState<Network>("whatsapp");

  const url = `${SITE}/${locale}${path ? `/${path}` : ""}`;
  const shownTitle = title || "Başlık yok";
  const shownDesc = description || "Açıklama yok";

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Paylaşım önizleme
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white border border-slate-200 p-0.5">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNetwork(n.id)}
              title={n.label}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: network === n.id ? "#0f172a" : "transparent",
                color: network === n.id ? "#fff" : "#64748b",
              }}
            >
              <n.icon size={12} />
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-100">
        {network === "whatsapp" && (
          <div className="max-w-[320px] ml-auto">
            <div className="rounded-lg rounded-br-sm bg-[#d9fdd3] p-1.5 shadow-sm">
              <div className="rounded-md bg-black/[0.06] overflow-hidden flex">
                <Thumb src={imageUrl} className="w-[72px] h-[72px] shrink-0" />
                <div className="px-2.5 py-2 min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-slate-900 leading-tight line-clamp-2">
                    {shownTitle}
                  </p>
                  <p className="text-[11.5px] text-slate-600 leading-tight line-clamp-1 mt-0.5">
                    {shownDesc}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{url}</p>
                </div>
              </div>
              <p className="px-1 pt-1.5 text-[13px] text-slate-800 break-all">https://{url}</p>
            </div>
            <p className="mt-2 text-[10.5px] text-slate-500 text-right">
              WhatsApp görseli kareye kırpar — kenarlardaki detaylar kaybolur.
            </p>
          </div>
        )}

        {network === "facebook" && (
          <div className="max-w-[420px] mx-auto rounded-lg overflow-hidden border border-slate-300 bg-white shadow-sm">
            <Thumb src={imageUrl} className="w-full aspect-[1.91/1]" />
            <div className="px-3 py-2.5 bg-[#f2f3f5] border-t border-slate-200">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{SITE}</p>
              <p className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                {shownTitle}
              </p>
              <p className="text-[12.5px] text-slate-600 leading-snug line-clamp-1 mt-0.5">
                {shownDesc}
              </p>
            </div>
          </div>
        )}

        {network === "x" && (
          <div className="max-w-[420px] mx-auto rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-sm relative">
            <Thumb src={imageUrl} className="w-full aspect-[1.91/1]" />
            <div className="px-3 py-2.5">
              <p className="text-[14px] font-semibold text-slate-900 leading-snug line-clamp-1">
                {shownTitle}
              </p>
              <p className="text-[13px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                {shownDesc}
              </p>
              <p className="text-[13px] text-slate-500 mt-1">{SITE}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Thumb({ src, className }: { src?: string | null; className: string }) {
  if (!src) {
    return (
      <div
        className={`${className} bg-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400`}
      >
        <ImageOff size={20} />
        <span className="text-[10px] font-medium">Görsel yok</span>
      </div>
    );
  }
  return (
    // A social crawler fetches the raw file, not next/image's optimised
    // output, so the preview deliberately uses the same raw URL the meta tag
    // will carry — a broken path shows as broken here too.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} object-cover bg-slate-200`} />
  );
}
