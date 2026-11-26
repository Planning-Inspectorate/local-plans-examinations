#!/usr/bin/env bash

set -euo pipefail

LOCAL_DB_CONTAINER="local-plans-mssql"
LOCAL_DB_USER="${DB_USER:-sa}"
LOCAL_DB_PASSWORD="${DB_PASS:-DockerDatabaseP@22word!}"
LOCAL_DB_NAME="${DB_NAME:-local-plans}"
SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TRIGGER_FILE="${SCRIPT_DIRECTORY}/../src/local/trg_setVirusCheckStatus.sql"

echo "Installing local virus-check trigger..."

docker exec -i "${LOCAL_DB_CONTAINER}" \
	/opt/mssql-tools/bin/sqlcmd \
	-S localhost \
	-U "${LOCAL_DB_USER}" \
	-P "${LOCAL_DB_PASSWORD}" \
	-d "${LOCAL_DB_NAME}" \
	-b < "${TRIGGER_FILE}"

echo "Local virus-check trigger installed."
