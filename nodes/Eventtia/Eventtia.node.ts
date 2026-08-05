import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { attendeeDescription } from './resources/attendee';
import { attendeeTypeDescription } from './resources/attendeeType';
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
		// Same file for both themes on purpose: the badge carries its own dark
		// background, so it reads on either canvas.
		icon: { light: 'file:eventtia.svg', dark: 'file:eventtia.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read events, attendees and related data from the Eventtia Connect API',
		defaults: {
			name: 'Eventtia',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'eventtiaApi', required: true }],
		requestDefaults: {
			// Host only: operations span both /api/v4 and one /api/v3 endpoint.
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
		],
	};
}
