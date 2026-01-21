import { Router } from 'express';
import type { FormControllerInterface } from './controller.js';
import type { EditController } from './edit-controller.js';

export interface RouterConfig {
	listTemplate: string;
	detailTemplate: string;
	deleteTemplate: string;
	pageTitle: string;
}

export class RouterFactory {
	static createManageRouter(
		controllerInterface: FormControllerInterface,
		editController: EditController,
		config: RouterConfig
	) {
		const router = Router({ mergeParams: true });

		// CRUD controllers
		const listController = controllerInterface.createListController(config.listTemplate, config.pageTitle);
		const detailController = controllerInterface.createDetailController(config.detailTemplate, 'Form Submission');
		const deleteConfirmController = controllerInterface.createDeleteConfirmController(
			config.deleteTemplate,
			'Delete Form Submission'
		);
		const deleteController = controllerInterface.createDeleteController();

		// Standard routes
		router.get('/', listController);
		router.get('/:id', detailController);
		router.get('/:id/delete', deleteConfirmController);
		router.post('/:id/delete', deleteController);

		// Edit routes
		router.get('/:id/edit/:section/:question', editController.createGetHandler());
		router.post('/:id/edit/:section/:question', editController.createPostHandler());

		return router;
	}
}
