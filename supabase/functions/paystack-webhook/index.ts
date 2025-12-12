// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

async function hmacSha512(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
  }
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") || ""
  if (!secret) return new Response(JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set" }), { status: 500 })
  const raw = await req.text()
  const headerSig = req.headers.get("x-paystack-signature") || ""
  const computed = await hmacSha512(secret, raw)
  if (!headerSig || headerSig !== computed) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 })
  }
  const payload = JSON.parse(raw)
  const event = payload?.event
  const data = payload?.data

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Supabase env not set" }), { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    if (event === "charge.success") {
      const txId = data?.metadata?.transaction_id
      const reference = data?.reference
      if (txId && reference) {
        const { error } = await supabase
          .from("transactions")
          .update({ status: "paid_escrow", paystack_reference: reference })
          .eq("id", txId)
        if (error) throw new Error(error.message)
      }
    }
    // Add transfer event handling later
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Webhook error" }), { status: 500 })
  }
})
