export interface PaginationRequest {
	baseUrl: string;
	path: string;
	query: Record<string, unknown>;
}

export interface PaginationDetails {
	currentPage: number;
	totalPages: number;
	skip: number;
	take: number;
}

interface PaginationLink {
	href: string;
}

type PaginationItem =
	| {
			number: number;
			href: string;
			current: boolean;
	  }
	| { ellipsis: true };

export interface PaginationModel {
	previous: PaginationLink | null;
	next: PaginationLink | null;
	items: PaginationItem[];
}

function parseRequestedPage(value: unknown): number {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) {
		return 1;
	}

	const page = Number(value);
	return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

/**
 * Calculates the values needed to paginate a data-source query.
 */
export function getPaginationDetails(totalItems: number, requestedPage: unknown, pageSize: number): PaginationDetails {
	if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
		throw new RangeError('totalItems must be a non-negative integer');
	}
	if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
		throw new RangeError('pageSize must be a positive integer');
	}

	const totalPages = Math.ceil(totalItems / pageSize);
	const currentPage = Math.min(parseRequestedPage(requestedPage), Math.max(totalPages, 1));

	return {
		currentPage,
		totalPages,
		skip: (currentPage - 1) * pageSize,
		take: pageSize
	};
}

function buildPageUrl(page: number, request: PaginationRequest): string {
	const queryParams = new URLSearchParams();

	for (const [key, value] of Object.entries(request.query)) {
		if (key === 'page') continue;

		if (Array.isArray(value)) {
			value.forEach((item) => queryParams.append(key, String(item)));
		} else {
			queryParams.append(key, String(value));
		}
	}

	queryParams.append('page', String(page));
	const baseUrl = `${request.baseUrl}${request.path}`.replace(/\/+$/, '');

	return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generates the object structure required by the GOV.UK pagination macro.
 */
export function getPaginationModel(
	request: PaginationRequest,
	totalPages: number,
	currentPage: number
): PaginationModel {
	const items: PaginationItem[] = [];

	if (totalPages > 1) {
		items.push({
			number: 1,
			href: buildPageUrl(1, request),
			current: currentPage === 1
		});
	}

	if (currentPage > 3) {
		items.push({ ellipsis: true });
	}

	for (let page = currentPage - 1; page <= currentPage + 1; page++) {
		if (page > 1 && page < totalPages) {
			items.push({
				number: page,
				href: buildPageUrl(page, request),
				current: page === currentPage
			});
		}
	}

	if (currentPage < totalPages - 2) {
		items.push({ ellipsis: true });
	}

	if (totalPages > 1) {
		items.push({
			number: totalPages,
			href: buildPageUrl(totalPages, request),
			current: currentPage === totalPages
		});
	}

	return {
		previous: currentPage > 1 ? { href: buildPageUrl(currentPage - 1, request) } : null,
		next: currentPage < totalPages ? { href: buildPageUrl(currentPage + 1, request) } : null,
		items
	};
}
