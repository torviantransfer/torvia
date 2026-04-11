const fs = require("fs");
const path = require("path");

const base = __dirname;

function readFile(rel) {
  return fs.readFileSync(path.join(base, rel), "utf8");
}

function writeFile(rel, content) {
  fs.writeFileSync(path.join(base, rel), content, "utf8");
  console.log(`✅ ${rel}`);
}

// ===== 1. FIX LocalSeoBlock.tsx — completely rewrite the destroyed file =====
{
  const file = "src/components/home/LocalSeoBlock.tsx";
  const content = `"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin, Plane, Shield, Star } from "lucide-react";

export default function LocalSeoBlock() {
  const t = useTranslations("localSeo");

  const destinations = [
    { label: "Belek Transfer", slug: "belek" },
    { label: "Side Transfer", slug: "side" },
    { label: "Alanya Transfer", slug: "alanya" },
    { label: "Kemer Transfer", slug: "kemer" },
    { label: "Kundu-Lara Transfer", slug: "kundu-lara" },
    { label: "Kaş Transfer", slug: "kas" },
    { label: "Fethiye Transfer", slug: "fethiye" },
    { label: "Marmaris Transfer", slug: "marmaris" },
    { label: "Manavgat Transfer", slug: "manavgat" },
    { label: "Beldibi Transfer", slug: "beldibi" },
    { label: "Kalkan Transfer", slug: "kalkan" },
    { label: "Tekirova Transfer", slug: "tekirova" },
  ];

  const features = [
    { icon: Plane, label: t("feat1"), color: "#007AFF" },
    { icon: Shield, label: t("feat2"), color: "#34C759" },
    { icon: Star, label: t("feat3"), color: "#FF9500" },
    { icon: MapPin, label: t("feat4"), color: "#007AFF" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-500 text-base leading-relaxed max-w-3xl mx-auto">
            {t("paragraph1")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {destinations.map((dest) => (
            <Link
              key={dest.slug}
              href={\`/\${dest.slug}-transfer\`}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-500/30 transition-colors"
              style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <MapPin size={10} className="inline mr-1" />
              {dest.label}
            </Link>
          ))}
        </div>

        <div className="space-y-5 text-gray-500 text-sm leading-relaxed">
          <p>{t("paragraph2")}</p>
          <p>{t("paragraph3")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 text-gray-600 text-xs font-medium">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                <Icon size={14} style={{ color }} className="shrink-0" />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`;
  writeFile(file, content);
}

// ===== 2. Reduce hero padding on ALL pages (py-24 → py-14 sm:py-18) =====
const heroPages = [
  "src/app/[locale]/about/page.tsx",
  "src/app/[locale]/contact/page.tsx",
  "src/app/[locale]/faq/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/terms/page.tsx",
  "src/app/[locale]/cookies/page.tsx",
  "src/app/[locale]/cancellation/page.tsx",
  "src/app/[locale]/kvkk/page.tsx",
];

for (const file of heroPages) {
  let c = readFile(file);
  // Replace hero section py-24 with smaller padding
  c = c.replace(
    /className="relative py-24 overflow-hidden"/g,
    'className="relative py-14 sm:py-18 overflow-hidden"'
  );
  // Also reduce glow circle size for smaller hero
  c = c.replace(
    /w-\[700px\] h-\[700px\]/g,
    'w-[500px] h-[500px]'
  );
  c = c.replace(
    /w-\[600px\] h-\[600px\]/g,
    'w-[400px] h-[400px]'
  );
  // Reduce h1 size for mobile — text-3xl lg:text-5xl → text-2xl sm:text-3xl lg:text-4xl
  c = c.replace(
    /text-3xl lg:text-5xl font-bold mb-5/g,
    'text-2xl sm:text-3xl lg:text-4xl font-bold mb-3'
  );
  c = c.replace(
    /text-4xl lg:text-5xl font-bold mb-5/g,
    'text-2xl sm:text-3xl lg:text-4xl font-bold mb-3'
  );
  // Add warmer gradient to hero bg
  c = c.replace(
    /background: "linear-gradient\(180deg, #F5F5F7 0%, #FFFFFF 100%\)"/g,
    'background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)"'
  );
  writeFile(file, c);
}

