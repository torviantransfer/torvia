/**
 * Pulls Google's own query completions per market.
 *
 * Google Trends is unreachable from here (its API answers 429 to datacenter
 * IPs), so the 0-100 interest series this task would otherwise cite does not
 * exist. Autocomplete is a different and, for the question actually being
 * asked, better instrument: it is Google's record of what people in a given
 * market really type, returned in its own popularity order, per `hl`/`gl`.
 *
 * It is not volume. It cannot be reported as volume. What it can settle is
 * word order and variant choice — "does a Dutch user type 'antalya airport
 * transfer' or 'antalya luchthaven transfer'" — which is exactly the decision
 * §20 needs and which a relative interest score answers less directly.
 */
const fs = require("fs");

const MARKETS = [
  { loc: "tr", hl: "tr", gl: "tr" },
  { loc: "en", hl: "en-GB", gl: "gb" },
  { loc: "de", hl: "de", gl: "de" },
  { loc: "pl", hl: "pl", gl: "pl" },
  { loc: "ru", hl: "ru", gl: "ru" },
  { loc: "nl", hl: "nl", gl: "nl" },
  { loc: "ro", hl: "ro", gl: "ro" },
];

// Seeds are the head concepts the site sells, phrased the way each market
// would begin typing them. Two variants per market where the site itself is
// undecided, so the comparison is visible rather than assumed.
const SEEDS = {
  tr: ["antalya havalimanı transfer", "antalya havalimanı özel transfer", "antalya transfer", "antalya havalimanı otel", "antalya havalimanı belek"],
  en: ["antalya airport transfer", "antalya private transfer", "antalya airport to", "antalya transfer to hotel", "antalya airport taxi"],
  de: ["antalya flughafen transfer", "flughafentransfer antalya", "privattransfer antalya", "antalya transfer hotel", "antalya flughafen nach"],
  pl: ["transfer z lotniska antalya", "transfer lotnisko antalya", "prywatny transfer antalya", "antalya transfer do hotelu", "lotnisko antalya"],
  ru: ["трансфер из аэропорта анталии", "трансфер анталия", "частный трансфер анталия", "аэропорт анталия отель", "анталия аэропорт до"],
  nl: ["antalya luchthaven transfer", "antalya airport transfer", "prive transfer antalya", "antalya luchthaven naar", "transfer luchthaven antalya"],
  ro: ["transfer aeroport antalya", "transfer privat antalya", "antalya transfer hotel", "aeroport antalya", "transfer antalya"],
};

function get(url) {
  return new Promise((resolve) => {
    const https = require("https");
    https
      .get(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36" } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", () => resolve({ status: 0, body: "" }));
  });
}

async function suggest(seed, hl, gl) {
  const url =
    "https://suggestqueries.google.com/complete/search?client=firefox" +
    "&hl=" + encodeURIComponent(hl) + "&gl=" + encodeURIComponent(gl) +
    "&q=" + encodeURIComponent(seed);
  const res = await get(url);
  if (res.status !== 200) return { error: "HTTP " + res.status };
  try {
    const parsed = JSON.parse(res.body);
    return { suggestions: parsed[1] || [] };
  } catch {
    return { error: "unparseable" };
  }
}

(async () => {
  const out = { fetchedAt: new Date().toISOString(), source: "Google Autocomplete (suggestqueries.google.com), per market hl/gl", note: "Popularity order, not volume. Google Trends returned HTTP 429 from this environment.", markets: {} };
  for (const m of MARKETS) {
    out.markets[m.loc] = { hl: m.hl, gl: m.gl, seeds: {} };
    for (const seed of SEEDS[m.loc]) {
      const r = await suggest(seed, m.hl, m.gl);
      out.markets[m.loc].seeds[seed] = r;
      await new Promise((r2) => setTimeout(r2, 350));
    }
  }
  fs.writeFileSync("docs/seo-growth/autocomplete-research.json", JSON.stringify(out, null, 1));

  for (const m of MARKETS) {
    console.log("\n===== " + m.loc.toUpperCase() + "  (hl=" + m.hl + " gl=" + m.gl + ") =====");
    for (const [seed, r] of Object.entries(out.markets[m.loc].seeds)) {
      if (r.error) {
        console.log("  " + seed + "  -> " + r.error);
        continue;
      }
      console.log("  " + seed);
      for (const s of r.suggestions.slice(0, 10)) console.log("      " + s);
    }
  }
})();
