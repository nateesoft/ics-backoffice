import { type Expense, type ExpenseCategory, formatBaht } from '@/types/expense';

function esc(s: unknown): string {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

function fmtThaiDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  if (!m) return esc(s);
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
}

const reportCss = `
  .ex-paper { box-sizing: border-box; background: #fff; color: #0f172a;
    font-family: 'Sarabun','Noto Sans Thai',sans-serif; font-size: 13px; line-height: 1.55; }
  .ex-paper * { box-sizing: border-box; }
  .ex-title { text-align: center; margin-bottom: 4px; }
  .ex-title h1 { margin: 0; font-size: 19px; font-weight: 700; color: #4f46e5; }
  .ex-meta { text-align: center; color: #475569; font-size: 12px; margin-bottom: 14px; }
  .ex-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .ex-table th { background: #4f46e5; color: #fff; font-weight: 600; font-size: 12px; padding: 7px 8px; text-align: left; }
  .ex-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 12.5px; }
  .ex-table .ex-num { text-align: right; white-space: nowrap; }
  .ex-table .ex-center { text-align: center; white-space: nowrap; }
  .ex-table tbody tr:nth-child(even) td { background: #f8fafc; }
  .ex-table tfoot td { border-top: 2px solid #4f46e5; font-weight: 700; font-size: 13.5px; color: #4f46e5; }
  .ex-summary { margin-top: 18px; }
  .ex-summary h2 { font-size: 13px; color: #4f46e5; margin: 0 0 6px; }
  .ex-summary table { border-collapse: collapse; min-width: 280px; }
  .ex-summary td { padding: 4px 8px; font-size: 12.5px; }
  .ex-summary td.ex-num { text-align: right; }
  .ex-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .ex-footer { margin-top: 24px; text-align: right; color: #64748b; font-size: 11px; }
  @page { size: A4 portrait; margin: 14mm; }
  html, body { margin: 0; padding: 0; }
`;

export interface ExpenseReportParams {
  title: string;
  from: string;
  to: string;
  expenses: Expense[];
  categories: ExpenseCategory[];
}

function categoryOf(categories: ExpenseCategory[], id: number | null) {
  return categories.find((c) => c.id === id) ?? null;
}

function reportInner({ title, from, to, expenses, categories }: ExpenseReportParams): string {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const grandTotal = sorted.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = new Map<number, number>();
  for (const e of sorted) {
    const key = e.categoryId ?? 0;
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(e.amount));
  }
  const summaryRows = Array.from(byCategory.entries())
    .map(([id, total]) => ({ cat: id ? categoryOf(categories, id) : null, total }))
    .sort((a, b) => b.total - a.total);

  const rows = sorted
    .map((e, i) => {
      const cat = categoryOf(categories, e.categoryId);
      return `<tr>
        <td class="ex-center">${i + 1}</td>
        <td class="ex-center">${fmtThaiDate(e.date)}</td>
        <td>${esc(cat?.name ?? 'ไม่ระบุหมวดหมู่')}</td>
        <td>${esc(e.description)}</td>
        <td class="ex-num">${formatBaht(e.amount)}</td>
      </tr>`;
    })
    .join('');

  return `<div class="ex-paper">
    <div class="ex-title"><h1>รายงานค่าใช้จ่ายรายวัน</h1></div>
    <div class="ex-meta">${esc(title)} — ช่วงวันที่ ${fmtThaiDate(from)} ถึง ${fmtThaiDate(to)}</div>
    <table class="ex-table">
      <thead>
        <tr>
          <th style="width:36px">ลำดับ</th>
          <th style="width:90px">วันที่</th>
          <th style="width:140px">หมวดหมู่</th>
          <th>รายละเอียด</th>
          <th style="width:110px">จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px">ไม่มีรายการในช่วงที่เลือก</td></tr>'}
      </tbody>
      <tfoot>
        <tr><td colspan="4">รวมทั้งหมด</td><td class="ex-num">${formatBaht(grandTotal)}</td></tr>
      </tfoot>
    </table>

    <div class="ex-summary">
      <h2>สรุปตามหมวดหมู่</h2>
      <table>
        ${summaryRows
          .map(
            (r) => `<tr>
              <td><span class="ex-dot" style="background:${esc(r.cat?.color ?? '#94a3b8')}"></span>${esc(r.cat?.name ?? 'ไม่ระบุหมวดหมู่')}</td>
              <td class="ex-num">${formatBaht(r.total)}</td>
            </tr>`,
          )
          .join('')}
      </table>
    </div>

    <div class="ex-footer">พิมพ์เมื่อ ${new Date().toLocaleString('th-TH')}</div>
  </div>`;
}

export function buildExpenseReportDoc(params: ExpenseReportParams): string {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${esc(params.title || 'รายงานค่าใช้จ่าย')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: #fff; }
  ${reportCss}
</style>
</head>
<body>
${reportInner(params)}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 350);
  });
  window.addEventListener('afterprint', function () { window.close(); });
</script>
</body>
</html>`;
}

export function printExpenseReport(params: ExpenseReportParams): void {
  const win = window.open('', '_blank', 'width=980,height=1200');
  if (!win) {
    alert('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ — โปรดอนุญาต popup สำหรับเว็บนี้');
    return;
  }
  win.document.open();
  win.document.write(buildExpenseReportDoc(params));
  win.document.close();
}
