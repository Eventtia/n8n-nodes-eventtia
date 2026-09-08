import type { INodeProperties } from 'n8n-workflow';
import { emptyDataOutput, jsendOutput, paginationFields } from '../../shared/fields';
import { sessionFields } from './fields';

const showOnlyForSessions = { resource: ['session'] };
const basePath =
	'/api/v4/events/{{$parameter.eventUuid}}/workshops/{{$parameter.workshopGuid}}/sessions';
const withGuid = `${basePath}/{{$parameter.sessionGuid}}`;

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
					request: { method: 'GET', url: `=${withGuid}` },
					output: jsendOutput('session'),
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a session',
				description:
					'Add a session to a workshop. The event needs multiple sessions enabled, otherwise the API rejects it.',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('session'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a session',
				description: 'Update the details of an existing session',
				routing: {
					request: { method: 'PUT', url: `=${withGuid}` },
					output: jsendOutput('session'),
				},
			},
			{
				name: 'Archive',
				value: 'archive',
				action: 'Archive a session',
				description:
					'Archive a session and cancel every active enrolment in it. This node cannot bring it back.',
				routing: {
					request: { method: 'DELETE', url: `=${withGuid}` },
					output: emptyDataOutput('archived'),
				},
			},
			{
				name: 'Enroll Attendee',
				value: 'enroll',
				action: 'Enroll an attendee in a session',
				description:
					'Book an attendee into a session. Capacity, attendee type limits, overlapping slots and the booking deadline are all checked, and charges are recalculated.',
				routing: {
					request: { method: 'POST', url: `=${withGuid}/enroll` },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Unenroll Attendee',
				value: 'unenroll',
				action: 'Unenroll an attendee from a session',
				description:
					'Cancel an attendee enrolment and recalculate their charges. This node cannot undo it.',
				routing: {
					request: {
						method: 'DELETE',
						url: `=${withGuid}/enroll/{{$parameter.attendeeUuid}}`,
					},
					output: emptyDataOutput('unenrolled'),
				},
			},
		],
		default: 'getAll',
	},
	...sessionFields,
	...paginationFields({ resource: ['session'], operation: ['getAll'] }),
];
