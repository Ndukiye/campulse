export const config = { runtime: 'edge' }

async function hmacSha512(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim()
  if (!secret) return new Response(JSON.stringify({ error: 'PAYSTACK_SECRET_KEY not set' }), { status: 500 })

  const raw = await req.text()
  const headerSig = req.headers.get('x-paystack-signature') || ''
  const computed = await hmacSha512(secret, raw)
  if (!headerSig || headerSig !== computed) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }
  const payload = JSON.parse(raw)
  const event = payload?.event
  const data = payload?.data

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not set' }), { status: 500 })
  }

  try {
    if (event === 'charge.success') {
      const txId = data?.metadata?.transaction_id
      const txIds: string[] = Array.isArray(data?.metadata?.cart_tx_ids) ? data.metadata.cart_tx_ids : []
      const buyerId: string | undefined = data?.metadata?.buyer_id
      const reference = data?.reference
      if (reference && (txId || txIds.length > 0)) {
        const idFilter = txIds.length > 0 ? `in.(${txIds.join(',')})` : `eq.${txId}`
        const res = await fetch(`${supabaseUrl}/rest/v1/transactions?id=${idFilter}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ status: 'pending', paystack_reference: reference }),
        })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t || `Supabase update failed: ${res.status}`)
        }
        if (buyerId) {
          const del = await fetch(`${supabaseUrl}/rest/v1/cart_items?user_id=eq.${buyerId}`, {
            method: 'DELETE',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
            },
          })
          if (!del.ok) {
            const t = await del.text()
            throw new Error(t || `Clear cart failed: ${del.status}`)
          }
        }
      }
    }
    // TODO: handle transfer.success/failed for payouts later
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Webhook error' }), { status: 500 })
  }
}
