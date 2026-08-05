import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, jsendOutput, paginationFields } from '../../shared/fields';

const showOnlyForSpeakers = { resource: ['speaker'] };
const basePath = '/api/v4/events/{{$parameter.eventUuid}}/speakers';

export const speakerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSpeakers },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many speakers',
				description: 'Get many speakers of an event',
				routing: {
					request: { method: 'GET', url: `=${basePath}` },
					output: jsendOutput('speakers'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a speaker',
				description: 'Get a single speaker by ID',
				routing: {
					request: { method: 'GET', url: `=${basePath}/{{$parameter.speakerId}}` },
					output: jsendOutput('speaker'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForSpeakers),
	{
		displayName: 'Speaker ID',
		name: 'speakerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4001',
		displayOptions: { show: { resource: ['speaker'], operation: ['get'] } },
		description: 'The numeric ID of the speaker',
	},
	...paginationFields({ resource: ['speaker'], operation: ['getAll'] }),
];
