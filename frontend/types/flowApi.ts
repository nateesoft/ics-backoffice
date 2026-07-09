export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiAuthType = 'None' | 'Basic Auth' | 'Bearer Token' | 'API Key';
export type ApiKind = 'REST API' | 'GraphQL';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const API_AUTH_TYPES: ApiAuthType[] = ['None', 'Basic Auth', 'Bearer Token', 'API Key'];
export const API_KINDS: ApiKind[] = ['REST API', 'GraphQL'];

export interface FlowApiItem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  payload: string;
  authType: ApiAuthType;
  apiType: ApiKind;
  createdAt: string;
  updatedAt: string;
}
