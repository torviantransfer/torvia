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
      <div className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 p-5 mb-4 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{userName}</p>
            <p className="text-gray-500 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {menuItems.map((item) => {
          const fullPath = `${basePath}${item.href}`;
          const isActive = item.href === "" ? pathname === basePath : pathname.startsWith(fullPath);
          const Icon = item.icon;

          return (
            <a
              key={item.key}
              href={fullPath}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-all ${
                isActive
                  ? "bg-orange-500/10 text-orange-400 font-semibold border-l-2 border-orange-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <Icon size={17} />
              {labels[item.key]?.[locale] ?? labels[item.key]?.en}
            </a>
          );
        })}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all border-t border-white/5 border-l-2 border-l-transparent"
        >
          <LogOut size={17} />
          {labels.logout[locale] ?? labels.logout.en}
        </button>
      </nav>
    </div>
  );
}
