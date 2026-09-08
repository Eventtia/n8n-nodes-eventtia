import type { INodeProperties } from 'n8n-workflow';
import { attendeeUuidField, eventUuidField, optionalFields } from '../../shared/fields';

const showOnlyForSessions = { resource: ['session'] };
const showForCreate = { resource: ['session'], operation: ['create'] };
const showForUpdate = { resource: ['session'], operation: ['update'] };
const showForEnrolment = { resource: ['session'], operation: ['enroll', 'unenroll'] };

const DATE_HINT = 'as YYYY-MM-DD HH:MM:SS in the event timezone';

const startDateField: INodeProperties = {
	displayName: 'Start Date',
	name: 'start_date',
	type: 'string',
	default: '',
	placeholder: '2026-04-15 09:00:00',
	description: `When the session starts, ${DATE_HINT}`,
	routing: { send: { type: 'body', property: 'start_date' } },
};

const endDateField: INodeProperties = {
	displayName: 'End Date',
	name: 'end_date',
	type: 'string',
	default: '',
	placeholder: '2026-04-15 11:00:00',
	description: `When the session ends, ${DATE_HINT}`,
	routing: { send: { type: 'body', property: 'end_date' } },
};

/** Optional on both create and update. */
const sharedFields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'The name of the session',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'What the session covers',
		routing: { send: { type: 'body', property: 'description' } },
	},
	{
		displayName: 'Availability',
		name: 'availability',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Number of seats. 0 means unlimited.',
		routing: { send: { type: 'body', property: 'availability' } },
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		default: '',
		placeholder: 'Room 204',
		description: 'Where the session takes place',
		routing: { send: { type: 'body', property: 'location' } },
	},
	{
		displayName: 'Attendance Mode',
		name: 'attendance_mode',
		type: 'options',
		default: 'offline',
		options: [
			{ name: 'Mixed', value: 'mixed' },
			{ name: 'Offline', value: 'offline' },
			{ name: 'Online', value: 'online' },
		],
		description: 'How the session is attended',
		routing: { send: { type: 'body', property: 'attendance_mode' } },
	},
	{
		displayName: 'Booking Deadline Date',
		name: 'booking_deadline_date',
		type: 'string',
		default: '',
		placeholder: '2026-04-14 23:59:59',
		description: `Last moment an attendee can book, ${DATE_HINT}`,
		routing: { send: { type: 'body', property: 'booking_deadline_date' } },
	},
	{
		displayName: 'Show on Register',
		name: 'show_on_register',
		type: 'boolean',
		default: true,
		description: 'Whether the session is offered during registration',
		routing: { send: { type: 'body', property: 'show_on_register' } },
	},
];

export const sessionFields: INodeProperties[] = [
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
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['get', 'update', 'archive', 'enroll', 'unenroll'],
			},
		},
		description: 'The GUID of the session',
	},
	// Enrol sends it in the body; unenrol carries it in the URL and ignores the extra key.
	attendeeUuidField(showForEnrolment, {
		send: { type: 'body', property: 'attendee_uuid' },
	}),
	{ ...startDateField, name: 'sessionStartDate', required: true, displayOptions: { show: showForCreate } },
	{ ...endDateField, name: 'sessionEndDate', required: true, displayOptions: { show: showForCreate } },
	optionalFields({
		name: 'sessionAdditionalFields',
		displayName: 'Additional Fields',
		show: showForCreate,
		options: sharedFields,
	}),
	optionalFields({
		name: 'sessionUpdateFields',
		displayName: 'Update Fields',
		show: showForUpdate,
		options: [...sharedFields, startDateField, endDateField],
	}),
];
