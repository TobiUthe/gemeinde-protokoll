# Frontend — apps/web/

Next.js 15 with App Router, Tailwind CSS v4, deployed to Vercel.

## Stack
- Next.js 15 (App Router, React 19)
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- TypeScript (strict mode)
- Auth.js v5 (next-auth@5) with Credentials provider + Drizzle adapter
- shadcn/ui components (button, card, input, label, badge)
- Drizzle ORM with Neon serverless (direct DB queries in Server Components)
- Zod for runtime validation

## Commands

```bash
pnpm install              # install deps
pnpm run dev              # dev server on port 3000
pnpm run build            # production build
pnpm run lint             # ESLint
```

## Route Structure

```
app/
  page.tsx                              # Marketing landing (public, nordic design)
  layout.tsx                            # Root layout (Inter font)
  globals.css                           # Tailwind v4 theme (nordic tokens)
  (auth)/login/page.tsx                 # Login (credentials)
  (auth)/register/page.tsx              # Registration
  (dashboard)/layout.tsx                # Sidebar + auth guard
  (dashboard)/dashboard/page.tsx        # Stats + recent documents
  (dashboard)/municipalities/page.tsx   # Browse + search + canton filter
  (dashboard)/municipalities/[id]/      # Municipality detail + documents
  (dashboard)/documents/page.tsx        # Document search + browse
  (dashboard)/documents/[id]/           # Document detail + page image gallery
  (admin)/layout.tsx                    # Dark theme admin sidebar + role guard
  (admin)/admin/page.tsx                # Pipeline monitor dashboard
  (admin)/admin/municipalities/         # Municipality CRUD
  (admin)/admin/documents/              # Document manager
  (admin)/admin/pipeline/               # Pipeline status + flow diagram
  api/auth/[...nextauth]/route.ts       # Auth.js API handler
  api/register/route.ts                 # User registration endpoint
```

## Authentication

- **Provider**: Credentials (email + password with bcrypt)
- **Session**: JWT strategy (serverless compatible)
- **Roles**: `user` (default) and `admin`
- **Middleware**: protects `/dashboard/*`, `/municipalities/*`, `/documents/*` (auth required); `/admin/*` (admin role required)
- **Admin user**: Seeded via `pnpm db:seed-admin` (admin@protokolbase.ch)

## Design

- **Public**: Nordic minimalistic — white bg, slate text, blue accent (#2563eb), Inter font
- **Dashboard**: Clean light theme with sidebar navigation
- **Admin**: Dark theme (bg #060a14) matching pipeline monitor mockup

## Patterns
- All DB-querying pages use `export const dynamic = "force-dynamic"` to avoid build-time DB access
- Server Components query DB directly via Drizzle (no API layer)
- Document viewer displays pre-rendered page images from Vercel Blob for fast loading
- Admin section uses server actions for mutations (add municipality, etc.)
