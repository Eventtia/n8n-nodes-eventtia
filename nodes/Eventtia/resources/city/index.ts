import type { INodeProperties } from 'n8n-workflow';
import { jsendOutput } from '../../shared/fields';

const showOnlyForCities = { resource: ['city'] };

export const cityDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCities },
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search cities',
				description: 'Search the global city catalog by name. Returns at most 20 matches.',
				routing: {
					request: { method: 'GET', url: '/api/v4/search-city' },
					output: jsendOutput('cities'),
				},
			},
		],
		default: 'search',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'medellin',
		displayOptions: { show: showOnlyForCities },
		description: 'Substring to search for in the city name',
		routing: { send: { type: 'query', property: 'q' } },
	},
	{
		displayName: 'Country ISO Code',
		name: 'countryIsoCode',
		type: 'string',
		default: '',
		placeholder: 'CO',
		displayOptions: { show: showOnlyForCities },
		description: 'Optional ISO 3166-1 alpha-2 country code to narrow the results',
		routing: { send: { type: 'query', property: 'country_iso_code' } },
	},
];
