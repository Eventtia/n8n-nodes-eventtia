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
		"The event's UUID (its api_key). Webhook payloads don't include it — use the Event > Get by URI operation to resolve it from an event URI.",
});

/** Attendee UUID, the 12-character identifier assigned at registration. */
export const attendeeUuidField = (show: ShowCondition): INodeProperties => ({
	displayName: 'Attendee UUID',
	name: 'attendeeUuid',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'a1b2c3d4e5f6',
	displayOptions: { show },
	description: "The attendee's UUID",
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
