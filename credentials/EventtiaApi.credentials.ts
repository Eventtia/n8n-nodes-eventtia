import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	Icon,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';
import { USER_AGENT } from '../nodes/Eventtia/shared/user-agent';

export class EventtiaApi implements ICredentialType {
	name = 'eventtiaApi';

	displayName = 'Eventtia API';

	icon: Icon = 'file:../nodes/Eventtia/eventtia.svg';

	documentationUrl = 'https://github.com/eventtia/n8n-nodes-eventtia?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'https://connect.eventtia.com' },
				{ name: 'Development', value: 'https://dev.eventtia.com' },
			],
			default: 'https://connect.eventtia.com',
			description: 'Which Eventtia environment to connect to',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
			default: '',
			description:
				'Server-to-server client ID. Generate it in Eventtia under your user profile, in the S2S credentials tab.',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Server-to-server client secret. Shown only once when the credentials are generated.',
		},
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			// `expirable` is what makes n8n call preAuthentication: the method runs only
			// when the expirable property is empty or expired. Without it the token is
			// never fetched and every request goes out with an empty Bearer header.
			typeOptions: { expirable: true, password: true },
			default: '',
		},
	];

	// Exchanges the client credentials for a JWT. n8n caches the returned value and
	// calls this again when a request comes back 401, so the token renews on its own.
	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${credentials.environment as string}/api/v3/m2m-auth`,
			// This request bypasses the node's requestDefaults, so it needs the header itself.
			headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
			body: {
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			},
			json: true,
		})) as IDataObject;

		const token = response.access_token as string | undefined;

		if (!token) {
			throw new Error(
				'Eventtia did not return an access token. Check that the Client ID and Client Secret are correct and that the account is active.',
			);
		}

		return { sessionToken: token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment}}',
			url: '/api/v4/events',
			method: 'GET',
		},
	};
}
