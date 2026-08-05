import { version } from '../../../package.json';

/**
 * Identifies this node in Eventtia's request logs. Without it every call arrives
 * as `axios/x.y.z`, indistinguishable from any other script hitting the API.
 */
export const USER_AGENT = `n8n-nodes-eventtia/${version}`;
