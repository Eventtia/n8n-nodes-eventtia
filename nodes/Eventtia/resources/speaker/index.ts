import type { INodeProperties } from 'n8n-workflow';
import { jsendOutput } from '../../shared/fields';
import { speakerFields } from './fields';

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
			{
				name: 'Create',
				value: 'create',
				action: 'Create a speaker',
				description: 'Add a speaker to an event',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('speaker'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a speaker',
				description: 'Update the details of an existing speaker',
				routing: {
					request: { method: 'PUT', url: `=${basePath}/{{$parameter.speakerId}}` },
					output: jsendOutput('speaker'),
				},
			},
		],
		default: 'getAll',
	},
	...speakerFields,
];
