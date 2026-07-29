@AGENTS.md
# AgroDitari — Rregullat e projektit për agjentët AI

Ky skedar përmban vendimet arkitekturore dhe konventat e projektit. Lexoje para se
të shkruash kod. Mos i ndrysho këto vendime pa e pyetur pronarin e projektit.

---

## 0. Konteksti i projektit

AgroDitari është një PWA mobile-first për fermerë të vegjël, për të gjurmuar ferma,
parcela, sezone kulturash, aktivitete, inpute, shpenzime dhe korrje, me raportim
mbi kosto/njësi dhe marxhin. Tezë Bachelor, jo produkt komercial.

**Jashtë scope-it (mos i ndërto):** IoT, automatizim ujitjeje, AI, marketplace,
kontabilitet i plotë, integrime institucionale, të dhëna moti/satelitore.

---

## 1. Stack-u (i fiksuar — mos e ndrysho)

- Next.js 16, App Router, TypeScript, **pa `src/`**
- Tailwind CSS + shadcn/ui (komponentët e UI-t)
- Prisma **6.x** (JO 7.x) + PostgreSQL i hostuar në Supabase
- Auth.js v5 (next-auth@beta) — autentikim me Credentials + JWT
- TanStack Query + axios për lexime interaktive në klient
- Upstash Redis për rate limiting
- Nodemailer (Gmail SMTP) për email
- Deploy: Vercel

Path alias: `@/*` → rrënja e projektit.

---

## 2. Rregulli kryesor: cilin mjet për çfarë pune

Mos e bëj të njëjtën punë në dy mënyra. Ndaj sipas llojit:

- **Mutacione (shkrime nga forma)** → **Server Actions**
  (krijo/ndrysho/fshi fermë, shto shpenzim, regjistrohu, kyçu)
- **Lexime interaktive (klient)** → **REST `/api/*` + axios + TanStack Query**
  (lista me kërkim/filtra, dashboard me tregues që rifreskohen)
- **Lexime statike (server)** → **Server Components** që thërrasin Prisma direkt
  (faqe detajesh që vetëm shfaqin të dhëna një herë, pa ndërveprim)

Mos e lexo të njëjtin burim një herë me axios dhe një herë me Server Component.
Zgjidh një rrugë për secilin rast dhe qëndro konsistent.

---

## 3. Autentikimi (i ndërtuar — mos e prek pa u kërkuar)

- Skedarët bërthamë: `auth.ts`, `auth.config.ts`, `proxy.ts` (JO `middleware.ts` —
  Next.js 16 e riemërtoi në `proxy.ts`, eksporti quhet `proxy`),
  `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`.
- Sesione **JWT** (e detyrueshme për Credentials). **Pa Prisma adapter** — mbajmë
  një skemë të vetme, pa tabela Account/Session.
- `auth.config.ts` është edge/proxy-safe: pa Prisma, pa bcrypt. Kallback-et
  jwt/session rrinë aty (vetëm kopjojnë fusha). `auth.ts` shton providers.
- Statusi i përdoruesit: `pending` → `active` pas verifikimit të email-it.
  Përdoruesit `pending` NUK kyçen dot (authorize() i refuzon).
- `proxy.ts` kthen **401 JSON** për `/api/*` (përveç `/api/auth/*`) nëse s'ka
  sesion ose statusi s'është `active`; ridrejton faqet e pambrojtura te `/login`.

---

## 4. Baza e të dhënave

- Skema jeton te `prisma/schema.prisma` dhe pasqyron ER diagramin. Mos shto
  modele/fusha pa u kërkuar; nëse mendon se duhet ndryshim skeme, NDALO dhe pyet.
- `prisma/migrations/` hyn në Git. Përdor `prisma migrate dev`.
- **KURRË** mos përdor `prisma db push`, `prisma migrate reset`, ose komanda
  shkatërruese. Mos e prek bazën përveçse përmes migrimeve.
