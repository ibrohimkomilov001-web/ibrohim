// ============================================
// Support Chat Routes — Customer <-> Admin/Bot
// ============================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { parsePagination } from '../../utils/pagination.js';

// ============================================
// Bot — Professional Support Intelligence
// ============================================

interface BotRule {
  id: string;
  keywords: string[];
  patterns?: RegExp[];
  priority: number; // higher = checked first
  answer: string;
  followUp?: string;
}

const BOT_RULES: BotRule[] = [
  // ── Salomlashish ──
  {
    id: 'greeting',
    keywords: ['salom', 'assalomu', 'hello', 'hi', 'привет', 'hayrli', 'xayrli', 'hey'],
    priority: 10,
    answer: 'Assalomu alaykum! 👋 TOPLA yordam markaziga xush kelibsiz.\n\nMen sizga quyidagi mavzularda yordam bera olaman:\n\n📦 Buyurtma holati va kuzatish\n🚚 Yetkazib berish va topshirish punktlari\n💳 To\'lov usullari va muammolar\n🔄 Qaytarish va almashtirish\n💰 Chegirmalar va promo kodlar\n🏪 Do\'konlar bilan bog\'liq savollar\n\nSavolingizni yozing — tez va aniq javob beraman!',
  },

  // ── Buyurtma holati ──
  {
    id: 'order_status',
    keywords: ['buyurtma', 'order', 'заказ', 'zakaz', 'holat', 'status', 'qayerda', 'kuzatish', 'trek', 'track', 'kelmadi', 'keldi', 'kechikish', 'kechiktirib'],
    patterns: [/buyurtma.*(qayerda|holati|kuzat|qachon|kel)/, /order.*(status|track|where)/],
    priority: 9,
    answer: '📦 Buyurtmangiz holatini tekshirish uchun:\n\n1️⃣ Ilovada pastdagi menyudan "Buyurtmalarim" bo\'limini oching\n2️⃣ Kerakli buyurtmani tanlang\n3️⃣ Batafsil holat va kuzatish ma\'lumotlari ko\'rsatiladi\n\n📍 Buyurtma holatlari:\n• Kutilmoqda — buyurtma qabul qilindi\n• Tayyorlanmoqda — sotuvchi buyurtmani yig\'moqda\n• Yo\'lda — kuryer yetkazib bermoqda\n• Topshirish punktida — olib ketishingiz mumkin\n• Yetkazildi — muvaffaqiyatli topshirildi',
    followUp: 'Agar buyurtmangiz 3 kundan ortiq kechiksa, buyurtma raqamini menga yuboring — tezkor tekshirib beraman.',
  },

  // ── Yetkazib berish ──
  {
    id: 'delivery',
    keywords: ['yetkazish', 'yetkazib', 'delivery', 'доставка', 'kuryer', 'courier', 'qachon', 'necha kun', 'muddati'],
    patterns: [/yetkazib.*(berish|ber|narx|vaqt|qachon)/, /qachon.*(yetkazadi|keladi|olib)/],
    priority: 8,
    answer: '🚚 Yetkazib berish haqida:\n\n⏱ Muddatlari:\n• Shahar ichida: 1-2 ish kuni\n• Viloyatlarga: 2-4 ish kuni\n• Topshirish punktiga: 1-3 ish kuni\n\n💰 Narxlari:\n• Standart yetkazish: 15,000 — 30,000 so\'m\n• Topshirish punktiga: BEPUL\n• 200,000 so\'mdan ortiq buyurtmalarga: BEPUL\n\n📍 Yetkazish vaqti buyurtma berganingizdan keyin hisoblanadi. Bayram kunlari biroz kechikishi mumkin.',
    followUp: 'Aniq manzilga yetkazish narxini bilish uchun buyurtma berish vaqtida "Yetkazish" bo\'limini tekshiring.',
  },

  // ── Topshirish punktlari / Pickup ──
  {
    id: 'pickup',
    keywords: ['punkt', 'pickup', 'topshirish', 'olib ketish', 'olib olish', 'qr', 'qr kod', 'qr-kod', 'bepul olib'],
    patterns: [/topshirish.*punkt/, /olib.*(ket|ol)/, /qr.*kod/],
    priority: 8,
    answer: '📍 Topshirish punktlari haqida:\n\nTopshirish punktlaridan buyurtmangizni BEPUL olib ketishingiz mumkin!\n\n🔄 Jarayoni:\n1️⃣ Buyurtma berishda "Topshirish punkti" ni tanlang\n2️⃣ Sizga qulay punktni xaritadan belgilang\n3️⃣ Buyurtma tayyor bo\'lganda bildirishnoma olasiz\n4️⃣ QR kodni ko\'rsatib, mahsulotni olib keting\n\n⏰ Saqlash muddati: Buyurtma punktga kelganidan 5 kun\n\n💡 QR kodni "Buyurtmalarim" → buyurtmani oching → "QR kod" tugmasidan ko\'rishingiz mumkin.',
  },

  // ── To'lov ──
  {
    id: 'payment',
    keywords: ['tolov', "to'lov", 'payment', 'оплата', 'pul', 'karta', 'click', 'payme', 'naqd', 'plastik', 'keshbek', 'cashback', 'qaytarilmadi'],
    patterns: [/to.?lov.*(usul|qil|amalga|muammo|xato|qayt)/, /pul.*(qayt|tushmadi|yechildi)/],
    priority: 8,
    answer: '💳 To\'lov usullari va ma\'lumotlar:\n\n🏦 Qabul qilinadigan usullar:\n• 💵 Naqd pul — yetkazib berilganda\n• 💳 Plastik karta — Uzcard, Humo\n• 📱 Click — onlayn to\'lov\n• 📱 Payme — onlayn to\'lov\n\n🔒 Barcha onlayn to\'lovlar xavfsiz shifrlangan kanal orqali amalga oshiriladi.\n\n💰 Cashback: Har bir buyurtmadan 1-5% cashback hisobingizga qaytariladi. Uni keyingi buyurtmalarda ishlatishingiz mumkin.',
    followUp: 'To\'lov bilan bog\'liq muammo bo\'lsa, to\'lov usulini, sanasini va summani yozing — tekshirib beraman.',
  },

  // ── Qaytarish va almashtirish ──
  {
    id: 'return',
    keywords: ['qaytarish', 'return', 'возврат', 'qaytarib', 'almashish', 'almashtirish', 'nuqsonli', 'buzilgan', 'noto\'g\'ri', "boshqa narsa", 'yaroqsiz', 'defekt', 'brak'],
    patterns: [/qaytari.*(mumkin|qanday|shart)/, /almashti.*(mumkin|qanday)/, /mahsulot.*(buzil|nuqson|boshqa|yaroq)/],
    priority: 8,
    answer: '🔄 Qaytarish va almashtirish siyosati:\n\n📋 Shartlari:\n• Mahsulotni 14 kun ichida qaytarish mumkin\n• Mahsulot asl holatida, qadoqda bo\'lishi kerak\n• Chek yoki buyurtma raqami talab qilinadi\n\n📝 Qaytarish jarayoni:\n1️⃣ "Buyurtmalarim" bo\'limiga kiring\n2️⃣ Kerakli buyurtmani tanlang\n3️⃣ "Qaytarish" tugmasini bosing\n4️⃣ Sababni tanlang va rasm biriktiring\n5️⃣ Ariza 1-3 ish kunida ko\'rib chiqiladi\n\n💰 Pul qaytarish: Tasdiqlangandan so\'ng 3-5 ish kuni ichida asl to\'lov usuli orqali qaytariladi.',
    followUp: 'Nuqsonli mahsulot olgan bo\'lsangiz, rasm yuboring — tezkor hal qilamiz.',
  },

  // ── Chegirma va aksiyalar ──
  {
    id: 'discount',
    keywords: ['narx', 'price', 'цена', 'chegirma', 'skidka', 'aksiya', 'promo', 'promokod', 'kupon', 'arzon', 'chegirm'],
    patterns: [/promo.*kod/, /chegirma.*(bor|qanday|qayerda)/, /aksiya.*(bor|qanday)/],
    priority: 7,
    answer: '🏷️ Chegirmalar va aksiyalar:\n\n🔥 Chegirmalarni qayerdan topish mumkin:\n• Bosh sahifadagi bannerlar — dolzarb aksiyalar\n• Mahsulot kartochkalarida qizil narx — chegirma narxi\n• "Aksiyalar" bo\'limida — barcha maxsus takliflar\n\n🎟️ Promo kod ishlatish:\n1️⃣ Savatga mahsulot qo\'shing\n2️⃣ Buyurtma berish sahifasida "Promo kod" maydonini toping\n3️⃣ Kodni kiriting va "Qo\'llash" tugmasini bosing\n4️⃣ Chegirma avtomatik hisoblanadi\n\n💡 Maslahat: Bildirishnomalarni yoqing — maxsus takliflar haqida birinchilar qatorida xabar olasiz!',
  },

  // ── Do'konlar ──
  {
    id: 'vendor',
    keywords: ['dokon', "do'kon", 'shop', 'магазин', 'sotuvchi', 'vendor', 'magazin', 'dukon'],
    patterns: [/do.?kon.*(bilan|haqida|muammo|shikoyat)/, /sotuvchi.*(bilan|muammo)/],
    priority: 7,
    answer: '🏪 Do\'konlar bilan ishlash:\n\n📞 Do\'kon bilan bog\'lanish:\n• Do\'kon sahifasiga kiring\n• "Murojaat" yoki "Chat" tugmasini bosing\n• To\'g\'ridan-to\'g\'ri sotuvchiga yozing\n\n⭐ Do\'konni baholash:\n• Buyurtma yetkazilgandan so\'ng do\'konni baholashingiz mumkin\n• Sharh qoldiring — boshqa xaridorlarga yordam beradi\n\n⚠️ Shikoyat:\nDo\'kon bilan muammo bo\'lsa, buyurtma raqamini va muammoni batafsil yozing — biz tekshirib, hal qilamiz.',
  },

  // ── Hisob va profil ──
  {
    id: 'account',
    keywords: ['hisob', 'profil', 'account', 'profile', 'parol', 'password', 'kirish', 'login', 'registratsiya', "ro'yxat", 'chiqish', 'logout', 'ochirilsin', "o'chirish"],
    patterns: [/parol.*(unutdim|almash|ozgartir)/, /hisob.*(ochir|bloklash|muammo)/],
    priority: 7,
    answer: '👤 Hisob va profil:\n\n🔐 Parolni tiklash:\n1️⃣ Kirish sahifasida "Parolni unutdim" tugmasini bosing\n2️⃣ Telefon raqamingizni kiriting\n3️⃣ SMS orqali kelgan kodni kiriting\n4️⃣ Yangi parol o\'rnating\n\n✏️ Profil tahrirlash:\n• "Profil" → "Sozlamalar" bo\'limidan ism, telefon, manzil va boshqa ma\'lumotlarni o\'zgartirishingiz mumkin\n\n🔔 Bildirishnomalar:\n• "Sozlamalar" → "Bildirishnomalar" bo\'limidan push-xabarlarni yoqish/o\'chirish mumkin',
    followUp: 'Agar hisobingizga kira olmayapsiz, telefon raqamingizni yozing — yordam beraman.',
  },

  // ── Ilova haqida ──
  {
    id: 'about_app',
    keywords: ['ilova', 'app', 'приложение', 'topla', 'versiya', 'yangilanish', 'update', 'xato', 'error', 'bug', 'ishlamayapti', 'ochilmayapti'],
    patterns: [/ilova.*(ishla|ochil|xato|yaxshi|muammo)/, /topla.*(nima|haqida|qanday)/],
    priority: 6,
    answer: '📱 TOPLA ilovasi haqida:\n\nTOPLA — O\'zbekistonning zamonaviy marketplace ilovasi. Minglab mahsulotlarni qulay narxlarda, ishonchli do\'konlardan xarid qiling!\n\n🔧 Muammo bo\'lsa:\n• Ilovani oxirgi versiyaga yangilang\n• Keshni tozalang: Sozlamalar → Ilova → TOPLA → Keshni tozalash\n• Internetga ulanishni tekshiring\n• Ilovani qayta ishga tushiring\n\n📲 Yangilanishlar avtomatik keladi. Play Market/App Store dan ham tekshirishingiz mumkin.',
    followUp: 'Muammo davom etsa, telefon modeli va xatolik tavsifini yozing — texnik jamoa tekshiradi.',
  },

  // ── Rahmat va xayrlashuv ──
  {
    id: 'thanks',
    keywords: ['rahmat', 'raxmat', 'thanks', 'спасибо', 'sag bol', "sag'bol", 'minnatdor', 'tashakkur', 'yaxshi', 'ajoyib', 'zo\'r', 'super'],
    priority: 5,
    answer: 'Arzimaydi! 😊 Sizga yordam bera olganimdan xursandman.\n\nYana biror savol yoki muammo bo\'lsa, bemalol yozing — TOPLA yordam markazi 24/7 sizning xizmatingizda!\n\n⭐ Agar xizmatimiz yoqgan bo\'lsa, Play Market/App Store da ilovamizni baholashingizni so\'rab qolamiz.',
  },

  // ── Xayrlashuv ──
  {
    id: 'goodbye',
    keywords: ['hayr', 'xayr', 'korishguncha', "ko'rishguncha", 'bye', 'goodbye', 'до свидания'],
    priority: 5,
    answer: 'Salomat bo\'ling! 👋 Yaxshi kun tilayman.\n\nYana biror narsa kerak bo\'lsa, istalgan vaqtda yozing. TOPLA doim yordamga tayyor!',
  },

  // ── Shikoyat ──
  {
    id: 'complaint',
    keywords: ['shikoyat', 'norozilik', 'yomon', 'dahshat', 'aldash', 'aldadi', 'firibgar', 'laqillamoqchi', 'complaint'],
    patterns: [/sifat.*(yomon|past)/, /aldab.*(qoldi|ketdi)/, /pul.*(qaytarmadi|bermadi)/],
    priority: 9,
    answer: '⚠️ Murojatingizni jiddiy qabul qilamiz!\n\nShikoyatingizni samarali ko\'rib chiqishimiz uchun quyidagilarni yuboring:\n\n📋 Kerakli ma\'lumotlar:\n1️⃣ Buyurtma raqami\n2️⃣ Muammoning batafsil tavsifi\n3️⃣ Iloji bo\'lsa — rasm yoki screenshot\n\n⏱ Ko\'rib chiqish muddati: 24 soat ichida javob beramiz.\n\n📞 Shoshilinch holatlarda: +998 95 000 94 16 raqamiga qo\'ng\'iroq qilishingiz mumkin.\n\nSizning ishonchingiz biz uchun muhim — muammoni albatta hal qilamiz!',
  },
];

