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

// ===== 1. TestimonialsSection — all cards same white bg =====
{
  const file = "src/components/home/TestimonialsSection.tsx";
  let c = readFile(file);
  // First 3 cards: rgba(0,0,0,0.03) → #FFFFFF
  c = c.replace(
    /backgroundColor: "rgba\(0,0,0,0\.03\)"/g,
    'backgroundColor: "#FFFFFF"'
  );
  writeFile(file, c);
}

// ===== 2. TrustBadges — smaller cards, vibrant icon bg, better spacing =====
{
  const file = "src/components/home/TrustBadges.tsx";
  let c = readFile(file);
  // p-7 → p-5
  c = c.replace(/className="group p-7 rounded-2xl/g, 'className="group p-5 rounded-2xl');
  // icon bg from ${color}15 to ${color}20 for more visibility
  c = c.replace(/backgroundColor: `\$\{color\}15`/g, "backgroundColor: `${color}25`");
  // w-10 h-10 → w-11 h-11 for icon box
  c = c.replace(/className="w-10 h-10 rounded-xl flex/g, 'className="w-11 h-11 rounded-xl flex');
  // mb-5 → mb-4
  c = c.replace(/justify-center mb-5"/g, 'justify-center mb-4"');
  // text-base → text-[15px]
  c = c.replace(/text-gray-900 font-semibold text-base mb-2/g, 'text-gray-900 font-semibold text-[15px] mb-1.5');
  writeFile(file, c);
}

// ===== 3. LocalSeoBlock — varied icon colors =====
{
  const file = "src/components/home/LocalSeoBlock.tsx";
  let c = readFile(file);
  // Replace the mini feature icons block with varied colors
  c = c.replace(
    /\{[\s\S]*?\{ icon: Plane, label: t\("feat1"\) \},[\s\S]*?\{ icon: Shield, label: t\("feat2"\) \},[\s\S]*?\{ icon: Star, label: t\("feat3"\) \},[\s\S]*?\{ icon: MapPin, label: t\("feat4"\) \},[\s\S]*?\]\.map\(\(\{ icon: Icon, label \}\) => \(\s*<div key=\{label\} className="flex items-center gap-2 text-gray-500 text-xs">\s*<Icon size=\{14\} className="text-blue-600 shrink-0" \/>\s*<span>\{label\}<\/span>\s*<\/div>\s*\)\)\}/,
    `{[
            { icon: Plane, label: t("feat1"), color: "#007AFF" },
            { icon: Shield, label: t("feat2"), color: "#34C759" },
            { icon: Star, label: t("feat3"), color: "#FF9500" },
            { icon: MapPin, label: t("feat4"), color: "#007AFF" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 text-gray-600 text-xs font-medium">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                <Icon size={14} style={{ color }} className="shrink-0" />
              </div>
              <span>{label}</span>
            </div>
          ))}`
  );
  writeFile(file, c);
}

// ===== 4. ContactForm — fix button text color =====
{
  const file = "src/components/ContactForm.tsx";
  let c = readFile(file);
  c = c.replace(
    /text-gray-900 font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500\/20/,
    'text-white font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20'
  );
  writeFile(file, c);
}

// ===== 5. About page — fix English text, vehicle overlay, vary icon colors, improve styling =====
{
  const file = "src/app/[locale]/about/page.tsx";
  let c = readFile(file);

  // Fix vehicle overlay text color: text-gray-900 → text-white on dark gradient
  c = c.replace(
    /<p className="text-gray-900 font-bold text-lg">Mercedes Vito VIP<\/p>/,
    '<p className="text-white font-bold text-lg">Mercedes Vito VIP</p>'
  );
  c = c.replace(
    /<p className="text-gray-400 text-sm">\{t\("vehicleOverlay"\)\}<\/p>/,
    '<p className="text-white/80 text-sm">{t("vehicleOverlay")}</p>'
  );

  // Fix stats — vary icon colors (Shield=Blue, Star=Orange, Users=Green)
  c = c.replace(
    /\{ icon: Shield, value: "15,000\+", labelKey: "statTransfers" \},\s*\{ icon: Star, value: "4\.9", labelKey: "statRating" \},\s*\{ icon: Users, value: "24\/7", labelKey: "statSupport" \},/,
    `{ icon: Shield, value: "15,000+", labelKey: "statTransfers", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                { icon: Star, value: "4.9", labelKey: "statRating", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                { icon: Users, value: "24/7", labelKey: "statSupport", color: "#34C759", bg: "rgba(52,199,89,0.08)" },`
  );
  // Update the stats .map to use per-item colors
  c = c.replace(
    /\.map\(\(\{ icon: Icon, value, labelKey \}\) => \(\s*<div key=\{labelKey\} className="text-center p-6 sm:p-8 rounded-2xl" style=\{\{ backgroundColor: "rgba\(0,0,0,0\.03\)", border: "1px solid rgba\(0,0,0,0\.06\)" \}\}>\s*<div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style=\{\{ backgroundColor: "rgba\(0,122,255,0\.08\)" \}\}>\s*<Icon size=\{22\} className="text-blue-600" strokeWidth=\{1\.5\} \/>/,
    `.map(({ icon: Icon, value, labelKey, color, bg }) => (
                <div key={labelKey} className="text-center p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={22} style={{ color }} strokeWidth={1.5} />`
  );

  // Fix Trust Strip — vary icon colors
  c = c.replace(
    /\{ icon: CreditCard, label: t\("trustStripePayments"\) \},\s*\{ icon: Shield, label: t\("trustInsured"\) \},\s*\{ icon: Plane, label: t\("trustFlightTracking"\) \},\s*\{ icon: Clock, label: t\("trustFreeCancellation"\) \},\s*\{ icon: Star, label: t\("trustSince"\) \},/,
    `{ icon: CreditCard, label: t("trustStripePayments"), color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Shield, label: t("trustInsured"), color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                  { icon: Plane, label: t("trustFlightTracking"), color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                  { icon: Clock, label: t("trustFreeCancellation"), color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Star, label: t("trustSince"), color: "#FF9500", bg: "rgba(255,149,0,0.08)" },`
  );
  // Update trust strip .map to use per-item colors
  c = c.replace(
    /\.map\(\(\{ icon: Icon, label \}\) => \(\s*<div key=\{label\} className="flex flex-col items-center gap-2">\s*<div className="w-10 h-10 rounded-full flex items-center justify-center" style=\{\{ backgroundColor: "rgba\(0,122,255,0\.08\)" \}\}>\s*<Icon size=\{16\} className="text-blue-600" strokeWidth=\{1\.5\} \/>/,
    `.map(({ icon: Icon, label, color, bg }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                      <Icon size={16} style={{ color }} strokeWidth={1.5} />`
  );

  // Fix "Why Choose" icons — vary colors
  c = c.replace(
    /\{ icon: CheckCircle, titleKey: "feature1Title", descKey: "feature1Desc" \},\s*\{ icon: Zap, titleKey: "feature2Title", descKey: "feature2Desc" \},\s*\{ icon: Globe, titleKey: "feature3Title", descKey: "feature3Desc" \},\s*\{ icon: Shield, titleKey: "feature4Title", descKey: "feature4Desc" \},/,
    `{ icon: CheckCircle, titleKey: "feature1Title", descKey: "feature1Desc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                  { icon: Zap, titleKey: "feature2Title", descKey: "feature2Desc", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                  { icon: Globe, titleKey: "feature3Title", descKey: "feature3Desc", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Shield, titleKey: "feature4Title", descKey: "feature4Desc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },`
  );
  // Update why choose .map
  c = c.replace(
    /\.map\(\(\{ icon: Icon, titleKey, descKey \}\) => \(\s*<div key=\{titleKey\} className="flex items-start gap-4 p-5 rounded-2xl" style=\{\{ backgroundColor: "#FFFFFF", border: "1px solid rgba\(0,0,0,0\.06\)" \}\}>\s*<div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style=\{\{ backgroundColor: "rgba\(0,122,255,0\.08\)" \}\}>\s*<Icon size=\{18\} className="text-blue-600" strokeWidth=\{1\.5\} \/>/,
    `.map(({ icon: Icon, titleKey, descKey, color, bg }) => (
                  <div key={titleKey} className="flex items-start gap-4 p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                      <Icon size={18} style={{ color }} strokeWidth={1.5} />`
  );

  // Fix Coverage section — replace hardcoded English with t() calls
  c = c.replace(
    /<p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Coverage<\/p>/,
    '<p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{t("coverageTag")}</p>'
  );
  c = c.replace(
    /<h2 className="text-2xl font-bold text-gray-900 tracking-tight">Where We Operate<\/h2>/,
    '<h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("coverageTitle")}</h2>'
  );
  c = c.replace(
    /<p className="text-gray-500 mt-3">We cover all major tourist destinations in the Antalya region\.<\/p>/,
    '<p className="text-gray-500 mt-3">{t("coverageDesc")}</p>'
  );
  c = c.replace(
    />Book Your Transfer\s*</,
    '>{t("coverageCta")}<'
  );

  // Make timeline connector line more visible
  c = c.replace(
    /className="flex-1 w-px mt-1" style=\{\{ backgroundColor: "rgba\(0,0,0,0\.06\)" \}\}/,
    'className="flex-1 w-px mt-1" style={{ backgroundColor: "rgba(0,122,255,0.2)" }}'
  );

  // Fleet cards — add subtle top accent border
  c = c.replace(
    /<div key=\{name\} className="p-6 rounded-2xl" style=\{\{ backgroundColor: "#FFFFFF", border: "1px solid rgba\(0,0,0,0\.06\)" \}\}>/g,
    '<div key={name} className="p-6 rounded-2xl relative overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}><div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #007AFF, #34C759)" }} />'
  );

  writeFile(file, c);
}

// ===== 6. Contact page — fix orange remnants, improve form, fix response time =====
{
  const file = "src/app/[locale]/contact/page.tsx";
  let c = readFile(file);
  
  // Stats bar: orange bg → brand color bgs (vary per item)
  c = c.replace(
    /\{ icon: Headphones, labelKey: "stat1Label", subKey: "stat1Sub" \},\s*\{ icon: Clock, labelKey: "stat2Label", subKey: "stat2Sub" \},\s*\{ icon: Globe, labelKey: "stat3Label", subKey: "stat3Sub" \},\s*\{ icon: Shield, labelKey: "stat4Label", subKey: "stat4Sub" \},/,
    `{ icon: Headphones, labelKey: "stat1Label", subKey: "stat1Sub", color: "#007AFF", bg: "rgba(0,122,255,0.1)" },
                { icon: Clock, labelKey: "stat2Label", subKey: "stat2Sub", color: "#FF9500", bg: "rgba(255,149,0,0.1)" },
                { icon: Globe, labelKey: "stat3Label", subKey: "stat3Sub", color: "#34C759", bg: "rgba(52,199,89,0.1)" },
                { icon: Shield, labelKey: "stat4Label", subKey: "stat4Sub", color: "#007AFF", bg: "rgba(0,122,255,0.1)" },`
  );
  // Update stats map to use per-item colors
  c = c.replace(
    /\.map\(\(\{ icon: Icon, labelKey, subKey \}\) => \(\s*<div key=\{labelKey\} className="flex items-center gap-3">\s*<div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style=\{\{ backgroundColor: "rgba\(249,115,22,0\.12\)" \}\}>\s*<Icon size=\{18\} className="text-blue-600" strokeWidth=\{1\.5\} \/>/,
    `.map(({ icon: Icon, labelKey, subKey, color, bg }) => (
                <div key={labelKey} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                    <Icon size={18} style={{ color }} strokeWidth={1.5} />`
  );

  // Address card: orange → blue
  c = c.replace(
    /style=\{\{ backgroundColor: "rgba\(249,115,22,0\.06\)", border: "1px solid rgba\(249,115,22,0\.12\)" \}\}>\s*<div className="w-12 h-12 rounded-xl flex items-center justify-center" style=\{\{ backgroundColor: "rgba\(249,115,22,0\.12\)" \}\}>\s*<MapPin size=\{20\} style=\{\{ color: "rgba\(249,115,22,1\)" \}\}/,
    `style={{ backgroundColor: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.12)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.12)" }}>
                      <MapPin size={20} style={{ color: "#007AFF" }}`
  );

  // Response time box: orange → green (it's response time)
  c = c.replace(
    /className="flex items-center gap-3 px-4 py-3 rounded-xl" style=\{\{ backgroundColor: "rgba\(249,115,22,0\.06\)", border: "1px solid rgba\(249,115,22,0\.12\)" \}\}/,
    'className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.12)" }}'
  );

  // Wrap form in a card
  c = c.replace(
    /<h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">\{t\("sendMessage"\)\}<\/h2>\s*<ContactForm \/>/,
    `<div className="p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">{t("sendMessage")}</h2>
                  <ContactForm />
                </div>`
  );

  writeFile(file, c);
}

// ===== 7. FAQ page — fix CTA button text color =====
{
  const file = "src/app/[locale]/faq/page.tsx";
  let c = readFile(file);
  // CTA button: text-gray-900 → text-white on orange bg
  c = c.replace(
    /className="inline-flex items-center gap-2 px-6 py-3 text-gray-900 font-semibold rounded-xl transition-all hover:brightness-110 text-sm"\s*style=\{\{ backgroundColor: '#F97316' \}\}/,
    `className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 text-sm"
                style={{ backgroundColor: '#FF9500' }}`
  );
  writeFile(file, c);
}

// ===== 8. Legal pages — wrap content sections in cards =====

// Privacy page
{
  const file = "src/app/[locale]/privacy/page.tsx";
  let c = readFile(file);
  c = c.replace(
    'import type { Metadata } from "next";',
    'import { Shield } from "lucide-react";\nimport type { Metadata } from "next";'
  );
  // Wrap content in nicer card-based layout
  c = c.replace(
    /<section className="py-16" style=\{\{ backgroundColor: "#FFFFFF" \}\}>\s*<div className="max-w-3xl mx-auto px-4">\s*<div className="space-y-6 text-sm leading-relaxed text-gray-500">/,
    `<section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">`
  );
  // Improve heading styles with number badges
  for (let i = 1; i <= 8; i++) {
    c = c.replace(
      new RegExp(`<h2 className="text-lg font-bold text-gray-900 mt-8">\\{t\\("s${i}Title"\\)\\}<\\/h2>`),
      `<div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>${i}</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s${i}Title")}</h2>
              </div>`
    );
  }
  writeFile(file, c);
}

// Terms page
{
  const file = "src/app/[locale]/terms/page.tsx";
  let c = readFile(file);
  c = c.replace(
    /<section className="py-16" style=\{\{ backgroundColor: "#FFFFFF" \}\}>\s*<div className="max-w-3xl mx-auto px-4">\s*<div className="space-y-6 text-sm leading-relaxed text-gray-500">/,
    `<section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">`
  );
  for (let i = 1; i <= 9; i++) {
    c = c.replace(
      new RegExp(`<h2 className="text-lg font-bold text-gray-900 mt-8">\\{t\\("s${i}Title"\\)\\}<\\/h2>`),
      `<div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>${i}</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s${i}Title")}</h2>
              </div>`
    );
  }
  writeFile(file, c);
}

// Cookies page
{
  const file = "src/app/[locale]/cookies/page.tsx";
  let c = readFile(file);
  c = c.replace(
    /<section className="py-16" style=\{\{ backgroundColor: "#FFFFFF" \}\}>\s*<div className="max-w-3xl mx-auto px-4">\s*<div className="space-y-6 text-sm leading-relaxed text-gray-500">/,
    `<section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">`
  );
  for (let i = 1; i <= 5; i++) {
    c = c.replace(
      new RegExp(`<h2 className="text-lg font-bold text-gray-900 mt-8">\\{t\\("s${i}Title"\\)\\}<\\/h2>`),
      `<div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>${i}</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s${i}Title")}</h2>
              </div>`
    );
  }
  writeFile(file, c);
}

// Cancellation page — already has nice colored boxes, just improve heading numbers
{
  const file = "src/app/[locale]/cancellation/page.tsx";
  let c = readFile(file);
  c = c.replace(
    /<section className="py-16" style=\{\{ backgroundColor: "#FFFFFF" \}\}>\s*<div className="max-w-3xl mx-auto px-4">\s*<div className="space-y-6 text-sm leading-relaxed text-gray-500">/,
    `<section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">`
  );
  // Improve emerald text to darker for readability
  c = c.replace(/text-emerald-400/g, 'text-emerald-600');
  c = c.replace(/text-amber-400/g, 'text-amber-600');
  c = c.replace(/text-red-400/g, 'text-red-600');
  
  const cancelColors = ["#34C759", "#FF9500", "#EF4444", "#007AFF", "#007AFF", "#FF9500", "#34C759"];
  for (let i = 1; i <= 7; i++) {
    c = c.replace(
      new RegExp(`<h2 className="text-lg font-bold text-gray-900 mt-8">\\{t\\("s${i}Title"\\)\\}<\\/h2>`),
      `<div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "${cancelColors[i-1]}" }}>${i}</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s${i}Title")}</h2>
              </div>`
    );
  }
  writeFile(file, c);
}

// KVKK page
{
  const file = "src/app/[locale]/kvkk/page.tsx";
  let c = readFile(file);
  c = c.replace(
    /<section className="py-16" style=\{\{ backgroundColor: "#FFFFFF" \}\}>\s*<div className="max-w-3xl mx-auto px-4">\s*<div className="space-y-6 text-sm leading-relaxed text-gray-500">/,
    `<section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">`
  );
  for (let i = 1; i <= 7; i++) {
    c = c.replace(
      new RegExp(`<h2 className="text-lg font-bold text-gray-900 mt-8">\\{t\\("s${i}Title"\\)\\}<\\/h2>`),
      `<div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>${i}</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s${i}Title")}</h2>
              </div>`
    );
  }
  writeFile(file, c);
}

// ===== 9. Homepage — add section separators =====
{
  const file = "src/app/[locale]/page.tsx";
  let c = readFile(file);
  // Add separator div between RegionsPreview and VehicleShowcase
  c = c.replace(
    /<RegionsPreview \/>\s*<VehicleShowcase \/>/,
    '<RegionsPreview />\n        <div className="border-t border-gray-100" />\n        <VehicleShowcase />'
  );
  // Add separator div between CTASection and LocalSeoBlock
  c = c.replace(
    /<CTASection \/>\s*<LocalSeoBlock \/>/,
    '<CTASection />\n        <div className="border-t border-gray-100" />\n        <LocalSeoBlock />'
  );
  writeFile(file, c);
}

console.log("\n🎉 All design fixes applied!");
