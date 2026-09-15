# Cypress E2E tests

This folder contains the Cypress tests for the Local Plans front office and back office apps.

The tests run against real local app instances:

- Manage: `http://localhost:8090`
- Portal: `http://localhost:8080`
- SQL Server: Docker Compose service `mssql`

## Local setup

Run these commands from the repo root.

1. Install Node 24.18 or later and Docker Desktop.

2. Make sure your branch is up to date:

   ```bash
   git fetch origin
   git pull --rebase
   ```

3. Create local env files from the examples:

   ```bash
   cp packages/database/.env.example packages/database/.env
   cp apps/manage/.env.example apps/manage/.env
   cp apps/portal/.env.example apps/portal/.env
   ```

4. Install dependencies:

   ```bash
   npm ci
   ```

5. For local back office testing, set `AUTH_DISABLED` in `apps/manage/.env` depending on what you're testing:

   - **Most manual and automated tests**: leave auth disabled, no sign-in required:

     ```text
     AUTH_DISABLED=true
     ```

   - **Testing user sign-in specifically** (for example, confirming a user's name is recorded against a case): enable real sign-in and populate the `AUTH_*` fields with real values:
     (`AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_TENANT_ID`, `AUTH_GROUP_APPLICATION_ACCESS`, `ENTRA_GROUP_ID_CASE_OFFICERS`, `ENTRA_GROUP_ID_INSPECTORS`)

     ```text
     AUTH_DISABLED=false
     ```

6. Start the local Docker services:

   ```bash
   docker compose pull
   docker compose up -d
   ```

7. Apply migrations and seed Cypress test data:

   ```bash
   npm run db-migrate-dev
   npm run db-clear
   node packages/database/src/seed/seed-cy.ts
   ```

8. Start the app you want to test in a separate terminal:

   ```bash
   npm run dev --workspace=local-plans-manage
   ```

   or:

   ```bash
   npm run dev --workspace=local-plans-portal
   ```

If you change env values, restart the relevant app before rerunning tests.

If Prisma says a migration was modified after it was applied, reset the local database and seed it again:

```bash
npm run db-reset
npm run db-clear
node packages/database/src/seed/seed-cy.ts
```

Only use `db-reset` against your local development database.

## Running tests

Run Cypress commands from the repo root.

Manage:

```bash
npm run cy:manage:smoke
npm run cy:manage:regression
npm run cy:manage:all
npm run cy:manage:accessibility
npm run cy:open:manage
```

Portal:

```bash
npm run cy:portal:smoke
npm run cy:portal:regression
npm run cy:portal:all
npm run cy:portal:accessibility
npm run cy:open:portal
```

Cross-service:

```bash
npm run cy:cross-service:all
npm run cy:open:cross-service
```

The target app is controlled by `TEST_TARGET` in `cypress.config.ts`. If no target is set, Cypress defaults to `portal`.

Reports are written to `cypress/reports`.

Accessibility checks use `cypress-axe` on a small set of Manage and Portal pages. The checks only run the WCAG A/AA tags. Passing these tests does not prove the service is fully compliant - it just helps catch issues axe can spot. The external audit still covers the wider checks.

If axe finds a new violation, treat it like any other failing quality gate. 

## Test data

Database helpers are available from the root `package.json`:

```bash
npm run db-clear
npm run db-seed
npm run db-reset
```

Some Cypress specs also seed data through Cypress tasks, for example:

- `seedDb`: creates case data for tests such as case overview
- `seedCase`: creates a portal case without an OTP
- `seedOtp`: creates portal login data and returns an OTP for the test
- `clearDb`: clears the database between tests that need a clean state

Journey tests should prefer creating data through the UI where that is the behaviour under test.

## Folder structure

```text
cypress/
  e2e/
    manage/
      case-overview/
        page-content/
      create-case/
        journey/
        page-content/
        validation/
      smoke/
    portal/
      cookies/
        validation/
      login/
        journey/
        page-content/
        validation/
  fixtures/
  flows/
  page-objects/
  reports/
  support/
```

Use the folders by intent:

- `journey`: happy path or end-to-end user journeys
- `validation`: form validation and error handling
- `page-content`: page text, links and static content
- `smoke`: small checks that prove the app is reachable
- `page-objects`: selectors and page-level actions
- `flows`: reusable multi-page flows
- `fixtures`: reusable test data
- `support`: Cypress commands and global setup

### File uploads (Azurite)

Portal document upload screens store files in Azure Blob Storage. Locally this is emulated with Azurite from Docker Compose.

```bash
docker compose up -d azurite
```

Azurite data is stored under `tmp/azurite-data` by default and is gitignored.

## Pipeline

The E2E pipeline is `.azure/pipelines/e2e.yml`.

It runs on PRs and main when relevant files change, including:

- `apps/manage/**`
- `apps/portal/**`
- `cypress/**`
- `packages/**`
- pipeline, Docker and package files

Older PR runs are cancelled when a new commit is pushed.

The pipeline uses `.azure/pipelines/steps/run-local-e2e.yml` as the shared runner for Manage, Portal and cross-service E2E. The runner is given a target and then:

- detects whether that target needs to run
- install Node 24
- run `npm ci`
- generate the Prisma client
- build the relevant app or apps
- start local SQL Server with Docker Compose
- apply migrations
- start the relevant local app
- wait for the `/health` endpoint
- run Cypress against the target
- publish Cypress reports on failure

The accessibility specs live under the existing Manage and Portal Cypress folders, so they run in the normal PR/main E2E jobs whenever those suites run. There is no separate accessibility pipeline job.

The PR/main E2E pipeline also runs the small cross-service suite through the same runner. Cross-service starts both Manage and Portal against the same database and checks service-level behaviour across the app boundary.

Tests are split across two shards so the E2E feedback comes back quicker.

The dedicated cross-service E2E pipeline also runs `cypress/e2e/cross-service/**/*`. This is for scheduled/manual service-level checks, not for repeating the full Manage and Portal UI suites.

It can be manually triggered when needed and also runs on the weekday morning schedule.

## Common issues

If Cypress says the server is not running, check the matching app is started:

```bash
npm run dev --workspace=local-plans-manage
npm run dev --workspace=local-plans-portal
```

If migrations cannot reach SQL Server, wait a few seconds after `docker compose up -d mssql` and rerun `npm run db-migrate-dev`.

If migrations say your local database needs to be reset:

```bash
npm run db-reset
npm run db-clear
node packages/database/src/seed/seed-cy.ts
```

If Notify is not part of the test you are running, keep `GOV_NOTIFY_DISABLED=true` locally to avoid noisy email errors.
