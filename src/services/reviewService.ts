import { supabase } from '../lib/supabase'

export async function submitSellerReview(params: { reviewerId: string, reviewedUserId: string, productId?: string | null, rating: number, comment?: string }) {
  const payload = {
    reviewer_id: params.reviewerId,
    reviewed_user_id: params.reviewedUserId,
    product_id: params.productId ?? null,
    rating: params.rating,
    comment: params.comment ?? null,
  }
  const { data, error } = await supabase
    .from('reviews')
    .insert(payload)
    .select('*')
    .maybeSingle()
  return {
    data,
    error: error ? error.message : null,
  }
}

export async function submitProductReview(params: { reviewerId: string, productId: string, rating: number, comment?: string }) {
  const payload = {
    reviewer_id: params.reviewerId,
    product_id: params.productId,
    rating: params.rating,
    comment: params.comment ?? null,
  }
  const { data, error } = await supabase
    .from('product_reviews')
    .insert(payload)
    .select('*')
    .maybeSingle()
  return {
    data,
    error: error ? error.message : null,
  }
}

export async function listProductReviews(productId: string, limit = 20) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer:reviewer_id (
        id,
        name,
        email
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)
  const mapped = (data ?? []).map((r: any) => ({
    id: r.id as string,
    rating: Number(r.rating ?? 0),
    comment: String(r.comment ?? ''),
    created_at: r.created_at as string,
    user: String(r.reviewer?.name ?? r.reviewer?.email ?? 'User'),
  }))
  return {
    data: mapped as Array<{ id: string, rating: number, comment: string, created_at: string, user: string }>,
    error: error ? error.message : null,
  }
}
