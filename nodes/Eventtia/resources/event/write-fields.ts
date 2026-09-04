import type { INodeProperties } from 'n8n-workflow';
import { optionalFields } from '../../shared/fields';
import { keyValueField } from '../../shared/free-form';

const showForCreate = { resource: ['event'], operation: ['create'] };
const showForUpdate = { resource: ['event'], operation: ['update'] };
const showForWrites = { resource: ['event'], operation: ['create', 'update'] };

/**
 * Events use `dd/mm/yyyy - HH:MM`, unlike the `yyyy-mm-dd HH:MM:SS` of every other
 * Eventtia date. Kept as a string rather than dateTime on purpose: n8n would send
 * ISO 8601 and the day and month would silently swap.
 */
const DATE_HINT = 'as DD/MM/YYYY - HH:MM in the event timezone';

/** Optional on both create and update. */
const sharedFields: INodeProperties[] = [
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'A description of the event',
		routing: { send: { type: 'body', property: 'description' } },
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
		description:
			'How the event is attended. Offline events need a City ID, online ones a Virtual Timezone, and mixed ones both.',
		routing: { send: { type: 'body', property: 'attendance_mode' } },
	},
	{
		displayName: 'City ID',
		name: 'city_id',
		type: 'number',
		default: 0,
		description: 'Numeric ID of the city, as returned by the City > Search operation',
		routing: { send: { type: 'body', property: 'city_id' } },
	},
	{
		displayName: 'Virtual Timezone',
		name: 'virtual_timezone',
		type: 'string',
		default: '',
		placeholder: 'America/Bogota',
		description: 'IANA timezone used by online events, which have no city to derive it from',
		routing: { send: { type: 'body', property: 'virtual_timezone' } },
	},
	{
		displayName: 'Venue Capacity',
		name: 'venue_capacity',
		type: 'number',
		default: 0,
		description: 'Maximum number of people the venue holds',
		routing: { send: { type: 'body', property: 'venue_capacity' } },
	},
	// Flattened rather than nested: dot notation builds the object on the way out, and
	// two plain numbers beat a collection inside a collection.
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		default: 0,
		typeOptions: { numberPrecision: 6 },
		description: 'Latitude of the venue',
		routing: { send: { type: 'body', property: 'coordinates.lat' } },
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		default: 0,
		typeOptions: { numberPrecision: 6 },
		description: 'Longitude of the venue',
		routing: { send: { type: 'body', property: 'coordinates.lng' } },
	},
];

export const eventWriteFields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'eventName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Tech Conference 2026',
		displayOptions: { show: showForCreate },
		description: 'The name of the event',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Event URI',
		name: 'eventUri',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tech-conference-2026',
		displayOptions: { show: showForCreate },
		description: 'Slug used in the public event URLs. Must be unique across the account.',
		routing: { send: { type: 'body', property: 'event_uri' } },
	},
	{
		displayName: 'Start Date',
		name: 'eventStartDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15/04/2026 - 09:00',
		displayOptions: { show: showForCreate },
		description: `When the event starts, ${DATE_HINT}`,
		routing: { send: { type: 'body', property: 'start_date' } },
	},
	{
		displayName: 'End Date',
		name: 'eventEndDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: '17/04/2026 - 18:00',
		displayOptions: { show: showForCreate },
		description: `When the event ends, ${DATE_HINT}`,
		routing: { send: { type: 'body', property: 'end_date' } },
	},
	{
		displayName: 'Default Language',
		name: 'defaultLanguage',
		type: 'options',
		required: true,
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Spanish', value: 'es' },
		],
		displayOptions: { show: showForCreate },
		description: 'Language the public event pages default to',
		routing: { send: { type: 'body', property: 'default_language' } },
	},
	optionalFields({
		name: 'eventAdditionalFields',
		displayName: 'Additional Fields',
		show: showForCreate,
		options: [
			...sharedFields,
			{
				displayName: 'Event Type',
				name: 'event_type',
				type: 'options',
				default: 'online_registration',
				options: [
					{ name: 'Appointment Booking', value: 'appointment_booking' },
					{ name: 'Online Registration', value: 'online_registration' },
				],
				description: 'Which product the event runs on',
				routing: { send: { type: 'body', property: 'event_type' } },
			},
			{
				displayName: 'Is Template',
				name: 'is_template',
				type: 'boolean',
				default: false,
				description: 'Whether the event is a reusable template rather than a real event',
				routing: { send: { type: 'body', property: 'is_template' } },
			},
		],
	}),
	// Update takes a smaller body than create: the URI, language, type and template flag
	// cannot be changed after the event exists.
	optionalFields({
		name: 'eventUpdateFields',
		displayName: 'Update Fields',
		show: showForUpdate,
		options: [
			...sharedFields,
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the event',
				routing: { send: { type: 'body', property: 'name' } },
			},
			{
				displayName: 'Start Date',
				name: 'start_date',
				type: 'string',
				default: '',
				placeholder: '15/04/2026 - 09:00',
				description: `When the event starts, ${DATE_HINT}`,
				routing: { send: { type: 'body', property: 'start_date' } },
			},
			{
				displayName: 'End Date',
				name: 'end_date',
				type: 'string',
				default: '',
				placeholder: '17/04/2026 - 18:00',
				description: `When the event ends, ${DATE_HINT}`,
				routing: { send: { type: 'body', property: 'end_date' } },
			},
		],
	}),
	keyValueField({
		name: 'eventCustomFields',
		displayName: 'Custom Fields',
		property: 'custom_fields_data',
		description: 'Values for the account-level event custom fields',
		show: showForWrites,
		keyDisplayName: 'Field ID',
		keyDescription:
			'Numeric ID of the custom field definition, as returned by Event > Get Custom Fields',
		keyPlaceholder: '4521',
		valueDisplayName: 'Value',
		valueDescription: 'Value to store in the field',
	}),
];
