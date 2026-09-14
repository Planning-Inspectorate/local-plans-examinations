# Local Plans Performance Tests

This is a small JMeter baseline suite for the deployed Test environment.

It is intended to collect early performance evidence. It is not a full production load test and it does not define formal NFRs.

## What It Runs

The pipeline confirms the Portal home page is reachable before JMeter starts. That check is a prerequisite, not a load-test scenario.

The JMeter plan currently runs one simple request:

- Portal home page

This is deliberately light first coverage. It hits a real deployed route and proves the Portal can serve a DB-backed page under a small amount of repeated traffic.

Manage performance coverage is not included yet. Manage uses the normal MSAL/session/group guard flow, so it needs a signed-off machine-auth or browser-auth approach before it can be tested against deployed environments without bypassing authentication.

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

The deployed Portal is protected by Easy Auth.

In the pipeline, Azure DevOps authenticates with Azure, requests an Entra access token for the Portal app registration, and JMeter sends it as:

```text
Authorization: Bearer <token>
```

The pipeline uses `PORTAL_APP_REGISTRATION_ID` from the `pipeline_secrets` variable group as the token resource.

## Data

The suite does not seed or clean up data.

## Running Locally

Install JMeter, start Portal on `8080`, then run:

```bash
npm run perf:local
```

The local script uses one thread and a five second duration so it is quick when changing the JMeter plan. The defaults are in `performance/scripts/run-local.sh`.

You can also run JMeter directly:

```bash
jmeter -n \
  -t performance/local-plans.jmx \
  -l performance/results/local-plans-baseline.jtl \
  -e \
  -o performance/results/html-local \
  -JportalProtocol=http \
  -JportalHost=localhost \
  -JportalPort=8080 \
  -JportalAccessToken=local \
  -Jthreads=1 \
  -JrampSeconds=1 \
  -JdurationSeconds=5 \
  -JrequestPauseMs=100
```

## Running Against Test

Install JMeter, sign in with Azure CLI, get a Portal access token, then run:

```bash
export PORTAL_ACCESS_TOKEN="$(az account get-access-token \
  --resource "<portal app registration id>" \
  --query accessToken \
  -o tsv)"

jmeter -n \
  -t performance/local-plans.jmx \
  -l performance/results/local-plans-baseline.jtl \
  -e \
  -o performance/results/html \
  -JportalProtocol=https \
  -JportalHost=local-plans-portal-test.planninginspectorate.gov.uk \
  -JportalAccessToken="$PORTAL_ACCESS_TOKEN" \
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
- authenticates to Azure
- gets a Portal Entra access token
- checks Portal availability
- runs `performance/local-plans.jmx`
- publishes the JTL and HTML report
- fails if any JMeter sample/assertion fails

Response-time guardrails should be added later once we have baseline results or formal NFRs.
