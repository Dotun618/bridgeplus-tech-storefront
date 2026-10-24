# BridgePlus Tech Storefront

A responsive electronics storefront with a Supabase-managed product catalogue and protected administrator dashboard. Customers browse products and prepare order requests for BridgePlus Tech over WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

- `artifacts/bridgeplus-storefront/src/storefront/catalogApi.ts` — Supabase catalogue, image, and administrator operations.
- `artifacts/bridgeplus-storefront/src/admin/` — protected catalogue management and sign-in screens.
- `artifacts/bridgeplus-storefront/supabase/migrations/` — source of truth for storefront tables, RLS, and Storage policies.
- `artifacts/bridgeplus-storefront/README.md` — Supabase project, first-admin, product-management, and deployment setup.

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

- The storefront browser client uses only the public Supabase anonymous key; RLS and `public.admin_users` enforce access. Never add a service-role key to frontend code or any `VITE_` variable.
- Product images live in a private Storage bucket. The database keeps stable object paths; signed display URLs are generated when reading listings because signed URLs expire.
- The first administrator is allow-listed by a project owner in Supabase SQL. Do not add public admin registration or trust an authenticated session without checking `is_store_admin()`.

## Product

Customers can browse a product catalogue, search and filter categories, manage a cart, and submit an order request through WhatsApp.

- Clearly mark rows flagged as demo. Do not invent or claim verified stock, discounts, delivery fees, or company information.
- Do not invent stock, discounts, delivery fees, addresses, warranties, or payment methods.
- A generated or copied WhatsApp message is not an order confirmation or proof of payment.
- Payment methods and any delivery charge must be confirmed directly with BridgePlus.
- Keep the WhatsApp contact configurable; the supplied number is +234 905 932 5955.
- Catalogue setup and the optional demo seed are documented in `artifacts/bridgeplus-storefront/README.md`.

## User preferences

- Keep the storefront clean and premium, with an Apple-inspired feel and a product-focused shopping layout.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
