// ============================================
// Gemini AI Product Moderation Service
// Text + Image analysis via Gemini 2.0 Flash
// ============================================

import { env } from '../config/env.js';
import { prisma } from '../config/database.js';

interface AiModerationResult {
  approved: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
  imageAnalysis?: {
    quality: string;
    relevance: string;
    issues: string[];
  };
}

interface ProductForReview {
  id: string;
  name: string;
  nameUz?: string | null;
  nameRu?: string | null;
  description?: string | null;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  images: string[];
  price: number;
  categoryName?: string;
}

const MODERATION_PROMPT = `Sen Topla.uz marketplace uchun mahsulot moderatori sifatida ishla.
Berilgan mahsulot ma'lumotlarini tekshir va JSON formatida javob ber.

Tekshirish mezonlari:
1. Nom: aniq, tushunarli, spam/reklama so'zsiz
2. Tavsif: foydali, haqiqiy, spam/reklama/aloqasiz matn yo'q
3. Narx: oqilona (juda past yoki juda yuqori emas)
4. Rasmlar (agar berilsa): mahsulotga mos, sifatli, taqiqlangan kontent yo'q
5. Taqiqlangan tovarlar: qurol, narkotik, soxta tovar, pornografiya

FAQAT quyidagi JSON formatida javob ber, boshqa hech qanday matn yozma:
{
  "approved": true/false,
  "score": 0-100,
  "issues": ["muammo1", "muammo2"],
  "suggestions": ["taklif1", "taklif2"],
  "imageAnalysis": {
    "quality": "yaxshi/o'rtacha/yomon",
    "relevance": "mos/qisman mos/mos emas",
    "issues": ["rasm muammosi"]
  }
}`;

/**
 * Check if AI moderation is available
 */
export function isAiModerationAvailable(): boolean {
  return !!env.GEMINI_API_KEY;
}

/**
 * Moderate a product using Gemini AI (text + image analysis)
 */
export async function moderateProduct(product: ProductForReview): Promise<AiModerationResult> {
  if (!env.GEMINI_API_KEY) {
    return { approved: true, score: 70, issues: [], suggestions: ['AI moderation is not configured'] };
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const productInfo = `
Mahsulot nomi: ${product.nameUz || product.name}
Nomi (RU): ${product.nameRu || '-'}
Tavsif: ${product.descriptionUz || product.description || '-'}
Narx: ${product.price} so'm
Kategoriya: ${product.categoryName || 'Noma\'lum'}
Rasmlar soni: ${product.images.length}
`.trim();

  try {
    const parts: any[] = [
      { text: `${MODERATION_PROMPT}\n\nMahsulot ma'lumotlari:\n${productInfo}` },
    ];

    // Add images for vision analysis (max 3)
    const imageUrls = product.images.slice(0, 3);
    for (const imgUrl of imageUrls) {
      const imageData = await fetchImageAsBase64(imgUrl);
      if (imageData) {
        parts.push({
          inlineData: { mimeType: imageData.mimeType, data: imageData.base64 },
        });
      }
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI moderation: no JSON in response:', text.substring(0, 200));
      return { approved: true, score: 60, issues: [], suggestions: ['AI javobini tahlil qilib bo\'lmadi'] };
    }

    const parsed = JSON.parse(jsonMatch[0]) as AiModerationResult;

    // Validate the result structure
    return {
      approved: typeof parsed.approved === 'boolean' ? parsed.approved : true,
      score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 60,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      imageAnalysis: parsed.imageAnalysis || undefined,
    };
  } catch (error: any) {
    console.error('AI moderation error:', error.message);
    return { approved: true, score: 50, issues: [], suggestions: [`AI xatosi: ${error.message}`] };
  }
}

/**
 * Run AI moderation for a product and save results to DB
 */
export async function runAiModeration(productId: string): Promise<AiModerationResult | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { nameUz: true } },
      },
    });

    if (!product) return null;

    const result = await moderateProduct({
      id: product.id,
      name: product.name,
      nameUz: product.nameUz,
      nameRu: product.nameRu,
      description: product.description,
      descriptionUz: product.descriptionUz,
      descriptionRu: product.descriptionRu,
      images: product.images as string[],
      price: Number(product.price),
      categoryName: product.category?.nameUz,
    });

    // Save moderation log
    await prisma.productModerationLog.create({
      data: {
        productId,
        action: result.approved ? 'auto_approved' : 'auto_rejected',
        reason: `AI moderation: ${result.approved ? 'Tasdiqlandi' : 'Rad etildi'} (${result.score}/100). ${result.issues.join(', ')}`,
        errors: {
          aiScore: result.score,
          aiApproved: result.approved,
          issues: result.issues,
          suggestions: result.suggestions,
          imageAnalysis: result.imageAnalysis,
        },
      },
    });

    // If AI rejects, update product status
    if (!result.approved && product.status === 'active') {
      await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'has_errors',
          validationErrors: result.issues,
        },
      });
    }

    return result;
  } catch (error: any) {
    console.error('AI moderation failed for product', productId, error.message);
    return null;
  }
}

/**
 * Fetch an image URL and return as base64 for Gemini Vision
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    let url = imageUrl;

    // Resolve relative URLs to the local server
    if (url.startsWith('/uploads/')) {
      const apiUrl = env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3001';
      url = `${apiUrl}${imageUrl}`;
    }

    // If URL doesn't start with http, try local file
    if (!url.startsWith('http')) {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', imageUrl.replace(/^\/uploads\//, ''));
      const buffer = await readFile(filePath);
      return {
        base64: buffer.toString('base64'),
        mimeType: 'image/webp',
      };
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/webp';

    return {
      base64: buffer.toString('base64'),
      mimeType: contentType,
    };
  } catch {
    return null;
  }
}
