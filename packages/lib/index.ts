/**
 * Local Plans Lib Package
 * Provides shared utilities, middleware, and form functionality
 */

// Forms functionality - primary exports
export {
	createPortalForm,
	createManageForm,
	createBaseForm,
	FormControllerInterface,
	type RouteConfig
} from './forms/index.ts';

// Re-export all forms functionality for convenience
export * from './forms/index.ts';
