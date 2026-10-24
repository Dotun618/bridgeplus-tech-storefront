# BridgePlus Tech storefront

Responsive React + Vite storefront with Supabase-backed catalogue management. Customers browse published products, keep a local shopping bag, and prepare an order request for WhatsApp. This app does not accept payments, store customer orders, or confirm stock.

## Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/migrations/202610230001_storefront_catalog.sql`. This creates categories, products, image metadata, administrator roles, row-level security policies, and a private `product-images` Storage bucket. The migration seeds the requested categories but does not add products.
3. Create the first administrator from **Authentication → Users** using the dashboard’s invite/add-user action. Do not add a public registration flow. In project Auth settings, turn off public sign-ups if they are enabled.
4. Copy that user’s Auth UID from the Users page. In SQL Editor, add only that chosen user to the protected admin allow-list:

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE-THE-AUTH-USER-UUID-HERE')
   on conflict (user_id) do nothing;
   ```

   The UUID is an Auth user ID, not an email address. Only a project owner should run this SQL. To remove administrator access, delete that user’s row from `public.admin_users`.
5. Add these values to the app’s environment variables. They are used by the browser client:

   | Variable | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anonymous key |

   The anonymous key is intentionally public and is safe for browser use only because the database and Storage RLS policies enforce access. Never put a `service_role` or secret key in a `VITE_` variable or frontend code. Restart/rebuild the storefront after changing environment values.
6. Open `/admin/login`, sign in with the invited administrator, and confirm the seeded categories appear. The public storefront starts with an empty catalogue until an administrator publishes products.

The SQL migration keeps the product image bucket private. Database rows store stable Storage paths, not expiring signed URLs; the app creates time-limited image URLs at read time. Keep the bucket private. Storage upload, update and deletion policies require an administrator, and visitors can request signed URLs only for images attached to published products in active categories.

## Managing products and categories

- Open **Administrator sign-in** in the storefront footer or visit `/admin/login`.
- Add a product, choose a category, and enter verified product details. Prices may be left blank until confirmed. SKU, previous price, stock quantity, product icon, featured status and demo flag are editable.
- Add one or more images from a phone or computer. Use **Set primary** to choose the storefront image; use **Replace** or **Remove** on each image. Save the listing to upload changes.
- Keep a product unpublished while checking its information. Turn on **Public listing** only when BridgePlus is ready to display it. A product in an inactive category remains hidden from public browsing.
- Use the category manager to add or edit categories, change their sort order, deactivate them, or reactivate them. Deactivating a category hides its products from the storefront without deleting those products.
- To try a sample row in a development project, run `supabase/seed-demo.sql`. It inserts one clearly flagged demo listing with no price and zero stock. Do not run this optional seed in production.

With only the main migration applied, test the empty state by visiting the storefront: it should show categories and “No products published yet.” For a populated-state test, run the optional demo seed and reload the storefront; the one demo listing should be marked as unverified and show no price. Delete that sample listing in `/admin` when done.

## Security and configuration

- Supabase Auth session is checked against `public.is_store_admin()` before the admin dashboard opens. Authenticated users without a row in `public.admin_users` are signed out and cannot manage products or images.
- Public catalogue queries read active products and active categories only. Admin mutations are also enforced by RLS and Storage policies, not just by hiding the admin interface.
- The initial administrator and any later administrator changes are managed in Supabase—not through a public sign-up page.
- The product table stores a stock quantity for operator reference; the storefront does not present it as confirmed availability. BridgePlus must confirm availability, final pricing, and fulfilment.

## Business details and branding

- WhatsApp destination and support contact: `src/storefront/config.ts`. Current WhatsApp number: `+234 905 932 5955` (digits in configuration: `2349059325955`). It can also be overridden with `VITE_WHATSAPP_NUMBER`.
- Business display name and tagline: same configuration file.
- The B+ mark is currently implemented in the storefront header/footer and admin sign-in/dashboard. Replace those text marks together if approved logo artwork is added.
- Category records are managed from `/admin`; the initial category set is inserted by the migration.

## WhatsApp order requests

Checkout validates the customer’s name and phone, plus a delivery address for home delivery. It creates a URL-encoded WhatsApp message with the selected items and displayed estimate, and offers a copy fallback. The customer must review and send the message. Generating or copying a message is not proof it was sent, received, accepted, or paid. Payment methods, product availability, final prices, delivery fees and pickup arrangements must be confirmed with BridgePlus on WhatsApp.

## Development and build commands
 
- `npm run dev` — start the storefront preview dev server.
- `npm run typecheck` — check TypeScript types across the app.
- `npm run build` — production frontend build.
