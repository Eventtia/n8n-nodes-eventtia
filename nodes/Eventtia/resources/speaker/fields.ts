import type { INodeProperties } from 'n8n-workflow';
import { eventUuidField, optionalFields, paginationFields } from '../../shared/fields';

const showOnlyForSpeakers = { resource: ['speaker'] };

/**
 * Only optional on update — on create it is required, and lives top level as `speakerName`
 * because root parameter names are shared across every resource of the node.
 */
const nameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	description: "The speaker's first name",
	routing: { send: { type: 'body', property: 'name' } },
};

const bodyFields: INodeProperties[] = [
	{
		displayName: 'Last Name',
		name: 'last_name',
		type: 'string',
		default: '',
		description: "The speaker's last name",
		routing: { send: { type: 'body', property: 'last_name' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'name@email.com',
		description: "The speaker's email address",
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Position',
		name: 'position',
		type: 'string',
		default: '',
		placeholder: 'Mathematician',
		description: "The speaker's job title",
		routing: { send: { type: 'body', property: 'position' } },
	},
	{
		displayName: 'Company',
		name: 'company',
		type: 'string',
		default: '',
		description: 'The company the speaker works for',
		routing: { send: { type: 'body', property: 'company' } },
	},
	{
		displayName: 'Bio',
		name: 'bio',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: "The speaker's biography",
		routing: { send: { type: 'body', property: 'bio' } },
	},
	{
		displayName: 'Twitter',
		name: 'twitter',
		type: 'string',
		default: '',
		description: "The speaker's Twitter handle or profile URL",
		routing: { send: { type: 'body', property: 'twitter' } },
	},
	{
		displayName: 'LinkedIn',
		name: 'linkedin',
		type: 'string',
		default: '',
		description: "The speaker's LinkedIn profile URL",
		routing: { send: { type: 'body', property: 'linkedin' } },
	},
	{
		displayName: 'Instagram',
		name: 'instagram',
		type: 'string',
		default: '',
		description: "The speaker's Instagram profile URL",
		routing: { send: { type: 'body', property: 'instagram' } },
	},
	{
		displayName: 'Website',
		name: 'website',
		type: 'string',
		default: '',
		placeholder: 'https://example.com',
		description: "The speaker's personal website",
		routing: { send: { type: 'body', property: 'website' } },
	},
];

export const speakerFields: INodeProperties[] = [
	eventUuidField(showOnlyForSpeakers),
	{
		displayName: 'Speaker ID',
		name: 'speakerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4001',
		displayOptions: { show: { resource: ['speaker'], operation: ['get', 'update'] } },
		description: 'The numeric ID of the speaker',
	},
	{
		displayName: 'Name',
		name: 'speakerName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Ada',
		displayOptions: { show: { resource: ['speaker'], operation: ['create'] } },
		description: "The speaker's first name",
		routing: { send: { type: 'body', property: 'name' } },
	},
	optionalFields({
		name: 'speakerAdditionalFields',
		displayName: 'Additional Fields',
		show: { resource: ['speaker'], operation: ['create'] },
		options: bodyFields,
	}),
	optionalFields({
		name: 'speakerUpdateFields',
		displayName: 'Update Fields',
		show: { resource: ['speaker'], operation: ['update'] },
		options: [...bodyFields, nameField],
	}),
	...paginationFields({ resource: ['speaker'], operation: ['getAll'] }),
];
