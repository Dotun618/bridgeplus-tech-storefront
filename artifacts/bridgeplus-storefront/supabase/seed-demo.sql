-- Optional: clearly marked, unpriced sample data for testing the empty-to-populated flow.
-- Run only in a development/test Supabase project. Do not treat these rows as real inventory.

insert into public.products (
  name,
  slug,
  brand,
  description,
  category_id,
  price,
  sku,
  stock_quantity,
  active,
  featured,
  is_demo,
  icon
)
select
  'Demo smartphone listing',
  'demo-smartphone-listing',
  'Demo data',
  'Sample row for testing only. No model, price or availability is represented.',
  c.id,
  null,
  null,
  0,
  true,
  false,
  true,
  'phone'
from public.categories as c
where c.slug = 'google-pixel'
on conflict (slug) do nothing;
