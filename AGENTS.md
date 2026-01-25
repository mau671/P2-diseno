# Agent Guide (Repo Root)

This repository is a Bun workspace with multiple apps.
Follow app-specific guides when working under `apps/web` or `apps/mobile`:
- `apps/web/AGENTS.md`
- `apps/mobile/AGENTS.md`

No Cursor or Copilot rules were found in `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md`.

## Build / Lint / Test Commands

Use Bun for all installs and script execution. Avoid npm/pnpm/yarn.

### Root (workspace)

```bash
# Web dev server
bun run dev:web

# Mobile dev server
bun run dev:mobile
```

### Backend (`apps/backend`)

```bash
# Dev server
bun run dev

# Database (Drizzle)
bun run db:generate
bun run db:migrate
bun run db:studio
bun run db:push

# Tests
bun test

# Single test file
bun test src/__tests__/auth.test.ts

# Single test by name (pattern)
bun test --test-name-pattern "auth endpoints"
```

### Web (`apps/web`)

```bash
# Dev
bun run dev

# Build
bun run build

# Lint
bun run lint
```

### Mobile (`apps/mobile`)

```bash
# Dev
bun run start

# Platforms
bun run android
bun run ios
bun run web

# Lint
bun run lint
```

## Code Style Guidelines (Repository-wide)

### General

- Use TypeScript where present; repo is ESM (`"type": "module"`).
- Prefer `import type` for type-only imports.
- Keep modules small and focused; colocate route handlers and helpers.
- Avoid legacy env names; use `.env.example` as the source of truth.
- Use ASCII in files unless the file already contains non-ASCII text.

### Naming

- Files: kebab-case or lowerCamelCase depending on existing area.
- Functions/variables: `camelCase`.
- Classes/types/interfaces: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.

### Imports

- External imports first, internal imports second, relative imports last.
- Keep import lists tidy; avoid unused imports.

### Formatting

- Follow existing formatting in the file.
- Indentation is 2 spaces in TypeScript files.
- Avoid trailing whitespace.

### Error Handling

- Prefer early returns for invalid input.
- Use Express error middleware (`next(err)`) for unexpected failures.
- Return consistent JSON error shapes: `{ error: string }`.

## Backend (`apps/backend`) Guidelines

### API Structure

- Express app lives in `src/app.ts`; server boot in `src/index.ts`.
- Routes are mounted under `/api/v1` via `src/routes/index.ts`.
- Add new routes in `src/routes/*` and mount in `src/routes/index.ts`.
- OpenAPI spec is served at `/api/v1/openapi.json` (`src/openapi.ts`).

### Auth & Supabase

- Supabase client is configured in `src/lib/supabase.ts`.
- Use `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (new format keys).
- Do not use legacy anon/service role names.
- Use `authMiddleware` for protected routes and `optionalAuthMiddleware` for optional auth.

### Database

- Drizzle schema is defined in `src/db/schema.ts`.
- The SQL migrations under `src/db/migrations/` are the source of truth.
- When schema differs, update Drizzle schema to match SQL.
- Database connection is in `src/db/index.ts` using `DATABASE_URL`.

### Testing

- Tests use Bun (`bun:test`).
- Prefer isolated unit tests with mocks; avoid network calls unless required.
- Place tests under `src/__tests__/`.

## Web (`apps/web`) Notes

- See `apps/web/AGENTS.md` for detailed UI/i18n rules.
- Use TanStack Router, TanStack Query, and `@/` alias.
- Do not hardcode user-facing text; use i18n keys.

## Mobile (`apps/mobile`) Notes

- See `apps/mobile/AGENTS.md` for detailed Expo Router and i18n rules.
- Use `ThemedView`/`ThemedText` and `IconSymbol` when applicable.

## Git Hygiene

- Do not use `git reset --hard` or destructive commands.
- Avoid `git commit --amend` unless explicitly requested.
- Do not add `.env` or secrets to commits.
