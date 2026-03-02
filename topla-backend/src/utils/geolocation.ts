/**
 * IP manzildan joylashuvni aniqlash (ip-api.com orqali)
 * Bepul API: 45 so'rov/daqiqa (faqat login paytida chaqiriladi)
 */

interface IpApiResponse {
  status: string;
  city?: string;
  regionName?: string;
  country?: string;
  countryCode?: string;
}

// Oddiy in-memory cache (1 soat davomida saqlanadi)
const locationCache = new Map<string, { location: string; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 soat

/**
 * IP manzildan "Shahar, Mamlakat" formatida joylashuvni qaytaradi
 * Xatolik bo'lsa null qaytaradi (login jarayonini bloklamaydi)
 */
export async function getLocationFromIp(ip: string): Promise<string | null> {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return 'Lokal qurilma';
    }

    // Agar IPv6 mapped IPv4 bo'lsa, tozalash
    const cleanIp = ip.replace('::ffff:', '');

    // Private/local IP bo'lsa
    if (
      cleanIp.startsWith('10.') ||
      cleanIp.startsWith('172.') ||
      cleanIp.startsWith('192.168.')
    ) {
      return 'Lokal tarmoq';
    }

    // Cache dan tekshirish
    const cached = locationCache.get(cleanIp);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.location;
    }

    // ip-api.com dan so'rash (HTTP, bepul)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 soniya timeout

    const response = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,country,countryCode`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json() as IpApiResponse;

    if (data.status !== 'success' || !data.city) {
      return null;
    }

    // "Samarqand, O'zbekiston" formatida
    const location = `${data.city}, ${data.country}`;

    // Cache ga saqlash
    locationCache.set(cleanIp, {
      location,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Eskirgan cache yozuvlarini tozalash (har 100-chi so'rovda)
    if (locationCache.size > 100) {
      const now = Date.now();
      for (const [key, val] of locationCache) {
        if (val.expiresAt < now) locationCache.delete(key);
      }
    }

    return location;
  } catch {
    // Xatolik bo'lsa, login jarayonini bloklamaslik uchun null qaytaramiz
    return null;
  }
}
