# Database — packages/db/

Drizzle ORM schema and migrations, backed by Neon PostgreSQL.

## Stack
- Drizzle ORM
- Neon PostgreSQL (serverless)

## Commands

```bash
drizzle-kit push          # apply migrations
drizzle-kit studio        # interactive schema browser
```

## Patterns
- Frontend Server Components query DB directly via Drizzle (read-only for public pages)
- Services write to DB, never communicate via HTTP between each other
