# E2E Testing using Cypress

## Initial local set-up 
- install Node 24
- install Docker
- npm i
- docker compose up -d mssql (to start a database)
- copy packages/database/.env.example to .env
- copy apps/manage/.env.example to .env
- copy apps/portal/.env.example to .env
- Get the AUTH_* env vars from a dev and add to apps/manage/.env (or set AUTH_DISABLED=false)
- npm run db-generate
- run npm run db-migrate-dev to setup the database
- run apps/manage>npm run dev to start the manage app
- run apps/portal>npm run dev to start the portal app

## Running Cypress tests locally
Run the manage or portal app, and run the Docker container to begin testing locally

The Cypress tests run with a TEST_TARGET = (manage or portal), when no target is specified Cypress will default the test target to portal, specified in ../cypress.config.ts


### Cypress commands
Run from root directory 
- npm run cy:portal:smoke
- npm run cy:portal:regression
- npm run cy:portal:all
- npm run cy:manage:smoke
- npm run cy:manage:regression
- npm run cy:manage:all

### Open Cypress graphical interface commands
Run from root directory 
- npm run cy:open:portal 
- npm run cy:open:manage

## Running Cypress in the Azure pipeline
The Cypress tests are integrated into the Microsoft Azure pipeline, configured using YAML in the ../.azure/pipelines directory.

The E2E pipeline is configured in ../.azure/pipelines/e2e.yml

The Azure pipeline runs tests against the local portal or manage app (depending on changed file paths) with a local Docker database.

Test execution is split across 2 shards.

## File structure

    cypress/
        e2e/
            manage/
                create-case/
                    journey/
                    page-content/
                    validation/

                smoke/

            portal/  

        fixtures/   
            manage/

        flows/

        page-objects/
            manage/
                create-case/

            portal/
        
        reports/

        support/

        types/

            
