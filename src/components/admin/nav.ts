import {
  CalendarDays,
  Car,
  FileText,
  Landmark,
  Layers,
  LayoutTemplate,
  MapPin,
  NotebookText,
  Radio,
  SearchCheck,
  Settings,
  Star,
  Sun,
  Tags,
  Ticket,
  TicketPercent,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Remembers a collapsed sidebar; read on the server so the page never jumps. */
export const SIDEBAR_COOKIE = "adm_sidebar";

export type NavCounter = "reservations" | "reviews" | "live";

export interface NavItem {
  /** Under /[locale]/admin; "" is the admin home. */
  path: string;
  label: string;
  icon: LucideIcon;
  /** Other screens that belong to this entry. */
  also?: string[];
  counter?: NavCounter;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** What the sidebar badges and the "N kişi sitede" pill show — /api/admin/shell. */
export interface ShellCounts {
  /** Upcoming paid transfers with a leg still lacking a driver. */
  needsDriver: number;
  cancelRequests: number;
  pendingReviews: number;
  /** Visitors seen in the last 90 seconds. */
  liveNow: number;
}

/** docs/admin-tasarim.md, bölüm 3.1. */
export const ADMIN_NAV: NavGroup[] = [
  {
    title: "Operasyon",
    items: [
      { path: "", label: "Bugün", icon: Sun },
      { path: "/reservations", label: "Rezervasyonlar", icon: Ticket, counter: "reservations" },
      { path: "/availability", label: "Takvim & Kapasite", icon: CalendarDays, also: ["/calendar"] },
      { path: "/live-visitors", label: "Canlı Ziyaretçiler", icon: Radio, counter: "live" },
    ],
  },
  {
    title: "Filo & Ekip",
    items: [
      { path: "/drivers", label: "Şoförler", icon: Users },
      { path: "/vehicles", label: "Araçlar", icon: Car },
      // The classes a customer chooses between when booking, as opposed to
      // /vehicles, which is the physical fleet.
      { path: "/vehicle-categories", label: "Araç Tipleri", icon: Layers },
      { path: "/driver-payments", label: "Şoför Ödemeleri", icon: Wallet },
    ],
  },
  {
    title: "Finans",
    items: [
      { path: "/finance", label: "Kasa", icon: Landmark },
      { path: "/pricing", label: "Fiyatlandırma", icon: Tags },
      { path: "/coupons", label: "Kuponlar", icon: TicketPercent },
    ],
  },
  {
    title: "Site & Pazarlama",
    items: [
      { path: "/regions", label: "Bölgeler", icon: MapPin },
      { path: "/reviews", label: "Değerlendirmeler", icon: Star, counter: "reviews" },
      { path: "/blog", label: "Blog Yazıları", icon: FileText },
      { path: "/landing", label: "Landing Sayfaları", icon: LayoutTemplate },
      { path: "/booking-content", label: "Booking Sayfası İçeriği", icon: NotebookText },
      { path: "/seo", label: "SEO Yönetimi", icon: SearchCheck },
    ],
  },
  {
    title: "Sistem",
    items: [{ path: "/settings", label: "Ayarlar", icon: Settings }],
  },
];

export const navHref = (base: string, item: NavItem) => base + item.path;

/** The menu entry a pathname belongs to — the longest matching path wins. */
export function matchNav(pathname: string, base: string): NavItem | null {
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length);
  let best: NavItem | null = null;
  let bestLength = -1;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      for (const path of [item.path, ...(item.also ?? [])]) {
        const hit = path === "" ? rest === "" || rest === "/" : rest === path || rest.startsWith(`${path}/`);
        if (hit && path.length > bestLength) {
          best = item;
          bestLength = path.length;
        }
      }
    }
  }
  return best;
}
