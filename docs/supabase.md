# Supabase CLI (bunx) Commands

All commands below use `bunx` and assume you run them from:

```bash
cd /home/mau/Dev/P2-diseno/apps/backend
```

## Local development

Start local Supabase services:

```bash
bunx supabase start
```

Check status and view local credentials:

```bash
bunx supabase status
```

Stop local services:

```bash
bunx supabase stop
```

Reset local DB and reapply migrations:

```bash
bunx supabase db reset
```

Reset local DB without seeding:

```bash
bunx supabase db reset --no-seed
```

## Remote project

Login (opens browser):

```bash
bunx supabase login
```

Link this repo to a remote project:

```bash
bunx supabase link --project-ref <TU_PROJECT_REF>
```

Set remote DB password for CLI operations (per shell session):

```bash
export SUPABASE_DB_PASSWORD="<DB_PASSWORD_REMOTO>"
```

Apply migrations to remote:

```bash
bunx supabase db push
```

Dry-run remote migrations:

```bash
bunx supabase db push --dry-run
```

Reset remote DB and reapply migrations (DESTRUCTIVO):

```bash
bunx supabase db reset --linked
```

## Notes

- Local ports for this project are configured in:
  - `apps/backend/supabase/config.toml`
- Local env values are in:
  - `apps/backend/.env.local`
