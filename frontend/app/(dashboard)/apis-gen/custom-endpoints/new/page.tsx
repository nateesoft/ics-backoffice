'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import FlowBreadcrumb from '@/components/flow-generate/FlowBreadcrumb';
import EndpointForm, { defaultFormValues } from '@/components/apis-gen/EndpointForm';
import { apiGenApi } from '@/lib/api';
import { Collection, CustomEndpointInput } from '@/types/apiGen';

function NewCustomEndpointForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCollectionId = searchParams.get('collectionId') ?? '';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGenApi
      .listCollections(1, 100)
      .then((res) => setCollections(res.data.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load collections'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(payload: CustomEndpointInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await apiGenApi.createCustomEndpoint(payload);
      router.push(`/apis-gen/custom-endpoints/${res.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create endpoint');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <EndpointForm
      collections={collections}
      initialValues={{ ...defaultFormValues(), collectionId: preselectedCollectionId }}
      submitLabel="Create endpoint"
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}

export default function NewCustomEndpointPage() {
  return (
    <div className="max-w-2xl space-y-2">
      <FlowBreadcrumb
        items={[
          { label: 'APIs Gen', href: '/apis-gen' },
          { label: 'Custom Endpoints', href: '/apis-gen/custom-endpoints' },
          { label: 'New' },
        ]}
      />
      <h1 className="text-xl font-bold text-slate-800">New custom endpoint</h1>

      <div className="mt-4">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
          <NewCustomEndpointForm />
        </Suspense>
      </div>
    </div>
  );
}
