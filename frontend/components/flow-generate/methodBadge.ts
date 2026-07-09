import { HttpMethod } from '@/types/flowApi';

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-blue-50 text-blue-600',
  POST: 'bg-green-50 text-green-600',
  PUT: 'bg-amber-50 text-amber-600',
  PATCH: 'bg-purple-50 text-purple-600',
  DELETE: 'bg-red-50 text-red-600',
};
