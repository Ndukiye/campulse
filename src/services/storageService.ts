import { supabase } from '../lib/supabase'
import { Platform } from 'react-native'

function inferExtension(uri: string) {
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)
  const ext = match?.[1]?.toLowerCase()
  switch (ext) {
    case 'jpeg':
    case 'jpg':
      return { ext: 'jpg', mime: 'image/jpeg' }
    case 'png':
      return { ext: 'png', mime: 'image/png' }
    case 'webp':
      return { ext: 'webp', mime: 'image/webp' }
    case 'heic':
      return { ext: 'heic', mime: 'image/heic' }
    default:
      return { ext: 'jpg', mime: 'image/jpeg' }
  }
}

export async function uploadProductImage(uri: string, sellerId: string) {
  try {
    const response = await fetch(uri)
    const buffer = await response.arrayBuffer()
    const { ext, mime } = inferExtension(uri)
    const fileName = `${sellerId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: mime,
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
  let hadError = false
  for (const u of uris) {
    if (isRemoteUrl(u)) {
      out.push(u)
    } else {
      const up = await uploadProductImage(u, sellerId)
      if (up.error) {
        hadError = true
        continue
      }
      if (up.url) out.push(up.url)
    }
  }
  return { urls: out, error: hadError ? 'Some images failed to upload' : null }
}

export async function uploadAvatarImage(uri: string, userId: string) {
  try {
    const response = await fetch(uri)
    const buffer = await response.arrayBuffer()
    const { ext, mime } = inferExtension(uri)
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: mime,
        upsert: true,
      })

    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName)

    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e?.message || 'Failed to upload avatar' }
  }
}

export async function uploadChatAttachment(uri: string, userId: string) {
  try {
    const response = await fetch(uri)
    const buffer = await response.arrayBuffer()
    const { ext, mime } = inferExtension(uri)
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    // Preferred bucket
    let bucket = 'chat-attachments'
    let uploadRes = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType: mime, upsert: true })
    if ((uploadRes as any)?.error?.message?.includes('not found')) {
      // Fallback if bucket not created yet
      bucket = 'product-images'
      uploadRes = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType: mime, upsert: true })
    }
    if ((uploadRes as any).error) {
      return { url: null, error: (uploadRes as any).error.message }
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return { url: data.publicUrl, error: null }
  } catch (e: any) {
    return { url: null, error: e?.message || 'Failed to upload attachment' }
  }
}

//
