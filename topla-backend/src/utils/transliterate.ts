// ============================================
// Uzbek Latin ↔ Cyrillic Transliteration
// O'zbek lotin ↔ kirill konvertatsiyasi
// ============================================

// Latin → Cyrillic mapping (with digraphs first for correct matching)
const LATIN_TO_CYRILLIC: [string, string][] = [
  // Digraphs (must be matched before single letters)
  ['sh', 'ш'], ['Sh', 'Ш'], ['SH', 'Ш'],
  ['ch', 'ч'], ['Ch', 'Ч'], ['CH', 'Ч'],
  ['ng', 'нг'], ['Ng', 'Нг'], ['NG', 'НГ'],
  ["o'", 'ў'], ["O'", 'Ў'],
  ["g'", 'ғ'], ["G'", 'Ғ'],
  // Single letters
  ['a', 'а'], ['A', 'А'],
  ['b', 'б'], ['B', 'Б'],
  ['d', 'д'], ['D', 'Д'],
  ['e', 'е'], ['E', 'Е'],
  ['f', 'ф'], ['F', 'Ф'],
  ['g', 'г'], ['G', 'Г'],
  ['h', 'ҳ'], ['H', 'Ҳ'],
  ['i', 'и'], ['I', 'И'],
  ['j', 'ж'], ['J', 'Ж'],
  ['k', 'к'], ['K', 'К'],
  ['l', 'л'], ['L', 'Л'],
  ['m', 'м'], ['M', 'М'],
  ['n', 'н'], ['N', 'Н'],
  ['o', 'о'], ['O', 'О'],
  ['p', 'п'], ['P', 'П'],
  ['q', 'қ'], ['Q', 'Қ'],
  ['r', 'р'], ['R', 'Р'],
  ['s', 'с'], ['S', 'С'],
  ['t', 'т'], ['T', 'Т'],
  ['u', 'у'], ['U', 'У'],
  ['v', 'в'], ['V', 'В'],
  ['x', 'х'], ['X', 'Х'],
  ['y', 'й'], ['Y', 'Й'],
  ['z', 'з'], ['Z', 'З'],
  ["'", 'ъ'],
];

// Cyrillic → Latin mapping
const CYRILLIC_TO_LATIN: [string, string][] = [
  ['ш', 'sh'], ['Ш', 'Sh'],
  ['ч', 'ch'], ['Ч', 'Ch'],
  ['ғ', "g'"], ['Ғ', "G'"],
  ['ў', "o'"], ['Ў', "O'"],
  ['ҳ', 'h'], ['Ҳ', 'H'],
  ['қ', 'q'], ['Қ', 'Q'],
  ['а', 'a'], ['А', 'A'],
  ['б', 'b'], ['Б', 'B'],
  ['в', 'v'], ['В', 'V'],
  ['г', 'g'], ['Г', 'G'],
  ['д', 'd'], ['Д', 'D'],
  ['е', 'e'], ['Е', 'E'],
  ['ё', 'yo'], ['Ё', 'Yo'],
  ['ж', 'j'], ['Ж', 'J'],
  ['з', 'z'], ['З', 'Z'],
  ['и', 'i'], ['И', 'I'],
  ['й', 'y'], ['Й', 'Y'],
  ['к', 'k'], ['К', 'K'],
  ['л', 'l'], ['Л', 'L'],
  ['м', 'm'], ['М', 'M'],
  ['н', 'n'], ['Н', 'N'],
  ['о', 'o'], ['О', 'O'],
  ['п', 'p'], ['П', 'P'],
  ['р', 'r'], ['Р', 'R'],
  ['с', 's'], ['С', 'S'],
  ['т', 't'], ['Т', 'T'],
  ['у', 'u'], ['У', 'U'],
  ['ф', 'f'], ['Ф', 'F'],
  ['х', 'x'], ['Х', 'X'],
  ['ц', 'ts'], ['Ц', 'Ts'],
  ['ъ', "'"], ['Ъ', "'"],
  ['ь', ''], ['Ь', ''],
  ['э', 'e'], ['Э', 'E'],
  ['ю', 'yu'], ['Ю', 'Yu'],
  ['я', 'ya'], ['Я', 'Ya'],
];

function applyMapping(text: string, mapping: [string, string][]): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    // Try longer mappings first
    for (const [from, to] of mapping) {
      if (text.substring(i, i + from.length) === from) {
        result += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
      i++;
    }
  }
  return result;
}

/** Latin → Kirill: "telefon" → "телефон" */
export function latinToCyrillic(text: string): string {
  return applyMapping(text, LATIN_TO_CYRILLIC);
}

/** Kirill → Latin: "телефон" → "telefon" */
export function cyrillicToLatin(text: string): string {
  return applyMapping(text, CYRILLIC_TO_LATIN);
}

/** Matn kirill alifbosidami tekshirish */
export function isCyrillic(text: string): boolean {
  return /[а-яёўғқҳА-ЯЁЎҒҚҲ]/.test(text);
}

/** Matn lotin alifbosidami tekshirish */
export function isLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text) && !isCyrillic(text);
}

/**
 * Qidiruv so'rovini har ikki alifboda qaytaradi.
 * Agar lotin kiritilsa → lotincha original + kirillcha variant
 * Agar kirill kiritilsa → kirillcha original + lotincha variant
 * "telefon" → ["telefon", "телефон"]
 * "телефон" → ["телефон", "telefon"]
 */
export function getTransliteratedQueries(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [trimmed];
  
  if (isCyrillic(trimmed)) {
    return [trimmed, cyrillicToLatin(trimmed)];
  }
  if (isLatin(trimmed)) {
    return [trimmed, latinToCyrillic(trimmed)];
  }
  // Mixed or numeric — return as-is
  return [trimmed];
}
