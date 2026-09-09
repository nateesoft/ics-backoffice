'use client';
import { useParams } from 'next/navigation';
import QuotationEditor from '@/components/quotations/QuotationEditor';

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return <div className="p-8 text-slate-400">ไม่พบใบเสนอราคา</div>;
  return <QuotationEditor id={id} />;
}
