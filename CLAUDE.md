# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI-powered ticket management system (see `project-scope.md`). Support agents receive tickets (eventually via inbound email), and the app uses the Claude API to classify tickets, generate summaries, and suggest replies. Two roles: **Admin** (seeded, manages agents) and **Agent** (created by admin, manages tickets). Ticket statuses: Open, Resolved, Closed. Ticket categories: General Question, Technical Question, Refund Request.

Current state: only auth/login and route scaffolding are built (see `implementation-plan.md` for the full phased plan — ticket CRUD, AI features, and email integration are not yet implemented).

## Repo layout

- `client/` — Vite + React 19 + TypeScript SPA
- `server/` — Express 5 + TypeScript API
- `core/` — `@helpdesk/core`, TypeScript package of zod schemas/types shared by `client/` and `server/` (see Validation below)
- `e2e/` — Playwright end-to-end tests, own `package.json` (see the `e2e-test-writer` agent for how the harness works and how to write specs)
- No root-level scripts and no npm workspaces; each directory is its own npm project — `cd` into `client/`, `server/`, `core/`, or `e2e/` to run anything.

## Commands

### Client (`client/`)
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint
- `npm test` — `vitest run`, runs all component tests once (CI/one-shot)
- `npm run test:watch` — `vitest` in watch mode, for actively writing/iterating on tests
- `npx shadcn@latest add <component>` — add a new shadcn/ui component

### Core (`core/`)
- `npm run build` — `tsc`, emits CommonJS + `.d.ts` to `core/dist` (what `client/` and `server/` actually import)
- `npm run dev` — `tsc --watch`, for editing schemas while a client/server dev server is running
- `npm run typecheck` — `tsc --noEmit`
- **After changing anything in `core/src`, rebuild** — consumers read `core/dist`, not the source. Restart the Vite dev server too (it pre-bundles the package, see Validation below).

