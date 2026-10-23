# BridgePlus Tech Storefront

A responsive electronics storefront for browsing demo products and sending order requests to BridgePlus Tech over WhatsApp.

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

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

Customers can browse a product catalogue, search and filter categories, manage a cart, and submit an order request through WhatsApp.

- Treat catalogue entries and prices as demos until BridgePlus verifies them.
- Do not invent stock, discounts, delivery fees, addresses, warranties, or payment methods.
- A generated or copied WhatsApp message is not an order confirmation or proof of payment.
- Payment methods and any delivery charge must be confirmed directly with BridgePlus.
- Keep the WhatsApp contact configurable; the supplied number is +234 905 932 5955.

## User preferences

- Keep the storefront clean and premium, with an Apple-inspired feel and a product-focused shopping layout.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