// Smart matching with scoring
function findBotResponse(message: string): string | null {
  const lower = message.toLowerCase().trim();

  // Too short messages — skip
  if (lower.length < 2) return null;

  // Score each rule
  const scored: { rule: BotRule; score: number }[] = [];

  for (const rule of BOT_RULES) {
    let score = 0;

    // Keyword matching
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        score += kw.length; // longer keyword = more specific = higher score
      }
    }

    // Pattern (regex) matching — bonus
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(lower)) {
          score += 15; // regex match = strong signal
        }
      }
    }

    if (score > 0) {
      scored.push({ rule, score: score + rule.priority });
    }
  }

  if (scored.length === 0) {
    // Fallback — no match
    return '🤔 Savolingizni tushundim, lekin aniqroq javob berish uchun ko\'proq ma\'lumot kerak.\n\nQuyidagilardan birini yozib ko\'ring:\n• "Buyurtma holati" — buyurtmangiz haqida bilish uchun\n• "Yetkazib berish" — yetkazish shartlari uchun\n• "To\'lov" — to\'lov usullari haqida\n• "Qaytarish" — mahsulotni qaytarish uchun\n• "Chegirma" — aksiya va promo kodlar haqida\n\nYoki muammoingizni batafsil yozing — operatorimiz tez orada javob beradi! 🙋‍♂️';
  }

  // Pick highest scoring rule
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!.rule;

  // Append followUp if present
  let response = best.answer;
  if (best.followUp) {
    response += '\n\n💡 ' + best.followUp;
  }

  return response;
}

