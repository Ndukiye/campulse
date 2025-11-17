import { supabase } from '../lib/supabase';
import type { ProductsInsert, ProductsRow, ProductsUpdate } from '../types/database';

export type ProductSummary = {
  id: string;
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
    .select('id,title,description,price,images,created_at,condition,category')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const mapped: ProductSummary[] =
    data?.map((row: any) => ({
      id: row.id,
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
    .select('id,title,description,price,images,created_at,condition,category')
    .single();

  return {
    data: data
      ? {
          id: data.id,
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
    .select('id,title,description,price,images,created_at,condition,category')
    .single();

  return {
    data: data
      ? {
          id: data.id,
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
