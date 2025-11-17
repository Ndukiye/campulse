import { supabase } from '../lib/supabase'
import { Platform } from 'react-native'

export async function uploadProductImage(uri: string, sellerId: string) {
  try {
    const blob = await (await fetch(uri)).blob()
    const ext = blob.type?.split('/')[1] || 'jpg'
    const fileName = `${sellerId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    const { data } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(fileName)

    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e?.message || 'Failed to upload image' }
  }
}

export function isRemoteUrl(u?: string | null) {
  if (!u) return false
  return /^https?:\/\//i.test(u)
}

export async function ensureRemoteImageUrls(uris: string[], sellerId: string) {
  const out: string[] = []
  for (const u of uris) {
    if (isRemoteUrl(u)) {
      out.push(u)
    } else {
      const up = await uploadProductImage(u, sellerId)
      if (up.error) {
        return { urls: [], error: up.error }
      }
      if (up.url) out.push(up.url)
    }
  }
  return { urls: out, error: null }
}