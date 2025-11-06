# Local Plans Examinations

A comprehensive questionnaire and examination management system for Local Planning Authorities, built with modern web technologies and following government digital service standards.

## Features

- **Public Portal**: Citizens can complete planning examination questionnaires
- **Admin Management**: Local Planning Authority staff can create questionnaires and view responses
- **Government Compliance**: Built with GOV.UK Design System and accessibility standards
- **Modern Architecture**: Node.js, TypeScript, Express, Prisma, SQL Server
- **Hello World Implementation**: Complete working questionnaire system ready for extension

## Technology Stack

- **Runtime**: Node.js 22.x with TypeScript
- **Framework**: Express.js 5.x 
- **Database**: SQL Server + Prisma ORM
- **Frontend**: Nunjucks + GOV.UK Design System
- **Authentication**: Azure AD (Entra ID)
- **Build Tools**: ESLint, Prettier, Husky
- **Testing**: Node.js built-in test runner
- **Infrastructure**: Docker, Azure

## Getting Started

### Prerequisites
- Node.js 22.x or later (LTS recommended)
- Docker and Docker Compose
- Git

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Local Database**
   ```bash
   docker compose up -d
   ```
   This starts a SQL Server container with the following credentials:
   - Host: `localhost:1433`
   - Username: `sa`
   - Password: `DockerDatabaseP@22word!`
   - Database: `master` (Prisma will create the app database)

3. **Configure Environment Variables**
   
   Create `.env` files in each app directory:
   
   **For `packages/database/.env`:**
   ```env
   SQL_CONNECTION_STRING_ADMIN="Server=localhost,1433;Database=local_plans_examinations;User Id=sa;Password=DockerDatabaseP@22word!;Encrypt=false;TrustServerCertificate=true;"
   ```
   
   **For `apps/manage/.env`:**
   ```env
   # Database
   SQL_CONNECTION_STRING="Server=localhost,1433;Database=local_plans_examinations;User Id=sa;Password=DockerDatabaseP@22word!;Encrypt=false;TrustServerCertificate=true;"
   
   # Session & Security
   SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
   
   # Development Settings
   NODE_ENV="development"
   PORT=8090
   LOG_LEVEL="info"
   
   # Authentication (for development, you can disable auth)
   AUTH_DISABLED=true
   
   # If you want to use real Azure AD authentication, get these from your Azure app registration:
   # AUTH_CLIENT_ID="your-azure-ad-app-id"
   # AUTH_CLIENT_SECRET="your-azure-ad-app-secret"
   # AUTH_TENANT_ID="your-azure-ad-tenant-id"
   # AUTH_GROUP_APPLICATION_ACCESS="your-azure-ad-group-id"
   # APP_HOSTNAME="localhost:8090"
   ```
   
   **For `apps/portal/.env`:**
   ```env
   # Database
   SQL_CONNECTION_STRING="Server=localhost,1433;Database=local_plans_examinations;User Id=sa;Password=DockerDatabaseP@22word!;Encrypt=false;TrustServerCertificate=true;"
   
   # Session & Security  
   SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
   
   # Development Settings
   NODE_ENV="development"
   PORT=8080
   LOG_LEVEL="info"
   ```

4. **Initialize Database**
   ```bash
   # Generate Prisma client
   npm run db-generate
   
   # Run database migrations to create tables
   npm run db-migrate-dev
   
   # Optional: Seed with sample data
   npm run db-seed
   ```

5. **Start Applications**
   
   **Option A: Start both apps simultaneously**
   ```bash
   # Terminal 1 - Start manage app (admin interface)
   cd apps/manage
   npm run dev
   # Access at: http://localhost:8090
   
   # Terminal 2 - Start portal app (public interface)  
   cd apps/portal
   npm run dev
   # Access at: http://localhost:8080
   ```
   
   **Option B: Start individual apps**
   ```bash
   # Just the public portal
   cd apps/portal && npm run dev
   
   # Just the admin interface
   cd apps/manage && npm run dev
   ```

### Testing the Hello World Questionnaire

1. **Public Interface** (Portal - http://localhost:8080):
   - Visit `/questionnaires` to see available questionnaires
   - Complete the "Hello World Questionnaire" at `/questionnaire/hello-world`
   - Submit your name and a message
   - View the completion confirmation

2. **Admin Interface** (Manage - http://localhost:8090):
   - Visit `/questionnaires` to manage questionnaires
   - View submitted responses and analytics at `/questionnaires/analytics`
   - See response details at `/questionnaires/{id}/responses`

### Development Commands

```bash
# Type checking
npm run check-types

# Linting
npm run lint

# Code formatting
npm run format

# Database operations
npm run db-generate        # Generate Prisma client
npm run db-migrate-dev     # Run migrations in development
npm run db-seed           # Seed database with sample data

# Testing
npm run test              # Run all tests
npm run test-coverage     # Run tests with coverage
```

## Project Structure

```
local-plans-examinations/
├── apps/
│   ├── portal/          # Public questionnaire interface
│   ├── manage/          # Admin management interface  
│   └── function/        # Azure Functions (background processing)
├── packages/
│   ├── database/        # Prisma schema and database client
│   └── lib/            # Shared utilities and services
├── docs/               # Project documentation
└── infrastructure/     # Terraform deployment configuration
```

## Contributing

1. Follow the existing code style and patterns
2. Run `npm run check-types` and `npm run lint` before committing
3. Write tests for new functionality
4. Update documentation as needed

## Architecture

This project implements a hybrid architecture combining:
- **Crown Developments UI patterns**: GOV.UK Design System, accessible forms
- **Back Office data patterns**: Repository pattern, Prisma ORM, service containers
- **Government compliance**: WCAG 2.1 AA accessibility, security best practices

For detailed architecture information, see the `docs/` directory.
