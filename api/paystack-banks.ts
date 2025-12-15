export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors })
  }
  const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim()
  if (!secret) return new Response(JSON.stringify({ error: 'Missing PAYSTACK_SECRET_KEY' }), { status: 500, headers: cors })
  try {
    const res = await fetch('https://api.paystack.co/bank?country=nigeria', {
      headers: {
        'Authorization': `Bearer ${secret}`,
      }
    })
    const json = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: json?.message || 'Failed to fetch banks' }), { status: 400, headers: cors })
    }
    const data = Array.isArray(json?.data) ? json.data : []
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: cors })
  }
}
