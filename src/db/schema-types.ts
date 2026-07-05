import type { ColumnType, Generated } from "kysely";

/**
 * Tipe tabel ditulis manual, mengikuti db/schema.sql (sumber otoritatif).
 * Kolom DECIMAL dibaca sebagai string oleh mysql2 (decimalNumbers: false)
 * agar tidak ada floating point error — parsing pakai decimal.js di aplikasi.
 */

export type WalletType =
  | "cash"
  | "bank"
  | "ewallet"
  | "credit_card"
  | "investment"
  | "other";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense";
export type DebtType = "payable" | "receivable";
export type DebtStatus = "open" | "partial" | "settled";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** DECIMAL: dibaca string, ditulis string/number. */
type Money = ColumnType<string, string | number, string | number>;
/** DATE: dibaca Date oleh mysql2, ditulis string 'YYYY-MM-DD'. */
type DateCol = ColumnType<Date, string, string>;
/** DATETIME dengan DEFAULT CURRENT_TIMESTAMP: tidak perlu diisi saat insert. */
type CreatedAt = ColumnType<Date, string | undefined, never>;
type UpdatedAt = ColumnType<Date, string | undefined, string | undefined>;

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  name: string;
  base_currency: string;
  created_at: CreatedAt;
  updated_at: UpdatedAt;
}

export interface CurrenciesTable {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRatesTable {
  id: Generated<number>;
  user_id: number;
  base_currency: string;
  quote_currency: string;
  rate: Money;
  rate_date: DateCol;
  created_at: CreatedAt;
}

export interface WalletsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: Money;
  color: string | null;
  icon: string | null;
  is_archived: ColumnType<number, number | undefined, number>;
  created_at: CreatedAt;
  updated_at: UpdatedAt;
}

export interface CategoriesTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  type: CategoryType;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
  created_at: CreatedAt;
}

export interface TransactionsTable {
  id: Generated<number>;
  user_id: number;
  wallet_id: number;
  category_id: number | null;
  type: TransactionType;
  amount: Money;
  currency: string;
  fx_rate_to_base: Money;
  note: string | null;
  transaction_date: DateCol;
  created_at: CreatedAt;
  updated_at: UpdatedAt;
}

export interface TransfersTable {
  id: Generated<number>;
  user_id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  from_amount: Money;
  to_amount: Money;
  fee: Money;
  note: string | null;
  transfer_date: DateCol;
  created_at: CreatedAt;
}

export interface BudgetsTable {
  id: Generated<number>;
  user_id: number;
  category_id: number | null;
  amount: Money;
  currency: string;
  period_month: string;
  created_at: CreatedAt;
}

export interface SavingsGoalsTable {
  id: Generated<number>;
  user_id: number;
  name: string;
  target_amount: Money;
  current_amount: Money;
  currency: string;
  wallet_id: number | null;
  target_date: DateCol | null;
  is_achieved: ColumnType<number, number | undefined, number>;
  created_at: CreatedAt;
}

export interface DebtsTable {
  id: Generated<number>;
  user_id: number;
  type: DebtType;
  counterparty: string;
  principal_amount: Money;
  currency: string;
  due_date: DateCol | null;
  status: ColumnType<DebtStatus, DebtStatus | undefined, DebtStatus>;
  note: string | null;
  created_at: CreatedAt;
}

export interface DebtPaymentsTable {
  id: Generated<number>;
  debt_id: number;
  user_id: number;
  amount: Money;
  wallet_id: number | null;
  payment_date: DateCol;
  note: string | null;
  created_at: CreatedAt;
}

export interface RecurringTransactionsTable {
  id: Generated<number>;
  user_id: number;
  wallet_id: number;
  category_id: number | null;
  type: TransactionType;
  amount: Money;
  currency: string;
  frequency: RecurringFrequency;
  interval_count: ColumnType<number, number | undefined, number>;
  next_run_date: DateCol;
  end_date: DateCol | null;
  note: string | null;
  is_active: ColumnType<number, number | undefined, number>;
  created_at: CreatedAt;
}

export interface Database {
  users: UsersTable;
  currencies: CurrenciesTable;
  exchange_rates: ExchangeRatesTable;
  wallets: WalletsTable;
  categories: CategoriesTable;
  transactions: TransactionsTable;
  transfers: TransfersTable;
  budgets: BudgetsTable;
  savings_goals: SavingsGoalsTable;
  debts: DebtsTable;
  debt_payments: DebtPaymentsTable;
  recurring_transactions: RecurringTransactionsTable;
}
