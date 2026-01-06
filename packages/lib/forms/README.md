# Forms Package

Generic, extensible forms system for local plans applications.

## Architecture

The forms package implements a layered architecture that separates generic form infrastructure from business-specific implementations.

```
Apps (manage/portal) → Journey/Feedback (custom) → Core (generic) → DB/Services
```

### Core Layer (Generic)
**Location**: `packages/lib/forms/core/`

- **types.ts** - Generic TypeScript interfaces and types
- **controller.ts** - Generic CRUD controllers (list, detail, delete)
- **edit-controller.ts** - Configurable edit functionality
- **data-service.ts** - Generic database operations
- **service.ts** - Generic business logic layer
- **factory-utils.ts** - Shared service creation utilities
- **router-factory.ts** - Generic router creation
- **session.ts** - Generic session management

### Journey Layer (Form-Specific)
**Location**: `packages/lib/forms/journey/feedback/`

- **edit-config.ts** - Field definitions, validation rules, and mapping
- **controller.ts** - Custom messages and route configuration
- **factory.ts** - Portal and manage form factories
- **questions.ts** - Form questions and validation rules
- **journey.ts** - Journey configuration and setup
- **sections.ts** - Form sections structure
- **index.ts** - Journey exports

### Key Principles

1. **Separation of Concerns** - Core: Generic infrastructure, Journey: Form-specific logic, Apps: Integration
2. **Configuration Over Code** - Field definitions drive validation, routes control navigation
3. **Dependency Injection** - Services injected into controllers, no hardcoded dependencies

## Usage

### Using Existing Forms

```typescript
import { createPortalForm, createManageForm } from '@pins/local-plans-lib';

// Portal app
const portalForm = createPortalForm(service);
app.use('/feedback', portalForm.router);

// Manage app  
const manageForm = createManageForm(service);
app.use('/feedback', manageForm.router);
```

### Creating New Form Types

1. **Create journey folder**: `journey/contact-us/`

2. **Define form interface**:
```typescript
// journey/contact-us/edit-config.ts
export interface ContactUsAnswers {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const createContactUsEditConfig = (): EditConfig<ContactUsAnswers> => ({
  allowedFields: {
    'name': {
      key: 'name',
      required: true,
      validator: (value: string) => !value?.trim() ? 'Name is required' : null
    },
    // ... other fields
  },
  // ... other config
});
```

3. **Create questions**:
```typescript
// journey/contact-us/questions.ts
export const createContactUsQuestions = () => createQuestions({
  name: {
    type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
    title: 'Name',
    question: 'What is your name?',
    validators: [new RequiredValidator('Enter your name')]
  },
  // ... other questions
});
```

4. **Create controller**:
```typescript
// journey/contact-us/controller.ts
export class ContactUsControllerInterface extends FormControllerInterface {
  constructor(businessService: FormBusinessService, logger: Logger) {
    const routes = {
      baseRoute: '/contact-us',
      checkAnswersRoute: '/contact-us/check-your-answers',
      startRoute: '/contact-us',
      successRoute: '/contact-us/success',
      listRoute: '/contact-us',
      itemsRoute: '/items'
    };
    super(businessService, logger, routes, 'contact-us');
  }
}
```

5. **Create factory**:
```typescript
// journey/contact-us/factory.ts
export const createContactUsPortalForm = (service: BaseService) => {
  const { dataService, businessService } = createCoreServices(service);
  const questions = createContactUsQuestions();
  const controllerInterface = new ContactUsControllerInterface(businessService, service.logger);
  
  // Create router with routes...
  
  return { router, dataService, businessService, questions, controllerInterface };
};
```

6. **Export and update main factory**:
```typescript
// journey/contact-us/index.ts
export { createContactUsPortalForm, createContactUsManageForm } from './factory.ts';

// main factory.ts
export const createPortalForm = (service: BaseService) => {
  return createContactUsPortalForm(service); // Switch to new form type
};
```

## API Reference

### Main Exports

#### `createPortalForm(service: BaseService)`
Creates a complete portal form with feedback-specific implementation.

**Returns:**
```typescript
{
  router: Router,
  dataService: FormDataService,
  businessService: FormBusinessService,
  questions: FormQuestions,
  controllerInterface: FormControllerInterface
}
```

