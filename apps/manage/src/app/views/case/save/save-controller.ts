import type { ManageService } from '#service';
import type { Request } from 'express';
import type { SaveInput } from './save-inputs.ts';

export abstract class SaveController {
	protected caseReference;
	protected req;
	protected service;
	protected section;
	protected action;
	protected currentItemId;
	constructor(
		service: ManageService,
		req: Request,
		caseReference: string,
		section?: string,
		action?: string,
		currentItemId?: string
	) {
		this.caseReference = caseReference;
		this.req = req;
		this.service = service;
		this.section = section;
		this.action = action;
		this.currentItemId = currentItemId;
	}
	protected abstract prepareData(answers: Record<string, any>): Promise<Record<string, any>>;

	protected abstract saveToDatabase(answers: SaveInput, question?: string): Promise<boolean>;

	protected saveToSession(answers: SaveInput) {
		this.req.session.answers = answers;
		return true;
	}

	protected abstract shouldSaveToSession(): Promise<boolean>;

	protected async save(answers: SaveInput) {
		if (await this.shouldSaveToSession()) {
			return { dataWritten: this.saveToSession(answers), writtenToDB: false };
		}
		return { dataWritten: await this.saveToDatabase(answers), writtenToDB: true };
	}

	/**
	 * Attempt to save the given answers. Depending on the question being saved, this will either save to the session or the database
	 * @param answers The answers to save
	 * @returns An object with structure {"dataWritten": boolean, "writtenToDB": boolean} which details how the data was saved
	 */
	public async prepareAndSave(answers: Record<string, any>) {
		const preparedData = await this.prepareData(answers);
		return await this.save(preparedData);
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
