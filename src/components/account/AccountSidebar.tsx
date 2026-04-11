"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  CalendarCheck,
  User,
  LogOut,
} from "lucide-react";

interface Props {
  locale: string;
  userEmail: string;
  userName: string;
}

const menuItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "" },
  { key: "reservations", icon: CalendarCheck, href: "/reservations" },
  { key: "profile", icon: User, href: "/profile" },
];

const labels: Record<string, Record<string, string>> = {
  dashboard: { en: "Dashboard", tr: "Panel", de: "Dashboard", pl: "Panel", ru: "Панель" },
  reservations: { en: "My Reservations", tr: "Rezervasyonlarım", de: "Meine Buchungen", pl: "Moje rezerwacje", ru: "Мои бронирования" },
  profile: { en: "Profile", tr: "Profil", de: "Profil", pl: "Profil", ru: "Профиль" },
  logout: { en: "Sign Out", tr: "Çıkış", de: "Abmelden", pl: "Wyloguj", ru: "Выйти" },
};

export default function AccountSidebar({ locale, userEmail, userName }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const basePath = `/${locale}/account`;

  return (
    <div className="lg:w-72 flex-shrink-0">
      {/* User info */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {menuItems.map((item) => {
          const fullPath = `${basePath}${item.href}`;
          const isActive = item.href === "" ? pathname === basePath : pathname.startsWith(fullPath);
          const Icon = item.icon;

          return (
            <a
              key={item.key}
              href={fullPath}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-all border-l-2 ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold border-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
              }`}
            >
              <Icon size={17} />
              {labels[item.key]?.[locale] ?? labels[item.key]?.en}
            </a>
          );
        })}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50/50 transition-all border-l-2 border-transparent"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <LogOut size={17} />
          {labels.logout[locale] ?? labels.logout.en}
        </button>
      </nav>
    </div>
  );
}
