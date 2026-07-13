export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null';

export interface FieldSchema {
  name: string;
  type: FieldType;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  fields: FieldSchema[];
  createdAt: string;
}

export interface RecordItem {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type CustomEndpointAction = 'list' | 'get' | 'create' | 'update' | 'delete';
export type CustomEndpointAuthType = 'none' | 'basic' | 'bearer';

export interface InputMappingRule {
  requestField: string;
  recordField: string;
  required: boolean;
}

export interface ResponseMappingRule {
  recordField: string;
  responseField: string;
}

export interface TransformStep {
  field: string;
  expression: string;
}

export interface CustomEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  action: CustomEndpointAction;
  collectionId: string;
  collection?: { id: string; name: string; slug: string };
  inputMapping: InputMappingRule[];
  transformSteps: TransformStep[];
  responseMapping: ResponseMappingRule[];
  authType: CustomEndpointAuthType;
  authUsername: string | null;
  createdAt: string;
}

export type CustomEndpointInput = Omit<CustomEndpoint, 'id' | 'createdAt' | 'collection'> & {
  authPassword?: string;
  authToken?: string;
};

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
