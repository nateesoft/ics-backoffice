import {
  type Quotation,
  type QuotationInput,
  type QuotationLayout,
  type QuotationItem,
  type PaperSize,
  computeTotals,
  formatMoney,
  bahtText,
} from '@/types/quotation';

type Q = Quotation | QuotationInput;

const PAPER_DIM_MM: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  A3: [297, 420],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
};

export function paperWidthMm(layout: QuotationLayout): number {
  const [w, h] = PAPER_DIM_MM[layout.paperSize] ?? PAPER_DIM_MM.A4;
  return layout.orientation === 'landscape' ? h : w;
}

function esc(s: unknown): string {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
function nl2br(s: unknown): string {
  return esc(s).replace(/\n/g, '<br>');
}

export function quotationCss(layout: QuotationLayout, forPrint: boolean): string {
  const accent = layout.accentColor || '#4f46e5';
  const widthMm = paperWidthMm(layout);
  const pageRule = forPrint
    ? `@page { size: ${layout.paperSize} ${layout.orientation}; margin: ${layout.marginMm}mm; }
       html, body { margin: 0; padding: 0; }
       .qt-paper { width: auto; min-height: auto; padding: 0; box-shadow: none; margin: 0; }`
    : `.qt-paper { width: ${widthMm}mm; padding: ${layout.marginMm}mm; box-shadow: 0 1px 12px rgba(15,23,42,.14); margin: 0 auto; }`;

  const base = `
  .qt-paper { box-sizing: border-box; background: #fff; color: #0f172a;
    font-family: ${layout.fontFamily || "'Sarabun','Noto Sans Thai',sans-serif"}; font-size: 13px; line-height: 1.55; }
  .qt-paper * { box-sizing: border-box; }`;

  if (layout.variant === 'ics-classic') {
    return `${base}\n${icsClassicCss(accent)}\n${pageRule}`;
  }

  return `${base}
  .qt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .qt-logo { max-height: 68px; max-width: 220px; object-fit: contain; }
  .qt-company-name { font-size: 17px; font-weight: 700; color: ${accent}; }
  .qt-muted { color: #475569; font-size: 12px; white-space: pre-line; }
  .qt-title { text-align: right; }
  .qt-title h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${accent}; letter-spacing: .5px; }
  .qt-meta { margin-top: 6px; font-size: 12px; color: #334155; }
  .qt-meta b { color: #0f172a; }
  .qt-rule { height: 3px; background: ${accent}; border-radius: 3px; margin: 14px 0; }
  .qt-parties { display: flex; gap: 24px; margin-bottom: 12px; }
  .qt-parties > div { flex: 1; }
  .qt-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: ${accent}; font-weight: 700; margin-bottom: 3px; }
  .qt-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .qt-table th { background: ${accent}; color: #fff; font-weight: 600; font-size: 12px; padding: 7px 8px; text-align: left; }
  .qt-table td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 12.5px; }
  .qt-table .qt-num { text-align: right; white-space: nowrap; }
  .qt-table .qt-center { text-align: center; white-space: nowrap; }
  .qt-table tbody tr:nth-child(even) td { background: #f8fafc; }
  .qt-desc-sub { color: #64748b; font-size: 11.5px; white-space: pre-line; }
  .qt-totals { margin-top: 12px; display: flex; justify-content: flex-end; }
  .qt-totals table { border-collapse: collapse; min-width: 280px; }
  .qt-totals td { padding: 5px 8px; font-size: 12.5px; }
  .qt-totals td.qt-num { text-align: right; }
  .qt-totals tr.qt-grand td { border-top: 2px solid ${accent}; font-weight: 700; font-size: 14px; color: ${accent}; }
  .qt-baht { margin-top: 8px; padding: 7px 10px; background: #f1f5f9; border-left: 3px solid ${accent};
    font-size: 12.5px; font-weight: 600; }
  .qt-section { margin-top: 14px; }
  .qt-section .qt-label { margin-bottom: 4px; }
  .qt-section p { margin: 0; white-space: pre-line; font-size: 12px; color: #334155; }
  .qt-signs { display: flex; gap: 40px; margin-top: 40px; }
  .qt-signs > div { flex: 1; text-align: center; }
  .qt-signline { border-top: 1px dotted #94a3b8; margin: 44px 12px 6px; }
  .qt-footer { margin-top: 22px; text-align: center; color: #64748b; font-size: 11.5px; }
  ${pageRule}
  `;
}

function columnEnabled(layout: QuotationLayout, key: string): boolean {
  return layout.columns.some((c) => c.key === key && c.enabled);
}
function columnLabel(layout: QuotationLayout, key: string, fallback: string): string {
  return layout.columns.find((c) => c.key === key)?.label || fallback;
}

export function quotationInner(q: Q, layout: QuotationLayout): string {
  if (layout.variant === 'ics-classic') return icsClassicInner(q, layout);

  const items: QuotationItem[] = q.items ?? [];
  const totals = computeTotals(items, {
    discount: q.discount,
    vatRate: q.vatRate,
    withholdingRate: q.withholdingRate,
  });
  const cur = layout.currency || 'บาท';

  const cols: { key: string; label: string; cls?: string }[] = [];
  if (columnEnabled(layout, 'no')) cols.push({ key: 'no', label: columnLabel(layout, 'no', 'ลำดับ'), cls: 'qt-center' });
  if (columnEnabled(layout, 'description'))
    cols.push({ key: 'description', label: columnLabel(layout, 'description', 'รายการ') });
  if (columnEnabled(layout, 'quantity'))
    cols.push({ key: 'quantity', label: columnLabel(layout, 'quantity', 'จำนวน'), cls: 'qt-num' });
  if (columnEnabled(layout, 'unit')) cols.push({ key: 'unit', label: columnLabel(layout, 'unit', 'หน่วย'), cls: 'qt-center' });
  if (columnEnabled(layout, 'unitPrice'))
    cols.push({ key: 'unitPrice', label: columnLabel(layout, 'unitPrice', 'ราคา/หน่วย'), cls: 'qt-num' });
  if (columnEnabled(layout, 'discount'))
    cols.push({ key: 'discount', label: columnLabel(layout, 'discount', 'ส่วนลด'), cls: 'qt-num' });
  if (columnEnabled(layout, 'amount'))
    cols.push({ key: 'amount', label: columnLabel(layout, 'amount', 'จำนวนเงิน'), cls: 'qt-num' });

  const rows = items
    .map((it, i) => {
      const cells = cols
        .map((c) => {
          switch (c.key) {
            case 'no':
              return `<td class="qt-center">${i + 1}</td>`;
            case 'description':
              return `<td>${esc(it.description) || '&nbsp;'}</td>`;
            case 'quantity':
              return `<td class="qt-num">${formatMoney(it.quantity).replace(/\.00$/, '')}</td>`;
            case 'unit':
              return `<td class="qt-center">${esc(it.unit)}</td>`;
            case 'unitPrice':
              return `<td class="qt-num">${formatMoney(it.unitPrice)}</td>`;
            case 'discount':
              return `<td class="qt-num">${it.discount ? formatMoney(it.discount) : '-'}</td>`;
            case 'amount':
              return `<td class="qt-num">${formatMoney(totals.lineAmounts[i])}</td>`;
            default:
              return '<td></td>';
          }
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const totalRows: string[] = [
    `<tr><td>รวมเป็นเงิน</td><td class="qt-num">${formatMoney(totals.subtotal)}</td></tr>`,
  ];
  if (totals.discount > 0)
    totalRows.push(`<tr><td>หักส่วนลด</td><td class="qt-num">-${formatMoney(totals.discount)}</td></tr>`);
  if (totals.discount > 0)
    totalRows.push(`<tr><td>ยอดหลังหักส่วนลด</td><td class="qt-num">${formatMoney(totals.afterDiscount)}</td></tr>`);
  if ((q.vatRate ?? 0) > 0)
    totalRows.push(
      `<tr><td>ภาษีมูลค่าเพิ่ม ${formatMoney(q.vatRate ?? 0).replace(/\.00$/, '')}%</td><td class="qt-num">${formatMoney(totals.vat)}</td></tr>`,
    );
  totalRows.push(
    `<tr class="qt-grand"><td>ยอดรวมทั้งสิ้น</td><td class="qt-num">${formatMoney(totals.grandTotal)} ${esc(cur)}</td></tr>`,
  );
  if ((q.withholdingRate ?? 0) > 0) {
    totalRows.push(
      `<tr><td>หัก ณ ที่จ่าย ${formatMoney(q.withholdingRate ?? 0).replace(/\.00$/, '')}%</td><td class="qt-num">-${formatMoney(totals.withholding)}</td></tr>`,
    );
    totalRows.push(
      `<tr class="qt-grand"><td>ยอดชำระสุทธิ</td><td class="qt-num">${formatMoney(totals.netPayable)} ${esc(cur)}</td></tr>`,
    );
  }

  const contactBits = [
    layout.companyAddress,
    layout.companyPhone ? `โทร. ${layout.companyPhone}` : '',
    layout.companyEmail,
    layout.companyTaxId ? `เลขประจำตัวผู้เสียภาษี ${layout.companyTaxId}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const custBits = [
    q.customerAddress,
    q.customerPhone ? `โทร. ${q.customerPhone}` : '',
    q.customerEmail,
    q.customerTaxId ? `เลขประจำตัวผู้เสียภาษี ${q.customerTaxId}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `
  <div class="qt-paper">
    <div class="qt-head">
      <div>
        ${layout.logoUrl ? `<img class="qt-logo" src="${esc(layout.logoUrl)}" alt="logo">` : ''}
        <div class="qt-company-name">${esc(layout.companyName)}</div>
        <div class="qt-muted">${nl2br(contactBits)}</div>
      </div>
      <div class="qt-title">
        <h1>${esc(layout.documentTitle || 'ใบเสนอราคา')}</h1>
        <div class="qt-meta">
          <div><b>เลขที่:</b> ${esc(q.quotationNo) || '-'}</div>
          <div><b>วันที่:</b> ${esc(q.issueDate) || '-'}</div>
          <div><b>ยืนราคาถึง:</b> ${esc(q.validUntil) || '-'}</div>
          <div><b>สถานะ:</b> ${esc(statusText(q.status))}</div>
        </div>
      </div>
    </div>
    <div class="qt-rule"></div>
    ${layout.headerNote ? `<div class="qt-muted" style="margin-bottom:10px">${nl2br(layout.headerNote)}</div>` : ''}
    <div class="qt-parties">
      <div>
        <div class="qt-label">ลูกค้า</div>
        <div><b>${esc(q.customerName) || '-'}</b></div>
        ${q.attention ? `<div class="qt-muted">เรียน ${esc(q.attention)}</div>` : ''}
        <div class="qt-muted">${nl2br(custBits)}</div>
      </div>
      <div>
        <div class="qt-label">โครงการ/งาน</div>
        <div>${esc(q.projectName) || '-'}</div>
      </div>
    </div>
    <table class="qt-table">
      <thead><tr>${cols.map((c) => `<th class="${c.cls ?? ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows || `<tr><td colspan="${cols.length}" class="qt-center qt-muted">— ไม่มีรายการ —</td></tr>`}</tbody>
    </table>
    <div class="qt-totals"><table>${totalRows.join('')}</table></div>
    <div class="qt-baht">( ${esc(bahtText((q.withholdingRate ?? 0) > 0 ? totals.netPayable : totals.grandTotal))} )</div>
    ${q.note ? `<div class="qt-section"><div class="qt-label">หมายเหตุ</div><p>${nl2br(q.note)}</p></div>` : ''}
    ${
      (q.terms || layout.terms)
        ? `<div class="qt-section"><div class="qt-label">เงื่อนไข</div><p>${nl2br(q.terms || layout.terms)}</p></div>`
        : ''
    }
    ${
      layout.bankDetails
        ? `<div class="qt-section"><div class="qt-label">รายละเอียดการชำระเงิน</div><p>${nl2br(layout.bankDetails)}</p></div>`
        : ''
    }
    <div class="qt-signs">
      <div><div class="qt-signline"></div>ผู้เสนอราคา<br>(${esc(layout.signatureLabel || 'ผู้มีอำนาจลงนาม')})</div>
      <div><div class="qt-signline"></div>ผู้อนุมัติสั่งซื้อ<br>(ลูกค้า)</div>
    </div>
    ${layout.footerNote ? `<div class="qt-footer">${nl2br(layout.footerNote)}</div>` : ''}
  </div>`;
}

function statusText(s: unknown): string {
  const m: Record<string, string> = {
    draft: 'ฉบับร่าง',
    sent: 'ส่งแล้ว',
    accepted: 'อนุมัติ',
    rejected: 'ปฏิเสธ',
  };
  return m[String(s)] ?? 'ฉบับร่าง';
}

/** ใช้กับ dangerouslySetInnerHTML สำหรับ preview บนหน้าจอ */
export function buildQuotationPreview(q: Q, layout: QuotationLayout): string {
  return `<style>${quotationCss(layout, false)}</style>${quotationInner(q, layout)}`;
}

/** เอกสาร HTML เต็มสำหรับหน้าต่างพิมพ์ */
export function buildQuotationDoc(q: Q, layout: QuotationLayout): string {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${esc(q.quotationNo || 'ใบเสนอราคา')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: #fff; }
  ${quotationCss(layout, true)}
</style>
</head>
<body>
${quotationInner(q, layout)}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 350);
  });
  window.addEventListener('afterprint', function () { window.close(); });
</script>
</body>
</html>`;
}

/** เปิดหน้าต่างพิมพ์ พร้อมกำหนดขนาดกระดาษ/แนววางผ่าน override ได้ */
export function printQuotation(
  q: Q,
  layout: QuotationLayout,
  override?: { paperSize?: PaperSize; orientation?: 'portrait' | 'landscape'; marginMm?: number },
): void {
  const merged: QuotationLayout = { ...layout, ...override };
  const win = window.open('', '_blank', 'width=980,height=1200');
  if (!win) {
    alert('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ — โปรดอนุญาต popup สำหรับเว็บนี้');
    return;
  }
  win.document.open();
  win.document.write(buildQuotationDoc(q, merged));
  win.document.close();
}

// ────────────────────────────────────────────────────────────
// variant 'ics-classic' — ฟอร์มตามแบบกระดาษของ IN CONCEPT SERVICE
// (มีกรอบทึบ หัวตารางสองภาษา กล่องชื่อเอกสารสีชมพู ช่องเซ็น 3 ช่อง)
// ────────────────────────────────────────────────────────────

function splitBilingual(s: unknown): [string, string] {
  const parts = String(s ?? '').split(' / ');
  return [parts[0] ?? '', parts.slice(1).join(' / ')];
}

/** YYYY-MM-DD → DD/MM/พ.ศ. ; ถ้าแปลงไม่ได้คืนค่าเดิม */
function fmtThaiDate(s: unknown): string {
  const str = String(s ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return esc(str);
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
}

export function icsClassicCss(accent: string): string {
  const pink = '#f6dede';
  return `
  .qt-paper { font-size: 12px; line-height: 1.5; color: #111; }
  .qtc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .qtc-logo { max-height: 76px; max-width: 190px; object-fit: contain; }
  .qtc-wordmark { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 700;
    font-size: 42px; letter-spacing: 8px; color: ${accent}; line-height: 1; }
  .qtc-co { text-align: right; }
  .qtc-co-name { font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 700;
    letter-spacing: .5px; color: ${accent}; }
  .qtc-co-addr { font-size: 11px; white-space: pre-line; }
  .qtc-co-contact { font-size: 11px; margin-top: 2px; }
  .qtc-titlebox { display: flex; justify-content: flex-end; margin-top: 8px; }
  .qtc-titlebox-inner { display: flex; border: 1px solid #000; }
  .qtc-tt-l { background: ${pink}; padding: 6px 20px; text-align: center; border-right: 1px solid #000; min-width: 160px; }
  .qtc-tt-en { font-weight: 700; font-size: 15px; }
  .qtc-tt-th { font-weight: 700; font-size: 13px; }
  .qtc-tt-r { padding: 6px 16px; text-align: center; min-width: 150px; font-size: 11px; }
  .qtc-qno { font-weight: 700; font-size: 12.5px; margin-top: 6px; }
  .qtc-parties { display: flex; gap: 22px; margin-top: 10px; }
  .qtc-parties-l { flex: 1.8; }
  .qtc-parties-l .qtc-pl-row { margin-bottom: 1px; white-space: pre-line; }
  .qtc-parties-r { flex: 1; align-self: flex-start; }
  .qtc-daterow { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px dotted #999; padding: 2px 0; }
  .qtc-daterow span:last-child { font-weight: 600; }
  .qtc-issuer { display: flex; justify-content: space-between; gap: 22px; margin-top: 8px; padding-top: 6px; border-top: 1px solid #000; }
  .qtc-issuer-l { flex: 1.8; white-space: pre-line; }
  .qtc-issuer-r { flex: 1; white-space: pre-line; }
  .qtc-issuer .qtc-tag { font-weight: 700; }
  .qtc-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .qtc-table th, .qtc-table td { border: 1px solid #000; padding: 4px 6px; font-size: 11.5px; vertical-align: top; }
  .qtc-table th { text-align: center; font-weight: 700; }
  .qtc-table th .qtc-th-en { display: block; font-weight: 400; font-size: 9.5px; }
  .qtc-table td.qtc-num { text-align: right; white-space: nowrap; }
  .qtc-table td.qtc-center { text-align: center; }
  .qtc-fill td { border-top: none; border-bottom: none; }
  .qtc-lower { display: flex; border: 1px solid #000; border-top: none; }
  .qtc-lower-l { flex: 1.35; padding: 6px 8px; border-right: 1px solid #000; }
  .qtc-lower-l .qtc-ln { margin-bottom: 3px; }
  .qtc-lower-r { flex: 1; }
  .qtc-tot { width: 100%; border-collapse: collapse; }
  .qtc-tot td { padding: 3px 8px; font-size: 11.5px; border-bottom: 1px solid #ccc; }
  .qtc-tot tr:first-child td { border-top: 1px solid #000; }
  .qtc-tot td.qtc-num { text-align: right; white-space: nowrap; }
  .qtc-tot tr.qtc-grand td { font-weight: 700; background: ${pink}; border-bottom: 1px solid #000; }
  .qtc-tot .qtc-lbl-en { color: #555; font-size: 10px; }
  .qtc-baht { border: 1px solid #000; border-top: none; padding: 4px 8px; font-weight: 700; font-size: 11.5px; }
  .qtc-sign { display: flex; border: 1px solid #000; border-top: none; text-align: center; }
  .qtc-sign > div { flex: 1; padding: 8px 6px; }
  .qtc-sign > div + div { border-left: 1px solid #000; }
  .qtc-sig-space { height: 44px; }
  .qtc-sig-name { height: 44px; display: flex; align-items: flex-end; justify-content: center; font-weight: 700; }
  .qtc-sig-role { margin-top: 2px; }
  .qtc-sig-date { margin-top: 4px; font-size: 10.5px; color: #333; }
  .qtc-note { margin-top: 8px; font-size: 11px; white-space: pre-line; }
  `;
}

export function icsClassicInner(q: Q, layout: QuotationLayout): string {
  const items: QuotationItem[] = q.items ?? [];
  const totals = computeTotals(items, {
    discount: q.discount,
    vatRate: q.vatRate,
    withholdingRate: q.withholdingRate,
  });

  const cols: { key: string; label: string; cls?: string }[] = [];
  if (columnEnabled(layout, 'no')) cols.push({ key: 'no', label: columnLabel(layout, 'no', 'เลขที่ / No.'), cls: 'qtc-center' });
  if (columnEnabled(layout, 'description'))
    cols.push({ key: 'description', label: columnLabel(layout, 'description', 'รายการ / Description') });
  if (columnEnabled(layout, 'quantity'))
    cols.push({ key: 'quantity', label: columnLabel(layout, 'quantity', 'จำนวน / Quantity'), cls: 'qtc-num' });
  if (columnEnabled(layout, 'unit'))
    cols.push({ key: 'unit', label: columnLabel(layout, 'unit', 'หน่วย / Unit'), cls: 'qtc-center' });
  if (columnEnabled(layout, 'unitPrice'))
    cols.push({ key: 'unitPrice', label: columnLabel(layout, 'unitPrice', 'ราคา/หน่วย / Price/Unit'), cls: 'qtc-num' });
  if (columnEnabled(layout, 'discount'))
    cols.push({ key: 'discount', label: columnLabel(layout, 'discount', 'ส่วนลด / Discount'), cls: 'qtc-num' });
  if (columnEnabled(layout, 'amount'))
    cols.push({ key: 'amount', label: columnLabel(layout, 'amount', 'จำนวนเงิน / Amount'), cls: 'qtc-num' });

  const headCells = cols
    .map((c) => {
      const [th, en] = splitBilingual(c.label);
      return `<th class="${c.cls ?? ''}">${esc(th)}${en ? `<span class="qtc-th-en">${esc(en)}</span>` : ''}</th>`;
    })
    .join('');

  const bodyRows = items
    .map((it, i) => {
      const cells = cols
        .map((c) => {
          switch (c.key) {
            case 'no':
              return `<td class="qtc-center">${i + 1}</td>`;
            case 'description':
              return `<td>${esc(it.description) || '&nbsp;'}</td>`;
            case 'quantity':
              return `<td class="qtc-num">${formatMoney(it.quantity).replace(/\.00$/, '')}</td>`;
            case 'unit':
              return `<td class="qtc-center">${esc(it.unit)}</td>`;
            case 'unitPrice':
              return `<td class="qtc-num">${it.unitPrice ? formatMoney(it.unitPrice) : '-'}</td>`;
            case 'discount':
              return `<td class="qtc-num">${it.discount ? formatMoney(it.discount) : '-'}</td>`;
            case 'amount':
              return `<td class="qtc-num">${totals.lineAmounts[i] ? formatMoney(totals.lineAmounts[i]) : '-'}</td>`;
            default:
              return '<td></td>';
          }
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const fillerH = Math.max(0, (9 - items.length) * 24);
  const fillerRow = fillerH
    ? `<tr class="qtc-fill"><td colspan="${cols.length}" style="height:${fillerH}px">&nbsp;</td></tr>`
    : '';

  // ── ยอดรวม ──
  const discPct = totals.subtotal > 0 ? (totals.discount / totals.subtotal) * 100 : 0;
  const totRow = (thLbl: string, enLbl: string, val: string, grand = false) =>
    `<tr class="${grand ? 'qtc-grand' : ''}"><td>${esc(thLbl)} <span class="qtc-lbl-en">${esc(enLbl)}</span></td><td class="qtc-num">${val}</td></tr>`;

  const totRows: string[] = [totRow('รวมเป็นเงิน', 'Subtotal', formatMoney(totals.subtotal))];
  totRows.push(
    totRow(
      'หักส่วนลดพิเศษ',
      'Special Discount',
      totals.discount > 0
        ? `${formatMoney(totals.discount)}${discPct ? ` (${discPct.toFixed(2)}%)` : ''}`
        : '-',
    ),
  );
  totRows.push(totRow('ยอดรวมหักส่วนลด', 'After Discount', formatMoney(totals.afterDiscount)));
  if ((q.vatRate ?? 0) > 0)
    totRows.push(
      totRow(
        `จำนวนภาษีมูลค่าเพิ่ม ${formatMoney(q.vatRate ?? 0).replace(/\.00$/, '')} %`,
        'Vat',
        formatMoney(totals.vat),
      ),
    );
  totRows.push(totRow('จำนวนเงินรวมทั้งสิ้น', 'Total', formatMoney(totals.grandTotal), true));
  if ((q.withholdingRate ?? 0) > 0) {
    totRows.push(
      totRow(
        `หัก ณ ที่จ่าย ${formatMoney(q.withholdingRate ?? 0).replace(/\.00$/, '')} %`,
        'Withholding',
        `-${formatMoney(totals.withholding)}`,
      ),
    );
    totRows.push(totRow('ยอดชำระสุทธิ', 'Net Payable', formatMoney(totals.netPayable), true));
  }

  const bahtVal = (q.withholdingRate ?? 0) > 0 ? totals.netPayable : totals.grandTotal;

  const coAddr = String(layout.companyAddress ?? '');
  const coAddrTh = coAddr.split('\n')[0] ?? '';

  const logoBlock = layout.logoUrl
    ? `<img class="qtc-logo" src="${esc(layout.logoUrl)}" alt="logo">`
    : `<div class="qtc-wordmark">ICS</div>`;

  const plRow = (label: string, value: unknown) =>
    `<div class="qtc-pl-row"><b>${esc(label)}</b> ${esc(value) || ''}</div>`;

  const dateRow = (label: string, value: string) =>
    `<div class="qtc-daterow"><span>${esc(label)}</span><span>${value || '-'}</span></div>`;

  const lowerLine = (label: string, value: unknown) =>
    value ? `<div class="qtc-ln"><b>${esc(label)}</b> ${esc(value)}</div>` : '';

  const extraNote = [q.note, q.terms || layout.terms].filter(Boolean).join('\n');

  return `
  <div class="qt-paper">
    <div class="qtc-head">
      <div>${logoBlock}</div>
      <div class="qtc-co">
        <div class="qtc-co-name">${esc(layout.companyName)}</div>
        <div class="qtc-co-addr">${nl2br(coAddr)}</div>
        <div class="qtc-co-contact">${layout.companyPhone ? `Tel. ${esc(layout.companyPhone)}` : ''}${
          layout.companyEmail ? `&nbsp;&nbsp;Email : ${esc(layout.companyEmail)}` : ''
        }</div>
      </div>
    </div>

    <div class="qtc-titlebox">
      <div class="qtc-titlebox-inner">
        <div class="qtc-tt-l">
          <div class="qtc-tt-en">Quotation</div>
          <div class="qtc-tt-th">${esc(layout.documentTitle || 'ใบเสนอราคา')}</div>
        </div>
        <div class="qtc-tt-r">
          <div>ลำดับที่ / No.</div>
          <div class="qtc-qno">${esc(q.quotationNo) || '-'}</div>
        </div>
      </div>
    </div>

    <div class="qtc-parties">
      <div class="qtc-parties-l">
        ${plRow('ชื่อลูกค้า :', q.customerName)}
        ${plRow('ที่อยู่ :', q.customerAddress)}
        ${plRow('Tel :', q.customerPhone)}
        ${plRow('E-Mail :', q.customerEmail)}
        ${plRow('เลขผู้เสียภาษี / TAX ID :', q.customerTaxId)}
        ${plRow('ผู้ติดต่อ :', q.attention)}
      </div>
      <div class="qtc-parties-r">
        ${dateRow('วันที่ / Date', fmtThaiDate(q.issueDate))}
        ${dateRow('ใช้ได้ถึง / Valid Until', fmtThaiDate(q.validUntil))}
        ${dateRow('อ้างอิง / Ref.', esc(q.projectName) || '-')}
      </div>
    </div>

    <div class="qtc-issuer">
      <div class="qtc-issuer-l"><span class="qtc-tag">ผู้ออก</span> ${esc(layout.companyName)}<br>${esc(coAddrTh)}</div>
      <div class="qtc-issuer-r">${
        layout.companyTaxId ? `เลขผู้เสียภาษี / TAX ID ${esc(layout.companyTaxId)}<br>` : ''
      }${layout.companyPhone ? `โทร. ${esc(layout.companyPhone)}<br>` : ''}${
        layout.companyEmail ? `Email : ${esc(layout.companyEmail)}` : ''
      }</div>
    </div>

    <table class="qtc-table">
      <thead><tr>${headCells}</tr></thead>
      <tbody>
        ${bodyRows || `<tr><td colspan="${cols.length}" class="qtc-center">— ไม่มีรายการ —</td></tr>`}
        ${fillerRow}
      </tbody>
    </table>

    <div class="qtc-lower">
      <div class="qtc-lower-l">
        ${lowerLine('กำหนดยืนราคา / Price Validity :', layout.priceValidity)}
        ${lowerLine('กำหนดส่งของ / Delivery Period :', layout.deliveryPeriod)}
        ${lowerLine('การชำระเงิน / Payment Terms :', layout.paymentTerms)}
      </div>
      <div class="qtc-lower-r">
        <table class="qtc-tot">${totRows.join('')}</table>
      </div>
    </div>

    <div class="qtc-baht">( ${esc(bahtText(bahtVal))} )</div>

    <div class="qtc-sign">
      <div>
        <div class="qtc-sig-space"></div>
        <div class="qtc-sig-role">ผู้สั่งซื้อ</div>
        <div class="qtc-sig-date">วันที่ / Date ..................</div>
      </div>
      <div>
        <div class="qtc-sig-space"></div>
        <div class="qtc-sig-role">ผู้อนุมัติ</div>
        <div class="qtc-sig-date">วันที่ / Date ..................</div>
      </div>
      <div>
        <div class="qtc-sig-name">${esc(layout.issuerName) || '&nbsp;'}</div>
        <div class="qtc-sig-role">${esc(layout.signatureLabel || 'ผู้เสนอราคา')}</div>
        <div class="qtc-sig-date">วันที่ / Date ${fmtThaiDate(q.issueDate)}</div>
      </div>
    </div>

    ${extraNote ? `<div class="qtc-note">${nl2br(extraNote)}</div>` : ''}
  </div>`;
}
