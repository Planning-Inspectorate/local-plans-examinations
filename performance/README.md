# Local Plans Performance Tests

This is a small JMeter baseline suite for the deployed Test environment.

It is intended to collect early performance evidence. It is not a full production load test and it does not define formal NFRs.

## What It Runs

The JMeter plan currently runs one Manage journey:

- All cases
- Case Overview, Gateway 2, Gateway 3 and Examination tabs
- Open the plan title form, save a change and load the Overview again to check it persisted

This is deliberately light first coverage. It hits real deployed routes and proves Manage can serve DB-backed pages and save a representative update under repeated traffic. Portal and file transfers are not included yet.

## Load Model

The pipeline exposes these values:

- `manageUsers`
- `rampSeconds`
- `durationSeconds` (hold time after ramp-up)
- `requestPauseMs`
- `readMs` and `saveMs` (p95 limits)

Defaults are deliberately small:

- 5 users
- 120 second ramp-up
- 600 second hold
- 10000ms pause between user actions

These are starter assumptions only. They should be replaced with agreed NFRs when available.

## Auth

Manage uses the existing environment-smoke Microsoft sign-in flow through Cypress. Each user signs in before the load starts, then JMeter uses their session cookies for HTTP requests. This measures server responses, not browser rendering.

The pipeline uses the existing smoke service-account credentials from the `pipeline_secrets` variable group. Login cookies stay private and are removed on exit.

## Data

The suite seeds one disposable case per user and deletes only its own cases and title-change history afterwards, including after failures. It never clears the shared database or reseeds reference data.

Forced termination or agent loss can leave records behind; the results directory's run ID identifies them for manual cleanup.

## Running Locally

Install Java and JMeter, start Manage with authentication and Notify disabled against an initialized `local-plans-performance` database, then run:

```bash
SQL_CONNECTION_STRING='<local performance database connection>' MANAGE_BASE_URL=http://localhost:18090 npm run perf:local
```

The local script uses one user and a 30 second duration so it is quick when changing the JMeter plan. The defaults are in `performance/scripts/run-local.sh`. Local runs verify the wiring; use Test for performance evidence.

## Running Against Test

Run [performance.yml](../.azure/pipelines/performance.yml) in Azure DevOps with the desired load parameters. Test must already be deployed and seeded with reference data, and the agent needs access to its database. Avoid deployments or overlapping load tests during a run.

Manage's Test configuration sets `AUTH_RATE_LIMIT_MAX=10000` per IP over 15 minutes so the load users can share an agent without hitting the normal 600-request cap.

## Pipeline

`.azure/pipelines/performance.yml` targets Test and can be run manually. Scheduled runs use the defaults on main at **07:00 and 19:00 UTC**.

It:

- downloads Java 17 for JMeter
- downloads Apache JMeter 5.6.3
- authenticates to Azure
- gets the Test database connection and seeds disposable cases
- prepares independent Manage sessions using the existing smoke authentication
- runs `performance/local-plans.jmx`
- publishes the JTL and HTML report
- fails if any JMeter sample/assertion fails, an operation has too few samples or its p95 exceeds the chosen limit

Open `<run ID>/html/index.html` in the `performance-results` artifact for the full load period, including ramp-up. Raw results, logs, workload settings, case references and a pass/fail summary are saved alongside it.

When a page returns an error summary, its text is included in the failed assertion in `raw.jtl` and the HTML report. Full response bodies, request headers and session cookies are not saved in the results.

Each operation needs at least 20 samples on Test. The starting p95 limits are **2 seconds for reads and 3 seconds for saves**; these are provisional, not agreed service targets.
