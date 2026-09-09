'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Quotation, QuotationInput, QuotationLayout } from '@/types/quotation';
import { buildQuotationPreview, paperWidthMm } from './renderQuotation';

interface Props {
  quotation: Quotation | QuotationInput;
  layout: QuotationLayout;
}

const MM_TO_PX = 96 / 25.4; // 1mm ที่ 96dpi

export default function QuotationPreview({ quotation, layout }: Props) {
  const html = useMemo(() => buildQuotationPreview(quotation, layout), [quotation, layout]);
  const paperPx = paperWidthMm(layout) * MM_TO_PX;

  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const recalc = () => {
      const avail = wrap.clientWidth;
      const s = Math.min(1, avail / paperPx);
      setScale(s);
      if (sheetRef.current) setSheetH(sheetRef.current.offsetHeight * s);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [paperPx, html]);

  return (
    <div ref={wrapRef} className="qt-preview-scroll w-full bg-slate-200/70 rounded-xl p-4">
      <div style={{ height: sheetH || undefined }}>
        <div
          ref={sheetRef}
          className="qt-preview-sheet"
          style={{
            width: paperPx,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
