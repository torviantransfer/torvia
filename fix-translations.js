const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, "src/messages");

const newKeys = {
  tr: { findTransfer: "Transfer Bul", addReturn: "Dönüş Ekle", adult: "Yetişkin", child: "Çocuk", age: "Yaş", person: "Kişi" },
  en: { findTransfer: "Find Transfer", addReturn: "Add Return", adult: "Adult", child: "Child", age: "Age", person: "Person" },
  de: { findTransfer: "Transfer Finden", addReturn: "Rückfahrt", adult: "Erwachsene", child: "Kind", age: "Jahre", person: "Person" },
  pl: { findTransfer: "Znajdź Transfer", addReturn: "Dodaj Powrót", adult: "Dorosły", child: "Dziecko", age: "Lat", person: "Osoba" },
  ru: { findTransfer: "Найти Трансфер", addReturn: "Добавить Обратно", adult: "Взрослый", child: "Ребёнок", age: "Лет", person: "Чел." },
};

for (const [lang, keys] of Object.entries(newKeys)) {
  const filePath = path.join(base, `${lang}.json`);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  Object.assign(json.booking, keys);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`✅ ${lang}.json — booking keys added`);
}

console.log("\n🎉 Done!");
