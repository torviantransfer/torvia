import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    { number: "1", titleKey: "step1Title", descKey: "step1Desc", color: "#60A5FA" },
    { number: "2", titleKey: "step2Title", descKey: "step2Desc", color: "#F97316" },
    { number: "3", titleKey: "step3Title", descKey: "step3Desc", color: "#34D399" },
  ];

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#1d1d1f" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {/* Number */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-semibold"
                style={{ color: step.color, backgroundColor: `${step.color}12`, border: `1px solid ${step.color}25` }}
              >
                {step.number}
              </div>

              {/* Connector */}
              {i < 2 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+42px)] w-[calc(100%-84px)] h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              )}

              <h3 className="text-white font-semibold text-lg mb-3">{t(step.titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
