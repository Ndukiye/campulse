import { supabase } from '../lib/supabase'
import { initPaystackTransaction } from './paystackService'
import { Linking } from 'react-native'
import { getProfileById } from './profileService'

export async function checkoutCart(userId: string) {
  const { data: items, error: cartErr } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:product_id (
        id,
        title,
        price,
        seller_id
      )
    `)
    .eq('user_id', userId)
  if (cartErr) return { error: cartErr.message }

  const txRows = (items ?? []).flatMap((ci: any) => {
    const qty = Number(ci.quantity ?? 1)
    const price = Number(ci.product?.price ?? 0)
    const amount = qty * price
    if (!ci.product?.id || !ci.product?.seller_id) return []
    return [{
      buyer_id: userId,
      seller_id: ci.product.seller_id,
      product_id: ci.product.id,
      amount,
      status: 'pending'
    }]
  })

  if (txRows.length === 0) return { error: 'No valid items to checkout' }

  const { error: insertErr } = await supabase
    .from('transactions')
    .insert(txRows)
  if (insertErr) return { error: insertErr.message }

  const { error: clearErr } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
  if (clearErr) return { error: clearErr.message }

  return { error: null }
}

export async function checkoutCartPaystack(userId: string) {
  const { data: items, error: cartErr } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:product_id (
        id,
        price,
        seller_id
      )
    `)
    .eq('user_id', userId)
  if (cartErr) return { error: cartErr.message }
  const rows = items ?? []
  if (rows.length === 0) return { error: 'No items to checkout' }
  // Group by seller and create one transaction per seller (satisfies NOT NULL constraint)
  const bySeller: Record<string, any[]> = {}
  for (const ci of rows) {
    const sid = ci.product?.seller_id
    if (!sid) return { error: 'Cart contains items with missing seller' }
    bySeller[sid] = bySeller[sid] || []
    bySeller[sid].push(ci)
  }
  const txRows = Object.entries(bySeller).map(([sid, items]) => {
    const amount = items.reduce((sum: number, ci: any) => {
      const qty = Number(ci.quantity ?? 1)
      const price = Number(ci.product?.price ?? 0)
      return sum + (qty * price)
    }, 0)
    return {
      buyer_id: userId,
      seller_id: sid,
      product_id: null,
      amount,
      status: 'pending_payment'
    }
  })
  const { data: createdMany, error: txErr } = await supabase
    .from('transactions')
    .insert(txRows)
    .select('id,amount')
  if (txErr) return { error: txErr.message }
  const txIds: string[] = (createdMany ?? []).map((r: any) => r.id)
  const subtotal = (createdMany ?? []).reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0)
  const buyerProfile = await getProfileById(userId)
  const buyerEmail = buyerProfile.data?.email || `${userId}@example.com`
  const init = await initPaystackTransaction({
    amountKobo: Math.round(subtotal * 100),
    email: buyerEmail,
    transactionId: txIds[0] ?? '',
    productId: '',
    sellerId: '',
    callbackUrl: undefined,
    metadata: {
      cart_tx_ids: txIds,
      buyer_id: userId,
      items: rows.map((ci: any) => ({
        id: ci.id,
        product_id: ci.product?.id,
        seller_id: ci.product?.seller_id,
        quantity: ci.quantity,
      })),
    }
  })
  if (init.error || !init.data?.authorization_url) {
    return { error: init.error || 'Failed to initialize payment' }
  }
  await supabase
    .from('transactions')
    .update({ paystack_reference: init.data.reference })
    .in('id', txIds)
  try { await Linking.openURL(init.data.authorization_url) } catch {}
  return { error: null }
}

export async function checkoutSingle(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id,price,seller_id')
    .eq('id', productId)
    .limit(1)
  if (error) return { error: error.message }
  const row = (data ?? [])[0]
  if (!row?.seller_id) return { error: 'Product unavailable' }

  const amount = Number(row.price ?? 0)
  const { data: created, error: txErr } = await supabase
    .from('transactions')
    .insert([{
      buyer_id: userId,
      seller_id: row.seller_id,
      product_id: productId,
      amount,
      status: 'pending_payment'
    }])
    .select('id')
    .single()
  if (txErr) return { error: txErr.message }

  const kobo = Math.round(amount * 100)
  const buyerProfile = await getProfileById(userId)
  const buyerEmail = buyerProfile.data?.email || `${userId}@example.com`
  const init = await initPaystackTransaction({
    amountKobo: kobo,
    email: buyerEmail,
    transactionId: created?.id ?? '',
    productId,
    sellerId: row.seller_id,
    callbackUrl: undefined,
    metadata: {},
  })
  if (init.error || !init.data?.authorization_url) {
    return { error: init.error || 'Failed to initialize payment' }
  }

  await supabase
    .from('transactions')
    .update({ paystack_reference: init.data.reference })
    .eq('id', created!.id)

  try { await Linking.openURL(init.data.authorization_url) } catch {}

  return { error: null }
}
