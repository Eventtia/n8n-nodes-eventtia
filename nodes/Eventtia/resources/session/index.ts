import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, jsendOutput, paginationFields } from '../../shared/fields';

const showOnlyForSessions = { resource: ['session'] };
const basePath =
	'/api/v4/events/{{$parameter.eventUuid}}/workshops/{{$parameter.workshopGuid}}/sessions';

export const sessionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSessions },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many sessions',
				description: 'Get many sessions of a workshop',
				routing: {
					request: { method: 'GET', url: `=${basePath}` },
					output: jsendOutput('sessions'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a session',
				description: 'Get a single workshop session by GUID',
				routing: {
					request: { method: 'GET', url: `=${basePath}/{{$parameter.sessionGuid}}` },
					output: jsendOutput('session'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForSessions),
	{
		displayName: 'Workshop GUID',
		name: 'workshopGuid',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wsdef-abc123',
		displayOptions: { show: showOnlyForSessions },
		description: 'The GUID of the workshop the sessions belong to',
	},
	{
		displayName: 'Session GUID',
		name: 'sessionGuid',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ws-xyz789',
		displayOptions: { show: { resource: ['session'], operation: ['get'] } },
		description: 'The GUID of the session',
	},
	...paginationFields({ resource: ['session'], operation: ['getAll'] }),
];
