import { Platform } from 'react-native'
import Constants from 'expo-constants'

const FALLBACK_BANKS: Array<{ name: string, code: string }> = [
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Union Bank', code: '032' },
  { name: 'Wema Bank', code: '035' },
  { name: 'FCMB', code: '214' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'SunTrust Bank', code: '100' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Citibank Nigeria', code: '023' },
]

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

export async function listPaystackBanks() {
  const baseUrl =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim()
  if (!baseUrl) return { error: 'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL.', data: [] }
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/,'')}/api/paystack-banks`)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { error: text || `Fetch banks failed: ${res.status}`, data: [] }
    }
    const json = await res.json()
    const raw = (json?.data ?? []) as Array<{ name: string, code: string }>
    const seen = new Set<string>()
    const deduped: Array<{ name: string, code: string }> = []
    for (const b of raw) {
      const code = (b.code ?? '').trim()
      if (!code || seen.has(code)) continue
      seen.add(code)
      deduped.push({ name: b.name, code })
    }
    if (deduped.length < 20) {
      for (const fb of FALLBACK_BANKS) {
        const c = fb.code.trim()
        if (!c || seen.has(c)) continue
        seen.add(c)
        deduped.push({ name: fb.name, code: c })
      }
    }
    deduped.sort((a, b) => a.name.localeCompare(b.name))
    return { error: null, data: deduped }
  } catch (e: any) {
    return { error: e?.message || 'Network error fetching banks', data: [] }
  }
}
