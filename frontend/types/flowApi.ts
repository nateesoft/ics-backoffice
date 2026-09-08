export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiAuthType = 'None' | 'Basic Auth' | 'Bearer Token' | 'API Key';
export type ApiKind = 'REST API' | 'GraphQL';
export type StepType = 'Filter' | 'Validate' | 'Create' | 'Update' | 'Delete' | 'Export';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
export const API_AUTH_TYPES: ApiAuthType[] = ['None', 'Basic Auth', 'Bearer Token', 'API Key'];
export const API_KINDS: ApiKind[] = ['REST API', 'GraphQL'];
export const STEP_TYPES: StepType[] = ['Filter', 'Validate', 'Create', 'Update', 'Delete', 'Export'];

export interface ApiStep {
  id: string;
  type: StepType;
  items: string[];
  errorHandling: string[];
}

// Default logic template seeded onto a new step, per step type — editable afterwards.
export const STEP_TEMPLATES: Record<StepType, string[]> = {
  Filter: ['verify data to filter', 'response json with success or error message'],
  Validate: ['verify login credentials (username and password)', 'response json with success or error message'],
  Create: ['verify payload', 'execute insert to database', 'response json with success or error message'],
  Update: ['verify key and payload', 'execute update to database', 'response json with success or error message'],
  Delete: ['verify key to delete', 'execute delete from database', 'response json with success or error message'],
  Export: ['verify export parameters', 'query data from database', 'generate export file', 'response with file or success/error message'],
};

// Every step must define error handling — this is the default, editable afterwards.
export const DEFAULT_ERROR_HANDLING: string[] = [
  'catch any errors during the operation',
  'log the error for debugging',
  'return a user-friendly error message to the client',
];

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
  sampleData: string;
  steps: ApiStep[];
  createdAt: string;
  updatedAt: string;
}
