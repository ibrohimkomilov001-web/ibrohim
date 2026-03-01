/**
 * Eskiz API Debug Test
 * Turli auth usullarini sinash
 */

import 'dotenv/config';

const ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api';
const EMAIL = process.env.ESKIZ_EMAIL!;
const PASSWORD = process.env.ESKIZ_PASSWORD!;

async function testAuth() {
  console.log('='.repeat(50));
  console.log('  Eskiz API Debug Test');
  console.log('='.repeat(50));
  console.log(`\nEmail: "${EMAIL}"`);
  console.log(`Password: "${PASSWORD}"`);
  console.log(`Password length: ${PASSWORD.length}`);
  console.log(`Password chars:`, [...PASSWORD].map(c => c.charCodeAt(0)));

  // Test 1: form-urlencoded (standart)
  console.log('\n--- Test 1: form-urlencoded ---');
  try {
    const formData = new URLSearchParams();
    formData.append('email', EMAIL);
    formData.append('password', PASSWORD);

    const res = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (e) {
    console.error('Error:', e);
  }

  // Test 2: JSON body
  console.log('\n--- Test 2: JSON body ---');
  try {
    const res = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (e) {
    console.error('Error:', e);
  }

  // Test 3: multipart/form-data
  console.log('\n--- Test 3: FormData (multipart) ---');
  try {
    const form = new FormData();
    form.append('email', EMAIL);
    form.append('password', PASSWORD);

    const res = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
      method: 'POST',
      body: form,
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (e) {
    console.error('Error:', e);
  }

  // Test 4: API status
  console.log('\n--- Test 4: API status check ---');
  try {
    const res = await fetch(`${ESKIZ_BASE_URL}/auth/status`, {
      method: 'GET',
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (e) {
    console.error('Error:', e);
  }
}

testAuth();
