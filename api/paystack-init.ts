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
  try {
    const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim()
    if (!secret) {
      return new Response(JSON.stringify({ error: 'PAYSTACK_SECRET_KEY not set' }), { status: 500, headers: cors })
    }
    const body = await req.json() as {
      amount: number
      email: string
      callback_url?: string
      metadata?: Record<string, unknown>
    }
    if (!body?.amount || !body?.email) {
      return new Response(JSON.stringify({ error: 'Missing amount or email' }), { status: 400, headers: cors })
    }
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        email: body.email,
        callback_url: body.callback_url,
        metadata: body.metadata ?? {},
      }),
    })
    const initJson = await initRes.json()
    if (!initRes.ok) {
      return new Response(JSON.stringify({ error: initJson?.message || 'Paystack init failed' }), { status: 400, headers: cors })
    }
    const data = initJson?.data
    return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json', ...cors }, status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: cors })
  }
}
