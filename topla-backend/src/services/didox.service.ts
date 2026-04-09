/**
 * Didox E-Contract Service
 *
 * Didox API integratsiya — vendor onboarding uchun shartnoma yuborish va holat tekshirish.
 * API docs: https://api.didox.uz/docs
 */

import { env } from '../config/env.js';

export interface DidoxContractParams {
  /** Vendor kompaniya INN */
  vendorTin: string;
  /** Vendor kompaniya nomi */
  vendorName: string;
  /** Vendor email (shartnoma yuborish uchun) */
  vendorEmail?: string;
  /** Do'kon nomi */
  shopName: string;
  /** Komissiya foizi */
  commissionRate: number;
}

export interface DidoxContractResult {
  contractId: string;
  contractUrl: string;
  status: string;
}

export interface DidoxContractStatus {
  contractId: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'cancelled';
  signedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

function getHeaders(): Record<string, string> {
  if (!env.DIDOX_API_TOKEN) {
    throw new Error('DIDOX_API_TOKEN sozlanmagan');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.DIDOX_API_TOKEN}`,
  };
}

function getBaseUrl(): string {
  return env.DIDOX_API_URL;
}

/**
 * Didox orqali yangi shartnoma yaratish va yuborish
 */
export async function createAndSendContract(
  params: DidoxContractParams,
): Promise<DidoxContractResult> {
  const baseUrl = getBaseUrl();

  // 1. Shartnoma yaratish
  const createRes = await fetch(`${baseUrl}/v1/contracts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'service',
      seller_tin: env.DIDOX_COMPANY_TIN,
      buyer_tin: params.vendorTin,
      buyer_name: params.vendorName,
      contract_date: new Date().toISOString().split('T')[0],
      items: [
        {
          name: `Topla.uz marketplace xizmatlari — ${params.shopName}`,
          description: `${params.shopName} do'koni uchun marketplace xizmatlari shartnomasi. Komissiya: ${params.commissionRate}%`,
          quantity: 1,
          price: 0,
          unit: 'xizmat',
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Didox shartnoma yaratishda xato: ${createRes.status} — ${err}`);
  }

  const contract = (await createRes.json()) as { id: string; view_url: string; status: string };

  // 2. Shartnomani yuborish
  const sendRes = await fetch(`${baseUrl}/v1/contracts/${contract.id}/send`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      buyer_email: params.vendorEmail,
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    throw new Error(`Didox shartnoma yuborishda xato: ${sendRes.status} — ${err}`);
  }

  return {
    contractId: contract.id,
    contractUrl: contract.view_url,
    status: 'sent',
  };
}

/**
 * Shartnoma holatini tekshirish
 */
export async function getContractStatus(contractId: string): Promise<DidoxContractStatus> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/v1/contracts/${contractId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Didox shartnoma holatini olishda xato: ${res.status} — ${err}`);
  }

  const data = (await res.json()) as {
    id: string;
    status: string;
    signed_at?: string;
    rejected_at?: string;
    reject_reason?: string;
  };

  return {
    contractId: data.id,
    status: data.status as DidoxContractStatus['status'],
    signedAt: data.signed_at,
    rejectedAt: data.rejected_at,
    rejectReason: data.reject_reason,
  };
}

/**
 * Didox API sozlanganligini tekshirish
 */
export function isDidoxConfigured(): boolean {
  return !!(env.DIDOX_API_TOKEN && env.DIDOX_COMPANY_TIN);
}