- Vlerat e derivuara (kosto/njësi, marxhin) NUK ruhen si kolona — llogariten në
  raporte nga shpenzimet dhe korrjet.
- Kontrolli i pronësisë: çdo query për të dhëna të fermerit filtrohet me
  `userId` nga sesioni (p.sh. `where: { userId: session.user.id }`).

---

## 5. Shtresa API (`/api/*`)

- Përdor `withApiHandler` nga `lib/api/response.ts` për çdo route handler:
  try/catch i njësuar, ZodError → 422 me gabime fushash, e panjohura → 500 me
  mesazh gjenerik shqip. Kurrë mos nxirr detaje të brendshme te klienti.
- Kontrata e gabimit: `{ error: string, details?: unknown }`.
- Valido çdo input me zod (`lib/validations/`) para se të prekësh bazën.
- Rate limiting: përdor `checkRateLimit` nga `lib/rate-limit.ts` te endpoint-et e
  ndjeshme (login, resend verifikimi, shkrime). Upstash Redis; pa kredenciale
  bie në no-op (dev).
- Klienti axios: `lib/api/client.ts` (baseURL `/api`, interceptor 401 → `/login`).

---

## 6. Frontend / UI

- Komponentët e UI-t: shadcn/ui, të stiluar me temën e gjelbër.
- Ngjyra: primare `#15803D` (hover `#166534`), tint i lehtë `#DCFCE7`, sfond i
  ngrohtë off-white, tekst i errët, gri për ndihmesa. Semantikë konsistente:
  kosto në rritje = e kuqe, marxhin pozitiv = i gjelbër.
- Komponentët globalë te `components/common/` (PageHeader, StatCard, EmptyState,
  LoadingButton). Ripërdori; mos rikrijo variante ad-hoc.
- Mobile-first gjithmonë. Fusha/butona të mëdha për prekje. Kontrast i lartë.
- Rrumbullakos numrat që shfaqen.
- **Një valutë e vetme kudo** (euro). Mos ngurtëso valutën në dy vende — `shuma`
  në bazë është numër; valuta është vetëm shfaqje.

---

## 7. Gjuha dhe teksti

- Gjithë teksti drejt përdoruesit në **shqip**, sentence case.
- Kodi, emrat e variablave, komentet teknike në anglisht.
- Mesazhet e gabimit: të qarta, shqip, pa detaje teknike (p.sh. "Ndodhi një
  gabim. Provo përsëri.").

---

## 8. Siguria dhe sekretet

- Sekretet **vetëm** te `.env` (dhe te Environment Variables të Vercel për
  prodhim). KURRË mos i printo, mos i commit-o, mos i ngurtëso në kod.
- `.env` është te `.gitignore`. Fjalëkalimet ruhen vetëm si hash bcrypt.
- Mbrojtje anti-enumeration te resend/reset (mesazh gjenerik, pa zbuluar nëse
  email-i ekziston). Cooldown nga ana e serverit për ridërgim (jo vetëm te butoni).
- Percent-encode fjalëkalimin te connection string-et e Supabase nëse ka simbole.

---

## 9. Mënyra e punës me agjentin

- Bëj hapat në rend. **NDALO te çdo gabim** dhe trego output-in fjalë-për-fjalë;
  mos hamendëso rregullime.
- Mos i prek pjesët e ndërtuara e të testuara (sidomos auth) pa u kërkuar.
- Mos shto varësi apo abstraksione "për çdo rast". Ndërto hollë; abstraksionet
  dalin nga nevoja reale, jo nga hamendja.
- Sekretet i fut pronari vetë — kur duhet një çelës/fjalëkalim, NDALO dhe kërkoja.
- Në fund të një detyre: `npm run build` për të konfirmuar që kompilon, pastaj
  raporto skedarët e ndryshuar.
- Fallback-e për dev: pa kredenciale email/Redis, bie në console.log/no-op që
  zhvillimi lokal të mos prishet dhe të aktivizohet vetvetiu kur vendosen çelësat.
```
