# AgroDitari

Mobile-first PWA that helps small farmers keep records of parcels, crops, field activities, inputs, expenses and harvests in one place — and see what each parcel and season actually cost and yielded.

Bachelor thesis project, FIMK.

**Thesis title (AL):** Zhvillimi i një aplikacioni për menaxhimin e aktiviteteve bujqësore, shpenzimeve dhe të korrave
**Thesis title (EN):** Development of an Application for Managing Agricultural Activities, Expenses, and Harvests

**Demo:** _not deployed yet_

> **Status:** early development. The project scaffold is in place; features below are planned and not yet implemented. This README is updated as work lands.

---

## The problem

Small farmers usually track their work on paper or in scattered spreadsheets. Because expenses are never linked to the parcel or crop they belong to, three questions stay unanswered: what did this season cost, what did it yield, and did it make money.

AgroDitari records the data once, on a phone, in the field — and derives the rest.

## Scope

Planned for the first version:

- Email/password authentication, with each user seeing only their own data
- Farms and parcels (name, area, general location, notes)
- Crops and seasons (planting date, planted area, status, expected and actual harvest date)
- Activity log: soil preparation, planting, irrigation, fertilizing, treatment, manual labour, harvesting
- Inputs and expenses by category: seeds, fertilizer, pesticides, fuel, labour, equipment, other
- Harvest records (date, quantity, unit, quality) and optional sales
- Dashboard per parcel and season: total expenses, quantity harvested, yield, cost per unit, revenue, simple margin
- Search, filtering and history
- Reminders for upcoming activities
- CSV and PDF export
- Responsive, installable PWA

Deliberately **out of scope** for this version: IoT sensors, automated irrigation, weather forecasting, AI recommendations, marketplace, online payments, full accounting, institutional integrations, heavy machinery management, multi-user farms, and full offline sync.

The full requirements specification (Albanian) lives in [`docs/`](docs/).

## Conventions

| | |
|---|---|
| Currency | EUR |
| Area | ha / m² |
| Quantity | kg / ton |
| UI language | Albanian |

Units are always stored alongside their value.

**Derived values:**

| Value | Formula |
|---|---|
| Expense amount | quantity × unit price |
| Yield | quantity harvested / planted area |
| Cost per unit | total expenses / quantity harvested |
| Revenue | Σ (quantity sold × unit price) |
| Simple margin | revenue − total expenses |

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **PostgreSQL** _(hosting provider to be confirmed)_
- **ESLint**
- Deployment: Vercel

## Requirements

- Node.js **22.x** — other versions are not supported
- npm 10+

## Setup

```bash
git clone https://github.com/ArtSurdulli/agroditari.git
cd agroditari
npm install
```

### Environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

`.env` is git-ignored and must never be committed.

## Usage

Start the dev server:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

## Project structure

```
agroditari/
├── app/            # routes, layouts and pages (App Router)
├── public/         # static assets
├── docs/           # thesis documentation: spec, diagrams, wireframes
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Documentation

| Document | Location |
|---|---|
| Requirements specification | `docs/` |
| Use-case diagram | _pending_ |
| ER diagram | _pending_ |
| Architecture diagram | _pending_ |
| Wireframes | _pending_ |
| Test report | _pending_ |

## Roadmap

Milestones toward the 30 September 2026 deadline:

- [x] **17 Jul** — repository, initial README, requirements specification
- [ ] **24 Jul** — use-case diagram, ER diagram, wireframes, project configuration
- [ ] **7 Aug** — authentication, farms, parcels, crops/seasons, activities
- [ ] **21 Aug** — expenses, harvests, dashboard, filtering, reports
- [ ] **4 Sep** — security, validation, responsive/PWA, demo data
- [ ] **11 Sep** — testing, evaluation, technical documentation
- [ ] **18 Sep** — first complete draft of the thesis
- [ ] **25 Sep** — corrections, demo, final version

## Author

Art Surdulli — FIMK

## License

Academic work submitted for a Bachelor thesis. Not licensed for reuse.
