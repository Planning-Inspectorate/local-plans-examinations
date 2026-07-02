# Cypress E2E tests

This folder contains the Cypress tests for the Local Plans front office and back office apps.

The tests run against real local app instances:

- Manage: `http://localhost:8090`
- Portal: `http://localhost:8080`
- SQL Server: Docker Compose service `mssql`

## Local setup

Run these commands from the repo root.

1. Install Node 22 and Docker.
2. Install dependencies:

   ```bash
   npm i
   ```

3. Create local env files from the examples:

   ```bash
   cp packages/database/.env.example packages/database/.env
   cp apps/manage/.env.example apps/manage/.env
   cp apps/portal/.env.example apps/portal/.env
   ```

4. For local back office testing, either add the real `AUTH_*` values to `apps/manage/.env` or set:

   ```text
   AUTH_DISABLED=true
   ```

5. Start SQL Server and apply migrations:

   ```bash
   docker compose up -d mssql
   npm run db-generate
   npm run db-migrate-dev
   ```

6. Start the app you want to test in a separate terminal:

   ```bash
   npm run dev --workspace=local-plans-manage
   ```

   or:

   ```bash
   npm run dev --workspace=local-plans-portal
   ```

If you change env values, restart the relevant app before rerunning tests.

## Running tests

Run Cypress commands from the repo root.

Manage:

```bash
npm run cy:manage:smoke
npm run cy:manage:regression
npm run cy:manage:all
npm run cy:open:manage
```

Portal:

```bash
npm run cy:portal:smoke
npm run cy:portal:regression
npm run cy:portal:all
npm run cy:open:portal
```

The target app is controlled by `TEST_TARGET` in `cypress.config.ts`. If no target is set, Cypress defaults to `portal`.

Reports are written to `cypress/reports`.

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

## Pipeline

The E2E pipeline is `.azure/pipelines/e2e.yml`.

It runs on PRs and main when relevant files change, including:

- `apps/manage/**`
- `apps/portal/**`
- `cypress/**`
- `packages/**`
- pipeline, Docker and package files

Older PR runs are cancelled when a new commit is pushed.

The pipeline uses `.azure/pipelines/steps/run-local-e2e.yml` to:

- detect whether manage, portal or both test areas need to run
- install Node 22
- run `npm ci`
- generate the Prisma client
- build the relevant app
- start local SQL Server with Docker Compose
- apply migrations
- start the relevant local app
- wait for the `/health` endpoint
- run Cypress against the local app
- publish Cypress reports on failure

Tests are split across two shards so the E2E feedback comes back quicker.

## Common issues

If Cypress says the server is not running, check the matching app is started:

```bash
npm run dev --workspace=local-plans-manage
npm run dev --workspace=local-plans-portal
```

If migrations cannot reach SQL Server, wait a few seconds after `docker compose up -d mssql` and rerun `npm run db-migrate-dev`.

If Notify is not part of the test you are running, keep `GOV_NOTIFY_DISABLED=true` locally to avoid noisy email errors.
