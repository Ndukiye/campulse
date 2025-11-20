import { supabase } from '../lib/supabase'

export async function isFavorite(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  return {
    data: data ?? null,
    error: error ? error.message : null,
  }
}

export async function addFavorite(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId })
    .select('id')
    .single()

  return {
    data: data ?? null,
    error: error ? error.message : null,
  }
}

export async function removeFavorite(userId: string, productId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  return {
    error: error ? error.message : null,
  }
}

export async function getFavoritesByUser(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
        id,
        created_at,
        product:product_id (
          id,
          title,
          description,
          price,
          images,
          created_at,
          condition,
          category
        )
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: (data ?? []).map((row: any) => row.product).filter(Boolean),
    error: error ? error.message : null,
  }
}