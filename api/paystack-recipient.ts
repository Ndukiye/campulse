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
    const body = await req.json() as { user_id: string, bank_code: string, account_number: string, account_name: string }
    const userId = (body?.user_id || '').trim()
    const bankCode = (body?.bank_code || '').trim()
    const accountNumber = (body?.account_number || '').trim()
    const accountName = (body?.account_name || '').trim()
    if (!userId || !bankCode || !accountNumber || !accountName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: cors })
    }
    const createRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    })
    const createJson = await createRes.json()
    if (!createRes.ok) {
      return new Response(JSON.stringify({ error: createJson?.message || 'Recipient creation failed' }), { status: 400, headers: cors })
    }
    const recipientCode = createJson?.data?.recipient_code || ''
    if (!recipientCode) {
      return new Response(JSON.stringify({ error: 'Missing recipient code' }), { status: 400, headers: cors })
    }
    // Try to persist recipient + human-friendly info (bank name/number) if columns exist
    const patchPayload = {
      paystack_recipient_code: recipientCode,
      bank_name: undefined as any,
      account_number: undefined as any,
      account_name: undefined as any,
    }
    // Optionally include fields (some databases may not have columns yet)
    ;(patchPayload as any).bank_name = createJson?.data?.details?.bank_name ?? null
    ;(patchPayload as any).account_number = accountNumber
    ;(patchPayload as any).account_name = accountName
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patchPayload),
    })
    if (!updateRes.ok) {
      // Fallback: only set recipient code
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ paystack_recipient_code: recipientCode }),
      })
    }
    return new Response(JSON.stringify({ ok: true, recipient_code: recipientCode }), { status: 200, headers: cors })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: cors })
  }
}
