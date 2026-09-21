export interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export type ExpenseCategoryInput = { name?: string; color?: string };

export function emptyExpenseCategory(): ExpenseCategoryInput {
  return { name: '', color: '#6366f1' };
}

export interface ExpenseAttachment {
  id: number;
  expenseId: number;
  storedName: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  categoryId: number | null;
  amount: number;
  description: string;
  locationLat: number | null;
  locationLng: number | null;
  locationLabel: string | null;
  createdBy: string;
  attachments: ExpenseAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Partial<
  Omit<Expense, 'id' | 'attachments' | 'createdBy' | 'createdAt' | 'updatedAt'>
>;

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyExpense(date?: string): ExpenseInput {
  return {
    date: date || todayStr(),
    categoryId: null,
    amount: 0,
    description: '',
    locationLat: null,
    locationLng: null,
    locationLabel: null,
  };
}

export interface ExpenseSummaryCategory {
  categoryId: number | null;
  categoryName: string;
  color: string;
  total: number;
}

export interface ExpenseSummaryPeriod {
  total: number;
  count: number;
  byCategory: ExpenseSummaryCategory[];
}

export interface ExpenseSummary {
  date: string;
  day: ExpenseSummaryPeriod;
  month: ExpenseSummaryPeriod;
  year: ExpenseSummaryPeriod;
}

export function formatBaht(n: number): string {
  return (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
