# Agent Guidelines for anime-app

## Development Commands

Use bun for all package management and script execution:

```bash
bun add <package>           # Add dependencies
bunx <package>              # Run package binaries
bun run dev                 # Start development server (do NOT start after each change)
bun run build               # Build project (includes TypeScript compilation)
bun run lint                # Run ESLint
bunx tsc -b                 # Run TypeScript compiler for type checking
```

After making code changes, always run `bun run lint` and `bunx tsc -b` to verify correctness. Only start dev server when explicitly requested.

**Testing**: No test framework is currently configured. If tests are needed, set up a testing framework (Vitest is recommended for this Vite project).

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`"strict": true`)
- Target: ES2022
- Module: ESNext with bundler resolution
- No unused locals or parameters allowed
- JSX transform: react-jsx
- Path alias: `@/*` maps to `./src/*`

### Imports
- Use `@/*` path alias for imports from src directory
- Example: `import { Button } from "@/components/ui/button"`
- Group imports: external dependencies first, then internal imports
- Type imports use `import type` when appropriate

### Component Structure
- Use TanStack Router's `createFileRoute` for route components
- Export components via Route object pattern:
```tsx
export const Route = createFileRoute("/path")({
  component: ComponentName,
});
```
- Use `useTranslation()` from react-i18next for all user-facing text
- Access translations via `t("key.path")`
- NEVER hardcode user-facing text in components - always use translation keys

### Internationalization (i18n)
- Translation files located in `src/locales/` with subdirectories: `en-US/` and `es-419/`
- After ANY change to user-facing text, update BOTH `en-US/common.json` AND `es-419/common.json`
- Translation keys use dot notation: `"section.subsection.key"`
- Always use `useTranslation()` hook to access translations
- Example: `const { t } = useTranslation(); return <h1>{t("home.title")}</h1>`
- Keep translation keys consistent across both language files
- Spanish messages are user-facing, English messages for internal development reference

### Data Fetching
- Use TanStack Query's `useQuery` hook for data fetching
- Define custom hooks in `src/hooks/` following `use<Domain>` naming pattern
- Hook example: `useAnimeSearch`, `useTopAnime`
- Query keys should follow array pattern: `["domain", "params"]`
- Set appropriate `enabled`, `retry`, and ` staleTime` options

### Error Handling
- Use custom `ApiError` class from `@/api/jikan` for API errors
- Provide user-friendly Spanish error messages (project uses Spanish)
- Use `ErrorState`, `EmptyState`, and `LoadingState` components from `@/components/network/`
- Always handle loading, error, and empty states in data-fetching components

### Styling
- Use Tailwind CSS v4 utility classes
- Merge classnames using `cn()` utility from `@/lib/utils`
- Component variants use `class-variance-authority` (see `@/lib/button-variants`)
- Radix UI primitives for accessible components
- Use Skeleton components for loading states
- Responsive design: use `md:`, `lg:` prefixes

### Component Naming
- Components: PascalCase (e.g., `AnimeList`, `ErrorState`)
- Hooks: camelCase starting with "use" (e.g., `useAnimeSearch`)
- Utilities: camelCase (e.g., `fetchJikan`, `cn`)
- Types: PascalCase (e.g., `Anime`, `JikanResponse`)
- Constants: UPPER_SNAKE_CASE (e.g., `BASE_URL`)

### API Layer
- API functions in `src/api/` directory
- Use `fetchJikan<T>()` for Jikan API calls
- Type responses using generic type parameter
- Handle 429 rate limiting with appropriate error messages
- Support AbortSignal for cancellation

### File Organization
```
src/
├── api/           # API functions and types
├── assets/        # Static assets
├── components/    # Reusable UI components
│   ├── network/   # Loading/error/empty states
│   └── ui/        # Primitive UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── locales/       # i18n translation files
└── routes/        # TanStack Router file routes
```

### Language and Comments
- Use Spanish for user-facing text and error messages
- All code documentation and comments must be in English
- Comments should only explain code functionality, never address the user
- Translation keys in English (e.g., `sections.topAnime`)

### Formatting
- Follow ESLint rules (typescript-eslint, react-hooks, react-refresh)
- Use Prettier if configured (check for .prettierrc)
- Maintain consistent indentation (2 spaces)
- No trailing whitespace
- Semicolons required
