'use client';
import { useState } from 'react';
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import Modal from '@/components/ui/Modal';
import BuilderCanvas from './design/BuilderCanvas';
import { ActionTarget } from './design/ActionStepsEditor';
import UisGenLivePreview, { LivePreviewNodeRef } from './UisGenLivePreview';

interface PageDesignerModalProps {
  title: string;
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  nodes: LivePreviewNodeRef[];
  targets: ActionTarget[];
  onSchemaChange: (schema: JsonSchema7) => void;
  onUiSchemaChange: (uiSchema: UiSchemaNode) => void;
  onDataChange: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

type Tab = 'design' | 'preview';

export default function PageDesignerModal({
  title, schema, uiSchema, data, nodes, targets, onSchemaChange, onUiSchemaChange, onDataChange, onClose,
}: PageDesignerModalProps) {
  const [tab, setTab] = useState<Tab>('design');

  return (
    <Modal title={title} onClose={onClose} size="xl" allowFullscreen>
      <div className="flex items-center gap-1 mb-4 border-b border-slate-100 -mt-1">
        {(['design', 'preview'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'design' ? 'ออกแบบ' : 'Preview'}
          </button>
        ))}
      </div>

      {tab === 'design' ? (
        <BuilderCanvas
          schema={schema}
          uiSchema={uiSchema}
          targets={targets}
          onSchemaChange={onSchemaChange}
          onUiSchemaChange={onUiSchemaChange}
        />
      ) : (
        <UisGenLivePreview
          schema={schema}
          uiSchema={uiSchema}
          data={data}
          onDataChange={onDataChange}
          nodes={nodes}
        />
      )}
    </Modal>
  );
}
