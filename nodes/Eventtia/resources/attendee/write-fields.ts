import type { INodeProperties } from 'n8n-workflow';
import { optionalFields } from '../../shared/fields';
import { keyValueField } from '../../shared/free-form';

const showForCreate = { resource: ['attendee'], operation: ['create'] };
const showForUpdate = { resource: ['attendee'], operation: ['update'] };
const showForWrites = { resource: ['attendee'], operation: ['create', 'update'] };

/**
 * The whole attendee body is nested under an `attendee` key, so every field routes to
 * `attendee.<name>`. Dot notation assembles the wrapper on the way out, which is also why
 * Coupon Code below can sit in the same collection while landing outside the wrapper.
 */
const sharedFields: INodeProperties[] = [
	{
		displayName: 'Company',
		name: 'company',
		type: 'string',
		default: '',
		placeholder: 'Acme Corp',
		description: 'The company the attendee works for',
		routing: { send: { type: 'body', property: 'attendee.company' } },
	},
	{
		displayName: 'Job Title',
		name: 'job_title',
		type: 'string',
		default: '',
		placeholder: 'Developer',
		description: "The attendee's job title",
		routing: { send: { type: 'body', property: 'attendee.job_title' } },
	},
	{
		displayName: 'Telephone',
		name: 'telephone',
		type: 'string',
		default: '',
		placeholder: '+573001234567',
		description: "The attendee's phone number",
		routing: { send: { type: 'body', property: 'attendee.telephone' } },
	},
	{
		displayName: 'Alternative Email',
		name: 'alternative_email',
		type: 'string',
		default: '',
		description: 'A secondary email address for the attendee',
		routing: { send: { type: 'body', property: 'attendee.alternative_email' } },
	},
	{
		displayName: 'Birthdate',
		name: 'birthdate',
		type: 'string',
		default: '',
		placeholder: '1990-05-15',
		description: "The attendee's date of birth, as YYYY-MM-DD",
		routing: { send: { type: 'body', property: 'attendee.birthdate' } },
	},
	{
		displayName: 'City ID',
		name: 'city_id',
		type: 'number',
		default: 0,
		description: 'Numeric ID of the city, as returned by the City > Search operation',
		routing: { send: { type: 'body', property: 'attendee.city_id' } },
	},
	{
		displayName: 'Document ID',
		name: 'document_id',
		type: 'string',
		default: '',
		description: "The attendee's identity document number",
		routing: { send: { type: 'body', property: 'attendee.document_id' } },
	},
	{
		displayName: 'Internal ID',
		name: 'internal_id',
		type: 'string',
		default: '',
		placeholder: 'EMP-4521',
		description: 'Your own identifier for the attendee, stored alongside the record',
		routing: { send: { type: 'body', property: 'attendee.internal_id' } },
	},
	{
		displayName: 'Invited By',
		name: 'invited_by',
		type: 'string',
		default: '',
		description: 'Who invited the attendee',
		routing: { send: { type: 'body', property: 'attendee.invited_by' } },
	},
	{
		displayName: 'Invoice Address',
		name: 'invoice_address',
		type: 'string',
		default: '',
		description: 'Billing address used on the invoice',
		routing: { send: { type: 'body', property: 'attendee.invoice_address' } },
	},
	{
		// The API accepts exactly one value here, so it is a picker rather than free text.
		displayName: 'Point of Origin',
		name: 'point_of_origin',
		type: 'options',
		default: 'internal',
		options: [{ name: 'Internal', value: 'internal' }],
		description: 'Marks the registration as app-driven rather than public',
		routing: { send: { type: 'body', property: 'attendee.point_of_origin' } },
	},
	{
		displayName: 'Timezone',
		name: 'timezone',
		type: 'string',
		default: '',
		placeholder: 'America/Bogota',
		description: "IANA timezone used for the attendee's own schedule",
		routing: { send: { type: 'body', property: 'attendee.timezone' } },
	},
];

export const attendeeWriteFields: INodeProperties[] = [
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'John',
		displayOptions: { show: showForCreate },
		description: "The attendee's first name",
		routing: { send: { type: 'body', property: 'attendee.first_name' } },
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Doe',
		displayOptions: { show: showForCreate },
		description: "The attendee's last name",
		routing: { send: { type: 'body', property: 'attendee.last_name' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@email.com',
		displayOptions: { show: showForCreate },
		description: "The attendee's email address",
		routing: { send: { type: 'body', property: 'attendee.email' } },
	},
	{
		displayName: 'Attendee Type ID',
		name: 'typeId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: showForCreate },
		description:
			'Numeric ID of the attendee type to register under, as returned by Attendee Type > Get Many',
		routing: { send: { type: 'body', property: 'attendee.attendee_type_id' } },
	},
	optionalFields({
		name: 'attendeeAdditionalFields',
		displayName: 'Additional Fields',
		show: showForCreate,
		options: [
			...sharedFields,
			{
				displayName: 'Coupon Code',
				name: 'coupon_code',
				type: 'string',
				default: '',
				description: 'Discount code to apply to the registration',
				// Sibling of the attendee wrapper, not a field of the attendee itself.
				routing: { send: { type: 'body', property: 'coupon_code' } },
			},
		],
	}),
	// Update accepts everything create does except the coupon code, and nothing is required.
	optionalFields({
		name: 'attendeeUpdateFields',
		displayName: 'Update Fields',
		show: showForUpdate,
		options: [
			...sharedFields,
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
				description: "The attendee's first name",
				routing: { send: { type: 'body', property: 'attendee.first_name' } },
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				description: "The attendee's last name",
				routing: { send: { type: 'body', property: 'attendee.last_name' } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				description: "The attendee's email address",
				routing: { send: { type: 'body', property: 'attendee.email' } },
			},
			{
				displayName: 'Attendee Type ID',
				name: 'attendee_type_id',
				type: 'number',
				default: 0,
				description: 'Numeric ID of the attendee type to move the attendee to',
				routing: { send: { type: 'body', property: 'attendee.attendee_type_id' } },
			},
		],
	}),
	keyValueField({
		name: 'attendeeCustomFields',
		displayName: 'Custom Fields',
		property: 'attendee.custom_fields',
		description: "Values for the custom fields of the attendee's type",
		show: showForWrites,
		keyDisplayName: 'Field ID',
		keyDescription:
			'Numeric ID of the custom field, as returned by Attendee Type > Get Many Custom Fields',
		keyPlaceholder: '4521',
		valueDisplayName: 'Value',
		valueDescription: 'Value to store in the field',
	}),
	keyValueField({
		name: 'attendeeMetadata',
		displayName: 'Metadata',
		property: 'attendee.metadata',
		description: 'Arbitrary key-value data stored with the attendee. Values are sent as text.',
		show: showForWrites,
		keyDisplayName: 'Key',
		keyDescription: 'Name of the metadata entry',
		valueDisplayName: 'Value',
		valueDescription: 'Value of the metadata entry',
	}),
];
