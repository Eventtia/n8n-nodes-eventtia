import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type IN8nHttpFullResponse,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';
import { USER_AGENT } from './shared/user-agent';

/** Hard cap enforced by the API: `page[size]` above this is ignored. */
const PAGE_SIZE = 24;

/**
 * Events reach webhooks through `AccountWebHooks`, which only ever looks up
 * account-scoped rows. An event-scoped registration for these two is accepted
 * and then never fires, so the Event URI field is hidden for them — Eventtia's
 * own admin screen leaves them out of its selector for the same reason.
 */
const ACCOUNT_ONLY_TRIGGERS = ['event_created', 'event_updated'];

interface EventtiaCredentials {
	environment: string;
	accountApiKey?: string;
}

/**
 * Eventtia identifies a webhook by URL and trigger rather than by id, so this is
 * everything create and delete need to work with.
 */
interface Registration {
	baseUrl: string;
	/** Collection that accepts POST and DELETE for this scope. */
	path: string;
	targetUrl: string;
	trigger: string;
	/** Empty for an account-wide registration. */
	eventUri: string;
}

/** JSON:API record as returned by every web_hooks endpoint. */
interface WebHookRecord {
	attributes?: { target_url?: string; trigger?: string };
	relationships?: { event?: { data?: { id?: string } | null } };
}

const isSuccess = (response: IN8nHttpFullResponse): boolean =>
	response.statusCode >= 200 && response.statusCode < 300;

/**
 * One call against the v3 webhook API.
 *
 * 4xx answers come back as data instead of exceptions because here they *are*
 * the answer: delete reports an already-gone webhook with 404. 401 is left to
 * throw so the credential's token refresh and retry still happen.
 */
async function apiRequest(
	context: IHookFunctions,
	options: {
		method: IHttpRequestMethods;
		baseUrl: string;
		path: string;
		qs?: IDataObject;
		body?: IDataObject;
	},
): Promise<IN8nHttpFullResponse> {
	try {
		return (await context.helpers.httpRequestWithAuthentication.call(context, 'eventtiaApi', {
			method: options.method,
			baseURL: options.baseUrl,
			url: options.path,
			qs: options.qs,
			body: options.body,
			// This request bypasses the action node's requestDefaults, so it carries
			// its own headers.
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': USER_AGENT,
			},
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: { ignore: true, except: [401] },
		})) as IN8nHttpFullResponse;
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject, {
			message: `Eventtia did not answer ${options.method} ${options.path}`,
		});
	}
}

/** Raises the `{ message }` body Eventtia returns on 4xx as a node error. */
function throwApiError(
	context: IHookFunctions,
	response: IN8nHttpFullResponse,
	message: string,
	hint?: string,
): never {
	const body = (response.body ?? {}) as { message?: string | string[] };
	const detail = Array.isArray(body.message) ? body.message.join('; ') : body.message;

	throw new NodeApiError(context.getNode(), body as JsonObject, {
		message,
		description: [detail, hint].filter(Boolean).join(' '),
		httpCode: String(response.statusCode),
	});
}

/**
 * Turns the node's parameters and credential into the one shape the hooks work
 * with. Every account-vs-event difference in the API is decided here and only
 * here, so the hooks themselves stay scope-blind.
 */
