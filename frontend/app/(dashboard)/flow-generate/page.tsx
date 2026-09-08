'use client';
import FlowItemsListPage from '@/components/flow-generate/FlowItemsListPage';
import { flowProjectsStore } from '@/lib/flowItemsStore';

export default function FlowGeneratePage() {
  return (
    <FlowItemsListPage
      store={flowProjectsStore}
      basePath="/flow-generate"
      breadcrumb={[{ label: 'Flow Generate' }]}
      title="Flow Generate"
      subtitle="รายการโปรเจคที่เคยสร้างสำหรับ Flow Generate"
    />
  );
}
