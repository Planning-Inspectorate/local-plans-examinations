#!/bin/bash

read -rp "Do you have docker installed? (y/n): " docker_installed
if [[ "$docker_installed" == "n" || "$docker_installed" == "N" ]]; then
  echo "Docker is required. Exiting setup."
  exit 1
fi

if ! npm i; then
  echo "npm install failed."
  exit 1
fi

if ! docker compose up -d; then
  echo "Docker compose failed."
  exit 1
fi

if ! cp apps/manage/.env.example apps/manage/.env; then
  echo "Failed to copy manage .env file."
  exit 1
fi

if ! sed -i 's|SQL_CONNECTION_STRING=<populate-SQL-connection-string>|SQL_CONNECTION_STRING="sqlserver://localhost:1433;database=service-name;user=sa;password=DockerDatabaseP@22word!;trustServerCertificate=true"|g' apps/manage/.env; then
  echo "Failed to set SQL connection string for 'manage' app"
  exit 1
fi

if ! sed -i 's/AUTH_DISABLED=false/AUTH_DISABLED=true/g' apps/manage/.env; then
    echo "Failed to set AUTH_DISABLED to true for 'manage' app"
    exit 1
fi

if ! cp apps/portal/.env.example apps/portal/.env; then
  echo "Failed to create .env for 'portal' app"
  exit 1
fi

if ! sed -i 's|SQL_CONNECTION_STRING=<populate-SQL-connection-string>|SQL_CONNECTION_STRING="sqlserver://localhost:1433;database=service-name;user=sa;password=DockerDatabaseP@22word!;trustServerCertificate=true"|g' apps/portal/.env; then
  echo "Failed to set SQL connection string for 'portal' app"
  exit 1
fi

if ! sed -i 's/AUTH_DISABLED=false/AUTH_DISABLED=true/g' apps/portal/.env; then
    echo "Failed to set SQL connection string for 'portal' app"
    exit 1
fi

if ! cp packages/database/.env.example packages/database/.env; then
  echo "Failed to copy database .env file."
  exit 1
fi

echo "Waiting for database to be ready..."
attempts=0
max_attempts=5

while [ $attempts -lt $max_attempts ]; do
  if docker exec local-plans-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "DockerDatabaseP@22word!" -Q "SELECT 1" > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  attempts=$((attempts + 1))
  echo "Waiting for database... (attempt $attempts/$max_attempts)"
  if [ $attempts -lt $max_attempts ]; then
    sleep 2
  fi
done

if [ $attempts -eq $max_attempts ]; then
  echo "Database failed to become ready after $max_attempts attempts"
  exit 1
fi


if ! npm run db-migrate-dev; then
  echo "Database migration failed."
  exit 1
fi

echo -e "Setup complete.Would you like to run the web apps? (y/n):"
read -r run_or_exit
if [[ "$run_or_exit" == "y" || "$run_or_exit" == "Y" ]]; then
  npm run dev
fi

exit 0