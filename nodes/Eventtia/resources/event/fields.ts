import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, paginationFields } from '../../shared/fields';

const showForGetAll = { resource: ['event'], operation: ['getAll'] };

export const eventFields: INodeProperties[] = [
	eventUuidField({
		resource: ['event'],
		operation: ['get', 'getSummary', 'getModules', 'update'],
	}),
	...paginationFields(showForGetAll),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showForGetAll },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Search events by name (partial match)',
				routing: { send: { type: 'query', property: 'name' } },
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				default: '',
				placeholder: 'start_date desc',
				description: 'Sort order as "column direction". Up to two fields, comma-separated.',
				routing: { send: { type: 'query', property: 'order' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: '1',
				options: [
					{ name: 'Upcoming', value: '1' },
					{ name: 'Ongoing', value: '2' },
					{ name: 'Past', value: '3' },
				],
				description: 'Filter events by their status',
				routing: { send: { type: 'query', property: 'status' } },
			},
			{
				displayName: 'Templates Only',
				name: 'templates',
				type: 'boolean',
				default: false,
				description: 'Whether to return only template events',
				routing: { send: { type: 'query', property: 'templates' } },
			},
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
				description: 'Only return events updated after this timestamp',
				routing: { send: { type: 'query', property: 'updated_since' } },
			},
		],
	},
];
