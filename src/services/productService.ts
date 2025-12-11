import { supabase } from '../lib/supabase';
import type { ProductsInsert, ProductsRow, ProductsUpdate } from '../types/database';

export type ProductSummary = {
  id: string;
  seller_id?: string;
  title: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  created_at: string | null;
  condition: ProductsRow['condition'] | null;
  category: string | null;
};

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
  const { data, error } = await supabase
    .from('products')
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
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
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
    .eq('seller_id', sellerId)
    .order(
      sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? 'price' : 'created_at',
      { ascending: sortBy === 'price_asc' ? true : sortBy === 'newest' ? false : false }
    )
    .range(from, to);

  if (searchQuery && searchQuery.trim().length > 0) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
      images: (row.images as string[] | null) ?? null,
      created_at: row.created_at ?? null,
      condition: (row.condition ?? null) as ProductsRow['condition'] | null,
      category: row.category ?? null,
    })) ?? [];
  return { data: mapped, error: error ? error.message : null };
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
    .eq('id', id)
    .maybeSingle();

  return {
    data:
      data
        ? {
            id: data.id,
            seller_id: data.seller_id ?? undefined,
            title: data.title,
            description: data.description ?? null,
            price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
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
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
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

  const { data, error } = await query;

  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
      seller_id: row.seller_id ?? undefined,
      title: row.title,
      description: row.description ?? null,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
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
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
    .single();

  return {
    data: data
      ? {
          id: data.id,
          seller_id: data.seller_id ?? undefined,
          title: data.title,
          description: data.description ?? null,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
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
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', payload.id)
    .eq('seller_id', sellerId)
    .select('id,seller_id,title,description,price,images,created_at,condition,category')
    .single();

  return {
    data: data
      ? {
          id: data.id,
          seller_id: data.seller_id ?? undefined,
          title: data.title,
          description: data.description ?? null,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
          images: (data.images as string[] | null) ?? null,
          created_at: data.created_at ?? null,
          condition: (data.condition ?? null) as ProductsRow['condition'] | null,
          category: data.category ?? null,
        }
      : null,
    error: error ? error.message : null,
  };
}
