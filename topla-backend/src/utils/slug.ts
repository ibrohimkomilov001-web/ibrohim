import { prisma } from '../config/database.js';

/**
 * O'zbek va Rus harflarini transliteraciya qilish
 */
const translitMap: Record<string, string> = {
  // O'zbek
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
  // O'zbek lotin
  'o\u02BB': 'o', 'g\u02BB': 'g', '\u2018': '', '\u2019': '', '\u02BC': '',
};

/**
 * Matnni slug formatiga o'girish (kebab-case)
 * "TechStore UZ" => "techstore-uz"
 * "Олтин Водий" => "oltin-vodiy"
 */
export function generateSlugBase(text: string): string {
  let result = text.toLowerCase().trim();
  
  // Transliteraciya (kirill => lotin)
  for (const [key, val] of Object.entries(translitMap)) {
    result = result.replaceAll(key, val);
  }
  
  // Faqat harflar, raqamlar va tire qoldirish
  result = result
    .replace(/[^a-z0-9\s-]/g, '')  // Faqat lotin harf, raqam, bo'shliq, tire
    .replace(/\s+/g, '-')           // Bo'shliqlarni tire ga
    .replace(/-+/g, '-')            // Bir nechta tireni bitta qilish
    .replace(/^-|-$/g, '');          // Bosh va oxiridagi tireni olib tashlash

  return result || 'shop';
}

/**
 * Unikal slug yaratish (bazada tekshirish bilan)
 * Agar "techstore" band bo'lsa => "techstore-2", "techstore-3" ...
 */
export async function generateUniqueSlug(shopName: string): Promise<string> {
  const base = generateSlugBase(shopName);
  
  // Bazada tekshirish
  const existing = await prisma.shop.findUnique({ where: { slug: base } });
  if (!existing) return base;
  
  // Raqam qo'shib unikal qilish
  let counter = 2;
  while (counter < 100) {
    const candidate = `${base}-${counter}`;
    const found = await prisma.shop.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
    counter++;
  }
  
  // Juda ko'p takrorlanish bo'lsa random qo'shish
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Mahsulot uchun unikal slug yaratish
 * "iPhone 15 Pro Max" => "iphone-15-pro-max"
 * Agar band bo'lsa => "iphone-15-pro-max-2"
 */
export async function generateProductSlug(productName: string): Promise<string> {
  const base = generateSlugBase(productName);
  
  const existing = await prisma.product.findUnique({ where: { slug: base } });
  if (!existing) return base;
  
  let counter = 2;
  while (counter < 100) {
    const candidate = `${base}-${counter}`;
    const found = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
    counter++;
  }
  
  return `${base}-${Date.now().toString(36)}`;
}
