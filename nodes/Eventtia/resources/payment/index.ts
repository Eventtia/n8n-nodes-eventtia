import type { INodeProperties } from 'n8n-workflow';
import {
	attendeeUuidField,
	eventUuidField,
	jsendOutput,
	paginationFields,
} from '../../shared/fields';

const showOnlyForPayments = { resource: ['payment'] };
const showForGetAll = { resource: ['payment'], operation: ['getAll'] };

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
					request: {
						method: 'GET',
						url: '=/api/v4/events/{{$parameter.eventUuid}}/attendees/{{$parameter.attendeeUuid}}/payments',
					},
					output: jsendOutput('payments'),
				},
			},
		],
		default: 'getAll',
	},
	eventUuidField(showOnlyForPayments),
	attendeeUuidField(showOnlyForPayments),
	...paginationFields(showForGetAll),
];
