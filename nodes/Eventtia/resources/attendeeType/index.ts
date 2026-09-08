import type { INodeProperties } from 'n8n-workflow';
import { jsendOutput } from '../../shared/fields';
import { attendeeTypeFields } from './fields';

const showOnlyForAttendeeTypes = { resource: ['attendeeType'] };
const basePath = '/api/v4/events/{{$parameter.eventUuid}}/attendee-types';
const withId = `${basePath}/{{$parameter.attendeeTypeId}}`;
const customFields = `${withId}/custom-fields`;

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
			{
				name: 'Create',
				value: 'create',
				action: 'Create an attendee type',
				description: 'Add an attendee type to an event',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('attendee_type'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an attendee type',
				description: 'Update the details of an existing attendee type',
				routing: {
					request: { method: 'PUT', url: `=${withId}` },
					output: jsendOutput('attendee_type'),
				},
			},
			{
				name: 'Create Custom Field',
				value: 'createCustomField',
				action: 'Create an attendee type custom field',
				description: 'Add a custom field to the registration form of an attendee type',
				routing: {
					request: { method: 'POST', url: `=${customFields}` },
					output: jsendOutput('attendee_type_custom_field'),
				},
			},
			{
				name: 'Update Custom Field',
				value: 'updateCustomField',
				action: 'Update an attendee type custom field',
				description:
					'Update a custom field. Name and Input Type are sent every time, so fill them in even when only changing an option.',
				routing: {
					request: { method: 'PUT', url: `=${customFields}/{{$parameter.customFieldId}}` },
					output: jsendOutput('attendee_type_custom_field'),
				},
			},
		],
		default: 'getAll',
	},
	...attendeeTypeFields,
];
