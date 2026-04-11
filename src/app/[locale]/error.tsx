"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}
    >
      <div className="text-center px-4">
        <p
          className="text-7xl font-extrabold mb-4"
          style={{
            background: "linear-gradient(135deg, #FF3B30, #FF9500)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          500
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-8">{t("description")}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
