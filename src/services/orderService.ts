import { supabase } from '../lib/supabase'

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

export async function checkoutSingle(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id,price,seller_id')
    .eq('id', productId)
    .limit(1)
  if (error) return { error: error.message }
  const row = (data ?? [])[0]
  if (!row?.seller_id) return { error: 'Product unavailable' }

  const { error: txErr } = await supabase
    .from('transactions')
    .insert([{
      buyer_id: userId,
      seller_id: row.seller_id,
      product_id: productId,
      amount: Number(row.price ?? 0),
      status: 'pending'
    }])
  if (txErr) return { error: txErr.message }

  return { error: null }
}