#### `createManageForm(service: BaseService)`
Creates a complete manage form with CRUD operations and edit functionality.

#### `createBaseForm(service: BaseService, routes?: RouteConfig)`
Creates base form functionality for custom implementations.

### Core Types

#### `FormDataService`
```typescript
export interface FormDataService {
  saveSubmission(answers: FormAnswers): Promise<FormDbResult>;
  getTotalSubmissions(): Promise<number>;
  getAllSubmissions(): Promise<FormDbSubmission[]>;
  getSubmissionById(id: string): Promise<FormDbSubmission | null>;
  updateSubmission(id: string, answers: FormAnswers): Promise<void>;
  deleteSubmission(id: string): Promise<void>;
}
```

#### `RouteConfig`
```typescript
export interface RouteConfig {
  baseRoute: string;          // e.g., '/feedback'
  checkAnswersRoute: string;  // e.g., '/feedback/check-your-answers'
  startRoute: string;         // e.g., '/feedback'
  successRoute: string;       // e.g., '/feedback/success'
  listRoute: string;          // e.g., '/feedback'
  itemsRoute?: string;        // e.g., '/items'
}
```

### Core Classes

#### `FormControllerInterface`
Generic controller providing CRUD operations.

```typescript
export class FormControllerInterface {
  constructor(
    businessService: FormBusinessService,
    logger: Logger,
    routes: RouteConfig,
    journeyId: string = 'form'
  )

  createStartController(templatePath: string, pageTitle: string): AsyncRequestHandler
  createSuccessController(templatePath: string, pageTitle: string): AsyncRequestHandler
  createSaveController(): AsyncRequestHandler
  createListController(templatePath: string, pageHeading: string): AsyncRequestHandler
  createDetailController(templatePath: string, pageHeading: string): AsyncRequestHandler
  createDeleteConfirmController(templatePath: string, pageHeading: string): AsyncRequestHandler
  createDeleteController(): AsyncRequestHandler
}
```

#### `EditController<T>`
Generic edit controller with configurable field handling.

```typescript
export class EditController<T = Record<string, any>> {
  constructor(
    dataService: FormDataService,
    logger: Logger,
    questions: FormQuestions,
    editConfig: EditConfig<T>,
    createSections: (questions: FormQuestions) => any
  )

  createGetHandler(submissionIdParam?: string): ControllerHandler
  createPostHandler(submissionIdParam?: string): ControllerHandler
}
```

## Examples

### Basic Usage
```typescript
import { createPortalForm } from '@pins/local-plans-lib';

const app = express();
const service = new AppService(config);
const form = createPortalForm(service);

app.use('/feedback', form.router);
```

### Custom Routes
```typescript
import { createBaseForm } from '@pins/local-plans-lib';

const customRoutes = {
  baseRoute: '/custom-form',
  checkAnswersRoute: '/custom-form/review',
  startRoute: '/custom-form/start',
  successRoute: '/custom-form/complete',
  listRoute: '/custom-form/list'
};

const form = createBaseForm(service, customRoutes);
```

### Error Handling
```typescript
try {
  const submission = await businessService.saveSubmission(answers);
} catch (error) {
  logger.error('Failed to save submission:', error);
  // Handle error appropriately
}
```

## Features

- **Type Safety**: Strong TypeScript typing throughout
- **Extensible**: Easy to add new form types
- **Configurable**: Field validation, routes, messages
- **CRUD Operations**: List, view, edit, delete submissions
- **Session Management**: Form state persistence
- **Error Handling**: Comprehensive error handling and logging
- **Edit Functionality**: In-place editing with validation

## Best Practices

- **Type Safety**: Always define strong interfaces, avoid `any` types
- **Error Handling**: Wrap database operations in try-catch, provide user-friendly messages
- **Validation**: Validate at multiple layers, use consistent error format
- **Configuration**: Keep configuration separate from logic, use dependency injection

## Troubleshooting

### Common Issues

1. **Import Errors** - Check file extensions (.ts), verify export/import statements
2. **Type Errors** - Check interface definitions, verify generic type parameters
3. **Runtime Errors** - Check service dependencies, verify configuration objects

### Debugging Tips

1. Enable debug logging
2. Use TypeScript strict mode
3. Test with minimal data first
4. Check network requests in browser dev tools