// ===== 3. FAQ page — professional redesign =====
{
  const file = "src/app/[locale]/faq/page.tsx";
  let c = readFile(file);
  
  // Replace imports to add more icons
  c = c.replace(
    'import { ArrowRight, MessageCircle } from "lucide-react";',
    'import { ArrowRight, MessageCircle, HelpCircle, Search } from "lucide-react";'
  );

  // Replace entire FAQ main content section with professional design
  c = c.replace(
    /<section className="py-20">\s*<div className="max-w-3xl mx-auto px-4 space-y-3">\s*\{faqKeys\.map/,
    `{/* Category header */}
        <section className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            {/* Search-like visual hint */}
            <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Search size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">{t("subtitle")}</span>
            </div>

            <div className="space-y-3">
            {faqKeys.map`
  );

  // Improve FAQ items with number badges and better styling
  c = c.replace(
    /\{faqKeys\.map\(\(i\) => \(\s*<details key=\{i\} className="rounded-2xl overflow-hidden group" style=\{\{ backgroundColor: "#FFFFFF", border: "1px solid rgba\(0,0,0,0\.06\)" \}\}>\s*<summary className="px-6 py-5 cursor-pointer font-semibold text-gray-900 text-sm flex items-center justify-between transition-colors">\s*\{t\(`q\$\{i\}`\)\}/,
    `{faqKeys.map((i) => (
              <details key={i} className="rounded-2xl overflow-hidden group transition-all hover:shadow-md" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                <summary className="px-5 sm:px-6 py-4 sm:py-5 cursor-pointer font-semibold text-gray-900 text-sm flex items-center gap-3 transition-colors">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: i <= 4 ? "#007AFF" : i <= 8 ? "#FF9500" : "#34C759" }}>{i}</span>
                  <span className="flex-1">{t(\`q\${i}\`)}</span>`
  );

  // Fix answer section — add icon
  c = c.replace(
    /<div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed pt-1" style=\{\{ borderTop: "1px solid rgba\(0,0,0,0\.03\)" \}\}>/g,
    '<div className="px-5 sm:px-6 pb-5 text-sm text-gray-600 leading-relaxed pt-2 ml-10" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>'
  );

  // Fix the "Still need help" CTA
  c = c.replace(
    /\{\/\* Still need help CTA \*\/\}\s*<div className="mt-12 rounded-2xl p-8 text-center"/,
    `</div>
            
            {/* Still need help CTA */}
            <div className="mt-10 rounded-2xl p-6 sm:p-8 text-center"`
  );

  // Clean up closing divs — the old structure had </div> for space-y-3 and </div> for max-w
  // We need to make sure the structure is correct
  // Remove one extra closing </div> since we added one already
  c = c.replace(
    /\{t\("contactUs"\)\} <ArrowRight size=\{16\} \/>\s*<\/Link>\s*<\/div>\s*<\/div>\s*<\/section>/,
    `{t("contactUs")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>`
  );

  writeFile(file, c);
}

// ===== 4. Contact page — redesign stats bar =====
{
  const file = "src/app/[locale]/contact/page.tsx";
  let c = readFile(file);

  // Replace the entire stats bar section with a better design
  c = c.replace(
    /\{\/\* Stats bar \*\/\}\s*<section style=\{\{ backgroundColor: "#F5F5F7", borderBottom: "1px solid rgba\(0,0,0,0\.06\)" \}\}>\s*<div className="max-w-5xl mx-auto px-4 py-6">\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-4">/,
    `{/* Stats bar */}
        <section className="border-b" style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">`
  );

  // Replace stats items rendering with compact pill design
  c = c.replace(
    /\.map\(\(\{ icon: Icon, labelKey, subKey, color, bg \}\) => \(\s*<div key=\{labelKey\} className="flex items-center gap-3">\s*<div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style=\{\{ backgroundColor: bg \}\}>\s*<Icon size=\{18\} style=\{\{ color \}\} strokeWidth=\{1\.5\} \/>\s*<\/div>\s*<div>\s*<p className="text-sm font-bold text-gray-900">\{t\(labelKey\)\}<\/p>\s*<p className="text-xs text-gray-500">\{t\(subKey\)\}<\/p>\s*<\/div>\s*<\/div>/,
    `.map(({ icon: Icon, labelKey, subKey, color, bg }) => (
                <div key={labelKey} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon size={18} style={{ color }} strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{t(labelKey)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{t(subKey)}</p>
                  </div>
                </div>`
  );

  writeFile(file, c);
}

// ===== 5. Login page — modern redesign =====
{
  const file = "src/app/[locale]/account/login/page.tsx";
  let c = readFile(file);

  // Fix button className — the bg-blue- is broken
  c = c.replace(
    /className="w-full py-3 bg-blue- -white font-bold rounded-xl/,
    'className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl'
  );

  // Google button — add proper border
  c = c.replace(
    /className="w-full py-3 mb-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-60"/,
    'className="w-full py-3 mb-4 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-60 shadow-sm"'
  );

  // Wrap the form area in a proper card
  c = c.replace(
    '<div className="max-w-md mx-auto px-4 py-16">',
    `<div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">`
  );

  // Add gradient background to main
  c = c.replace(
    '<main className="flex-1 bg-white">',
    '<main className="flex-1" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.03) 0%, rgba(255,149,0,0.02) 50%, #FFFFFF 100%)" }}>'
  );

  // Close the extra wrapper div
  c = c.replace(
    /(<p className="text-center text-sm text-gray-500 mt-6">[\s\S]*?<\/p>)\s*<\/div>\s*<\/main>/,
    `$1
        </div>
        </div>
      </main>`
  );

  // Fix hover colors that reference old dark theme
  c = c.replace(
    /className="text-blue-600 hover:text-blue-600 font-medium"/g,
    'className="text-blue-600 hover:text-blue-700 font-medium"'
  );
  c = c.replace(
    /className="text-blue-600 hover:text-blue-600 text-sm font-medium underline"/,
    'className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"'
  );

  // Fix error/success message colors for light theme
  c = c.replace(
    'className="flex items-center gap-2 text-green-400 text-sm"',
    'className="flex items-center gap-2 text-green-600 text-sm"'
  );

  writeFile(file, c);
}

// ===== 6. Track page — improved design with hero and better layout =====
{
  const file = "src/app/[locale]/track/page.tsx";
  const content = `import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackReservation from "@/components/TrackReservation";
import { Search, Shield, Clock, MapPin } from "lucide-react";

export default async function TrackPage() {
  const t = await getTranslations("track");

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-14 sm:py-18 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
              <Search size={24} className="text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">
              {t("title")}
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Trust pills */}
        <section className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield size={13} className="text-green-500" />
                <span>{t("secureSearch") ?? "Güvenli Arama"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-blue-500" />
                <span>{t("realTimeStatus") ?? "Anlık Durum"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-500" />
                <span>{t("trackDriver") ?? "Sürücü Takibi"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="py-10 sm:py-16">
          <div className="max-w-2xl mx-auto px-4">
            <TrackReservation />
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
`;
  writeFile(file, content);
}

// ===== 7. TrackReservation.tsx — fix text colors for light theme =====
{
  const file = "src/components/TrackReservation.tsx";
  let c = readFile(file);
  
  // Fix all text-gray-900 buttons on colored backgrounds → text-white
  c = c.replace(
    /from-blue-500 to-blue-600 text-gray-900 font-bold/g,
    'from-blue-500 to-blue-600 text-white font-bold'
  );
  c = c.replace(
    /from-blue-500 to-blue-600 text-gray-900 font-semibold/g,
    'from-blue-500 to-blue-600 text-white font-semibold'
  );
  c = c.replace(
    /bg-\[#25D366\]\/90 text-gray-900 font-semibold/,
    'bg-[#25D366]/90 text-white font-semibold'
  );
  c = c.replace(
    /bg-red-500 text-gray-900 font-semibold/,
    'bg-red-500 text-white font-semibold'
  );
  
  // Fix muted text colors that are too light for light theme
  c = c.replace(/text-gray-600(?! )/g, 'text-gray-500');
  c = c.replace(/text-emerald-300/g, 'text-emerald-600');
  c = c.replace(/text-red-300/g, 'text-red-500');
  c = c.replace(/text-blue-300/g, 'text-blue-600');
  c = c.replace(/text-amber-300/g, 'text-amber-600');
  c = c.replace(/text-blue-500"/g, 'text-blue-600"');
  c = c.replace(/text-gray-300/g, 'text-gray-600');

  // Fix cancel button back bg
  c = c.replace(
    'bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-100',
    'bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50'
  );

  // Fix form backgrounds
  c = c.replace(
    /bg-gradient-to-b from-white\/\[0\.07\] to-white\/\[0\.03\]/g,
    'bg-white'
  );

  writeFile(file, c);
}

console.log("\n🎉 All fixes applied!");
