import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Slug generator: "Ko'ylaklar va shimlar" -> "koylaklar-va-shimlar"
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['\u2018\u2019\u02BC`]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================
// 16 L0 kategoriyalar - Uzum Market darajasida
// Har biri L1 (o'rta) va L2 (barg) kategoriyalari bilan
// ============================================

interface L2Cat {
  nameUz: string;
  nameRu: string;
}

interface L1Cat {
  nameUz: string;
  nameRu: string;
  children: L2Cat[];
}

interface L0Cat {
  nameUz: string;
  nameRu: string;
  icon: string;
  children: L1Cat[];
}

const CATEGORIES: L0Cat[] = [
  // 1. ELEKTRONIKA
  {
    nameUz: 'Elektronika',
    nameRu: '\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u0438\u043A\u0430',
    icon: 'mobile',
    children: [
      {
        nameUz: 'Smartfonlar',
        nameRu: '\u0421\u043C\u0430\u0440\u0442\u0444\u043E\u043D\u044B',
        children: [
          { nameUz: 'Smartfonlar', nameRu: '\u0421\u043C\u0430\u0440\u0442\u0444\u043E\u043D\u044B' },
          { nameUz: 'Telefon g\'iloflari', nameRu: '\u0427\u0435\u0445\u043B\u044B \u0434\u043B\u044F \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u0432' },
          { nameUz: 'Himoya oynalari', nameRu: '\u0417\u0430\u0449\u0438\u0442\u043D\u044B\u0435 \u0441\u0442\u0451\u043A\u043B\u0430' },
          { nameUz: 'Zaryadlovchi qurilmalar', nameRu: '\u0417\u0430\u0440\u044F\u0434\u043D\u044B\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430' },
          { nameUz: 'USB kabellar', nameRu: 'USB-\u043A\u0430\u0431\u0435\u043B\u0438' },
        ],
      },
      {
        nameUz: 'Noutbuklar va kompyuterlar',
        nameRu: '\u041D\u043E\u0443\u0442\u0431\u0443\u043A\u0438 \u0438 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u044B',
        children: [
          { nameUz: 'Noutbuklar', nameRu: '\u041D\u043E\u0443\u0442\u0431\u0443\u043A\u0438' },
          { nameUz: 'Kompyuterlar', nameRu: '\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u041F\u041A' },
          { nameUz: 'Monitorlar', nameRu: '\u041C\u043E\u043D\u0438\u0442\u043E\u0440\u044B' },
          { nameUz: 'Komponentlar', nameRu: '\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u0443\u044E\u0449\u0438\u0435' },
          { nameUz: 'Klaviatura va sichqoncha', nameRu: '\u041A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u044B \u0438 \u043C\u044B\u0448\u0438' },
          { nameUz: 'Printerlar va skanerlar', nameRu: '\u041F\u0440\u0438\u043D\u0442\u0435\u0440\u044B \u0438 \u0441\u043A\u0430\u043D\u0435\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Planshetlar',
        nameRu: '\u041F\u043B\u0430\u043D\u0448\u0435\u0442\u044B',
        children: [
          { nameUz: 'Planshetlar', nameRu: '\u041F\u043B\u0430\u043D\u0448\u0435\u0442\u044B' },
          { nameUz: 'Planshet aksessuarlari', nameRu: '\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B \u0434\u043B\u044F \u043F\u043B\u0430\u043D\u0448\u0435\u0442\u043E\u0432' },
          { nameUz: 'Elektron kitobxonlar', nameRu: '\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u044B\u0435 \u043A\u043D\u0438\u0433\u0438' },
        ],
      },
      {
        nameUz: 'Audio texnika',
        nameRu: '\u0410\u0443\u0434\u0438\u043E\u0442\u0435\u0445\u043D\u0438\u043A\u0430',
        children: [
          { nameUz: 'Simli quloqchinlar', nameRu: '\u041F\u0440\u043E\u0432\u043E\u0434\u043D\u044B\u0435 \u043D\u0430\u0443\u0448\u043D\u0438\u043A\u0438' },
          { nameUz: 'Simsiz quloqchinlar', nameRu: '\u0411\u0435\u0441\u043F\u0440\u043E\u0432\u043E\u0434\u043D\u044B\u0435 \u043D\u0430\u0443\u0448\u043D\u0438\u043A\u0438' },
          { nameUz: 'TWS quloqchinlar', nameRu: 'TWS-\u043D\u0430\u0443\u0448\u043D\u0438\u043A\u0438' },
          { nameUz: 'Portativ kolonkalar', nameRu: '\u041F\u043E\u0440\u0442\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438' },
          { nameUz: 'Mikrofonlar', nameRu: '\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D\u044B' },
        ],
      },
      {
        nameUz: 'Smart gadjetlar',
        nameRu: '\u0423\u043C\u043D\u044B\u0435 \u0433\u0430\u0434\u0436\u0435\u0442\u044B',
        children: [
          { nameUz: 'Smart soatlar', nameRu: '\u0423\u043C\u043D\u044B\u0435 \u0447\u0430\u0441\u044B' },
          { nameUz: 'Fitnes bilanzliklar', nameRu: '\u0424\u0438\u0442\u043D\u0435\u0441-\u0431\u0440\u0430\u0441\u043B\u0435\u0442\u044B' },
          { nameUz: 'Powerbank', nameRu: '\u041F\u043E\u0432\u0435\u0440\u0431\u0430\u043D\u043A\u0438' },
          { nameUz: 'Fleshkalar', nameRu: '\u0424\u043B\u0435\u0448\u043A\u0438' },
          { nameUz: 'Xotira kartalari', nameRu: '\u041A\u0430\u0440\u0442\u044B \u043F\u0430\u043C\u044F\u0442\u0438' },
        ],
      },
    ],
  },

  // 2. MAISHIY TEXNIKA
  {
    nameUz: 'Maishiy texnika',
    nameRu: '\u0411\u044B\u0442\u043E\u0432\u0430\u044F \u0442\u0435\u0445\u043D\u0438\u043A\u0430',
    icon: 'blend_2',
    children: [
      {
        nameUz: 'Katta maishiy texnika',
        nameRu: '\u041A\u0440\u0443\u043F\u043D\u0430\u044F \u0431\u044B\u0442\u043E\u0432\u0430\u044F \u0442\u0435\u0445\u043D\u0438\u043A\u0430',
        children: [
          { nameUz: 'Kir yuvish mashinalari', nameRu: '\u0421\u0442\u0438\u0440\u0430\u043B\u044C\u043D\u044B\u0435 \u043C\u0430\u0448\u0438\u043D\u044B' },
          { nameUz: 'Muzlatgichlar', nameRu: '\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u0438\u043A\u0438' },
          { nameUz: 'Konditsionerlar', nameRu: '\u041A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u044B' },
          { nameUz: 'Gazplitalar', nameRu: '\u0413\u0430\u0437\u043E\u0432\u044B\u0435 \u043F\u043B\u0438\u0442\u044B' },
          { nameUz: 'Idish yuvish mashinalari', nameRu: '\u041F\u043E\u0441\u0443\u0434\u043E\u043C\u043E\u0435\u0447\u043D\u044B\u0435 \u043C\u0430\u0448\u0438\u043D\u044B' },
        ],
      },
      {
        nameUz: 'Televizorlar va video',
        nameRu: '\u0422\u0412 \u0438 \u0432\u0438\u0434\u0435\u043E',
        children: [
          { nameUz: 'Televizorlar', nameRu: '\u0422\u0435\u043B\u0435\u0432\u0438\u0437\u043E\u0440\u044B' },
          { nameUz: 'TV pristavkalar', nameRu: '\u0422\u0412-\u043F\u0440\u0438\u0441\u0442\u0430\u0432\u043A\u0438' },
          { nameUz: 'Projektorlar', nameRu: '\u041F\u0440\u043E\u0435\u043A\u0442\u043E\u0440\u044B' },
          { nameUz: 'TV kronshteynlar', nameRu: '\u041A\u0440\u043E\u043D\u0448\u0442\u0435\u0439\u043D\u044B \u0434\u043B\u044F \u0422\u0412' },
        ],
      },
      {
        nameUz: 'Oshxona texnikasi',
        nameRu: '\u041A\u0443\u0445\u043E\u043D\u043D\u0430\u044F \u0442\u0435\u0445\u043D\u0438\u043A\u0430',
        children: [
          { nameUz: 'Mikroto\'lqinli pechlar', nameRu: '\u041C\u0438\u043A\u0440\u043E\u0432\u043E\u043B\u043D\u043E\u0432\u044B\u0435 \u043F\u0435\u0447\u0438' },
          { nameUz: 'Blenderlar', nameRu: '\u0411\u043B\u0435\u043D\u0434\u0435\u0440\u044B' },
          { nameUz: 'Elektr choynak', nameRu: '\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u0447\u0430\u0439\u043D\u0438\u043A\u0438' },
          { nameUz: 'Multivarkalar', nameRu: '\u041C\u0443\u043B\u044C\u0442\u0438\u0432\u0430\u0440\u043A\u0438' },
          { nameUz: 'Tosterlar', nameRu: '\u0422\u043E\u0441\u0442\u0435\u0440\u044B' },
          { nameUz: 'Qahva mashinalari', nameRu: '\u041A\u043E\u0444\u0435\u043C\u0430\u0448\u0438\u043D\u044B' },
          { nameUz: 'Go\'sht maydalagich', nameRu: '\u041C\u044F\u0441\u043E\u0440\u0443\u0431\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Tozalash texnikasi',
        nameRu: '\u0422\u0435\u0445\u043D\u0438\u043A\u0430 \u0434\u043B\u044F \u0443\u0431\u043E\u0440\u043A\u0438',
        children: [
          { nameUz: 'Changyutgichlar', nameRu: '\u041F\u044B\u043B\u0435\u0441\u043E\u0441\u044B' },
          { nameUz: 'Robot changyutgich', nameRu: '\u0420\u043E\u0431\u043E\u0442\u044B-\u043F\u044B\u043B\u0435\u0441\u043E\u0441\u044B' },
          { nameUz: 'Bug\' tozalagichlar', nameRu: '\u041F\u0430\u0440\u043E\u043E\u0447\u0438\u0441\u0442\u0438\u0442\u0435\u043B\u0438' },
        ],
      },
      {
        nameUz: 'Iqlim texnikasi',
        nameRu: '\u041A\u043B\u0438\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0442\u0435\u0445\u043D\u0438\u043A\u0430',
        children: [
          { nameUz: 'Isitgichlar', nameRu: '\u041E\u0431\u043E\u0433\u0440\u0435\u0432\u0430\u0442\u0435\u043B\u0438' },
          { nameUz: 'Ventilyatorlar', nameRu: '\u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0442\u043E\u0440\u044B' },
          { nameUz: 'Namlagichlar', nameRu: '\u0423\u0432\u043B\u0430\u0436\u043D\u0438\u0442\u0435\u043B\u0438 \u0432\u043E\u0437\u0434\u0443\u0445\u0430' },
          { nameUz: 'Havo tozalagichlar', nameRu: '\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u0435\u043B\u0438 \u0432\u043E\u0437\u0434\u0443\u0445\u0430' },
        ],
      },
      {
        nameUz: 'Dazmollar va tikuv',
        nameRu: '\u0423\u0442\u044E\u0433\u0438 \u0438 \u0448\u0438\u0442\u044C\u0451',
        children: [
          { nameUz: 'Dazmollar', nameRu: '\u0423\u0442\u044E\u0433\u0438' },
          { nameUz: 'Bug\'li dazmollar', nameRu: '\u041E\u0442\u043F\u0430\u0440\u0438\u0432\u0430\u0442\u0435\u043B\u0438' },
          { nameUz: 'Tikuv mashinalari', nameRu: '\u0428\u0432\u0435\u0439\u043D\u044B\u0435 \u043C\u0430\u0448\u0438\u043D\u044B' },
        ],
      },
    ],
  },

  // 3. KIYIMLAR
  {
    nameUz: 'Kiyimlar',
    nameRu: '\u041E\u0434\u0435\u0436\u0434\u0430',
    icon: 'shirt',
    children: [
      {
        nameUz: 'Erkaklar kiyimi',
        nameRu: '\u041C\u0443\u0436\u0441\u043A\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430',
        children: [
          { nameUz: 'Ko\'ylaklar', nameRu: '\u0420\u0443\u0431\u0430\u0448\u043A\u0438' },
          { nameUz: 'Futbolkalar', nameRu: '\u0424\u0443\u0442\u0431\u043E\u043B\u043A\u0438' },
          { nameUz: 'Shimlar', nameRu: '\u0411\u0440\u044E\u043A\u0438' },
          { nameUz: 'Jinsi shimlar', nameRu: '\u0414\u0436\u0438\u043D\u0441\u044B' },
          { nameUz: 'Kostyumlar', nameRu: '\u041A\u043E\u0441\u0442\u044E\u043C\u044B' },
          { nameUz: 'Kurtkalar', nameRu: '\u041A\u0443\u0440\u0442\u043A\u0438' },
          { nameUz: 'Sviterlar', nameRu: '\u0421\u0432\u0438\u0442\u0435\u0440\u044B' },
          { nameUz: 'Ichki kiyim', nameRu: '\u041D\u0438\u0436\u043D\u0435\u0435 \u0431\u0435\u043B\u044C\u0451' },
        ],
      },
      {
        nameUz: 'Ayollar kiyimi',
        nameRu: '\u0416\u0435\u043D\u0441\u043A\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430',
        children: [
          { nameUz: 'Ko\'ylaklar', nameRu: '\u041F\u043B\u0430\u0442\u044C\u044F' },
          { nameUz: 'Bluzka va ko\'ylaklar', nameRu: '\u0411\u043B\u0443\u0437\u043A\u0438 \u0438 \u0440\u0443\u0431\u0430\u0448\u043A\u0438' },
          { nameUz: 'Shimlar va yubkalar', nameRu: '\u0411\u0440\u044E\u043A\u0438 \u0438 \u044E\u0431\u043A\u0438' },
          { nameUz: 'Ustki kiyim', nameRu: '\u0412\u0435\u0440\u0445\u043D\u044F\u044F \u043E\u0434\u0435\u0436\u0434\u0430' },
          { nameUz: 'Ichki kiyim', nameRu: '\u041D\u0438\u0436\u043D\u0435\u0435 \u0431\u0435\u043B\u044C\u0451' },
          { nameUz: 'Ro\'mollar va sharflar', nameRu: '\u041F\u043B\u0430\u0442\u043A\u0438 \u0438 \u0448\u0430\u0440\u0444\u044B' },
          { nameUz: 'Sport kiyimlar', nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430' },
        ],
      },
      {
        nameUz: 'Bolalar kiyimi',
        nameRu: '\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430',
        children: [
          { nameUz: 'O\'g\'il bolalar kiyimi', nameRu: '\u041E\u0434\u0435\u0436\u0434\u0430 \u0434\u043B\u044F \u043C\u0430\u043B\u044C\u0447\u0438\u043A\u043E\u0432' },
          { nameUz: 'Qiz bolalar kiyimi', nameRu: '\u041E\u0434\u0435\u0436\u0434\u0430 \u0434\u043B\u044F \u0434\u0435\u0432\u043E\u0447\u0435\u043A' },
          { nameUz: 'Chaqaloq kiyimlari', nameRu: '\u041E\u0434\u0435\u0436\u0434\u0430 \u0434\u043B\u044F \u043D\u043E\u0432\u043E\u0440\u043E\u0436\u0434\u0451\u043D\u043D\u044B\u0445' },
          { nameUz: 'Maktab formasi', nameRu: '\u0428\u043A\u043E\u043B\u044C\u043D\u0430\u044F \u0444\u043E\u0440\u043C\u0430' },
        ],
      },
      {
        nameUz: 'Poyabzal',
        nameRu: '\u041E\u0431\u0443\u0432\u044C',
        children: [
          { nameUz: 'Erkaklar poyabzali', nameRu: '\u041C\u0443\u0436\u0441\u043A\u0430\u044F \u043E\u0431\u0443\u0432\u044C' },
          { nameUz: 'Ayollar poyabzali', nameRu: '\u0416\u0435\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u0443\u0432\u044C' },
          { nameUz: 'Bolalar poyabzali', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u043E\u0431\u0443\u0432\u044C' },
          { nameUz: 'Sport poyabzal', nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0431\u0443\u0432\u044C' },
        ],
      },
    ],
  },

  // 4. AKSESSUARLAR
  {
    nameUz: 'Aksessuarlar',
    nameRu: '\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B',
    icon: 'bag_2',
    children: [
      {
        nameUz: 'Sumkalar',
        nameRu: '\u0421\u0443\u043C\u043A\u0438',
        children: [
          { nameUz: 'Ayollar sumkalari', nameRu: '\u0416\u0435\u043D\u0441\u043A\u0438\u0435 \u0441\u0443\u043C\u043A\u0438' },
          { nameUz: 'Erkaklar sumkalari', nameRu: '\u041C\u0443\u0436\u0441\u043A\u0438\u0435 \u0441\u0443\u043C\u043A\u0438' },
          { nameUz: 'Ryukzaklar', nameRu: '\u0420\u044E\u043A\u0437\u0430\u043A\u0438' },
          { nameUz: 'Chamadonlar', nameRu: '\u0427\u0435\u043C\u043E\u0434\u0430\u043D\u044B' },
          { nameUz: 'Bel sumkalar', nameRu: '\u041F\u043E\u044F\u0441\u043D\u044B\u0435 \u0441\u0443\u043C\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Zargarlik buyumlari',
        nameRu: '\u042E\u0432\u0435\u043B\u0438\u0440\u043D\u044B\u0435 \u0438\u0437\u0434\u0435\u043B\u0438\u044F',
        children: [
          { nameUz: 'Uzuklar', nameRu: '\u041A\u043E\u043B\u044C\u0446\u0430' },
          { nameUz: 'Bo\'yintuqlar', nameRu: '\u041E\u0436\u0435\u0440\u0435\u043B\u044C\u044F' },
          { nameUz: 'Isirg\'alar', nameRu: '\u0421\u0435\u0440\u044C\u0433\u0438' },
          { nameUz: 'Bilaguzuklar', nameRu: '\u0411\u0440\u0430\u0441\u043B\u0435\u0442\u044B' },
        ],
      },
      {
        nameUz: 'Soatlar',
        nameRu: '\u0427\u0430\u0441\u044B',
        children: [
          { nameUz: 'Erkaklar soatlari', nameRu: '\u041C\u0443\u0436\u0441\u043A\u0438\u0435 \u0447\u0430\u0441\u044B' },
          { nameUz: 'Ayollar soatlari', nameRu: '\u0416\u0435\u043D\u0441\u043A\u0438\u0435 \u0447\u0430\u0441\u044B' },
          { nameUz: 'Bolalar soatlari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0447\u0430\u0441\u044B' },
        ],
      },
      {
        nameUz: 'Kamarlar va hamyonlar',
        nameRu: '\u0420\u0435\u043C\u043D\u0438 \u0438 \u043A\u043E\u0448\u0435\u043B\u044C\u043A\u0438',
        children: [
          { nameUz: 'Kamarlar', nameRu: '\u0420\u0435\u043C\u043D\u0438' },
          { nameUz: 'Hamyonlar', nameRu: '\u041A\u043E\u0448\u0435\u043B\u044C\u043A\u0438' },
          { nameUz: 'Karta g\'iloflari', nameRu: '\u041A\u0430\u0440\u0442\u0445\u043E\u043B\u0434\u0435\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Ko\'zoynaklar',
        nameRu: '\u041E\u0447\u043A\u0438',
        children: [
          { nameUz: 'Quyoshdan ko\'zoynaklar', nameRu: '\u0421\u043E\u043B\u043D\u0446\u0435\u0437\u0430\u0449\u0438\u0442\u043D\u044B\u0435 \u043E\u0447\u043A\u0438' },
          { nameUz: 'Optik ko\'zoynaklar', nameRu: '\u041E\u043F\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043E\u0447\u043A\u0438' },
        ],
      },
    ],
  },

  // 5. GO'ZALLIK VA PARVARISH
  {
    nameUz: 'Go\'zallik va parvarish',
    nameRu: '\u041A\u0440\u0430\u0441\u043E\u0442\u0430 \u0438 \u0443\u0445\u043E\u0434',
    icon: 'magic_star',
    children: [
      {
        nameUz: 'Pardoz vositalari',
        nameRu: '\u0414\u0435\u043A\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u043A\u043E\u0441\u043C\u0435\u0442\u0438\u043A\u0430',
        children: [
          { nameUz: 'Yuz uchun pardoz', nameRu: '\u041C\u0430\u043A\u0438\u044F\u0436 \u0434\u043B\u044F \u043B\u0438\u0446\u0430' },
          { nameUz: 'Lab bo\'yoqlari', nameRu: '\u041F\u043E\u043C\u0430\u0434\u044B' },
          { nameUz: 'Ko\'z uchun pardoz', nameRu: '\u041C\u0430\u043A\u0438\u044F\u0436 \u0434\u043B\u044F \u0433\u043B\u0430\u0437' },
          { nameUz: 'Tirnoq bo\'yoqlari', nameRu: '\u041B\u0430\u043A\u0438 \u0434\u043B\u044F \u043D\u043E\u0433\u0442\u0435\u0439' },
        ],
      },
      {
        nameUz: 'Teri parvarishi',
        nameRu: '\u0423\u0445\u043E\u0434 \u0437\u0430 \u043A\u043E\u0436\u0435\u0439',
        children: [
          { nameUz: 'Yuz kremlari', nameRu: '\u041A\u0440\u0435\u043C\u044B \u0434\u043B\u044F \u043B\u0438\u0446\u0430' },
          { nameUz: 'Tana losyonlari', nameRu: '\u041B\u043E\u0441\u044C\u043E\u043D\u044B \u0434\u043B\u044F \u0442\u0435\u043B\u0430' },
          { nameUz: 'Quyoshdan himoya', nameRu: '\u0421\u043E\u043B\u043D\u0446\u0435\u0437\u0430\u0449\u0438\u0442\u043D\u044B\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430' },
          { nameUz: 'Yuz niqoblari', nameRu: '\u041C\u0430\u0441\u043A\u0438 \u0434\u043B\u044F \u043B\u0438\u0446\u0430' },
        ],
      },
      {
        nameUz: 'Soch parvarishi',
        nameRu: '\u0423\u0445\u043E\u0434 \u0437\u0430 \u0432\u043E\u043B\u043E\u0441\u0430\u043C\u0438',
        children: [
          { nameUz: 'Shampunlar', nameRu: '\u0428\u0430\u043C\u043F\u0443\u043D\u0438' },
          { nameUz: 'Balzamlar va konditsionerlar', nameRu: '\u0411\u0430\u043B\u044C\u0437\u0430\u043C\u044B \u0438 \u043A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440\u044B' },
          { nameUz: 'Soch bo\'yoqlari', nameRu: '\u041A\u0440\u0430\u0441\u043A\u0438 \u0434\u043B\u044F \u0432\u043E\u043B\u043E\u0441' },
          { nameUz: 'Soch quritgichlar va dazmollar', nameRu: '\u0424\u0435\u043D\u044B \u0438 \u0441\u0442\u0430\u0439\u043B\u0435\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Parfyumeriya',
        nameRu: '\u041F\u0430\u0440\u0444\u044E\u043C\u0435\u0440\u0438\u044F',
        children: [
          { nameUz: 'Ayollar atiri', nameRu: '\u0416\u0435\u043D\u0441\u043A\u0430\u044F \u043F\u0430\u0440\u0444\u044E\u043C\u0435\u0440\u0438\u044F' },
          { nameUz: 'Erkaklar atiri', nameRu: '\u041C\u0443\u0436\u0441\u043A\u0430\u044F \u043F\u0430\u0440\u0444\u044E\u043C\u0435\u0440\u0438\u044F' },
          { nameUz: 'Atir to\'plamlari', nameRu: '\u041F\u0430\u0440\u0444\u044E\u043C\u0435\u0440\u043D\u044B\u0435 \u043D\u0430\u0431\u043E\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Shaxsiy gigiena',
        nameRu: '\u041B\u0438\u0447\u043D\u0430\u044F \u0433\u0438\u0433\u0438\u0435\u043D\u0430',
        children: [
          { nameUz: 'Og\'iz bo\'shlig\'i gigienasi', nameRu: '\u0413\u0438\u0433\u0438\u0435\u043D\u0430 \u043F\u043E\u043B\u043E\u0441\u0442\u0438 \u0440\u0442\u0430' },
          { nameUz: 'Tana parvarishi', nameRu: '\u0423\u0445\u043E\u0434 \u0437\u0430 \u0442\u0435\u043B\u043E\u043C' },
          { nameUz: 'Soqol parvarishi', nameRu: '\u0423\u0445\u043E\u0434 \u0437\u0430 \u0431\u043E\u0440\u043E\u0434\u043E\u0439' },
          { nameUz: 'Ustara va malhamlar', nameRu: '\u0411\u0440\u0438\u0442\u0432\u044B \u0438 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0431\u0440\u0438\u0442\u044C\u044F' },
        ],
      },
    ],
  },

  // 6. SALOMATLIK
  {
    nameUz: 'Salomatlik',
    nameRu: '\u0417\u0434\u043E\u0440\u043E\u0432\u044C\u0435',
    icon: 'health',
    children: [
      {
        nameUz: 'Vitaminlar va BADlar',
        nameRu: '\u0412\u0438\u0442\u0430\u043C\u0438\u043D\u044B \u0438 \u0411\u0410\u0414\u044B',
        children: [
          { nameUz: 'Vitaminlar', nameRu: '\u0412\u0438\u0442\u0430\u043C\u0438\u043D\u044B' },
          { nameUz: 'BADlar', nameRu: '\u0411\u0410\u0414\u044B' },
          { nameUz: 'Omega va baliq yog\'i', nameRu: '\u041E\u043C\u0435\u0433\u0430 \u0438 \u0440\u044B\u0431\u0438\u0439 \u0436\u0438\u0440' },
          { nameUz: 'Sport ozuqa', nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u043E\u0435 \u043F\u0438\u0442\u0430\u043D\u0438\u0435' },
        ],
      },
      {
        nameUz: 'Tibbiy jihozlar',
        nameRu: '\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0435 \u043F\u0440\u0438\u0431\u043E\u0440\u044B',
        children: [
          { nameUz: 'Tonometrlar', nameRu: '\u0422\u043E\u043D\u043E\u043C\u0435\u0442\u0440\u044B' },
          { nameUz: 'Termometrlar', nameRu: '\u0422\u0435\u0440\u043C\u043E\u043C\u0435\u0442\u0440\u044B' },
          { nameUz: 'Ingalyatorlar', nameRu: '\u0418\u043D\u0433\u0430\u043B\u044F\u0442\u043E\u0440\u044B' },
          { nameUz: 'Qon shakar o\'lchagich', nameRu: '\u0413\u043B\u044E\u043A\u043E\u043C\u0435\u0442\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Birinchi yordam',
        nameRu: '\u041F\u0435\u0440\u0432\u0430\u044F \u043F\u043E\u043C\u043E\u0449\u044C',
        children: [
          { nameUz: 'Plasterlar va bintlar', nameRu: '\u041F\u043B\u0430\u0441\u0442\u044B\u0440\u0438 \u0438 \u0431\u0438\u043D\u0442\u044B' },
          { nameUz: 'Antiseptiklar', nameRu: '\u0410\u043D\u0442\u0438\u0441\u0435\u043F\u0442\u0438\u043A\u0438' },
          { nameUz: 'Tibbiy niqoblar', nameRu: '\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0435 \u043C\u0430\u0441\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Ortopedik buyumlar',
        nameRu: '\u041E\u0440\u0442\u043E\u043F\u0435\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u044B',
        children: [
          { nameUz: 'Ortopedik yostiqlar', nameRu: '\u041E\u0440\u0442\u043E\u043F\u0435\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043F\u043E\u0434\u0443\u0448\u043A\u0438' },
          { nameUz: 'Ortopedik tasmalar', nameRu: '\u041E\u0440\u0442\u043E\u043F\u0435\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0431\u0430\u043D\u0434\u0430\u0436\u0438' },
          { nameUz: 'Ortopedik taqalar', nameRu: '\u041E\u0440\u0442\u043E\u043F\u0435\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u0442\u0435\u043B\u044C\u043A\u0438' },
        ],
      },
    ],
  },

  // 7. BOLALAR UCHUN
  {
    nameUz: 'Bolalar uchun',
    nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u044B',
    icon: 'happyemoji',
    children: [
      {
        nameUz: 'Bolalar oziq-ovqati',
        nameRu: '\u0414\u0435\u0442\u0441\u043A\u043E\u0435 \u043F\u0438\u0442\u0430\u043D\u0438\u0435',
        children: [
          { nameUz: 'Sut aralashmalari', nameRu: '\u041C\u043E\u043B\u043E\u0447\u043D\u044B\u0435 \u0441\u043C\u0435\u0441\u0438' },
          { nameUz: 'Pyurelar', nameRu: '\u041F\u044E\u0440\u0435' },
          { nameUz: 'Kashalar', nameRu: '\u041A\u0430\u0448\u0438' },
          { nameUz: 'Bolalar suvlari va sharbat', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0432\u043E\u0434\u044B \u0438 \u0441\u043E\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Bolalar gigienasi',
        nameRu: '\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u0433\u0438\u0433\u0438\u0435\u043D\u0430',
        children: [
          { nameUz: 'Tagliklar (pampers)', nameRu: '\u041F\u043E\u0434\u0433\u0443\u0437\u043D\u0438\u043A\u0438' },
          { nameUz: 'Nam salfetkalar', nameRu: '\u0412\u043B\u0430\u0436\u043D\u044B\u0435 \u0441\u0430\u043B\u0444\u0435\u0442\u043A\u0438' },
          { nameUz: 'Bolalar shampunlari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0448\u0430\u043C\u043F\u0443\u043D\u0438' },
          { nameUz: 'Bolalar kremlari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u043A\u0440\u0435\u043C\u044B' },
        ],
      },
      {
        nameUz: 'Aravachalar va avtourindiqlari',
        nameRu: '\u041A\u043E\u043B\u044F\u0441\u043A\u0438 \u0438 \u0430\u0432\u0442\u043E\u043A\u0440\u0435\u0441\u043B\u0430',
        children: [
          { nameUz: 'Yurish aravachalari', nameRu: '\u041F\u0440\u043E\u0433\u0443\u043B\u043E\u0447\u043D\u044B\u0435 \u043A\u043E\u043B\u044F\u0441\u043A\u0438' },
          { nameUz: 'Transformer aravachalar', nameRu: '\u041A\u043E\u043B\u044F\u0441\u043A\u0438-\u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C\u0435\u0440\u044B' },
          { nameUz: 'Avtourindiqlari', nameRu: '\u0410\u0432\u0442\u043E\u043A\u0440\u0435\u0441\u043B\u0430' },
          { nameUz: 'Tashuvchi sumkalar', nameRu: '\u041F\u0435\u0440\u0435\u043D\u043E\u0441\u043A\u0438' },
        ],
      },
      {
        nameUz: 'O\'yinchoqlar',
        nameRu: '\u0418\u0433\u0440\u0443\u0448\u043A\u0438',
        children: [
          { nameUz: 'Konstruktorlar', nameRu: '\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u044B' },
          { nameUz: 'Qo\'g\'irchoqlar', nameRu: '\u041A\u0443\u043A\u043B\u044B' },
          { nameUz: 'Mashinalar', nameRu: '\u041C\u0430\u0448\u0438\u043D\u043A\u0438' },
          { nameUz: 'Yumshoq o\'yinchoqlar', nameRu: '\u041C\u044F\u0433\u043A\u0438\u0435 \u0438\u0433\u0440\u0443\u0448\u043A\u0438' },
          { nameUz: 'Rivojlantiruvchi o\'yinchoqlar', nameRu: '\u0420\u0430\u0437\u0432\u0438\u0432\u0430\u044E\u0449\u0438\u0435 \u0438\u0433\u0440\u0443\u0448\u043A\u0438' },
          { nameUz: 'Stol o\'yinlari', nameRu: '\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Bolalar mebeli',
        nameRu: '\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u043C\u0435\u0431\u0435\u043B\u044C',
        children: [
          { nameUz: 'Bolalar kravatlari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0438' },
          { nameUz: 'Bolalar stol va stullari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0441\u0442\u043E\u043B\u044B \u0438 \u0441\u0442\u0443\u043B\u044C\u044F' },
          { nameUz: 'O\'yin maydonchalari', nameRu: '\u041C\u0430\u043D\u0435\u0436\u0438' },
        ],
      },
    ],
  },

  // 8. UY VA MEBEL
  {
    nameUz: 'Uy va mebel',
    nameRu: '\u0414\u043E\u043C \u0438 \u043C\u0435\u0431\u0435\u043B\u044C',
    icon: 'home_2',
    children: [
      {
        nameUz: 'Mebel',
        nameRu: '\u041C\u0435\u0431\u0435\u043B\u044C',
        children: [
          { nameUz: 'Yotoqxona mebeli', nameRu: '\u041C\u0435\u0431\u0435\u043B\u044C \u0434\u043B\u044F \u0441\u043F\u0430\u043B\u044C\u043D\u0438' },
          { nameUz: 'Yashash xonasi mebeli', nameRu: '\u041C\u0435\u0431\u0435\u043B\u044C \u0434\u043B\u044F \u0433\u043E\u0441\u0442\u0438\u043D\u043E\u0439' },
          { nameUz: 'Oshxona mebeli', nameRu: '\u041A\u0443\u0445\u043E\u043D\u043D\u0430\u044F \u043C\u0435\u0431\u0435\u043B\u044C' },
          { nameUz: 'Ofis mebeli', nameRu: '\u041E\u0444\u0438\u0441\u043D\u0430\u044F \u043C\u0435\u0431\u0435\u043B\u044C' },
          { nameUz: 'Koridor mebeli', nameRu: '\u041C\u0435\u0431\u0435\u043B\u044C \u0434\u043B\u044F \u043F\u0440\u0438\u0445\u043E\u0436\u0435\u0439' },
        ],
      },
      {
        nameUz: 'Uy tekstili',
        nameRu: '\u0414\u043E\u043C\u0430\u0448\u043D\u0438\u0439 \u0442\u0435\u043A\u0441\u0442\u0438\u043B\u044C',
        children: [
          { nameUz: 'Ko\'rpalar', nameRu: '\u041E\u0434\u0435\u044F\u043B\u0430' },
          { nameUz: 'Yostiqlar', nameRu: '\u041F\u043E\u0434\u0443\u0448\u043A\u0438' },
          { nameUz: 'Choyshablar', nameRu: '\u041F\u043E\u0441\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0431\u0435\u043B\u044C\u0451' },
          { nameUz: 'Pardalar', nameRu: '\u0428\u0442\u043E\u0440\u044B' },
          { nameUz: 'Sochiqlar', nameRu: '\u041F\u043E\u043B\u043E\u0442\u0435\u043D\u0446\u0430' },
          { nameUz: 'Gilamlar', nameRu: '\u041A\u043E\u0432\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Oshxona buyumlari',
        nameRu: '\u041F\u043E\u0441\u0443\u0434\u0430 \u0438 \u043A\u0443\u0445\u043D\u044F',
        children: [
          { nameUz: 'Qozon va tovoqlar', nameRu: '\u041A\u0430\u0441\u0442\u0440\u044E\u043B\u0438 \u0438 \u0441\u043A\u043E\u0432\u043E\u0440\u043E\u0434\u043A\u0438' },
          { nameUz: 'Pichoklar', nameRu: '\u041D\u043E\u0436\u0438' },
          { nameUz: 'Stakanlar va piyolalar', nameRu: '\u0421\u0442\u0430\u043A\u0430\u043D\u044B \u0438 \u043F\u0438\u0430\u043B\u044B' },
          { nameUz: 'Tarelkalar', nameRu: '\u0422\u0430\u0440\u0435\u043B\u043A\u0438' },
          { nameUz: 'Saqlash idishlari', nameRu: '\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u044B \u0434\u043B\u044F \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F' },
        ],
      },
      {
        nameUz: 'Dekor',
        nameRu: '\u0414\u0435\u043A\u043E\u0440',
        children: [
          { nameUz: 'Rasmlar va kartinalar', nameRu: '\u041A\u0430\u0440\u0442\u0438\u043D\u044B \u0438 \u043F\u043E\u0441\u0442\u0435\u0440\u044B' },
          { nameUz: 'Guldonlar', nameRu: '\u0412\u0430\u0437\u044B' },
          { nameUz: 'Shamlar va shamdonlar', nameRu: '\u0421\u0432\u0435\u0447\u0438 \u0438 \u043F\u043E\u0434\u0441\u0432\u0435\u0447\u043D\u0438\u043A\u0438' },
          { nameUz: 'Oynalar', nameRu: '\u0417\u0435\u0440\u043A\u0430\u043B\u0430' },
        ],
      },
      {
        nameUz: 'Yoritish',
        nameRu: '\u041E\u0441\u0432\u0435\u0449\u0435\u043D\u0438\u0435',
        children: [
          { nameUz: 'Lyustralar', nameRu: '\u041B\u044E\u0441\u0442\u0440\u044B' },
          { nameUz: 'Stol lampalari', nameRu: '\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u043B\u0430\u043C\u043F\u044B' },
          { nameUz: 'LED lentalar', nameRu: 'LED-\u043B\u0435\u043D\u0442\u044B' },
          { nameUz: 'Tushlik lampalar', nameRu: '\u0422\u043E\u0440\u0448\u0435\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Hammom buyumlari',
        nameRu: '\u0422\u043E\u0432\u0430\u0440\u044B \u0434\u043B\u044F \u0432\u0430\u043D\u043D\u043E\u0439',
        children: [
          { nameUz: 'Hammom aksessuarlari', nameRu: '\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B \u0434\u043B\u044F \u0432\u0430\u043D\u043D\u043E\u0439' },
          { nameUz: 'Saqlash va tartib', nameRu: '\u0425\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F' },
          { nameUz: 'Hammom to\'plamlari', nameRu: '\u041D\u0430\u0431\u043E\u0440\u044B \u0434\u043B\u044F \u0432\u0430\u043D\u043D\u043E\u0439' },
        ],
      },
    ],
  },

  // 9. MAISHIY KIMYO
  {
    nameUz: 'Maishiy kimyo',
    nameRu: '\u0411\u044B\u0442\u043E\u0432\u0430\u044F \u0445\u0438\u043C\u0438\u044F',
    icon: 'box_1',
    children: [
      {
        nameUz: 'Kir yuvish vositalari',
        nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0441\u0442\u0438\u0440\u043A\u0438',
        children: [
          { nameUz: 'Kir yuvish kukuni', nameRu: '\u0421\u0442\u0438\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0440\u043E\u0448\u043E\u043A' },
          { nameUz: 'Suyuq yuvish vositasi', nameRu: '\u0416\u0438\u0434\u043A\u043E\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0441\u0442\u0438\u0440\u043A\u0438' },
          { nameUz: 'Yumshatgich', nameRu: '\u041A\u043E\u043D\u0434\u0438\u0446\u0438\u043E\u043D\u0435\u0440 \u0434\u043B\u044F \u0431\u0435\u043B\u044C\u044F' },
          { nameUz: 'Oqartgichlar', nameRu: '\u041E\u0442\u0431\u0435\u043B\u0438\u0432\u0430\u0442\u0435\u043B\u0438' },
        ],
      },
      {
        nameUz: 'Tozalash vositalari',
        nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0443\u0431\u043E\u0440\u043A\u0438',
        children: [
          { nameUz: 'Pol tozalagichlar', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u043F\u043E\u043B\u0430' },
          { nameUz: 'Oshxona tozalagichlar', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u043A\u0443\u0445\u043D\u0438' },
          { nameUz: 'Hammom tozalagichlar', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0432\u0430\u043D\u043D\u043E\u0439' },
          { nameUz: 'Oyna tozalagichlar', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0441\u0442\u0451\u043A\u043E\u043B' },
        ],
      },
      {
        nameUz: 'Idish yuvish vositalari',
        nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u043C\u044B\u0442\u044C\u044F \u043F\u043E\u0441\u0443\u0434\u044B',
        children: [
          { nameUz: 'Idish yuvish suyuqligi', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u043C\u044B\u0442\u044C\u044F \u043F\u043E\u0441\u0443\u0434\u044B' },
          { nameUz: 'Mashinali yuvish tabletkalari', nameRu: '\u0422\u0430\u0431\u043B\u0435\u0442\u043A\u0438 \u0434\u043B\u044F \u043F\u043E\u0441\u0443\u0434\u043E\u043C\u043E\u0435\u0447\u043D\u043E\u0439 \u043C\u0430\u0448\u0438\u043D\u044B' },
        ],
      },
      {
        nameUz: 'Xushbo\'ylantirgichlar',
        nameRu: '\u041E\u0441\u0432\u0435\u0436\u0438\u0442\u0435\u043B\u0438 \u0432\u043E\u0437\u0434\u0443\u0445\u0430',
        children: [
          { nameUz: 'Xona uchun', nameRu: '\u0414\u043B\u044F \u043F\u043E\u043C\u0435\u0449\u0435\u043D\u0438\u0439' },
          { nameUz: 'Mashina uchun', nameRu: '\u0414\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044F' },
          { nameUz: 'Aromatik shamlar', nameRu: '\u0410\u0440\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u0432\u0435\u0447\u0438' },
        ],
      },
    ],
  },

  // 10. QURILISH VA TA'MIRLASH
  {
    nameUz: 'Qurilish va ta\'mirlash',
    nameRu: '\u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0438 \u0440\u0435\u043C\u043E\u043D\u0442',
    icon: 'ruler',
    children: [
      {
        nameUz: 'Asboblar',
        nameRu: '\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B',
        children: [
          { nameUz: 'Elektr asboblar', nameRu: '\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B' },
          { nameUz: 'Qo\'l asboblari', nameRu: '\u0420\u0443\u0447\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B' },
          { nameUz: 'O\'lchov asboblari', nameRu: '\u0418\u0437\u043C\u0435\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B' },
        ],
      },
      {
        nameUz: 'Bo\'yoqlar va laklash',
        nameRu: '\u041A\u0440\u0430\u0441\u043A\u0438 \u0438 \u043B\u0430\u043A\u0438',
        children: [
          { nameUz: 'Bo\'yoqlar', nameRu: '\u041A\u0440\u0430\u0441\u043A\u0438' },
          { nameUz: 'Laklar', nameRu: '\u041B\u0430\u043A\u0438' },
          { nameUz: 'Grunt va shpatlevka', nameRu: '\u0413\u0440\u0443\u043D\u0442\u043E\u0432\u043A\u0438 \u0438 \u0448\u043F\u0430\u0442\u043B\u0451\u0432\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Santexnika',
        nameRu: '\u0421\u0430\u043D\u0442\u0435\u0445\u043D\u0438\u043A\u0430',
        children: [
          { nameUz: 'Kranlar va aralashtirgichlar', nameRu: '\u041A\u0440\u0430\u043D\u044B \u0438 \u0441\u043C\u0435\u0441\u0438\u0442\u0435\u043B\u0438' },
          { nameUz: 'Unitazlar', nameRu: '\u0423\u043D\u0438\u0442\u0430\u0437\u044B' },
          { nameUz: 'Dush kabinalar', nameRu: '\u0414\u0443\u0448\u0435\u0432\u044B\u0435 \u043A\u0430\u0431\u0438\u043D\u044B' },
          { nameUz: 'Trubalar va fitinglar', nameRu: '\u0422\u0440\u0443\u0431\u044B \u0438 \u0444\u0438\u0442\u0438\u043D\u0433\u0438' },
        ],
      },
      {
        nameUz: 'Elektrika',
        nameRu: '\u042D\u043B\u0435\u043A\u0442\u0440\u0438\u043A\u0430',
        children: [
          { nameUz: 'Rozetkalar va vyklyuchatellar', nameRu: '\u0420\u043E\u0437\u0435\u0442\u043A\u0438 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u0438' },
          { nameUz: 'Simlar va kabellar', nameRu: '\u041F\u0440\u043E\u0432\u043E\u0434\u0430 \u0438 \u043A\u0430\u0431\u0435\u043B\u0438' },
          { nameUz: 'LED lampalar', nameRu: 'LED-\u043B\u0430\u043C\u043F\u044B' },
        ],
      },
      {
        nameUz: 'Qulflar va dastaklar',
        nameRu: '\u0417\u0430\u043C\u043A\u0438 \u0438 \u0444\u0443\u0440\u043D\u0438\u0442\u0443\u0440\u0430',
        children: [
          { nameUz: 'Eshik qulflari', nameRu: '\u0414\u0432\u0435\u0440\u043D\u044B\u0435 \u0437\u0430\u043C\u043A\u0438' },
          { nameUz: 'Eshik dastaklar', nameRu: '\u0414\u0432\u0435\u0440\u043D\u044B\u0435 \u0440\u0443\u0447\u043A\u0438' },
          { nameUz: 'Mahkamlagichlar', nameRu: '\u041A\u0440\u0435\u043F\u0451\u0436' },
        ],
      },
    ],
  },

  // 11. OZIQ-OVQAT
  {
    nameUz: 'Oziq-ovqat',
    nameRu: '\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u044B \u043F\u0438\u0442\u0430\u043D\u0438\u044F',
    icon: 'milk',
    children: [
      {
        nameUz: 'Sut mahsulotlari',
        nameRu: '\u041C\u043E\u043B\u043E\u0447\u043D\u044B\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B',
        children: [
          { nameUz: 'Sut', nameRu: '\u041C\u043E\u043B\u043E\u043A\u043E' },
          { nameUz: 'Qatiq va yogurt', nameRu: '\u041A\u0435\u0444\u0438\u0440 \u0438 \u0439\u043E\u0433\u0443\u0440\u0442' },
          { nameUz: 'Pishloq', nameRu: '\u0421\u044B\u0440' },
          { nameUz: 'Sariyog\'', nameRu: '\u0421\u043B\u0438\u0432\u043E\u0447\u043D\u043E\u0435 \u043C\u0430\u0441\u043B\u043E' },
          { nameUz: 'Tvorog va smetana', nameRu: '\u0422\u0432\u043E\u0440\u043E\u0433 \u0438 \u0441\u043C\u0435\u0442\u0430\u043D\u0430' },
        ],
      },
      {
        nameUz: 'Non va un mahsulotlari',
        nameRu: '\u0425\u043B\u0435\u0431 \u0438 \u043C\u0443\u043A\u0430',
        children: [
          { nameUz: 'Non', nameRu: '\u0425\u043B\u0435\u0431' },
          { nameUz: 'Un', nameRu: '\u041C\u0443\u043A\u0430' },
          { nameUz: 'Makaron', nameRu: '\u041C\u0430\u043A\u0430\u0440\u043E\u043D\u044B' },
          { nameUz: 'Guruch va yormalar', nameRu: '\u041A\u0440\u0443\u043F\u044B' },
        ],
      },
      {
        nameUz: 'Konservalar',
        nameRu: '\u041A\u043E\u043D\u0441\u0435\u0440\u0432\u044B',
        children: [
          { nameUz: 'Sabzavot konservalari', nameRu: '\u041E\u0432\u043E\u0449\u043D\u044B\u0435 \u043A\u043E\u043D\u0441\u0435\u0440\u0432\u044B' },
          { nameUz: 'Go\'sht konservalari', nameRu: '\u041C\u044F\u0441\u043D\u044B\u0435 \u043A\u043E\u043D\u0441\u0435\u0440\u0432\u044B' },
          { nameUz: 'Baliq konservalari', nameRu: '\u0420\u044B\u0431\u043D\u044B\u0435 \u043A\u043E\u043D\u0441\u0435\u0440\u0432\u044B' },
        ],
      },
      {
        nameUz: 'Yog\' va soslar',
        nameRu: '\u041C\u0430\u0441\u043B\u0430 \u0438 \u0441\u043E\u0443\u0441\u044B',
        children: [
          { nameUz: 'O\'simlik yog\'i', nameRu: '\u0420\u0430\u0441\u0442\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043C\u0430\u0441\u043B\u043E' },
          { nameUz: 'Ketchup', nameRu: '\u041A\u0435\u0442\u0447\u0443\u043F' },
          { nameUz: 'Mayanez', nameRu: '\u041C\u0430\u0439\u043E\u043D\u0435\u0437' },
          { nameUz: 'Ziravorlar', nameRu: '\u0421\u043F\u0435\u0446\u0438\u0438 \u0438 \u043F\u0440\u0438\u043F\u0440\u0430\u0432\u044B' },
        ],
      },
      {
        nameUz: 'Shirinliklar va gazaklar',
        nameRu: '\u0421\u043B\u0430\u0434\u043E\u0441\u0442\u0438 \u0438 \u0441\u043D\u0435\u043A\u0438',
        children: [
          { nameUz: 'Shokoladlar', nameRu: '\u0428\u043E\u043A\u043E\u043B\u0430\u0434' },
          { nameUz: 'Konfetlar', nameRu: '\u041A\u043E\u043D\u0444\u0435\u0442\u044B' },
          { nameUz: 'Pechenye', nameRu: '\u041F\u0435\u0447\u0435\u043D\u044C\u0435' },
          { nameUz: 'Chipsilar va gazaklar', nameRu: '\u0427\u0438\u043F\u0441\u044B \u0438 \u0441\u043D\u0435\u043A\u0438' },
          { nameUz: 'Quritilgan mevalar', nameRu: '\u0421\u0443\u0445\u043E\u0444\u0440\u0443\u043A\u0442\u044B \u0438 \u043E\u0440\u0435\u0445\u0438' },
        ],
      },
      {
        nameUz: 'Ichimliklar',
        nameRu: '\u041D\u0430\u043F\u0438\u0442\u043A\u0438',
        children: [
          { nameUz: 'Choy', nameRu: '\u0427\u0430\u0439' },
          { nameUz: 'Qahva', nameRu: '\u041A\u043E\u0444\u0435' },
          { nameUz: 'Sharbatlar', nameRu: '\u0421\u043E\u043A\u0438' },
          { nameUz: 'Suv', nameRu: '\u0412\u043E\u0434\u0430' },
          { nameUz: 'Gazli ichimliklar', nameRu: '\u0413\u0430\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043D\u0430\u043F\u0438\u0442\u043A\u0438' },
        ],
      },
    ],
  },

  // 12. AVTOTOVARLAR
  {
    nameUz: 'Avtotovarlar',
    nameRu: '\u0410\u0432\u0442\u043E\u0442\u043E\u0432\u0430\u0440\u044B',
    icon: 'car',
    children: [
      {
        nameUz: 'Ehtiyot qismlar',
        nameRu: '\u0417\u0430\u043F\u0447\u0430\u0441\u0442\u0438',
        children: [
          { nameUz: 'Dvigatel qismlari', nameRu: '\u0414\u0435\u0442\u0430\u043B\u0438 \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044F' },
          { nameUz: 'Tormoz tizimlari', nameRu: '\u0422\u043E\u0440\u043C\u043E\u0437\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430' },
          { nameUz: 'Filtrlar', nameRu: '\u0424\u0438\u043B\u044C\u0442\u0440\u044B' },
          { nameUz: 'Yoqilg\'i tizimi', nameRu: '\u0422\u043E\u043F\u043B\u0438\u0432\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430' },
        ],
      },
      {
        nameUz: 'Avto aksessuarlar',
        nameRu: '\u0410\u0432\u0442\u043E\u0430\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B',
        children: [
          { nameUz: 'Videoregistratorlar', nameRu: '\u0412\u0438\u0434\u0435\u043E\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u044B' },
          { nameUz: 'Navigatorlar', nameRu: '\u041D\u0430\u0432\u0438\u0433\u0430\u0442\u043E\u0440\u044B' },
          { nameUz: 'Avto tozalagichlar', nameRu: '\u0410\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0435 \u043F\u044B\u043B\u0435\u0441\u043E\u0441\u044B' },
          { nameUz: 'Avto xushbo\'ylantirgichlar', nameRu: '\u0410\u0432\u0442\u043E\u043E\u0441\u0432\u0435\u0436\u0438\u0442\u0435\u043B\u0438' },
          { nameUz: 'O\'rindiq qoplamalari', nameRu: '\u0427\u0435\u0445\u043B\u044B \u0434\u043B\u044F \u0441\u0438\u0434\u0435\u043D\u0438\u0439' },
        ],
      },
      {
        nameUz: 'Moy va suyuqliklar',
        nameRu: '\u041C\u0430\u0441\u043B\u0430 \u0438 \u0436\u0438\u0434\u043A\u043E\u0441\u0442\u0438',
        children: [
          { nameUz: 'Motor moyi', nameRu: '\u041C\u043E\u0442\u043E\u0440\u043D\u043E\u0435 \u043C\u0430\u0441\u043B\u043E' },
          { nameUz: 'Transmissiya moyi', nameRu: '\u0422\u0440\u0430\u043D\u0441\u043C\u0438\u0441\u0441\u0438\u043E\u043D\u043D\u043E\u0435 \u043C\u0430\u0441\u043B\u043E' },
          { nameUz: 'Antifriz', nameRu: '\u0410\u043D\u0442\u0438\u0444\u0440\u0438\u0437' },
          { nameUz: 'Tormoz suyuqligi', nameRu: '\u0422\u043E\u0440\u043C\u043E\u0437\u043D\u0430\u044F \u0436\u0438\u0434\u043A\u043E\u0441\u0442\u044C' },
        ],
      },
      {
        nameUz: 'Shinalar va disklar',
        nameRu: '\u0428\u0438\u043D\u044B \u0438 \u0434\u0438\u0441\u043A\u0438',
        children: [
          { nameUz: 'Yozgi shinalar', nameRu: '\u041B\u0435\u0442\u043D\u0438\u0435 \u0448\u0438\u043D\u044B' },
          { nameUz: 'Qishki shinalar', nameRu: '\u0417\u0438\u043C\u043D\u0438\u0435 \u0448\u0438\u043D\u044B' },
          { nameUz: 'Disklar', nameRu: '\u0414\u0438\u0441\u043A\u0438' },
        ],
      },
    ],
  },

  // 13. SPORT VA DAM OLISH
  {
    nameUz: 'Sport va dam olish',
    nameRu: '\u0421\u043F\u043E\u0440\u0442 \u0438 \u043E\u0442\u0434\u044B\u0445',
    icon: 'weight_1',
    children: [
      {
        nameUz: 'Sport kiyimlari',
        nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430',
        children: [
          { nameUz: 'Erkaklar sport kiyimi', nameRu: '\u041C\u0443\u0436\u0441\u043A\u0430\u044F \u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430' },
          { nameUz: 'Ayollar sport kiyimi', nameRu: '\u0416\u0435\u043D\u0441\u043A\u0430\u044F \u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430' },
          { nameUz: 'Sport poyabzal', nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u043E\u0431\u0443\u0432\u044C' },
        ],
      },
      {
        nameUz: 'Sport jihozlari',
        nameRu: '\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u044B\u0439 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C',
        children: [
          { nameUz: 'Gantellar va shtan\'galar', nameRu: '\u0413\u0430\u043D\u0442\u0435\u043B\u0438 \u0438 \u0448\u0442\u0430\u043D\u0433\u0438' },
          { nameUz: 'Trenajyorlar', nameRu: '\u0422\u0440\u0435\u043D\u0430\u0436\u0451\u0440\u044B' },
          { nameUz: 'Yoga va fitnes', nameRu: '\u0419\u043E\u0433\u0430 \u0438 \u0444\u0438\u0442\u043D\u0435\u0441' },
          { nameUz: 'Boks jihozlari', nameRu: '\u0411\u043E\u043A\u0441\u0451\u0440\u0441\u043A\u0438\u0439 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C' },
        ],
      },
      {
        nameUz: 'Velosipedlar',
        nameRu: '\u0412\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434\u044B',
        children: [
          { nameUz: 'Kattalar velosipedlari', nameRu: '\u0412\u0437\u0440\u043E\u0441\u043B\u044B\u0435 \u0432\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434\u044B' },
          { nameUz: 'Bolalar velosipedlari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u0432\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434\u044B' },
          { nameUz: 'Veloaksessuarlar', nameRu: '\u0412\u0435\u043B\u043E\u0430\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B' },
        ],
      },
      {
        nameUz: 'Turizm va dam olish',
        nameRu: '\u0422\u0443\u0440\u0438\u0437\u043C \u0438 \u043E\u0442\u0434\u044B\u0445',
        children: [
          { nameUz: 'Chodirlar', nameRu: '\u041F\u0430\u043B\u0430\u0442\u043A\u0438' },
          { nameUz: 'Uyqu xaltalari', nameRu: '\u0421\u043F\u0430\u043B\u044C\u043D\u044B\u0435 \u043C\u0435\u0448\u043A\u0438' },
          { nameUz: 'Ko\'zilar', nameRu: '\u0420\u044E\u043A\u0437\u0430\u043A\u0438 \u0442\u0443\u0440\u0438\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435' },
          { nameUz: 'Fonorlar', nameRu: '\u0424\u043E\u043D\u0430\u0440\u0438' },
        ],
      },
      {
        nameUz: 'Baliq ovi',
        nameRu: '\u0420\u044B\u0431\u0430\u043B\u043A\u0430',
        children: [
          { nameUz: 'Qarmog\'lar', nameRu: '\u0423\u0434\u043E\u0447\u043A\u0438' },
          { nameUz: 'Katushkalar', nameRu: '\u041A\u0430\u0442\u0443\u0448\u043A\u0438' },
          { nameUz: 'Baliq ovi aksessuarlari', nameRu: '\u0410\u043A\u0441\u0435\u0441\u0441\u0443\u0430\u0440\u044B \u0434\u043B\u044F \u0440\u044B\u0431\u0430\u043B\u043A\u0438' },
        ],
      },
    ],
  },

  // 14. KITOBLAR VA KANSELYARIYA
  {
    nameUz: 'Kitoblar va kanselyariya',
    nameRu: '\u041A\u043D\u0438\u0433\u0438 \u0438 \u043A\u0430\u043D\u0446\u0435\u043B\u044F\u0440\u0438\u044F',
    icon: 'book',
    children: [
      {
        nameUz: 'Kitoblar',
        nameRu: '\u041A\u043D\u0438\u0433\u0438',
        children: [
          { nameUz: 'Badiiy adabiyot', nameRu: '\u0425\u0443\u0434\u043E\u0436\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u043B\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0430' },
          { nameUz: 'Darsliklar', nameRu: '\u0423\u0447\u0435\u0431\u043D\u0438\u043A\u0438' },
          { nameUz: 'Bolalar kitoblari', nameRu: '\u0414\u0435\u0442\u0441\u043A\u0438\u0435 \u043A\u043D\u0438\u0433\u0438' },
          { nameUz: 'Biznes va motivatsiya', nameRu: '\u0411\u0438\u0437\u043D\u0435\u0441 \u0438 \u043C\u043E\u0442\u0438\u0432\u0430\u0446\u0438\u044F' },
          { nameUz: 'Diniy kitoblar', nameRu: '\u0420\u0435\u043B\u0438\u0433\u0438\u043E\u0437\u043D\u0430\u044F \u043B\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0430' },
        ],
      },
      {
        nameUz: 'Kanselyariya',
        nameRu: '\u041A\u0430\u043D\u0446\u0435\u043B\u044F\u0440\u0438\u044F',
        children: [
          { nameUz: 'Ruchka va qalamlar', nameRu: '\u0420\u0443\u0447\u043A\u0438 \u0438 \u043A\u0430\u0440\u0430\u043D\u0434\u0430\u0448\u0438' },
          { nameUz: 'Daftarlar va bloknot', nameRu: '\u0422\u0435\u0442\u0440\u0430\u0434\u0438 \u0438 \u0431\u043B\u043E\u043A\u043D\u043E\u0442\u044B' },
          { nameUz: 'Ofis buyumlari', nameRu: '\u041E\u0444\u0438\u0441\u043D\u044B\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u043D\u043E\u0441\u0442\u0438' },
        ],
      },
      {
        nameUz: 'Maktab buyumlari',
        nameRu: '\u0428\u043A\u043E\u043B\u044C\u043D\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B',
        children: [
          { nameUz: 'Portfellar va ryukzaklar', nameRu: '\u0420\u0430\u043D\u0446\u044B \u0438 \u0440\u044E\u043A\u0437\u0430\u043A\u0438' },
          { nameUz: 'Maktab jihozlari', nameRu: '\u0428\u043A\u043E\u043B\u044C\u043D\u044B\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u043D\u043E\u0441\u0442\u0438' },
        ],
      },
      {
        nameUz: 'Xobbi va ijodkorlik',
        nameRu: '\u0425\u043E\u0431\u0431\u0438 \u0438 \u0442\u0432\u043E\u0440\u0447\u0435\u0441\u0442\u0432\u043E',
        children: [
          { nameUz: 'Rassomchilik', nameRu: '\u0420\u0438\u0441\u043E\u0432\u0430\u043D\u0438\u0435' },
          { nameUz: 'Tikuvchilik', nameRu: '\u0428\u0438\u0442\u044C\u0451 \u0438 \u0432\u044B\u0448\u0438\u0432\u043A\u0430' },
          { nameUz: 'Qo\'lda ishlash', nameRu: '\u0420\u0443\u043A\u043E\u0434\u0435\u043B\u0438\u0435' },
          { nameUz: 'Musiqa asboblari', nameRu: '\u041C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B' },
        ],
      },
    ],
  },

  // 15. UY HAYVONLARI
  {
    nameUz: 'Uy hayvonlari',
    nameRu: '\u0414\u043E\u043C\u0430\u0448\u043D\u0438\u0435 \u0436\u0438\u0432\u043E\u0442\u043D\u044B\u0435',
    icon: 'pet',
    children: [
      {
        nameUz: 'Itlar uchun',
        nameRu: '\u0414\u043B\u044F \u0441\u043E\u0431\u0430\u043A',
        children: [
          { nameUz: 'Itlar uchun oziq-ovqat', nameRu: '\u041A\u043E\u0440\u043C \u0434\u043B\u044F \u0441\u043E\u0431\u0430\u043A' },
          { nameUz: 'Itlar uchun o\'yinchoqlar', nameRu: '\u0418\u0433\u0440\u0443\u0448\u043A\u0438 \u0434\u043B\u044F \u0441\u043E\u0431\u0430\u043A' },
          { nameUz: 'Bo\'yinbog\' va tasma', nameRu: '\u041E\u0448\u0435\u0439\u043D\u0438\u043A\u0438 \u0438 \u043F\u043E\u0432\u043E\u0434\u043A\u0438' },
          { nameUz: 'Itlar uchun kiyim', nameRu: '\u041E\u0434\u0435\u0436\u0434\u0430 \u0434\u043B\u044F \u0441\u043E\u0431\u0430\u043A' },
        ],
      },
      {
        nameUz: 'Mushuklar uchun',
        nameRu: '\u0414\u043B\u044F \u043A\u043E\u0448\u0435\u043A',
        children: [
          { nameUz: 'Mushuklar uchun oziq-ovqat', nameRu: '\u041A\u043E\u0440\u043C \u0434\u043B\u044F \u043A\u043E\u0448\u0435\u043A' },
          { nameUz: 'Mushuk tualet', nameRu: '\u041D\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u0438 \u0434\u043B\u044F \u043B\u043E\u0442\u043A\u043E\u0432' },
          { nameUz: 'Mushuklar uchun o\'yinchoqlar', nameRu: '\u0418\u0433\u0440\u0443\u0448\u043A\u0438 \u0434\u043B\u044F \u043A\u043E\u0448\u0435\u043A' },
          { nameUz: 'Tirnaqchalar va uylar', nameRu: '\u041A\u043E\u0433\u0442\u0435\u0442\u043E\u0447\u043A\u0438 \u0438 \u0434\u043E\u043C\u0438\u043A\u0438' },
        ],
      },
      {
        nameUz: 'Boshqa hayvonlar',
        nameRu: '\u0414\u0440\u0443\u0433\u0438\u0435 \u0436\u0438\u0432\u043E\u0442\u043D\u044B\u0435',
        children: [
          { nameUz: 'Baliqlar uchun', nameRu: '\u0414\u043B\u044F \u0440\u044B\u0431' },
          { nameUz: 'Qushlar uchun', nameRu: '\u0414\u043B\u044F \u043F\u0442\u0438\u0446' },
          { nameUz: 'Kemiruvchilar uchun', nameRu: '\u0414\u043B\u044F \u0433\u0440\u044B\u0437\u0443\u043D\u043E\u0432' },
        ],
      },
      {
        nameUz: 'Vetapteka',
        nameRu: '\u0412\u0435\u0442\u0430\u043F\u0442\u0435\u043A\u0430',
        children: [
          { nameUz: 'Vitaminlar va qo\'shimchalar', nameRu: '\u0412\u0438\u0442\u0430\u043C\u0438\u043D\u044B \u0438 \u0434\u043E\u0431\u0430\u0432\u043A\u0438' },
          { nameUz: 'Parazitlarga qarshi', nameRu: '\u0421\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043E\u0442 \u043F\u0430\u0440\u0430\u0437\u0438\u0442\u043E\u0432' },
        ],
      },
    ],
  },

  // 16. BOG' VA TOMORQA
  {
    nameUz: 'Bog\' va tomorqa',
    nameRu: '\u0421\u0430\u0434 \u0438 \u043E\u0433\u043E\u0440\u043E\u0434',
    icon: 'tree',
    children: [
      {
        nameUz: 'Urug\'lar va ko\'chatlar',
        nameRu: '\u0421\u0435\u043C\u0435\u043D\u0430 \u0438 \u0440\u0430\u0441\u0441\u0430\u0434\u0430',
        children: [
          { nameUz: 'Sabzavot urug\'lari', nameRu: '\u0421\u0435\u043C\u0435\u043D\u0430 \u043E\u0432\u043E\u0449\u0435\u0439' },
          { nameUz: 'Meva ko\'chatlari', nameRu: '\u0421\u0430\u0436\u0435\u043D\u0446\u044B' },
          { nameUz: 'Gul urug\'lari', nameRu: '\u0421\u0435\u043C\u0435\u043D\u0430 \u0446\u0432\u0435\u0442\u043E\u0432' },
        ],
      },
      {
        nameUz: 'Bog\' asboblari',
        nameRu: '\u0421\u0430\u0434\u043E\u0432\u044B\u0439 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044C',
        children: [
          { nameUz: 'Belkuraklar va ketmonlar', nameRu: '\u041B\u043E\u043F\u0430\u0442\u044B \u0438 \u043C\u043E\u0442\u044B\u0433\u0438' },
          { nameUz: 'Bog\' qaychilar', nameRu: '\u0421\u0430\u0434\u043E\u0432\u044B\u0435 \u043D\u043E\u0436\u043D\u0438\u0446\u044B' },
          { nameUz: 'Shlanglar va sug\'orish', nameRu: '\u0428\u043B\u0430\u043D\u0433\u0438 \u0438 \u043F\u043E\u043B\u0438\u0432' },
        ],
      },
      {
        nameUz: 'O\'g\'itlar va tuproq',
        nameRu: '\u0423\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F \u0438 \u0433\u0440\u0443\u043D\u0442',
        children: [
          { nameUz: 'O\'g\'itlar', nameRu: '\u0423\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F' },
          { nameUz: 'Tuproq aralashmalari', nameRu: '\u0413\u0440\u0443\u043D\u0442' },
          { nameUz: 'Pestitsidlar', nameRu: '\u041F\u0435\u0441\u0442\u0438\u0446\u0438\u0434\u044B' },
        ],
      },
      {
        nameUz: 'Gullar va o\'simliklar',
        nameRu: '\u0426\u0432\u0435\u0442\u044B \u0438 \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F',
        children: [
          { nameUz: 'Xona o\'simliklari', nameRu: '\u041A\u043E\u043C\u043D\u0430\u0442\u043D\u044B\u0435 \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F' },
          { nameUz: 'Guldonlar', nameRu: '\u0413\u043E\u0440\u0448\u043A\u0438 \u0438 \u043A\u0430\u0448\u043F\u043E' },
          { nameUz: 'Sun\'iy gullar', nameRu: '\u0418\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0446\u0432\u0435\u0442\u044B' },
        ],
      },
    ],
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\u274C XATO: Seed production muhitda ishlatish mumkin emas!');
    console.error('   Agar haqiqatan kerak bo\'lsa, NODE_ENV=development qilib ishga tushiring.');
    process.exit(1);
  }

  console.log('\uD83C\uDF31 Seeding database...');

  // ============================================
  // Categories - 3-level self-referencing
  // ============================================
  await prisma.category.deleteMany();

  const slugSet = new Set<string>();
  function uniqueSlug(text: string, parentSlug?: string): string {
    let base = parentSlug ? `${parentSlug}-${slugify(text)}` : slugify(text);
    let result = base;
    let counter = 2;
    while (slugSet.has(result)) {
      result = `${base}-${counter}`;
      counter++;
    }
    slugSet.add(result);
    return result;
  }

  let totalCount = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const l0 = CATEGORIES[i];
    const l0Slug = uniqueSlug(l0.nameUz);

    await prisma.category.create({
      data: {
        nameUz: l0.nameUz,
        nameRu: l0.nameRu,
        slug: l0Slug,
        icon: l0.icon,
        level: 0,
        sortOrder: i + 1,
        children: {
          create: l0.children.map((l1, l1i) => {
            const l1Slug = uniqueSlug(l1.nameUz, l0Slug);
            return {
              nameUz: l1.nameUz,
              nameRu: l1.nameRu,
              slug: l1Slug,
              level: 1,
              sortOrder: l1i + 1,
              children: {
                create: l1.children.map((l2, l2i) => {
                  const l2Slug = uniqueSlug(l2.nameUz, l1Slug);
                  totalCount++;
                  return {
                    nameUz: l2.nameUz,
                    nameRu: l2.nameRu,
                    slug: l2Slug,
                    level: 2,
                    sortOrder: l2i + 1,
                  };
                }),
              },
            };
          }),
        },
      },
    });

    totalCount += 1 + l0.children.length;
  }

  console.log(`\u2705 ${totalCount} categories created (${CATEGORIES.length} L0)`);

  // ============================================
  // Brands (upsert to avoid duplicates)
  // ============================================
  const brandNames = ['Apple', 'Samsung', 'Xiaomi', 'Nike', 'Adidas', 'Artel', 'Huawei', 'LG', 'Sony', 'Zara', 'H&M', 'Puma'];
  const brands = await Promise.all(
    brandNames.map((name) => prisma.brand.upsert({ where: { name }, create: { name }, update: {} })),
  );
  console.log(`\u2705 ${brands.length} brands created`);

  // ============================================
  // Colors
  // ============================================
  const colorData = [
    { nameUz: 'Qora', nameRu: '\u0427\u0451\u0440\u043D\u044B\u0439', hexCode: '#000000' },
    { nameUz: 'Oq', nameRu: '\u0411\u0435\u043B\u044B\u0439', hexCode: '#FFFFFF' },
    { nameUz: 'Qizil', nameRu: '\u041A\u0440\u0430\u0441\u043D\u044B\u0439', hexCode: '#FF0000' },
    { nameUz: 'Ko\'k', nameRu: '\u0421\u0438\u043D\u0438\u0439', hexCode: '#0000FF' },
    { nameUz: 'Yashil', nameRu: '\u0417\u0435\u043B\u0451\u043D\u044B\u0439', hexCode: '#00FF00' },
    { nameUz: 'Kulrang', nameRu: '\u0421\u0435\u0440\u044B\u0439', hexCode: '#808080' },
    { nameUz: 'Sariq', nameRu: '\u0416\u0451\u043B\u0442\u044B\u0439', hexCode: '#FFD700' },
    { nameUz: 'Pushti', nameRu: '\u0420\u043E\u0437\u043E\u0432\u044B\u0439', hexCode: '#FF69B4' },
    { nameUz: 'Jigarrang', nameRu: '\u041A\u043E\u0440\u0438\u0447\u043D\u0435\u0432\u044B\u0439', hexCode: '#8B4513' },
    { nameUz: 'Binafsha', nameRu: '\u0424\u0438\u043E\u043B\u0435\u0442\u043E\u0432\u044B\u0439', hexCode: '#800080' },
    { nameUz: 'To\'q ko\'k', nameRu: '\u0422\u0451\u043C\u043D\u043E-\u0441\u0438\u043D\u0438\u0439', hexCode: '#000080' },
    { nameUz: 'Oltin', nameRu: '\u0417\u043E\u043B\u043E\u0442\u043E\u0439', hexCode: '#DAA520' },
  ];
  await prisma.color.deleteMany();
  const colors = await Promise.all(colorData.map((c) => prisma.color.create({ data: c })));
  console.log(`\u2705 ${colors.length} colors created`);

  // ============================================
  // Promo Codes
  // ============================================
  await Promise.all([
    prisma.promoCode.upsert({
      where: { code: 'TOPLA10' },
      create: { code: 'TOPLA10', discountType: 'percentage', discountValue: 10, minOrderAmount: 50000, maxUses: 1000 },
      update: {},
    }),
    prisma.promoCode.upsert({
      where: { code: 'WELCOME' },
      create: { code: 'WELCOME', discountType: 'fixed', discountValue: 20000, minOrderAmount: 100000, maxUses: 500 },
      update: {},
    }),
    prisma.promoCode.upsert({
      where: { code: 'DELIVERY0' },
      create: { code: 'DELIVERY0', discountType: 'fixed', discountValue: 15000, maxUses: 200 },
      update: {},
    }),
  ]);
  console.log('\u2705 Promo codes created');

  // ============================================
  // Admin Settings
  // ============================================
  const settings = [
    { key: 'default_delivery_fee', value: '15000', type: 'number' },
    { key: 'commission_rate', value: '10', type: 'number' },
    { key: 'courier_delivery_share', value: '80', type: 'number' },
    { key: 'courier_assignment_timeout', value: '60', type: 'number' },
    { key: 'min_order_amount', value: '30000', type: 'number' },
    { key: 'app_version', value: '1.0.0', type: 'string' },
  ];
  await Promise.all(settings.map((s) => prisma.adminSetting.upsert({ where: { key: s.key }, create: s, update: {} })));
  console.log('\u2705 Admin settings created');

  // ============================================
  // Admin User
  // ============================================
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  await prisma.profile.upsert({
    where: { phone: '+998900000000' },
    update: {
      email: 'admin@topla.uz',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'TOPLA Admin',
    },
    create: {
      phone: '+998900000000',
      email: 'admin@topla.uz',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'TOPLA Admin',
      status: 'active',
    },
  });
  console.log('\u2705 Admin user created');

  // ============================================
  // Vendor User + Shop
  // ============================================
  const vendorPasswordHash = await bcrypt.hash('vendor123', 12);
  const vendorProfile = await prisma.profile.upsert({
    where: { phone: '+998911112233' },
    update: {
      email: 'vendor@topla.uz',
      passwordHash: vendorPasswordHash,
      role: 'vendor',
      fullName: 'Demo Vendor',
    },
    create: {
      phone: '+998911112233',
      email: 'vendor@topla.uz',
      passwordHash: vendorPasswordHash,
      role: 'vendor',
      fullName: 'Demo Vendor',
      status: 'active',
    },
  });

  await prisma.shop.upsert({
    where: { ownerId: vendorProfile.id },
    update: {
      name: 'Demo Shop',
      description: 'Demo do\'kon',
      phone: '+998911112233',
      address: 'Toshkent, Chilonzor',
      status: 'active',
    },
    create: {
      ownerId: vendorProfile.id,
      name: 'Demo Shop',
      description: 'Demo do\'kon',
      phone: '+998911112233',
      address: 'Toshkent, Chilonzor',
      status: 'active',
    },
  });
  console.log('\u2705 Vendor user created: vendor@topla.uz / vendor123');

  // ============================================
  // Banners
  // ============================================
  await prisma.banner.deleteMany();
  await Promise.all([
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop',
        titleUz: 'Yangi kolleksiya',
        titleRu: '\u041D\u043E\u0432\u0430\u044F \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F',
        subtitleUz: 'Eng so\'nggi mahsulotlar',
        subtitleRu: '\u0421\u0430\u043C\u044B\u0435 \u043D\u043E\u0432\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B',
        actionType: 'link',
        actionValue: 'https://t.me/topla_market',
        sortOrder: 1,
      },
    }),
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        titleUz: 'Chegirmalar haftaligi',
        titleRu: '\u041D\u0435\u0434\u0435\u043B\u044F \u0441\u043A\u0438\u0434\u043E\u043A',
        subtitleUz: '50% gacha chegirma',
        subtitleRu: '\u0421\u043A\u0438\u0434\u043A\u0438 \u0434\u043E 50%',
        actionType: 'link',
        actionValue: 'https://t.me/topla_market',
        sortOrder: 2,
      },
    }),
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
        titleUz: 'Bepul yetkazib berish',
        titleRu: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430',
        subtitleUz: '100 000 so\'mdan yuqori buyurtmalar',
        subtitleRu: '\u0417\u0430\u043A\u0430\u0437\u044B \u043E\u0442 100 000 \u0441\u0443\u043C',
        actionType: 'none',
        sortOrder: 3,
      },
    }),
  ]);
  console.log('\u2705 Banners created');

  console.log('\n\uD83C\uDF89 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('\u274C Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
