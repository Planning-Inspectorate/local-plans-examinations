#!/usr/bin/env bash
set -euo pipefail

results_dir="performance/results"
jtl_file="$results_dir/local-plans-baseline.jtl"
html_dir="$results_dir/html-local"

mkdir -p "$results_dir"
rm -rf "$jtl_file" "$html_dir"

jmeter -n \
  -t performance/local-plans.jmx \
  -l "$jtl_file" \
  -e \
  -o "$html_dir" \
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

if grep -q ',false,' "$jtl_file"; then
  echo "One or more JMeter samples failed. See $jtl_file and $html_dir/index.html."
  exit 1
fi