async function resolveRegistration(context: IHookFunctions): Promise<Registration> {
	const trigger = context.getNodeParameter('trigger') as string;
	// Event URI is hidden for the account-only triggers, but a value typed before
	// switching trigger is still stored, so ignore it rather than register a
	// webhook that can never fire.
	const eventUri = ACCOUNT_ONLY_TRIGGERS.includes(trigger)
		? ''
		: (context.getNodeParameter('eventUri', '') as string).trim();
	const targetUrl = context.getNodeWebhookUrl('default');

	if (!targetUrl) {
		throw new NodeOperationError(context.getNode(), 'n8n gave this node no webhook URL', {
			description: 'Save the workflow and try again.',
		});
	}

	const credentials = await context.getCredentials<EventtiaCredentials>('eventtiaApi');

	if (eventUri) {
		return {
			baseUrl: credentials.environment,
			path: `/api/v3/events/${encodeURIComponent(eventUri)}/event_web_hooks`,
			targetUrl,
			trigger,
			eventUri,
		};
	}

	const accountApiKey = (credentials.accountApiKey ?? '').trim();

	if (!accountApiKey) {
		throw new NodeOperationError(
			context.getNode(),
			'Account-wide triggers need the Account API Key on the Eventtia API credential',
			{
				description: ACCOUNT_ONLY_TRIGGERS.includes(trigger)
					? 'Open the credential and paste your account UUID into Account API Key. This trigger always fires account-wide and cannot be scoped to one event.'
					: 'Open the credential and paste your account UUID into Account API Key, or set Event URI to listen to a single event instead.',
			},
		);
	}

	return {
		baseUrl: credentials.environment,
		path: `/api/v3/accounts/${encodeURIComponent(accountApiKey)}/web_hooks`,
		targetUrl,
		trigger,
		eventUri: '',
	};
}

/**
 * Whether Eventtia already points this trigger at this node.
 *
 * Walks every page rather than trusting the first: the listing has no
 * "account-scoped only" filter, so on an account with more than 24 API-created
 * webhooks ours could sit further down and a false negative would send `create`
 * against a row that already exists.
 */
async function isRegistered(
	context: IHookFunctions,
	registration: Registration,
): Promise<boolean> {
	let page = 1;
	let totalPages = 1;

	do {
		// Not the nested event collection: that endpoint reads the wrong param name
		// and ignores its own event segment, so it answers with the whole account.
		// The query string on this one does filter.
		const response = await apiRequest(context, {
			method: 'GET',
			baseUrl: registration.baseUrl,
			path: '/api/v3/web_hooks',
			qs: {
				'page[number]': page,
				'page[size]': PAGE_SIZE,
				...(registration.eventUri ? { event_uri: registration.eventUri } : {}),
			},
		});

		if (!isSuccess(response)) {
			throwApiError(context, response, 'Could not read the webhooks already registered in Eventtia');
		}

		const body = response.body as { data?: WebHookRecord[]; meta?: { total_pages?: number } };

		for (const record of body.data ?? []) {
			const attributes = record.attributes;

			if (!attributes) continue;
			// Without this an event-scoped webhook on the same URL would pass for the
			// account-wide one and suppress its registration.
			if (!registration.eventUri && record.relationships?.event?.data) continue;
			if (attributes.target_url !== registration.targetUrl) continue;
			if (attributes.trigger === registration.trigger) return true;
		}

		totalPages = body.meta?.total_pages ?? 1;
		page++;
	} while (page <= totalPages);

	return false;
}

/**
 * n8n hands `delete` the node's *current* parameters, which are already the
 * edited ones when someone changes a live workflow. Recording what was actually
 * registered is what keeps an edit from orphaning the old webhook — and since
 * both would point at this same node URL, an orphan makes the workflow fire on
 * the old trigger too.
 */
function remember(context: IHookFunctions, registration: Registration): void {
	context.getWorkflowStaticData('node').registration = { ...registration };
}

function recall(context: IHookFunctions): Registration | undefined {
	const stored = context.getWorkflowStaticData('node').registration as Registration | undefined;

	return stored?.trigger ? stored : undefined;
}

