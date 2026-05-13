# patient-biomarkers

Viewer for patient biomarker history. Fetches test results from a mock API, stores them in Postgres, renders them as a table and a set of line charts per biomarker.

After setup it runs at http://localhost:5173 (UI) and http://localhost:3001 (API).

**Stack:** React 19, Vite, Tailwind CSS, tRPC, Fastify, Prisma, PostgreSQL, TypeScript.

## Prerequisites

- Node.js (v20+)
- Docker

## Setup

```sh
docker compose up -d --wait
cp packages/server/.env.example packages/server/.env
npm install
npm run db:migrate
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start server and client concurrently |
| `npm run dev:server` | Start Fastify API server (tsx watch) |
| `npm run dev:client` | Start Vite dev server |
| `npm test` | Run all tests (server + client) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |

## How it fits together

The mock API at `https://mockapi-furw4tenlq-ez.a.run.app/data` returns a random patient with several test results per call. The server fetches it, validates the response with Zod, then upserts patients and test results inside a single transaction. A composite unique on `(patient_id, date_testing)` keeps repeated fetches idempotent.

The client gets the patient list through tRPC's `getAll` query. Selecting a patient renders a table with all their results plus seven line charts, one per biomarker. There's also a form to add a result manually (`addData`).

End-to-end types come from the server's `AppRouter` type. The client imports it through the workspace (`@patient-biomarkers/server/router`), so request and response shapes of every procedure are known to the compiler without code generation.

## Notes on a few choices

**Decimal for biomarker values.** The Prisma schema uses `Decimal(10, 4)` instead of `Float`. Medical values shouldn't accumulate floating-point error if anything ever does arithmetic on them server-side. The downside is Prisma returns `Decimal` objects, which JSON serializes to strings. To avoid leaking that into the client, `db.ts` has a `$extends` block that calls `.toNumber()` at the ORM boundary. The client never sees Decimal.

**superjson transformer.** tRPC uses superjson on both sides. Without it, `Date` fields would round-trip as strings even though TypeScript types claim they're `Date`. With superjson the types stay honest, and code like `birthdate.toISOString()` works without a `new Date(...)` wrapper.

**`update: {}` on the addData upsert.** The form is "add a test result", not "edit the patient". If `clientId` matches an existing patient, demographics are not touched. The UI also locks the birthdate, gender and ethnicity inputs when the typed `clientId` matches an existing patient, so the user isn't typing into fields the server is going to ignore.

**Two-click reset.** Reset deletes everything. Native `window.confirm()` looks out of place against Tailwind UI, so the button flips to "Confirm Reset" on first click and reverts to "Reset" after three seconds of inactivity. Other action buttons clear the confirm state too, so you can't half-arm a reset and then forget about it.

**Mixed-units detection in charts.** A patient can have test results with different units for the same biomarker (for example mg/dL and mmol/L for creatinine). Plotting both on one Y axis would be misleading, so the chart for that biomarker is replaced with a small notice and the values stay readable in the table above.

**Strict input validation.** Both the mock API parser and `addData` use Zod schemas with literal unions for `gender` and `ethnicity` and `.finite()` on biomarker numbers. If the mock API ever returns something unexpected, the import fails loudly instead of writing garbage rows.

## Tests

Vitest on both sides, run with `npm test` from the root.

**Server unit tests** (`router.test.ts`): `parseDateOnly` timezone handling, plus Zod schema validation for the mock API parser and the `addData` input (rejects out-of-range gender/ethnicity, NaN biomarkers, malformed dates, empty clientId).

**Server integration tests** (`router.integration.test.ts`): tRPC procedures called directly through `appRouter.createCaller(...)` against a real Postgres test database. The `fetch` to the mock API is stubbed with `vi.stubGlobal`. Covers `fetchFromApi` (import, idempotent re-imports, demographic updates, error paths), `getAll` (sort order, Decimal-to-number conversion), `addData` (create, `update: {}` preserves demographics, duplicate date upsert) and `reset` (cascade delete).

A separate `patient_biomarkers_test` database is created and migrated automatically on the first test run via `vitest.global-setup.ts`. Tests run with `fileParallelism: false` and `beforeEach` truncates the schema to keep them isolated.

**Client tests**: `formatDate` UTC behaviour, plus a component test for `BiomarkerCharts` covering the mixed-units warning and the empty state. Recharts' `ResponsiveContainer` is mocked because it needs a real layout to render under jsdom.

## What isn't here

- No authentication. Every endpoint is public.
- The mock API URL is hardcoded in `router.ts` because it's an assignment fixture.
- No production deploy setup. The Docker compose file only runs Postgres, not the app itself.
- Reference ranges aren't shown on the charts. Useful for a clinical viewer, but out of scope here.
