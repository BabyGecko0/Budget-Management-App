export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";
export type AccountType = "CASH" | "BANK" | "SAVINGS" | "CREDIT";
export type AuthProvider = "LOCAL" | "GOOGLE";

export interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
  currency: string;
}

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  currency: string;
  monthlyIncome: number | null;
  authProvider: AuthProvider;
  createdAt: string;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  color: string | null;
  icon: string | null;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface Transaction {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  note: string | null;
  recurringTransactionId: number | null;
  createdAt: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  total: number;
  percentage: number;
}

export interface Summary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  expenseByCategory: CategorySummary[];
  incomeByCategory: CategorySummary[];
}
