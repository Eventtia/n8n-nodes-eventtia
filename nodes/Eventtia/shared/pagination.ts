import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

/** Hard cap enforced by the API: `page[size]` above this is ignored. */
const PAGE_SIZE = 24;

/**
 * Page-number pagination for every v4 list endpoint.
 *
 * Written as a function rather than `pagination: { type: 'generic' }` for two reasons:
 * the declarative form exposes only `$request`, `$response` and `$version` — there is no
 * page counter to build `page[number]` from — and it ignores `maxResults`, so a Limit of
 * 50 would still walk the whole collection.
 */
export async function paginateByPageNumber(
	this: IExecutePaginationFunctions,
	requestOptions: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const limit = returnAll ? Number.POSITIVE_INFINITY : (this.getNodeParameter('limit', 50) as number);

	// page[size] must stay constant across requests, otherwise page[number] would
	// point at a different offset each time. Trim the surplus after the loop instead.
	const pageSize = Math.min(PAGE_SIZE, limit);
	const qs: IDataObject = { ...requestOptions.options.qs, 'page[size]': pageSize };
	requestOptions.options.qs = qs;

	const items: INodeExecutionData[] = [];
	let pageNumber = 1;

	while (items.length < limit) {
		qs['page[number]'] = pageNumber;

		// makeRoutingRequest applies postReceive, so these items are already
		// unwrapped from the JSend envelope.
		const page = await this.makeRoutingRequest(requestOptions);
		items.push(...page);

		// A short page is the last one — no need to ask for an empty one to find out.
		if (page.length < pageSize) break;

		pageNumber++;
	}

	return returnAll ? items : items.slice(0, limit);
}
