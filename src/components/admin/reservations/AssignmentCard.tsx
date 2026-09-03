"use client";

import { useState } from "react";
import {
  Car,
  Check,
  Clock,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";
import {
  type DriverAssignment,
  type Reservation,
  ASSIGNMENT_STEPS,
  assignmentMeta,
  customerName,
  fmtDateTime,
  fmtStamp,
  legDateTime,
  regionName,
} from "./types";

interface Props {
  reservation: Reservation;
  assignment: DriverAssignment;
  onReplace: () => void;
  onUnassign: () => void;
  unassigning: boolean;
  onToast: (message: string, tone?: "ok" | "error") => void;
}

/** WhatsApp handover message — mirrors what assign-driver sends on first assignment. */
function whatsappUrl(r: Reservation, da: DriverAssignment) {
  if (!da.link_token || !da.drivers?.phone) return null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const legLabel = da.leg === "return" ? "DÖNÜŞ" : "GİDİŞ";
  const at = new Date(legDateTime(r, da.leg));
  const text = encodeURIComponent(
    `🚗 TORVIAN — Transfer Görevi (${legLabel})\n\n` +
      `📋 Kod: ${r.reservation_code}\n` +
      `👤 Müşteri: ${customerName(r)}\n` +
      `📍 Güzergah: Havalimanı → ${regionName(r)}\n` +
      `📅 Tarih: ${formatBookingDateTime(at)}\n` +
      (da.leg === "return" && da.pickup_time ? `⏰ Alış: ${da.pickup_time}\n` : "") +
      `\n🔗 Şoför Paneli:\n${origin}/driver/${da.link_token}\n\n` +
      `📄 Şoför Voucher:\n${origin}/api/driver-voucher?token=${da.link_token}`
  );
  return `https://wa.me/${da.drivers.phone.replace(/[^0-9]/g, "")}?text=${text}`;
}

const BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function AssignmentCard({
  reservation: r,
  assignment: da,
  onReplace,
  onUnassign,
  unassigning,
  onToast,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const meta = assignmentMeta(da.status);
  const isReturn = da.leg === "return";
  const wa = whatsappUrl(r, da);
  const driverPanel =
    typeof window === "undefined" ? "" : `${window.location.origin}/driver/${da.link_token}`;

  const stamps = [da.assigned_at, da.accepted_at, da.picked_up_at, da.completed_at];

  const copyLink = async () => {
    await navigator.clipboard.writeText(driverPanel);
    setCopied(true);
    onToast("Şoför paneli linki kopyalandı.");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    setEmailing(true);
    const res = await fetch("/api/admin/send-driver-assignment-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: da.id }),
    });
    if (res.ok) {
      onToast("Şoför bilgisi müşteriye e-posta ile gönderildi.");
    } else {
      const d = await res.json().catch(() => null);
      onToast(d?.error ?? "E-posta gönderilemedi.", "error");
    }
    setEmailing(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
              isReturn
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isReturn ? "DÖNÜŞ" : "GİDİŞ"}
          </span>
          <span className="truncate text-sm font-bold text-slate-900">
            {da.drivers?.full_name ?? "Şoför kaydı silinmiş"}
          </span>
          {da.drivers?.phone && (
            <a
              href={`tel:${da.drivers.phone}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-700 hover:underline"
            >
              <Phone size={11} />
              {da.drivers.phone}
            </a>
          )}
          {da.vehicles && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Car size={11} />
              <span className="font-mono font-bold">{da.vehicles.plate_number}</span>
              <span className="text-slate-400">
                {da.vehicles.brand} {da.vehicles.model}
              </span>
            </span>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip}`}>
          {meta.label}
        </span>
      </div>

      {/* Timeline */}
      <div className="px-4 pt-4">
        <div className="flex items-start">
          {ASSIGNMENT_STEPS.map((step, i) => {
            const done = i <= meta.step;
            const stamp = fmtStamp(stamps[i]);
            return (
              <div key={step} className="flex flex-1 items-start">
                <div className="flex min-w-0 flex-col items-center text-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      done
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                    }`}
                  >
                    {done ? <Check size={12} /> : i + 1}
                  </span>
                  <span
                    className={`mt-1.5 text-[10px] font-semibold leading-tight ${
                      done ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                  <span className="mt-0.5 h-3 text-[9px] text-slate-400">
                    {done && stamp ? stamp : ""}
                  </span>
                </div>
                {i < ASSIGNMENT_STEPS.length - 1 && (
                  <div
                    className={`mt-3 h-0.5 flex-1 ${
                      i < meta.step ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} className="text-slate-400" />
            Transfer: <strong className="text-slate-700">{fmtDateTime(legDateTime(r, da.leg))}</strong>
          </span>
          {da.pickup_time && (
            <span className="inline-flex items-center gap-1.5 text-orange-600">
              Otelden alış: <strong>{da.pickup_time}</strong>
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      {da.link_token && (
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3 px-4 py-3">
          {/* WhatsApp keeps its brand colour because it is the one action that
              actually hands the job over; everything else stays neutral so the
              row does not read as six equally urgent buttons. */}
          <Group label="Şoföre ilet">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                <MessageCircle size={13} />
                WhatsApp
              </a>
            )}
            <a
              href={`/api/driver-voucher?token=${da.link_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN}
            >
              <FileText size={13} className="text-slate-400" />
              Transfer belgesi
            </a>
            <button onClick={copyLink} className={BTN}>
              {copied ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} className="text-slate-400" />
              )}
              {copied ? "Kopyalandı" : "Panel linki"}
            </button>
          </Group>

          <Group label="Müşteri">
            <button onClick={sendEmail} disabled={emailing} className={`${BTN} disabled:opacity-60`}>
              <Mail size={13} className="text-slate-400" />
              {emailing ? "Gönderiliyor…" : "Şoförü bildir"}
            </button>
          </Group>

          <Group label="Atama">
            <button onClick={onReplace} className={BTN}>
              <RefreshCw size={13} className="text-slate-400" />
              Değiştir
            </button>
            <button
              onClick={onUnassign}
              disabled={unassigning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              <UserMinus size={13} />
              {unassigning ? "Kaldırılıyor…" : "Kaldır"}
            </button>
          </Group>
        </div>
      )}
    </div>
  );
}
