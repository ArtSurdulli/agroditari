# AgroDitari — Project Rules for AI Agents

This file holds the project's architectural decisions and conventions. Read it
before writing any code. Do not change these decisions without asking the project
owner. This is a living document — when we make new decisions, add them here.

---

## 0. Project context

AgroDitari is a mobile-first PWA for small farmers to track farms, parcels, crop
seasons, activities, inputs, expenses, and harvests, with reporting on
cost-per-unit and margin. It is a Bachelor's thesis project, not a commercial
product.

**Out of scope (do NOT build):** IoT, irrigation automation, AI, marketplace,
full accounting, institutional integrations, weather/satellite data.

---

## 1. Stack (fixed — do not change)

- Next.js 16, App Router, TypeScript, **no `src/` directory**
- Tailwind CSS + shadcn/ui (UI components)
- Prisma **6.x** (NOT 7.x) + PostgreSQL hosted on Supabase
- Auth.js v5 (`next-auth@beta`) — Credentials + JWT auth
- TanStack Query + axios for interactive client reads
- Upstash Redis for rate limiting
- Nodemailer (Gmail SMTP) for email
- jose for signed verification tokens
- bcryptjs for password hashing
- Zod for validation
- Deploy target: Vercel
- Node.js: use the version pinned in the project (do not bump it silently)

Path alias: `@/*` → project root.

---

## 2. Core rule: which tool for which job

Do not do the same job two ways. Split by type:

- **Mutations (writes from forms)** → **Server Actions**
  (create/edit/delete farm, add expense, register, login)
- **Interactive reads (client)** → **REST `/api/*` + axios + TanStack Query**
  (lists with search/filters, dashboards with refreshing metrics)
- **Static one-off reads (server)** → **Server Components** calling Prisma directly
  (detail pages that just display data once, no interaction)

Never read the same source once via axios and once via a Server Component. Pick
one path per case and stay consistent. axios exists ONLY for interactive reads —
do not build an axios-based write layer.

---

## 3. Authentication (built — do not touch without being asked)

- Core files: `auth.ts`, `auth.config.ts`, `proxy.ts` (NOT `middleware.ts` —
  Next.js 16 renamed it to `proxy.ts`, the export is named `proxy`),
  `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`.
- **JWT** sessions (required for Credentials). **No Prisma adapter** — keep a
  single schema, no Account/Session tables.
- `auth.config.ts` is edge/proxy-safe: no Prisma, no bcrypt. The jwt/session
  callbacks live there (they only copy fields). `auth.ts` adds providers.
- User status: `pending` → `active` after email verification. `pending` users
  CANNOT log in (`authorize()` rejects them).
- `proxy.ts` returns **401 JSON** for `/api/*` (except `/api/auth/*`) when there
  is no session or status is not `active`; redirects protected pages to `/login`.

---

## 4. Database

- The schema lives in `prisma/schema.prisma` and mirrors the ER diagram. Do not
  add models/fields without being asked; if you think a schema change is needed,
  STOP and ask.
- `prisma/migrations/` is committed to Git. Use `prisma migrate dev`.
- **NEVER** use `prisma db push`, `prisma migrate reset`, or destructive
  commands. Do not touch the database except through migrations.
- Derived values (cost-per-unit, margin) are NOT stored as columns — they are
  computed in reports from expenses and harvests.
- Ownership check: every query for a farmer's data is filtered by `userId` from
  the session (e.g. `where: { userId: session.user.id }`).
- Two Supabase connection strings: pooled `DATABASE_URL` (port 6543) for the
  client, direct `DIRECT_URL` (port 5432) for migrations. Percent-encode symbols
  in the password.

---

## 5. API layer (`/api/*`)

- Use `withApiHandler` from `lib/api/response.ts` on every route handler: unified
  try/catch, ZodError → 422 with field errors, unknown → 500 with a generic
  Albanian message. Never leak internals to the client.
- Error contract: `{ error: string, details?: unknown }`.
- Validate every input with Zod (`lib/validations/`) before touching the database.
- Rate limiting: use `checkRateLimit` from `lib/rate-limit.ts` on sensitive
  endpoints (login, resend verification, writes). Upstash Redis; falls back to
  no-op without credentials (dev).
- axios client: `lib/api/client.ts` (baseURL `/api`, 401 interceptor → `/login`).
- Query keys: use the factory in `lib/query-keys.ts`; extend it per entity.

---

## 6. Frontend / UI

- UI components: shadcn/ui, styled with the green theme.
- Colors: primary `#15803D` (hover `#166534`), light tint `#DCFCE7`, warm
  off-white background, dark text, gray for secondary. Consistent semantics:
  rising cost = red, positive margin = green.
- Global components in `components/common/` (PageHeader, StatCard, EmptyState,
  LoadingButton). Reuse them; do not recreate ad-hoc variants.
- Mobile-first always. Large touch targets for fields/buttons. High contrast.
- Round displayed numbers.
- **One currency everywhere (euro).** Do not hardcode currency in two places —
  `shuma` in the database is a number; currency is display-only.
- No browser storage (localStorage/sessionStorage) in artifacts/components unless
  explicitly required; keep state in React or the server.

---

## 7. Language and copy

- All user-facing text in **Albanian**, sentence case.
- Code, variable names, and technical comments in English.
- Error messages: clear, Albanian, no technical details (e.g. "Ndodhi një gabim.
  Provo përsëri.").

---

## 8. Security and secrets

- Secrets **only** in `.env` (and Vercel Environment Variables for production).
  NEVER print, commit, or hardcode them.
- `.env` is in `.gitignore`. Passwords are stored only as bcrypt hashes.
- Anti-enumeration on resend/reset (generic message, never reveal whether the
  email exists). Server-side cooldown for resend (not just the button).
- `AUTH_SECRET` is generated with `openssl rand -base64 33` (NOT `npx auth
  secret`, which collides with another package).
- Never validate input on the client only — always validate again on the server.

---

## 9. Git conventions

- Conventional Commits: `type(scope): description`.
- Types: `feat` (feature), `fix` (bug fix), `chore` (config/deps/maintenance),
  `refactor`, `docs`, `style`, `test`.
- Scope is the area touched: `auth`, `farms`, `db`, `ui`, `api`, `core`, etc.
- Subject line: imperative mood, lowercase, under ~70 chars, no trailing period.
  Body explains what and why.
- Commit at stable, working points (build passes, feature works) — not when
  "perfect". Prefer small, logical commits over one giant one.
- Before committing, run `git status` and confirm `.env` is NOT staged.
- Always committed: `prisma/schema.prisma`, `prisma/migrations/`, `AGENTS.md`,
  all source. Never committed: `.env`, `node_modules/`, `.next/`.

---

## 10. Working with the agent

- Do steps in order. **STOP on any error** and show the output verbatim; do not
  guess at fixes.
- Do not touch built, tested parts (especially auth) without being asked.
- Do not add dependencies or abstractions "just in case". Build thin;
  abstractions emerge from real need, not speculation.
- The owner enters secrets — when a key/password is needed, STOP and ask for it.
- At the end of a task: run `npm run build` to confirm it compiles, then report
  the files changed.
- Dev fallbacks: without email/Redis credentials, fall back to
  `console.log`/no-op so local dev doesn't break and it activates automatically
  once the keys are set.
- Prefer editing existing files over creating parallel ones; keep the file tree
  clean and predictable.
