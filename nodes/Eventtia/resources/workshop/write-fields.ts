import type { INodeProperties } from 'n8n-workflow';
import { i18nField, keyValueField, workshopSessionsField } from '../../shared/free-form';

const showForCreate = { resource: ['workshop'], operation: ['create'] };
const showForWrites = { resource: ['workshop'], operation: ['create', 'update'] };

export const workshopWriteFields: INodeProperties[] = [
	i18nField({
		name: 'workshopName',
		displayName: 'Name',
		property: 'name',
		description:
			"The workshop name, per language. Required on create, and it must include the event's default language.",
		show: showForWrites,
	}),
	i18nField({
		name: 'workshopDescription',
		displayName: 'Description',
		property: 'description',
		description: 'What the workshop covers, per language',
		show: showForWrites,
	}),
	workshopSessionsField(showForCreate),
	keyValueField({
		name: 'workshopVisibility',
		displayName: 'Visible for Attendee Types',
		property: 'show_for_attendee_type',
		description:
			'Which attendee types can see and book the workshop. Leave empty and no attendee type sees it.',
		show: showForCreate,
		keyDisplayName: 'Attendee Type ID',
		keyDescription: 'Numeric ID of the attendee type, as returned by Attendee Type > Get Many',
		keyPlaceholder: '100',
		valueDisplayName: 'Visible',
		valueDescription: 'Set to true to show the workshop to this attendee type, or false to hide it',
		valuePlaceholder: 'true',
	}),
	keyValueField({
		name: 'workshopPrice',
		displayName: 'Price per Attendee Type',
		property: 'price',
		description: 'What the workshop costs each attendee type',
		show: showForCreate,
		keyDisplayName: 'Attendee Type ID',
		keyDescription: 'Numeric ID of the attendee type, as returned by Attendee Type > Get Many',
		keyPlaceholder: '100',
		valueDisplayName: 'Price',
		valueDescription: 'Price as a number, for example 150.00. Use 0 for a free workshop.',
		valuePlaceholder: '150.00',
	}),
];
