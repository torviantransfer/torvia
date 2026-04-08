"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

export default function ExportButton() {
  const [open, setOpen] = useState(false);

  const doExport = (format: "csv" | "excel") => {
    setOpen(false);
    window.open(`/api/admin/export?format=${format}`, "_blank");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
      >
        <Download size={15} />
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-100 shadow-lg py-1 w-44">
            <button
              onClick={() => doExport("csv")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText size={15} className="text-green-600" />
              CSV Aktar
            </button>
            <button
              onClick={() => doExport("excel")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Excel Aktar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
