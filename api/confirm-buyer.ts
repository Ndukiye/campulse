export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })
  }
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase env not set' }), { status: 500, headers: cors })
  }
  try {
    const body = await req.json() as { transaction_id: string, user_id: string }
    const txId = (body?.transaction_id || '').trim()
    const userId = (body?.user_id || '').trim()
    if (!txId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing transaction_id or user_id' }), { status: 400, headers: cors })
    }
    // Verify transaction and that the caller is the buyer
    const getRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}&select=id,buyer_id,seller_confirmed,buyer_confirmed,status`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    })
    if (!getRes.ok) {
      const t = await getRes.text()
      return new Response(JSON.stringify({ error: t || `Fetch transaction failed: ${getRes.status}` }), { status: 400, headers: cors })
    }
    const rows = await getRes.json() as Array<{ id: string, buyer_id: string, seller_confirmed: boolean, buyer_confirmed: boolean, status: string }>
    const tx = rows?.[0]
    if (!tx) return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: cors })
    if (tx.buyer_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not authorized for this transaction' }), { status: 403, headers: cors })
    }
    if (tx.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Invalid status ${tx.status}` }), { status: 400, headers: cors })
    }
    // Update buyer_confirmed
    const updRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ buyer_confirmed: true }),
    })
    if (!updRes.ok) {
      const t = await updRes.text()
      return new Response(JSON.stringify({ error: t || `Update failed: ${updRes.status}` }), { status: 400, headers: cors })
    }
    const updated = (await updRes.json()) as any[]
    const row = updated?.[0] ?? null
    return new Response(JSON.stringify({ ok: true, transaction: row }), { status: 200, headers: cors })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: cors })
  }
}
