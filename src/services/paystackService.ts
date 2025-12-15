import { Platform } from 'react-native'
import Constants from 'expo-constants'

type InitPayload = {
  amountKobo: number
  email: string
  transactionId: string
  productId: string
  sellerId: string
  callbackUrl?: string
  metadata?: Record<string, any>
}

type InitResponse = {
  authorization_url: string
  access_code?: string
  reference: string
}

export async function initPaystackTransaction(payload: InitPayload) {
  const baseUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  if (!baseUrl) {
    return { error: 'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL.', data: null }
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/,'')}/api/paystack-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: payload.amountKobo,
        email: payload.email,
        callback_url: payload.callbackUrl,
        metadata: {
          platform: Platform.OS,
          transaction_id: payload.transactionId,
          product_id: payload.productId,
          seller_id: payload.sellerId,
          ...(payload.metadata ?? {}),
        },
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { error: `Paystack init failed: ${text || res.status}`, data: null }
    }
    const json = (await res.json()) as { data: InitResponse }
    return { error: null, data: json.data }
  } catch (e: any) {
    return { error: e?.message || 'Network error initializing Paystack', data: null }
  }
}

export async function releasePaystackPayout(transactionId: string) {
  const baseUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim()
  if (!baseUrl) return { error: 'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL.', data: null }
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/,'')}/api/paystack-payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { error: text || `Payout failed: ${res.status}`, data: null }
    }
    const json = await res.json()
    return { error: null, data: json }
  } catch (e: any) {
    return { error: e?.message || 'Network error releasing payout', data: null }
  }
}

export async function registerPaystackRecipient(params: { userId: string, bankCode: string, accountNumber: string, accountName: string }) {
  const baseUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim()
  if (!baseUrl) return { error: 'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL.', data: null }
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/,'')}/api/paystack-recipient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
        account_name: params.accountName,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { error: text || `Recipient setup failed: ${res.status}`, data: null }
    }
    const json = await res.json()
    return { error: null, data: json }
  } catch (e: any) {
    return { error: e?.message || 'Network error creating recipient', data: null }
  }
}