export class EventtiaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Eventtia Trigger',
		name: 'eventtiaTrigger',
		// Same artwork in both variants, as in the action node: the badge carries its
		// own dark background, and n8n's icon rule rejects one file for both.
		icon: { light: 'file:eventtia.light.svg', dark: 'file:eventtia.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["trigger"]}}',
		description: 'Start a workflow from an Eventtia webhook',
		defaults: {
			name: 'Eventtia Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'eventtiaApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				// Eventtia's sender times out after 5 seconds and swallows the failure
				// without retrying, so answer as soon as the payload lands instead of
				// holding the connection until the workflow finishes.
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Trigger',
				name: 'trigger',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'attendee_created',
				options: [
					{
						name: 'Attendee Created',
						value: 'attendee_created',
						description: 'An attendee finished registering, leaving draft state',
					},
					{
						name: 'Attendee Updated',
						value: 'attendee_updated',
						description:
							"An attendee's details changed. Check-in is not one of the watched columns, so checking someone in does not fire this.",
					},
					{
						name: 'Event Created',
						value: 'event_created',
						description:
							'An event was created. Always fires account-wide, so it cannot be scoped to one event.',
					},
					{
						name: 'Event Updated',
						value: 'event_updated',
						description:
							'Any column of an event changed. Always fires account-wide, so it cannot be scoped to one event.',
					},
				],
				description: 'Which Eventtia change starts this workflow',
			},
			{
				displayName: 'Event URI',
				name: 'eventUri',
				type: 'string',
				default: '',
				placeholder: 'tech-conference-2026',
				displayOptions: { hide: { trigger: ACCOUNT_ONLY_TRIGGERS } },
				description:
					"Listen to a single event, given its URI (slug) — the same value the payloads carry. Leave it empty to listen across the whole account, which needs the credential's Account API Key.",
			},
		],
	};

	// Inlined rather than pointed at the module-level helpers: the
	// webhook-lifecycle-complete rule only recognises function expressions here,
	// so `checkExists: someImportedFn` would read as a missing method.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const registration = await resolveRegistration(this);
				const registered = await isRegistered(this, registration);

				// n8n skips `create` when this returns true, making it the only other
				// chance to tell `delete` what it will have to remove.
				if (registered) remember(this, registration);

				return registered;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const registration = await resolveRegistration(this);
				const response = await apiRequest(this, {
					method: 'POST',
					baseUrl: registration.baseUrl,
					path: registration.path,
					body: { target_url: registration.targetUrl, trigger: registration.trigger },
				});

				if (!isSuccess(response)) {
					throwApiError(
						this,
						response,
						`Eventtia refused to register the "${registration.trigger}" webhook`,
						registration.eventUri
							? 'Check that the event URI is right and that webhooks are enabled for that event in Eventtia.'
							: undefined,
					);
				}

				remember(this, registration);

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				// What was registered wins over the current parameters, which may have
				// been edited since.
				const registration = recall(this) ?? (await resolveRegistration(this));
				const response = await apiRequest(this, {
					method: 'DELETE',
					baseUrl: registration.baseUrl,
					path: registration.path,
					qs: { target_url: registration.targetUrl, trigger: registration.trigger },
				});

				// 404 is the state we were after. Throwing on it would only stop the
				// workflow from being deactivated.
				if (!isSuccess(response) && response.statusCode !== 404) {
					throwApiError(
						this,
						response,
						`Could not remove the "${registration.trigger}" webhook from Eventtia`,
						'It may still be live — delete it from the event\'s Webhooks screen in Eventtia.',
					);
				}

				delete this.getWorkflowStaticData('node').registration;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const resource = body.data as { id?: string; attributes?: IDataObject } | undefined;

		// Flattened out of its JSON:API envelope so the payload chains downstream like
		// any operation's output. An unexpected shape passes through whole rather
		// than arriving as an empty item.
		if (!resource?.attributes) {
			return { workflowData: [[{ json: body }]] };
		}

		const json: IDataObject = { id: resource.id, ...resource.attributes };

		// Kept as-is on purpose: for attendee payloads this is where the event lives, and
		// the event is the only place its `uuid` and `event_uri` appear — the attendee's
		// own attributes do not repeat them. That uuid is what every v4 operation takes.
		if (body.included) json.included = body.included;

		return { workflowData: [[{ json }]] };
	}
}
