# CamPulse Policies & Dispute Resolution

Purpose
- Campus marketplace designed for safe, clear, and convenient student trading.

Policies
- Listings & Prohibited Items: No illegal, dangerous, or restricted items; obey campus rules; accurate descriptions and authentic photos.
- Pricing & Fairness: Transparent pricing; no hidden fees; avoid gouging on essentials.
- Communication & Conduct: Courteous language; no harassment or discrimination; keep negotiation in-app.
- Meetups & Safety: Prefer safe public campus locations; daylight hours; bring student ID when appropriate.
- Verification & Trust: Verified users prioritized; repeated violations lead to warnings or bans.
- Payments: In-app refunds follow platform rules; off-platform payments limit dispute support.

Dispute Resolution
- Initiation: Either party opens a dispute with a clear reason (not as described, no-show, damaged, payment issue); provide evidence (messages, photos, meetup details).
- Triage: Automated checks on verification, history, listing details; admins see a consolidated timeline and logs.
- Mediation: Admin requests additional info as needed; aims for resolution within 48–72 hours.
- Outcomes: Refund (full/partial), replacement/repair, credit/voucher, warnings/bans for repeat offenders.
- Escalation: High-value or complex cases escalate to senior admins; all documentation retained.
- Prevention: Encourage in-app confirmations; regular reminders on listing accuracy and safe meetups.

Schema Mirror (to apply in Supabase)
- Inventory on products:
  - `ALTER TABLE public.products ADD COLUMN available_quantity INTEGER NOT NULL DEFAULT 1;`
  - `ALTER TABLE public.products ADD CONSTRAINT products_available_quantity_nonnegative CHECK (available_quantity >= 0);`
- Cart items:
  - Create table and policies:
    - `CREATE TABLE IF NOT EXISTS public.cart_items ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (user_id, product_id) );`
    - `ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;`
    - `CREATE POLICY cart_items_select ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);`
    - `CREATE POLICY cart_items_insert ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);`
    - `CREATE POLICY cart_items_update ON public.cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
    - `CREATE POLICY cart_items_delete ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);`

