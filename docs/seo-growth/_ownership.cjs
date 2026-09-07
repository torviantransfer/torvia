// Determines, for every inline-copy landing page, whether the live title comes
// from the page's own code fallback or from a seo_pages DB override — by
// comparing what production serves against what the source file declares.
//
// Ownership has to be established before anything is changed: a code edit
// cannot fix a value the database is overriding, and a migration cannot fix a
// value the database has never held.
const fs = require("fs");
const j = JSON.parse(fs.readFileSync("docs/seo-runtime-audit.json", "utf8"));
const LOC = ["tr", "en", "de", "pl", "ru", "nl", "ro"];
const INLINE = [
  "antalya-airport-transfer",
  "vip-transfer-antalya",
  "hotel-transfer-antalya",
  "lara-beach-transfer",
  "land-of-legends-transfer",
];

function inlineTitles(route) {
  const src = fs.readFileSync("src/app/[locale]/" + route + "/page.tsx", "utf8");
  const out = {};
  const re = /^ {2}(tr|en|de|pl|ru|nl|ro): \{/gm;
  const marks = [];
  let m;
  while ((m = re.exec(src))) marks.push({ loc: m[1], i: m.index });
  for (let k = 0; k < marks.length; k++) {
    const seg = src.slice(marks[k].i, marks[k + 1] ? marks[k + 1].i : src.length);
    const t = seg.match(/^\s*title: "([^"]*)"/m);
    if (t) out[marks[k].loc] = t[1];
  }
  return out;
}

const codeTitles = {};
for (const r of INLINE) codeTitles[r] = inlineTitles(r);

const rows = [];
for (const route of INLINE) {
  for (const loc of LOC) {
    const live = j.results.find((x) => x.path === "/" + loc + "/" + route);
    if (!live) continue;
    const liveTitle = (live.title || "").replace(/ \| TORVIAN Transfer$/, "");
    const code = codeTitles[route][loc] || "";
    rows.push({
      route,
      loc,
      owner: liveTitle === code ? "code" : "db(seo_pages)",
      code,
      live: liveTitle,
      inbound: live.inboundLinks,
      words: live.wordCount,
    });
  }
}

console.log("route".padEnd(26) + "loc  owner          inb  title");
for (const r of rows) {
  const flag = r.owner === "code" ? "code         " : "DB OVERRIDE  ";
  console.log(
    r.route.padEnd(26) + r.loc.padEnd(5) + flag + String(r.inbound).padStart(4) + "  " + r.live
  );
  if (r.owner !== "code") console.log(" ".repeat(50) + "code fallback: " + r.code);
}
console.log(
  "\nDB-overridden landing titles: " +
    rows.filter((r) => r.owner !== "code").length +
    " / " +
    rows.length
);
fs.writeFileSync("docs/seo-growth/_ownership.json", JSON.stringify(rows, null, 1));
