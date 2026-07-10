'use client';
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import type { JsonSchema7 } from '@jsonforms/core';
import type { UiSchemaNode } from '@/types/flowUi';
import { customRenderers } from './customRenderers';
import './jsonforms-vanilla.css';

const renderers = [...vanillaRenderers, ...customRenderers];

interface LiveFormPreviewProps {
  schema: JsonSchema7;
  uiSchema: UiSchemaNode;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}

export default function LiveFormPreview({ schema, uiSchema, data, onDataChange }: LiveFormPreviewProps) {
  const hasFields = Boolean(uiSchema.elements?.length);

  return (
    <div className="jf-vanilla bg-white rounded-lg border border-slate-200 p-4 min-h-[52px]">
      {hasFields ? (
        <JsonForms
          schema={schema}
          uischema={uiSchema}
          data={data}
          renderers={renderers}
          cells={vanillaCells}
          onChange={({ data: newData }) => onDataChange(newData)}
        />
      ) : (
        <p className="text-xs text-slate-400 text-center py-3">
          ยังไม่มี element — ลาก field มาวางในโครงสร้างด้านซ้ายเพื่อดูตัวอย่างที่นี่
        </p>
      )}
    </div>
  );
}
