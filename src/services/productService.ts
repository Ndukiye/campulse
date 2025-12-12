import { supabase } from '../lib/supabase';
import type { ProductsInsert, ProductsRow, ProductsUpdate } from '../types/database';

export type ProductSummary = {
  id: string;
  seller_id?: string;
  title: string;
  description: string | null;
  price: number | null;
  available_quantity: number | null;
  images: string[] | null;
  created_at: string | null;
  condition: ProductsRow['condition'] | null;
  category: string | null;
};

function missingQtyColumn(err?: string | null) {
  if (!err) return false
  const e = String(err)
  return /available_quantity/i.test(e) && /(does not exist|undefined column|not found)/i.test(e)
}

export async function countProductsBySeller(sellerId: string) {
  const { count, error } = await supabase
    .from('products')
    .select('id', { head: true, count: 'exact' })
    .eq('seller_id', sellerId);

  return {
    count: count ?? 0,
    error: error ? error.message : null,
  };
}

export async function getProductsBySeller(sellerId: string, limit = 12) {
  const res = await supabase
    .from('products')
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  let data: any = res.data
  let error = res.error
  if (missingQtyColumn(error ? error.message : null)) {
    const r = await supabase
      .from('products')
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    data = r.data
    error = r.error
  }

  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
      available_quantity: row.available_quantity !== null && row.available_quantity !== undefined ? Number(row.available_quantity) : null,
      images: (row.images as string[] | null) ?? null,
      created_at: row.created_at ?? null,
      condition: (row.condition ?? null) as ProductsRow['condition'] | null,
      category: row.category ?? null,
    })) ?? [];

  return {
    data: mapped,
    error: error ? error.message : null,
  };
}

export type SellerProductsFilters = {
  sellerId: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
};

export async function searchSellerProducts(filters: SellerProductsFilters) {
  const { sellerId, searchQuery, page = 0, pageSize = 24, sortBy = 'newest' } = filters;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .eq('seller_id', sellerId)
    .order(
      sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? 'price' : 'created_at',
      { ascending: sortBy === 'price_asc' ? true : sortBy === 'newest' ? false : false }
    )
    .range(from, to);

  if (searchQuery && searchQuery.trim().length > 0) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const res = await query
  let data: any = res.data
  let error = res.error
  if (missingQtyColumn(error ? error.message : null)) {
    const q2 = supabase
      .from('products')
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .eq('seller_id', sellerId)
      .order(
        sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? 'price' : 'created_at',
        { ascending: sortBy === 'price_asc' ? true : sortBy === 'newest' ? false : false }
      )
      .range(from, to)
    if (searchQuery && searchQuery.trim().length > 0) {
      q2.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }
    const r2 = await q2
    data = r2.data
    error = r2.error
  }
  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
      available_quantity: row.available_quantity !== null && row.available_quantity !== undefined ? Number(row.available_quantity) : null,
      images: (row.images as string[] | null) ?? null,
      created_at: row.created_at ?? null,
      condition: (row.condition ?? null) as ProductsRow['condition'] | null,
      category: row.category ?? null,
    })) ?? [];
  return { data: mapped, error: error ? error.message : null };
}

export async function getProductById(id: string) {
  const res = await supabase
    .from('products')
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .eq('id', id)
    .maybeSingle();
  let data: any = res.data
  let error = res.error
  if (missingQtyColumn(error ? error.message : null)) {
    const r2 = await supabase
      .from('products')
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .eq('id', id)
      .maybeSingle()
    data = r2.data
    error = r2.error
  }

  return {
    data:
    data
      ? {
          id: data.id,
          seller_id: data.seller_id ?? undefined,
          title: data.title,
          description: data.description ?? null,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
          available_quantity: data.available_quantity !== null && data.available_quantity !== undefined ? Number(data.available_quantity) : null,
          images: (data.images as string[] | null) ?? null,
          created_at: data.created_at ?? null,
          condition: (data.condition ?? null) as ProductsRow['condition'] | null,
          category: data.category ?? null,
        }
      : null,
    error: error ? error.message : null,
  };
}

export type ProductSearchFilters = {
  category?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductsRow['condition'] | 'all';
  limit?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
};

