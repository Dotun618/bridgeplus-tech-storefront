-- BridgePlus Tech catalogue, administrator authorization, and private product images.
-- Run this migration in Supabase Dashboard > SQL Editor as the project owner.

begin;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null default '',
  description text not null default '',
  category_id uuid not null references public.categories(id) on delete restrict,
  price numeric(14, 2) check (price is null or price >= 0),
  previous_price numeric(14, 2) check (previous_price is null or previous_price >= 0),
  sku text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default false,
  featured boolean not null default false,
  is_demo boolean not null default false,
  icon text not null default 'smart'
    check (icon in ('phone', 'camera', 'monitor', 'desktop', 'headphones', 'speaker', 'tablet', 'watch', 'smart')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_sku_unique
  on public.products (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_public_catalog_order
  on public.products (active, featured desc, created_at desc);
create index if not exists products_category_id_idx on public.products (category_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_order_idx
  on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary_per_product
  on public.product_images (product_id)
  where is_primary;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
  on public.categories for select to anon, authenticated
  using (active or (select public.is_store_admin()));
drop policy if exists "Admins insert categories" on public.categories;
create policy "Admins insert categories"
  on public.categories for insert to authenticated
  with check ((select public.is_store_admin()));
drop policy if exists "Admins update categories" on public.categories;
create policy "Admins update categories"
  on public.categories for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));
drop policy if exists "Admins delete categories" on public.categories;
create policy "Admins delete categories"
  on public.categories for delete to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select to anon, authenticated
  using (
    (
      active
      and exists (
        select 1
        from public.categories as c
        where c.id = category_id and c.active
      )
    )
    or (select public.is_store_admin())
  );
drop policy if exists "Admins insert products" on public.products;
create policy "Admins insert products"
  on public.products for insert to authenticated
  with check ((select public.is_store_admin()));
drop policy if exists "Admins update products" on public.products;
create policy "Admins update products"
  on public.products for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));
drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products"
  on public.products for delete to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "Public read images for published products" on public.product_images;
create policy "Public read images for published products"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products as p
      join public.categories as c on c.id = p.category_id
      where p.id = product_id and p.active and c.active
    )
    or (select public.is_store_admin())
  );
drop policy if exists "Admins insert product images" on public.product_images;
create policy "Admins insert product images"
  on public.product_images for insert to authenticated
  with check ((select public.is_store_admin()));
drop policy if exists "Admins update product images" on public.product_images;
create policy "Admins update product images"
  on public.product_images for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));
drop policy if exists "Admins delete product images" on public.product_images;
create policy "Admins delete product images"
  on public.product_images for delete to authenticated
  using ((select public.is_store_admin()));

-- The role table is intentionally not directly readable or writable by browser clients.
drop policy if exists "Admins read administrator registry" on public.admin_users;
create policy "Admins read administrator registry"
  on public.admin_users for select to authenticated
  using ((select public.is_store_admin()));

grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
revoke all on public.admin_users from anon, authenticated;

-- Keep images private so Storage RLS is enforced when visitors request signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read published product images" on storage.objects;
create policy "Read published product images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'product-images'
    and (
      (select public.is_store_admin())
      or exists (
        select 1
        from public.product_images as pi
        join public.products as p on p.id = pi.product_id
        join public.categories as c on c.id = p.category_id
        where pi.storage_path = name
          and p.active
          and c.active
      )
    )
  );
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (select public.is_store_admin())
    and exists (
      select 1 from public.products as p
      where p.id::text = split_part(name, '/', 1)
    )
  );
drop policy if exists "Admins update product images in storage" on storage.objects;
create policy "Admins update product images in storage"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()))
  with check (bucket_id = 'product-images' and (select public.is_store_admin()));
drop policy if exists "Admins delete product images from storage" on storage.objects;
create policy "Admins delete product images from storage"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_store_admin()));

insert into public.categories (name, slug, sort_order)
values
  ('Apple', 'apple', 10),
  ('Google Pixel', 'google-pixel', 20),
  ('DJI', 'dji', 30),
  ('Meta', 'meta', 40),
  ('Headphones', 'headphones', 50),
  ('Speakers', 'speakers', 60),
  ('Smart-home devices', 'smart-home-devices', 70),
  ('Gaming monitors', 'gaming-monitors', 80),
  ('Gaming PCs & desktops', 'gaming-pcs-desktops', 90),
  ('Accessories', 'accessories', 100)
on conflict (slug) do nothing;

commit;
