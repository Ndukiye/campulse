import { supabase } from '../lib/supabase';
import { releasePaystackPayout } from './paystackService';
import Constants from 'expo-constants';

export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export type SaleSummary = {
  id: string;
  productId: string | null;
  productTitle: string;
  price: number | null;
  amount: number | null;
  buyerId: string | null;
  buyerName: string;
  status: TransactionStatus;
  createdAt: string | null;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
};

export type PurchaseSummary = {
  id: string;
  productId: string | null;
  productTitle: string;
  price: number | null;
  amount: number | null;
  sellerId: string | null;
  sellerName: string;
  status: TransactionStatus;
  createdAt: string | null;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
};

export async function countCompletedTransactionsBySeller(sellerId: string) {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { head: true, count: 'exact' })
    .eq('seller_id', sellerId)
    .eq('status', 'completed');

  return {
    count: count ?? 0,
    error: error ? error.message : null,
  };
}

export async function countCompletedTransactionsByBuyer(buyerId: string) {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { head: true, count: 'exact' })
    .eq('buyer_id', buyerId)
    .eq('status', 'completed');

  return {
    count: count ?? 0,
    error: error ? error.message : null,
  };
}

export async function getSalesBySeller(sellerId: string, limit = 20) {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
        id,
        amount,
        status,
        created_at,
        buyer_confirmed,
        seller_confirmed,
        product:product_id (
          id,
          title,
          price,
          images
        ),
        buyer:buyer_id (
          id,
          name,
          email
        )
      `
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const mapped: SaleSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      productId: row.product?.id ?? null,
      productTitle: row.product?.title ?? 'Untitled product',
      price:
        row.product?.price !== null && row.product?.price !== undefined
          ? Number(row.product.price)
          : null,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
      buyerId: row.buyer?.id ?? null,
      buyerName: row.buyer?.name ?? row.buyer?.email ?? 'Buyer',
      status: row.status as TransactionStatus,
      createdAt: row.created_at ?? null,
      buyerConfirmed: !!row.buyer_confirmed,
      sellerConfirmed: !!row.seller_confirmed,
    })) ?? [];

  return {
    data: mapped,
    error: error ? error.message : null,
  };
}

export async function getPurchasesByBuyer(buyerId: string, limit = 20) {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
        id,
        amount,
        status,
        created_at,
        buyer_confirmed,
        seller_confirmed,
        product:product_id (
          id,
          title,
          price,
          images
        ),
        seller:seller_id (
          id,
          name,
          email
        )
      `
    )
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const mapped: PurchaseSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      productId: row.product?.id ?? null,
      productTitle: row.product?.title ?? 'Untitled product',
      price:
        row.product?.price !== null && row.product?.price !== undefined
          ? Number(row.product.price)
          : null,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
      sellerId: row.seller?.id ?? null,
      sellerName: row.seller?.name ?? row.seller?.email ?? 'Seller',
      status: row.status as TransactionStatus,
      createdAt: row.created_at ?? null,
      buyerConfirmed: !!row.buyer_confirmed,
      sellerConfirmed: !!row.seller_confirmed,
    })) ?? [];

  return {
    data: mapped,
    error: error ? error.message : null,
  };
}

export async function confirmBuyerReceived(transactionId: string) {
  const apiBase =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim()
  const fnBase =
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  const bases = [apiBase, fnBase].filter(Boolean) as string[]
  if (bases.length === 0) return { data: null, error: 'Missing API base URL' }
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id
  if (!userId) return { data: null, error: 'Not signed in' }
  let lastErr = ''
  for (const b of bases) {
    try {
      const res = await fetch(`${b.replace(/\/+$/,'')}/api/confirm-buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, user_id: userId }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        lastErr = t || `Confirm failed: ${res.status}`
        continue
      }
      const json = await res.json()
      const row = json?.transaction
      if (row?.buyer_confirmed && row?.seller_confirmed) {
        await releasePaystackPayout(transactionId)
      }
      return { data: row, error: null }
    } catch (e: any) {
      lastErr = e?.message || 'Network error'
    }
  }
  return { data: null, error: lastErr || 'Confirm failed' }
}

export async function confirmSellerDelivered(transactionId: string) {
  const apiBase =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? '').trim()
  const fnBase =
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim() ||
    (Constants?.expoConfig?.extra?.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  const bases = [apiBase, fnBase].filter(Boolean) as string[]
  if (bases.length === 0) return { data: null, error: 'Missing API base URL' }
  const user = await supabase.auth.getUser()
  const userId = user.data.user?.id
  if (!userId) return { data: null, error: 'Not signed in' }
  let lastErr = ''
  for (const b of bases) {
    try {
      const res = await fetch(`${b.replace(/\/+$/,'')}/api/confirm-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, user_id: userId }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        lastErr = t || `Confirm failed: ${res.status}`
        continue
      }
      const json = await res.json()
      const row = json?.transaction
      if (row?.buyer_confirmed && row?.seller_confirmed) {
        await releasePaystackPayout(transactionId)
      }
      return { data: row, error: null }
    } catch (e: any) {
      lastErr = e?.message || 'Network error'
    }
  }
  return { data: null, error: lastErr || 'Confirm failed' }
}
