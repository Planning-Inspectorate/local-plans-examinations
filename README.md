# Local Plans

A repository for local plan examination service with a modular forms architecture. This repository includes:

- **Apps**: Portal (public) and Manage (internal with Entra Auth)
- **Forms Package**: Generic, extensible forms system with feedback implementation
- **Database**: Prisma ORM with migrations
- **Development Tools**: ESLint, Commitlint, Prettier, Husky, Docker

## Architecture

### Forms System
The forms package follows a layered architecture:

```
Apps (manage/portal) → Journey/Feedback (custom) → Core (generic) → DB/Services
```

- **Core Layer**: Generic, reusable form infrastructure
- **Journey Layer**: Form-specific business logic (feedback, contact-us, etc.)
- **Apps Layer**: Integration using form-specific implementations

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

## Forms Package

### Usage

```typescript
// Use feedback-specific forms (recommended)
import { createPortalForm, createManageForm } from '@pins/local-plans-lib';

// Use generic core (for custom implementations)
import { createBaseForm } from '@pins/local-plans-lib';
```

### Adding New Form Types

1. Create `packages/lib/forms/journey/[form-type]/` folder
2. Implement form-specific configuration:
   - `edit-config.ts` - Field definitions and validation
   - `controller.ts` - Custom messages and routes
   - `factory.ts` - Portal and manage factories
   - `questions.ts` - Form questions and validation
3. Export from `journey/[form-type]/index.ts`
4. Update main `factory.ts` to use new form type

### Current Form Types
- **Feedback**: Local plans feedback form with rating and comments