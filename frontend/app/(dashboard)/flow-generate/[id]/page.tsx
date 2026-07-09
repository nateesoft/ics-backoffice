'use client';
import FlowItemDetailPage from '@/components/flow-generate/FlowItemDetailPage';
import { flowProjectsStore } from '@/lib/flowItemsStore';

export default function FlowProjectDetailPage() {
  return (
    <FlowItemDetailPage
      store={flowProjectsStore}
      basePath="/flow-generate"
      breadcrumbBase={[{ label: 'Flow Generate', href: '/flow-generate' }]}
    />
  );
}
