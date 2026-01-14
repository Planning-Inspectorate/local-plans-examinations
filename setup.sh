#!/bin/bash
DB_USER=${DB_USER:-sa}
DB_PASS=${DB_PASS:-DockerDatabaseP@22word!}
DB_NAME=${DB_NAME:-local-plans}

echo "checking if docker, node, and npm are installed..."
if ! docker -v > /dev/null 2>&1 || ! node -v > /dev/null 2>&1 || ! npm -v > /dev/null 2>&1; then
  echo "please check you have docker compose, node, and npm installed"
  exit 1
fi
echo -e "\e[32m✔\e[0m check complete"

echo "installing packages..."
if ! npm i; then
  echo "failed to install packages"
  exit 1
fi
echo -e "\e[32m✔\e[0m packages installed"

if ! docker compose up -d; then
  echo "failed to launch db"
  exit 1
fi

echo "creating .env files for dev environment"
if ! cp apps/manage/.env.example apps/manage/.env; then
  echo "failed to create .env file for manage"
  exit 1
fi

if ! sed -i "s|SQL_CONNECTION_STRING=<populate-SQL-connection-string>|SQL_CONNECTION_STRING=\"sqlserver://localhost:1433;database=${DB_NAME};user=${DB_USER};password=${DB_PASS};trustServerCertificate=true\"|g" apps/manage/.env; then
  echo "failed to set SQL connection string for 'manage' app"
  exit 1
fi

if ! sed -i 's/AUTH_DISABLED=false/AUTH_DISABLED=true/g' apps/manage/.env; then
    echo "failed to set AUTH_DISABLED to true for 'manage' app"
    exit 1
fi

if ! cp apps/portal/.env.example apps/portal/.env; then
  echo "failed to create .env for 'portal' app"
  exit 1
fi

if ! sed -i "s|SQL_CONNECTION_STRING=<populate-SQL-connection-string>|SQL_CONNECTION_STRING=\"sqlserver://localhost:1433;database=${DB_NAME};user=${DB_USER};password=${DB_PASS};trustServerCertificate=true\"|g" apps/portal/.env; then
  echo "failed to set SQL connection string for 'portal' app"
  exit 1
fi

if ! sed -i 's/AUTH_DISABLED=false/AUTH_DISABLED=true/g' apps/portal/.env; then
    echo "failed to set AUTH_DISABLED to true, for 'portal' app"
    exit 1
fi

if ! cp packages/database/.env.example packages/database/.env; then
  echo "failed to copy database .env file."
  exit 1
fi

echo -e "\e[32m✔\e[0m .env files created"

echo "waiting for database..."
attempts=0
max_attempts=5

while [ $attempts -lt $max_attempts ]; do
  if docker exec local-plans-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U "${DB_USER}" -P "${DB_PASS}" -Q "SELECT 1" > /dev/null 2>&1; then
    echo "database is ready!"
    break
  fi
  attempts=$((attempts + 1))
  echo "waiting for database... (attempt $attempts/$max_attempts)"
  if [ $attempts -lt $max_attempts ]; then
    sleep 2
  fi
done

if [ $attempts -eq $max_attempts ]; then
  echo "database failed to become ready after $max_attempts attempts"
  exit 1
fi


if ! npm run db-migrate-dev; then
  echo "database migration failed"
  exit 1
fi

if ! npm run db-generate; then
  echo "failed to generate database"
  exit 1
fi

echo -e "\e[32m✔\e[0m setup complete and database is running "
exit 0
