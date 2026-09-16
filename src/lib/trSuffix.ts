/**
 * Turkish case endings for a place name, following vowel harmony.
 *
 * The region copy used to hard-code one ending — "{name}'e" — which is right
 * for Belek and wrong for most of the list: "Side'e", "Alanya'e", "Kaş'e".
 * Next-intl's message format has no way to choose an ending from the word it
 * is attached to, so the forms are worked out here and passed in as params.
 *
 * The rules:
 * - The last vowel picks the ending: back (a ı o u) or front (e i ö ü), and
 *   for the four-way endings, rounded or not.
 * - A name ending in a vowel takes a buffer -y- before a vowel ending:
 *   "Side'ye", "Alanya'yı".
 * - A name ending in a voiceless consonant (ç f h k p s ş t) hardens d to t:
 *   "Kaş'ta", "Belek'ten".
 * - A compound already carrying a possessive — "Konyaaltı" (Konya altı),
 *   "Beldibi" (bel dibi), "Şehir Merkezi" — takes a pronominal -n- instead:
 *   "Konyaaltı'na", "Beldibi'nde". Spelling alone cannot tell "Konyaaltı"
 *   (possessive) from "Çıralı" (adjective), so these are listed by hand.
 *   A new region with a name like that needs adding to POSSESSIVE.
 */

const VOWELS = "aeıioöuü";
const BACK = "aıou";
const VOICELESS = "çfhkpsşt";

const POSSESSIVE = new Set(["konyaaltı", "beldibi", "merkezi", "havalimanı"]);

export interface TurkishNameForms {
  /** Dative: Belek'e, Side'ye, Konyaaltı'na */
  name_e: string;
  /** Locative relative: Belek'teki, Side'deki, Konyaaltı'ndaki */
  name_deki: string;
  /** Ablative: Belek'ten, Side'den, Konyaaltı'ndan */
  name_den: string;
  /** Accusative: Belek'i, Side'yi, Konyaaltı'nı */
  name_i: string;
}

export function turkishNameForms(name: string): TurkishNameForms {
  const trimmed = name.trim();
  // The last word decides: "Kundu - Lara" is declined as "Lara".
  const lastWord = (trimmed.match(/[\p{L}]+(?=[^\p{L}]*$)/u)?.[0] ?? trimmed).toLocaleLowerCase("tr");

  let lastVowel = "e";
  for (let i = lastWord.length - 1; i >= 0; i--) {
    if (VOWELS.includes(lastWord[i])) {
      lastVowel = lastWord[i];
      break;
    }
  }

  const back = BACK.includes(lastVowel);
  const two = back ? "a" : "e";
  const four = lastVowel === "a" || lastVowel === "ı" ? "ı"
    : lastVowel === "e" || lastVowel === "i" ? "i"
    : lastVowel === "o" || lastVowel === "u" ? "u"
    : "ü";

  const lastChar = lastWord[lastWord.length - 1] ?? "";
  const endsInVowel = VOWELS.includes(lastChar);

  if (POSSESSIVE.has(lastWord)) {
    return {
      name_e: `${trimmed}'n${two}`,
      name_deki: `${trimmed}'nd${two}ki`,
      name_den: `${trimmed}'nd${two}n`,
      name_i: `${trimmed}'n${four}`,
    };
  }

  const d = VOICELESS.includes(lastChar) ? "t" : "d";
  const buffer = endsInVowel ? "y" : "";

  return {
    name_e: `${trimmed}'${buffer}${two}`,
    name_deki: `${trimmed}'${d}${two}ki`,
    name_den: `${trimmed}'${d}${two}n`,
    name_i: `${trimmed}'${buffer}${four}`,
  };
}
