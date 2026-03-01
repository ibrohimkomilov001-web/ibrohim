/**
 * SMS Test Script — Eskiz SMS orqali SMS yuborishni sinash
 * 
 * Ishga tushirish: npx tsx test-sms.ts
 */

import 'dotenv/config';

const ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api';
const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
const TEST_PHONE = '998930002505';

async function getToken(): Promise<string> {
  console.log('🔑 Eskiz tokenga ulanilmoqda...');
  console.log(`   Email: ${ESKIZ_EMAIL}`);

  if (!ESKIZ_EMAIL || !ESKIZ_PASSWORD) {
    throw new Error('ESKIZ_EMAIL va ESKIZ_PASSWORD .env da belgilanmagan!');
  }

  const formData = new URLSearchParams();
  formData.append('email', ESKIZ_EMAIL);
  formData.append('password', ESKIZ_PASSWORD);

  const response = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData,
  });

  const text = await response.text();
  console.log(`   Response status: ${response.status}`);

  if (!response.ok) {
    console.error(`❌ Auth xatolik: ${text}`);
    throw new Error(`Eskiz auth xatolik: ${response.status}`);
  }

  const data = JSON.parse(text);
  console.log('✅ Token olindi!');
  return data.data.token;
}

async function sendSms(token: string, phone: string, message: string) {
  console.log(`\n📱 SMS yuborilmoqda: ${phone}`);
  console.log(`   Matn: ${message}`);

  const cleanPhone = phone.replace(/^\+/, '');

  const formData = new URLSearchParams();
  formData.append('mobile_phone', cleanPhone);
  formData.append('message', message);
  formData.append('from', '4546');

  const response = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const text = await response.text();
  console.log(`   Response status: ${response.status}`);
  console.log(`   Response body: ${text}`);

  if (!response.ok) {
    console.error(`❌ SMS yuborishda xatolik: ${text}`);
    return;
  }

  try {
    const data = JSON.parse(text);
    console.log('\n✅ SMS muvaffaqiyatli yuborildi!');
    console.log('   Javob:', JSON.stringify(data, null, 2));
  } catch {
    console.log('✅ Javob (text):', text);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('  TOPLA SMS Test — Eskiz.uz');
  console.log('='.repeat(50));
  console.log();

  try {
    // 1. Token olish
    const token = await getToken();

    // 2. TEST REJIMDA faqat ruxsat etilgan shablonlar:
    //    - "Bu Eskiz dan test"
    //    - "Это тест от Eskiz"
    //    - "This is test from Eskiz"
    const message = 'Bu Eskiz dan test';

    // 3. SMS yuborish
    await sendSms(token, TEST_PHONE, message);

    console.log(`\n📞 Telefon: ${TEST_PHONE}`);
    console.log('\n⏳ Telefoningizga SMS kelishini kuting...');
    console.log('');
    console.log('⚠️  MUHIM: Hozir TEST rejimdasiz.');
    console.log('   OTP kod yuborish uchun Eskiz kabinetida "Shartnoma so\'rash" tugmasini bosing.');
  } catch (error) {
    console.error('\n❌ Xatolik:', error);
  }
}

main();
