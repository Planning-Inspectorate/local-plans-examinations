import 'express';
import type { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import type { Question } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

declare global {
	namespace Express {
		interface Request {
			journey?: Journey;
			questions?: Question[];
		}
	}
}