export async function searchProducts(filters: ProductSearchFilters) {
  const {
    category,
    searchQuery,
    minPrice,
    maxPrice,
    condition = 'all',
    limit = 24,
    sortBy = 'newest',
    page = 0,
    pageSize,
  } = filters;

  const effectiveLimit = pageSize ?? limit;
  const from = page * effectiveLimit;
  const to = from + effectiveLimit - 1;

  let query = supabase
    .from('products')
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .order(
      sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? 'price' : 'created_at',
      { ascending: sortBy === 'price_asc' ? true : sortBy === 'newest' ? false : false }
    )
    .range(from, to);

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  if (searchQuery && searchQuery.trim().length > 0) {
    // Search in title or description
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }
  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }
  if (maxPrice !== undefined && maxPrice > 0) {
    query = query.lte('price', maxPrice);
  }
  if (condition && condition !== 'all') {
    query = query.eq('condition', condition);
  }

  const res = await query
  let data: any = res.data
  let error = res.error
  if (missingQtyColumn(error ? error.message : null)) {
    let q2 = supabase
      .from('products')
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .order(
        sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? 'price' : 'created_at',
        { ascending: sortBy === 'price_asc' ? true : sortBy === 'newest' ? false : false }
      )
      .range(from, to)
    if (category && category !== 'All') q2 = q2.eq('category', category)
    if (searchQuery && searchQuery.trim().length > 0) q2 = q2.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    if (minPrice !== undefined) q2 = q2.gte('price', minPrice)
    if (maxPrice !== undefined && maxPrice > 0) q2 = q2.lte('price', maxPrice)
    if (condition && condition !== 'all') q2 = q2.eq('condition', condition)
    const r2 = await q2
    data = r2.data
    error = r2.error
  }

  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
      available_quantity: row.available_quantity !== null && row.available_quantity !== undefined ? Number(row.available_quantity) : null,
      images: (row.images as string[] | null) ?? null,
      created_at: row.created_at ?? null,
      condition: (row.condition ?? null) as ProductsRow['condition'] | null,
      category: row.category ?? null,
    })) ?? [];

  return {
    data: mapped,
    error: error ? error.message : null,
  };
}

export async function createProduct(payload: ProductsInsert) {
  const normalized: any = { ...payload }
  if (normalized.available_quantity !== undefined && normalized.available_quantity !== null) {
    normalized.available_quantity = Math.floor(Number(normalized.available_quantity))
  }
  const res = await supabase
    .from('products')
    .insert(normalized)
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .single();
  let data: any = res.data
  let error = res.error
  if (missingQtyColumn(error ? error.message : null)) {
    const { available_quantity, ...rest } = normalized as any
    const r2 = await supabase
      .from('products')
      .insert(rest)
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .single()
    data = r2.data
    error = r2.error ?? { message: 'Stock quantity not saved: missing available_quantity column' } as any
  }

  return {
    data: data
      ? {
          id: data.id,
          seller_id: data.seller_id ?? undefined,
          title: data.title,
          description: data.description ?? null,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
          available_quantity: data.available_quantity !== null && data.available_quantity !== undefined ? Number(data.available_quantity) : null,
          images: (data.images as string[] | null) ?? null,
          created_at: data.created_at ?? null,
          condition: (data.condition ?? null) as ProductsRow['condition'] | null,
          category: data.category ?? null,
        }
      : null,
    error: error ? error.message : null,
  };
}

export async function deleteProduct(productId: string, sellerId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', sellerId);

  return {
    error: error ? error.message : null,
  };
}

export async function updateProduct(payload: ProductsUpdate, sellerId: string) {
  const normalized: any = { ...payload }
  if (normalized.available_quantity !== undefined && normalized.available_quantity !== null) {
    normalized.available_quantity = Math.floor(Number(normalized.available_quantity))
  }
  console.log('[productService] update request', { payload: normalized, sellerId })
  const res = await supabase
    .from('products')
    .update(normalized)
    .eq('id', payload.id)
    .eq('seller_id', sellerId)
    .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
    .single();
  let data: any = res.data
  let error = res.error
  console.log('[productService] update response', { error: error ? error.message : null, data })
  if (missingQtyColumn(error ? error.message : null)) {
    const { available_quantity, ...rest } = normalized as any
    const r2 = await supabase
      .from('products')
      .update(rest)
      .eq('id', payload.id)
      .eq('seller_id', sellerId)
      .select('id,seller_id,title,description,price,images,created_at,condition,category')
      .single()
    data = r2.data
    error = r2.error ?? { message: 'Stock quantity not saved: missing available_quantity column' } as any
    console.log('[productService] update fallback response', { error: error ? (error as any).message ?? String(error) : null, data })
  }
  if (!error && normalized.available_quantity !== undefined && normalized.available_quantity !== null) {
    const desired = Number(normalized.available_quantity)
    const current = data?.available_quantity !== undefined && data?.available_quantity !== null ? Number(data.available_quantity) : null
    if (current === null || current !== desired) {
      const r3 = await supabase
        .from('products')
        .update({ available_quantity: desired })
        .eq('id', payload.id)
        .eq('seller_id', sellerId)
        .select('id,seller_id,title,description,price,available_quantity,images,created_at,condition,category')
        .single()
      data = r3.data ?? data
      error = r3.error ?? error
      console.log('[productService] update quantity-only response', { error: r3.error ? r3.error.message : null, data: r3.data })
    }
  }

  return {
    data: data
      ? {
          id: data.id,
          seller_id: data.seller_id ?? undefined,
          title: data.title,
          description: data.description ?? null,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
          available_quantity: data.available_quantity !== null && data.available_quantity !== undefined ? Number(data.available_quantity) : null,
          images: (data.images as string[] | null) ?? null,
          created_at: data.created_at ?? null,
          condition: (data.condition ?? null) as ProductsRow['condition'] | null,
          category: data.category ?? null,
        }
      : null,
    error: error ? error.message : null,
  };
}
