import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
	PreSendAction,
} from 'n8n-workflow';
import type { ShowCondition } from './fields';

interface KeyValueEntry {
	key?: string;
	value?: string;
}

/**
 * Writes `value` at `path` inside `body`, creating plain objects along the way.
 *
 * Deliberately not lodash `set`, which is what `routing.send.property` goes through:
 * that reads a numeric segment as an array index, so `custom_fields_data.4521` would
 * allocate a 4522-slot array instead of an object. Here the ids only ever land as keys
 * inside the leaf object, never as part of the path.
 */
function setBodyPath(body: IDataObject, path: string, value: IDataObject): void {
	const segments = path.split('.');
	const leaf = segments.pop() as string;

	let cursor = body;
	for (const segment of segments) {
		if (typeof cursor[segment] !== 'object' || cursor[segment] === null) cursor[segment] = {};
		cursor = cursor[segment] as IDataObject;
	}

	cursor[leaf] = value;
}

const keyValuePreSend =
	(parameterName: string, property: string): PreSendAction =>
	async function (this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions) {
		const parameter = (this.getNodeParameter(parameterName, {}) ?? {}) as IDataObject;
		const entry = (parameter.entry ?? []) as KeyValueEntry[];

		// This runs even when the collection is empty, so an empty one has to leave the
		// body untouched: sending `{}` is not the same as not sending the key at all.
		if (entry.length === 0) return requestOptions;

		const map: IDataObject = {};
		for (const { key, value } of entry) {
			if (key) map[key] = value ?? '';
		}

		// preSend runs after every send.property has been applied, so an outer wrapper
		// such as `attendee` is usually already there — setBodyPath walks into it.
		const body = (requestOptions.body ?? {}) as IDataObject;
		setBodyPath(body, property, map);
		requestOptions.body = body;

		return requestOptions;
	};

export interface KeyValueFieldOptions {
	/** Node parameter name. The preSend reads it back, so the factory owns both. */
	name: string;
	displayName: string;
	/** Dot-separated path in the request body, e.g. `attendee.custom_fields`. */
	property: string;
	description: string;
	show: ShowCondition;
	keyDisplayName: string;
	keyDescription: string;
	keyPlaceholder?: string;
	valueDisplayName: string;
	valueDescription: string;
	valuePlaceholder?: string;
}

/**
 * A free-form map (`{ "4521": "Gold" }`) as an Add Entry collection.
 *
 * The whole map is assembled in one preSend rather than routed key by key: the keys are
 * numeric ids that `routing.send.property` cannot address (see setBodyPath), and routing
 * each row separately would make them overwrite each other when their options are merged.
 */
export const keyValueField = (config: KeyValueFieldOptions): INodeProperties => {
	const keyField: INodeProperties = {
		displayName: config.keyDisplayName,
		name: 'key',
		type: 'string',
		default: '',
		placeholder: config.keyPlaceholder,
		description: config.keyDescription,
	};

	const valueField: INodeProperties = {
		displayName: config.valueDisplayName,
		name: 'value',
		type: 'string',
		default: '',
		placeholder: config.valuePlaceholder,
		description: config.valueDescription,
	};

	return {
		displayName: config.displayName,
		name: config.name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Entry',
		default: {},
		displayOptions: { show: config.show },
		description: config.description,
		routing: { send: { preSend: [keyValuePreSend(config.name, config.property)] } },
		options: [{ displayName: 'Entry', name: 'entry', values: [keyField, valueField] }],
	};
};

const LANGUAGES = [
	{ displayName: 'English', code: 'en' },
	{ displayName: 'French', code: 'fr' },
	{ displayName: 'German', code: 'de' },
	{ displayName: 'Portuguese', code: 'pt' },
	{ displayName: 'Spanish', code: 'es' },
];

/**
 * A multilingual hash (`{ en, es, fr, pt, de }`) as an Add Language box.
 *
 * No preSend here: the keys are fixed and non-numeric, so `routing.send.property` can
 * address them directly as `name.en`. It has to be a collection rather than a
 * fixedCollection, though — a collection only routes the keys the user actually added,
 * while a fixedCollection walks every declared sub-field and would send an empty string
 * for each untouched language, wiping translations on update.
 */
export const i18nField = (config: {
	name: string;
	displayName: string;
	property: string;
	description: string;
	show: ShowCondition;
}): INodeProperties => ({
	displayName: config.displayName,
	name: config.name,
	type: 'collection',
	placeholder: 'Add Language',
	default: {},
	displayOptions: { show: config.show },
	description: config.description,
	options: LANGUAGES.map(({ displayName, code }) => ({
		displayName,
		name: code,
		type: 'string' as const,
		default: '',
		description: `The ${config.displayName.toLowerCase()} in ${displayName}`,
		routing: { send: { type: 'body' as const, property: `${config.property}.${code}` } },
	})),
});

interface SessionEntry {
	startDate?: string;
	endDate?: string;
	availability?: number;
}

/**
 * `workshops_attributes` is a Rails nested-attributes hash: the keys only separate the
 * entries and are never read back, so the row index is used and the user is never asked
 * for one. It cannot go through `routing.send.property` either — a path such as
 * `workshops_attributes.0.start_date` would build an array, not the `{ "0": {...} }`
 * object the API documents.
 */
const workshopSessionsPreSend: PreSendAction = async function (
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
) {
	const parameter = (this.getNodeParameter('workshopSessions', {}) ?? {}) as IDataObject;
	const session = (parameter.session ?? []) as SessionEntry[];

	if (session.length === 0) return requestOptions;

	const attributes: IDataObject = {};
	session.forEach((row, index) => {
		attributes[String(index)] = {
			start_date: row.startDate,
			end_date: row.endDate,
			availability: row.availability,
		};
	});

	const body = (requestOptions.body ?? {}) as IDataObject;
	body.workshops_attributes = attributes;
	requestOptions.body = body;

	return requestOptions;
};

/** The time slots a workshop runs in, created together with the workshop itself. */
export const workshopSessionsField = (show: ShowCondition): INodeProperties => ({
	displayName: 'Sessions',
	name: 'workshopSessions',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Session',
	default: {},
	displayOptions: { show },
	description: 'Time slots the workshop runs in. At least one is required.',
	routing: { send: { preSend: [workshopSessionsPreSend] } },
	options: [
		{
			displayName: 'Session',
			name: 'session',
			values: [
				{
					displayName: 'Availability',
					name: 'availability',
					type: 'number',
					default: 0,
					typeOptions: { minValue: 0 },
					description: 'Number of seats. 0 means unlimited.',
				},
				{
					displayName: 'End Date',
					name: 'endDate',
					type: 'string',
					default: '',
					placeholder: '2026-04-15 11:00:00',
					description: 'When the session ends, as YYYY-MM-DD HH:MM:SS in the event timezone',
				},
				{
					displayName: 'Start Date',
					name: 'startDate',
					type: 'string',
					default: '',
					placeholder: '2026-04-15 09:00:00',
					description: 'When the session starts, as YYYY-MM-DD HH:MM:SS in the event timezone',
				},
			],
		},
	],
});
