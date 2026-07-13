'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import EndpointForm, { EndpointFormValues, toFormValues } from '@/components/apis-gen/EndpointForm';
import { apiGenApi } from '@/lib/api';
import { Collection, CustomEndpoint, CustomEndpointInput } from '@/types/apiGen';

export default function EditCustomEndpointPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idPrefix = useId();

  const [endpoint, setEndpoint] = useState<CustomEndpoint | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([apiGenApi.getCustomEndpoint(params.id), apiGenApi.listCollections(1, 100)])
      .then(([ep, cols]) => {
        setEndpoint(ep.data);
        setCollections(cols.data.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(payload: CustomEndpointInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await apiGenApi.updateCustomEndpoint(params.id, payload);
      setEndpoint(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update endpoint');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this custom endpoint?')) return;
    try {
      await apiGenApi.deleteCustomEndpoint(params.id);
      router.push('/apis-gen/custom-endpoints');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete endpoint');
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!endpoint) return <p className="text-sm text-red-600">{error ?? 'Not found'}</p>;

  const initialValues: EndpointFormValues = toFormValues(
    {
      name: endpoint.name,
      method: endpoint.method,
      action: endpoint.action,
      path: endpoint.path,
      collectionId: endpoint.collectionId,
      inputMapping: endpoint.inputMapping,
      transformSteps: endpoint.transformSteps,
      responseMapping: endpoint.responseMapping,
      authType: endpoint.authType,
      authUsername: endpoint.authUsername,
    },
    idPrefix,
  );

  return (
    <div className="max-w-2xl space-y-2">
      <FlowBreadcrumb
        items={[
          { label: 'APIs Gen', href: '/apis-gen' },
          { label: 'Custom Endpoints', href: '/apis-gen/custom-endpoints' },
          { label: endpoint.name },
        ]}
      />
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">{endpoint.name}</h1>
        <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-700">
          Delete endpoint
        </button>
      </div>

      <div className="mt-4">
        <EndpointForm
          key={endpoint.id}
          collections={collections}
          initialValues={initialValues}
          submitLabel="Save changes"
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