### Server (`server/`)
- `npm run dev` — ts-node-dev on `src/index.ts` (default port 4000), auto-respawns
- `npm run build` — `tsc`
- `npm run start` — run compiled `dist/index.js` with `NODE_ENV=production` set (this is what gates rate limiting on, see Auth below)
- `npm run seed` — run `prisma/seed.ts`, creates the admin user from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` env vars (no-op if that user already exists)
- No test suite is configured yet (`npm test` is a placeholder).

### Prisma (run from `server/`)
- `npx prisma migrate dev` — create/apply a migration in development
- `npx prisma generate` — regenerate the client (output goes to `server/src/generated/prisma`, not `node_modules`)
- Schema: `server/prisma/schema.prisma`. Config (schema/migration paths, datasource URL): `server/prisma.config.ts`, not the schema file's `datasource` block.

### Component tests (`client/`)
- Vitest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`), config in `client/vitest.config.ts`, jsdom env, setup file `client/src/test/setup.ts` (registers jest-dom matchers).
- Write these directly (no dedicated agent, unlike e2e specs — see below) as `*.test.tsx` colocated next to the component, e.g. `client/src/pages/Users.tsx` → `client/src/pages/Users.test.tsx`.
- Mock `@/lib/api` with `vi.mock` rather than hitting a real server — component tests should be fast and isolated; server behavior is covered by e2e specs instead.
- Any component using `@tanstack/react-query` (`useQuery`/`useMutation`) needs to render inside a `QueryClientProvider` with a fresh `QueryClient` (`retry: false` in `defaultOptions.queries`, so failed-request tests don't hang on retries). See `client/src/pages/Users.test.tsx` for the pattern; if a second test file needs the same wrapper, extract it to a shared `renderWithQuery` helper under `client/src/test/` rather than duplicating it — not worth it for a single call site.
- Run with `npm test` (one-shot) or `npm run test:watch` (watch mode) from `client/`.

### E2E tests (`e2e/`)
- **Always use the `e2e-test-writer` agent to write or update Playwright specs** — invoke it (via the Agent/Task tool) rather than writing `e2e/tests/**/*.spec.ts` files directly. It knows the harness (isolated `helpdesk_test` DB, `webServer` config, seeded admin credentials) and this app's current feature surface, so tests it writes match how the app actually behaves instead of guessing. This applies whenever the user asks for e2e/browser test coverage, and proactively after finishing a new user-facing flow that should get coverage.
- Full setup and harness mechanics are documented in `.claude/agents/e2e-test-writer.md`, not here — read that file (or just invoke the agent) rather than duplicating the details.

## Architecture

### Auth
- Better Auth (`better-auth`) with the Prisma adapter, email/password only, **sign-up disabled** (`disableSignUp: true` in `server/src/auth.ts`) — agents can only be created by an admin through the (not-yet-built) user management endpoints, never via self-serve signup.
- Server mounts Better Auth's handler directly at `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`, ahead of `express.json()` — Better Auth parses its own request bodies.
- `role` (`ADMIN`/`AGENT`) is a Better Auth `additionalFields` entry on `user`, backed by the `Role` enum in `schema.prisma`. It defaults to `AGENT`.
- `server/src/middleware/requireAuth.ts` validates the session via `auth.api.getSession` and attaches it to `req.session`; use this middleware to protect any new API route.
- Rate limiting (Better Auth's built-in limiter, 60s window / 100 requests by default) is enabled only when `NODE_ENV === "production"` (`rateLimit.enabled` in `server/src/auth.ts`) — off in `dev`/`dev:test` so local and e2e runs aren't throttled. Only `npm run start` sets `NODE_ENV=production`; a future real deploy pipeline needs to set it too (or rely on the platform doing so) or this silently stays off.
- Client uses `better-auth/react`'s `createAuthClient` (`client/src/lib/auth-client.ts`) pointed at `VITE_SERVER_URL`. `authClient.useSession()` drives `ProtectedRoute`, `PublicOnlyRoute`, and `AdminRoute` (`client/src/components/`), which gate the route tree in `App.tsx` — protected pages render inside `Layout`, which also owns sign-out. `AdminRoute` nests inside `ProtectedRoute` and redirects to `/` unless `session.user.role === "ADMIN"`; `Layout` only shows nav links to admin-only pages when that check passes.
- `auth-client.ts` registers `inferAdditionalFields` (from `better-auth/client/plugins`) with a manually declared `{ user: { role: { type: "string" } } }` schema so `session.user.role` is typed on the client. Declare it manually rather than importing `typeof auth` from the server — `client/` and `server/` are separate npm projects with separate tsconfigs, and `client/tsconfig.app.json`'s `include: ["src"]` makes cross-package imports fragile.
- Self-serve signup is disabled, but the admin Users page (`client/src/pages/Users.tsx`, admin-only via `AdminRoute`) covers user management: `POST /api/users` creates an AGENT (`CreateUserDialog.tsx`), `GET /api/users` lists all users (`UsersTable.tsx`), and `PATCH /api/users/:id` edits an existing user's name/email and optionally their password (`EditUserDialog.tsx` — a blank password field leaves the password unchanged; role is not editable from this form). All three live in `server/src/routes/users.ts` behind `requireAuth, requireAdmin`. New Account rows (on create) follow the pattern in `server/prisma/seed.ts`: hash with `hashPassword` from `better-auth/crypto`, insert with `providerId: "credential"`; password updates use `prisma.account.updateMany({ where: { userId, providerId: "credential" }, ... })` since there's no unique index on that pair.

### Validation
- **Use zod for all data validation, on both sides of the wire** — never hand-rolled `typeof` checks or ad-hoc regexes. It's a dependency of `client/`, `server/`, and `core/`.
- **Any schema both the client and the server need is defined exactly once, in `core/`** — never declare it in `client/` and again in `server/`, and never validate against a locally re-declared copy "just for the form". Two definitions of the same rule always drift. Schemas that are genuinely one-sided (a client-only UI filter, a server-only env parse, `Login.tsx`'s `loginSchema` — login is handled by Better Auth's own endpoint) stay local to that package.
- **Adding a new shared schema** (do this whenever a new form posts to a new endpoint — e.g. ticket create/update next):
  1. Define it in `core/src/schemas/<domain>.ts` — the schema plus its inferred input type (`export type XInput = z.infer<typeof xSchema>`), with the user-facing message as the second argument to every rule.
  2. Re-export both from the `core/src/index.ts` barrel (`export { … }` / `export type { … }` — the barrel splits value and type exports).
  3. `npm run build` in `core/`.
  4. Import it in the form and in the route handler: `import { xSchema, type XInput } from "@helpdesk/core"`.
  - `core/src/schemas/user.ts` → `CreateUserDialog.tsx` + `server/src/routes/users.ts` is the reference example end to end.
  - When a new schema is a variant of an existing one (e.g. `updateUserSchema` vs `createUserSchema` — same name/email rules, but password becomes optional for edit, meaning "don't change it"), derive it with `.omit()`/`.extend()` rather than rewriting the shared fields, so the rules and their messages can't diverge. `POST /api/users` (create) vs `PATCH /api/users/:id` (edit, via `EditUserDialog.tsx`) is the reference example of this.
- Client side of a shared schema: feed it to **`react-hook-form` via `zodResolver`** (`@hookform/resolvers/zod`) — `useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema) })`, per-field messages rendered through shadcn's `FieldError` (see `CreateUserDialog.tsx`). Use the type inferred in `core` as the form-values type; don't re-infer it locally.
- Server side of a shared schema: `<schema>.safeParse(req.body)` as the first thing in the handler, and on failure return `400 { error: <first issue message> }` — that shape is what the client surfaces through `FieldError`. Read the validated values off `parsed.data`, never `req.body`, so transforms like `.trim()` apply and the values are typed. `server/tsconfig.json` sets `noUncheckedIndexedAccess`, so `parsed.error.issues[0]` needs a `?.`/fallback.
- Because the schema is shared, error message strings are defined in one place — e2e and component tests assert on them, so changing a message in `core/` changes both sides at once (and requires a `core` rebuild before tests see it).
- Zod v4 API: use the top-level string formats (`z.email()`, `z.uuid()`, `z.url()`), not the deprecated v3 method chains (`z.string().email()`).
- Validation is defense in depth, not a substitute for the `requireAuth`/`requireAdmin` middleware — a route needs both.

### The `core` package
- `core/` is wired in as a plain `file:` dependency (`"@helpdesk/core": "file:../core"` in both `client/package.json` and `server/package.json`), which npm installs as a symlink. Deliberately **not** npm workspaces — that would need a root `package.json` and change the per-directory workflow everything else assumes.
- It compiles to **CommonJS + declarations** in `core/dist`, exposed via `main`/`types`. CJS because `server/` is `module: "commonjs"` with node10 resolution, which ignores `exports` maps.
- zod is a **peer** dependency of `core` (plus a devDependency for building it), so consumers supply their own copy and the client bundle doesn't get two zod instances.
- Vite skips pre-bundling linked dependencies, so a linked CJS package would reach the browser as raw `require`/`exports`. Both `client/vite.config.ts` and `client/vitest.config.ts` therefore set `optimizeDeps: { include: ['@helpdesk/core'] }`. Keep those two configs in sync.
- `core/dist` is committed (matching `server/dist`); run `npm run build` in `core/` after editing it so the checked-in output doesn't go stale.

### Database
- Postgres via `@prisma/adapter-pg` (driver adapter, not the default Prisma engine connection) — see `server/src/db.ts`. `DATABASE_URL` comes from env.
- Generated Prisma client lives in `server/src/generated/prisma/` (checked into the repo path, but generated — regenerate after schema changes rather than hand-editing).

### Frontend UI
- Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config file — theme lives in `client/src/index.css`).
- shadcn/ui is installed with the default theme (style `base-nova`, neutral base color, Lucide icons, Geist Variable font). Components live in `client/src/components/ui/`. Prefer adding new components with the shadcn CLI over hand-rolling Tailwind primitives, and use the `Field`/`FieldGroup`/`FieldLabel`/`FieldError` components for form layout/validation to stay consistent with `Login.tsx`.
- Path alias `@/*` → `client/src/*`, configured in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`. `baseUrl` is intentionally omitted from the tsconfig files — under `moduleResolution: "bundler"` it's not needed for `paths` to resolve, and adding it back triggers a TS5101 deprecation error.
- Forms use `react-hook-form` + `zod` via `@hookform/resolvers/zod`'s `zodResolver`, with the schema imported from `@helpdesk/core` — see Validation above. `Login.tsx` and `CreateUserDialog.tsx` are the reference implementations.
- Data fetching to the Express API uses `axios` + `@tanstack/react-query` — not raw `fetch`. `client/src/lib/api.ts` exports `api`, an axios instance (`baseURL: VITE_SERVER_URL`, `withCredentials: true`); import it and call `api.get/post/...` inside a `useQuery`/`useMutation` `queryFn`/`mutationFn` rather than fetching directly in components. The root `QueryClientProvider` is set up in `client/src/main.tsx`. This is separate from Better Auth's own client (`auth-client.ts`), which stays on `better-auth/react`'s `createAuthClient`/`useSession` — only non-auth API calls (e.g. `/api/users`) go through `api`.

## Environment

- `server/.env` — `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `CLIENT_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (see `server/.env.example`). `server/.env.test` is the e2e equivalent — see the `e2e-test-writer` agent.
- `client/` reads `VITE_SERVER_URL` for the API base URL (defaults to `http://localhost:4000`).
- CORS on the server is locked to `CLIENT_URL` (default `http://localhost:5173`) with `credentials: true`.
