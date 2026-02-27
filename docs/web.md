# Frontend — apps/web/

Next.js 15 with App Router, Tailwind CSS, deployed to Vercel.

## Stack
- Next.js 15 (App Router)
- Tailwind CSS
- TypeScript (strict mode)
- Zod for runtime validation

## Commands

```bash
pnpm install              # install deps
pnpm run dev              # dev server on port 3000
pnpm run build            # production build
pnpm run test             # vitest
pnpm run lint             # ESLint + Prettier
```

## Patterns
- Server Components query DB directly (read-only for public pages) via Drizzle
- Runtime validation with Zod schemas from `packages/shared-types`
