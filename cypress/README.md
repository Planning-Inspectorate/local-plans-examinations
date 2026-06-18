# E2E Testing using Cypress

## Initial local set-up 
- install latest LTS Node
- install Docker
- npm i
- docker compose up (to start a database)
- copy packages/database/.env.example to .env
- copy apps/manage/.env.example to .env
- copy apps/portal/.env.example to .env
- Get the AUTH_* env vars from a dev and add to apps/manage/.env (or set AUTH_DISABLED=false)
- run npm run db-migrate-dev to setup the database
- run apps/manage>npm run dev to start the manage app
- run apps/portal>npm run dev to start the portal app

## Running Cypress tests locally
The Cypress tests run using a TEST_TARGET of manage or portal. If it is not specified cypress will default to a test target of portal as set up in ../cypress.config.ts

To run cypress tests locally the local host and Docker container should be running.

### Cypress commands
Run from Cypress directory 

The command format is (cypress : TEST_TARGET : category)

- npm cy:portal:smoke
- npm cy:portal:regression
- npm cy:portal:all
- npm cy:manage:smoke
- npm cy:manage:regression
- npm cy:manage:all

### Open Cypress graphical interface
The Cypress interface allows you to view and run tests with a graphical interface

Commands:
- npx cypress open - Will open the interface without  a TEST_TARGET, defaulting to portal
- npm cy:open:manage - Will open the interface with TEST_TARGET of manage

## Running Cypress in the Azure pipeline
The Cypress tests are integrated into the Microsoft Azure pipeline, using .yml files for configuration in the ../.azure/pipelines directory.

If a Pull Request contains a file in the manage or portal folder of cypress/ or apps/ directories then Cypress tests relevant to those directories will run.

### Azure environment
TBC

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

        pageObjects/
            manage/
                create-case/

            portal/
        
        reports/

        support/

        types/

            
