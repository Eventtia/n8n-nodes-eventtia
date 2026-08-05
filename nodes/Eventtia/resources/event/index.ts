import type { INodeProperties } from 'n8n-workflow';
import { jsendOutput } from '../../shared/fields';
import { eventFields } from './fields';
import { flattenJsonApiResource } from './v3';

const showOnlyForEvents = { resource: ['event'] };

export const eventDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForEvents },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many events',
				description: 'Get many events from the account',
				routing: {
					request: { method: 'GET', url: '/api/v4/events' },
					output: jsendOutput('events'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an event',
				description: 'Get a single event by its UUID',
				routing: {
					request: { method: 'GET', url: '=/api/v4/events/{{$parameter.eventUuid}}' },
					output: jsendOutput('event'),
				},
			},
			{
				name: 'Get by URI',
				value: 'getByUri',
				action: 'Get an event by URI',
				description:
					'Resolve an event from its URI and return it including the UUID (api_key) needed by every other operation',
				routing: {
					request: { method: 'GET', url: '=/api/v3/events/{{$parameter.eventUri}}' },
					output: { postReceive: [flattenJsonApiResource] },
				},
			},
			{
				name: 'Get Summary',
				value: 'getSummary',
				action: 'Get an event summary',
				description: 'Get aggregated attendee, attendee type and workshop metrics for an event',
				routing: {
					request: { method: 'GET', url: '=/api/v4/events/{{$parameter.eventUuid}}/summary' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Modules',
				value: 'getModules',
				action: 'Get event modules',
				description: 'Get which modules are enabled for an event',
				routing: {
					request: { method: 'GET', url: '=/api/v4/events/{{$parameter.eventUuid}}/modules' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Custom Fields',
				value: 'getCustomFields',
				action: 'Get event custom fields',
				description: 'Get the account-level custom field definitions applicable to events',
				routing: {
					request: { method: 'GET', url: '/api/v4/events/custom-fields' },
					output: jsendOutput('custom_fields'),
				},
			},
		],
		default: 'getAll',
	},
	...eventFields,
];
