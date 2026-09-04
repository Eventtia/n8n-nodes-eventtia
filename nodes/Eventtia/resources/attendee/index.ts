import type { INodeProperties } from 'n8n-workflow';
import { emptyDataOutput, jsendOutput } from '../../shared/fields';
import { attendeeFields } from './fields';
import { attendeeWriteFields } from './write-fields';

const showOnlyForAttendees = { resource: ['attendee'] };
const eventPath = '/api/v4/events/{{$parameter.eventUuid}}/attendees';

export const attendeeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForAttendees },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many attendees',
				description: 'Get many attendees of an event',
				routing: {
					request: { method: 'GET', url: `=${eventPath}` },
					output: jsendOutput('attendees'),
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an attendee',
				description: 'Get a single attendee by UUID',
				routing: {
					request: { method: 'GET', url: `=${eventPath}/{{$parameter.attendeeUuid}}` },
					output: jsendOutput('attendee'),
				},
			},
			{
				name: 'Get Check-In',
				value: 'getCheckIn',
				action: 'Get an attendee check in',
				description: "Get the attendee's event check-in status",
				routing: {
					request: { method: 'GET', url: `=${eventPath}/{{$parameter.attendeeUuid}}/check-in` },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Many Checkpoint Check-Ins',
				value: 'getCheckpointCheckIns',
				action: 'Get many attendee checkpoint check ins',
				description: "Get the attendee's check-ins across all checkpoints",
				routing: {
					request: {
						method: 'GET',
						url: `=${eventPath}/{{$parameter.attendeeUuid}}/checkpoints/check-ins`,
					},
					output: jsendOutput('checkpoint_checkins'),
				},
			},
			{
				name: 'Get Many Workshop Check-Ins',
				value: 'getWorkshopCheckIns',
				action: 'Get many attendee workshop check ins',
				description: "Get the attendee's check-ins across all workshops",
				routing: {
					request: {
						method: 'GET',
						url: `=${eventPath}/{{$parameter.attendeeUuid}}/workshops/check-ins`,
					},
					output: jsendOutput('workshop_checkins'),
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an attendee',
				description: 'Register a new attendee for an event',
				routing: {
					request: { method: 'POST', url: `=${eventPath}` },
					output: jsendOutput('attendee'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an attendee',
				description: 'Update the details of an existing attendee',
				routing: {
					request: { method: 'PUT', url: `=${eventPath}/{{$parameter.attendeeUuid}}` },
					output: jsendOutput('attendee'),
				},
			},
			{
				name: 'Confirm',
				value: 'confirm',
				action: 'Confirm an attendee',
				description: 'Mark an attendee as confirmed',
				routing: {
					request: { method: 'PUT', url: `=${eventPath}/{{$parameter.attendeeUuid}}/confirm` },
					output: jsendOutput('attendee'),
				},
			},
			{
				name: 'Reject',
				value: 'reject',
				action: 'Reject an attendee',
				description:
					'Reject an attendee. A confirmed attendee is archived, and a checked-in one is checked out.',
				routing: {
					request: { method: 'PUT', url: `=${eventPath}/{{$parameter.attendeeUuid}}/reject` },
					output: emptyDataOutput('rejected'),
				},
			},
			{
				name: 'Resend Email',
				value: 'resendEmail',
				action: 'Resend an attendee email',
				description:
					'Resend the registration email. Fails when the attendee is a draft, archived, unconfirmed, unpaid or has no email address.',
				routing: {
					request: {
						method: 'POST',
						url: `=${eventPath}/{{$parameter.attendeeUuid}}/resend_email`,
					},
					output: emptyDataOutput('sent'),
				},
			},
		],
		default: 'getAll',
	},
	...attendeeFields,
	...attendeeWriteFields,
];
