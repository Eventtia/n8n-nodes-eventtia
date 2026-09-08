import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, jsendOutput, paginationFields } from '../../shared/fields';
import { workshopWriteFields } from './write-fields';

const showOnlyForWorkshops = { resource: ['workshop'] };
const basePath = '/api/v4/events/{{$parameter.eventUuid}}/workshops';

export const workshopDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForWorkshops },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many workshops',
				description: 'Get many workshops of an event',
				routing: {
					request: { method: 'GET', url: `=${basePath}` },
					output: jsendOutput('workshops'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a workshop',
				description: 'Get a single workshop by GUID',
				routing: {
					request: { method: 'GET', url: `=${basePath}/{{$parameter.workshopGuid}}` },
					output: jsendOutput('workshop'),
				},
			},
			{
				name: 'Get Stats',
				value: 'getStats',
				action: 'Get workshop stats',
				description: 'Get seat usage and check-in counts for a workshop',
				routing: {
					request: { method: 'GET', url: `=${basePath}/{{$parameter.workshopGuid}}/stats` },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a workshop',
				description: 'Add a workshop to an event, together with its sessions',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('workshop'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a workshop',
				description:
					'Rename a workshop or change its description. Sessions, pricing and visibility are set at creation only.',
				routing: {
					request: { method: 'PUT', url: `=${basePath}/{{$parameter.workshopGuid}}` },
					output: jsendOutput('workshop'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForWorkshops),
	{
		displayName: 'Workshop GUID',
		name: 'workshopGuid',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wsdef-abc123',
		displayOptions: {
			show: { resource: ['workshop'], operation: ['get', 'getStats', 'update'] },
		},
		description: 'The GUID of the workshop',
	},
	...workshopWriteFields,
	...paginationFields({ resource: ['workshop'], operation: ['getAll'] }),
];
