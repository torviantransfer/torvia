import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: "#111113", minHeight: "100vh" }}
    >
      <div className="text-center px-4">
        <p
          className="text-8xl font-extrabold mb-2"
          style={{
            background: "linear-gradient(135deg, #F97316, #F97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>
        <h1 className="text-2xl font-semibold text-white mb-2">{t("title")}</h1>
        <p className="text-[#86868b] mb-8">{t("description")}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          {t("goHome")}
        </Link>
      </div>
    </main>
  );
}
