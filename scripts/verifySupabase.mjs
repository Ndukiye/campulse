import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

async function tryQuery(name, fn) {
  try {
    const res = await fn()
    if (res.error) {
      console.log(JSON.stringify({ name, ok: false, error: res.error.message }, null, 2))
    } else {
      console.log(JSON.stringify({ name, ok: true, data: res.data ?? null }, null, 2))
    }
  } catch (e) {
    console.log(JSON.stringify({ name, ok: false, error: e?.message || String(e) }, null, 2))
  }
}

async function main() {
  console.log('--- Storage buckets ---')
  await tryQuery('storage:list avatars root', () => supabase.storage.from('avatars').list(''))
  await tryQuery('storage:list product-images root', () => supabase.storage.from('product-images').list(''))

  console.log('--- Tables & fields ---')
  await tryQuery('profiles:basic fields', () =>
    supabase.from('profiles').select('id,email,name,avatar_url,phone,location,bio,verified,created_at').limit(1)
  )
  await tryQuery('profiles:extra fields', () =>
    supabase.from('profiles').select('verification_status,rating,total_reviews,matric_number,nin_document_url').limit(1)
  )
  await tryQuery('products:basic fields', () =>
    supabase.from('products').select('id,title,description,price,category,condition,seller_id,images,created_at').limit(1)
  )
  await tryQuery('favorites:exists', () => supabase.from('favorites').select('id').limit(1))
  await tryQuery('transactions:exists', () => supabase.from('transactions').select('id').limit(1))
  await tryQuery('messages:columns', () =>
    supabase.from('messages').select('id,conversation_id,sender_id,content,read,created_at').limit(1)
  )
  await tryQuery('conversations:participant_1_2', () =>
    supabase.from('conversations').select('id,participant_1,participant_2,product_id,created_at').limit(1)
  )
  await tryQuery('conversations:participant_a_b', () =>
    supabase.from('conversations').select('id,participant_a,participant_b').limit(1)
  )

  console.log('--- Notes ---')
  console.log(
    'Write operations (uploads/inserts) require authentication; this script uses anon key for read-only verification.'
  )
}

main()