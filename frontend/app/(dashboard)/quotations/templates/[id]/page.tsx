'use client';
import { useParams } from 'next/navigation';
import TemplateDesigner from '@/components/quotations/TemplateDesigner';

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return <div className="p-8 text-slate-400">ไม่พบแม่แบบ</div>;
  return <TemplateDesigner id={id} />;
}
