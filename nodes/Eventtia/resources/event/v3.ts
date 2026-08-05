import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

interface JsonApiResponse {
	data?: {
		id?: string;
		attributes?: IDataObject;
	};
}

/**
 * The v3 endpoint answers in JSON:API (`{ data: { id, type, attributes } }`) while every
 * v4 endpoint answers in JSend. Flatten it so both shapes chain the same way downstream.
 */
export async function flattenJsonApiResource(
	this: IExecuteSingleFunctions,
	data: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const resource = (response.body as JsonApiResponse)?.data;

	if (!resource?.attributes) return data;

	return [{ json: { id: resource.id, ...resource.attributes } }];
}
