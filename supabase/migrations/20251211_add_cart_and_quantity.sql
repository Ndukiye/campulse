-- Add available_quantity to products
alter table public.products add column if not exists available_quantity integer not null default 1;
alter table public.products drop constraint if exists products_available_quantity_nonnegative;
alter table public.products add constraint products_available_quantity_nonnegative check (available_quantity >= 0);

-- Create cart_items table
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

drop policy if exists cart_items_select on public.cart_items;
create policy cart_items_select on public.cart_items
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists cart_items_insert on public.cart_items;
create policy cart_items_insert on public.cart_items
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists cart_items_update on public.cart_items;
create policy cart_items_update on public.cart_items
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists cart_items_delete on public.cart_items;
create policy cart_items_delete on public.cart_items
  for delete to authenticated
  using (auth.uid() = user_id);