// ============================================
// Routes
// ============================================
export async function supportRoutes(app: FastifyInstance) {

  // ==========================================
  // GET /support/ticket — get or create user's support ticket
  // ==========================================
  app.get('/support/ticket', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;

    // Get or create ticket
    let ticket = await prisma.supportTicket.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      // Send welcome message from bot
      await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'bot',
          message: 'Assalomu alaykum! 👋 TOPLA yordam markaziga xush kelibsiz.\n\nMen sizga tez va aniq yordam berishga tayyorman. Quyidagi mavzulardan birini tanlang yoki savolingizni erkin yozing:\n\n📦 Buyurtma holati\n🚚 Yetkazib berish\n💳 To\'lov masalalari\n🔄 Qaytarish va almashtirish\n📍 Topshirish punktlari\n💰 Chegirma va aksiyalar\n🏪 Do\'konlar\n\nSavolingizni yozing — yordam berishdan xursand bo\'laman!',
        },
      });
    }

    return { success: true, data: ticket };
  });

  // ==========================================
  // GET /support/messages — get messages for user's ticket
  // ==========================================
  app.get('/support/messages', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);

    const ticket = await prisma.supportTicket.findUnique({
      where: { userId },
    });

    if (!ticket) {
      return { success: true, data: { items: [], pagination: { total: 0, page: 1, limit, totalPages: 0, hasMore: false } } };
    }

    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where: { ticketId: ticket.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.supportMessage.count({ where: { ticketId: ticket.id } }),
    ]);

    return {
      success: true,
      data: {
        items: messages.reverse(),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  });

  // ==========================================
  // POST /support/messages — send message
  // ==========================================
  app.post('/support/messages', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;

    const { message, imageUrl } = z.object({
      message: z.string().max(2000).default(''),
      imageUrl: z.string().optional(),
    }).parse(request.body);

    // At least message or image required
    if (!message && !imageUrl) {
      return { success: false, error: 'Xabar yoki rasm kerak' };
    }

    // Get or create ticket
    let ticket = await prisma.supportTicket.findUnique({
      where: { userId },
    });

    if (!ticket) {
      ticket = await prisma.supportTicket.create({
        data: { userId },
      });
    }

    // Reopen if closed
    if (ticket.status === 'closed') {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'open' },
      });
    }

    // Save user message
    const userMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType: 'user',
        message: message || '',
        ...(imageUrl ? { imageUrl } : {}),
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Try bot auto-reply (only for text messages)
    const botAnswer = message ? findBotResponse(message) : null;
    let botMessage = null;

    if (botAnswer) {
      // Small delay effect - save immediately but return both
      botMessage = await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'bot',
          message: botAnswer,
        },
      });
    }

    return {
      success: true,
      data: {
        userMessage,
        botMessage,
      },
    };
  });

  // ==========================================
  // PUT /support/messages/read — mark messages as read
  // ==========================================
  app.put('/support/messages/read', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;

    const ticket = await prisma.supportTicket.findUnique({
      where: { userId },
    });

    if (ticket) {
      await prisma.supportMessage.updateMany({
        where: {
          ticketId: ticket.id,
          senderType: { in: ['admin', 'bot'] },
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    return { success: true, message: 'O\'qildi' };
  });

  // ==========================================
  // GET /support/unread-count — unread support messages
  // ==========================================
  app.get('/support/unread-count', {
    preHandler: [authMiddleware],
  }, async (request) => {
    const userId = request.user!.userId;

    const ticket = await prisma.supportTicket.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!ticket) return { success: true, data: { count: 0 } };

    const count = await prisma.supportMessage.count({
      where: {
        ticketId: ticket.id,
        senderType: { in: ['admin', 'bot'] },
        isRead: false,
      },
    });

    return { success: true, data: { count } };
  });

  // ==========================================
  // ADMIN: GET /support/admin/tickets — all support tickets
  // ==========================================
  app.get('/support/admin/tickets', {
    preHandler: [authMiddleware],
  }, async (request) => {
    if (request.user!.role !== 'admin') {
      return { success: false, error: 'Faqat admin uchun' };
    }

    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);
    const status = query.status || 'open';

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { message: true, senderType: true, createdAt: true },
          },
        },
      }),
      prisma.supportTicket.count({ where: { status } }),
    ]);

    return {
      success: true,
      data: {
        items: tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  });

  // ==========================================
  // ADMIN: POST /support/admin/tickets/:id/reply — admin reply
  // ==========================================
  app.post('/support/admin/tickets/:id/reply', {
    preHandler: [authMiddleware],
  }, async (request) => {
    if (request.user!.role !== 'admin') {
      return { success: false, error: 'Faqat admin uchun' };
    }

    const { id } = request.params as { id: string };
    const { message } = z.object({
      message: z.string().min(1).max(2000),
    }).parse(request.body);

    const adminMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: request.user!.userId,
        senderType: 'admin',
        message,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return { success: true, data: adminMessage };
  });

  // ==========================================
  // ADMIN: GET /support/admin/tickets/:id/messages
  // ==========================================
  app.get('/support/admin/tickets/:id/messages', {
    preHandler: [authMiddleware],
  }, async (request) => {
    if (request.user!.role !== 'admin') {
      return { success: false, error: 'Faqat admin uchun' };
    }

    const { id } = request.params as { id: string };
    const query = request.query as any;
    const { page, limit, skip } = parsePagination(query);

    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where: { ticketId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.supportMessage.count({ where: { ticketId: id } }),
    ]);

    // Mark user messages as read
    await prisma.supportMessage.updateMany({
      where: {
        ticketId: id,
        senderType: 'user',
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      success: true,
      data: {
        items: messages.reverse(),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  });
}
