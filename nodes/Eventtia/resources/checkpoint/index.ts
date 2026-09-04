import type { INodeProperties } from 'n8n-workflow';
import {
	emptyDataOutput,
	eventUuidField,
	jsendOutput,
	optionalFields,
} from '../../shared/fields';

const showOnlyForCheckpoints = { resource: ['checkpoint'] };
const showForCreate = { resource: ['checkpoint'], operation: ['create'] };
const showForUpdate = { resource: ['checkpoint'], operation: ['update'] };
const basePath = '/api/v4/events/{{$parameter.eventUuid}}/checkpoints';
const withId = `${basePath}/{{$parameter.checkpointId}}`;

/** The whole body is nested under a `checkpoint` key, built by dot notation on the way out. */
const sharedFields: INodeProperties[] = [
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		placeholder: 'Primary entry point for all attendees',
		description: 'What the checkpoint is for',
		routing: { send: { type: 'body', property: 'checkpoint.description' } },
	},
	{
		displayName: 'Allowed Attendee Types',
		name: 'allowed_attendee_types',
		type: 'string',
		typeOptions: { multipleValues: true },
		default: [],
		placeholder: '100',
		description:
			'Numeric IDs of the attendee types allowed through. Leave empty to allow every type.',
		routing: { send: { type: 'body', property: 'checkpoint.allowed_attendee_types' } },
	},
	{
		displayName: 'Capacity',
		name: 'capacity',
		type: 'string',
		default: '',
		placeholder: '500',
		description:
			'Maximum number of attendees checked in at once. Leave empty for unlimited.',
		routing: { send: { type: 'body', property: 'checkpoint.capacity' } },
	},
];

const nameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	description: 'The name of the checkpoint',
	routing: { send: { type: 'body', property: 'checkpoint.name' } },
};

const typeField: INodeProperties = {
	displayName: 'Checkpoint Type',
	name: 'checkpoint_type',
	type: 'options',
	default: 1,
	options: [
		{ name: 'Multiple', value: 2 },
		{ name: 'Unique', value: 1 },
	],
	description: 'Whether an attendee may check in once only or re-enter freely',
	routing: { send: { type: 'body', property: 'checkpoint.checkpoint_type' } },
};

export const checkpointDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCheckpoints },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkpoint',
				description: 'Add a checkpoint to an event',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('checkpoint'),
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkpoint',
				description: 'Update the details of an existing checkpoint',
				routing: {
					request: { method: 'PUT', url: `=${withId}` },
					output: jsendOutput('checkpoint'),
				},
			},
			{
				name: 'Archive',
				value: 'archive',
				action: 'Archive a checkpoint',
				description:
					'Archive a checkpoint so it stops accepting check-ins. The record is kept, but this node cannot bring it back.',
				routing: {
					request: { method: 'DELETE', url: `=${withId}` },
					output: emptyDataOutput('archived'),
				},
			},
		],
		default: 'create',
	},
	eventUuidField(showOnlyForCheckpoints),
	{
		displayName: 'Checkpoint ID',
		name: 'checkpointId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '42',
		displayOptions: { show: { resource: ['checkpoint'], operation: ['update', 'archive'] } },
		description:
			'The numeric ID of the checkpoint. The API has no checkpoint listing, so take it from the Create response or from Attendee > Get Many Checkpoint Check-Ins.',
	},
	{
		...nameField,
		name: 'checkpointName',
		required: true,
		placeholder: 'Main Entrance',
		displayOptions: { show: showForCreate },
	},
	{ ...typeField, name: 'checkpointType', required: true, displayOptions: { show: showForCreate } },
	optionalFields({
		name: 'checkpointAdditionalFields',
		displayName: 'Additional Fields',
		show: showForCreate,
		options: sharedFields,
	}),
	optionalFields({
		name: 'checkpointUpdateFields',
		displayName: 'Update Fields',
		show: showForUpdate,
		options: [...sharedFields, nameField, typeField],
	}),
];
