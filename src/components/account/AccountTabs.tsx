"use client";

import { usePathname } from "next/navigation";
import { CalendarCheck, User, LayoutDashboard } from "lucide-react";

const labels: Record<string, Record<string, string>> = {
  dashboard: { en: "Overview", tr: "Genel Bakış", de: "Übersicht", pl: "Przegląd", ru: "Обзор" },
  reservations: { en: "My Bookings", tr: "Rezervasyonlarım", de: "Meine Buchungen", pl: "Moje rezerwacje", ru: "Мои бронирования" },
  profile: { en: "Profile", tr: "Profil", de: "Profil", pl: "Profil", ru: "Профиль" },
};

const tabs = [
  { key: "dashboard", icon: LayoutDashboard, href: "" },
  { key: "reservations", icon: CalendarCheck, href: "/reservations" },
  { key: "profile", icon: User, href: "/profile" },
];

export default function AccountTabs({ locale }: { locale: string }) {
  const pathname = usePathname();
  const basePath = `/${locale}/account`;

  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const fullPath = `${basePath}${tab.href}`;
        const isActive = tab.href === "" ? pathname === basePath : pathname.startsWith(fullPath);
        const Icon = tab.icon;

        return (
          <a
            key={tab.key}
            href={fullPath}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon size={16} />
            {labels[tab.key]?.[locale] ?? labels[tab.key]?.en}
          </a>
        );
      })}
    </div>
  );
}
