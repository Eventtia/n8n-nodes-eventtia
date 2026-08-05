import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, jsendOutput, paginationFields } from '../../shared/fields';

const showOnlyForAttendeeTypes = { resource: ['attendeeType'] };
const basePath = '/api/v4/events/{{$parameter.eventUuid}}/attendee-types';
const withId = `${basePath}/{{$parameter.attendeeTypeId}}`;

export const attendeeTypeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForAttendeeTypes },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many attendee types',
				description: 'Get many attendee types of an event',
				routing: {
					request: { method: 'GET', url: `=${basePath}` },
					output: jsendOutput('attendee_types'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an attendee type',
				description: 'Get a single attendee type by ID',
				routing: {
					request: { method: 'GET', url: `=${withId}` },
					output: jsendOutput('attendee_type'),
				},
			},
			{
				name: 'Get Form Schema',
				value: 'getFormSchema',
				action: 'Get an attendee type form schema',
				description: 'Get the registration form fields configured for an attendee type',
				routing: {
					request: { method: 'GET', url: `=${withId}/form-schema` },
					output: jsendOutput('fields'),
				},
			},
			{
				name: 'Get Many Custom Fields',
				value: 'getCustomFields',
				action: 'Get many attendee type custom fields',
				description: 'Get the custom field definitions of an attendee type',
				routing: {
					request: { method: 'GET', url: `=${withId}/custom-fields` },
					output: jsendOutput('attendee_type_custom_fields'),
				},
			},
			{
				name: 'Get Many Group Limits',
				value: 'getGroupLimits',
				action: 'Get many attendee type group limits',
				description: 'Get the group registration limits of an attendee type',
				routing: {
					request: { method: 'GET', url: `=${withId}/group-limits` },
					output: jsendOutput('attendee_group_limits'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForAttendeeTypes),
	{
		displayName: 'Attendee Type ID',
		name: 'attendeeTypeId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100',
		displayOptions: {
			show: {
				resource: ['attendeeType'],
				operation: ['get', 'getFormSchema', 'getCustomFields', 'getGroupLimits'],
			},
		},
		description: 'The numeric ID of the attendee type',
	},
	...paginationFields({
		resource: ['attendeeType'],
		operation: ['getAll', 'getCustomFields', 'getGroupLimits'],
	}),
];
