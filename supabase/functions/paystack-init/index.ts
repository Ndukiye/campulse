// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
  }
  try {
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY") || ""
    if (!secret) {
      return new Response(JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set" }), { status: 500 })
    }
    const body = await req.json() as {
      amount: number
      email: string
      callback_url?: string
      metadata?: Record<string, any>
    }
    if (!body?.amount || !body?.email) {
      return new Response(JSON.stringify({ error: "Missing amount or email" }), { status: 400 })
    }
    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
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
      return new Response(JSON.stringify({ error: initJson?.message || "Paystack init failed" }), { status: 400 })
    }
    const data = initJson?.data
    return new Response(JSON.stringify({ data }), { headers: { "Content-Type": "application/json" }, status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Unexpected error" }), { status: 500 })
  }
})
