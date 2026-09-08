import type { INodeProperties } from 'n8n-workflow';
import {
	attendeeUuidField,
	emptyDataOutput,
	eventUuidField,
	jsendOutput,
	optionalFields,
	paginationFields,
} from '../../shared/fields';

const showOnlyForPayments = { resource: ['payment'] };
const showForGetAll = { resource: ['payment'], operation: ['getAll'] };
const basePath =
	'/api/v4/events/{{$parameter.eventUuid}}/attendees/{{$parameter.attendeeUuid}}/payments';

export const paymentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForPayments },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many payments',
				description:
					'Get the deposits and charges of a single attendee. Eventtia has no event-wide payment listing, so chain this after Attendee > Get Many to cover a whole event.',
				routing: {
					request: { method: 'GET', url: `=${basePath}` },
					output: jsendOutput('payments'),
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a payment',
				description: 'Register a manual deposit against an attendee balance',
				routing: {
					request: { method: 'POST', url: `=${basePath}` },
					output: jsendOutput('payment'),
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a payment',
				description:
					'Delete a payment from an attendee. Only deposits can be deleted; charges, discounts and taxes are rejected by the API.',
				routing: {
					request: { method: 'DELETE', url: `=${basePath}/{{$parameter.paymentId}}` },
					output: emptyDataOutput('deleted'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForPayments),
	attendeeUuidField(showOnlyForPayments),
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		displayOptions: { show: { resource: ['payment'], operation: ['create'] } },
		description: 'The amount to register as a deposit, in the currency of the event',
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '999',
		displayOptions: { show: { resource: ['payment'], operation: ['delete'] } },
		description: 'The numeric ID of the payment to delete',
	},
	optionalFields({
		name: 'paymentAdditionalFields',
		displayName: 'Additional Fields',
		show: { resource: ['payment'], operation: ['create'] },
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'Manual deposit',
				description: 'A note describing what the deposit is for',
				routing: { send: { type: 'body', property: 'description' } },
			},
		],
	}),
	...paginationFields(showForGetAll),
];
