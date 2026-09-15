import type { Tone } from "./cx";

export interface StatusLook {
  label: string;
  tone: Tone;
  /** Finished and out of the way: shown paler than a live state of the same colour. */
  faded?: boolean;
}

/** docs/admin-tasarim.md, bölüm 4.1. */
export const RESERVATION_STATUS: Record<string, StatusLook> = {
  pending: { label: "Ödeme bekliyor", tone: "amber" },
  paid: { label: "Ödendi", tone: "green" },
  deposit_paid: { label: "Kapora ödendi", tone: "teal" },
  driver_assigned: { label: "Şoför atandı", tone: "blue" },
  passenger_picked_up: { label: "Yolcu alındı", tone: "violet" },
  completed: { label: "Tamamlandı", tone: "green", faded: true },
  cancel_requested: { label: "İptal talebi", tone: "rose" },
  cancelled: { label: "İptal edildi", tone: "neutral" },
};

export const ASSIGNMENT_STATUS: Record<string, StatusLook> = {
  assigned: { label: "Şoföre gönderildi", tone: "neutral" },
  accepted: { label: "Şoför kabul etti", tone: "blue" },
  picked_up: { label: "Yolcu alındı", tone: "violet" },
  completed: { label: "Tamamlandı", tone: "green" },
};

export const statusLook = (map: Record<string, StatusLook>, value: string | null | undefined): StatusLook =>
  (value && map[value]) || { label: value || "—", tone: "neutral" };
