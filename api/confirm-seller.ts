export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not set' }), { status: 500 })
  }
  try {
    const body = await req.json() as { transaction_id: string, user_id: string }
    const txId = (body?.transaction_id || '').trim()
    const userId = (body?.user_id || '').trim()
    if (!txId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing transaction_id or user_id' }), { status: 400 })
    }
    const getRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}&select=id,seller_id,seller_confirmed,buyer_confirmed,status`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    })
    if (!getRes.ok) {
      const t = await getRes.text()
      return new Response(JSON.stringify({ error: t || `Fetch transaction failed: ${getRes.status}` }), { status: 400 })
    }
    const rows = await getRes.json() as Array<{ id: string, seller_id: string, seller_confirmed: boolean, buyer_confirmed: boolean, status: string }>
    const tx = rows?.[0]
    if (!tx) return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 })
    if (tx.seller_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not authorized for this transaction' }), { status: 403 })
    }
    if (tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Invalid status ${tx.status}` }), { status: 400 })
    }
    const updRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ seller_confirmed: true }),
    })
    if (!updRes.ok) {
      const t = await updRes.text()
      return new Response(JSON.stringify({ error: t || `Update failed: ${updRes.status}` }), { status: 400 })
    }
    const updated = (await updRes.json()) as any[]
    const row = updated?.[0] ?? null
    return new Response(JSON.stringify({ ok: true, transaction: row }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500 })
  }
}
