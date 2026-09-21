'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { type ExpenseSummaryCategory, formatBaht } from '@/types/expense';

export default function ExpenseCategoryBarChart({ data }: { data: ExpenseSummaryCategory[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-10">ยังไม่มีข้อมูลค่าใช้จ่ายในช่วงนี้</div>;
  }

  const chartData = data.map((d) => ({ name: d.categoryName, total: d.total, color: d.color }));
  const height = Math.max(140, chartData.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e2e8f0" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          tickFormatter={(v) => formatBaht(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: '#334155' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value) => [`${formatBaht(Number(value))} บาท`, 'ยอดรวม']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={18}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
