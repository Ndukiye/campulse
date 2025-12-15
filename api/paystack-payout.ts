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
  const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim()
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!secret || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env' }), { status: 500, headers: cors })
  }
  try {
    const body = await req.json() as { transaction_id: string }
    const txId = (body?.transaction_id || '').trim()
    if (!txId) return new Response(JSON.stringify({ error: 'Missing transaction_id' }), { status: 400, headers: cors })
    const txRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}&select=id,buyer_id,seller_id,amount`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    })
    if (!txRes.ok) {
      const t = await txRes.text()
      return new Response(JSON.stringify({ error: t || `Fetch transaction failed: ${txRes.status}` }), { status: 400, headers: cors })
    }
    const txRows = await txRes.json() as Array<{ id: string, buyer_id: string, seller_id: string, amount: number }>
    const tx = txRows?.[0]
    if (!tx) return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: cors })
    const sellerId = tx.seller_id
    const amountNgn = Number(tx.amount ?? 0)
    if (!sellerId || !amountNgn || amountNgn <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid transaction data' }), { status: 400, headers: cors })
    }
    const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${sellerId}&select=id,email,paystack_recipient_code`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    })
    if (!profRes.ok) {
      const t = await profRes.text()
      return new Response(JSON.stringify({ error: t || `Fetch profile failed: ${profRes.status}` }), { status: 400, headers: cors })
    }
    const profRows = await profRes.json() as Array<{ id: string, email: string, paystack_recipient_code?: string | null }>
    const seller = profRows?.[0]
    const recipientCode = seller?.paystack_recipient_code || ''
    if (!recipientCode) {
      return new Response(JSON.stringify({ error: 'Seller recipient not set' }), { status: 400, headers: cors })
    }
    const platformFee = Math.round(amountNgn * 0.03 * 100)
    const amountKobo = Math.round(amountNgn * 100) - platformFee
    if (amountKobo <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payout amount' }), { status: 400, headers: cors })
    }
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountKobo,
        recipient: recipientCode,
        reason: `CamPulse order ${txId}`,
      })
    })
    const transferJson = await transferRes.json()
    if (!transferRes.ok) {
      return new Response(JSON.stringify({ error: transferJson?.message || 'Payout failed' }), { status: 400, headers: cors })
    }
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/transactions?id=eq.${txId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        status: 'completed',
        platform_fee: platformFee / 100,
        payment_fee: 0,
        released_at: new Date().toISOString(),
      }),
    })
    if (!updateRes.ok) {
      const t = await updateRes.text()
      return new Response(JSON.stringify({ error: t || `Update failed: ${updateRes.status}` }), { status: 400, headers: cors })
    }
    const updated = await updateRes.json()
    return new Response(JSON.stringify({ ok: true, transfer: transferJson, transaction: updated }), { status: 200, headers: cors })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: cors })
  }
}
