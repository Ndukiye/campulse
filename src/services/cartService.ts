import { supabase } from '../lib/supabase'

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const { data: existing, error: selErr } = await supabase
    .from('cart_items')
    .select('id,quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .limit(1)
  if (selErr) return { error: selErr.message }
  const row = (existing ?? [])[0]
  if (row) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: (row.quantity ?? 1) + quantity })
      .eq('id', row.id)
    return { error: error ? error.message : null }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert([{ user_id: userId, product_id: productId, quantity }])
    return { error: error ? error.message : null }
  }
}

export async function listCartItems(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:product_id (
        id,
        title,
        price,
        images,
        available_quantity,
        seller_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error: error ? error.message : null }
}

export async function removeFromCart(userId: string, productId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  return { error: error ? error.message : null }
}

export async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
  return { error: error ? error.message : null }
}

export async function getCartCount(userId: string) {
  const { count, error } = await supabase
    .from('cart_items')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)
  return { count: count ?? 0, error: error ? error.message : null }
}
