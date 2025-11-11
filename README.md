# Local Plans

A repository for local plan examination service. This repository includes a basic structure and configuration files covering the common aspects of a service. This includes setup such as:

- ESlint
- Commitlint
- Prettier
- Husky
- Docker
- Prisma

'Portal' app is given in the PINS/Public style. 'Manage' app is given in the back office/internal style, with Entra Auth.

## Getting started

* install latest LTS Node
* install Docker
* `npm i`
* `docker compose up` (to start a database)
* copy `packages/database/.env.example` to `.env`
* copy `apps/manage/.env.example` to `.env`
* copy `apps/portal/.env.example` to `.env`
* Get the `AUTH_*` env vars from a dev and add to `apps/manage/.env` (or set `AUTH_DISABLED=false`)
* run `npm run db-migrate-dev` to setup the database
* run `apps/manage>npm run dev` to start the manage app
* run `apps/portal>npm run dev` to start the portal app