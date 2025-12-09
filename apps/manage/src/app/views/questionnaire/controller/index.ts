/**
 * Controller module exports for questionnaire functionality.
 * Provides factory functions for creating questionnaire page handlers.
 */

import { createQuestionnaireControllers } from './controller.ts';
import { createDeleteConfirmController, createDeleteController } from './delete.ts';
import { loadSubmissionData } from './edit-helpers.ts';
import { createSaveToDatabase } from './save.ts';

export {
	createQuestionnaireControllers,
	createDeleteConfirmController,
	createDeleteController,
	loadSubmissionData,
	createSaveToDatabase
};
