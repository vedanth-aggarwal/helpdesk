# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI-powered ticket management system (see `project-scope.md`). Support agents receive tickets (eventually via inbound email), and the app uses the Claude API to classify tickets, generate summaries, and suggest replies. Two roles: **Admin** (seeded, manages agents) and **Agent** (created by admin, manages tickets). Ticket statuses: Open, Resolved, Closed. Ticket categories: General Question, Technical Question, Refund Request.

Current state: only auth/login and route scaffolding are built (see `implementation-plan.md` for the full phased plan — ticket CRUD, AI features, and email integration are not yet implemented).

## Repo layout

- `client/` — Vite + React 19 + TypeScript SPA
- `server/` — Express 5 + TypeScript API
- `e2e/` — Playwright end-to-end tests, own `package.json` (see the `e2e-test-writer` agent for how the harness works and how to write specs)
- No root-level scripts; `cd` into `client/`, `server/`, or `e2e/` to run anything.

## Commands

### Client (`client/`)
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint
- `npm test` — `vitest run`, runs all component tests once (CI/one-shot)
- `npm run test:watch` — `vitest` in watch mode, for actively writing/iterating on tests
- `npx shadcn@latest add <component>` — add a new shadcn/ui component

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
- User management endpoints aren't built yet and self-serve signup is disabled, so there is currently no way to create an agent/admin user through the app. To create one manually, follow the pattern in `server/prisma/seed.ts`: create the `User` row via Prisma, hash the password with `hashPassword` from `better-auth/crypto`, and insert a matching `Account` row (`providerId: "credential"`). Run one-off scripts with `npx ts-node --transpile-only <script>.ts` from `server/` (plain `ts-node` fails under `verbatimModuleSyntax`), and delete the script afterward — prefer real user-management endpoints once they exist (see `implementation-plan.md`).

### Database
- Postgres via `@prisma/adapter-pg` (driver adapter, not the default Prisma engine connection) — see `server/src/db.ts`. `DATABASE_URL` comes from env.
- Generated Prisma client lives in `server/src/generated/prisma/` (checked into the repo path, but generated — regenerate after schema changes rather than hand-editing).

### Frontend UI
- Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config file — theme lives in `client/src/index.css`).
- shadcn/ui is installed with the default theme (style `base-nova`, neutral base color, Lucide icons, Geist Variable font). Components live in `client/src/components/ui/`. Prefer adding new components with the shadcn CLI over hand-rolling Tailwind primitives, and use the `Field`/`FieldGroup`/`FieldLabel`/`FieldError` components for form layout/validation to stay consistent with `Login.tsx`.
- Path alias `@/*` → `client/src/*`, configured in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`. `baseUrl` is intentionally omitted from the tsconfig files — under `moduleResolution: "bundler"` it's not needed for `paths` to resolve, and adding it back triggers a TS5101 deprecation error.
- Forms use `react-hook-form` + `zod` via `@hookform/resolvers`.
- Data fetching to the Express API uses `axios` + `@tanstack/react-query` — not raw `fetch`. `client/src/lib/api.ts` exports `api`, an axios instance (`baseURL: VITE_SERVER_URL`, `withCredentials: true`); import it and call `api.get/post/...` inside a `useQuery`/`useMutation` `queryFn`/`mutationFn` rather than fetching directly in components. The root `QueryClientProvider` is set up in `client/src/main.tsx`. This is separate from Better Auth's own client (`auth-client.ts`), which stays on `better-auth/react`'s `createAuthClient`/`useSession` — only non-auth API calls (e.g. `/api/users`) go through `api`.

## Environment

- `server/.env` — `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `CLIENT_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (see `server/.env.example`). `server/.env.test` is the e2e equivalent — see the `e2e-test-writer` agent.
- `client/` reads `VITE_SERVER_URL` for the API base URL (defaults to `http://localhost:4000`).
- CORS on the server is locked to `CLIENT_URL` (default `http://localhost:5173`) with `credentials: true`.
