// ============================================
// Product Auto-Validation & Quality Score
// Yandex Market style moderation
// ============================================

interface ValidationError {
  field: string;
  message: string;
  messageRu: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  qualityScore: number;
}

interface ProductData {
  nameUz?: string | null;
  nameRu?: string | null;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  images?: string[] | null;
  categoryId?: string | null;
  brandId?: string | null;
  colorId?: string | null;
  stock?: number | null;
  sku?: string | null;
  weight?: number | null;
  unit?: string | null;
  barcode?: string | null;
  videoUrl?: string | null;
  tags?: string[] | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

// ============================================
// Banned words list (expandable)
// ============================================
const BANNED_WORDS_UZ = [
  'pornografiya', 'giyohvand', 'qurol', 'narkotik',
  'viagra', 'bomba', 'teror', 'qimor',
];

const BANNED_WORDS_RU = [
  'порнография', 'наркотик', 'оружие', 'бомба',
  'терроризм', 'виагра', 'азартные',
];

// ============================================
// Main validation function
// ============================================
export function validateProduct(data: ProductData): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Name UZ — required, min 10 chars
  if (!data.nameUz || data.nameUz.trim().length < 3) {
    errors.push({
      field: 'nameUz',
      message: 'Mahsulot nomi kamida 3 belgidan iborat bo\'lishi kerak',
      messageRu: 'Название товара должно содержать минимум 3 символа',
    });
  }

  // 2. Name RU — required, min 3 chars
  if (!data.nameRu || data.nameRu.trim().length < 3) {
    errors.push({
      field: 'nameRu',
      message: 'Rus tilidagi nom kamida 3 belgidan iborat bo\'lishi kerak',
      messageRu: 'Название на русском должно содержать минимум 3 символа',
    });
  }

  // 3. Description UZ — required, min 20 chars
  if (!data.descriptionUz || data.descriptionUz.trim().length < 20) {
    errors.push({
      field: 'descriptionUz',
      message: 'Tavsif kamida 20 belgidan iborat bo\'lishi kerak',
      messageRu: 'Описание должно содержать минимум 20 символов',
    });
  }

  // 4. At least 1 image
  if (!data.images || data.images.length === 0) {
    errors.push({
      field: 'images',
      message: 'Kamida bitta rasm yuklang',
      messageRu: 'Загрузите хотя бы одно изображение',
    });
  }

  // 5. Price > 0
  if (!data.price || data.price <= 0) {
    errors.push({
      field: 'price',
      message: 'Narx kiritilmagan yoki noto\'g\'ri',
      messageRu: 'Цена не указана или некорректна',
    });
  }

  // 6. Category selected
  if (!data.categoryId) {
    errors.push({
      field: 'categoryId',
      message: 'Kategoriya tanlanmagan',
      messageRu: 'Категория не выбрана',
    });
  }

  // 7. Stock >= 0
  if (data.stock === null || data.stock === undefined || data.stock < 0) {
    errors.push({
      field: 'stock',
      message: 'Qoldiq soni kiritilmagan',
      messageRu: 'Количество на складе не указано',
    });
  }

  // 8. Banned words check
  const allText = [
    data.nameUz, data.nameRu,
    data.descriptionUz, data.descriptionRu,
  ].filter(Boolean).join(' ').toLowerCase();

  const hasBannedWords = [...BANNED_WORDS_UZ, ...BANNED_WORDS_RU].some(word =>
    allText.includes(word.toLowerCase())
  );

  if (hasBannedWords) {
    errors.push({
      field: 'content',
      message: 'Taqiqlangan kontentdagi so\'zlar topildi',
      messageRu: 'Обнаружены запрещённые слова в контенте',
    });
  }

  // 9. Price sanity check
  if (data.originalPrice && data.price && data.originalPrice < data.price) {
    errors.push({
      field: 'originalPrice',
      message: 'Asl narx chegirmali narxdan past bo\'lishi mumkin emas',
      messageRu: 'Оригинальная цена не может быть ниже цены со скидкой',
    });
  }

  // Calculate quality score
  const qualityScore = calculateQualityScore(data);

  return {
    isValid: errors.length === 0,
    errors,
    qualityScore,
  };
}

// ============================================
// Quality Score Calculator (0-100)
// ============================================
export function calculateQualityScore(data: ProductData): number {
  let score = 0;

  // 1. Name UZ (max 10 points)
  if (data.nameUz) {
    const len = data.nameUz.trim().length;
    if (len >= 30) score += 10;
    else if (len >= 10) score += 5;
    else if (len >= 3) score += 2;
  }

  // 2. Name RU (max 5 points)
  if (data.nameRu && data.nameRu.trim().length >= 3) {
    score += 5;
  }

  // 3. Description UZ (max 20 points)
  if (data.descriptionUz) {
    const len = data.descriptionUz.trim().length;
    if (len >= 500) score += 20;
    else if (len >= 200) score += 15;
    else if (len >= 50) score += 10;
    else if (len >= 20) score += 5;
  }

  // 4. Description RU (max 5 points)
  if (data.descriptionRu && data.descriptionRu.trim().length >= 20) {
    score += 5;
  }

  // 5. First image (max 24 points)
  if (data.images && data.images.length > 0) {
    score += 12; // Has at least one image
    if (data.images.length >= 3) score += 6;  // 3+ images
    if (data.images.length >= 6) score += 6;  // 6+ images
  }

  // 6. Category (max 5 points)
  if (data.categoryId) {
    score += 5;
  }

  // 7. Brand (max 5 points)
  if (data.brandId) {
    score += 5;
  }

  // 8. Color (max 3 points)
  if (data.colorId) {
    score += 3;
  }

  // 9. Original price / discount (max 4 points)
  if (data.originalPrice && data.price && data.originalPrice > data.price) {
    score += 4;
  }

  // 10. SKU (max 5 points)
  if (data.sku && data.sku.trim().length > 0) {
    score += 5;
  }

  // 11. Weight (max 5 points)
  if (data.weight && data.weight > 0) {
    score += 5;
  }

  // 12. Stock specified (max 4 points)
  if (data.stock !== null && data.stock !== undefined && data.stock > 0) {
    score += 4;
  }

  // 13. Barcode (max 2 points)
  if (data.barcode && data.barcode.trim().length > 0) {
    score += 2;
  }

  // 14. Video (max 3 points)
  if (data.videoUrl && data.videoUrl.trim().length > 0) {
    score += 3;
  }

  // 15. Tags (max 3 points)
  if (data.tags && data.tags.length >= 3) {
    score += 3;
  } else if (data.tags && data.tags.length >= 1) {
    score += 1;
  }

  // 16. Dimensions (max 2 points)
  if (data.width && data.height && data.length) {
    score += 2;
  }

  return Math.min(score, 100);
}
