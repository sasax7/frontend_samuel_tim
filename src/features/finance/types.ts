export type ISODate = `${number}-${number}-${number}`; // YYYY-MM-DD
export type YearMonth = `${number}-${number}`; // YYYY-MM

export type Money = {
  amount: number; // major units, e.g. 12.34
  currency: string; // e.g. EUR
};

export type FinanceCategory = {
  id: string;
  name: string;
  color?: string; // hex, optional
};

export type Expense = {
  id: string;
  date: ISODate;
  name: string;
  amount: Money;
  categoryId: string;
  notes?: string;
};

export type Income = {
  id: string;
  date: ISODate;
  name: string;
  amount: Money;
  notes?: string;
};

export type RecurringBill = {
  id: string;
  name: string;
  categoryId: string;
  dueDay: number; // 1-31
  startMonth: YearMonth; // bill exists starting this month (inclusive)
  amountHistory: Array<{
    effectiveMonth: YearMonth; // amount applies starting this month (inclusive)
    amount: Money;
  }>;
  active: boolean;
  notes?: string;
};

export type NetWorthAccountLine = {
  id: string;
  name: string; // e.g. 'Cash', 'Brokerage', 'Crypto'
  amount: Money;
};

export type NetWorthGroup = {
  id: string;
  name: string; // e.g. 'Liquid', 'Investment', 'Material'
  lines: NetWorthAccountLine[];
};

export type NetWorthSnapshotV1 = {
  id: string;
  month: YearMonth;
  // legacy flat structure
  lines: NetWorthAccountLine[];
  notes?: string;
};

export type NetWorthSnapshotV2 = {
  id: string;
  month: YearMonth;
  groups: NetWorthGroup[];
  notes?: string;
};

export type NetWorthSnapshot = NetWorthSnapshotV2 | NetWorthSnapshotV1;

export type FinanceDataV1 = {
  version: 1;
  currency: string;
  categories: FinanceCategory[];
  expenses: Expense[];
  incomes: Income[];
  recurringBills: RecurringBill[];
  netWorth: NetWorthSnapshot[];
};
