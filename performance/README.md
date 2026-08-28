# Local Plans Performance Tests

This is a small JMeter baseline suite for the deployed Test environment.

It is intended to collect early performance evidence. It is not a full production load test and it does not define formal NFRs.

## What It Runs

The pipeline checks Manage `/health` and confirms the Portal home page is reachable before JMeter starts. Those checks are prerequisites, not load-test scenarios.

The JMeter plan then runs two simple requests:

- Manage home page
- Portal home page

These are deliberately light first checks. They hit the real app routes and prove both deployed apps can serve a DB-backed page under a small amount of repeated traffic.

## Load Model

The pipeline exposes these values:

- `threads`
- `rampSeconds`
- `durationSeconds`
- `requestPauseMs`

Defaults are deliberately small:

- 5 threads
- 30 second ramp-up
- 300 second duration
- 1000ms pause between requests

These are starter assumptions only. They should be replaced with agreed NFRs when available.

## Auth

The suite uses a Test-only performance auth token.

JMeter sends the token as:

- `X-Performance-Test-Auth: <token>`

Manage only accepts the bypass in Test, for `GET /`, and only when the header matches the configured token.

Portal keeps its existing Easy Auth setup, with the Test root path excluded so the home-page baseline request can run.

The same token value is stored in two Azure DevOps places:

- `PERFORMANCE_TEST_AUTH_TOKEN` in the `pipeline_secrets` variable group, used by `.azure/pipelines/performance.yml`
- `TF_VAR_performance_test_auth_token` on the `Infrastructure CD` pipeline, used by Terraform to set the Test Manage app setting

Terraform then exposes the token to the Test Manage app as:

```text
PERFORMANCE_TEST_AUTH_TOKEN
```

## Data

The suite does not seed or clean up data.

## Running Locally

Install JMeter, start Manage on `8090` and Portal on `8080`, then run:

```bash
npm run perf:local
```

For local runs, keep Manage auth disabled in `apps/manage/.env`:

```text
AUTH_DISABLED=true
```

The local script uses one thread and a five second duration so it is quick when changing the JMeter plan. The defaults are in `performance/scripts/run-local.sh`.

You can also run JMeter directly:

```bash
jmeter -n \
  -t performance/local-plans.jmx \
  -l performance/results/local-plans-baseline.jtl \
  -e \
  -o performance/results/html-local \
  -JmanageProtocol=http \
  -JmanageHost=localhost \
  -JmanagePort=8090 \
  -JportalProtocol=http \
  -JportalHost=localhost \
  -JportalPort=8080 \
  -JperformanceAuthToken=local-performance-token \
  -Jthreads=1 \
  -JrampSeconds=1 \
  -JdurationSeconds=5 \
  -JrequestPauseMs=100
```

## Running Against Test

Install JMeter, set the Test auth token locally, then run:

```bash
export PERFORMANCE_TEST_AUTH_TOKEN="performance auth token"

jmeter -n \
  -t performance/local-plans.jmx \
  -l performance/results/local-plans-baseline.jtl \
  -e \
  -o performance/results/html \
  -JmanageProtocol=https \
  -JmanageHost=local-plans-manage-test.planninginspectorate.gov.uk \
  -JportalProtocol=https \
  -JportalHost=local-plans-portal-test.planninginspectorate.gov.uk \
  -JperformanceAuthToken="$PERFORMANCE_TEST_AUTH_TOKEN" \
  -Jthreads=5 \
  -JrampSeconds=30 \
  -JdurationSeconds=300 \
  -JrequestPauseMs=1000
```

## Pipeline

`.azure/pipelines/performance.yml` is manual only and targets Test.

It:

- downloads Java 17 for JMeter
- downloads Apache JMeter 5.6.3
- checks Manage health and Portal availability
- reads `PERFORMANCE_TEST_AUTH_TOKEN` from the `pipeline_secrets` variable group
- runs `performance/local-plans.jmx`
- publishes the JTL and HTML report
- fails if any JMeter sample/assertion fails

Response-time guardrails should be added later once we have baseline results or formal NFRs.
