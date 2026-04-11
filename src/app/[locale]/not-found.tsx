import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}
    >
      <div className="text-center px-4">
        <p
          className="text-8xl font-extrabold mb-2"
          style={{
            background: "linear-gradient(135deg, #007AFF, #5856D6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-8">{t("description")}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {t("goHome")}
        </Link>
      </div>
    </main>
  );
}
