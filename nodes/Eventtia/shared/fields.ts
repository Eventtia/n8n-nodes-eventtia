import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { paginateByPageNumber } from './pagination';

export type ShowCondition = Record<string, Array<string | number | boolean>>;

/**
 * Every v4 response is JSend-wrapped: `{ status, data: { <collection>: [...] } }`.
 * This unwraps it so the workflow receives the records themselves.
 */
export const jsendOutput = (property: string): IDataObject => ({
	postReceive: [
		{
			type: 'rootProperty',
			properties: { property: `data.${property}` },
		},
	],
});

/**
 * Some endpoints answer `{ status: 'success', data: null }` — there is nothing to unwrap.
 * A rootProperty would hand the next node an item whose json is null, so emit a marker
 * the workflow can branch on instead.
 */
export const emptyDataOutput = (marker: string): IDataObject => ({
	postReceive: [{ type: 'set', properties: { value: `={{ { "${marker}": true } }}` } }],
});

/** Event UUID (the event's `api_key`), required by every event-scoped endpoint. */
export const eventUuidField = (show: ShowCondition): INodeProperties => ({
	displayName: 'Event UUID',
	name: 'eventUuid',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
	displayOptions: { show },
	description:
		"The event's UUID (its api_key). Trigger payloads carry it in the included events entry, under attributes.uuid.",
});

/**
 * Attendee UUID, the 12-character identifier assigned at registration.
 *
 * Takes optional routing because the session enrolment endpoints want it in the body,
 * while everywhere else it only ever appears in the URL.
 */
export const attendeeUuidField = (
	show: ShowCondition,
	routing?: INodeProperties['routing'],
): INodeProperties => ({
	displayName: 'Attendee UUID',
	name: 'attendeeUuid',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'a1b2c3d4e5f6',
	displayOptions: { show },
	description: "The attendee's UUID",
	...(routing ? { routing } : {}),
});

/**
 * Collection of optional body fields — the Add Field box shown on create and update.
 *
 * Sorting happens here so every caller can declare its options in whatever order reads
 * best and share one list between create and update, which differ only by a field or two.
 */
export const optionalFields = (config: {
	name: string;
	displayName: string;
	show: ShowCondition;
	options: INodeProperties[];
}): INodeProperties => ({
	displayName: config.displayName,
	name: config.name,
	type: 'collection',
	placeholder: 'Add Field',
	default: {},
	displayOptions: { show: config.show },
	options: [...config.options].sort((a, b) => a.displayName.localeCompare(b.displayName)),
});

/** Standard Return All / Limit pair for list operations. */
export const paginationFields = (show: ShowCondition): INodeProperties[] => [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			// Always on: the API caps a page at 24, so even a modest Limit spans
			// several requests. paginateByPageNumber reads both fields and stops itself.
			send: { paginate: true },
			operations: { pagination: paginateByPageNumber },
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { ...show, returnAll: [false] } },
		description: 'Max number of results to return',
	},
];
