/**
 * Express type extensions for feedback forms module
 */

declare global {
	namespace Express {
		interface Request {
			submissionData?: {
				fullName: string;
				email: string | null;
				wantToProvideEmail: boolean;
				rating: string;
				feedback: string;
			};
		}
	}
}

export {};
