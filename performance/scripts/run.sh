#!/usr/bin/env bash
set -euo pipefail
umask 077

export PERFORMANCE_RUN_ID="$(node -e 'console.log(crypto.randomUUID())')"
export PERFORMANCE_PRIVATE_DIR="${PERFORMANCE_PRIVATE_DIR:-${TMPDIR:-/tmp}/local-plans-performance}-$PERFORMANCE_RUN_ID"
export PERFORMANCE_RESULTS_DIR="${PERFORMANCE_RESULTS_DIR:-performance/results}/$PERFORMANCE_RUN_ID"
jmeter="${JMETER_BIN:-jmeter}"
command -v "$jmeter" >/dev/null || { echo 'JMeter is required'; exit 1; }

mkdir "$PERFORMANCE_PRIVATE_DIR"
mkdir -p "$PERFORMANCE_RESULTS_DIR"
cleanup() {
  result=$?
  trap - EXIT
  node performance/scripts/data.ts cleanup || result=1
  rm -rf "$PERFORMANCE_PRIVATE_DIR"
  printf '%s\n' "$result" > "$PERFORMANCE_RESULTS_DIR/exit-code.txt"
  echo "Performance run exit status: $result. Results: $PERFORMANCE_RESULTS_DIR"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

run_stage() {
  local stage="$1" result=0
  shift
  echo "Starting $stage"
  "$@" || result=$?
  echo "$stage exit status: $result"
  return "$result"
}

node performance/scripts/settings.ts
node performance/scripts/data.ts seed
run_stage "Cypress authentication" env -u ELECTRON_RUN_AS_NODE node node_modules/cypress/bin/cypress run --browser chrome \
  --config-file performance/auth.config.ts \
  --config chromeWebSecurity=false,experimentalModifyObstructiveThirdPartyCode=true

run_stage "JMeter load test" "$jmeter" -n -t performance/local-plans.jmx \
  -q performance/jmeter.properties -q "$PERFORMANCE_PRIVATE_DIR/jmeter.properties" \
  -l "$PERFORMANCE_RESULTS_DIR/raw.jtl" -j "$PERFORMANCE_RESULTS_DIR/jmeter.log"
run_stage "JMeter report generation" "$jmeter" -g "$PERFORMANCE_RESULTS_DIR/raw.jtl" -o "$PERFORMANCE_RESULTS_DIR/html" \
  -q performance/jmeter.properties -q "$PERFORMANCE_PRIVATE_DIR/jmeter.properties" \
  -j "$PERFORMANCE_RESULTS_DIR/report.log"
run_stage "Performance thresholds" node performance/scripts/results.ts
