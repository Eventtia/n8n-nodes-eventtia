import type { INodeProperties } from 'n8n-workflow';
import { jsendOutput } from '../../shared/fields';
import { attendeeFields } from './fields';

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
		],
		default: 'getAll',
	},
	...attendeeFields,
];
