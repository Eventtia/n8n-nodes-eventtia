import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { attendeeDescription } from './resources/attendee';
import { attendeeTypeDescription } from './resources/attendeeType';
import { checkpointDescription } from './resources/checkpoint';
import { cityDescription } from './resources/city';
import { eventDescription } from './resources/event';
import { paymentDescription } from './resources/payment';
import { sessionDescription } from './resources/session';
import { speakerDescription } from './resources/speaker';
import { workshopDescription } from './resources/workshop';
import { USER_AGENT } from './shared/user-agent';

export class Eventtia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Eventtia',
		name: 'eventtia',
		// Both variants are the same artwork on purpose: the badge carries its own
		// dark background, so it reads on either canvas. They are separate files
		// because n8n's icon-validation rule rejects light and dark pointing to one.
		icon: { light: 'file:eventtia.light.svg', dark: 'file:eventtia.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Read and manage events, attendees, speakers and payments in the Eventtia Connect API',
		defaults: {
			name: 'Eventtia',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'eventtiaApi', required: true }],
		requestDefaults: {
			// Host only: every operation spells out its own /api/v4 prefix.
			baseURL: '={{$credentials.environment}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': USER_AGENT,
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Attendee', value: 'attendee' },
					{ name: 'Attendee Type', value: 'attendeeType' },
					{ name: 'Checkpoint', value: 'checkpoint' },
					{ name: 'City', value: 'city' },
					{ name: 'Event', value: 'event' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'Session', value: 'session' },
					{ name: 'Speaker', value: 'speaker' },
					{ name: 'Workshop', value: 'workshop' },
				],
				default: 'event',
			},
			...eventDescription,
			...attendeeDescription,
			...paymentDescription,
			...attendeeTypeDescription,
			...workshopDescription,
			...sessionDescription,
			...speakerDescription,
			...cityDescription,
			...checkpointDescription,
		],
	};
}
