"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9", color: "#0F172A", colorScheme: "light" }}>
      {/* Mobile top bar */}
      <div
        className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">TORVIAN</span>
          <span className="text-slate-500 text-[9px] font-medium uppercase tracking-widest">Admin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-slate-300 hover:text-white p-1.5"
          aria-label="Menüyü aç"
        >
          <Menu size={22} />
        </button>
      </div>

      <div className="flex">
        <AdminSidebar userEmail={userEmail} open={open} onClose={() => setOpen(false)} />
        <main className="flex-1 min-h-screen lg:ml-64 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
