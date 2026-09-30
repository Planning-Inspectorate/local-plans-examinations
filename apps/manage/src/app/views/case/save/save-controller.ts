import type { ManageService } from '#service';
import type { Request } from 'express';
import type { SaveInput } from './save-inputs.ts';

export abstract class SaveController {
	protected caseReference;
	protected service;
	protected section;
	protected action;
	protected currentItemId;
	constructor(
		service: ManageService,
		caseReference: string,
		section?: string,
		action?: string,
		currentItemId?: string
	) {
		this.caseReference = caseReference;
		this.service = service;
		this.section = section;
		this.action = action;
		this.currentItemId = currentItemId;
	}
	protected abstract prepareData(req: Request, answers: Record<string, any>): Promise<Record<string, any>>;

	protected abstract save(answers: SaveInput, question?: string): Promise<boolean>;

	public async prepareAndSave(req: Request, answers: Record<string, any>, question?: string) {
		const preparedData = await this.prepareData(req, answers);
		return await this.save(preparedData, question);
	}
	protected async resolveCaseId(): Promise<string> {
		const caseRecord = await this.service.db.case.findUnique({
			where: { reference: this.caseReference },
			select: { id: true }
		});

		if (!caseRecord) {
			throw new Error(`Case not found for reference "${this.caseReference}"`);
		}

		return caseRecord.id;
	}
	/** * Trims every string value on the form input. * Returns a new object rather than mutating the request body. */
	trimStringValues<T extends object>(input: T): T {
		const trimmed = {} as T;
		for (const key in input) {
			const value = input[key];
			trimmed[key] = (typeof value === 'string' ? value.trim() : value) as T[typeof key];
		}
		return trimmed;
	}
}
